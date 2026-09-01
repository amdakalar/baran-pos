import crypto from 'crypto';
import { getHardwareFingerprint } from './encryption';
import { getLicense, saveLicense, getData, setData } from './database';

const LICENSE_SECRET = 'baran-pos-license-secret-2026-kak-ali-muhammad';
const LICENSE_PREFIX = 'BARAN';

export type LicensePlanCode = 'T07' | 'M03' | 'M06' | 'Y01' | 'LFT';

export interface LicensePlanInfo {
  code: LicensePlanCode;
  nameKu: string;
  nameEn: string;
  durationDays: number; // 0 for lifetime
  priceIqd: number;
}

export const LICENSE_PLANS: Record<LicensePlanCode, LicensePlanInfo> = {
  T07: {
    code: 'T07',
    nameKu: '٧ ڕۆژ (تاقیکردنەوە)',
    nameEn: '7 Days Trial',
    durationDays: 7,
    priceIqd: 0,
  },
  M03: {
    code: 'M03',
    nameKu: '٣ مانگ',
    nameEn: '3 Months',
    durationDays: 90,
    priceIqd: 100000,
  },
  M06: {
    code: 'M06',
    nameKu: '٦ مانگ',
    nameEn: '6 Months',
    durationDays: 180,
    priceIqd: 150000,
  },
  Y01: {
    code: 'Y01',
    nameKu: '١ ساڵ',
    nameEn: '1 Year',
    durationDays: 365,
    priceIqd: 290000,
  },
  LFT: {
    code: 'LFT',
    nameKu: 'هەتاهەتایی (بێ کۆتا)',
    nameEn: 'Lifetime',
    durationDays: 0,
    priceIqd: 450000,
  },
};

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

export function generateHardwareId(): string {
  return getHardwareFingerprint();
}

/**
 * Generate activation key with plan and expiration.
 */
export function generateActivationKey(
  hardwareId: string,
  planCode: LicensePlanCode = 'LFT',
  customExpiryTimestampSec?: number
): string {
  const plan = LICENSE_PLANS[planCode] || LICENSE_PLANS.LFT;
  
  let expirySec: number;
  if (customExpiryTimestampSec) {
    expirySec = customExpiryTimestampSec;
  } else if (plan.code === 'LFT') {
    expirySec = 253402300799; // 9999-12-31 23:59:59 UTC
  } else {
    const nowSec = Math.floor(Date.now() / 1000);
    expirySec = nowSec + plan.durationDays * 86400;
  }

  // 8-character hex for timestamp
  const expiryHex = expirySec.toString(16).toUpperCase().padStart(8, '0');

  // Payload: hardwareId|planCode|expirySec
  const payload = `${hardwareId.trim()}|${plan.code}|${expirySec}`;
  const hmac = crypto.createHmac('sha256', LICENSE_SECRET);
  hmac.update(payload);
  const sigHex = hmac.digest('hex').substring(0, 16).toUpperCase();
  const sigParts = sigHex.match(/.{1,4}/g) || [];

  // Format: BARAN-LFT-003AEC23-XXXX-XXXX-XXXX-XXXX
  return `${LICENSE_PREFIX}-${plan.code}-${expiryHex}-${sigParts.join('-')}`;
}

/**
 * Parse and validate activation key for a given hardware ID.
 */
export function parseAndValidateKey(
  activationKey: string,
  hardwareId: string
): { valid: boolean; planCode?: LicensePlanCode; expirySec?: number; error?: string } {
  const cleanKey = activationKey.trim().toUpperCase();
  const parts = cleanKey.split('-');

  // Backward compatibility: old format BARAN-XXXX-XXXX... (default to lifetime)
  if (parts.length === 9 && parts[0] === LICENSE_PREFIX && !LICENSE_PLANS[parts[1] as LicensePlanCode]) {
    const hmac = crypto.createHmac('sha256', LICENSE_SECRET);
    hmac.update(hardwareId.trim());
    const expectedSig = hmac.digest('hex').substring(0, 32).toUpperCase();
    const expectedParts = expectedSig.match(/.{1,4}/g) || [];
    const expectedKey = `${LICENSE_PREFIX}-${expectedParts.join('-')}`;
    
    if (cleanKey === expectedKey) {
      return { valid: true, planCode: 'LFT', expirySec: 253402300799 };
    }
    return { valid: false, error: 'کلیلی چالاککردن نادروستە.' };
  }

  // New format: BARAN-<PLAN>-<EXPIRY_HEX>-<P1>-<P2>-<P3>-<P4> (7 parts total)
  if (parts.length !== 7 || parts[0] !== LICENSE_PREFIX) {
    return { valid: false, error: 'فۆرماتی کلیلی چالاککردن نادروستە.' };
  }

  const planCode = parts[1] as LicensePlanCode;
  if (!LICENSE_PLANS[planCode]) {
    return { valid: false, error: 'جۆری پلانی مۆڵەتنامە نادروستە.' };
  }

  const expiryHex = parts[2];
  const expirySec = parseInt(expiryHex, 16);
  if (isNaN(expirySec)) {
    return { valid: false, error: 'بەرواری بەسەرچوونی کلیل نادروستە.' };
  }

  const enteredSig = parts.slice(3).join('');
  const payload = `${hardwareId.trim()}|${planCode}|${expirySec}`;
  const hmac = crypto.createHmac('sha256', LICENSE_SECRET);
  hmac.update(payload);
  const expectedSig = hmac.digest('hex').substring(0, 16).toUpperCase();

  if (enteredSig !== expectedSig) {
    return { valid: false, error: 'واژۆی کلیلەکە نادروستە بۆ ئەم ئامێرە.' };
  }

  return { valid: true, planCode, expirySec };
}

