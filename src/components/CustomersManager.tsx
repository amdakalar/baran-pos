import React from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Coins, 
  CreditCard, 
  History, 
  CheckCircle2, 
  Phone, 
  FileText,
  AlertTriangle,
  Printer,
  Edit2,
  X 
} from 'lucide-react';
import { Customer, CustomerPayment } from '../types';
import { Currency, formatCurrency } from '../utils/currency';

interface CustomersManagerProps {
  customers: Customer[];
  payments: CustomerPayment[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer?: (customer: Customer) => void;
  onReceivePayment: (payment: CustomerPayment) => void;
  onUpdatePayment?: (updatedPayment: CustomerPayment, oldPayment: CustomerPayment) => void;
  lang?: 'en' | 'ku';
  currency?: Currency;
  exchangeRate?: number;
}

export const CustomersManager: React.FC<CustomersManagerProps> = ({
  customers,
  payments,
  onAddCustomer,
  onUpdateCustomer,
  onReceivePayment,
  onUpdatePayment,
  lang = 'ku',
  currency = 'IQD',
  exchangeRate = 1500,
}) => {
  const [search, setSearch] = React.useState('');
  const [filterTab, setFilterTab] = React.useState<'all' | 'has_debt' | 'overdue_30' | 'over_limit'>('all');
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  const [isAddDebtModalOpen, setIsAddDebtModalOpen] = React.useState(false);
  const [isEditDebtBalanceModalOpen, setIsEditDebtBalanceModalOpen] = React.useState(false);
  const [isEditCustomerInfoModalOpen, setIsEditCustomerInfoModalOpen] = React.useState(false);
  const [editCustomerData, setEditCustomerData] = React.useState<Customer | null>(null);
  const [editDebtBalanceVal, setEditDebtBalanceVal] = React.useState<number>(0);
  const [editDebtBalanceDate, setEditDebtBalanceDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [editingPayment, setEditingPayment] = React.useState<CustomerPayment | null>(null);
  const [activePaymentReceipt, setActivePaymentReceipt] = React.useState<CustomerPayment | null>(null);
  const [isPrintDebtorsModalOpen, setIsPrintDebtorsModalOpen] = React.useState(false);

  // Form State for New Customer
  const [newCust, setNewCust] = React.useState<Partial<Customer>>({
    name: '',
    phone: '',
    creditLimit: 300000,
    currentDebt: 0,
    specialDiscountPercent: 0,
    notes: '',
    lastDebtDate: new Date().toISOString().split('T')[0],
  });

  // Form State for Debt Payment
  const [payAmount, setPayAmount] = React.useState<number>(0);
  const [payNote, setPayNote] = React.useState('');

  // Form State for Manual Add Debt
  const [addDebtAmount, setAddDebtAmount] = React.useState<number>(0);
  const [addDebtDate, setAddDebtDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [addDebtNote, setAddDebtNote] = React.useState('');

  const getOverdueDays = (c: Customer): number => {
    if (c.currentDebt <= 0) return 0;
    if (c.lastDebtDate) {
      const diffTime = new Date().getTime() - new Date(c.lastDebtDate).getTime();
      return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    }
    return c.id === 'cust_1' ? 35 : 10;
  };

  const overdueCustomers = customers.filter((c) => c.currentDebt > 0 && getOverdueDays(c) >= 30);
  const overLimitCustomers = customers.filter((c) => c.creditLimit > 0 && c.currentDebt > c.creditLimit);
  const debtorsCount = customers.filter((c) => c.currentDebt > 0).length;

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    if (!matchesSearch) return false;
    if (filterTab === 'has_debt') return c.currentDebt > 0;
    if (filterTab === 'overdue_30') return c.currentDebt > 0 && getOverdueDays(c) >= 30;
    if (filterTab === 'over_limit') return c.creditLimit > 0 && c.currentDebt > c.creditLimit;
    return true;
  });

  const totalDebtBalance = customers.reduce((acc, c) => acc + c.currentDebt, 0);

  const handleSaveCustomerInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomerData || !editCustomerData.name) return;

    const updated: Customer = {
      ...editCustomerData,
      creditLimit: Number(editCustomerData.creditLimit) || 0,
      specialDiscountPercent: Number(editCustomerData.specialDiscountPercent) || 0,
    };

