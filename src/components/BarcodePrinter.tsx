import React from 'react';
import { Barcode, Printer, Sparkles, RefreshCw, X, Search, Plus } from 'lucide-react';
import { Product, SystemConfig } from '../types';
import { Currency, formatCurrency } from '../utils/currency';

interface BarcodePrinterProps {
  products: Product[];
  systemConfig?: SystemConfig;
  lang?: 'en' | 'ku';
  currency?: Currency;
  exchangeRate?: number;
}

// Vector SVG Barcode Graphic (100% printable on all printers & PDFs)
const BarcodeGraphic: React.FC<{ code: string }> = ({ code }) => {
  const bars = React.useMemo(() => {
    const list: { width: number }[] = [];
    const seedStr = code || 'BARAN-1001';
    for (let i = 0; i < seedStr.length; i++) {
      const charCode = seedStr.charCodeAt(i);
      list.push({ width: (charCode % 3) + 1 });
      list.push({ width: ((charCode * 7) % 2) + 1 });
    }
    // Add start/stop guard bars for Code128 look
    return [
      { width: 2 }, { width: 1 }, { width: 1 },
      ...list,
      { width: 1 }, { width: 2 }, { width: 2 }
    ];
  }, [code]);

  const totalWidth = bars.reduce((sum, b) => sum + b.width + 1.5, 0);

  return (
    <div className="flex items-center justify-center my-1 h-7 w-full overflow-hidden">
      <svg
        className="h-7 w-auto max-w-full"
        viewBox={`0 0 ${totalWidth} 32`}
        preserveAspectRatio="none"
        style={{ color: '#000000' }}
      >
        {(() => {
          let currentX = 0;
          return bars.map((bar, idx) => {
            const x = currentX;
            currentX += bar.width + 1.5;
            return (
              <rect
                key={idx}
                x={x}
                y={0}
                width={bar.width}
                height={32}
                fill="#000000"
                style={{ fill: '#000000' }}
              />
            );
          });
        })()}
      </svg>
    </div>
  );
};

