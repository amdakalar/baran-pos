import zlib from 'zlib';
import { app } from 'electron';
import { getHardwareFingerprint, deriveEncryptionKey, encrypt, decrypt } from './encryption';
import { getAllDataSnapshot, restoreAllDataSnapshot, getData, setData } from './database';
import { executeTursoQuery, getEffectiveTursoConfig } from './cloud-license';

export interface CloudBackupMetadata {
  id: string;
  hardware_id: string;
  shop_name: string;
  backup_type: 'auto' | 'manual' | 'shift_close';
  backup_size_kb: number;
  item_count: number;
  invoice_count: number;
  created_at: string;
  app_version: string;
}

export interface CloudBackupResult {
  success: boolean;
  message: string;
  backup?: CloudBackupMetadata;
}

let isTableInitialized = false;

/**
 * Ensure `pos_cloud_backups` table exists on Turso
 */
export async function ensureCloudBackupTable(): Promise<void> {
  if (isTableInitialized) return;
  try {
    const ddl = `
      CREATE TABLE IF NOT EXISTS pos_cloud_backups (
        id TEXT PRIMARY KEY,
        hardware_id TEXT NOT NULL,
        shop_name TEXT,
        backup_type TEXT DEFAULT 'auto',
        backup_data TEXT NOT NULL,
        backup_size_kb REAL,
        item_count INTEGER,
        invoice_count INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        app_version TEXT
      )
    `;
    await executeTursoQuery(ddl);
    isTableInitialized = true;
  } catch (e) {
    console.error('Failed to initialize pos_cloud_backups table:', e);
  }
}

/**
 * Create a compressed, encrypted Cloud Backup on Turso
 */
