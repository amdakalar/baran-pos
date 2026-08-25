import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Coins, 
  AlertTriangle, 
  Users, 
  Calendar, 
  Printer, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShoppingBag, 
  PieChart, 
  FileText,
  X
} from 'lucide-react';
import { SalesInvoice, Expense, Product, Customer } from '../types';
import { Currency, formatCurrency } from '../utils/currency';

interface ReportsManagerProps {
  invoices: SalesInvoice[];
  expenses: Expense[];
  products: Product[];
  customers: Customer[];
  lang?: 'en' | 'ku';
  currency?: Currency;
  exchangeRate?: number;
}

export const ReportsManager: React.FC<ReportsManagerProps> = ({
  invoices,
  expenses,
  products,
  customers,
  lang = 'ku',
  currency = 'IQD',
  exchangeRate = 1500,
}) => {
  const [reportRange, setReportRange] = React.useState<'today' | 'this_month' | 'all'>('all');
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false);

  // Current Date Helper Strings
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // 1. Filtered Invoices & Expenses based on Selected Date Range
  const filteredInvoices = invoices.filter((inv) => {
    if (inv.status !== 'completed') return false;
    if (reportRange === 'today') return inv.date.startsWith(todayStr);
    if (reportRange === 'this_month') return inv.date.startsWith(currentMonthStr);
    return true;
  });

  const filteredExpenses = expenses.filter((exp) => {
    if (reportRange === 'today') return exp.date.startsWith(todayStr);
    if (reportRange === 'this_month') return exp.date.startsWith(currentMonthStr);
    return true;
  });

  // 2. Financial Metrics Calculations
  const totalGrossRevenue = filteredInvoices.reduce((sum, i) => sum + i.grandTotal, 0);

  // Cost of Goods Sold (COGS) & Gross Profit
  let totalCOGS = 0;
  filteredInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      totalCOGS += (item.product.costPrice || 0) * item.quantity;
    });
  });

  const grossProfit = totalGrossRevenue - totalCOGS;

  // Expenses & Net Operating Profit
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  // Cash vs Debt/Credit Sales Split
  const cashSalesTotal = filteredInvoices
    .filter((i) => i.paymentMethod === 'cash')
    .reduce((sum, i) => sum + i.grandTotal, 0);
  
  const debtSalesTotal = filteredInvoices
    .filter((i) => i.paymentMethod === 'credit' || (i.paymentMethod as any) === 'debt')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  // Customer Total Outstanding Debt Balance
  const totalCustomerDebt = customers.reduce((sum, c) => sum + c.currentDebt, 0);

  // Low Stock Items Warning
  const lowStockItems = products.filter((p) => p.stockQuantity <= p.minStockAlert);

  // 3. Best-Selling Products Ranking Aggregation
  const productSalesMap: Record<string, { product: Product; qty: number; revenue: number; profit: number }> = {};
  filteredInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const pid = item.product.id;
      const itemRev = item.total;
      const itemCost = (item.product.costPrice || 0) * item.quantity;
      const itemProf = itemRev - itemCost;

      if (!productSalesMap[pid]) {
        productSalesMap[pid] = {
          product: item.product,
          qty: 0,
          revenue: 0,
          profit: 0,
        };
      }
      productSalesMap[pid].qty += item.quantity;
      productSalesMap[pid].revenue += itemRev;
      productSalesMap[pid].profit += itemProf;
    });
  });

  const topSellingProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // 4. Print Financial Statement Trigger (Open Preview Modal)
  const handlePrintReport = () => {
    setIsPrintModalOpen(true);
  };

  return (
    <div className="flex-1 bg-zinc-100 p-6 flex flex-col overflow-y-auto text-zinc-900 font-sans select-none">
      <div className="w-full space-y-4">
        {/* Formal Header Control Bar */}
        <div className="bg-zinc-900 text-white border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-none shadow-sm">
          <div>
            <h1 className="text-base font-black uppercase tracking-wider text-zinc-100 flex items-center gap-2 font-sans">
              <BarChart3 className="w-5 h-5 text-zinc-300" />
              {lang === 'ku' ? 'سیستەمی شیکاری و ڕاپۆرتی دارایی و قازانج' : 'Financial Analytics & Profit Statement'}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5 font-sans">
              {lang === 'ku' ? 'ژمێرکاریی دەقیقی داهات، تێچووی کاڵا، خەرجییەکان و قازانجی پاکی نەقد' : 'Accurate Real-Time Profit & Loss Analytics for Baran Stationers'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Date Range Buttons */}
            <div className="flex items-center bg-zinc-800 p-0.5 border border-zinc-700 rounded-none h-8">
              {[
                { id: 'all', labelEn: 'All Time', labelKu: 'هەموو کات' },
                { id: 'this_month', labelEn: 'This Month', labelKu: 'ئەم مانگە' },
                { id: 'today', labelEn: 'Today', labelKu: 'ئەمڕۆ' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setReportRange(r.id as any)}
                  className={`h-full px-3 font-bold uppercase text-[11px] transition-all rounded-none flex items-center justify-center ${
                    reportRange === r.id ? 'bg-white text-zinc-900' : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  {lang === 'ku' ? r.labelKu : r.labelEn}
                </button>
              ))}
            </div>

            {/* Print Report Action Button */}
            <button
              onClick={handlePrintReport}
              className="h-8 px-3 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-xs font-bold rounded-none flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              {lang === 'ku' ? 'چاپکردنی ڕاپۆرت' : 'Print Report'}
            </button>
          </div>
        </div>

        {/* Executive KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-sans">
          {/* Gross Revenue Card */}
          <div className="bg-white border border-zinc-300 p-4 space-y-1.5 rounded-none shadow-2xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                {lang === 'ku' ? 'کۆی داهاتی فرۆشتن' : 'Total Gross Revenue'}
              </span>
              <TrendingUp className="w-4 h-4 text-zinc-700" />
            </div>
            <span className="text-2xl font-black text-zinc-900 block font-mono">{formatCurrency(totalGrossRevenue, currency, lang, exchangeRate)}</span>
            <div className="text-[11px] text-zinc-500 flex justify-between items-center font-mono">
              <span>{filteredInvoices.length} {lang === 'ku' ? 'پسوڵەی تەواوکراو' : 'Invoices'}</span>
              <span className="text-zinc-700 font-bold">{lang === 'ku' ? `نەقد: ${cashSalesTotal.toLocaleString()}` : `Cash: ${cashSalesTotal.toLocaleString()}`}</span>
            </div>
          </div>

          {/* Cost of Goods Sold Card */}
          <div className="bg-white border border-zinc-300 p-4 space-y-1.5 rounded-none shadow-2xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                {lang === 'ku' ? 'تێچووی کاڵای فرۆشراو' : 'Cost of Goods Sold (COGS)'}
              </span>
              <Coins className="w-4 h-4 text-zinc-700" />
            </div>
            <span className="text-2xl font-bold text-zinc-700 block font-mono">{formatCurrency(totalCOGS, currency, lang, exchangeRate)}</span>
            <div className="text-[11px] text-zinc-500 font-mono">
              {lang === 'ku' ? 'تێچووی کڕینی سەرەتایی کاڵاکان' : 'Wholesale Product Costs'}
            </div>
          </div>

          {/* Expenses Card */}
          <div className="bg-white border border-zinc-300 p-4 space-y-1.5 rounded-none shadow-2xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">
                {lang === 'ku' ? 'کۆی خەرجییەکان' : 'Total Operating Expenses'}
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <span className="text-2xl font-black text-rose-700 block font-mono">{formatCurrency(totalExpenses, currency, lang, exchangeRate)}</span>
            <div className="text-[11px] text-zinc-500 font-mono">
              {filteredExpenses.length} {lang === 'ku' ? 'بڕگە لە خەرجییەکان' : 'Expense items'}
            </div>
          </div>

          {/* Net Profit Card */}
          <div className="bg-white border border-zinc-300 p-4 space-y-1.5 rounded-none shadow-2xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                {lang === 'ku' ? 'قازانجی پاکی نەقد' : 'Net Operating Profit'}
              </span>
              {netProfit >= 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-rose-600" />}
            </div>
            <span className={`text-2xl font-black block font-mono ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(netProfit, currency, lang, exchangeRate)}
            </span>
            <div className="text-[11px] text-zinc-500 font-mono">
              {lang === 'ku' ? 'قازانجی سەرەتایی minus خەرجی' : 'Gross Profit minus Expenses'}
            </div>
          </div>
        </div>

        {/* Detailed Financial Income Statement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main P&L Income Statement Box (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-zinc-300 p-5 space-y-4 rounded-none shadow-2xs">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-800" />
                {lang === 'ku' ? 'وردەکاری ڕاپۆرتی قازانج و زەرەر' : 'Detailed Profit & Loss Statement'}
              </h2>
              <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">
                {reportRange === 'today' ? (lang === 'ku' ? 'ئەمڕۆ' : 'Today') : reportRange === 'this_month' ? (lang === 'ku' ? 'ئەم مانگە' : 'This Month') : (lang === 'ku' ? 'گشتی' : 'All Time')}
              </span>
            </div>

            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between items-center py-2 border-b border-zinc-200">
                <span className="text-zinc-800 font-bold">{lang === 'ku' ? 'کۆی گشتی داهاتی فرۆشتن (+)' : 'Total Sales Revenue (+)'}</span>
                <span className="text-zinc-900 font-black font-mono">{formatCurrency(totalGrossRevenue, currency, lang, exchangeRate)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-zinc-200 ps-4 text-zinc-600">
                <span>{lang === 'ku' ? 'دابەزاندنی تێچووی کڕینی کاڵای فرۆشراو (-)' : 'Less: Cost of Goods Sold (COGS) (-)'}</span>
                <span className="font-mono text-zinc-700 font-bold">-{formatCurrency(totalCOGS, currency, lang, exchangeRate)}</span>
              </div>

              <div className="flex justify-between items-center py-2.5 border-b border-zinc-300 font-bold text-zinc-900 bg-zinc-50 px-3">
                <span>{lang === 'ku' ? 'کۆی قازانجی سەرەتایی (Gross Profit)' : 'GROSS PROFIT'}</span>
                <span className="font-mono font-black text-sm">{formatCurrency(grossProfit, currency, lang, exchangeRate)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-zinc-200 ps-4 text-zinc-600">
                <span>{lang === 'ku' ? 'دابەزاندنی خەرجیییەکانی کارکردن (-)' : 'Less: Total Operating Expenses (-)'}</span>
                <span className="font-mono text-rose-700 font-bold">-{formatCurrency(totalExpenses, currency, lang, exchangeRate)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border border-zinc-900 text-sm font-black text-white bg-zinc-900 px-4 mt-3 rounded-none shadow-xs">
                <span>{lang === 'ku' ? 'کۆی قازانجی پاکی نەقد (NET PROFIT)' : 'NET OPERATING PROFIT'}</span>
                <span className={`font-mono text-base ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(netProfit, currency, lang, exchangeRate)}
                </span>
              </div>
            </div>
          </div>

          {/* Top Selling Products & Auxiliary Metrics (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Top 5 Best-Selling Products Ranking */}
            <div className="bg-white border border-zinc-300 p-4 space-y-3 rounded-none shadow-2xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-zinc-800" />
                  {lang === 'ku' ? 'فرۆشراوترین کاڵاکان' : 'Top Selling Products'}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 font-normal">TOP 5</span>
              </h3>

              {topSellingProducts.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-400">
                  {lang === 'ku' ? 'هیچ فرۆشتنێک لەم ماوەیەدا نەدۆزرایەوە.' : 'No sales records in this period.'}
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 text-xs font-sans">
                  {topSellingProducts.map((item, idx) => (
                    <div key={item.product.id} className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-4 text-center font-mono font-bold text-zinc-400 text-[10px]">#{idx + 1}</span>
                        <div>
                          <div className="font-bold text-zinc-900">{lang === 'ku' ? (item.product.nameKu || item.product.name) : item.product.name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">{item.qty} {lang === 'ku' ? 'دانە فرۆشراوە' : 'units sold'}</div>
                        </div>
                      </div>
                      <div className="text-end font-mono">
                        <div className="font-bold text-zinc-900">{formatCurrency(item.revenue, currency, lang, exchangeRate)}</div>
                        <div className="text-[10px] text-emerald-700 font-bold">+{formatCurrency(item.profit, currency, lang, exchangeRate)} {lang === 'ku' ? 'قازانج' : 'profit'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Debt & Inventory Warning Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs font-sans">
              <div className="bg-white border border-zinc-300 p-3.5 space-y-1 rounded-none shadow-2xs">
                <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 block">{lang === 'ku' ? 'کۆی قەرزی کڕیاران:' : 'Customer Debt:'}</span>
                <span className="text-lg font-black text-rose-700 block font-mono">{formatCurrency(totalCustomerDebt, currency, lang, exchangeRate)}</span>
                <span className="text-[10px] text-zinc-500 block">{customers.filter((c) => c.currentDebt > 0).length} {lang === 'ku' ? 'کڕیار قەرزدارن' : 'debtors'}</span>
              </div>

              <div className="bg-white border border-zinc-300 p-3.5 space-y-1 rounded-none shadow-2xs">
                <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 block">{lang === 'ku' ? 'کەمی کۆگا:' : 'Low Stock:'}</span>
                <span className="text-lg font-black text-amber-700 block font-mono">{lowStockItems.length} {lang === 'ku' ? 'کاڵا' : 'Items'}</span>
                <span className="text-[10px] text-zinc-500 block">{lang === 'ku' ? 'پێویست بە کڕینەوەیە' : 'Needs reorder'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Printable Financial Statement Modal */}
        {isPrintModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-zinc-300 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl rounded-none text-zinc-900 font-sans">
              {/* Modal Control Header (hidden when printing) */}
              <div className="bg-zinc-900 text-white px-5 py-3 border-b border-zinc-800 flex items-center justify-between rounded-none print:hidden">
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-100 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-zinc-300" />
                  <span>{lang === 'ku' ? 'چاپکردنی ڕاپۆرتی دارایی' : 'Print Financial Statement'}</span>
                </h3>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Printable Body Content */}
              <div id="printable-financial-report" className="p-8 space-y-6 flex-1 overflow-y-auto">
                {/* Stationer Header */}
                <div className="border-b-2 border-black pb-4 text-center space-y-1">
                  <h1 className="text-xl font-black uppercase tracking-wider text-black font-sans">پەراوگەی باران / BARAN STATIONERY</h1>
                  <p className="text-xs text-zinc-700 font-mono">چاپخانە، کتێبخانە و حساباتی گشتی | بەڕێوەبەر: کاک على محمد</p>
                  <p className="text-[11px] text-zinc-600 font-mono">بەرواری ڕاپۆرت: {new Date().toLocaleDateString('en-GB')} | ماوەی ڕاپۆرت: {reportRange === 'today' ? 'ئەمڕۆ' : reportRange === 'this_month' ? 'ئەم مانگە' : 'گشتی'}</p>
                </div>

                {/* Printable Income Summary Table */}
                <div className="space-y-3">
                  <h2 className="text-sm font-black uppercase border-b border-black pb-1">وردەکاری ڕاپۆرتی قازانج و زەرەر</h2>
                  
                  <table className="w-full text-xs font-mono text-start border-collapse border border-black">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-black font-bold text-black">
                        <th className="p-2 text-start border-r border-black">بڕگە (Financial Item)</th>
                        <th className="p-2 text-end">بڕی بەیانکراو (IQD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-300">
                      <tr>
                        <td className="p-2 border-r border-black font-bold">کۆی گشتی داهاتی فرۆشتن (+)</td>
                        <td className="p-2 text-end font-black">{totalGrossRevenue.toLocaleString()} د.ع</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-black">دابەزاندنی تێچووی کڕینی کاڵای فرۆشراو (-)</td>
                        <td className="p-2 text-end text-zinc-700">-{totalCOGS.toLocaleString()} د.ع</td>
                      </tr>
                      <tr className="bg-zinc-50 font-bold border-t border-b border-black">
                        <td className="p-2 border-r border-black">کۆی قازانجی سەرەتایی (GROSS PROFIT)</td>
                        <td className="p-2 text-end font-black">{grossProfit.toLocaleString()} د.ع</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-black text-rose-700">دابەزاندنی خەرجیییەکانی کارکردن (-)</td>
                        <td className="p-2 text-end text-rose-700">-{totalExpenses.toLocaleString()} د.ع</td>
                      </tr>
                      <tr className="bg-black text-white font-black text-sm">
                        <td className="p-2.5 border-r border-zinc-700">کۆی قازانجی پاکی نەقد (NET OPERATING PROFIT)</td>
                        <td className="p-2.5 text-end font-mono">{netProfit.toLocaleString()} د.ع</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Cash vs Debt Breakdown */}
                <div className="grid grid-cols-2 gap-4 text-xs font-mono border border-black p-3">
                  <div>
                    <span className="font-bold block">فرۆشتنی نەقد:</span>
                    <span>{cashSalesTotal.toLocaleString()} د.ع</span>
                  </div>
                  <div>
                    <span className="font-bold block">فرۆشتنی بە قەرز:</span>
                    <span>{debtSalesTotal.toLocaleString()} د.ع</span>
                  </div>
                </div>

                {/* Signature Footer */}
                <div className="pt-8 flex justify-between items-center text-xs font-mono border-t border-zinc-300">
                  <div>
                    <div>ئامادەکاری ڕاپۆرت: سیستەمی باران POS</div>
                    <div>بەروار: {new Date().toLocaleTimeString('en-GB')}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold mb-6">مۆری فەرمی / ئیمزای بەڕێوەبەر</div>
                    <div className="text-zinc-500">کاک على محمد</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons (hidden when printing) */}
              <div className="p-4 border-t border-zinc-200 flex justify-end gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="h-9 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs rounded-none transition-colors"
                >
                  {lang === 'ku' ? 'داخستن' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-9 px-5 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-none flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  {lang === 'ku' ? 'چاپکردنی ڕاستەوخۆ' : 'Print Now'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
