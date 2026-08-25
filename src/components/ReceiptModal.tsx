import React from 'react';
import { X, Printer, CheckCircle, FileSpreadsheet, Receipt } from 'lucide-react';
import { SalesInvoice, SystemConfig } from '../types';
import { Currency, formatCurrency } from '../utils/currency';

interface ReceiptModalProps {
  invoice: SalesInvoice;
  onClose: () => void;
  lang?: 'en' | 'ku';
  currency?: Currency;
  exchangeRate?: number;
  systemConfig?: SystemConfig;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  invoice,
  onClose,
  lang = 'ku',
  currency = 'IQD',
  exchangeRate = 1500,
  systemConfig,
}) => {
  const [format, setFormat] = React.useState<'thermal' | 'a4'>('thermal');

  const handlePrint = () => {
    window.print();
  };

  const shopTitleKu = systemConfig?.shopNameKu || 'پــە ڕ ا و گــەی   بــا ر ا ن';
  const shopTitleEn = systemConfig?.shopNameEn || 'BARAN STATIONERY';
  const receiptHeader = systemConfig?.receiptHeader || 'بەخێربێن بۆ پەڕاوگەی باران';
  const receiptFooter = systemConfig?.receiptFooter || 'سوپاس بۆ سەردانەکەت! بەهیوای دووبارە دیدەنتان';

  // Format invoice number to look like #2026-0889
  const cleanInvNo = invoice.invoiceNumber.replace('INV-', '');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none">
      <div className="bg-white border border-slate-200 w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden text-slate-900">
        
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-xs md:text-sm text-white">
                {lang === 'ku' ? `پسوڵەی فرۆشتن #${cleanInvNo}` : `Sales Receipt #${cleanInvNo}`}
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                {invoice.date} {invoice.time}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setFormat('thermal')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  format === 'thermal' ? 'bg-[#4f46e5] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang === 'ku' ? 'تیرماڵ ٨٠مم' : 'Thermal 80mm'}
              </button>
              <button
                type="button"
                onClick={() => setFormat('a4')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  format === 'a4' ? 'bg-[#4f46e5] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang === 'ku' ? 'پسوڵەی A4' : 'A4 Size'}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Printable Receipt Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f8fafc] flex justify-center items-start min-h-0">
          
          {format === 'thermal' ? (
            /* 80mm THERMAL RECEIPT (Exact Match to media_1787677708709.png) */
            <div
              id="printable-receipt"
              className="bg-white text-slate-900 p-5 w-[80mm] max-w-full shadow-lg border border-slate-200/90 rounded-xl flex flex-col justify-between font-sans text-xs select-text leading-relaxed"
              dir="rtl"
            >
              <div>
                {/* 1. Header: Store Name + English Subtitle + Welcome Message */}
                <div className="text-center pb-2.5 space-y-1">
                  <h1 className="text-base font-black text-slate-900 tracking-wider">
                    {shopTitleKu}
                  </h1>
                  <p className="text-[11px] font-bold text-slate-700 tracking-wider uppercase font-mono">
                    {shopTitleEn}
                  </p>
                  <p className="text-xs font-bold text-[#4f46e5] pt-0.5">
                    {receiptHeader}
                  </p>
                </div>

                {/* Dashed Line Divider */}
                <div className="border-b border-dashed border-slate-300 my-2" />

                {/* 2. Meta Row: Date & Time on Right, Invoice Number on Left */}
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 py-0.5">
                  <span className="text-[11px]">{invoice.time} {invoice.date}</span>
                  <span className="text-[11px]">INV: #{cleanInvNo}</span>
                </div>

                {/* Dashed Line Divider */}
                <div className="border-b border-dashed border-slate-300 my-2" />

                {/* 3. Items List */}
                <div className="space-y-2 my-2">
                  {invoice.items.map((item, idx) => {
                    const itemName = lang === 'ku' ? (item.product.nameKu || item.product.name) : item.product.name;
                    const lineTotal = item.quantity * item.pricePerUnit * (1 - item.discount / 100);

                    return (
                      <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                        {/* Right: Item Name + (xQty) */}
                        <div className="font-bold text-slate-900 truncate flex items-center gap-1.5 flex-1">
                          <span className="truncate">{itemName}</span>
                          <span className="text-slate-600 font-mono text-[11px] shrink-0 font-bold">
                            (x{item.quantity})
                          </span>
                        </div>

                        {/* Left: Line Price with Currency */}
                        <div className="font-mono font-bold text-slate-900 text-xs shrink-0">
                          {formatCurrency(lineTotal, currency, lang, exchangeRate)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dashed Line Divider */}
                <div className="border-b border-dashed border-slate-300 my-2" />

                {/* 4. Financial Summary */}
                <div className="space-y-1 text-xs">
                  {/* Subtotal */}
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>{lang === 'ku' ? 'کۆی گشتی:' : 'Subtotal:'}</span>
                    <span className="font-mono font-bold">
                      {formatCurrency(invoice.subtotal, currency, lang, exchangeRate)}
                    </span>
                  </div>

                  {/* Discount (if applicable) */}
                  {invoice.discountTotal > 0 && (
                    <div className="flex items-center justify-between font-bold text-rose-600 text-[11px]">
                      <span>{lang === 'ku' ? 'داشکاندن:' : 'Discount:'}</span>
                      <span className="font-mono">
                        -{formatCurrency(invoice.discountTotal, currency, lang, exchangeRate)}
                      </span>
                    </div>
                  )}

                  {/* Solid Divider Line */}
                  <div className="border-b-2 border-slate-900 my-1.5" />

                  {/* Grand Final Total */}
                  <div className="flex items-center justify-between font-black text-sm">
                    <span className="text-slate-900">{lang === 'ku' ? 'بڕی کۆتایی:' : 'Final Total:'}</span>
                    <span className="font-mono font-black text-base text-[#4f46e5]">
                      {formatCurrency(invoice.grandTotal, currency, lang, exchangeRate)}
                    </span>
                  </div>

                  {/* Payment Details (Paid / Change / Debt) */}
                  {(invoice.amountPaid < invoice.grandTotal || invoice.changeDue > 0 || invoice.debtAdded > 0) && (
                    <div className="pt-1.5 space-y-0.5 text-[11px] font-bold text-slate-600">
                      {invoice.amountPaid > 0 && (
                        <div className="flex items-center justify-between">
                          <span>{lang === 'ku' ? 'پارەی دراو:' : 'Amount Paid:'}</span>
                          <span className="font-mono">{formatCurrency(invoice.amountPaid, currency, lang, exchangeRate)}</span>
                        </div>
                      )}
                      {invoice.changeDue > 0 && (
                        <div className="flex items-center justify-between text-emerald-700">
                          <span>{lang === 'ku' ? 'گەڕاوە:' : 'Change Due:'}</span>
                          <span className="font-mono">{formatCurrency(invoice.changeDue, currency, lang, exchangeRate)}</span>
                        </div>
                      )}
                      {invoice.debtAdded > 0 && (
                        <div className="flex items-center justify-between text-rose-600 font-black">
                          <span>{lang === 'ku' ? 'قەرزی ماوە:' : 'Remaining Debt:'}</span>
                          <span className="font-mono">{formatCurrency(invoice.debtAdded, currency, lang, exchangeRate)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dashed Line Divider */}
                <div className="border-b border-dashed border-slate-300 my-2.5" />

                {/* 5. Footer Greeting Message */}
                <div className="text-center pt-1 text-xs text-slate-700 font-bold space-y-0.5 leading-relaxed">
                  <p>{receiptFooter}</p>
                </div>
              </div>
            </div>
          ) : (
            /* A4 Full Sheet Invoice Preview */
            <div
              id="printable-receipt"
              className="bg-white text-slate-900 p-8 w-full max-w-lg shadow-lg border border-slate-200 rounded-xl font-sans text-xs select-text"
              dir="rtl"
            >
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-lg font-black text-slate-900">{shopTitleKu}</h1>
                  <p className="text-xs font-bold text-slate-600 uppercase font-mono mt-0.5">{shopTitleEn}</p>
                  <p className="text-xs text-[#4f46e5] font-bold mt-1">{receiptHeader}</p>
                </div>
                <div className="text-left font-mono">
                  <span className="text-xs font-black text-slate-900 uppercase block">وەصڵی فرۆشتن</span>
                  <div className="text-sm font-bold text-[#4f46e5] mt-0.5">#{cleanInvNo}</div>
                  <div className="text-[11px] text-slate-500">{invoice.date} {invoice.time}</div>
                </div>
              </div>

              <div className="my-4 grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">{lang === 'ku' ? 'کڕیار:' : 'Customer:'}</span>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">
                    {invoice.customerName || (lang === 'ku' ? 'کڕیاری ڕاستەوخۆ' : 'Walk-in Customer')}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">{lang === 'ku' ? 'کاشێر:' : 'Cashier:'}</span>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">{invoice.cashierName}</div>
                </div>
              </div>

              <table className="w-full text-xs text-start border-collapse my-4">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold">
                    <th className="p-2.5 text-start">{lang === 'ku' ? 'ناوی کاڵا' : 'Item'}</th>
                    <th className="p-2.5 text-center">{lang === 'ku' ? 'بڕ' : 'Qty'}</th>
                    <th className="p-2.5 text-center">{lang === 'ku' ? 'نرخی تاک' : 'Unit Price'}</th>
                    <th className="p-2.5 text-center">{lang === 'ku' ? 'کۆی گشتی' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">
                        {lang === 'ku' ? (item.product.nameKu || item.product.name) : item.product.name}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="p-2.5 text-center font-mono">{formatCurrency(item.pricePerUnit, currency, lang, exchangeRate)}</td>
                      <td className="p-2.5 text-center font-mono font-black text-slate-900">
                        {formatCurrency(item.quantity * item.pricePerUnit * (1 - item.discount / 100), currency, lang, exchangeRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-center">
                <div className="text-xs text-slate-600 font-bold">{receiptFooter}</div>
                <div className="w-52 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>{lang === 'ku' ? 'کۆی گشتی:' : 'Subtotal:'}</span>
                    <span className="font-mono">{formatCurrency(invoice.subtotal, currency, lang, exchangeRate)}</span>
                  </div>
                  {invoice.discountTotal > 0 && (
                    <div className="flex justify-between font-bold text-rose-600">
                      <span>{lang === 'ku' ? 'داشکاندن:' : 'Discount:'}</span>
                      <span className="font-mono">-{formatCurrency(invoice.discountTotal, currency, lang, exchangeRate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-300">
                    <span>{lang === 'ku' ? 'بڕی کۆتایی:' : 'Final Total:'}</span>
                    <span className="font-mono text-[#4f46e5] text-base">{formatCurrency(invoice.grandTotal, currency, lang, exchangeRate)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-white px-5 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-bold">
            {lang === 'ku' ? 'ئامادەیە بۆ چاپکردن' : 'Ready to Print'}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ku' ? 'چاپکردنی پسوڵە' : 'Print Receipt'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {lang === 'ku' ? 'داخستن' : 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
