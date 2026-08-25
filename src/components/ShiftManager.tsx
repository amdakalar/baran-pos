import React from 'react';
import {
  Clock,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Printer,
  LogOut,
  X,
  FileText,
  Search,
  Calendar,
  ChevronDown,
  BarChart3,
  ShoppingBag,
  Receipt,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Shift, User, SalesInvoice } from '../types';
import { Currency, formatCurrency } from '../utils/currency';
import { printElement } from '../utils/printHelper';

interface ShiftManagerProps {
  currentShift: Shift;
  currentUser: User;
  onCloseShift: (actualCash: number, notes: string) => void;
  onOpenNewShift: (openingFloat: number) => void;
  invoices?: SalesInvoice[];
  lang?: 'en' | 'ku';
  currency?: Currency;
  exchangeRate?: number;
}

export const ShiftManager: React.FC<ShiftManagerProps> = ({
  currentShift,
  currentUser,
  onCloseShift,
  onOpenNewShift,
  invoices = [],
  lang = 'ku',
  currency = 'IQD',
  exchangeRate = 1500,
}) => {
  const t = (ku: string, en: string) => (lang === 'ku' ? ku : en);

  // Modal states
  const [isCloseModalOpen, setIsCloseModalOpen] = React.useState(false);
  const [isNewShiftModalOpen, setIsNewShiftModalOpen] = React.useState(false);
  const [isPrintShiftModalOpen, setIsPrintShiftModalOpen] = React.useState(false);

  // Sub-tab state
  const [subTab, setSubTab] = React.useState<'shifts' | 'sales' | 'all'>('shifts');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterRange, setFilterRange] = React.useState<'today' | 'this_week' | 'this_month' | 'all'>('all');

  // Shift close form state
  const isShiftOpen = currentShift.status === 'open';
  const expectedCash = currentShift.openingFloat + currentShift.cashSales - currentShift.totalRefunds;
  const [actualCash, setActualCash] = React.useState<number>(expectedCash);
  const [closeNotes, setCloseNotes] = React.useState('');
  const [openingFloat, setOpeningFloat] = React.useState<number>(100);

  const variance = actualCash - expectedCash;

  // Date filtering helper
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // Completed invoices for this shift
  const shiftInvoices = invoices.filter(
    (inv) => inv.shiftId === currentShift.id && inv.status === 'completed'
  );

  // All completed invoices (filtered by date range)
  const filteredInvoices = invoices
    .filter((inv) => inv.status === 'completed')
    .filter((inv) => {
      if (filterRange === 'today') return inv.date.startsWith(todayStr);
      if (filterRange === 'this_week') return inv.date >= weekAgo;
      if (filterRange === 'this_month') return inv.date.startsWith(currentMonthStr);
      return true;
    })
    .filter((inv) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        inv.cashierName.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(q))
      );
    });

  // KPI calculations
  const totalShiftSales = currentShift.cashSales + currentShift.debtSales;
  const totalReceiptCount = filteredInvoices.length;
  const totalReceiptSales = filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  // Build shift log entries
  const shiftEntries = [
    {
      id: currentShift.id,
      userName: currentShift.userName,
      startTime: currentShift.startTime,
      endTime: currentShift.endTime,
      totalSales: totalShiftSales,
      cashSales: currentShift.cashSales,
      debtSales: currentShift.debtSales,
      difference: currentShift.difference ?? 0,
      status: currentShift.status,
    },
  ];

  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCloseShift(actualCash, closeNotes);
    setIsCloseModalOpen(false);
  };

  const handleOpenShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenNewShift(openingFloat);
    setIsNewShiftModalOpen(false);
  };

  const handlePrintShift = () => {
    printElement('printable-shift-summary', {
      title: t('ڕاپۆرتی شەفتی کاشێر - پەراوگەی باران', 'Cashier Shift Report - Baran POS'),
      pageSize: 'A4',
    });
  };

  return (
    <div className="flex-1 bg-zinc-100 p-6 flex flex-col overflow-y-auto text-zinc-900 font-sans select-none gap-4">
      
      {/* ── Formal Header Control Bar (Matching ReportsManager) ── */}
      <div className="bg-zinc-900 text-white border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-none shadow-sm shrink-0">
        <div>
          <h1 className="text-base font-black uppercase tracking-wider text-zinc-100 flex items-center gap-2 font-sans">
            <BarChart3 className="w-5 h-5 text-zinc-300" />
            {t('سیستەمی بەڕێوەبردنی شەفت و لۆگی فرۆشتن', 'Shift Management & Sales Logs')}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5 font-sans">
            {t('چاودێری دەقیقی دۆخی سندوق، فرۆشتنی کاشێرەکان و مێژووی وەصڵەکان', 'Shift tracking, cash drawer auditing and sales history for Baran POS')}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Shift Status Badge */}
          <span
            className={`px-3 py-1 text-[11px] font-mono font-black uppercase rounded-none border ${
              isShiftOpen
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                : 'bg-rose-950/80 text-rose-300 border-rose-700'
            }`}
          >
            {isShiftOpen ? t('شەفت: کراوە ●', 'Shift: Open ●') : t('شەفت: داخراوە ○', 'Shift: Closed ○')}
          </span>

          {/* Open/Close Shift Button */}
          {isShiftOpen ? (
            <button
              onClick={() => {
                setActualCash(expectedCash);
                setIsCloseModalOpen(true);
              }}
              className="h-8 px-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-none flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('داخستنی شەفت', 'Close Shift')}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsNewShiftModalOpen(true)}
              className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-none flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t('دەستپێکردنی شەفتی نوێ', 'Start Shift')}</span>
            </button>
          )}

          {/* Print Shift Button */}
          <button
            onClick={() => setIsPrintShiftModalOpen(true)}
            className="h-8 px-3 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-xs font-bold rounded-none flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('چاپکردنی ڕاپۆرت', 'Print Report')}</span>
          </button>
        </div>
      </div>

      {/* ── Executive KPI Metrics Cards (4 Columns) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-sans shrink-0">
        {/* Card 1: Total Shift Sales */}
        <div className="bg-white border border-zinc-300 p-4 space-y-1.5 rounded-none shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">
              {t('کۆی فرۆشتنی شەفتی ئێستا', 'Current Shift Sales')}
            </span>
            <TrendingUp className="w-4 h-4 text-zinc-700" />
          </div>
          <span className="text-2xl font-black text-zinc-900 block font-mono">
            {formatCurrency(totalShiftSales, currency, lang, exchangeRate)}
          </span>
          <div className="text-[11px] text-zinc-500 flex justify-between items-center font-mono">
            <span>{shiftInvoices.length} {t('پسوڵەی شەفت', 'invoices')}</span>
            <span className="text-emerald-700 font-bold">{t(`نەقد: ${currentShift.cashSales.toLocaleString()}`, `Cash: ${currentShift.cashSales.toLocaleString()}`)}</span>
          </div>
        </div>

        {/* Card 2: Expected Drawer Cash */}
        <div className="bg-white border border-zinc-300 p-4 space-y-1.5 rounded-none shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">
              {t('پارەی پێشبینیکراوی سندوق', 'Expected Cash in Drawer')}
            </span>
            <Coins className="w-4 h-4 text-zinc-700" />
          </div>
          <span className="text-2xl font-black text-zinc-900 block font-mono">
            {formatCurrency(expectedCash, currency, lang, exchangeRate)}
          </span>
          <div className="text-[11px] text-zinc-500 font-mono flex justify-between">
            <span>{t('سەرمایەی سەرەتا:', 'Opening:')} {formatCurrency(currentShift.openingFloat, currency, lang, exchangeRate)}</span>
            {currentShift.debtSales > 0 && (
              <span className="text-rose-700 font-bold">{t(`قەرز: ${currentShift.debtSales.toLocaleString()}`, `Credit: ${currentShift.debtSales.toLocaleString()}`)}</span>
            )}
          </div>
        </div>

        {/* Card 3: Completed Sales Invoices */}
        <div className="bg-white border border-zinc-300 p-4 space-y-1.5 rounded-none shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">
              {t('کۆی وەصڵەکانی فرۆشتن', 'Total Sales Receipts')}
            </span>
            <Receipt className="w-4 h-4 text-zinc-700" />
          </div>
          <span className="text-2xl font-black text-zinc-900 block font-mono">
            {totalReceiptCount}
            <span className="text-xs font-bold text-zinc-500 font-sans mx-1.5">{t('وەصڵ', 'receipts')}</span>
          </span>
          <div className="text-[11px] text-zinc-500 font-mono">
            {filterRange === 'today' ? t('فلتەر: تەنها ئەمڕۆ', 'Filter: Today') : filterRange === 'this_month' ? t('فلتەر: ئەم مانگە', 'Filter: This Month') : t('فلتەر: هەموو کات', 'Filter: All Time')}
          </div>
        </div>

        {/* Card 4: Total Period Revenue */}
        <div className="bg-white border border-zinc-300 p-4 space-y-1.5 rounded-none shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">
              {t('کۆی فرۆشتنی گشتی (ماوە)', 'Total Period Revenue')}
            </span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-700 block font-mono">
            {formatCurrency(totalReceiptSales, currency, lang, exchangeRate)}
          </span>
          <div className="text-[11px] text-zinc-500 font-mono">
            {t('داهاتی تەواوکراوی فرۆشتنەکان', 'Completed sales transactions')}
          </div>
        </div>
      </div>

      {/* ── Sub-Tabs & Filtering Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        {/* Sub-Tab Selector Buttons */}
        <div className="flex items-center bg-zinc-200 border border-zinc-300 p-0.5 rounded-none h-8">
          <button
            onClick={() => setSubTab('shifts')}
            className={`h-full px-3.5 font-bold uppercase text-[11px] transition-all rounded-none flex items-center gap-1.5 cursor-pointer ${
              subTab === 'shifts' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t(`لۆگی شەفتەکان (${shiftEntries.length})`, `Shift Logs (${shiftEntries.length})`)}</span>
          </button>

          <button
            onClick={() => setSubTab('sales')}
            className={`h-full px-3.5 font-bold uppercase text-[11px] transition-all rounded-none flex items-center gap-1.5 cursor-pointer ${
              subTab === 'sales' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t(`مێژووی فرۆشتان (${totalReceiptCount})`, `Sales History (${totalReceiptCount})`)}</span>
          </button>

          <button
            onClick={() => setSubTab('all')}
            className={`h-full px-3.5 font-bold uppercase text-[11px] transition-all rounded-none flex items-center gap-1.5 cursor-pointer ${
              subTab === 'all' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>{t('هەمووی', 'All')}</span>
          </button>
        </div>

        {/* Date Filter & Search Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Segmented Date Range Buttons */}
          <div className="flex items-center bg-zinc-200 border border-zinc-300 p-0.5 rounded-none h-8">
            {[
              { id: 'all', labelEn: 'All Time', labelKu: 'هەموو کات' },
              { id: 'this_month', labelEn: 'This Month', labelKu: 'ئەم مانگە' },
              { id: 'this_week', labelEn: 'This Week', labelKu: 'ئەم حەفتەیە' },
              { id: 'today', labelEn: 'Today', labelKu: 'ئەمڕۆ' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setFilterRange(r.id as any)}
                className={`h-full px-2.5 font-bold uppercase text-[11px] transition-all rounded-none flex items-center justify-center cursor-pointer ${
                  filterRange === r.id ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {lang === 'ku' ? r.labelKu : r.labelEn}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute top-1/2 -translate-y-1/2 right-2.5 rtl:right-auto rtl:left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder={t('گەڕان بە ناو، کاشێر یان وەصڵ...', 'Search by cashier or invoice...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-52 bg-white border border-zinc-300 rounded-none pr-8 rtl:pr-2.5 rtl:pl-8 pl-2.5 text-xs text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-zinc-700 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* ── Main Data Tables Container ── */}
      <div className="bg-white border border-zinc-300 rounded-none shadow-2xs overflow-hidden flex flex-col flex-1 min-h-0">

        {/* 1. Shifts Log Table */}
        {(subTab === 'shifts' || subTab === 'all') && (
          <div className="flex-1 overflow-auto min-h-0">
            {subTab === 'all' && (
              <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-300 text-[11px] font-black text-zinc-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-600" />
                {t('لۆگی شەفتەکان', 'Shift Logs')}
              </div>
            )}
            <table className="w-full text-xs text-start border-collapse min-w-[700px]">
              <thead className="bg-zinc-900 text-white font-mono text-[11px] uppercase sticky top-0 z-10">
                <tr className="divide-x rtl:divide-x-reverse divide-zinc-800">
                  <th className="py-2.5 px-4 text-start font-sans">{t('کاشێر', 'Cashier')}</th>
                  <th className="py-2.5 px-4 text-center font-sans">{t('کاتی کردنەوە', 'Start Time')}</th>
                  <th className="py-2.5 px-4 text-center font-sans">{t('کاتی داخستن', 'End Time')}</th>
                  <th className="py-2.5 px-4 text-center font-sans">{t('کۆی فرۆشتان', 'Total Sales')}</th>
                  <th className="py-2.5 px-4 text-center font-sans">{t('جیاوازی کەمکۆمی', 'Variance')}</th>
                  <th className="py-2.5 px-4 text-center font-sans">{t('دۆخ', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs font-sans">
                {shiftEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400 font-bold">
                      {t('هیچ شەفتێک تۆمار نەکراوە', 'No shifts recorded')}
                    </td>
                  </tr>
                ) : (
                  shiftEntries.map((shift) => (
                    <tr key={shift.id} className="hover:bg-zinc-50 divide-x rtl:divide-x-reverse divide-zinc-100 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-none bg-zinc-100 border border-zinc-300 text-zinc-800 text-[10px] font-black font-mono flex items-center justify-center shrink-0">
                            {shift.userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                          <span className="font-bold text-zinc-900 text-xs">{shift.userName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-zinc-700">
                        {new Date(shift.startTime).toLocaleString(lang === 'ku' ? 'ar-IQ' : 'en-US', {
                          year: 'numeric', month: 'numeric', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-zinc-500">
                        {shift.endTime
                          ? new Date(shift.endTime).toLocaleString(lang === 'ku' ? 'ar-IQ' : 'en-US', {
                              hour: '2-digit', minute: '2-digit',
                            })
                          : <span className="text-zinc-300">—</span>
                        }
                      </td>
                      <td className="py-3 px-4 text-center font-black font-mono text-zinc-900">
                        {formatCurrency(shift.totalSales, currency, lang, exchangeRate)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold font-mono text-zinc-700">
                        {shift.difference}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-bold border ${
                            shift.status === 'open'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-300'
                          }`}
                        >
                          {shift.status === 'open' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {t('کراوە', 'Open')}
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3 text-zinc-500" />
                              {t('داخراوە', 'Closed')}
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Sales History Table */}
        {(subTab === 'sales' || subTab === 'all') && (
          <div className={`flex-1 overflow-auto min-h-0 ${subTab === 'all' ? 'border-t-2 border-zinc-900' : ''}`}>
            {subTab === 'all' && (
              <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-300 text-[11px] font-black text-zinc-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-zinc-600" />
                {t('مێژووی فرۆشتان', 'Sales History')}
              </div>
            )}
            <table className="w-full text-xs text-start border-collapse min-w-[700px]">
              <thead className="bg-zinc-900 text-white font-mono text-[11px] uppercase sticky top-0 z-10">
                <tr className="divide-x rtl:divide-x-reverse divide-zinc-800">
                  <th className="py-2.5 px-4 text-start font-sans">{t('ژمارەی وەصڵ', 'Receipt #')}</th>
                  <th className="py-2.5 px-4 text-center font-sans">{t('کاشێر', 'Cashier')}</th>
                  <th className="py-2.5 px-4 text-center font-sans">{t('بەروار و کات', 'Date & Time')}</th>
                  <th className="py-2.5 px-4 text-center font-sans">{t('کۆی گشتی', 'Grand Total')}</th>
                  <th className="py-2.5 px-4 text-center font-sans">{t('شێوازی پارەدان', 'Payment')}</th>
                  <th className="py-2.5 px-4 text-center font-sans">{t('کڕیار', 'Customer')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs font-sans">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400 font-bold">
                      {t('هیچ وەصڵێکی فرۆشتن نەدۆزرایەوە', 'No sales receipts found')}
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-zinc-50 divide-x rtl:divide-x-reverse divide-zinc-100 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-zinc-800 text-[11px]">
                        #{inv.invoiceNumber.replace('INV-', '')}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-zinc-800">
                        {inv.cashierName}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-zinc-500">
                        {inv.date} {inv.time}
                      </td>
                      <td className="py-3 px-4 text-center font-black font-mono text-zinc-900">
                        {formatCurrency(inv.grandTotal, currency, lang, exchangeRate)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-none text-[10px] font-bold border ${
                            inv.paymentMethod === 'cash'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          {inv.paymentMethod === 'cash' ? t('نەقد', 'Cash') : t('قەرز', 'Credit')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-zinc-700 font-medium">
                        {inv.customerName || <span className="text-zinc-300">—</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Close Shift Modal (Minimal Formal) ── */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md shadow-2xl font-sans text-zinc-900 overflow-hidden rounded-none">
            {/* Modal Header */}
            <div className="bg-zinc-900 text-white px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-400" />
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  {t('داخستنی شەفت و ژماردنی سندوق', 'Close Shift & Drawer Audit')}
                </h3>
              </div>
              <button onClick={() => setIsCloseModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCloseShiftSubmit} className="p-5 space-y-4 text-xs">
              {/* Expected Cash Banner */}
              <div className="bg-zinc-50 p-3.5 border border-zinc-200 flex justify-between items-center">
                <span className="font-bold text-zinc-700">{t('پارەی پێشبینیکراوی سندوق:', 'Expected Cash:')}</span>
                <span className="text-sm font-black font-mono text-zinc-900">{formatCurrency(expectedCash, currency, lang, exchangeRate)}</span>
              </div>

              {/* Actual Cash Input */}
              <div>
                <label className="font-bold text-zinc-800 block mb-1.5">
                  {t(`بڕی پارەی ژمێردراوی نەقد (${currency === 'IQD' ? 'د.ع' : '$'})`, `Actual Cash Counted (${currency})`)}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={actualCash}
                  onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 bg-white border border-zinc-300 focus:border-zinc-900 px-3 text-sm font-mono font-bold text-zinc-900 outline-none rounded-none shadow-2xs"
                />
              </div>

              {/* Variance Display */}
              <div className="bg-zinc-50 p-3.5 border border-zinc-200 flex justify-between items-center">
                <span className="font-bold text-zinc-700">{t('جیاوازی ژمێرەی پارە:', 'Cash Variance:')}</span>
                <span className={`text-sm font-black font-mono ${variance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {variance >= 0 ? `+${formatCurrency(variance, currency, lang, exchangeRate)}` : `-${formatCurrency(Math.abs(variance), currency, lang, exchangeRate)}`}
                </span>
              </div>

              {/* Close Notes */}
              <div>
                <label className="font-bold text-zinc-600 block mb-1.5">
                  {t('تێبینی داخستنی شەفت', 'Shift Closing Note')}
                </label>
                <input
                  type="text"
                  placeholder={t('تێبینی سەبارەت بە ژماردنی پارەی سندوق...', 'Notes regarding cash count...')}
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 focus:border-zinc-900 px-3 text-xs text-zinc-800 placeholder:text-zinc-400 outline-none rounded-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="h-9 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-none transition-colors cursor-pointer"
                >
                  {t('پاشگەزبوونەوە', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-none transition-colors cursor-pointer shadow-xs"
                >
                  {t('کۆتاییهێنان و داخستنی شەفت', 'Finalize & Close Shift')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Start New Shift Modal ── */}
      {isNewShiftModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md shadow-2xl font-sans text-zinc-900 overflow-hidden rounded-none">
            {/* Modal Header */}
            <div className="bg-zinc-900 text-white px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  {t('دەستپێکردنی شەفتی نوێی سندوق', 'Open Cashier Shift')}
                </h3>
              </div>
              <button onClick={() => setIsNewShiftModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleOpenShiftSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-800 block mb-1.5">
                  {t(`پارەی دەستپێکی سندوق (${currency === 'IQD' ? 'د.ع' : '$'})`, `Starting Float Cash (${currency})`)}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 bg-white border border-zinc-300 focus:border-zinc-900 px-3 text-sm font-mono font-bold text-zinc-900 outline-none rounded-none shadow-2xs"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewShiftModalOpen(false)}
                  className="h-9 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-none transition-colors cursor-pointer"
                >
                  {t('پاشگەزبوونەوە', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-none transition-colors cursor-pointer shadow-xs"
                >
                  {t('دەستپێکردنی شەفت', 'Open Shift')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Printable Shift Summary Modal (Using Isolated Print Helper) ── */}
      {isPrintShiftModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-zinc-300 w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col rounded-none text-zinc-900">
            {/* Modal Header */}
            <div className="bg-zinc-900 text-white px-5 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-zinc-300" />
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  {t('پێشبینینی چاپی ڕاپۆرتی شەفت', 'Shift Report Print Preview')}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintShift}
                  className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-none flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('چاپکردن', 'Print')}</span>
                </button>
                <button onClick={() => setIsPrintShiftModalOpen(false)} className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-zinc-100 flex justify-center">
              <div
                id="printable-shift-summary"
                className="p-6 bg-white space-y-4 text-zinc-900 font-sans border border-zinc-300 rounded-none w-full max-w-md shadow-none text-xs"
                dir={lang === 'ku' ? 'rtl' : 'ltr'}
              >
                <div className="border-b-2 border-zinc-900 pb-3 text-center">
                  <h1 className="text-base font-black uppercase text-zinc-900">
                    {t('پەراوگەی باران - ڕاپۆرتی شەفتی کاشێر', 'BARAN STATIONERY - CASHIER SHIFT REPORT')}
                  </h1>
                  <div className="text-[11px] text-zinc-500 mt-1 font-mono">
                    {t('کاشێر: ', 'Cashier: ')} {currentShift.userName} | {t('بەروار: ', 'Date: ')} {new Date().toLocaleDateString('en-GB')}
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono border-b border-zinc-200 pb-3">
                  <div className="flex justify-between">
                    <span>{t('کاتی دەستپێکردنی شەفت:', 'Shift Start Time:')}</span>
                    <span className="font-bold">{new Date(currentShift.startTime).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('دۆخی شەفت:', 'Shift Status:')}</span>
                    <span className="font-bold uppercase">{currentShift.status}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between p-2 bg-zinc-50 border border-zinc-200">
                    <span>{t('تێچووی سەرەتای سندوق:', 'Opening Float:')}</span>
                    <span className="font-bold">{formatCurrency(currentShift.openingFloat, currency, lang, exchangeRate)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-zinc-50 border border-zinc-200">
                    <span>{t('فرۆشتنی نەقدی شەفت:', 'Cash Sales:')}</span>
                    <span className="font-bold text-emerald-700">{formatCurrency(currentShift.cashSales, currency, lang, exchangeRate)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-zinc-50 border border-zinc-200">
                    <span>{t('فرۆشتنی قەرز:', 'Credit / Debt Sales:')}</span>
                    <span className="font-bold text-rose-700">{formatCurrency(currentShift.debtSales, currency, lang, exchangeRate)}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-zinc-900 text-white font-black text-xs mt-2">
                    <span className="font-sans">{t('کۆی گشتی پێشبینیکراو لە سندوق:', 'Total Expected In Drawer:')}</span>
                    <span>{formatCurrency(expectedCash, currency, lang, exchangeRate)}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-200 flex justify-between text-[11px] text-zinc-500 font-mono">
                  <div>
                    <div>{t('واژۆی کاشێر', 'Cashier Signature')}</div>
                    <div className="h-6"></div>
                    <div>___________________</div>
                  </div>
                  <div className="text-end">
                    <div>{t('واژۆی بەڕێوەبەر', 'Manager Signature')}</div>
                    <div className="h-6"></div>
                    <div>___________________</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
