import fs from 'fs';
import path from 'path';
import os from 'os';
import { app } from 'electron';
import { getHardwareFingerprint } from './encryption';
import { getCloudHeartbeat, saveCloudHeartbeat, getLicense, saveLicense, CloudHeartbeatRecord, getData, setData } from './database';
import { generateActivationKey, parseAndValidateKey, LICENSE_PLANS, LicensePlanCode } from './license';

// 48-Hour Offline Security Limits
export const OFFLINE_LIMIT_SECONDS = 48 * 3600; // 48 Hours = 172,800 seconds
export const OFFLINE_WARNING_SECONDS = 24 * 3600; // 24 Hours = 86,400 seconds

// Turso Cloud Database Configuration (libSQL over HTTP)
export interface TursoCloudConfig {
  databaseUrl: string;
  authToken: string;
  tableName: string;
}

export const DEFAULT_TURSO_CONFIG: TursoCloudConfig = {
  // Built-in Turso Database URL for Baran POS Licensing
  databaseUrl: 'https://baran-pos-db-ali.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSI...example_turso_jwt_auth_token_baran_secure',
  tableName: 'pos_licenses',
};

/**
 * Get effective Turso Cloud configuration.
 * Discovers config from:
 * 1. Encrypted SQLite database store (`turso_cloud_config`)
 * 2. `turso.config.json` in project directory
 * 3. `turso.config.json` on User Desktop
 * 4. `turso.config.json` in User Downloads
 * 5. `turso.config.json` in Electron userData directory
 * 6. Falls back to DEFAULT_TURSO_CONFIG
 */
export function getEffectiveTursoConfig(): TursoCloudConfig {
  // 1. Check SQLite store
  const storedConfig = getData<TursoCloudConfig | null>('turso_cloud_config', null);
  if (storedConfig && storedConfig.databaseUrl && storedConfig.authToken && !storedConfig.authToken.includes('example_')) {
    return storedConfig;
  }

  // 2. Check Candidate Files
  const candidatePaths = [
    path.join(process.cwd(), 'turso.config.json'),
    path.join(os.homedir(), 'Desktop', 'turso.config.json'),
    path.join(os.homedir(), 'Downloads', 'turso.config.json'),
  ];

  if (app) {
    try {
      candidatePaths.push(path.join(app.getPath('userData'), 'turso.config.json'));
    } catch {}
  }

  for (const filePath of candidatePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed.databaseUrl && parsed.authToken && !parsed.authToken.includes('example_')) {
          return {
            databaseUrl: parsed.databaseUrl,
            authToken: parsed.authToken,
            tableName: parsed.tableName || 'pos_licenses',
          };
        }
      } catch (e) {
        console.error(`Error reading config from ${filePath}:`, e);
      }
    }
  }

  return DEFAULT_TURSO_CONFIG;
}

/**
 * Save Turso configuration to local SQLite store and userData directory
 */