export const BarcodePrinter: React.FC<BarcodePrinterProps> = ({
  products,
  systemConfig,
  lang = 'en',
  currency = 'IQD',
  exchangeRate = 1500,
}) => {
  // Mode: 'existing' or 'custom'
  const [mode, setMode] = React.useState<'existing' | 'custom'>('existing');

  // Existing product selection & search state
  const [selectedProductId, setSelectedProductId] = React.useState<string>(products[0]?.id || '');
  const [productSearchQuery, setProductSearchQuery] = React.useState('');
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = React.useState(false);

  const [copies, setCopies] = React.useState<number>(12);
  const [layout, setLayout] = React.useState<'a4_grid' | 'thermal_roll'>('a4_grid');

  // Custom New Barcode Form State
  const [isCustomBarcodeModalOpen, setIsCustomBarcodeModalOpen] = React.useState(false);
  const [customName, setCustomName] = React.useState('');
  const [customBarcode, setCustomBarcode] = React.useState('');
  const [customPrice, setCustomPrice] = React.useState<number>(1000);

  // Active label item being printed
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const filteredProducts = React.useMemo(() => {
    if (!productSearchQuery.trim()) return products;
    const q = productSearchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.nameKu && p.nameKu.toLowerCase().includes(q)) ||
        p.barcode.toLowerCase().includes(q)
    );
  }, [products, productSearchQuery]);

  const shopTitle = lang === 'ku'
    ? (systemConfig?.shopNameKu || 'پەراوگەی باران')
    : (systemConfig?.shopNameEn || 'BARAN STATIONERY');

  const activeLabelData = mode === 'existing' && selectedProduct
    ? {
        name: lang === 'ku' ? (selectedProduct.nameKu || selectedProduct.name) : selectedProduct.name,
        barcode: selectedProduct.barcode,
        price: selectedProduct.retailPrice,
      }
    : {
        name: customName || (lang === 'ku' ? 'کاڵای نوێ' : 'New Custom Item'),
        barcode: customBarcode || 'BARAN-8849201',
        price: customPrice,
      };

  const handleGenerateRandomBarcode = () => {
    const randomNum = Math.floor(100000000000 + Math.random() * 900000000000);
    setCustomBarcode(`884${randomNum}`);
  };

  const handleCreateCustomBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBarcode) handleGenerateRandomBarcode();
    setMode('custom');
    setIsCustomBarcodeModalOpen(false);
  };

  const handlePrintLabels = () => {
    window.print();
  };

  return (
    <div className="flex-1 bg-zinc-100 p-6 flex flex-col overflow-y-auto text-zinc-900 font-sans select-none">
      <div className="w-full space-y-4">
        {/* Top Header Card (Minimal & Formal) */}
        <div className="bg-white border border-zinc-300 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-none shadow-2xs">
          <div>
            <h1 className="text-base font-black uppercase text-zinc-900 flex items-center gap-2">
              <Barcode className="w-5 h-5 text-zinc-800" />
              {lang === 'ku' ? 'چاپکردنی لیبڵ و بارکۆدی کاڵا' : 'Barcode & Price Label Generator'}
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              {lang === 'ku' ? 'چاپکردنی لیبڵ بۆ کاڵاکان لەسەر کاغەزی ستانداردی A4 یا دەزگای تیرماڵ ٨٠مم' : 'Print Barcode Sticker Sheets on Thermal 80mm roll or A4 Label Paper'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* New Barcode Generation Button */}
            <button
              onClick={() => {
                if (!customBarcode) handleGenerateRandomBarcode();
                setIsCustomBarcodeModalOpen(true);
              }}
              className="h-9 px-3.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-none flex items-center gap-2 transition-colors whitespace-nowrap border border-zinc-800 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-zinc-300" />
              <span>{lang === 'ku' ? 'دروستکردنی بارکۆدی نوێ' : 'Create Custom Barcode'}</span>
            </button>

            {/* Print Labels Button */}
            <button
              onClick={handlePrintLabels}
              className="h-9 px-4 bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-none transition-colors whitespace-nowrap cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ku' ? 'چاپکردنی لیبڵەکان' : 'Print Sticker Sheets'}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Studio Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Controls & Configuration Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-zinc-300 p-4 space-y-4 text-xs font-sans rounded-none shadow-2xs">
              <h2 className="text-xs font-black uppercase text-zinc-900 tracking-wider border-b border-zinc-200 pb-2.5">
                {lang === 'ku' ? 'ڕێکخستنی لیبڵەکان' : 'Label Configuration'}
              </h2>

              {/* 1. Searchable Item Selector from Inventory */}
              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-600">
                    {lang === 'ku' ? 'گەڕان و هەڵبژاردنی کاڵا' : 'Search & Select Item'}
                  </label>
                  {mode === 'custom' && (
                    <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-900 px-1 py-0.2 border border-amber-300">
                      {lang === 'ku' ? 'بارکۆدی نوێ' : 'Custom Barcode'}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 rtl:left-auto rtl:right-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={
                      mode === 'existing' && selectedProduct
                        ? (lang === 'ku' ? (selectedProduct.nameKu || selectedProduct.name) : selectedProduct.name)
                        : (lang === 'ku' ? 'گەڕان بە ناو یان بارکۆد...' : 'Search name or barcode...')
                    }
                    value={productSearchQuery}
                    onChange={(e) => {
                      setProductSearchQuery(e.target.value);
                      setIsSearchPopoverOpen(true);
                    }}
                    onFocus={() => setIsSearchPopoverOpen(true)}
                    className="w-full h-9 bg-white border border-zinc-300 pl-8 rtl:pl-2.5 pr-2.5 rtl:pr-8 text-xs text-zinc-900 font-sans focus:border-black outline-none rounded-none font-bold"
                  />
                  {productSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductSearchQuery('');
                        setIsSearchPopoverOpen(false);
                      }}
                      className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-2.5 text-zinc-400 hover:text-black cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Search Results Popover Dropdown */}
                  {isSearchPopoverOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsSearchPopoverOpen(false)} />
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-300 shadow-xl z-40 max-h-60 overflow-y-auto divide-y divide-zinc-100 font-sans text-xs animate-in fade-in duration-100">
                        {filteredProducts.length === 0 ? (
                          <div className="p-3 text-center text-zinc-400 text-xs">
                            {lang === 'ku' ? 'هیچ کاڵایەک نەدۆزرایەوە.' : 'No items matched your search.'}
                          </div>
                        ) : (
                          filteredProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setMode('existing');
                                setSelectedProductId(p.id);
                                setProductSearchQuery('');
                                setIsSearchPopoverOpen(false);
                              }}
                              className={`w-full p-2.5 text-start hover:bg-zinc-100 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                selectedProductId === p.id && mode === 'existing' ? 'bg-zinc-50 font-bold border-l-2 border-black' : ''
                              }`}
                            >
                              <span className="font-bold text-zinc-900 truncate">
                                {lang === 'ku' ? (p.nameKu || p.name) : p.name}
                              </span>
                              <span className="font-mono text-[11px] text-zinc-500 shrink-0">
                                {p.barcode}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 2. Number of Labels Input with Quick Chips */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-600">
                    {lang === 'ku' ? 'ژمارەی لیبڵەکان' : 'Number of Stickers'}
                  </label>
                  <div className="flex gap-1">
                    {[6, 12, 24, 48].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCopies(preset)}
                        className={`px-1.5 py-0.5 text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                          copies === preset ? 'bg-black text-white border-black' : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 font-mono font-bold text-xs focus:border-black outline-none rounded-none"
                />
              </div>

              {/* 3. Paper Layout Format Segmented Selector */}
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-600 block mb-1">
                  {lang === 'ku' ? 'جۆری کاغەز و چاپکەر' : 'Paper Layout Format'}
                </label>
                <div className="flex h-9 bg-zinc-100 p-0.5 border border-zinc-300 rounded-none">
                  <button
                    type="button"
                    onClick={() => setLayout('a4_grid')}
                    className={`flex-1 text-[11px] font-bold uppercase transition-colors rounded-none cursor-pointer ${
                      layout === 'a4_grid' ? 'bg-black text-white' : 'text-zinc-700 hover:text-zinc-900'
                    }`}
                  >
                    {lang === 'ku' ? 'پەڕەی A4 (٣ ستوون)' : 'A4 Sheet'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayout('thermal_roll')}
                    className={`flex-1 text-[11px] font-bold uppercase transition-colors rounded-none cursor-pointer ${
                      layout === 'thermal_roll' ? 'bg-black text-white' : 'text-zinc-700 hover:text-zinc-900'
                    }`}
                  >
                    {lang === 'ku' ? 'ڕۆڵی ٨٠مم' : '80mm Roll'}
                  </button>
                </div>
              </div>

              {/* Active Selected Item Summary Badge */}
              <div className="bg-zinc-50 border border-zinc-200 p-3 space-y-1.5 text-xs">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                  {lang === 'ku' ? 'کاڵای دیاریکراو بۆ چاپ' : 'Selected Item Details'}
                </span>
                <div className="font-bold text-zinc-900 truncate">
                  {activeLabelData.name}
                </div>
                <div className="flex justify-between items-center font-mono text-[11px] pt-1 border-t border-zinc-200">
                  <span className="text-zinc-600 font-bold">{activeLabelData.barcode}</span>
                  <span className="font-bold text-rose-700">{formatCurrency(activeLabelData.price, currency, lang, exchangeRate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Print Preview Canvas Column (8 Cols) */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-zinc-300 p-5 flex flex-col rounded-none shadow-2xs min-h-[500px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full mb-4 border-b border-zinc-200 pb-3">
                <div>
                  <span className="text-xs font-black uppercase text-zinc-900 tracking-wide block">
                    {lang === 'ku' ? 'پێشبینینی ڕاستەوخۆی لاپەڕەی چاپ' : 'Live Print Sheet Layout Preview'}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">
                    {layout === 'a4_grid' ? (lang === 'ku' ? 'ستانداردی A4 (چوارچێوەی ٢٤ دانەیی)' : 'Standard A4 Paper Grid') : (lang === 'ku' ? 'ڕۆڵی تیرماڵ ٨٠مم' : '80mm Thermal Continuous Roll')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-zinc-100 border border-zinc-300 px-2.5 py-1 text-zinc-800">
                    {copies} {lang === 'ku' ? 'دانە لەسەر پەڕە' : 'Labels queued'}
                  </span>
                </div>
              </div>

              {/* Scrollable Preview Area */}
              <div className="flex-1 bg-zinc-100/70 border border-dashed border-zinc-300 p-4 flex justify-center items-start overflow-y-auto max-h-[680px]">
                <div
                  id="printable-barcode-sheet"
                  className={`bg-white text-black font-mono shadow-md ${
                    layout === 'a4_grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full max-w-3xl p-3' : 'grid grid-cols-1 w-[80mm] gap-2 p-2'
                  }`}
                >
                  {Array.from({ length: copies }).map((_, idx) => (
                    <div
                      key={idx}
                      className="border border-black p-2 text-center flex flex-col justify-between items-center bg-white rounded-none select-text break-inside-avoid shadow-2xs"
                      style={{ height: layout === 'a4_grid' ? '36mm' : 'auto', minHeight: '85px' }}
                    >
                      {/* Top Header: Shop Name & Retail Price */}
                      <div className="w-full flex items-center justify-between gap-1 border-b border-black/25 pb-0.5 leading-tight">
                        <span className="text-[9px] font-black font-sans tracking-tight truncate uppercase text-black">
                          {shopTitle}
                        </span>
                        <span className="text-[10.5px] font-black font-mono text-black shrink-0">
                          {formatCurrency(activeLabelData.price, currency, lang, exchangeRate)}
                        </span>
                      </div>

                      {/* Product Name */}
                      <div className="text-[9.5px] font-bold truncate w-full font-sans text-zinc-900 leading-tight my-0.5">
                        {activeLabelData.name}
                      </div>
                      
                      {/* 100% Printable Vector SVG Barcode */}
                      <BarcodeGraphic code={activeLabelData.barcode} />

                      {/* Barcode Number directly underneath the barcode lines at the bottom */}
                      <div className="w-full text-center font-mono font-black text-[10.5px] tracking-[0.18em] text-black border-t border-black/30 pt-0.5 leading-none">
                        {activeLabelData.barcode}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Barcode Generation Modal (Formal Minimal Design) */}
      {isCustomBarcodeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md p-5 space-y-4 shadow-2xl rounded-none font-sans text-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <Barcode className="w-4 h-4 text-zinc-800" />
                {lang === 'ku' ? 'دروستکردنی بارکۆدی نوێ' : 'Generate Custom Barcode'}
              </h3>
              <button onClick={() => setIsCustomBarcodeModalOpen(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomBarcodeSubmit} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-600 block mb-1 font-sans">
                  {lang === 'ku' ? 'ناوی کاڵا' : 'Item Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ku' ? 'نموونە: محایە 0.5 ئینجی' : 'e.g. Eraser 0.5'}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 font-sans focus:border-black outline-none rounded-none text-xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 font-sans">
                  <label className="text-[10px] uppercase font-bold text-zinc-600">
                    {lang === 'ku' ? 'ژمارەی بارکۆدی نوێ' : 'Barcode Number'}
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomBarcode}
                    className="text-[10px] font-bold text-zinc-700 hover:text-black flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 text-zinc-500" />
                    {lang === 'ku' ? 'دروستکردنی عشوائی' : 'Auto Generate'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 884902148201"
                  value={customBarcode}
                  onChange={(e) => setCustomBarcode(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 font-mono font-bold text-xs focus:border-black outline-none rounded-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-700 block mb-1 font-sans">
                  {lang === 'ku' ? `نرخی فرۆشتن (${currency === 'IQD' ? 'د.ع' : '$'})` : `Retail Price (${currency === 'IQD' ? 'IQD' : '$'})`}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min={0}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 font-mono font-black text-sm focus:border-black outline-none rounded-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => setIsCustomBarcodeModalOpen(false)}
                  className="h-9 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs rounded-none transition-colors"
                >
                  {lang === 'ku' ? 'هەڵوەشاندنەوە' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-none transition-colors"
                >
                  {lang === 'ku' ? 'جێبەجێکردن و چاپکردن' : 'Apply & Preview Barcode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