export async function createCloudBackup(
  backupType: 'auto' | 'manual' | 'shift_close' = 'auto',
  customShopName?: string
): Promise<CloudBackupResult> {
  try {
    const hardwareId = getHardwareFingerprint();
    const encryptionKey = deriveEncryptionKey(hardwareId);
    const appVersion = app ? app.getVersion() : '1.0.4';

    // 1. Get raw snapshot of all store items
    const storeSnapshot = getAllDataSnapshot();
    if (!storeSnapshot || Object.keys(storeSnapshot).length === 0) {
      return { success: false, message: 'هیچ داتایەک بۆ پاشەکەوتکردن بوونی نییە.' };
    }

    // Determine shop name
    let shopName = customShopName;
    if (!shopName && storeSnapshot['baran_pos_system_config']) {
      try {
        const conf = JSON.parse(storeSnapshot['baran_pos_system_config']);
        shopName = conf.shopNameKu || conf.shopNameEn;
      } catch {}
    }
    shopName = shopName || 'Baran POS Station';

    // Count products & invoices for metadata
    let itemCount = 0;
    let invoiceCount = 0;
    try {
      if (storeSnapshot['baran_pos_products']) {
        const prods = JSON.parse(storeSnapshot['baran_pos_products']);
        if (Array.isArray(prods)) itemCount = prods.length;
      }
      if (storeSnapshot['baran_pos_invoices']) {
        const invs = JSON.parse(storeSnapshot['baran_pos_invoices']);
        if (Array.isArray(invs)) invoiceCount = invs.length;
      }
    } catch {}

    // 2. Serialize and Compress with GZIP
    const jsonString = JSON.stringify(storeSnapshot);
    const uncompressedBuffer = Buffer.from(jsonString, 'utf-8');
    const compressedBuffer = zlib.gzipSync(uncompressedBuffer, { level: 9 });

    // 3. Encrypt Compressed Buffer with Hardware Key
    const encryptedBuffer = encrypt(compressedBuffer.toString('base64'), encryptionKey);
    const backupDataPayload = encryptedBuffer.toString('base64');
    const backupSizeKb = parseFloat(((backupDataPayload.length * 0.75) / 1024).toFixed(2));

    const backupId = `bk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    // 4. Ensure Turso Table Exists
    await ensureCloudBackupTable();

    // 5. Insert into Turso pos_cloud_backups
    const insertSql = `
      INSERT INTO pos_cloud_backups (
        id, hardware_id, shop_name, backup_type, backup_data, backup_size_kb, item_count, invoice_count, created_at, app_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
    `;

    await executeTursoQuery(insertSql, [
      backupId,
      hardwareId,
      shopName,
      backupType,
      backupDataPayload,
      backupSizeKb,
      itemCount,
      invoiceCount,
      appVersion,
    ]);

    // 6. Auto-Prune: Keep latest 10 backups per hardware ID to save cloud space
    try {
      const pruneSql = `
        DELETE FROM pos_cloud_backups 
        WHERE hardware_id = ? 
        AND id NOT IN (
          SELECT id FROM pos_cloud_backups WHERE hardware_id = ? ORDER BY created_at DESC LIMIT 10
        )
      `;
      await executeTursoQuery(pruneSql, [hardwareId, hardwareId]);
    } catch (e) {
      console.warn('Backup pruning notice:', e);
    }

    const metadata: CloudBackupMetadata = {
      id: backupId,
      hardware_id: hardwareId,
      shop_name: shopName,
      backup_type: backupType,
      backup_size_kb: backupSizeKb,
      item_count: itemCount,
      invoice_count: invoiceCount,
      created_at: nowIso,
      app_version: appVersion,
    };

    // Save last backup timestamp locally
    setData('last_cloud_backup_time', nowIso);
    setData('last_cloud_backup_meta', metadata);

    return {
      success: true,
      message: 'پاشەکەوتی کڵاود بە سەرکەوتوویی لە سێرڤەر تۆمار کرا.',
      backup: metadata,
    };
  } catch (err: any) {
    console.error('Error creating cloud backup:', err);
    return {
      success: false,
      message: `هەڵە لە دروستکردنی باکئەپی کڵاود: ${err?.message || err}`,
    };
  }
}

/**
 * List recent Cloud Backups from Turso
 */
export async function listCloudBackups(): Promise<CloudBackupMetadata[]> {
  try {
    const hardwareId = getHardwareFingerprint();
    await ensureCloudBackupTable();

    const sql = `
      SELECT id, hardware_id, shop_name, backup_type, backup_size_kb, item_count, invoice_count, created_at, app_version
      FROM pos_cloud_backups
      WHERE hardware_id = ?
      ORDER BY created_at DESC
      LIMIT 15
    `;

    const rows = await executeTursoQuery(sql, [hardwareId]);
    return rows.map((r) => ({
      id: String(r.id),
      hardware_id: String(r.hardware_id),
      shop_name: String(r.shop_name || 'Baran POS'),
      backup_type: (r.backup_type as any) || 'auto',
      backup_size_kb: parseFloat(r.backup_size_kb) || 0,
      item_count: parseInt(r.item_count) || 0,
      invoice_count: parseInt(r.invoice_count) || 0,
      created_at: String(r.created_at || ''),
      app_version: String(r.app_version || '1.0.4'),
    }));
  } catch (err) {
    console.error('Failed to list cloud backups:', err);
    return [];
  }
}

/**
 * Restore database state from a Cloud Backup on Turso
 */
export async function restoreCloudBackup(backupId: string): Promise<{ success: boolean; message: string }> {
  try {
    const hardwareId = getHardwareFingerprint();
    const encryptionKey = deriveEncryptionKey(hardwareId);

    const sql = `SELECT backup_data FROM pos_cloud_backups WHERE id = ? AND hardware_id = ? LIMIT 1`;
    const rows = await executeTursoQuery(sql, [backupId, hardwareId]);

    if (!rows || rows.length === 0 || !rows[0].backup_data) {
      return { success: false, message: 'فایلی باکئەپ لە کڵاود نەدۆزرایەوە.' };
    }

    const encryptedBase64 = String(rows[0].backup_data);
    const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');

    // 1. Decrypt
    const compressedBase64 = decrypt(encryptedBuffer, encryptionKey);
    const compressedBuffer = Buffer.from(compressedBase64, 'base64');

    // 2. Decompress with GZIP
    const uncompressedBuffer = zlib.gunzipSync(compressedBuffer);
    const jsonString = uncompressedBuffer.toString('utf-8');

    // 3. Parse Snapshot
    const storeRecord = JSON.parse(jsonString) as Record<string, string>;

    if (!storeRecord || typeof storeRecord !== 'object') {
      return { success: false, message: 'فایلی باکئەپ تێکچووە و ناتوانرێت بگەڕێندرێتەوە.' };
    }

    // 4. Restore into local database
    restoreAllDataSnapshot(storeRecord);

    return {
      success: true,
      message: 'سەرجەم داتاکان بە سەرکەوتوویی لە کڵاودەوە گەڕێنرانەوە.',
    };
  } catch (err: any) {
    console.error('Failed to restore cloud backup:', err);
    return {
      success: false,
      message: `هەڵە لە گەڕاندنەوەی باکئەپ: ${err?.message || err}`,
    };
  }
}

/**
 * Get last cloud backup timestamp and metadata
 */
export function getLastCloudBackupInfo(): { lastTime: string | null; meta: CloudBackupMetadata | null } {
  const lastTime = getData<string | null>('last_cloud_backup_time', null);
  const meta = getData<CloudBackupMetadata | null>('last_cloud_backup_meta', null);
  return { lastTime, meta };
}