/**
 * Check current machine's license status.
 */
export function checkLicense(): LicenseStatus {
  const hardwareId = generateHardwareId();
  const license = getLicense();

  if (!license) {
    return {
      valid: false,
      hardwareId,
      message: 'هیچ مۆڵەتنامەیەک تۆمار نەکراوە. تکایە پلانێک هەڵبژێرە و کلیلەکەی بنووسە.',
    };
  }

  // Verify hardware ID matches
  if (license.hardware_id !== hardwareId) {
    return {
      valid: false,
      hardwareId,
      message: 'ئەم مۆڵەتنامەیە بۆ ئامێرێکی تر تۆمارکراوە.',
    };
  }

  // Parse and validate activation key
  const validation = parseAndValidateKey(license.activation_key, hardwareId);
  if (!validation.valid || !validation.planCode || !validation.expirySec) {
    return {
      valid: false,
      hardwareId,
      message: validation.error || 'کلیلی چالاککردن نادروستە یان دەستکاری کراوە.',
    };
  }

  const plan = LICENSE_PLANS[validation.planCode];
  const isLifetime = validation.planCode === 'LFT';
  const nowMs = Date.now();

  // Clock tampering protection
  const lastSeenStr = getData<string>('sys_last_verified_time', '');
  if (lastSeenStr) {
    const lastSeenMs = new Date(lastSeenStr).getTime();
    if (!isNaN(lastSeenMs) && nowMs < lastSeenMs - 86400000) {
      return {
        valid: false,
        hardwareId,
        message: 'کاتی سیستەمی کۆمپیوتەرەکەت گۆڕدراوە بۆ ڕابردوو! تکایە کاتژمێری ویندۆز ڕێکبخەرەوە.',
      };
    }
  }
  // Record current time
  setData('sys_last_verified_time', new Date(nowMs).toISOString());

  if (isLifetime) {
    return {
      valid: true,
      hardwareId,
      planCode: 'LFT',
      planNameKu: plan.nameKu,
      planNameEn: plan.nameEn,
      isLifetime: true,
      daysRemaining: 99999,
      message: 'مۆڵەتنامەی هەمیشەیی چالاکە.',
    };
  }

  const expiryMs = validation.expirySec * 1000;
  const diffMs = expiryMs - nowMs;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / 86400000));
  const expiresAt = new Date(expiryMs).toISOString().split('T')[0];

  if (diffMs <= 0) {
    return {
      valid: false,
      hardwareId,
      planCode: validation.planCode,
      planNameKu: plan.nameKu,
      planNameEn: plan.nameEn,
      expiresAt,
      daysRemaining: 0,
      isLifetime: false,
      message: `ماوەی مۆڵەتنامەکەت (${plan.nameKu}) لە بەرواری ${expiresAt} بەسەرچووە. تکایە نوێی بکەرەوە.`,
    };
  }

  return {
    valid: true,
    hardwareId,
    planCode: validation.planCode,
    planNameKu: plan.nameKu,
    planNameEn: plan.nameEn,
    expiresAt,
    daysRemaining,
    isLifetime: false,
    message: `مۆڵەتنامەی (${plan.nameKu}) چالاکە. ${daysRemaining} ڕۆژ ماوە.`,
  };
}

/**
 * Activate license with entered key.
 */
export function activateLicense(activationKey: string): { success: boolean; message: string; licenseStatus?: LicenseStatus } {
  const hardwareId = generateHardwareId();
  const validation = parseAndValidateKey(activationKey, hardwareId);

  if (!validation.valid || !validation.planCode || !validation.expirySec) {
    return {
      success: false,
      message: validation.error || 'کلیلی چالاککردن نادروستە بۆ ئەم ئامێرە.',
    };
  }

  // Check if key already expired before activating
  if (validation.planCode !== 'LFT' && validation.expirySec * 1000 <= Date.now()) {
    return {
      success: false,
      message: 'ئەم کلیلە کاتەکەی بەسەرچووە.',
    };
  }

  saveLicense(activationKey.trim().toUpperCase(), hardwareId);
  const status = checkLicense();

  return {
    success: true,
    message: `مۆڵەتنامەی (${status.planNameKu || 'باران POS'}) بە سەرکەوتوویی چالاک کرا!`,
    licenseStatus: status,
  };
}
