/**
 * License Key Generator for Baran POS (CLI Version)
 * 
 * Usage:
 *   npx tsx tools/generate-license.ts <hardware-id> [plan]
 * 
 * Plans:
 *   7d  | trial    -> 7 Days Free Trial (بێ بەرامبەر)
 *   3m  | 3months  -> 3 Months (100,000 IQD)
 *   6m  | 6months  -> 6 Months (150,000 IQD)
 *   1y  | 1year    -> 1 Year (290,000 IQD)
 *   lft | lifetime -> Lifetime (450,000 IQD) [DEFAULT]
 */

import { generateActivationKey, LICENSE_PLANS, LicensePlanCode } from '../electron/license';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('\n🔐 Baran POS License Key Generator');
  console.log('═'.repeat(55));
  console.log('Usage: npx tsx tools/generate-license.ts <hardware-id> [plan]\n');
  console.log('Available Plans:');
  console.log('  7d  | trial    -> ٧ ڕۆژ (تاقیکردنەوە) - بێ بەرامبەر (Free)');
  console.log('  3m  | 3months  -> ٣ مانگ            - 100,000 د.ع');
  console.log('  6m  | 6months  -> ٦ مانگ            - 150,000 د.ع');
  console.log('  1y  | 1year    -> ١ ساڵ             - 290,000 د.ع');
  console.log('  lft | lifetime -> هەتاهەتایی        - 450,000 د.ع [بنەڕەت]\n');
  console.log('Example:');
  console.log('  npx tsx tools/generate-license.ts a2ee7f981ce... 1y');
  console.log('═'.repeat(55));
  process.exit(1);
}

const hardwareId = args[0].trim();
const planArg = (args[1] || 'lft').toLowerCase().trim();

let planCode: LicensePlanCode = 'LFT';

switch (planArg) {
  case '7d':
  case '7days':
  case 'trial':
  case 't07':
    planCode = 'T07';
    break;
  case '3m':
  case '3months':
  case 'm03':
    planCode = 'M03';
    break;
  case '6m':
  case '6months':
  case 'm06':
    planCode = 'M06';
    break;
  case '1y':
  case '1year':
  case 'y01':
    planCode = 'Y01';
    break;
  case 'lft':
  case 'lifetime':
  case 'permanent':
    planCode = 'LFT';
    break;
  default:
    console.warn(`⚠️ پلانی نەناسراو '${planArg}', گۆڕدرا بۆ پلانی هەتاهەتایی (LFT).`);
    planCode = 'LFT';
}

const plan = LICENSE_PLANS[planCode];
const activationKey = generateActivationKey(hardwareId, planCode);

console.log('\n🔐 Baran POS — کلیلی مۆڵەتنامەی دروستکراو');
console.log('═'.repeat(60));
console.log(`Hardware ID:     ${hardwareId}`);
console.log(`پلانی مۆڵەتنامە:  ${plan.nameKu} (${plan.nameEn})`);
console.log(`ماوە:             ${plan.durationDays > 0 ? `${plan.durationDays} ڕۆژ` : 'هەمیشەیی (بێ کۆتا)'}`);
console.log(`نرخ:              ${plan.priceIqd > 0 ? `${plan.priceIqd.toLocaleString()} د.ع` : 'بێ بەرامبەر (Free)'}`);
console.log('─'.repeat(60));
console.log(`Activation Key:  ${activationKey}`);
console.log('═'.repeat(60));
console.log('\n✅ ئەم کلیلە کۆپی بکە و بینێرە بۆ کڕیار.');
