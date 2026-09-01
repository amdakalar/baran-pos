import { app, ipcMain, shell } from 'electron';
import { getData, setData, deleteData, clearAllData, getAllKeys } from './database';
import { checkLicense, activateLicense, generateHardwareId } from './license';
import { evaluateLocalCloudStatus, syncCloudHeartbeat, getEffectiveTursoConfig, saveTursoConfig, TursoCloudConfig } from './cloud-license';
import { createCloudBackup, listCloudBackups, restoreCloudBackup, getLastCloudBackupInfo } from './cloud-backup';

export function registerIpcHandlers(): void {
  // ---- Database Operations ----
  ipcMain.handle('db:get', (_event, key: string, fallback: unknown) => {
    return getData(key, fallback);
  });

  ipcMain.handle('db:set', (_event, key: string, value: unknown) => {
    setData(key, value);
    return true;
  });

  ipcMain.handle('db:delete', (_event, key: string) => {
    deleteData(key);
    return true;
  });

  ipcMain.handle('db:clearAll', () => {
    clearAllData();
    return true;
  });

  ipcMain.handle('db:getAllKeys', () => {
    return getAllKeys();
  });

  // ---- Batch Operations ----
  ipcMain.handle('db:batchSet', (_event, entries: { key: string; value: unknown }[]) => {
    for (const entry of entries) {
      setData(entry.key, entry.value);
    }
    return true;
  });

  ipcMain.handle('db:getMultiple', (_event, keys: { key: string; fallback: unknown }[]) => {
    const result: Record<string, unknown> = {};
    for (const { key, fallback } of keys) {
      result[key] = getData(key, fallback);
    }
    return result;
  });

  // ---- License Operations ----
  ipcMain.handle('license:check', () => {
    return checkLicense();
  });

  ipcMain.handle('license:activate', (_event, activationKey: string) => {
    return activateLicense(activationKey);
  });

  ipcMain.handle('license:getHardwareId', () => {
    return generateHardwareId();
  });

  // ---- Cloud Remote License & 48h Heartbeat Operations ----
  ipcMain.handle('cloudLicense:getStatus', () => {
    return evaluateLocalCloudStatus();
  });

  ipcMain.handle('cloudLicense:sync', (_event, clientInfo?: { shopName?: string; customerName?: string; phone?: string }) => {
    return syncCloudHeartbeat(clientInfo);
  });

  ipcMain.handle('cloudLicense:getConfig', () => {
    return getEffectiveTursoConfig();
  });

  ipcMain.handle('cloudLicense:saveConfig', (_event, config: TursoCloudConfig) => {
    saveTursoConfig(config);
    return true;
  });

  // ---- Cloud Zero-Lag Backup & Restore Operations ----
  ipcMain.handle('cloudBackup:create', (_event, backupType?: 'auto' | 'manual' | 'shift_close', shopName?: string) => {
    return createCloudBackup(backupType, shopName);
  });

  ipcMain.handle('cloudBackup:list', () => {
    return listCloudBackups();
  });

  ipcMain.handle('cloudBackup:restore', (_event, backupId: string) => {
    return restoreCloudBackup(backupId);
  });

  ipcMain.handle('cloudBackup:getLastStatus', () => {
    return getLastCloudBackupInfo();
  });

  // ---- App & External Link Operations ----
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });

  ipcMain.handle('app:checkUpdate', () => {
    return checkAppUpdates();
  });

  ipcMain.handle('app:openExternal', (_event, url: string) => {
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
      return shell.openExternal(url);
    }
    return Promise.resolve();
  });
}

function parseSemver(v: string): number[] {
  const clean = (v || '').replace(/^v/, '').trim().split(/[-+]/)[0];
  const parts = clean.split('.').map((p) => parseInt(p, 10) || 0);
  while (parts.length < 3) parts.push(0);
  return parts;
}

function isSemverGreater(remote: string, current: string): boolean {
  const r = parseSemver(remote);
  const c = parseSemver(current);
  for (let i = 0; i < 3; i++) {
    if ((r[i] || 0) > (c[i] || 0)) return true;
    if ((r[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

async function checkAppUpdates(): Promise<{
  hasUpdate: boolean;
  latestVersion: string;
  title: string;
  releaseNotes: string;
  downloadUrl: string;
} | null> {
  const currentVersion = app ? app.getVersion() : '1.0.0';

  // 1. Try Turso Cloud DB first (100% reliable, works even when GitHub repo is private)
  try {
    const cfg = getEffectiveTursoConfig();
    if (cfg && cfg.databaseUrl && cfg.authToken) {
      const httpUrl = cfg.databaseUrl.replace(/^libsql:\/\//, 'https://');
      const res = await fetch(`${httpUrl}/v2/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              type: 'execute',
              stmt: {
                sql: `SELECT version, title, download_url, release_notes FROM app_version_meta WHERE key = 'latest_release' LIMIT 1;`,
              },
            },
            { type: 'close' },
          ],
        }),
      });

      if (res.ok) {
        const json: any = await res.json();
        const rows = json.results?.[0]?.response?.result?.rows;
        if (rows && rows.length > 0) {
          const row = rows[0];
          const ver = String(row[0]?.value || '');
          const title = String(row[1]?.value || `وەشانی نوێ v${ver}`);
          const downloadUrl = String(row[2]?.value || 'https://github.com/amdakalar/baran-pos/releases/latest');
          const releaseNotes = String(row[3]?.value || '');

          if (ver && isSemverGreater(ver, currentVersion)) {
            return {
              hasUpdate: true,
              latestVersion: ver,
              title,
              releaseNotes,
              downloadUrl,
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('[UpdateCheck] Turso cloud check error:', err);
  }

  // 2. Try GitHub Releases API
  try {
    const res = await fetch('https://api.github.com/repos/amdakalar/baran-pos/releases/latest', {
      headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'Baran-POS-App' },
    });
    if (res.ok) {
      const data: any = await res.json();
      const tag = (data.tag_name || '').replace(/^v/, '').trim();
      if (tag && isSemverGreater(tag, currentVersion)) {
        const asset = data.assets?.find((a: any) => a.name.endsWith('.exe')) || data.assets?.[0];
        const downloadUrl = asset?.browser_download_url || data.html_url || 'https://github.com/amdakalar/baran-pos/releases/latest';
        return {
          hasUpdate: true,
          latestVersion: tag,
          title: data.name || `وەشانی نوێ v${tag}`,
          releaseNotes: data.body || '',
          downloadUrl,
        };
      }
    }
  } catch (err) {
    console.warn('[UpdateCheck] GitHub releases check error:', err);
  }

  return null;
}

