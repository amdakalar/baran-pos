import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // Database operations
  db: {
    get: <T>(key: string, fallback: T): Promise<T> =>
      ipcRenderer.invoke('db:get', key, fallback),
    set: (key: string, value: unknown): Promise<boolean> =>
      ipcRenderer.invoke('db:set', key, value),
    delete: (key: string): Promise<boolean> =>
      ipcRenderer.invoke('db:delete', key),
    clearAll: (): Promise<boolean> =>
      ipcRenderer.invoke('db:clearAll'),
    getAllKeys: (): Promise<string[]> =>
      ipcRenderer.invoke('db:getAllKeys'),
    batchSet: (entries: { key: string; value: unknown }[]): Promise<boolean> =>
      ipcRenderer.invoke('db:batchSet', entries),
    getMultiple: (keys: { key: string; fallback: unknown }[]): Promise<Record<string, unknown>> =>
      ipcRenderer.invoke('db:getMultiple', keys),
  },

  // License operations
  license: {
    check: (): Promise<any> =>
      ipcRenderer.invoke('license:check'),
    activate: (key: string): Promise<any> =>
      ipcRenderer.invoke('license:activate', key),
    getHardwareId: (): Promise<string> =>
      ipcRenderer.invoke('license:getHardwareId'),
  },

  // Cloud License & 48h Security Heartbeat
  cloudLicense: {
    getStatus: (): Promise<any> =>
      ipcRenderer.invoke('cloudLicense:getStatus'),
    sync: (clientInfo?: { shopName?: string; customerName?: string; phone?: string }): Promise<any> =>
      ipcRenderer.invoke('cloudLicense:sync', clientInfo),
    getConfig: (): Promise<any> =>
      ipcRenderer.invoke('cloudLicense:getConfig'),
    saveConfig: (config: any): Promise<boolean> =>
      ipcRenderer.invoke('cloudLicense:saveConfig', config),
  },

  // Cloud Zero-Lag Auto-Backup & Restore
  cloudBackup: {
    create: (backupType?: 'auto' | 'manual' | 'shift_close', shopName?: string): Promise<{ success: boolean; message: string; backup?: any }> =>
      ipcRenderer.invoke('cloudBackup:create', backupType, shopName),
    list: (): Promise<any[]> =>
      ipcRenderer.invoke('cloudBackup:list'),
    restore: (backupId: string): Promise<{ success: boolean; message: string }> =>
      ipcRenderer.invoke('cloudBackup:restore', backupId),
    getLastStatus: (): Promise<{ lastTime: string | null; meta: any | null }> =>
      ipcRenderer.invoke('cloudBackup:getLastStatus'),
  },

  // App & External Link Operations
  app: {
    getVersion: (): Promise<string> =>
      ipcRenderer.invoke('app:getVersion'),
    checkUpdate: (): Promise<any> =>
      ipcRenderer.invoke('app:checkUpdate'),
    downloadAndInstallUpdate: (url: string): Promise<{ success: boolean; message: string }> =>
      ipcRenderer.invoke('app:downloadAndInstallUpdate', url),
    onDownloadProgress: (callback: (data: { percent: number; transferredMB: number; totalMB: number; speedMB: string }) => void) => {
      const listener = (_: any, data: any) => callback(data);
      ipcRenderer.on('app:downloadProgress', listener);
      return () => ipcRenderer.removeListener('app:downloadProgress', listener);
    },
    onDownloadCompleted: (callback: (data: { tempFilePath: string }) => void) => {
      const listener = (_: any, data: any) => callback(data);
      ipcRenderer.on('app:downloadCompleted', listener);
      return () => ipcRenderer.removeListener('app:downloadCompleted', listener);
    },
    openExternal: (url: string): Promise<void> =>
      ipcRenderer.invoke('app:openExternal', url),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
