import React from 'react';
import { 
  Printer, 
  Layers, 
  FileText, 
  Check, 
  Plus, 
  ShoppingCart, 
  Calculator,
  Percent,
  Edit3,
  RotateCcw,
  Trash2,
  ListPlus,
  Sparkles
} from 'lucide-react';
import { Product } from '../types';
import { Currency, formatCurrency } from '../utils/currency';

export interface QueuedPrintJob {
  id: string;
  paperSize: 'A4' | 'A3' | 'A5' | 'Photo 4x6';
  printType: 'bw_single' | 'bw_double' | 'color_single' | 'color_double';
  paperType: 'standard' | 'glossy' | 'cardstock' | 'sticker';
  pages: number;
  copies: number;
  binding: 'none' | 'staple' | 'spiral' | 'tape' | 'hardcover';
  lamination: boolean;
  holePunch: boolean;
  folding: boolean;
  projectNote: string;
  unitPagePrice: number;
  netTotal: number;
  details: string;
  title: string;
}

interface CustomPrintCalculatorProps {
  onAddToCart: (printJobProduct: Product, quantity: number, customDetails: string, calculatedPrice: number) => void;
  lang?: 'en' | 'ku';
  currency?: Currency;
  exchangeRate?: number;
}

export const CustomPrintCalculator: React.FC<CustomPrintCalculatorProps> = ({
  onAddToCart,
  lang = 'ku',
  currency = 'IQD',
  exchangeRate = 1500,
}) => {
  // Config States
  const [paperSize, setPaperSize] = React.useState<'A4' | 'A3' | 'A5' | 'Photo 4x6'>('A4');
  const [printType, setPrintType] = React.useState<'bw_single' | 'bw_double' | 'color_single' | 'color_double'>('bw_single');
  const [paperType, setPaperType] = React.useState<'standard' | 'glossy' | 'cardstock' | 'sticker'>('standard');
  const [pages, setPages] = React.useState<number>(10);
  const [copies, setCopies] = React.useState<number>(1);
  const [binding, setBinding] = React.useState<'none' | 'staple' | 'spiral' | 'tape' | 'hardcover'>('none');
  const [lamination, setLamination] = React.useState<boolean>(false);
  const [holePunch, setHolePunch] = React.useState<boolean>(false);
  const [folding, setFolding] = React.useState<boolean>(false);
  const [discountPercent, setDiscountPercent] = React.useState<number>(0);
  const [projectNote, setProjectNote] = React.useState<string>('');

  // Manual Custom Price Overrides State
  const [manualPricePerPage, setManualPricePerPage] = React.useState<string>('');
  const [manualBindingCost, setManualBindingCost] = React.useState<string>('');
  const [manualLaminationCost, setManualLaminationCost] = React.useState<string>('');
  const [manualTotalJobPrice, setManualTotalJobPrice] = React.useState<string>('');

  // Multi-Item Queue State (پێرستی ئیشەکانی چاپ)
  const [queuedJobs, setQueuedJobs] = React.useState<QueuedPrintJob[]>([]);

  // Reset custom manual prices
  const resetManualPrices = () => {
    setManualPricePerPage('');
    setManualBindingCost('');
    setManualLaminationCost('');
    setManualTotalJobPrice('');
  };

  // Quick Preset Handlers
  const applyPreset = (preset: 'student_book' | 'color_flyer' | 'quick_copy') => {
    resetManualPrices();
    if (preset === 'student_book') {
      setPaperSize('A4');
      setPrintType('bw_double');
      setPaperType('standard');
      setBinding('spiral');
      setLamination(false);
    } else if (preset === 'color_flyer') {
      setPaperSize('A4');
      setPrintType('color_single');
      setPaperType('glossy');
      setBinding('none');
      setLamination(true);
    } else if (preset === 'quick_copy') {
      setPaperSize('A4');
      setPrintType('bw_single');
      setPaperType('standard');
      setBinding('none');
      setLamination(false);
    }
  };

  // Price Calculation Logic
  const calculatePriceBreakdown = () => {
    let defaultUnitPagePrice = 150;
    if (printType === 'bw_single') defaultUnitPagePrice = 150;
    else if (printType === 'bw_double') defaultUnitPagePrice = 225;
    else if (printType === 'color_single') defaultUnitPagePrice = 375;
    else if (printType === 'color_double') defaultUnitPagePrice = 600;

    if (paperSize === 'A3') defaultUnitPagePrice *= 2;
    else if (paperSize === 'A5') defaultUnitPagePrice *= 0.75;
    else if (paperSize === 'Photo 4x6') defaultUnitPagePrice = 500;

    if (paperType === 'glossy') defaultUnitPagePrice += 100;
    else if (paperType === 'cardstock') defaultUnitPagePrice += 250;
    else if (paperType === 'sticker') defaultUnitPagePrice += 350;

    const unitPagePrice = manualPricePerPage !== '' ? (parseFloat(manualPricePerPage) || 0) : defaultUnitPagePrice;
    const printingSubtotal = unitPagePrice * pages * copies;

    let defaultBindingCost = 0;
    if (binding === 'staple') defaultBindingCost = 250 * copies;
    else if (binding === 'spiral') defaultBindingCost = 2250 * copies;
    else if (binding === 'tape') defaultBindingCost = 1500 * copies;
    else if (binding === 'hardcover') defaultBindingCost = 12000 * copies;

    const bindingCost = manualBindingCost !== '' ? (parseFloat(manualBindingCost) || 0) : defaultBindingCost;

    let defaultLaminationCost = 0;
    if (lamination) {
      defaultLaminationCost = (paperSize === 'A3' ? 1500 : 750) * pages * copies;
    }

    let extraFinishingCost = 0;
    if (holePunch) extraFinishingCost += 250 * copies;
    if (folding) extraFinishingCost += 150 * pages * copies;

    const laminationCost = manualLaminationCost !== '' ? (parseFloat(manualLaminationCost) || 0) : (defaultLaminationCost + extraFinishingCost);

    const grossTotal = printingSubtotal + bindingCost + laminationCost;
    const discountAmount = (grossTotal * discountPercent) / 100;
    const calculatedNetTotal = Math.max(0, Math.round(grossTotal - discountAmount));

    const netTotal = manualTotalJobPrice !== '' ? (parseFloat(manualTotalJobPrice) || 0) : calculatedNetTotal;
    const isCustomized = manualPricePerPage !== '' || manualBindingCost !== '' || manualLaminationCost !== '' || manualTotalJobPrice !== '';

    return {
      defaultUnitPagePrice,
      unitPagePrice,
      printingSubtotal,
      bindingCost,
      laminationCost,
      extraFinishingCost,
      grossTotal,
      discountAmount,
      calculatedNetTotal,
      netTotal,
      isCustomized,
    };
  };

  const breakdown = calculatePriceBreakdown();

  // Create details string for current configuration
  const getCurrentJobDetails = () => {
    const paperTypeLabel = paperType === 'standard' ? 'Standard 80g' : paperType === 'glossy' ? 'Glossy 130g' : paperType === 'cardstock' ? 'Cardstock 300g' : 'Sticker';
    const bindingLabel = binding === 'none' ? 'No Binding' : binding === 'staple' ? 'Stapled' : binding === 'spiral' ? 'Spiral Coil' : binding === 'tape' ? 'Tape' : 'Hardcover Leather';
    return `Print Job: ${paperSize} ${printType.toUpperCase()} (${paperTypeLabel}), ${pages}p x ${copies}c | Binding: ${bindingLabel}${lamination ? ' | Lamination' : ''}${breakdown.isCustomized ? ' | Custom Price' : ''}${projectNote ? ` | Note: ${projectNote}` : ''}`;
  };

  // Add current item to multi-item queue
  const handleAddCurrentJobToQueue = () => {
    const newJob: QueuedPrintJob = {
      id: `job_${Date.now()}_${Math.random()}`,
      paperSize,
      printType,
      paperType,
      pages,
      copies,
      binding,
      lamination,
      holePunch,
      folding,
      projectNote,
      unitPagePrice: breakdown.unitPagePrice,
      netTotal: breakdown.netTotal,
      details: getCurrentJobDetails(),
      title: `${paperSize} ${printType.toUpperCase()} (${pages}p x ${copies}c)`,
    };

    setQueuedJobs((prev) => [...prev, newJob]);
    resetManualPrices();
  };

  // Remove item from queue
  const handleRemoveQueuedJob = (id: string) => {
    setQueuedJobs((prev) => prev.filter((j) => j.id !== id));
  };

  // Combined Grand Total for all queued jobs
  const queuedGrandTotal = queuedJobs.reduce((sum, j) => sum + j.netTotal, 0);

  // Push all jobs (or single current active job if queue empty) to POS cart
  const handlePushAllToCart = () => {
    const jobsToPush: Array<{ details: string; netTotal: number; paperSize: string; printType: string }> = 
      queuedJobs.length > 0
        ? queuedJobs.map((j) => ({ details: j.details, netTotal: j.netTotal, paperSize: j.paperSize, printType: j.printType }))
        : [{ details: getCurrentJobDetails(), netTotal: breakdown.netTotal, paperSize, printType }];

    jobsToPush.forEach((job, idx) => {
      const customProduct: Product = {
        id: `custom_print_${Date.now()}_${idx}`,
        name: `Custom Print (${job.paperSize} ${job.printType.toUpperCase()})`,
        nameKu: `چاپی تایبەت (${job.paperSize})`,
        sku: `SRV-PRINT-${job.paperSize}`,
        barcode: `CUSTPRINT${Date.now()}${idx}`,
        categoryId: 'cat_2',
        brandId: 'brd_7',
        itemTypeId: 'typ_2',
        costPrice: job.netTotal * 0.35,
        retailPrice: job.netTotal,
        wholesalePrice: job.netTotal,
        stockQuantity: 9999,
        unit: 'piece',
        minStockAlert: 0,
        isActive: true,
      };

      onAddToCart(customProduct, 1, job.details, job.netTotal);
    });

    setQueuedJobs([]);
  };

  return (
    <div className="flex-1 bg-zinc-100 p-6 overflow-y-auto select-none text-zinc-900 font-sans">
      <div className="w-full space-y-4">
        {/* Formal Header Control Bar */}
        <div className="bg-zinc-900 text-white border border-zinc-800 p-4 flex items-center justify-between gap-4 rounded-none shadow-sm">
          <div>
            <h1 className="text-base font-black uppercase tracking-wider text-zinc-100 flex items-center gap-2 font-sans">
              <Printer className="w-5 h-5 text-zinc-300" />
              {lang === 'ku' ? 'سیستەمی حساباتی چاپی خێرا و فۆتۆکۆپی' : 'Print & Photocopy Job Calculator'}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5 font-sans">
              {lang === 'ku' ? 'تۆمارکردن و ئەژمارکردنی چەندین ئیشی چاپ بەیەکەوە و ناردنی بۆ سەبەتەی فرۆشتن' : 'Calculate & Combine Multiple Print Jobs Into POS Checkout'}
            </p>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Options Panel (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Quick Presets Toolbar */}
            <div className="bg-white border border-zinc-300 p-3 flex flex-wrap items-center gap-2 rounded-none shadow-2xs">
              <button
                type="button"
                onClick={() => applyPreset('student_book')}
                className="h-8 px-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-900 text-xs font-bold rounded-none transition-colors"
              >
                📘 {lang === 'ku' ? 'کتێبی قوتابی / توێژینەوە' : 'Student Book'}
              </button>
              <button
                type="button"
                onClick={() => applyPreset('color_flyer')}
                className="h-8 px-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-900 text-xs font-bold rounded-none transition-colors"
              >
                📜 {lang === 'ku' ? 'پۆستەر / لامینات' : 'Poster'}
              </button>
              <button
                type="button"
                onClick={() => applyPreset('quick_copy')}
                className="h-8 px-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-900 text-xs font-bold rounded-none transition-colors"
              >
                📄 {lang === 'ku' ? 'کۆپی خێرا' : 'Quick Copy'}
              </button>
            </div>
            {/* 1. Paper Size & Stock Type */}
            <div className="bg-white border border-zinc-300 p-4 space-y-3 rounded-none shadow-2xs">
              <span className="text-xs font-mono uppercase text-zinc-500 font-bold block border-b border-zinc-200 pb-1.5">
                {lang === 'ku' ? '١. قەبارە و جۆری کاغەز' : '1. Paper Format & Stock Type'}
              </span>

              <div className="grid grid-cols-4 gap-2 font-mono">
                {(['A4', 'A3', 'A5', 'Photo 4x6'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setPaperSize(size)}
                    className={`h-9 text-xs font-black uppercase border transition-all rounded-none ${
                      paperSize === size
                        ? 'bg-zinc-950 border-zinc-950 text-white'
                        : 'bg-zinc-50 border-zinc-300 text-zinc-800 hover:bg-zinc-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* Paper Stock Type */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { id: 'standard', nameKu: 'کاغەزی 80g (ئاسایی)', nameEn: 'Standard 80g Paper', add: 0 },
                  { id: 'glossy', nameKu: 'کاغەزی گڵۆسی 130g', nameEn: 'Glossy Photo 130g', add: 100 },
                  { id: 'cardstock', nameKu: 'کارتۆن / مەقەوا 300g', nameEn: 'Heavy Cardstock 300g', add: 250 },
                  { id: 'sticker', nameKu: 'کاغەزی ستیکەر / بەستەر', nameEn: 'Sticker Paper', add: 350 },
                ].map((pt) => (
                  <button
                    key={pt.id}
                    onClick={() => setPaperType(pt.id as any)}
                    className={`p-2.5 text-start border transition-all rounded-none text-xs ${
                      paperType === pt.id
                        ? 'bg-zinc-950 border-zinc-950 text-white font-bold'
                        : 'bg-zinc-50 border-zinc-300 text-zinc-800 hover:bg-zinc-200'
                    }`}
                  >
                    <div className="font-bold">{lang === 'ku' ? pt.nameKu : pt.nameEn}</div>
                    <div className="text-[10px] opacity-75 font-mono">
                      {pt.add === 0 ? (lang === 'ku' ? 'بێ زیاده' : 'Standard') : `+${formatCurrency(pt.add, currency, lang, exchangeRate)}`}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Color & Print Mode + Manual Price per Page Input */}
            <div className="bg-white border border-zinc-300 p-4 space-y-3 rounded-none shadow-2xs">
              <span className="text-xs font-mono uppercase text-zinc-500 font-bold block border-b border-zinc-200 pb-1.5">
                {lang === 'ku' ? '٢. ڕەنگ و جۆری چاپ' : '2. Color Option & Sides'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'bw_single', labelEn: 'B&W Single Side', labelKu: 'ڕەش و سپی (یەک ڕوو)', priceIQD: 150 },
                  { id: 'bw_double', labelEn: 'B&W Both Sides', labelKu: 'ڕەش و سپی (دوو ڕوو)', priceIQD: 225 },
                  { id: 'color_single', labelEn: 'Color Single Side', labelKu: 'ڕەنگاوڕەنگ (یەک ڕوو)', priceIQD: 375 },
                  { id: 'color_double', labelEn: 'Color Both Sides', labelKu: 'ڕەنگاوڕەنگ (دوو ڕوو)', priceIQD: 600 },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPrintType(item.id as any)}
                    className={`p-3 text-start border transition-all rounded-none ${
                      printType === item.id
                        ? 'bg-zinc-950 border-zinc-950 text-white font-bold'
                        : 'bg-zinc-50 border-zinc-300 text-zinc-800 hover:bg-zinc-200'
                    }`}
                  >
                    <div className="text-xs font-bold uppercase">{lang === 'ku' ? item.labelKu : item.labelEn}</div>
                    <div className="text-[10px] opacity-80 font-mono mt-0.5">
                      {lang === 'ku' ? 'نرخی ئۆتۆماتیکی:' : 'Auto:'} {formatCurrency(item.priceIQD, currency, lang, exchangeRate)}/{lang === 'ku' ? 'پەڕە' : 'p'}
                    </div>
                  </button>
                ))}
              </div>

              {/* Manual Price per Page Field */}
              <div className="pt-2 border-t border-zinc-200 bg-zinc-50 p-3 border border-zinc-200 font-sans">
                <label className="text-[11px] font-bold text-zinc-900 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-zinc-700" />
                    {lang === 'ku' ? `دیاریکردنی دەستیی نرخی لاپەڕە${currency === 'USD' ? ' ($)' : ''}` : `Manual Price per Page (${currency === 'IQD' ? 'IQD' : '$'})`}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono font-normal">
                    {lang === 'ku' ? `ئۆتۆماتیک: ${formatCurrency(breakdown.defaultUnitPagePrice, currency, lang, exchangeRate)}` : `Auto: ${formatCurrency(breakdown.defaultUnitPagePrice, currency, lang, exchangeRate)}`}
                  </span>
                </label>
                <input
                  type="number"
                  step="any"
                  min={0}
                  placeholder={lang === 'ku' ? `تێکردنی نرخی بەدەست (نموونە: ${breakdown.defaultUnitPagePrice})` : `Enter custom page rate (e.g. ${breakdown.defaultUnitPagePrice})`}
                  value={manualPricePerPage}
                  onChange={(e) => setManualPricePerPage(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 font-bold text-xs font-mono focus:border-black outline-none rounded-none"
                />
              </div>
            </div>

            {/* 3. Pages & Copies Quantity Counter */}
            <div className="bg-white border border-zinc-300 p-4 grid grid-cols-2 gap-4 rounded-none shadow-2xs">
              <div>
                <label className="text-xs font-mono uppercase text-zinc-500 font-bold block mb-1">
                  {lang === 'ku' ? 'ژمارەی لاپەڕە (کتێب/دۆکیومێنت)' : 'Pages in Document'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={pages}
                  onChange={(e) => setPages(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-sm text-zinc-900 font-mono font-bold focus:border-black outline-none rounded-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-zinc-500 font-bold block mb-1">
                  {lang === 'ku' ? 'ژمارەی کۆپی (دانە)' : 'Number of Copies'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-sm text-zinc-900 font-mono font-bold focus:border-black outline-none rounded-none"
                />
              </div>
            </div>

            {/* 4. Bookbinding & Finishing Options */}
            <div className="bg-white border border-zinc-300 p-4 space-y-3 rounded-none shadow-2xs">
              <span className="text-xs font-mono uppercase text-zinc-500 font-bold block border-b border-zinc-200 pb-1.5">
                {lang === 'ku' ? '٣. سەحافە، بەرگ و خزمەتگوزاری زیاده' : '3. Bookbinding & Finishing'}
              </span>

              {/* Binding Choices */}
              <div className="space-y-1.5">
                {[
                  { id: 'none', labelEn: 'No Binding (Loose)', labelKu: 'بێ سەحافە', costIQD: 0 },
                  { id: 'staple', labelEn: 'Corner / Edge Staple', labelKu: 'کەبەس کردن (مەن دەنگ)', costIQD: 250 },
                  { id: 'spiral', labelEn: 'Plastic Spiral Coils', labelKu: 'سەحافە حەڵقەی پلاستیک', costIQD: 2250 },
                  { id: 'tape', labelEn: 'Tape Thermal Binding', labelKu: 'سەحافە شریت (چەسپ)', costIQD: 1500 },
                  { id: 'hardcover', labelEn: 'Hardcover Executive Leather', labelKu: 'سەحافە بەرگی توند (جلد)', costIQD: 12000 },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setBinding(item.id as any)}
                    className={`w-full h-9 px-3 text-start border flex items-center justify-between rounded-none text-xs transition-colors ${
                      binding === item.id
                        ? 'bg-zinc-950 border-zinc-950 text-white font-bold'
                        : 'bg-zinc-50 border-zinc-300 text-zinc-800 hover:bg-zinc-200'
                    }`}
                  >
                    <span>{lang === 'ku' ? item.labelKu : item.labelEn}</span>
                    <span className="font-mono font-bold">
                      {item.costIQD === 0 ? formatCurrency(0, currency, lang, exchangeRate) : `+${formatCurrency(item.costIQD, currency, lang, exchangeRate)}`}
                    </span>
                  </button>
                ))}
              </div>

              {/* Manual Binding Cost Input */}
              <div className="pt-1 bg-zinc-50 p-3 border border-zinc-200 font-sans">
                <label className="text-[11px] font-bold text-zinc-900 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-zinc-700" />
                    {lang === 'ku' ? `دیاریکردنی دەستیی تێچووی سەحافە${currency === 'USD' ? ' ($)' : ''}` : `Manual Binding Cost (${currency === 'IQD' ? 'IQD' : '$'})`}
                  </span>
                </label>
                <input
                  type="number"
                  step="any"
                  min={0}
                  placeholder={lang === 'ku' ? 'تێکردنی تێچووی بەدەستی سەحافە' : 'Enter custom binding rate'}
                  value={manualBindingCost}
                  onChange={(e) => setManualBindingCost(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 font-bold text-xs font-mono focus:border-black outline-none rounded-none"
                />
              </div>

              {/* Extra Finishing Options */}
              <div className="pt-2 grid grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 bg-zinc-50 border border-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lamination}
                    onChange={(e) => setLamination(e.target.checked)}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="font-bold text-[11px]">{lang === 'ku' ? 'لامینات (تغلیف)' : 'Lamination'}</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-zinc-50 border border-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={holePunch}
                    onChange={(e) => setHolePunch(e.target.checked)}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="font-bold text-[11px]">{lang === 'ku' ? 'کون کردن (۲/۴)' : 'Hole Punch'}</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-zinc-50 border border-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={folding}
                    onChange={(e) => setFolding(e.target.checked)}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="font-bold text-[11px]">{lang === 'ku' ? 'تای قەدکردن' : 'Folding'}</span>
                </label>
              </div>

              {/* Manual Lamination Cost Input */}
              <div className="bg-zinc-50 p-3 border border-zinc-200 font-sans">
                <label className="text-[11px] font-bold text-zinc-900 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-zinc-700" />
                    {lang === 'ku' ? `دیاریکردنی دەستیی تێچووی لامینات و خزمەتگوزاری زیاده${currency === 'USD' ? ' ($)' : ''}` : `Manual Lamination / Finishing Cost (${currency === 'IQD' ? 'IQD' : '$'})`}
                  </span>
                </label>
                <input
                  type="number"
                  step="any"
                  min={0}
                  placeholder={lang === 'ku' ? 'تێکردنی تێچووی دەستی لامینات/خزمەتگوزاری' : 'Enter custom lamination rate'}
                  value={manualLaminationCost}
                  onChange={(e) => setManualLaminationCost(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 font-bold text-xs font-mono focus:border-black outline-none rounded-none"
                />
              </div>
            </div>

            {/* Project Note */}
            <div className="bg-white border border-zinc-300 p-4 space-y-2 rounded-none shadow-2xs">
              <label className="text-xs font-mono uppercase text-zinc-500 font-bold block border-b border-zinc-200 pb-1.5">
                {lang === 'ku' ? '٤. تێبینی یان ناوی خاوەن ئیش / پڕۆژە' : '4. Reference / Job Note'}
              </label>
              <input
                type="text"
                placeholder={lang === 'ku' ? 'نموونە: پڕۆژەی دەرچوونی زانکۆ، ناوی قوتابی...' : 'e.g. Graduation Thesis, Student Name...'}
                value={projectNote}
                onChange={(e) => setProjectNote(e.target.value)}
                className="w-full h-9 bg-white border border-zinc-300 px-3 text-xs text-zinc-900 focus:border-black outline-none rounded-none font-sans"
              />
            </div>

            {/* Action: Add current configured job to Multi-Item Queue */}
            <button
              type="button"
              onClick={handleAddCurrentJobToQueue}
              className="w-full h-10 bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-none transition-colors"
            >
              <ListPlus className="w-4 h-4 text-emerald-400" />
              {lang === 'ku' ? '+ زیادکردنی ئەم ئیشە بۆ پێرستی چاپ' : '+ Add Job to Print Order Queue'}
            </button>
          </div>

          {/* Right Live Estimate Breakdown & Multi-Item Queue Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-zinc-300 p-5 space-y-4 rounded-none sticky top-6 shadow-2xs">
              {/* Header */}
              <div className="bg-zinc-900 text-white p-3 -m-5 mb-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-black text-xs uppercase tracking-wider text-zinc-100 flex items-center gap-2 font-mono">
                  <Calculator className="w-4 h-4 text-zinc-300" />
                  {lang === 'ku' ? 'پوختەی تێچووی ئیشەکان' : 'Live Job Estimate'}
                </h3>
                <span className="text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 border border-zinc-700">
                  {queuedJobs.length > 0 ? `${queuedJobs.length} ${lang === 'ku' ? 'ئیش لە پێرستدا' : 'jobs in queue'}` : `${pages * copies} ${lang === 'ku' ? 'تۆتال لاپەڕە' : 'pages'}`}
                </span>
              </div>

              {/* QUEUED JOBS MULTI-ITEM LIST (If user added items to queue) */}
              {queuedJobs.length > 0 ? (
                <div className="space-y-3 font-sans">
                  <div className="text-[11px] font-bold text-zinc-700 uppercase flex items-center justify-between font-mono">
                    <span>{lang === 'ku' ? 'پێرستی ئیشە بەکۆکراوەکان:' : 'Queued Print Order Items:'}</span>
                    <button
                      type="button"
                      onClick={() => setQueuedJobs([])}
                      className="text-rose-700 hover:underline text-[10px] font-bold"
                    >
                      {lang === 'ku' ? 'سڕینەوەی هەمووی' : 'Clear All'}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pe-1">
                    {queuedJobs.map((j, idx) => (
                      <div key={j.id} className="bg-zinc-50 p-3 border border-zinc-200 text-xs space-y-1.5 rounded-none relative">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-zinc-900 text-[11px]">
                            {idx + 1}. {j.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveQueuedJob(j.id)}
                            className="text-zinc-400 hover:text-rose-700 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {j.projectNote && (
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {lang === 'ku' ? 'تێبینی:' : 'Note:'} {j.projectNote}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-zinc-900 pt-1.5 border-t border-zinc-200">
                          <span className="text-[10px] text-zinc-500 font-normal">{j.binding !== 'none' ? j.binding : 'Loose'}</span>
                          <span className="text-emerald-800 font-black">{formatCurrency(j.netTotal, currency, lang, exchangeRate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Combined Multi-Item Grand Total */}
                  <div className="pt-3 border-t border-zinc-300 flex items-baseline justify-between text-zinc-900 font-mono">
                    <span className="font-bold text-xs uppercase tracking-wider">{lang === 'ku' ? 'کۆی گشتی هەموو ئیشەکان:' : 'Combined Total Price:'}</span>
                    <span className="text-2xl font-black text-zinc-900">{formatCurrency(queuedGrandTotal, currency, lang, exchangeRate)}</span>
                  </div>
                </div>
              ) : (
                /* SINGLE ACTIVE JOB BREAKDOWN VIEW */
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-zinc-600">
                    <span>{lang === 'ku' ? 'قەبارە و جۆر:' : 'Format & Color:'}</span>
                    <span className="font-bold text-zinc-900 font-sans">{paperSize} - {printType.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>{lang === 'ku' ? 'تێچووی هەر لاپەڕەیەک:' : 'Cost per page:'}</span>
                    <span className="font-bold text-zinc-900">{formatCurrency(breakdown.unitPagePrice, currency, lang, exchangeRate)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>{lang === 'ku' ? `کۆی چاپ (${pages}p x ${copies}c):` : `Print subtotal:`}</span>
                    <span>{formatCurrency(breakdown.printingSubtotal, currency, lang, exchangeRate)}</span>
                  </div>

                  {breakdown.bindingCost > 0 && (
                    <div className="flex justify-between text-zinc-600">
                      <span>{lang === 'ku' ? 'سەحافە و کەبەس:' : 'Binding cost:'}</span>
                      <span>{formatCurrency(breakdown.bindingCost, currency, lang, exchangeRate)}</span>
                    </div>
                  )}

                  {breakdown.laminationCost > 0 && (
                    <div className="flex justify-between text-zinc-600">
                      <span>{lang === 'ku' ? 'لامیناتی پاراستن/خزمەتگوزاری:' : 'Lamination/Finishing cost:'}</span>
                      <span>{formatCurrency(breakdown.laminationCost, currency, lang, exchangeRate)}</span>
                    </div>
                  )}

                  {/* Bulk Discount Input */}
                  <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-zinc-600">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-zinc-500" />
                      {lang === 'ku' ? 'داشکاندنی بە کۆ (%)' : 'Bulk Discount (%)'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className="w-16 h-7 bg-white border border-zinc-300 px-1.5 text-end font-bold text-zinc-900 outline-none focus:border-black rounded-none"
                    />
                  </div>

                  {breakdown.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>{lang === 'ku' ? 'بڕی داشکێنراو:' : 'Discount Savings:'}</span>
                      <span>-{formatCurrency(breakdown.discountAmount, currency, lang, exchangeRate)}</span>
                    </div>
                  )}

                  {/* Direct Lump-Sum Manual Override Total Price Input */}
                  <div className="pt-3 border-t border-zinc-300 bg-zinc-50 p-3 border border-zinc-200 space-y-1.5 font-sans">
                    <label className="text-[11px] font-bold text-zinc-900 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Edit3 className="w-3.5 h-3.5 text-zinc-700" />
                        {lang === 'ku' ? `دیاریکردنی دەستیی کۆی گشتی نرخ${currency === 'USD' ? ' ($)' : ''}` : `Direct Lump-Sum Price Override (${currency === 'IQD' ? 'IQD' : '$'})`}
                      </span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      placeholder={lang === 'ku' ? `تێکردنی کۆی گشتی بەدەست (نموونە: ${breakdown.calculatedNetTotal})` : `Direct final total override`}
                      value={manualTotalJobPrice}
                      onChange={(e) => setManualTotalJobPrice(e.target.value)}
                      className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 font-black text-sm font-mono focus:border-black outline-none rounded-none"
                    />
                    {breakdown.isCustomized && (
                      <button
                        type="button"
                        onClick={resetManualPrices}
                        className="text-[10px] text-zinc-600 hover:text-black font-bold flex items-center gap-1 hover:underline pt-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {lang === 'ku' ? 'ڕێستکردنەوەی نرخە دەستییەکان بۆ حسابی ئۆتۆماتیکی' : 'Reset to Automatic Default Rates'}
                      </button>
                    )}
                  </div>

                  {/* Net Total Display */}
                  <div className="pt-3 border-t border-zinc-300 flex items-baseline justify-between text-zinc-900">
                    <span className="font-bold text-xs uppercase tracking-wider">{lang === 'ku' ? 'کۆی کۆتایی تێچوو:' : 'Final Job Price:'}</span>
                    <span className="text-2xl font-black text-zinc-900">{formatCurrency(breakdown.netTotal, currency, lang, exchangeRate)}</span>
                  </div>
                </div>
              )}

              {/* Push to Active POS Cart Action Button */}
              <button
                onClick={handlePushAllToCart}
                className="w-full py-3.5 bg-black hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 rounded-none transition-colors shadow-none"
              >
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                {queuedJobs.length > 0
                  ? (lang === 'ku' ? `ناردنی هەموو داواکارییەکان بۆ سەبەتەی فرۆشتن (${queuedJobs.length} ئیش)` : `Push All Jobs (${queuedJobs.length}) to POS Cart`)
                  : (lang === 'ku' ? 'ناردنی داواکاری بۆ سەبەتەی فرۆشتن' : 'Push Job to Active POS Cart')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
