export type LicensePlanCode = 'T07' | 'M03' | 'M06' | 'Y01' | 'LFT';

export interface LicenseStatus {
  valid: boolean;
  hardwareId: string;
  planCode?: LicensePlanCode;
  planNameKu?: string;
  planNameEn?: string;
  expiresAt?: string;
  daysRemaining?: number;
  isLifetime?: boolean;
  message: string;
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
  remainingSeconds: number;
  lastOnlineDate?: string;
  message: string;
  isLocked: boolean;
}

export interface ElectronDBAPI {
  get: <T>(key: string, fallback: T) => Promise<T>;
  set: (key: string, value: unknown) => Promise<boolean>;
  delete: (key: string) => Promise<boolean>;
  clearAll: () => Promise<boolean>;
  getAllKeys: () => Promise<string[]>;
  batchSet: (entries: { key: string; value: unknown }[]) => Promise<boolean>;
  getMultiple: (keys: { key: string; fallback: unknown }[]) => Promise<Record<string, unknown>>;
}

export interface ElectronLicenseAPI {
  check: () => Promise<LicenseStatus>;
  activate: (key: string) => Promise<{ success: boolean; message: string; licenseStatus?: LicenseStatus }>;
  getHardwareId: () => Promise<string>;
}

export interface CloudBackupItem {
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

export interface ElectronCloudBackupAPI {
  create: (backupType?: 'auto' | 'manual' | 'shift_close', shopName?: string) => Promise<{ success: boolean; message: string; backup?: CloudBackupItem }>;
  list: () => Promise<CloudBackupItem[]>;
  restore: (backupId: string) => Promise<{ success: boolean; message: string }>;
  getLastStatus: () => Promise<{ lastTime: string | null; meta: CloudBackupItem | null }>;
}

export interface ElectronAppAPI {
  getVersion: () => Promise<string>;
  openExternal: (url: string) => Promise<void>;
}

export interface ElectronAPI {
  db: ElectronDBAPI;
  license: ElectronLicenseAPI;
  cloudLicense: ElectronCloudLicenseAPI;
  cloudBackup: ElectronCloudBackupAPI;
  app?: ElectronAppAPI;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
