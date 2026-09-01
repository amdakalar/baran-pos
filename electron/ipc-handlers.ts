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

  ipcMain.handle('app:openExternal', (_event, url: string) => {
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
      return shell.openExternal(url);
    }
    return Promise.resolve();
  });
}
