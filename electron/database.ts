import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { deriveEncryptionKey, encrypt, decrypt } from './encryption';

export interface CloudHeartbeatRecord {
  last_online_timestamp: number; // Unix timestamp in seconds
  last_verified_status: 'active' | 'suspended' | 'expired' | 'revoked' | 'unregistered';
  last_plan_code?: string;
  last_sync_time?: string;
  signature?: string;
}

interface StorageState {
  store: Record<string, string>; // key -> JSON string (or sub-encrypted)
  license: {
    activation_key: string;
    hardware_id: string;
    activated_at: string;
  } | null;
  cloudHeartbeat?: CloudHeartbeatRecord | null;
}

let dbFilePath = '';
let encryptionKey: Buffer | null = null;
let state: StorageState = {
  store: {},
  license: null,
  cloudHeartbeat: null,
};
let saveTimer: NodeJS.Timeout | null = null;

function saveToDiskSync(): void {
  if (!dbFilePath || !encryptionKey) return;
  try {
    const rawJson = JSON.stringify(state);
    const encrypted = encrypt(rawJson, encryptionKey);
    const tempPath = `${dbFilePath}.tmp`;
    fs.writeFileSync(tempPath, encrypted);
    fs.renameSync(tempPath, dbFilePath);
  } catch (e) {
    console.error('Failed to save encrypted database to disk:', e);
  }
}

function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveToDiskSync();
    saveTimer = null;
  }, 100);
}

export function initDatabase(): void {
  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  dbFilePath = path.join(userDataPath, 'baran.enc');
  encryptionKey = deriveEncryptionKey();

  if (fs.existsSync(dbFilePath)) {
    try {
      const encryptedBuffer = fs.readFileSync(dbFilePath);
      const decryptedJson = decrypt(encryptedBuffer, encryptionKey);
      const loaded = JSON.parse(decryptedJson) as StorageState;
      state = {
        store: loaded.store || {},
        license: loaded.license || null,
      };
    } catch (e) {
      console.warn('Could not decrypt existing storage (machine key mismatch or new installation). Initializing clean storage.', e);
      state = {
        store: {},
        license: null,
      };
      saveToDiskSync();
    }
  } else {
    state = {
      store: {},
      license: null,
    };
    saveToDiskSync();
  }
}

export function getData<T>(key: string, fallback: T): T {
  if (!state.store || !(key in state.store)) return fallback;
  try {
    const raw = state.store[key];
    if (raw === undefined || raw === null) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback) && Array.isArray(parsed)) {
      return parsed.length > 0 ? (parsed as T) : fallback;
    }
    return parsed as T;
  } catch (e) {
    console.error(`Failed to parse data for key '${key}':`, e);
    return fallback;
  }
}

export function setData(key: string, value: unknown): void {
  try {
    state.store[key] = JSON.stringify(value);
    scheduleSave();
  } catch (e) {
    console.error(`Failed to set data for key '${key}':`, e);
  }
}

export function deleteData(key: string): void {
  if (key in state.store) {
    delete state.store[key];
    scheduleSave();
  }
}

export function clearAllData(): void {
  state.store = {};
  scheduleSave();
}

export function getAllKeys(): string[] {
  return Object.keys(state.store);
}

export function saveLicense(activationKey: string, hardwareId: string): void {
  state.license = {
    activation_key: activationKey,
    hardware_id: hardwareId,
    activated_at: new Date().toISOString(),
  };
  saveToDiskSync();
}

export function getLicense(): { activation_key: string; hardware_id: string } | null {
  return state.license;
}

export function saveCloudHeartbeat(record: CloudHeartbeatRecord): void {
  state.cloudHeartbeat = record;
  saveToDiskSync();
}

export function getCloudHeartbeat(): CloudHeartbeatRecord | null {
  return state.cloudHeartbeat || null;
}

export function getAllDataSnapshot(): Record<string, string> {
  return { ...state.store };
}

export function restoreAllDataSnapshot(storeRecord: Record<string, string>): void {
  if (storeRecord && typeof storeRecord === 'object') {
    state.store = { ...storeRecord };
    saveToDiskSync();
  }
}

export function closeDatabase(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  saveToDiskSync();
}
