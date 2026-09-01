import crypto from 'crypto';
import os from 'os';
import { execSync } from 'child_process';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT = 'baran-pos-v1-salt';
const ITERATIONS = 100000;

export function getHardwareFingerprint(): string {
  const components: string[] = [];

  // CPU info
  const cpus = os.cpus();
  if (cpus.length > 0) {
    components.push(cpus[0].model);
  }

  // OS hostname + platform + arch
  components.push(os.hostname());
  components.push(os.platform());
  components.push(os.arch());

  // Try to get more hardware-specific info on Windows
  try {
    if (os.platform() === 'win32') {
      const biosSerial = execSync('wmic bios get serialnumber', { encoding: 'utf-8', timeout: 5000 })
        .split('\n').map(l => l.trim()).filter(l => l && l !== 'SerialNumber')[0] || '';
      components.push(biosSerial);

      const diskSerial = execSync('wmic diskdrive get serialnumber', { encoding: 'utf-8', timeout: 5000 })
        .split('\n').map(l => l.trim()).filter(l => l && l !== 'SerialNumber')[0] || '';
      components.push(diskSerial);

      const uuid = execSync('wmic csproduct get uuid', { encoding: 'utf-8', timeout: 5000 })
        .split('\n').map(l => l.trim()).filter(l => l && l !== 'UUID')[0] || '';
      components.push(uuid);
    }
  } catch {
    // Fallback: use total memory as additional entropy
    components.push(String(os.totalmem()));
  }

  // Network interfaces (first non-internal MAC)
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    const ifaces = nets[name];
    if (ifaces) {
      for (const iface of ifaces) {
        if (!iface.internal && iface.mac !== '00:00:00:00:00:00') {
          components.push(iface.mac);
          break;
        }
      }
    }
  }

  const fingerprint = components.filter(Boolean).join('|');
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

export function deriveEncryptionKey(fingerprint?: string): Buffer {
  const fp = fingerprint || getHardwareFingerprint();
  return crypto.pbkdf2Sync(fp, SALT, ITERATIONS, KEY_LENGTH, 'sha512');
}

export function encrypt(data: string, key: Buffer): Buffer {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: [IV (16 bytes)] [Auth Tag (16 bytes)] [Encrypted Data]
  return Buffer.concat([iv, authTag, encrypted]);
}

export function decrypt(encryptedData: Buffer, key: Buffer): string {
  const iv = encryptedData.subarray(0, IV_LENGTH);
  const authTag = encryptedData.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const data = encryptedData.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return decipher.update(data) + decipher.final('utf8');
}