export function saveTursoConfig(config: TursoCloudConfig): void {
  setData('turso_cloud_config', config);
  if (app) {
    try {
      const configPath = path.join(app.getPath('userData'), 'turso.config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch {}
  }
}

export type CloudLicenseState = 
  | 'online_active' 
  | 'offline_ok' 
  | 'offline_warning' 
  | 'offline_locked' 
  | 'remote_suspended' 
  | 'unregistered';

export interface CloudStatusResult {
  isOnline: boolean;
  state: CloudLicenseState;
  hardwareId: string;
  planCode?: LicensePlanCode;
  planNameKu?: string;
  offlineSecondsElapsed: number;
  remainingSeconds: number; // Remaining time until 48h lock
  lastOnlineDate?: string;
  message: string;
  isLocked: boolean;
}

/**
 * Format arguments for Turso Pipeline API
 */
function formatTursoArg(val: unknown) {
  if (val === null || val === undefined) return { type: 'null' };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { type: 'integer', value: String(val) } : { type: 'float', value: val };
  }
  if (typeof val === 'boolean') {
    return { type: 'integer', value: val ? '1' : '0' };
  }
  return { type: 'text', value: String(val) };
}

/**
 * Execute a SQL query over Turso HTTP API (/v2/pipeline)
 */
export async function executeTursoQuery(
  sql: string,
  args: unknown[] = [],
  customConfig?: TursoCloudConfig
): Promise<Record<string, any>[]> {
  const config = customConfig || getEffectiveTursoConfig();
  let url = config.databaseUrl.trim();
  if (url.startsWith('libsql://')) {
    url = url.replace('libsql://', 'https://');
  }
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  const pipelineUrl = `${url}/v2/pipeline`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  const payload = {
    requests: [
      {
        type: 'execute',
        stmt: {
          sql,
          args: args.map(formatTursoArg),
        },
      },
      {
        type: 'close',
      },
    ],
  };

  try {
    const res = await fetch(pipelineUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Turso HTTP Error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as any;
    const result = data?.results?.[0]?.response?.result;
    if (!result || !result.cols || !result.rows) return [];

    const cols: string[] = result.cols.map((c: any) => c.name);
    return result.rows.map((row: any[]) => {
      const obj: Record<string, any> = {};
      cols.forEach((colName: string, idx: number) => {
        obj[colName] = row[idx]?.value ?? null;
      });
      return obj;
    });
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

/**
 * Format remaining seconds into human-readable Kurdish string
 * Example: "١٨ کاتژمێر و ٢٤ خولەک"
 */
export function formatRemainingTimeKu(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'کات بەسەرچووە';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours} کاتژمێر و ${minutes} خولەک`;
  } else if (hours > 0) {
    return `${hours} کاتژمێر`;
  } else {
    return `${minutes} خولەک`;
  }
}

/**
 * Evaluate current local Turso cloud / offline status without making a network request
 */
export function evaluateLocalCloudStatus(): CloudStatusResult {
  const hardwareId = getHardwareFingerprint();
  const heartbeat = getCloudHeartbeat();
  const currentSec = Math.floor(Date.now() / 1000);

  // If no heartbeat has ever been recorded, check if there's an existing active offline license
  if (!heartbeat) {
    const existingOfflineLicense = getLicense();
    if (existingOfflineLicense) {
      // First run with an offline key: initialize first heartbeat
      const initRecord: CloudHeartbeatRecord = {
        last_online_timestamp: currentSec,
        last_verified_status: 'active',
        last_sync_time: new Date().toISOString(),
      };
      saveCloudHeartbeat(initRecord);
      return {
        isOnline: false,
        state: 'offline_ok',
        hardwareId,
        offlineSecondsElapsed: 0,
        remainingSeconds: OFFLINE_LIMIT_SECONDS,
        message: 'دەستپێکی کارکردن. ٤٨ کاتژمێر کاتی ئۆفلاین بەردەستە.',
        isLocked: false,
      };
    }

    return {
      isOnline: false,
      state: 'unregistered',
      hardwareId,
      offlineSecondsElapsed: 0,
      remainingSeconds: 0,
      message: 'ئەم ئامێرە تۆمار نەکراوە.',
      isLocked: true,
    };
  }

  // Clock rollback detection
  if (currentSec < heartbeat.last_online_timestamp - 60) {
    return {
      isOnline: false,
      state: 'offline_locked',
      hardwareId,
      offlineSecondsElapsed: OFFLINE_LIMIT_SECONDS + 1,
      remainingSeconds: 0,
      message: 'دەستکاری کاتژمێری سیستەم کراوە! تکایە پەیوەندی بە ئینتەرنێتەوە بکە.',
      isLocked: true,
    };
  }

  // If remote status was suspended/revoked on last verification
  if (heartbeat.last_verified_status === 'suspended' || heartbeat.last_verified_status === 'revoked') {
    return {
      isOnline: false,
      state: 'remote_suspended',
      hardwareId,
      offlineSecondsElapsed: 0,
      remainingSeconds: 0,
      message: 'ئەم ئامێرە لەلایەن بەڕێوەبەرەوە لە کلاودی Turso ڕاگیراوە (Suspended).',
      isLocked: true,
    };
  }

  const elapsed = Math.max(0, currentSec - heartbeat.last_online_timestamp);
  const remaining = Math.max(0, OFFLINE_LIMIT_SECONDS - elapsed);
  const lastOnlineDate = new Date(heartbeat.last_online_timestamp * 1000).toLocaleString('en-GB');

  if (elapsed >= OFFLINE_LIMIT_SECONDS) {
    return {
      isOnline: false,
      state: 'offline_locked',
      hardwareId,
      offlineSecondsElapsed: elapsed,
      remainingSeconds: 0,
      lastOnlineDate,
      message: `سیستەم قفڵکراوە بەهۆی نەبوونی ئینتەرنێت بۆ زیاتر لە ٤٨ کاتژمێر. تکایە ئامێرەکە بە ئینتەرنێتەوە ببەستەوە بۆ کرانەوە.`,
      isLocked: true,
    };
  }

  if (elapsed >= OFFLINE_WARNING_SECONDS) {
    const formattedRemaining = formatRemainingTimeKu(remaining);
    return {
      isOnline: false,
      state: 'offline_warning',
      hardwareId,
      offlineSecondsElapsed: elapsed,
      remainingSeconds: remaining,
      lastOnlineDate,
      message: `ئاگاداری: ماوەی ئۆفلاین (${formattedRemaining}) ماوە پێش قفڵبوونی سیستەم بۆ پاراستنی مافی خاوەنداریەتی.`,
      isLocked: false,
    };
  }

  return {
    isOnline: false,
    state: 'offline_ok',
    hardwareId,
    offlineSecondsElapsed: elapsed,
    remainingSeconds: remaining,
    lastOnlineDate,
    message: 'سیستەم لە دۆخی ئۆفلاین کار دەکات.',
    isLocked: false,
  };
}

/**
 * Perform a live Cloud Heartbeat handshake against Turso Database
 */
export async function syncCloudHeartbeat(
  clientInfo?: { shopName?: string; customerName?: string; phone?: string }
): Promise<CloudStatusResult> {
  const hardwareId = getHardwareFingerprint();
  const currentSec = Math.floor(Date.now() / 1000);
  const nowIso = new Date().toISOString();
  const cfg = getEffectiveTursoConfig();

  try {
    // 0. Ensure table exists in Turso
    try {
      await executeTursoQuery(
        `CREATE TABLE IF NOT EXISTS ${cfg.tableName} (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          hardware_id TEXT UNIQUE NOT NULL,
          shop_name TEXT NOT NULL DEFAULT 'پەراوگەى باران',
          customer_name TEXT DEFAULT '',
          phone TEXT DEFAULT '',
          plan_code TEXT NOT NULL DEFAULT 'LFT',
          status TEXT NOT NULL DEFAULT 'active',
          activated_at TEXT DEFAULT (datetime('now')),
          last_heartbeat_at TEXT DEFAULT (datetime('now'))
        )`
      );
    } catch {}

    // 1. Check if device exists in Turso
    const rows = await executeTursoQuery(
      `SELECT hardware_id, shop_name, customer_name, phone, plan_code, status, last_heartbeat_at FROM ${cfg.tableName} WHERE hardware_id = ? LIMIT 1`,
      [hardwareId]
    );

    if (rows && rows.length > 0) {
      const record = rows[0];

      // If remote status is suspended
      if (record.status === 'suspended' || record.status === 'revoked') {
        saveCloudHeartbeat({
          last_online_timestamp: currentSec,
          last_verified_status: record.status,
          last_plan_code: record.plan_code,
          last_sync_time: nowIso,
        });

        return {
          isOnline: true,
          state: 'remote_suspended',
          hardwareId,
          planCode: record.plan_code,
          offlineSecondsElapsed: 0,
          remainingSeconds: 0,
          message: 'ئەم ئامێرە لەلایەن بەڕێوەبەری سیستەمەوە لە Turso ڕاگیراوە (Suspended).',
          isLocked: true,
        };
      }

      // Record is active in Turso!
      // Update last_heartbeat_at in Turso
      try {
        await executeTursoQuery(
          `UPDATE ${cfg.tableName} SET last_heartbeat_at = datetime('now'), shop_name = COALESCE(NULLIF(?, ''), shop_name), customer_name = COALESCE(NULLIF(?, ''), customer_name), phone = COALESCE(NULLIF(?, ''), phone) WHERE hardware_id = ?`,
          [
            clientInfo?.shopName || null,
            clientInfo?.customerName || null,
            clientInfo?.phone || null,
            hardwareId,
          ]
        );
      } catch {
        // Non-blocking update failure
      }

      // Synchronize local license if Turso has an updated plan
      if (record.plan_code) {
        const planCode = record.plan_code as LicensePlanCode;
        const currentOfflineLicense = getLicense();
        const offlineVal = currentOfflineLicense ? parseAndValidateKey(currentOfflineLicense.activation_key, hardwareId) : null;

        if (!offlineVal?.valid || offlineVal.planCode !== planCode) {
          // Generate & update local offline key matching the Turso plan
          const newKey = generateActivationKey(hardwareId, planCode);
          saveLicense(newKey, hardwareId);
        }
      }

      // Save updated heartbeat locally
      saveCloudHeartbeat({
        last_online_timestamp: currentSec,
        last_verified_status: 'active',
        last_plan_code: record.plan_code,
        last_sync_time: nowIso,
      });

      const planCode = (record.plan_code || 'LFT') as LicensePlanCode;
      const planInfo = LICENSE_PLANS[planCode] || LICENSE_PLANS.LFT;

      return {
        isOnline: true,
        state: 'online_active',
        hardwareId,
        planCode,
        planNameKu: planInfo.nameKu,
        offlineSecondsElapsed: 0,
        remainingSeconds: OFFLINE_LIMIT_SECONDS,
        lastOnlineDate: new Date().toLocaleString('en-GB'),
        message: `پەیوەستە بە کلاودی Turso • پلانی چالاک: ${planInfo.nameKu}`,
        isLocked: false,
      };

    } else {
      // Device not found in Turso -> It was DELETED by admin, or is not yet registered in Cloud!
      // Invalidate local active license so that deleting from cloud console truly de-activates the POS client.
      saveLicense('', '');

      saveCloudHeartbeat({
        last_online_timestamp: currentSec,
        last_verified_status: 'unregistered',
        last_plan_code: undefined,
        last_sync_time: nowIso,
      });

      return {
        isOnline: true,
        state: 'unregistered',
        hardwareId,
        offlineSecondsElapsed: 0,
        remainingSeconds: 0,
        lastOnlineDate: new Date().toLocaleString('en-GB'),
        message: 'ئەم ئامێرە لەلایەن بەڕێوەبەرەوە لە کلاودی Turso سڕاوەتەوە. تکایە بۆ چالاککردنەوە پەیوەندی بە بەڕێوەبەر بکە.',
        isLocked: true,
      };
    }
  } catch {
    // Network is unreachable / offline: fallback to local 48-hour offline calculation
    return evaluateLocalCloudStatus();
  }
}
