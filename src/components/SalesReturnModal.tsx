import React from 'react';
import {
  X,
  RotateCcw,
  Search,
  AlertTriangle,
  CheckCircle,
  FileText,
  Trash2,
  Package,
  Calendar,
  Clock,
  User as UserIcon,
  DollarSign,
  Printer,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Coins
} from 'lucide-react';
import { SalesInvoice, User, Customer, CartItem } from '../types';
import { Currency, formatCurrency } from '../utils/currency';

interface SalesReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: SalesInvoice[];
  currentUser: User;
  onProcessReturn: (
    invoiceId: string,
    returnedItems: { product: any; quantity: number; refundPrice: number }[],
    totalRefund: number,
    reason: string,
    isFullVoid: boolean
  ) => void;
  lang?: 'en' | 'ku';
  currency?: Currency;
  exchangeRate?: number;
}

export const SalesReturnModal: React.FC<SalesReturnModalProps> = ({
  isOpen,
  onClose,
  invoices,
  currentUser,
  onProcessReturn,
  lang = 'ku',
  currency = 'IQD',
  exchangeRate = 1500,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedInvoice, setSelectedInvoice] = React.useState<SalesInvoice | null>(null);
  const [returnQuantities, setReturnQuantities] = React.useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = React.useState('mistake_entry');
  const [customReasonNote, setCustomReasonNote] = React.useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = React.useState(false);
  const [successDetails, setSuccessDetails] = React.useState<{
    invoiceNumber: string;
    totalRefund: number;
    isVoid: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const t = (ku: string, en: string) => (lang === 'ku' ? ku : en);

  // Filter completed invoices for returns
  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const invNum = inv.invoiceNumber?.toLowerCase() || '';
    const custName = inv.customerName?.toLowerCase() || '';
    const cashier = inv.cashierName?.toLowerCase() || '';
    const itemMatch = inv.items.some(
      (item) =>
        item.product.name.toLowerCase().includes(q) ||
        (item.product.nameKu && item.product.nameKu.toLowerCase().includes(q)) ||
        (item.product.barcode && item.product.barcode.includes(q))
    );
    return invNum.includes(q) || custName.includes(q) || cashier.includes(q) || itemMatch;
  });

  const handleSelectInvoice = (inv: SalesInvoice) => {
    setSelectedInvoice(inv);
    // Reset return quantities to 0
    const initialQty: Record<string, number> = {};
    inv.items.forEach((item) => {
      initialQty[item.product.id] = 0;
    });
    setReturnQuantities(initialQty);
    setCustomReasonNote('');
  };

  const handleSetAllQuantity = () => {
    if (!selectedInvoice) return;
    const allQty: Record<string, number> = {};
    selectedInvoice.items.forEach((item) => {
      allQty[item.product.id] = item.quantity;
    });
    setReturnQuantities(allQty);
  };

  const handleClearAllQuantity = () => {
    if (!selectedInvoice) return;
    const zeroQty: Record<string, number> = {};
    selectedInvoice.items.forEach((item) => {
      zeroQty[item.product.id] = 0;
    });
    setReturnQuantities(zeroQty);
  };

  // Calculate live return refund amount
  const calculateRefund = () => {
    if (!selectedInvoice) return { totalRefund: 0, returnedItemsCount: 0, itemsList: [] };

    let totalRefund = 0;
    let returnedItemsCount = 0;
    const itemsList: { product: any; quantity: number; refundPrice: number }[] = [];

    // If there was an invoice-level discount, calculate effective ratio
    const discountRatio =
      selectedInvoice.subtotal > 0
        ? (selectedInvoice.subtotal - (selectedInvoice.discountTotal || 0)) / selectedInvoice.subtotal
        : 1;

    selectedInvoice.items.forEach((item) => {
      const qtyToReturn = returnQuantities[item.product.id] || 0;
      if (qtyToReturn > 0) {
        const itemEffectivePrice = item.pricePerUnit * discountRatio;
        const itemRefund = itemEffectivePrice * qtyToReturn;
        totalRefund += itemRefund;
        returnedItemsCount += qtyToReturn;
        itemsList.push({
          product: item.product,
          quantity: qtyToReturn,
          refundPrice: itemRefund,
        });
      }
    });

    return { totalRefund, returnedItemsCount, itemsList };
  };

  const { totalRefund, returnedItemsCount, itemsList } = calculateRefund();

  // Determine if it is a 100% full return / void
  const isFullReturn =
    selectedInvoice !== null &&
    selectedInvoice.items.every(
      (item) => (returnQuantities[item.product.id] || 0) === item.quantity
    );

  const getReasonText = () => {
    const reasonsMap: Record<string, string> = {
      mistake_entry: t('هەڵەی کاشێر لە تۆمارکردن / هەڵوەشاندنەوە', 'Cashier Entry Mistake / Void'),
      customer_changed_mind: t('پەشیمانبوونەوەی کڕیار', 'Customer Changed Mind'),
      defective_item: t('کاڵای تێکچوو یان کەموکوڕی', 'Defective / Damaged Item'),
      wrong_pricing: t('نرخی هەڵە یان ناڕێک', 'Pricing Discrepancy'),
      other: t('هۆکاری تر', 'Other Reason'),
    };
    const base = reasonsMap[returnReason] || returnReason;
    return customReasonNote ? `${base}: ${customReasonNote}` : base;
  };

  // Submit Partial Return
  const handleConfirmReturn = () => {
    if (!selectedInvoice || returnedItemsCount === 0) return;

    onProcessReturn(
      selectedInvoice.id,
      itemsList,
      totalRefund,
      getReasonText(),
      isFullReturn
    );

    setSuccessDetails({
      invoiceNumber: selectedInvoice.invoiceNumber,
      totalRefund,
      isVoid: isFullReturn,
    });
    setIsSuccessModalOpen(true);
  };

  // Submit Immediate Full Void
  const handleFullVoid = () => {
    if (!selectedInvoice) return;
    if (
      !confirm(
        t(
          `دڵنیایت لە هەڵوەشاندنەوەی تەواوی پسوڵەی #${selectedInvoice.invoiceNumber}؟\nتەواوی کاڵاکان دەگەڕێنەوە بۆ کۆگا و بڕی پارەکە دەگەڕێتەوە.`,
          `Are you sure you want to VOID invoice #${selectedInvoice.invoiceNumber}?\nAll items will be returned to stock and the full amount will be refunded.`
        )
      )
    ) {
      return;
    }

    const allItems = selectedInvoice.items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      refundPrice: item.pricePerUnit * item.quantity,
    }));

    onProcessReturn(
      selectedInvoice.id,
      allItems,
      selectedInvoice.grandTotal,
      getReasonText() || t('هەڵوەشاندنەوەی پسوڵە بە هەڵە', 'Full Invoice Void (Mistake)'),
      true
    );

    setSuccessDetails({
      invoiceNumber: selectedInvoice.invoiceNumber,
      totalRefund: selectedInvoice.grandTotal,
      isVoid: true,
    });
    setIsSuccessModalOpen(true);
  };

  const handleCloseSuccess = () => {
    setIsSuccessModalOpen(false);
    setSelectedInvoice(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none font-sans">
      <div className="bg-white border border-zinc-300 w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl rounded-none overflow-hidden">
        {/* Modal Header */}
        <div className="bg-zinc-900 text-white px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-rose-600/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm uppercase tracking-wider text-white flex items-center gap-2">
                <span>{t('گەڕاندنەوەی کاڵا و هەڵوەشاندنەوەی پسوولە', 'Sales Returns & Invoice Void')}</span>
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono">
                {t('گەڕاندنەوەی کاڵا بۆ کۆگا و داشکاندنی پارە لە قاسی کاشێر یان قەرزی کڕیار', 'Restock returned items, refund cash or reduce customer debt balance')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 rounded-none transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content: 2-Column Split */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-zinc-100">
          {/* Left Column (Invoices List & Search) */}
          <div className="w-full md:w-80 lg:w-96 bg-white border-r rtl:border-l rtl:border-r-0 border-zinc-300 flex flex-col h-full shrink-0">
            {/* Search Input Bar */}
            <div className="p-3 border-b border-zinc-200 bg-zinc-50 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 rtl:left-auto rtl:right-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder={t('گەڕان بە ژمارەی پسوولە، کڕیار، کاڵا...', 'Search by invoice #, customer, item...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8.5 bg-white border border-zinc-300 pl-8 rtl:pl-2.5 pr-2.5 rtl:pr-8 text-xs text-zinc-900 placeholder-zinc-400 font-sans outline-none focus:border-black rounded-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 rtl:right-auto rtl:left-2 top-2 text-zinc-400 hover:text-zinc-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono font-bold">
                <span>{t('پسوولە تۆمارکراوەکان', 'Recent Invoices')}</span>
                <span>{filteredInvoices.length} {t('پسوولە', 'invoices')}</span>
              </div>
            </div>

            {/* Invoices List */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
              {filteredInvoices.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-zinc-300 stroke-1" />
                  <p className="text-xs font-bold">{t('هیچ پسوولەیەک نەدۆزرایەوە', 'No matching invoices found')}</p>
                </div>
              ) : (
                filteredInvoices.map((inv) => {
                  const isSelected = selectedInvoice?.id === inv.id;
                  const isVoided = inv.status === 'voided';
                  const isReturned = inv.status === 'returned';

                  return (
                    <div
                      key={inv.id}
                      onClick={() => handleSelectInvoice(inv)}
                      className={`p-3 cursor-pointer transition-all border-s-4 ${
                        isSelected
                          ? 'bg-zinc-100 border-rose-600'
                          : 'bg-white hover:bg-zinc-50/80 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono font-black text-xs text-zinc-900">
                          #{inv.invoiceNumber}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-none border ${
                            isVoided
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isReturned
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isVoided
                            ? t('هەڵوەشاوەتەوە', 'VOIDED')
                            : isReturned
                            ? t('گەڕاوەتەوە', 'RETURNED')
                            : t('تەواوکراو', 'COMPLETED')}
                        </span>
                      </div>

                      <div className="text-[11px] text-zinc-700 font-bold truncate mb-1">
                        {inv.customerName || t('کڕیاری گشتی', 'Walk-in Customer')}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                        <span>{inv.date} • {inv.time}</span>
                        <span className="font-bold text-zinc-900">
                          {formatCurrency(inv.grandTotal, currency, lang, exchangeRate)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Invoice Breakdown & Return Editor */}
          <div className="flex-1 flex flex-col h-full bg-zinc-50 overflow-hidden">
            {!selectedInvoice ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-zinc-200/70 flex items-center justify-center text-zinc-400">
                  <RotateCcw className="w-8 h-8 stroke-1" />
                </div>
                <h3 className="font-bold text-sm text-zinc-700">
                  {t('پسوولەیەک لە لیستی لای چەپ دیاریبکە', 'Select an invoice from the left list')}
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm">
                  {t(
                    'دەتوانیت کاڵای دیاریکراو بگەڕێنیتەوە یان بە یەک کلیک تەواوی پسوولەکە هەڵبوەشێنیتەوە بەهۆی هەڵەی تۆمارکردن.',
                    'You can return specific items or fully void the invoice if entered by mistake.'
                  )}
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Selected Invoice Banner */}
                <div className="p-4 bg-white border-b border-zinc-300 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black font-mono text-zinc-900">
                        #{selectedInvoice.invoiceNumber}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${
                          selectedInvoice.status === 'voided'
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : selectedInvoice.status === 'returned'
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        }`}
                      >
                        {selectedInvoice.status === 'voided'
                          ? t('پسوولەی هەڵوەشاوە', 'VOIDED INVOICE')
                          : selectedInvoice.status === 'returned'
                          ? t('پسوولەی گەڕاوە', 'PARTIALLY RETURNED')
                          : t('پسوولەی چالاک', 'ACTIVE SALE')}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1 flex flex-wrap items-center gap-3">
                      <span><strong>{t('کڕیار:', 'Customer:')}</strong> {selectedInvoice.customerName || t('کڕیاری گشتی', 'Walk-in')}</span>
                      <span>•</span>
                      <span><strong>{t('کاشێر:', 'Cashier:')}</strong> {selectedInvoice.cashierName}</span>
                      <span>•</span>
                      <span><strong>{t('شێواز:', 'Method:')}</strong> {selectedInvoice.paymentMethod === 'cash' ? t('کاش', 'Cash') : t('قەرز', 'Credit/Debt')}</span>
                    </div>
                  </div>

                  {/* Top Action Quick Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSetAllQuantity}
                      className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs border border-zinc-300 rounded-none transition-colors cursor-pointer"
                    >
                      {t('دیاریکردنی هەمووی', 'Select All')}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllQuantity}
                      className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs border border-zinc-300 rounded-none transition-colors cursor-pointer"
                    >
                      {t('پاککردنەوە', 'Clear')}
                    </button>
                    {selectedInvoice.status !== 'voided' && (
                      <button
                        type="button"
                        onClick={handleFullVoid}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 rounded-none transition-colors cursor-pointer shadow-xs"
                        title={t('هەڵوەشاندنەوەی تەواوی پسوولەکە و گەڕاندنەوەی پارە و کۆگا', 'Void entire invoice')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('هەڵوەشاندنەوەی تەواوی پسوولە (Void)', 'Full Void')}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="bg-white border border-zinc-300 rounded-none overflow-hidden shadow-2xs">
                    <div className="p-2.5 bg-zinc-100 border-b border-zinc-200 font-bold text-xs text-zinc-700 flex items-center justify-between">
                      <span>{t('کاڵاکانی ناو ئەم پسوولەیە (دیاریکردنی ژمارەی گەڕاوە):', 'Invoice Items (Specify return quantity):')}</span>
                      <span className="text-[11px] font-mono text-zinc-500 font-normal">
                        {selectedInvoice.items.length} {t('جۆر کاڵا', 'items')}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-start">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-mono text-[10px] uppercase">
                            <th className="p-2.5 text-start">{t('کاڵا', 'Item')}</th>
                            <th className="p-2.5 text-center">{t('فرۆشراو', 'Sold Qty')}</th>
                            <th className="p-2.5 text-end">{t('نرخی یەکە', 'Unit Price')}</th>
                            <th className="p-2.5 text-center w-36">{t('ژمارەی گەڕاوە', 'Return Qty')}</th>
                            <th className="p-2.5 text-end">{t('بڕی پارەی گەڕاوە', 'Refund Subtotal')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {selectedInvoice.items.map((item) => {
                            const currentReturnQty = returnQuantities[item.product.id] || 0;
                            const itemRefundAmount = item.pricePerUnit * currentReturnQty;

                            return (
                              <tr
                                key={item.product.id}
                                className={currentReturnQty > 0 ? 'bg-rose-50/40' : 'hover:bg-zinc-50/60'}
                              >
                                <td className="p-2.5">
                                  <div className="font-bold text-zinc-900">
                                    {lang === 'ku' ? (item.product.nameKu || item.product.name) : item.product.name}
                                  </div>
                                  <div className="text-[10px] font-mono text-zinc-500">
                                    {item.product.barcode || item.product.sku}
                                  </div>
                                </td>
                                <td className="p-2.5 text-center font-mono font-bold text-zinc-700">
                                  {item.quantity} {item.unitSelected || ''}
                                </td>
                                <td className="p-2.5 text-end font-mono font-bold text-zinc-700">
                                  {formatCurrency(item.pricePerUnit, currency, lang, exchangeRate)}
                                </td>
                                <td className="p-2.5 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setReturnQuantities((prev) => ({
                                          ...prev,
                                          [item.product.id]: Math.max(0, (prev[item.product.id] || 0) - 1),
                                        }))
                                      }
                                      className="w-6 h-6 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-black flex items-center justify-center rounded-none cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      max={item.quantity}
                                      value={currentReturnQty}
                                      onChange={(e) => {
                                        const val = Math.min(
                                          item.quantity,
                                          Math.max(0, parseInt(e.target.value) || 0)
                                        );
                                        setReturnQuantities((prev) => ({
                                          ...prev,
                                          [item.product.id]: val,
                                        }));
                                      }}
                                      className="w-12 h-6 text-center font-mono font-black text-xs bg-white border border-zinc-300 focus:border-black outline-none rounded-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setReturnQuantities((prev) => ({
                                          ...prev,
                                          [item.product.id]: Math.min(item.quantity, (prev[item.product.id] || 0) + 1),
                                        }))
                                      }
                                      className="w-6 h-6 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-black flex items-center justify-center rounded-none cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                                <td className="p-2.5 text-end font-mono font-black text-rose-600">
                                  {currentReturnQty > 0
                                    ? formatCurrency(itemRefundAmount, currency, lang, exchangeRate)
                                    : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Return Reasons & Notes Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Reason Selection */}
                    <div className="bg-white border border-zinc-300 p-3.5 space-y-2 rounded-none">
                      <label className="text-[11px] font-bold uppercase text-zinc-700 block">
                        {t('هۆکاری گەڕاندنەوە / هەڵوەشاندنەوە:', 'Reason for Return / Void:')}
                      </label>
                      <select
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-900 focus:border-black outline-none rounded-none cursor-pointer"
                      >
                        <option value="mistake_entry">{t('هەڵەی کاشێر لە تۆمارکردن / پسوولەی هەڵە', 'Cashier Entry Error / Wrong Invoice')}</option>
                        <option value="customer_changed_mind">{t('پەشیمانبوونەوەی کڕیار', 'Customer Changed Mind')}</option>
                        <option value="defective_item">{t('کاڵای تێکچوو یان کەمئەندام', 'Defective / Damaged Item')}</option>
                        <option value="wrong_pricing">{t('نرخی هەڵە یان ناڕێک', 'Pricing Discrepancy')}</option>
                        <option value="other">{t('هۆکاری تر', 'Other Reason')}</option>
                      </select>

                      <input
                        type="text"
                        placeholder={t('تێبینی یان ڕوونکردنەوەی زیاتر...', 'Additional note / details...')}
                        value={customReasonNote}
                        onChange={(e) => setCustomReasonNote(e.target.value)}
                        className="w-full bg-white border border-zinc-300 px-3 py-1.5 text-xs text-zinc-900 focus:border-black outline-none rounded-none mt-2"
                      />
                    </div>

                    {/* Refund Summary Card */}
                    <div className="bg-zinc-900 text-white p-4 space-y-3 rounded-none flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block mb-1">
                          {t('پوختەی گەڕاندنەوە', 'Refund Summary')}
                        </span>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-zinc-300">{t('کۆی کاڵای گەڕاوە:', 'Total Items Returned:')}</span>
                          <span className="font-mono font-bold text-white text-sm">{returnedItemsCount} {t('دانە', 'units')}</span>
                        </div>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="text-xs text-zinc-300">{t('شێوازی گەڕاندنەوە:', 'Refund Method:')}</span>
                          <span className="font-bold text-amber-400 text-xs">
                            {selectedInvoice.paymentMethod === 'cash'
                              ? t('گەڕاندنەوە لە قاسی کاشێر (کاش)', 'Cash from Drawer')
                              : t('داشکاندن لە قەرزی کڕیار', 'Deduct from Customer Debt')}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-300 uppercase">{t('کۆی پارەی گەڕاوە:', 'Total Refund:')}</span>
                        <span className="font-mono font-black text-lg text-emerald-400">
                          {formatCurrency(totalRefund, currency, lang, exchangeRate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Actions */}
                <div className="p-4 bg-white border-t border-zinc-300 flex items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs uppercase rounded-none transition-colors cursor-pointer"
                  >
                    {t('پاشگەزبوونەوە', 'Cancel')}
                  </button>

                  <button
                    type="button"
                    disabled={returnedItemsCount === 0 || selectedInvoice.status === 'voided'}
                    onClick={handleConfirmReturn}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 rounded-none transition-colors cursor-pointer shadow-md"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>
                      {isFullReturn
                        ? t('هەڵوەشاندنەوەی تەواوی پسوولەکە (Confirm Full Void)', 'Confirm Full Void')
                        : t(`گەڕاندنەوەی (${returnedItemsCount}) کاڵا (Confirm Return)`, `Confirm Return (${returnedItemsCount} Items)`)}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Confirmation Modal */}
      {isSuccessModalOpen && successDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-60 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md p-6 space-y-4 shadow-2xl rounded-none text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-black text-base text-zinc-900">
                {successDetails.isVoid
                  ? t('پسوولەکە بە سەرکەوتوویی هەڵوەشێندرایەوە', 'Invoice Successfully Voided')
                  : t('کاڵاکان بە سەرکەوتوویی گەڕێنرانەوە', 'Items Successfully Returned')}
              </h3>
              <p className="text-xs text-zinc-500 font-mono mt-1">
                {t(`پسوڵەی #${successDetails.invoiceNumber}`, `Invoice #${successDetails.invoiceNumber}`)}
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 p-3.5 space-y-1.5 font-mono text-xs text-start">
              <div className="flex justify-between">
                <span className="text-zinc-500">{t('بڕی پارەی گەڕاوە:', 'Refunded Amount:')}</span>
                <span className="font-black text-rose-600 text-sm">
                  {formatCurrency(successDetails.totalRefund, currency, lang, exchangeRate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">{t('کۆگا:', 'Inventory:')}</span>
                <span className="font-bold text-emerald-600">{t('کاڵاکان بۆ کۆگا زیادکرانەوە', 'Restocked')}</span>
              </div>
            </div>

            <button
              onClick={handleCloseSuccess}
              className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider rounded-none cursor-pointer transition-colors"
            >
              {t('تەواو / داخستن', 'Done / Close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
