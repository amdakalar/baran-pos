import React from 'react';
import { 
  AlertTriangle, 
  Package, 
  Layers, 
  Calendar, 
  Search, 
  Tag, 
  Edit3, 
  X, 
  Check, 
  Clock, 
  Printer, 
  Plus, 
  Minus 
} from 'lucide-react';
import { Product, Category, StockAdjustment } from '../types';
import { Currency, formatCurrency } from '../utils/currency';
import { printElement } from '../utils/printHelper';

interface StockExpiryManagerProps {
  products: Product[];
  categories: Category[];
  onUpdateProduct: (product: Product) => void;
  onStockAdjustment: (adj: StockAdjustment) => void;
  lang?: 'en' | 'ku';
  currency?: Currency;
  exchangeRate?: number;
}

export const StockExpiryManager: React.FC<StockExpiryManagerProps> = ({
  products,
  categories,
  onUpdateProduct,
  onStockAdjustment,
  lang = 'ku',
  currency = 'IQD',
  exchangeRate = 1500,
}) => {
  const [search, setSearch] = React.useState('');
  const [selectedCat, setSelectedCat] = React.useState<string>('all');
  const [filterAlert, setFilterAlert] = React.useState<'all' | 'low_stock' | 'expiring'>('all');

  // Print Report Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false);
  const [printScope, setPrintScope] = React.useState<'all' | 'low_stock' | 'expiring'>('all');
  const [singlePrintProduct, setSinglePrintProduct] = React.useState<Product | null>(null);

  // Edit / Adjust Product Modal
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [editExpiryDate, setEditExpiryDate] = React.useState('');
  const [editMinAlert, setEditMinAlert] = React.useState<number>(10);
  const [adjType, setAdjType] = React.useState<'damaged_waste' | 'manual_correction' | 'stock_in'>('manual_correction');
  const [adjQty, setAdjQty] = React.useState<number>(0);
  const [adjReason, setAdjReason] = React.useState('');

  const t = (ku: string, en: string) => (lang === 'ku' ? ku : en);

  // KPI Calculations
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockAlert).length;
  const expiringCount = products.filter((p) => {
    if (!p.expiryDate) return false;
    const exp = new Date(p.expiryDate).getTime();
    return exp < Date.now() + 86400000 * 30;
  }).length;

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.nameKu && p.nameKu.includes(search)) ||
      (p.barcode && p.barcode.includes(search)) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = selectedCat === 'all' || p.categoryId === selectedCat;

    let matchesAlert = true;
    if (filterAlert === 'low_stock') {
      matchesAlert = p.stockQuantity <= p.minStockAlert;
    } else if (filterAlert === 'expiring') {
      matchesAlert = Boolean(p.expiryDate && new Date(p.expiryDate).getTime() < Date.now() + 86400000 * 30);
    }

    return matchesSearch && matchesCat && matchesAlert;
  });

  // Products to print based on printScope or single item
  const productsToPrint = React.useMemo(() => {
    if (singlePrintProduct) return [singlePrintProduct];
    if (printScope === 'low_stock') {
      return products.filter((p) => p.stockQuantity <= p.minStockAlert);
    }
    if (printScope === 'expiring') {
      return products.filter((p) => p.expiryDate && new Date(p.expiryDate).getTime() < Date.now() + 86400000 * 30);
    }
    return filteredProducts;
  }, [products, filteredProducts, printScope, singlePrintProduct]);

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setEditExpiryDate(p.expiryDate || '2028-01-01');
    setEditMinAlert(p.minStockAlert || 10);
    setAdjType('manual_correction');
    setAdjQty(0);
    setAdjReason('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    let newStock = editingProduct.stockQuantity;

    // Process Stock Adjustment if qty is specified
    if (adjQty !== 0) {
      const diff =
        adjType === 'damaged_waste' ? -Math.abs(adjQty) : adjType === 'stock_in' ? Math.abs(adjQty) : adjQty;
      newStock = Math.max(0, editingProduct.stockQuantity + diff);

      const adjustment: StockAdjustment = {
        id: `adj_${Date.now()}`,
        productId: editingProduct.id,
        productName: editingProduct.nameKu || editingProduct.name,
        type: adjType,
        quantityChange: diff,
        previousStock: editingProduct.stockQuantity,
        newStock,
        reason: adjReason || (adjType === 'damaged_waste' ? 'Damaged / Expired stock' : 'Manual correction'),
        date: new Date().toISOString(),
        user: 'على محمد',
      };
      onStockAdjustment(adjustment);
    }

    // Update Product Details
    const updated: Product = {
      ...editingProduct,
      expiryDate: editExpiryDate,
      minStockAlert: editMinAlert,
      stockQuantity: newStock,
    };

    onUpdateProduct(updated);
    setEditingProduct(null);
  };

  return (
    <div className="flex-1 bg-[#f8fafc] p-5 lg:p-6 flex flex-col overflow-hidden text-slate-900 font-sans select-none gap-4" dir={lang === 'ku' ? 'rtl' : 'ltr'}>
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-snug">
              {t('بەڕێوەبردنی کۆگا و بەسەرچوون', 'Warehouse & Expiry Management')}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              {t('شتەکانی بەسەرچوون و ئاگاداریی کۆگا', 'Expiry tracking and low stock alerts')}
            </p>
          </div>
        </div>
      </div>

      {/* 3 Summary KPI Cards Matching the Screenshot with Quick Print Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 shrink-0">
        
        {/* Card 1 (Right in RTL): Total Products (هەموو کاڵاکان) */}
        <div 
          onClick={() => setFilterAlert('all')}
          className={`bg-white rounded-xl border p-4 shadow-2xs flex items-center justify-between cursor-pointer transition-all relative group ${
            filterAlert === 'all' ? 'border-slate-300 ring-2 ring-indigo-500/10' : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 block">
              {t('هەموو کاڵاکان', 'All Products')}
            </span>
            <span className="text-base font-black font-mono text-slate-900 block">
              {products.length} {t('کاڵا', 'items')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSinglePrintProduct(null);
                setPrintScope('all');
                setIsPrintModalOpen(true);
              }}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
              title={t('چاپکردنی هەموو کاڵاکان', 'Print All Stock')}
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 2 (Middle in RTL): Low Stock (کاڵای کەمی کۆگا) */}
        <div 
          onClick={() => setFilterAlert(filterAlert === 'low_stock' ? 'all' : 'low_stock')}
          className={`bg-white rounded-xl border p-4 shadow-2xs flex items-center justify-between cursor-pointer transition-all relative group ${
            filterAlert === 'low_stock' ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 block">
              {t('کاڵای کەمی کۆگا', 'Low Stock Alert')}
            </span>
            <span className={`text-base font-black font-mono block ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {lowStockCount} {t('کاڵا', 'items')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSinglePrintProduct(null);
                setPrintScope('low_stock');
                setIsPrintModalOpen(true);
              }}
              className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition-colors cursor-pointer"
              title={t('چاپکردنی کاڵا کەمبووەکان', 'Print Low Stock Report')}
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 3 (Left in RTL): Expiring Soon (نزیک بەسەرچوون (٣٠ ڕۆژ)) */}
        <div 
          onClick={() => setFilterAlert(filterAlert === 'expiring' ? 'all' : 'expiring')}
          className={`bg-white rounded-xl border p-4 shadow-2xs flex items-center justify-between cursor-pointer transition-all relative group ${
            filterAlert === 'expiring' ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 block">
              {t('نزیک بەسەرچوون (٣٠ ڕۆژ)', 'Expiring Soon (30 Days)')}
            </span>
            <span className={`text-base font-black font-mono block ${expiringCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {expiringCount} {t('کاڵا', 'items')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSinglePrintProduct(null);
                setPrintScope('expiring');
                setIsPrintModalOpen(true);
              }}
              className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center transition-colors cursor-pointer"
              title={t('چاپکردنی کاڵا بەسەرچووەکان', 'Print Expiring Report')}
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar with Quick Print Button */}
      <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
        
        {/* Category Dropdown (Left in RTL) */}
        <div className="relative w-full sm:w-60 shrink-0">
          <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full h-9.5 bg-white border border-slate-200/90 pl-8 rtl:pl-3 pr-3 rtl:pr-8 text-xs font-bold text-slate-700 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
          >
            <option value="all">{t('هەموو پۆلێنەکان', 'All Categories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {lang === 'ku' ? (c.nameKu || c.name) : c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Wide Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={t('گەڕان بە ناو یان بارکۆد...', 'Search by name or barcode...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9.5 bg-white border border-slate-200/90 pl-9 rtl:pl-3 pr-3 rtl:pr-9 text-xs text-slate-900 placeholder-slate-400 font-sans rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Print Filtered List Button */}
        <button
          type="button"
          onClick={() => {
            setSinglePrintProduct(null);
            setPrintScope(filterAlert);
            setIsPrintModalOpen(true);
          }}
          className="h-9.5 px-3.5 bg-white border border-slate-200/90 hover:border-indigo-400 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-all shrink-0 cursor-pointer"
          title={t('چاپکردنی ئەم لیستە', 'Print This List')}
        >
          <Printer className="w-3.5 h-3.5 text-indigo-600" />
          <span>{t('چاپکردن', 'Print')} ({filteredProducts.length})</span>
        </button>
      </div>

      {/* Main Data Table (Sheet style matching the user's uploaded image) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs text-start border-collapse">
            <thead className="bg-[#f1f5f9] text-slate-700 font-bold border-b border-slate-300 sticky top-0 z-10 text-[11px] shadow-2xs">
              <tr className="divide-x rtl:divide-x-reverse divide-slate-200/80">
                <th className="p-3.5 text-start font-bold">{t('ناوی کاڵا', 'Product Name')}</th>
                <th className="p-3.5 text-center font-bold">{t('پۆلێن', 'Category')}</th>
                <th className="p-3.5 text-center font-bold">{t('کۆدی بارکۆد', 'Barcode Code')}</th>
                <th className="p-3.5 text-center font-bold">{t('بڕی کۆگا', 'Warehouse Stock')}</th>
                <th className="p-3.5 text-center font-bold">{t('بەرواری بەسەرچوون / وەجبە', 'Expiry Date / Batch')}</th>
                <th className="p-3.5 text-center font-bold">{t('کردارەکان', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 font-sans">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 space-y-2">
                    <Package className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                    <p className="text-xs font-bold">{t('هیچ کاڵایەک نەدۆزرایەوە', 'No products found')}</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, index) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  const expiryDisplay = p.expiryDate || '2028-01-01';
                  const isExpiringSoon = p.expiryDate && new Date(p.expiryDate).getTime() < Date.now() + 86400000 * 30;
                  const isLowStock = p.stockQuantity <= p.minStockAlert;
                  
                  // Zebra Striping: Alternating white and light-grey rows
                  const isEven = index % 2 === 0;
                  const rowBg = isEven ? 'bg-white' : 'bg-[#f8fafc]';

                  return (
                    <tr
                      key={p.id}
                      className={`${rowBg} hover:bg-indigo-50/40 transition-colors divide-x rtl:divide-x-reverse divide-slate-200/50`}
                    >
                      {/* 1. Product Info: Thumbnail + Kurdish Name */}
                      <td className="p-2.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 flex items-center justify-center p-0.5 shadow-2xs">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-full h-full object-contain"
                                onError={(e) => { (e.currentTarget.style.display = 'none'); }}
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-300 stroke-1" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs truncate max-w-[240px]" title={p.nameKu || p.name}>
                              {p.nameKu || p.name}
                            </h4>
                          </div>
                        </div>
                      </td>

                      {/* 2. Category Pill Badge */}
                      <td className="p-2.5 text-center">
                        <span className="inline-flex items-center gap-1.5 bg-indigo-50/70 border border-indigo-100/80 text-indigo-600 font-bold text-[11px] px-2.5 py-1 rounded-md shadow-2xs">
                          <Tag className="w-3 h-3 opacity-70" />
                          <span>{cat ? (lang === 'ku' ? (cat.nameKu || cat.name) : cat.name) : t('کەلوپەلی گشتی', 'General')}</span>
                        </span>
                      </td>

                      {/* 3. Barcode Pill Box */}
                      <td className="p-2.5 text-center">
                        <div className="inline-block bg-slate-100/90 border border-slate-200/90 px-3 py-1 rounded-md font-mono font-bold text-xs text-slate-700 select-all shadow-2xs">
                          {p.barcode || p.sku}
                        </div>
                      </td>

                      {/* 4. Warehouse Stock Quantity */}
                      <td className="p-2.5 text-center">
                        <span className={`inline-block font-mono font-bold text-xs px-2.5 py-1 rounded-md ${
                          isLowStock ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-slate-800'
                        }`}>
                          {p.stockQuantity} {t('دانە', 'units')}
                        </span>
                      </td>

                      {/* 5. Expiry Date / Batch */}
                      <td className="p-2.5 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-xs font-semibold ${
                          isExpiringSoon ? 'bg-amber-50 border border-amber-300 text-amber-700' : 'text-slate-700'
                        }`}>
                          <span>{expiryDisplay}</span>
                        </div>
                      </td>

                      {/* 6. Actions: Edit Pen Button & Print Slip Button */}
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSinglePrintProduct(p);
                              setIsPrintModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-md transition-colors cursor-pointer"
                            title={t('چاپکردنی پسوولەی کاڵا', 'Print Item Slip')}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 rounded-md transition-colors cursor-pointer"
                            title={t('دەستکاریکردنی بەسەرچوون و کۆگا', 'Edit Expiry & Stock')}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Expiry & Stock Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-md p-5 space-y-4 shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900">
                    {t('دەستکاریکردنی بەسەرچوون و بڕی کۆگا', 'Edit Expiry & Stock Quantity')}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold block truncate max-w-[200px]">
                    {editingProduct.nameKu || editingProduct.name}
                  </span>
                </div>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              {/* Expiry Date */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('بەرواری بەسەرچوون:', 'Expiry Date:')}
                </label>
                <input
                  type="date"
                  value={editExpiryDate}
                  onChange={(e) => setEditExpiryDate(e.target.value)}
                  className="w-full h-9.5 bg-white border border-slate-300 rounded-lg px-3 text-xs font-mono font-bold text-slate-900 focus:border-indigo-500 outline-none shadow-2xs"
                />
              </div>

              {/* Low Stock Alert Threshold */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('ئاگاداری کەمترین بڕی کۆگا:', 'Low Stock Alert Threshold:')}
                </label>
                <input
                  type="number"
                  value={editMinAlert}
                  onChange={(e) => setEditMinAlert(parseInt(e.target.value) || 0)}
                  className="w-full h-9.5 bg-white border border-slate-300 rounded-lg px-3 text-xs font-mono font-bold text-slate-900 focus:border-indigo-500 outline-none shadow-2xs"
                />
              </div>

              {/* Stock Quantity Adjustment */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  {t('رێکخستن یان دەستکاریکردنی بڕی کاڵا (ئیختیاری):', 'Stock Quantity Adjustment (Optional):')}
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as any)}
                    className="h-9 bg-slate-50 border border-slate-300 px-2.5 text-slate-900 font-bold rounded-lg outline-none cursor-pointer text-xs"
                  >
                    <option value="manual_correction">{t('ڕاستکردنەوەی دەستی', 'Manual')}</option>
                    <option value="damaged_waste">{t('خراپبوو / بەسەرچوو (-)', 'Damaged (-)')}</option>
                    <option value="stock_in">{t('وەرگرتن / زیادکردن (+)', 'Stock In (+)')}</option>
                  </select>

                  <input
                    type="number"
                    placeholder={t('بڕی گۆڕانکاری (٠)', 'Qty change')}
                    value={adjQty || ''}
                    onChange={(e) => setAdjQty(parseInt(e.target.value) || 0)}
                    className="h-9 bg-white border border-slate-300 px-3 text-slate-900 font-mono font-bold rounded-lg outline-none text-xs"
                  />
                </div>

                {adjQty !== 0 && (
                  <input
                    type="text"
                    placeholder={t('هۆکار / تێبینی...', 'Reason note...')}
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value)}
                    className="w-full h-8.5 bg-white border border-slate-300 px-3 text-slate-900 rounded-lg outline-none text-xs"
                  />
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-start gap-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {t('پاشەکەوتکردن', 'Save Changes')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  {t('پاشگەزبوونەوە', 'Cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Formal Printable Report Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans print:p-0 print:bg-white print:static">
          <div 
            className="bg-white border border-slate-300 w-full max-w-4xl shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
            dir={lang === 'ku' ? 'rtl' : 'ltr'}
          >
            {/* Modal Top Bar (hidden when printing) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-sm">
                  {singlePrintProduct
                    ? t('پێشبینینی چاپی پسوولەی کاڵا', 'Print Item Slip Preview')
                    : t('پێشبینینی چاپی ڕاپۆرتی کۆگا و بەسەرچوون', 'Warehouse & Expiry Report Preview')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Document Body */}
            <div
              id="printable-stock-report"
              className="printable-area p-8 space-y-6 flex-1 overflow-y-auto print:p-4 print:overflow-visible text-slate-900 bg-white font-sans"
            >
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-black uppercase text-slate-900 tracking-wide">
                    {t('پەراوگەی باران', 'BARAN STATIONERY')}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {t('سیستەمی بەڕێوەبردنی کۆگا، بەرواری بەسەرچوون و کاڵاکان', 'Warehouse Inventory & Expiry Management System')}
                  </p>
                </div>
                <div className="text-end rtl:text-right text-xs font-mono space-y-0.5">
                  <p className="font-bold text-slate-800">
                    {t('بەرواری چاپ:', 'Date:')} {new Date().toLocaleDateString('en-GB')}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    {t('کات:', 'Time:')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[11px] font-bold text-indigo-600">
                    {singlePrintProduct
                      ? t('جۆری چاپ: پسوولەی تاکەکەسی', 'Type: Single Item')
                      : printScope === 'low_stock'
                      ? t('جۆری ڕاپۆرت: کاڵا کەمبووەکانی کۆگا', 'Type: Low Stock Report')
                      : printScope === 'expiring'
                      ? t('جۆری ڕاپۆرت: کاڵا نزیک بەسەرچووەکان', 'Type: Expiring Items')
                      : t('جۆری ڕاپۆرت: ڕاپۆرتی گشتی کۆگا', 'Type: General Stock Report')}
                  </p>
                </div>
              </div>

              {/* Summary Badges (If multi-item report) */}
              {!singlePrintProduct && (
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-mono font-bold">
                  <div>
                    <span className="text-slate-500 text-[10px] block">{t('کۆی کاڵاکان لە ڕاپۆرت', 'Total Items')}</span>
                    <span className="text-sm font-black text-slate-900">{productsToPrint.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">{t('کەم لە کۆگا', 'Low Stock')}</span>
                    <span className="text-sm font-black text-rose-600">{lowStockCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">{t('نزیک بەسەرچوون', 'Expiring Soon')}</span>
                    <span className="text-sm font-black text-amber-600">{expiringCount}</span>
                  </div>
                </div>
              )}

              {/* Printable Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-start border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                    <tr className="divide-x rtl:divide-x-reverse divide-slate-300">
                      <th className="p-2.5 text-center w-12">#</th>
                      <th className="p-2.5 text-start">{t('ناوی کاڵا', 'Product Name')}</th>
                      <th className="p-2.5 text-center">{t('پۆلێن', 'Category')}</th>
                      <th className="p-2.5 text-center">{t('بارکۆد / کۆد', 'Barcode / SKU')}</th>
                      <th className="p-2.5 text-center">{t('بڕی ماوە', 'Current Stock')}</th>
                      <th className="p-2.5 text-center">{t('ئاگاداری کەمترین', 'Min Alert')}</th>
                      <th className="p-2.5 text-center">{t('بەرواری بەسەرچوون', 'Expiry Date')}</th>
                      <th className="p-2.5 text-center">{t('دۆخ', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs font-mono">
                    {productsToPrint.map((p, idx) => {
                      const cat = categories.find((c) => c.id === p.categoryId);
                      const isLow = p.stockQuantity <= p.minStockAlert;
                      const isExp = p.expiryDate && new Date(p.expiryDate).getTime() < Date.now() + 86400000 * 30;

                      return (
                        <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                          <td className="p-2 font-sans font-bold text-slate-900">{p.nameKu || p.name}</td>
                          <td className="p-2 text-center font-sans text-slate-600">{cat ? (lang === 'ku' ? (cat.nameKu || cat.name) : cat.name) : '-'}</td>
                          <td className="p-2 text-center text-slate-700">{p.barcode || p.sku}</td>
                          <td className="p-2 text-center font-black text-slate-900">{p.stockQuantity}</td>
                          <td className="p-2 text-center text-slate-500">{p.minStockAlert}</td>
                          <td className="p-2 text-center font-semibold text-slate-800">{p.expiryDate || '2028-01-01'}</td>
                          <td className="p-2 text-center font-sans font-bold text-[10px]">
                            {isLow ? (
                              <span className="text-rose-600 font-black">{t('کەمی کۆگا', 'Low')}</span>
                            ) : isExp ? (
                              <span className="text-amber-600 font-black">{t('نزیک بەسەرچوون', 'Expiring')}</span>
                            ) : (
                              <span className="text-emerald-700 font-black">{t('ئاسایی', 'Normal')}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Document Signatures & Footer */}
              <div className="pt-8 border-t border-slate-300 flex items-center justify-between text-xs font-mono text-slate-600">
                <div>
                  <p>{t('ئامادەکاری لەلایەن: سیستەمی باران POS', 'Generated by: Baran POS System')}</p>
                  <p>{t('بەکارهێنەر: على محمد', 'Operator: Ali Muhammad')}</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800 mb-8">{t('مۆری فەرمی و ئیمزای بەڕێوەبەر', 'Official Stamp & Signature')}</p>
                  <p className="text-slate-400">________________________</p>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Footer (hidden when printing) */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5 print:hidden">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {t('داخستن', 'Close')}
              </button>
              <button
                type="button"
                onClick={() => printElement('printable-stock-report', { title: 'ڕاپۆرتی کۆگا و بەسەرچوون - پەراوگەی باران', pageSize: 'A4' })}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t('چاپکردنی ڕاستەوخۆ', 'Print Now')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