    if (onUpdateCustomer) {
      onUpdateCustomer(updated);
    }
    setSelectedCustomer(updated);
    setIsEditCustomerInfoModalOpen(false);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name) return;

    const customer: Customer = {
      id: `cust_${Date.now()}`,
      name: newCust.name,
      phone: newCust.phone || '07700000000',
      creditLimit: newCust.creditLimit || 300000,
      currentDebt: newCust.currentDebt || 0,
      totalPurchases: 0,
      specialDiscountPercent: newCust.specialDiscountPercent || 0,
      notes: newCust.notes,
      lastDebtDate: newCust.lastDebtDate || (newCust.currentDebt ? new Date().toISOString().split('T')[0] : undefined),
    };

    onAddCustomer(customer);
    setIsAddModalOpen(false);
    setNewCust({
      name: '',
      phone: '',
      creditLimit: 300000,
      currentDebt: 0,
      specialDiscountPercent: 0,
      notes: '',
      lastDebtDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || payAmount <= 0) return;

    const payment: CustomerPayment = {
      id: `pay_${Date.now()}`,
      customerId: selectedCustomer.id,
      amount: payAmount,
      date: new Date().toISOString().split('T')[0],
      receivedBy: 'کاک على محمد',
      paymentMethod: 'cash',
      notes: payNote || (lang === 'ku' ? 'گەڕاندنەوەى قەرز' : 'Debt repayment'),
    };

    onReceivePayment(payment);
    setIsPaymentModalOpen(false);
    setPayAmount(0);
    setPayNote('');
    setActivePaymentReceipt(payment);
  };

  const handleSaveEditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    const original = payments.find((p) => p.id === editingPayment.id);
    if (!original) return;

    if (onUpdatePayment) {
      onUpdatePayment(editingPayment, original);
    }
    setEditingPayment(null);
  };

  const handleSaveNewDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || addDebtAmount <= 0) return;

    const updated: Customer = {
      ...selectedCustomer,
      currentDebt: selectedCustomer.currentDebt + addDebtAmount,
      lastDebtDate: addDebtDate || new Date().toISOString().split('T')[0],
    };

    if (onUpdateCustomer) {
      onUpdateCustomer(updated);
    }
    setSelectedCustomer(updated);
    setIsAddDebtModalOpen(false);
    setAddDebtAmount(0);
    setAddDebtNote('');
  };

  const handleSaveEditDebtBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const updated: Customer = {
      ...selectedCustomer,
      currentDebt: Math.max(0, editDebtBalanceVal),
      lastDebtDate: editDebtBalanceDate || new Date().toISOString().split('T')[0],
    };

    if (onUpdateCustomer) {
      onUpdateCustomer(updated);
    }
    setSelectedCustomer(updated);
    setIsEditDebtBalanceModalOpen(false);
  };

  const customerPayments = selectedCustomer
    ? payments.filter((p) => p.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="flex-1 bg-zinc-100 p-6 flex flex-col overflow-hidden text-zinc-900 font-sans select-none">
      {/* Top Header Controls Bar */}
      <div className="bg-white border border-zinc-300 p-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-none">
        <div>
          <h1 className="text-lg font-black uppercase text-zinc-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-800" />
            {lang === 'ku' ? 'سیستەمی قەرز و حساباتی کڕیاران' : 'Customer Credit & Ledger'}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {lang === 'ku' ? `کۆی کڕیاران: ${customers.length} | کۆی گشتی قەرز: ` : `Total Customers: ${customers.length} | Total Outstanding Debt: `}
            <span className="text-rose-700 font-black font-mono">{formatCurrency(totalDebtBalance, currency, lang, exchangeRate)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Print Debtors Report Button */}
          <button
            onClick={() => setIsPrintDebtorsModalOpen(true)}
            className="h-9 px-3.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-none flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'ku' ? 'چاپکردنی لیستی قەرزداران' : 'Print Debtors List'}</span>
          </button>

          {/* Add New Customer Button */}
          <button
            onClick={() => {
              setNewCust({
                name: '',
                phone: '',
                creditLimit: 300000,
                currentDebt: 0,
                specialDiscountPercent: 0,
                notes: '',
                lastDebtDate: new Date().toISOString().split('T')[0],
              });
              setIsAddModalOpen(true);
            }}
            className="h-9 px-4 bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-none transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ku' ? 'زیادکردنی کڕیاری نوێ' : 'Add New Customer'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Customer Directory & Detail Drawer */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
        {/* Customer Directory Panel */}
        <div className="md:col-span-2 bg-white border border-zinc-300 flex flex-col overflow-hidden rounded-none">
          {/* Unified Formal Header: Search, Overdue Alert, & Filter Tabs Bar */}
          <div className="bg-zinc-900 text-white border-b border-zinc-800 p-3 space-y-3 rounded-none font-sans">
            {/* Row 1: Integrated Live Search Bar + Filter Tabs */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Integrated Live Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
                <input
                  type="text"
                  placeholder={lang === 'ku' ? 'گەڕان بەدوای ناوى کڕیار یان ژمارەی مۆبایل...' : 'Search by customer name or phone...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 bg-zinc-800 border border-zinc-700 text-zinc-100 pl-9 rtl:pl-3 pr-3 rtl:pr-9 text-xs focus:border-white outline-none rounded-none placeholder:text-zinc-500"
                />
              </div>

              {/* Filter Tabs (All / Debtors / Overdue / Limit Exceeded) */}
              <div className="flex bg-zinc-950 p-0.5 border border-zinc-800 rounded-none text-xs shrink-0 flex-wrap">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`h-8 px-3 font-bold rounded-none transition-colors ${
                    filterTab === 'all' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {lang === 'ku' ? `هەموو (${customers.length})` : `All (${customers.length})`}
                </button>
                <button
                  onClick={() => setFilterTab('has_debt')}
                  className={`h-8 px-3 font-bold rounded-none transition-colors ${
                    filterTab === 'has_debt' ? 'bg-rose-700 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {lang === 'ku' ? `قەرزدارەکان (${debtorsCount})` : `Debtors (${debtorsCount})`}
                </button>
                <button
                  onClick={() => setFilterTab('overdue_30')}
                  className={`h-8 px-3 font-bold rounded-none transition-colors ${
                    filterTab === 'overdue_30' ? 'bg-amber-600 text-white font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {lang === 'ku' ? `دواکەوتووی ۳۰ ڕۆژ (${overdueCustomers.length})` : `Overdue 30+ (${overdueCustomers.length})`}
                </button>
                <button
                  onClick={() => setFilterTab('over_limit')}
                  className={`h-8 px-3 font-bold rounded-none transition-colors ${
                    filterTab === 'over_limit' ? 'bg-rose-600 text-white font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {lang === 'ku' ? `تێپەڕاندنی سنوور (${overLimitCustomers.length})` : `Over Limit (${overLimitCustomers.length})`}
                </button>
              </div>
            </div>

            {/* Row 2: Credit Limit Breach & Overdue Alerts Sub-bars */}
            {overLimitCustomers.length > 0 && (
              <div className="bg-rose-950/80 border border-rose-800 px-3 py-2 flex items-center justify-between gap-2 text-rose-200 text-xs rounded-none">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-bold">
                    {lang === 'ku'
                      ? `ئاگاداری سنووری قەرز: ${overLimitCustomers.length} کڕیار لە بەرزترین سنووری دیاریکراوی قەرز تێپەڕیون!`
                      : `Credit Limit Alert: ${overLimitCustomers.length} customer(s) have exceeded their maximum credit limit!`}
                  </span>
                </div>
                <button
                  onClick={() => setFilterTab('over_limit')}
                  className="h-6 px-2.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-none transition-colors whitespace-nowrap"
                >
                  {lang === 'ku' ? 'پیشاندانی تێپەڕیوەکان' : 'Filter Over Limit'}
                </button>
              </div>
            )}

            {overdueCustomers.length > 0 && (
              <div className="bg-amber-950/70 border border-amber-800/80 px-3 py-2 flex items-center justify-between gap-2 text-amber-200 text-xs rounded-none">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-bold">
                    {lang === 'ku'
                      ? `ئاگاداری قەرز: ${overdueCustomers.length} کڕیار زیاتر لە ۳۰ ڕۆژە قەرزی دواکەوتووە.`
                      : `Debt Alert: ${overdueCustomers.length} customer(s) carry 30+ days overdue debt.`}
                  </span>
                </div>
                <button
                  onClick={() => setFilterTab('overdue_30')}
                  className="h-6 px-2.5 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold rounded-none transition-colors whitespace-nowrap"
                >
                  {lang === 'ku' ? 'فلتەرکردنی دواکەوتووەکان' : 'Filter 30+ Overdue'}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-zinc-100 text-zinc-600 font-mono text-[10px] uppercase border-b border-zinc-200 sticky top-0">
                <tr>
                  <th className="p-3 text-start">{lang === 'ku' ? 'ناوی کڕیار' : 'Customer Name'}</th>
                  <th className="p-3 text-start">{lang === 'ku' ? 'مۆبایل' : 'Phone'}</th>
                  <th className="p-3 text-start">{lang === 'ku' ? 'بەرزترین سنووری قەرز' : 'Credit Limit'}</th>
                  <th className="p-3 text-start">{lang === 'ku' ? 'داشکاندنی تایبەت' : 'Special Discount'}</th>
                  <th className="p-3 text-start">{lang === 'ku' ? 'کۆی کڕین' : 'Total Purchases'}</th>
                  <th className="p-3 text-start">{lang === 'ku' ? 'قەرز' : 'Current Debt'}</th>
                  <th className="p-3 text-end">{lang === 'ku' ? 'کردارەکان' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-mono">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-400 text-xs font-sans">
                      {lang === 'ku' ? 'هیچ کڕیارێک نەدۆزرایەوە.' : 'No customers matched your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => {
                    const daysOverdue = getOverdueDays(c);
                    const isOverdue30 = c.currentDebt > 0 && daysOverdue >= 30;
                    const isOverLimit = c.creditLimit > 0 && c.currentDebt > c.creditLimit;

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className={`cursor-pointer transition-colors ${
                          selectedCustomer?.id === c.id
                            ? 'bg-zinc-200 border-s-4 border-black'
                            : isOverLimit
                            ? 'bg-rose-50/70 hover:bg-rose-100/80 border-s-2 border-rose-600'
                            : isOverdue30
                            ? 'bg-amber-50/60 hover:bg-amber-100/70'
                            : 'hover:bg-zinc-50'
                        }`}
                      >
                        <td className="p-3 font-bold text-zinc-900 font-sans">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{c.name}</span>
                            {isOverLimit && (
                              <span className="text-[9px] font-mono font-bold bg-rose-600 text-white px-1.5 py-0.2 rounded-none">
                                {lang === 'ku' ? '⚠️ تێپەڕاندنی سنوور' : '⚠️ Over Limit'}
                              </span>
                            )}
                            {isOverdue30 && (
                              <span className="text-[9px] font-mono font-bold bg-amber-600 text-white px-1.5 py-0.2 rounded-none">
                                {lang === 'ku' ? `${daysOverdue} ڕۆژ دواکەوتووە` : `${daysOverdue}d overdue`}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-zinc-600">{c.phone || '-'}</td>
                        <td className="p-3 text-zinc-800 font-bold">
                          {formatCurrency(c.creditLimit, currency, lang, exchangeRate)}
                        </td>
                        <td className="p-3 text-zinc-700">
                          {c.specialDiscountPercent ? `${c.specialDiscountPercent}%` : '-'}
                        </td>
                        <td className="p-3 text-zinc-900 font-bold">
                          {formatCurrency(c.totalPurchases, currency, lang, exchangeRate)}
                        </td>
                        <td className="p-3">
                          {c.currentDebt > 0 ? (
                            <div className="space-y-0.5">
                              <span className={`font-black ${isOverLimit ? 'text-rose-700' : 'text-zinc-900'}`}>
                                {formatCurrency(c.currentDebt, currency, lang, exchangeRate)}
                              </span>
                              {isOverLimit && (
                                <span className="block text-[9px] text-rose-600 font-bold font-sans">
                                  {lang === 'ku'
                                    ? `+${formatCurrency(c.currentDebt - c.creditLimit, currency, lang, exchangeRate)} زیاترە`
                                    : `+${formatCurrency(c.currentDebt - c.creditLimit, currency, lang, exchangeRate)} excess`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-emerald-700 font-bold">{lang === 'ku' ? 'پاککراوە' : 'Clean'}</span>
                          )}
                        </td>
                        <td className="p-3 text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditCustomerData({ ...c });
                                setIsEditCustomerInfoModalOpen(true);
                              }}
                              className="h-8 px-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 text-[11px] font-bold uppercase rounded-none transition-colors"
                              title={lang === 'ku' ? 'دەستکاریکردنی زانیاری و سنووری قەرز' : 'Edit customer info & credit limit'}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            {c.currentDebt > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCustomer(c);
                                  setPayAmount(0);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="h-8 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold uppercase rounded-none transition-colors whitespace-nowrap"
                              >
                                {lang === 'ku' ? 'گەڕاندنەوەى قەرز' : 'Debt Repayment'}
                              </button>
                            )}
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

        {/* Selected Customer Ledger (Ultra-Minimal & Formal Redesign) */}
        <div className="bg-white border border-zinc-300 flex flex-col overflow-hidden rounded-none">
          {selectedCustomer ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header Box */}
              <div className="p-4 bg-zinc-900 text-white space-y-3 rounded-none">
                <div className="border-b border-zinc-800 pb-2 flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold tracking-wider block">
                      {lang === 'ku' ? 'حساباتی کڕیار' : 'Customer Ledger'}
                    </span>
                    <h3 className="font-extrabold text-base text-zinc-100 font-sans leading-snug break-words">
                      {selectedCustomer.name}
                    </h3>
                    {selectedCustomer.phone && (
                      <span className="text-xs text-zinc-400 font-mono block">{selectedCustomer.phone}</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setEditCustomerData({ ...selectedCustomer });
                      setIsEditCustomerInfoModalOpen(true);
                    }}
                    className="h-7 px-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[11px] font-bold flex items-center gap-1 rounded-none transition-colors shrink-0 cursor-pointer"
                    title={lang === 'ku' ? 'دەستکاریکردنی زانیاری کڕیار و سنووری قەرز' : 'Edit Customer Info'}
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{lang === 'ku' ? 'دەستکاری' : 'Edit'}</span>
                  </button>
                </div>

                {/* Over Limit Alert Banner if customer is exceeding limit */}
                {selectedCustomer.creditLimit > 0 && selectedCustomer.currentDebt > selectedCustomer.creditLimit && (
                  <div className="bg-rose-950/80 border border-rose-700 p-2.5 flex items-start gap-2 text-rose-200 text-xs rounded-none">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-black text-rose-300 block">
                        {lang === 'ku' ? '⚠️ ئاگاداری: تێپەڕاندنی سنووری قەرز!' : '⚠️ Credit Limit Exceeded!'}
                      </span>
                      <span className="text-[11px] text-rose-300">
                        {lang === 'ku'
                          ? `قەرزی ئەم کڕیارە بە بڕی ${formatCurrency(selectedCustomer.currentDebt - selectedCustomer.creditLimit, currency, lang, exchangeRate)} لە بەرزترین سنووری دیاریکراو تێپەڕیوە.`
                          : `Exceeded credit limit by ${formatCurrency(selectedCustomer.currentDebt - selectedCustomer.creditLimit, currency, lang, exchangeRate)}.`}
                      </span>
                    </div>
                  </div>
                )}

                {/* 2 Stat Cards: Credit Limit & Current Debt */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-zinc-800">
                  <div className="bg-zinc-800/90 p-2.5 border border-zinc-700 rounded-none space-y-1">
                    <span className="text-[9px] uppercase text-zinc-400 font-bold block">{lang === 'ku' ? 'بەرزترین سنووری قەرز' : 'Credit Limit'}</span>
                    <span className="text-zinc-100 font-extrabold text-xs block">{formatCurrency(selectedCustomer.creditLimit, currency, lang, exchangeRate)}</span>
                    <span className="text-[10px] text-zinc-400 font-sans block">
                      {lang === 'ku' ? 'ماوەی بەردەست: ' : 'Remaining: '}
                      <span className={selectedCustomer.creditLimit - selectedCustomer.currentDebt < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {formatCurrency(Math.max(0, selectedCustomer.creditLimit - selectedCustomer.currentDebt), currency, lang, exchangeRate)}
                      </span>
                    </span>
                  </div>
                  <div
                    onClick={() => {
                      setEditDebtBalanceVal(selectedCustomer.currentDebt);
                      setEditDebtBalanceDate(selectedCustomer.lastDebtDate || new Date().toISOString().split('T')[0]);
                      setIsEditDebtBalanceModalOpen(true);
                    }}
                    className="bg-zinc-950 p-2.5 border border-zinc-800 rounded-none flex items-center justify-between cursor-pointer hover:border-rose-500/50 transition-colors group"
                    title={lang === 'ku' ? 'کلیک بکە بۆ دەستکاریکردنی قەرزی ئێستا' : 'Click to edit current debt'}
                  >
                    <div>
                      <span className="text-[9px] uppercase text-rose-400 font-bold flex items-center gap-1">
                        <span>{lang === 'ku' ? 'قەرزی ئێستا' : 'Current Debt'}</span>
                        <Edit2 className="w-2.5 h-2.5 text-rose-400 opacity-60 group-hover:opacity-100" />
                      </span>
                      <span className="text-rose-400 font-black text-xs block mt-1">{formatCurrency(selectedCustomer.currentDebt, currency, lang, exchangeRate)}</span>
                    </div>
                  </div>
                </div>

                {/* Debt Action Buttons: Add Debt & Repay Debt (Formal Monochromatic) */}
                <div className="flex gap-2 font-sans pt-1">
                  <button
                    onClick={() => {
                      setAddDebtAmount(0);
                      setAddDebtDate(new Date().toISOString().split('T')[0]);
                      setAddDebtNote('');
                      setIsAddDebtModalOpen(true);
                    }}
                    className="flex-1 h-9 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-none border border-zinc-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'ku' ? 'زیادکردنی قەرزی نوێ' : 'Add Debt'}</span>
                  </button>

                  {selectedCustomer.currentDebt > 0 && (
                    <button
                      onClick={() => {
                        setPayAmount(0);
                        setIsPaymentModalOpen(true);
                      }}
                      className="flex-1 h-9 bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs rounded-none transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-zinc-950" />
                      <span>{lang === 'ku' ? 'گەڕاندنەوەى قەرز' : 'Debt Repayment'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Repayment History List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                <div className="text-[10px] font-mono uppercase font-bold text-zinc-600 mb-1 flex items-center justify-between border-b border-zinc-200 pb-1.5">
                  <span className="flex items-center gap-1 font-sans text-zinc-900">
                    <History className="w-3.5 h-3.5 text-zinc-800" />
                    {lang === 'ku' ? 'مێژووی گەڕاندنەوەی قەرز' : 'Repayment History'}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400 font-mono">({customerPayments.length})</span>
                </div>

                {customerPayments.length === 0 ? (
                  <div className="text-center py-10 text-zinc-400 text-xs font-mono">
                    {lang === 'ku' ? 'هیچ وەصڵێکی گەڕاندنەوەی قەرز تۆمار نەکراوە.' : 'No payment receipts logged yet.'}
                  </div>
                ) : (
                  customerPayments.map((pay) => (
                    <div key={pay.id} className="bg-white p-3 border border-zinc-300 text-xs font-mono space-y-2 rounded-none hover:border-zinc-500 transition-colors shadow-2xs">
                      <div className="flex justify-between items-center border-b border-zinc-100 pb-1.5">
                        <span className="font-black text-zinc-900 text-xs font-sans flex items-center gap-1">
                          <span className="text-zinc-500 text-[10px] font-mono font-normal">{lang === 'ku' ? 'دراوەتەوە:' : 'Paid:'}</span>
                          <span className="text-emerald-800">{formatCurrency(pay.amount, currency, lang, exchangeRate)}</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 border border-zinc-200">{pay.date}</span>
                      </div>
                      
                      <div className="text-[10px] text-zinc-600 flex justify-between items-center gap-2">
                        <span className="truncate font-sans font-medium">{pay.receivedBy} {pay.notes ? `• ${pay.notes}` : ''}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditingPayment(pay)}
                            className="h-6 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 font-bold text-[10px] flex items-center gap-1 rounded-none transition-colors"
                            title={lang === 'ku' ? 'دەستکاریکردنی وەصڵ' : 'Edit Receipt'}
                          >
                            <Edit2 className="w-3 h-3 text-zinc-700" />
                            <span>{lang === 'ku' ? 'دەستکاری' : 'Edit'}</span>
                          </button>
                          <button
                            onClick={() => setActivePaymentReceipt(pay)}
                            className="h-6 px-2 bg-black hover:bg-zinc-800 text-white font-bold text-[10px] flex items-center gap-1 rounded-none transition-colors"
                            title={lang === 'ku' ? 'چاپکردنی وەصڵ' : 'Print Receipt'}
                          >
                            <Printer className="w-3 h-3" />
                            <span>{lang === 'ku' ? 'چاپکردن' : 'Print'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400 text-xs font-sans space-y-2">
              <Users className="w-8 h-8 text-zinc-300" />
              <span>{lang === 'ku' ? 'کڕیارێک هەڵبژێرە بۆ بینینی مێژووی قەرز و حساباتەکەی.' : 'Select a customer to view ledger history.'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Edit Repayment Receipt Modal */}
      {editingPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md p-5 space-y-4 shadow-2xl rounded-none font-sans text-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-zinc-800" />
                <span>{lang === 'ku' ? 'دەستکاریکردنی وەصڵی گەڕاندنەوەی قەرز' : 'Edit Debt Repayment Receipt'}</span>
              </h3>
              <button onClick={() => setEditingPayment(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPayment} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-600 block mb-1">
                  {lang === 'ku' ? `بڕی پارەی وەرگیراو (${currency === 'IQD' ? 'د.ع' : '$'}) *` : `Amount Received (${currency === 'IQD' ? 'IQD' : '$'}) *`}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  step="any"
                  value={editingPayment.amount || ''}
                  onChange={(e) => setEditingPayment({ ...editingPayment, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 font-mono font-black text-sm focus:border-black outline-none rounded-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-600 block mb-1 font-mono">
                  {lang === 'ku' ? 'بەرواری گەڕاندنەوە' : 'Payment Date'}
                </label>
                <input
                  type="date"
                  required
                  value={editingPayment.date}
                  onChange={(e) => setEditingPayment({ ...editingPayment, date: e.target.value })}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 font-mono text-xs focus:border-black outline-none rounded-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-600 block mb-1 font-sans">
                  {lang === 'ku' ? 'تێبینی وەصڵ' : 'Receipt Note'}
                </label>
                <input
                  type="text"
                  value={editingPayment.notes || ''}
                  onChange={(e) => setEditingPayment({ ...editingPayment, notes: e.target.value })}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 focus:border-black outline-none rounded-none text-xs font-sans"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="h-9 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs rounded-none transition-colors"
                >
                  {lang === 'ku' ? 'هەڵوەشاندنەوە' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-none transition-colors"
                >
                  {lang === 'ku' ? 'پاشەکەوتکردنی گۆڕانکارییەکان' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md p-5 space-y-4 shadow-2xl rounded-none font-sans text-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-zinc-900">
                {lang === 'ku' ? 'تۆمارکردنی کڕیاری نوێ' : 'Register New Customer Account'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-600 block mb-1">
                  {lang === 'ku' ? 'ناوی کڕیار *' : 'Customer Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ku' ? 'نموونە: نوسینگەی کاروان / کاک سۆران' : 'e.g. Karwan Bureau / Soran Lawyer'}
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 focus:border-black outline-none rounded-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-600 block mb-1">
                  {lang === 'ku' ? 'ژمارەی مۆبایل' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="0770 000 0000"
                  value={newCust.phone}
                  onChange={(e) => setNewCust({ ...newCust, phone: e.target.value.replace(/\D/g, '') })}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 focus:border-black outline-none rounded-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-600 block mb-1">
                    {lang === 'ku' ? `بەرزترین سنووری قەرز (${currency === 'IQD' ? 'د.ع' : '$'})` : `Credit Limit (${currency === 'IQD' ? 'IQD' : '$'})`}
                  </label>
                  <input
                    type="number"
                    value={newCust.creditLimit}
                    onChange={(e) => setNewCust({ ...newCust, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 focus:border-black outline-none rounded-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-800 block mb-1">
                    {lang === 'ku' ? 'داشکاندنی تایبەت (%)' : 'Special Discount (%)'}
                  </label>
                  <input
                    type="number"
                    value={newCust.specialDiscountPercent}
                    onChange={(e) => setNewCust({ ...newCust, specialDiscountPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 font-bold focus:border-black outline-none rounded-none font-mono"
                  />
                </div>
              </div>

              {/* Initial Debt & Debt Date Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
                <div>
                  <label className="text-[10px] uppercase font-bold text-rose-700 block mb-1">
                    {lang === 'ku' ? `بڕی قەرزی سەرەتایی (${currency === 'IQD' ? 'د.ع' : '$'})` : `Initial Debt (${currency === 'IQD' ? 'IQD' : '$'})`}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={newCust.currentDebt || ''}
                    placeholder="0"
                    onChange={(e) => setNewCust({ ...newCust, currentDebt: parseFloat(e.target.value) || 0 })}
                    className="w-full h-9 bg-white border border-zinc-300 px-3 text-rose-700 font-bold focus:border-black outline-none rounded-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-700 block mb-1">
                    {lang === 'ku' ? 'بەرواری قەرز (تۆمار/دواکەوتن)' : 'Debt Date'}
                  </label>
                  <input
                    type="date"
                    value={newCust.lastDebtDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNewCust({ ...newCust, lastDebtDate: e.target.value })}
                    className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 focus:border-black outline-none rounded-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Initial Debt Exceeding Credit Limit Live Alert */}
              {(newCust.currentDebt || 0) > (newCust.creditLimit || 0) && (newCust.creditLimit || 0) > 0 && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2 font-bold animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    {lang === 'ku'
                      ? `ئاگاداری: قەرزی سەرەتایی زیاترە لە بەرزترین سنووری دیاریکراو بە بڕی ${formatCurrency((newCust.currentDebt || 0) - (newCust.creditLimit || 0), currency, lang, exchangeRate)}!`
                      : `Warning: Initial debt exceeds credit limit by ${formatCurrency((newCust.currentDebt || 0) - (newCust.creditLimit || 0), currency, lang, exchangeRate)}!`}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-9 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs rounded-none transition-colors"
                >
                  {lang === 'ku' ? 'هەڵوەشاندنەوە' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-none transition-colors"
                >
                  {lang === 'ku' ? 'پاشەکەوتکردن' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Info Modal */}
      {isEditCustomerInfoModalOpen && editCustomerData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md p-5 space-y-4 shadow-2xl rounded-none font-sans text-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-zinc-800" />
                <span>{lang === 'ku' ? 'دەستکاریکردنی زانیاری کڕیار و سنووری قەرز' : 'Edit Customer Info & Credit Limit'}</span>
              </h3>
              <button onClick={() => setIsEditCustomerInfoModalOpen(false)} className="text-zinc-400 hover:text-zinc-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerInfo} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-600 block mb-1">
                  {lang === 'ku' ? 'ناوی کڕیار *' : 'Customer Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={editCustomerData.name}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, name: e.target.value })}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 focus:border-black outline-none rounded-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-600 block mb-1">
                  {lang === 'ku' ? 'ژمارەی مۆبایل' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="0770 000 0000"
                  value={editCustomerData.phone || ''}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, phone: e.target.value.replace(/\D/g, '') })}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 focus:border-black outline-none rounded-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-700 block mb-1">
                    {lang === 'ku' ? `بەرزترین سنووری قەرز (${currency === 'IQD' ? 'د.ع' : '$'})` : `Credit Limit (${currency === 'IQD' ? 'IQD' : '$'})`}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={editCustomerData.creditLimit}
                    onChange={(e) => setEditCustomerData({ ...editCustomerData, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 font-bold focus:border-black outline-none rounded-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-800 block mb-1">
                    {lang === 'ku' ? 'داشکاندنی تایبەت (%)' : 'Special Discount (%)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editCustomerData.specialDiscountPercent || 0}
                    onChange={(e) => setEditCustomerData({ ...editCustomerData, specialDiscountPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 font-bold focus:border-black outline-none rounded-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-600 block mb-1">
                  {lang === 'ku' ? 'تێبینی' : 'Notes'}
                </label>
                <input
                  type="text"
                  value={editCustomerData.notes || ''}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, notes: e.target.value })}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 focus:border-black outline-none rounded-none text-xs"
                />
              </div>

              {editCustomerData.currentDebt > (editCustomerData.creditLimit || 0) && (editCustomerData.creditLimit || 0) > 0 && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    {lang === 'ku'
                      ? `قەرزی ئێستا (${formatCurrency(editCustomerData.currentDebt, currency, lang, exchangeRate)}) لەم سنوورە نوێیە زیاترە!`
                      : `Current debt (${formatCurrency(editCustomerData.currentDebt, currency, lang, exchangeRate)}) exceeds this new limit!`}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => setIsEditCustomerInfoModalOpen(false)}
                  className="h-9 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs rounded-none transition-colors cursor-pointer"
                >
                  {lang === 'ku' ? 'هەڵوەشاندنەوە' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-none transition-colors cursor-pointer"
                >
                  {lang === 'ku' ? 'پاشەکەوتکردنی گۆڕانکارییەکان' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Debt Modal for Existing Customer */}
      {isAddDebtModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md p-5 space-y-4 shadow-2xl rounded-none font-sans text-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                <span>{lang === 'ku' ? 'زیادکردنی قەرزی نوێ بۆ:' : 'Add New Debt for:'}</span>
                <span className="font-black text-rose-700">{selectedCustomer.name}</span>
              </h3>
              <button onClick={() => setIsAddDebtModalOpen(false)} className="text-zinc-400 hover:text-zinc-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewDebt} className="space-y-4">
              {/* Credit Limit & Debt Status Overview */}
              <div className="bg-zinc-50 p-3 border border-zinc-200 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-zinc-600 font-sans">
                  <span>{lang === 'ku' ? 'بەرزترین سنووری قەرز:' : 'Credit Limit:'}</span>
                  <span className="font-bold text-zinc-900 font-mono">{formatCurrency(selectedCustomer.creditLimit, currency, lang, exchangeRate)}</span>
                </div>
                <div className="flex justify-between text-zinc-600 font-sans">
                  <span>{lang === 'ku' ? 'قەرزی ئێستا:' : 'Current Debt:'}</span>
                  <span className="font-bold text-rose-700 font-mono">{formatCurrency(selectedCustomer.currentDebt, currency, lang, exchangeRate)}</span>
                </div>
                <div className="flex justify-between text-zinc-900 font-bold border-t border-zinc-200 pt-1 font-sans">
                  <span>{lang === 'ku' ? 'کۆی قەرز پاش ئەم زیادکردنە:' : 'Projected Debt:'}</span>
                  <span className={`font-mono ${selectedCustomer.creditLimit > 0 && selectedCustomer.currentDebt + addDebtAmount > selectedCustomer.creditLimit ? 'text-rose-700 font-black' : 'text-zinc-900'}`}>
                    {formatCurrency(selectedCustomer.currentDebt + addDebtAmount, currency, lang, exchangeRate)}
                  </span>
                </div>
              </div>

              {/* Limit Breach Alert */}
              {selectedCustomer.creditLimit > 0 && selectedCustomer.currentDebt + addDebtAmount > selectedCustomer.creditLimit && addDebtAmount > 0 && (
                <div className="p-3 bg-rose-50 border-2 border-rose-500 text-rose-900 text-xs flex items-start gap-2 rounded-none animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-black block">
                      {lang === 'ku' ? '⚠️ ئاگاداری: تێپەڕاندنی سنووری قەرز!' : '⚠️ Credit Limit Breach Warning!'}
                    </span>
                    <p className="text-[11px] text-rose-800">
                      {lang === 'ku'
                        ? `ئەم بڕە قەرزە دەبێتە هۆی تێپەڕاندنی بەرزترین سنوور بە بڕی ${formatCurrency(selectedCustomer.currentDebt + addDebtAmount - selectedCustomer.creditLimit, currency, lang, exchangeRate)}.`
                        : `This debt amount will exceed the credit limit by ${formatCurrency(selectedCustomer.currentDebt + addDebtAmount - selectedCustomer.creditLimit, currency, lang, exchangeRate)}.`}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold text-rose-700 block mb-1">
                  {lang === 'ku' ? `بڕی قەرزی نوێ (${currency === 'IQD' ? 'د.ع' : '$'}) *` : `New Debt Amount (${currency === 'IQD' ? 'IQD' : '$'}) *`}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  step="any"
                  value={addDebtAmount || ''}
                  placeholder="0"
                  onChange={(e) => setAddDebtAmount(parseFloat(e.target.value) || 0)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-rose-700 font-mono font-black text-sm focus:border-black outline-none rounded-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-700 block mb-1">
                  {lang === 'ku' ? 'بەرواری قەرز (تۆمارکردن)' : 'Debt Date'}
                </label>
                <input
                  type="date"
                  required
                  value={addDebtDate}
                  onChange={(e) => setAddDebtDate(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 font-mono text-xs focus:border-black outline-none rounded-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-600 block mb-1">
                  {lang === 'ku' ? 'تێبینی' : 'Notes'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'ku' ? 'هۆکاری قەرز، پسوڵە یان تێبینی...' : 'Reason, Invoice ref or notes...'}
                  value={addDebtNote}
                  onChange={(e) => setAddDebtNote(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 focus:border-black outline-none rounded-none text-xs"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDebtModalOpen(false)}
                  className="h-9 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs rounded-none transition-colors"
                >
                  {lang === 'ku' ? 'هەڵوەشاندنەوە' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-none transition-colors"
                >
                  {lang === 'ku' ? 'پاشەکەوتکردن' : 'Save Debt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Current Debt Balance Modal */}
      {isEditDebtBalanceModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md p-5 space-y-4 shadow-2xl rounded-none font-sans text-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-zinc-800" />
                <span>{lang === 'ku' ? 'دەستکاریکردنی ڕاستەوخۆی قەرزی ئێستا:' : 'Direct Edit Current Debt:'}</span>
                <span className="font-black text-rose-700">{selectedCustomer.name}</span>
              </h3>
              <button onClick={() => setIsEditDebtBalanceModalOpen(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDebtBalance} className="space-y-4">
              {/* Credit Limit Alert in Edit Debt Modal */}
              {selectedCustomer.creditLimit > 0 && editDebtBalanceVal > selectedCustomer.creditLimit && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2 font-bold animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    {lang === 'ku'
                      ? `ئاگاداری: ئەم بڕە بە ${formatCurrency(editDebtBalanceVal - selectedCustomer.creditLimit, currency, lang, exchangeRate)} لە بەرزترین سنووری قەرز (${formatCurrency(selectedCustomer.creditLimit, currency, lang, exchangeRate)}) زیاترە!`
                      : `Warning: This debt exceeds the credit limit (${formatCurrency(selectedCustomer.creditLimit, currency, lang, exchangeRate)}) by ${formatCurrency(editDebtBalanceVal - selectedCustomer.creditLimit, currency, lang, exchangeRate)}!`}
                  </span>
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold text-rose-700 block mb-1 font-sans">
                  {lang === 'ku' ? `بڕی نوێی قەرزی ئێستا (${currency === 'IQD' ? 'د.ع' : '$'}) *` : `New Current Debt Amount (${currency === 'IQD' ? 'IQD' : '$'}) *`}
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="any"
                  value={editDebtBalanceVal}
                  onChange={(e) => setEditDebtBalanceVal(parseFloat(e.target.value) || 0)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-rose-700 font-mono font-black text-sm focus:border-black outline-none rounded-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-700 block mb-1 font-mono">
                  {lang === 'ku' ? 'بەرواری قەرز (تۆمار/دواکەوتن)' : 'Debt Reference Date'}
                </label>
                <input
                  type="date"
                  required
                  value={editDebtBalanceDate}
                  onChange={(e) => setEditDebtBalanceDate(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 font-mono text-xs focus:border-black outline-none rounded-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => setIsEditDebtBalanceModalOpen(false)}
                  className="h-9 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs rounded-none transition-colors"
                >
                  {lang === 'ku' ? 'هەڵوەشاندنەوە' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-none transition-colors"
                >
                  {lang === 'ku' ? 'پاشەکەوتکردنی گۆڕانکارییەکان' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Payment / Debt Repayment Modal (Formal Minimal Design) */}
      {isPaymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md p-5 space-y-4 shadow-2xl rounded-none font-sans text-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-zinc-800" />
                <span>{lang === 'ku' ? 'گەڕاندنەوەى قەرز:' : 'Debt Repayment:'}</span>
                <span className="font-black text-zinc-900">{selectedCustomer.name}</span>
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div className="bg-zinc-950 p-3.5 border border-zinc-800 flex justify-between items-center rounded-none font-sans text-white">
                <span className="text-zinc-300 font-bold text-xs">{lang === 'ku' ? 'کۆی قەرزی نەدراو:' : 'Total Outstanding Debt:'}</span>
                <span className="text-rose-400 font-black text-sm font-mono">{formatCurrency(selectedCustomer.currentDebt, currency, lang, exchangeRate)}</span>
              </div>

              {/* Quick Select Buttons */}
              <div className="space-y-1.5 font-sans">
                <label className="text-[10px] uppercase font-bold text-zinc-600 block">
                  {lang === 'ku' ? 'دیاریکردنی خێرای بڕی پارە' : 'Quick Amount Selection'}
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPayAmount(selectedCustomer.currentDebt)}
                    className="h-9 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-900 font-bold rounded-none transition-colors"
                  >
                    {lang === 'ku' ? 'کۆى گشتى قەرزەکە' : 'Pay Full Amount'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayAmount(selectedCustomer.currentDebt / 2)}
                    className="h-9 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-900 font-bold rounded-none transition-colors"
                  >
                    {lang === 'ku' ? '٥٠٪ی قەرزەکە' : '50% Balance'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-600 block mb-1">
                  {lang === 'ku' ? `بڕی پارەی وەرگیراو (${currency === 'IQD' ? 'د.ع' : '$'}) *` : `Amount Received (${currency === 'IQD' ? 'IQD' : '$'}) *`}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedCustomer.currentDebt}
                  step="any"
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 font-mono font-black text-sm focus:border-black outline-none rounded-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-600 block mb-1">
                  {lang === 'ku' ? 'تێبینی وەصڵ' : 'Receipt Note'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'ku' ? 'نموونە: دانەوەى قەرز بە نەقد' : 'e.g. Cash debt repayment'}
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-zinc-900 focus:border-black outline-none rounded-none text-xs font-sans"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="h-9 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs rounded-none transition-colors"
                >
                  {lang === 'ku' ? 'هەڵوەشاندنەوە' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-none transition-colors"
                >
                  {lang === 'ku' ? 'تۆمارکردنی وەصڵ' : 'Save Payment & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Receipt Reprint Modal */}
      {activePaymentReceipt && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div
            id="printable-repayment-receipt"
            className="bg-white border border-zinc-300 w-full max-w-sm p-6 space-y-4 shadow-2xl rounded-none font-mono text-zinc-900"
          >
            <div className="text-center border-b border-zinc-300 pb-3">
              <h2 className="font-bold text-sm font-sans uppercase text-zinc-900">
                {lang === 'ku' ? 'پەراوگەی باران' : 'BARAN STATIONERY'}
              </h2>
              <div className="text-[10px] text-zinc-500 uppercase">{lang === 'ku' ? 'وەصڵی گەڕاندنەوەی قەرز' : 'Debt Repayment Receipt'}</div>
            </div>

            <div className="text-xs space-y-2 border-b border-zinc-200 pb-3">
              <div className="flex justify-between">
                <span className="text-zinc-500">{lang === 'ku' ? 'ژمارەی وەصڵ:' : 'Receipt #:'}</span>
                <span className="font-bold">{activePaymentReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">{lang === 'ku' ? 'ناوی کڕیار:' : 'Customer:'}</span>
                <span className="font-bold font-sans">{selectedCustomer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">{lang === 'ku' ? 'بەروار:' : 'Date:'}</span>
                <span>{activePaymentReceipt.date}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold border-t border-zinc-200 pt-1.5">
                <span>{lang === 'ku' ? 'بڕی گەڕێنراوە:' : 'Paid Amount:'}</span>
                <span className="text-sm">{formatCurrency(activePaymentReceipt.amount, currency, lang, exchangeRate)}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold">
                <span>{lang === 'ku' ? 'ماوەی قەرز:' : 'Remaining Debt:'}</span>
                <span>{formatCurrency(selectedCustomer.currentDebt, currency, lang, exchangeRate)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 font-sans">
              <button
                onClick={() => setActivePaymentReceipt(null)}
                className="h-8 px-3 bg-zinc-200 text-zinc-800 font-bold text-xs rounded-none transition-colors"
              >
                {lang === 'ku' ? 'داخستن' : 'Close'}
              </button>
              <button
                onClick={() => window.print()}
                className="h-8 px-4 bg-black text-white font-bold text-xs rounded-none transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{lang === 'ku' ? 'پرنتکردن' : 'Print'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Debtors Report Modal */}
      {isPrintDebtorsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-2xl p-6 space-y-4 shadow-2xl rounded-none font-sans text-zinc-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-zinc-800" />
                {lang === 'ku' ? 'ڕاپۆرتی پرنتبووی لیستی قەرزداران' : 'Printable Debtors Report'}
              </h3>
              <button onClick={() => setIsPrintDebtorsModalOpen(false)} className="text-zinc-400 hover:text-zinc-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div id="printable-debtors-report" className="space-y-4 p-2">
              <div className="text-center border-b border-zinc-300 pb-3">
                <h2 className="text-base font-black uppercase text-zinc-900">
                  {lang === 'ku' ? 'پەراوگەی باران - ڕاپۆرتی گشتی قەرزداران' : 'BARAN STATIONERY - DEBTORS REPORT'}
                </h2>
                <div className="text-xs text-zinc-500 font-mono mt-1">
                  {lang === 'ku' ? `تاریخی ڕاپۆرت: ${new Date().toLocaleDateString('en-GB')}` : `Report Date: ${new Date().toLocaleDateString('en-GB')}`}
                </div>
              </div>

              <table className="w-full text-xs text-start border-collapse border border-zinc-300">
                <thead className="bg-zinc-100 font-mono text-[10px] uppercase border-b border-zinc-300">
                  <tr>
                    <th className="p-2 border border-zinc-300 text-start">#</th>
                    <th className="p-2 border border-zinc-300 text-start">{lang === 'ku' ? 'ناوی کڕیار' : 'Customer Name'}</th>
                    <th className="p-2 border border-zinc-300 text-start">{lang === 'ku' ? 'مۆبایل' : 'Phone'}</th>
                    <th className="p-2 border border-zinc-300 text-start">{lang === 'ku' ? 'ڕۆژانی دواکەوتن' : 'Overdue Days'}</th>
                    <th className="p-2 border border-zinc-300 text-start">{lang === 'ku' ? 'قەرزی نەدراو' : 'Debt Balance'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  {customers.filter((c) => c.currentDebt > 0).map((c, idx) => (
                    <tr key={c.id}>
                      <td className="p-2 border border-zinc-300">{idx + 1}</td>
                      <td className="p-2 border border-zinc-300 font-bold font-sans">{c.name}</td>
                      <td className="p-2 border border-zinc-300">{c.phone || '-'}</td>
                      <td className="p-2 border border-zinc-300 text-rose-700 font-bold">{getOverdueDays(c)} {lang === 'ku' ? 'ڕۆژ' : 'days'}</td>
                      <td className="p-2 border border-zinc-300 font-black text-rose-700">
                        {formatCurrency(c.currentDebt, currency, lang, exchangeRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bg-zinc-50 border border-zinc-300 p-3 flex justify-between items-center font-mono text-xs">
                <span className="font-bold font-sans">{lang === 'ku' ? 'کۆی گشتی قەرزەکانی بازاڕ:' : 'Total Outstanding Market Debt:'}</span>
                <span className="text-rose-700 font-black text-sm">{formatCurrency(totalDebtBalance, currency, lang, exchangeRate)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
              <button
                onClick={() => setIsPrintDebtorsModalOpen(false)}
                className="h-9 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs rounded-none transition-colors"
              >
                {lang === 'ku' ? 'داخستن' : 'Close'}
              </button>
              <button
                onClick={() => window.print()}
                className="h-9 px-4 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-none transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>{lang === 'ku' ? 'پرنتکردنی لاپەڕە' : 'Print Report'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
