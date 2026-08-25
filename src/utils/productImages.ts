export const PRESET_SAMPLE_IMAGES = [
  { name: 'پەڕە و کاغەز', url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=400&q=80' },
  { name: 'قەڵەم و نووسین', url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80' },
  { name: 'دەفتەر و کتێب', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80' },
  { name: 'مەرەکەب و تۆنەر', url: 'https://images.unsplash.com/photo-1612815150553-99ea45ef16ef?auto=format&fit=crop&w=400&q=80' },
  { name: 'سەحافە و لامینەیت', url: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=400&q=80' },
  { name: 'ئامێری مەکتەب و قەداسە', url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=400&q=80' },
  { name: 'حاسبە و ژمێریاری', url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=400&q=80' },
  { name: 'کەلوپەلی ئەندازە و نیگارکێشی', url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=400&q=80' },
  { name: 'فایل و دۆسیە', url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=400&q=80' },
  { name: 'چسپ و مەقەس', url: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=400&q=80' },
  { name: 'ئیستیکەر و تێبینی', url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=400&q=80' },
  { name: 'چاپ و فۆتۆکۆپی', url: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=400&q=80' },
];

export const getSampleImageForProduct = (name: string, categoryId?: string): string => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('پەڕە') || lower.includes('paper') || lower.includes('a4') || lower.includes('a3') || lower.includes('کاغەز') || lower.includes('ڕیم') || lower.includes('گڵۆسی') || lower.includes('glossy')) {
    return 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=400&q=80';
  }
  if (lower.includes('قەڵەم') || lower.includes('pen') || lower.includes('pencil') || lower.includes('فابەر') || lower.includes('جاف') || lower.includes('هایلایتەر') || lower.includes('ماجیک') || lower.includes('marker')) {
    return 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80';
  }
  if (lower.includes('تۆنەر') || lower.includes('مەرەکەب') || lower.includes('حبر') || lower.includes('toner') || lower.includes('ink') || lower.includes('canon') || lower.includes('npg') || lower.includes('hp')) {
    return 'https://images.unsplash.com/photo-1612815150553-99ea45ef16ef?auto=format&fit=crop&w=400&q=80';
  }
  if (lower.includes('دەفتەر') || lower.includes('کتێب') || lower.includes('book') || lower.includes('notebook') || lower.includes('یاداشت') || lower.includes('سکێچ')) {
    return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';
  }
  if (lower.includes('لامینەیت') || lower.includes('سەحافە') || lower.includes('حەڵقە') || lower.includes('cover') || lower.includes('پلاستیک') || lower.includes('spiral')) {
    return 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=400&q=80';
  }
  if (lower.includes('قەداسە') || lower.includes('stapler') || lower.includes('مەقەس') || lower.includes('مەکتەب') || lower.includes('کەتەر') || lower.includes('مەنگەنە')) {
    return 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=400&q=80';
  }
  if (lower.includes('حاسبە') || lower.includes('calculator') || lower.includes('کاسیۆ') || lower.includes('casio')) {
    return 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=400&q=80';
  }
  if (lower.includes('ئەندازە') || lower.includes('geometry') || lower.includes('مسطرة') || lower.includes('ڕاستە') || lower.includes('کەوانە') || lower.includes('نیگارکێشی') || lower.includes('بۆیەی')) {
    return 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=400&q=80';
  }
  if (lower.includes('چسپ') || lower.includes('glue') || lower.includes('uhu') || lower.includes('تەیپ') || lower.includes('tape')) {
    return 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=400&q=80';
  }
  if (lower.includes('کۆپی') || lower.includes('چاپ') || lower.includes('print') || lower.includes('سکان')) {
    return 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=400&q=80';
  }
  return 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=400&q=80';
};
