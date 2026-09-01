import React from 'react';
import { Coins, Plus, Calendar, Tag, Trash2, FileText, X, Printer, Edit3 } from 'lucide-react';
import { Expense, ExpenseCategory } from '../types';
import { Currency, formatCurrency } from '../utils/currency';

interface ExpensesManagerProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expenseId: string) => void;
  lang?: 'en' | 'ku';
  currency?: Currency;
  exchangeRate?: number;
}

export const ExpensesManager: React.FC<ExpensesManagerProps> = ({
  expenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  lang = 'en',
  currency = 'IQD',
  exchangeRate = 1500,
}) => {
  // Modals & State
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const [isPrintReportModalOpen, setIsPrintReportModalOpen] = React.useState(false);
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');

  // Add Expense Form State
  const [title, setTitle] = React.useState('');
  const [amount, setAmount] = React.useState<number>(0);
  const [category, setCategory] = React.useState<ExpenseCategory>('rent');
  const [expenseDate, setExpenseDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = React.useState('');

  // Edit Expense Form State
  const [editTitle, setEditTitle] = React.useState('');
  const [editAmount, setEditAmount] = React.useState<number>(0);
  const [editCategory, setEditCategory] = React.useState<ExpenseCategory>('rent');
  const [editExpenseDate, setEditExpenseDate] = React.useState('');
  const [editNote, setEditNote] = React.useState('');

  const filteredExpenses = expenses.filter(
    (exp) => categoryFilter === 'all' || exp.category === categoryFilter
  );

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || amount <= 0) return;

    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      category,
      title,
      amount,
      date: expenseDate || new Date().toISOString().split('T')[0],
      recordedBy: 'کاک على محمد',
      note,
    };

    onAddExpense(newExpense);
    setIsAddModalOpen(false);
    setTitle('');
    setAmount(0);
    setNote('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
  };

  const handleOpenEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setEditTitle(exp.title);
    setEditAmount(exp.amount);
    setEditCategory(exp.category);
    setEditExpenseDate(exp.date);
    setEditNote(exp.note || '');
  };

  const handleSaveEditExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editTitle || editAmount <= 0) return;

    const updated: Expense = {
      ...editingExpense,
      title: editTitle,
      amount: editAmount,
      category: editCategory,
      date: editExpenseDate || editingExpense.date,
      note: editNote,
    };

    onUpdateExpense?.(updated);
    setEditingExpense(null);
  };

  const getCategoryLabel = (cat: ExpenseCategory, short = false) => {
    if (lang === 'ku') {
      switch (cat) {
        case 'rent':              return short ? 'کرێی دوکان' : 'کرێی دوکان';
        case 'electricity_water': return short ? 'کارەبا و ئاو' : 'کارەبا و ئاو';
        case 'salaries':          return short ? 'مووچە' : 'مووچەی کارمەندان';
        case 'maintenance':       return short ? 'چاككردنەوە' : 'چاككردنەوەی ئامێرەکان';
        case 'supplies':          return short ? 'کەلەپەل' : 'کەلەپەلی دوکان';
        default:                  return short ? 'تر' : 'خەرجییەکانی تر';
      }
    }
    switch (cat) {
      case 'rent':              return short ? 'Rent' : 'Rent';
      case 'electricity_water': return short ? 'Elec. & Water' : 'Electricity & Water';
      case 'salaries':          return short ? 'Salaries' : 'Employee Salaries';
      case 'maintenance':       return short ? 'Maintenance' : 'Printer Service & Maintenance';
      case 'supplies':          return short ? 'Supplies' : 'Store Supplies';
      default:                  return short ? 'Other' : 'Other Expenses';
    }
  };

  const getCategoryDot = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'rent':              return 'bg-zinc-500';
      case 'electricity_water': return 'bg-amber-400';
      case 'salaries':          return 'bg-blue-400';
      case 'maintenance':       return 'bg-rose-400';
      case 'supplies':          return 'bg-emerald-400';
      default:                  return 'bg-zinc-300';
    }
  };

  return (
    <div className="flex-1 bg-zinc-100 p-6 flex flex-col overflow-hidden text-zinc-900 font-sans select-none">
      {/* Top Header & Controls */}
      <div className="bg-white border border-zinc-300 p-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-none">
        <div>
          <h1 className="text-lg font-black uppercase text-zinc-900 flex items-center gap-2">
            <Coins className="w-5 h-5 text-zinc-800" />
            {lang === 'ku' ? 'خەرجییەکانی دوکان و تێچووەکان' : 'Shop Expenses & Overhead'}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {lang === 'ku'
              ? 'تۆمارکردنی کرێی دوکان، کارەبا، مووچەی کارمەندان و چاککردنەوەی ئامێرەکان'
              : 'Rent, Electricity, Employee Salaries & Maintenance Log'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 bg-white border border-zinc-300 px-3 text-xs text-zinc-900 font-sans font-bold focus:border-black outline-none rounded-none cursor-pointer"
          >
            <option value="all">{lang === 'ku' ? 'هەموو جۆرەکانی خەرجی' : 'All Expense Categories'}</option>
            <option value="rent">{lang === 'ku' ? 'کرێی دوکان' : 'Rent'}</option>
            <option value="electricity_water">{lang === 'ku' ? 'کارەبا و ئاو' : 'Electricity & Water'}</option>
            <option value="salaries">{lang === 'ku' ? 'مووچەی کارمەندان' : 'Employee Salaries'}</option>
            <option value="maintenance">{lang === 'ku' ? 'چاککردنەوە' : 'Maintenance'}</option>
            <option value="supplies">{lang === 'ku' ? 'کەلەپەلی دوکان' : 'Store Supplies'}</option>
            <option value="other">{lang === 'ku' ? 'خەرجییەکانی تر' : 'Other Expenses'}</option>
          </select>

          {/* Print Report Button */}
          <button
            onClick={() => setIsPrintReportModalOpen(true)}
            className="h-9 px-3.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-none flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'ku' ? 'چاپکردنی ڕاپۆرت' : 'Print Report'}</span>
          </button>

          {/* Add Expense Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-9 px-4 bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-none transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ku' ? 'تۆمارکردنی خەرجی' : 'Record Expense'}</span>
          </button>
        </div>
      </div>

      {/* Minimal Formal Expenses Table */}
      <div className="flex-1 bg-white border border-zinc-300 overflow-y-auto rounded-none flex flex-col justify-between">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="bg-zinc-900 text-white font-sans text-xs border-b border-zinc-900 sticky top-0 z-10">
            <tr>
              <th className="p-3 text-start font-bold tracking-normal">{lang === 'ku' ? 'ناونیشان و وردەکاری' : 'Title & Details'}</th>
              <th className="p-3 text-start font-bold w-36 tracking-normal">{lang === 'ku' ? 'تۆمارکراوە لەلایەن' : 'Recorded By'}</th>
              <th className="p-3 text-start font-bold w-44 tracking-normal">{lang === 'ku' ? 'جۆری خەرجی' : 'Category'}</th>
              <th className="p-3 text-start font-bold w-32 tracking-normal">{lang === 'ku' ? 'بەروار' : 'Date'}</th>
              <th className="p-3 text-end font-bold w-36 tracking-normal">{lang === 'ku' ? `بڕ${currency === 'USD' ? ' ($)' : ''}` : `Amount (${currency === 'IQD' ? 'IQD' : '$'})`}</th>
              <th className="p-3 text-end font-bold w-24 tracking-normal">{lang === 'ku' ? 'کردارەکان' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 font-mono">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-400 text-xs font-sans">
                  {lang === 'ku' ? 'هیچ خەرجییەک نەدۆزرایەوە.' : 'No expenses recorded in this category.'}
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-zinc-900 font-sans text-sm">{exp.title}</div>
                    {exp.note && <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{exp.note}</div>}
                  </td>
                  <td className="p-3 text-zinc-700 font-sans">{exp.recordedBy}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold text-[10px] rounded-none whitespace-nowrap font-sans">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getCategoryDot(exp.category)}`} />
                      <span>{getCategoryLabel(exp.category, true)}</span>
                    </span>
                  </td>
                  <td className="p-3 text-zinc-500 font-bold text-xs">{exp.date}</td>
                  <td className="p-3 text-end font-black text-rose-700 text-sm">
                    {formatCurrency(exp.amount, currency, lang, exchangeRate)}
                  </td>
                  <td className="p-3 text-end font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(exp)}
                        className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 text-[11px] font-bold rounded-none transition-colors"
                        title={lang === 'ku' ? 'دەستکاریکردنی داتا' : 'Edit Expense'}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-zinc-700" />
                      </button>
                      {onDeleteExpense && (
                        <button
                          onClick={() => {
                            if (window.confirm(lang === 'ku' ? 'دڵنیای لە سڕینەوەی ئەم خەرجییە؟' : 'Are you sure you want to delete this expense?')) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold rounded-none transition-colors"
                          title={lang === 'ku' ? 'سڕینەوە' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Table Summary Footer with Formal Total Expenses Display */}
          <tfoot className="bg-zinc-900 text-white font-sans border-t-2 border-black sticky bottom-0 z-10">
            <tr>
              <td colSpan={4} className="p-3.5 text-start font-bold text-sm text-zinc-100 font-sans tracking-wide">
                {lang === 'ku' ? 'کۆی گشتی تێچووی خەرجییەکان:' : 'Total Expenses Summary:'}
              </td>
              <td className="p-3.5 text-end font-mono whitespace-nowrap">
                <span className="inline-flex items-center gap-2 bg-zinc-950 px-3.5 py-1.5 border border-zinc-700 shadow-sm">
                  <span className="text-[11px] text-zinc-400 font-sans font-bold uppercase">
                    {lang === 'ku' ? 'کۆی گشتی' : 'Grand Total'}
                  </span>
                  <span className="text-base font-black text-rose-400 font-mono tracking-tight">
                    {formatCurrency(totalExpenses, currency, lang, exchangeRate)}
                  </span>
                </span>
              </td>
              <td className="p-3.5"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 w-full max-w-md shadow-xl rounded-none font-sans text-zinc-900">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-950">
              <h3 className="font-black text-[11px] uppercase tracking-widest text-white">
                {lang === 'ku' ? 'تۆمارکردنی خەرجی' : 'Record Expense'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-4">

              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {lang === 'ku' ? 'جۆری خەرجی' : 'Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-xs text-zinc-900 font-bold focus:border-zinc-900 outline-none rounded-none appearance-none cursor-pointer"
                >
                  <option value="rent">{lang === 'ku' ? 'کرێی شوێن' : 'Rent'}</option>
                  <option value="electricity_water">{lang === 'ku' ? 'کارەبا و ئاو' : 'Electricity & Water'}</option>
                  <option value="salaries">{lang === 'ku' ? 'مووچەی کارمەندان' : 'Employee Salaries'}</option>
                  <option value="maintenance">{lang === 'ku' ? 'چاككردنەوەی ئامێرەکان' : 'Maintenance & Service'}</option>
                  <option value="supplies">{lang === 'ku' ? 'کەلەپەلی دوکان' : 'Store Supplies'}</option>
                  <option value="other">{lang === 'ku' ? 'خەرجییەکانی تر' : 'Other Expenses'}</option>
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {lang === 'ku' ? 'ناونیشانی خەرجی' : 'Expense Title'}
                  <span className="text-rose-600 ms-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ku' ? 'نموونە: کرێی دوکانی مانگی ٨' : 'e.g. Shop Rent — August'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 outline-none rounded-none"
                />
              </div>

              {/* Amount + Date row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {lang === 'ku' ? `بڕ${currency === 'USD' ? ' ($)' : ''}` : `Amount (${currency === 'IQD' ? 'IQD' : '$'})`}
                    <span className="text-rose-600 ms-0.5">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min={1}
                    placeholder="0"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 bg-white border border-zinc-300 px-3 text-sm font-black text-zinc-900 font-mono focus:border-zinc-900 outline-none rounded-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {lang === 'ku' ? 'بەروار' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full h-9 bg-white border border-zinc-300 px-3 text-xs text-zinc-900 font-mono focus:border-zinc-900 outline-none rounded-none"
                  />
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {lang === 'ku' ? 'تێبینی' : 'Note'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'ku' ? 'ژمارەی وەصڵ یان تێبینی زیادە' : 'Receipt ref. or additional note'}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-sm text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-900 outline-none rounded-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-9 px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-none transition-colors"
                >
                  {lang === 'ku' ? 'هەڵوەشاندنەوە' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-none transition-colors"
                >
                  {lang === 'ku' ? 'تۆمارکردن' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 w-full max-w-md shadow-xl rounded-none font-sans text-zinc-900">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-950">
              <h3 className="font-black text-[11px] uppercase tracking-widest text-white flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                {lang === 'ku' ? 'دەستکاریکردنی خەرجی' : 'Edit Expense'}
              </h3>
              <button onClick={() => setEditingExpense(null)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditExpense} className="p-5 space-y-4">

              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {lang === 'ku' ? 'جۆری خەرجی' : 'Category'}
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as any)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-xs text-zinc-900 font-bold focus:border-zinc-900 outline-none rounded-none appearance-none cursor-pointer"
                >
                  <option value="rent">{lang === 'ku' ? 'کرێی شوێن' : 'Rent'}</option>
                  <option value="electricity_water">{lang === 'ku' ? 'کارەبا و ئاو' : 'Electricity & Water'}</option>
                  <option value="salaries">{lang === 'ku' ? 'مووچەی کارمەندان' : 'Employee Salaries'}</option>
                  <option value="maintenance">{lang === 'ku' ? 'چاككردنەوەی ئامێرەکان' : 'Maintenance & Service'}</option>
                  <option value="supplies">{lang === 'ku' ? 'کەلەپەلی دوکان' : 'Store Supplies'}</option>
                  <option value="other">{lang === 'ku' ? 'خەرجییەکانی تر' : 'Other Expenses'}</option>
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {lang === 'ku' ? 'ناونیشانی خەرجی' : 'Expense Title'}
                  <span className="text-rose-600 ms-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-sm text-zinc-900 font-bold focus:border-zinc-900 outline-none rounded-none"
                />
              </div>

              {/* Amount + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {lang === 'ku' ? `بڕ${currency === 'USD' ? ' ($)' : ''}` : `Amount (${currency === 'IQD' ? 'IQD' : '$'})`}
                    <span className="text-rose-600 ms-0.5">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min={1}
                    value={editAmount || ''}
                    onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 bg-white border border-zinc-300 px-3 text-sm font-black text-zinc-900 font-mono focus:border-zinc-900 outline-none rounded-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {lang === 'ku' ? 'بەروار' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={editExpenseDate}
                    onChange={(e) => setEditExpenseDate(e.target.value)}
                    className="w-full h-9 bg-white border border-zinc-300 px-3 text-xs text-zinc-900 font-mono focus:border-zinc-900 outline-none rounded-none"
                  />
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {lang === 'ku' ? 'تێبینی' : 'Note'}
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 px-3 text-sm text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-900 outline-none rounded-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="h-9 px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-none transition-colors"
                >
                  {lang === 'ku' ? 'هەڵوەشاندنەوە' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-none transition-colors"
                >
                  {lang === 'ku' ? 'پاشەکەوتکردن' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Expenses Report Modal */}
      {isPrintReportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-3xl p-6 space-y-4 shadow-2xl rounded-none font-sans text-zinc-900 max-h-[90vh] overflow-y-auto">
            {/* Modal Toolbar */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-zinc-800" />
                {lang === 'ku' ? 'ڕاپۆرتی پرنتبووی خەرجییەکان' : 'Printable Expenses Report Preview'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="h-8 px-3.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-none flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {lang === 'ku' ? 'پرنتکردنی فایلی PDF / ڕاپۆرت' : 'Print Report Now'}
                </button>
                <button onClick={() => setIsPrintReportModalOpen(false)} className="text-zinc-400 hover:text-zinc-900">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Report Document Body */}
            <div id="printable-expenses-report" className="p-6 bg-white space-y-5 text-zinc-900 font-sans">
              {/* Document Header */}
              <div className="border-b-2 border-black pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black text-black uppercase tracking-tight">
                    {lang === 'ku' ? 'ڕاپۆرتی خەرجییەکانی پەراوگەی باران' : 'BARAN STATIONERY - EXPENSES REPORT'}
                  </h1>
                  <p className="text-xs text-zinc-600 mt-1">
                    {lang === 'ku'
                      ? `جۆری خەرجی: ${categoryFilter === 'all' ? 'هەموو جۆرەکان' : getCategoryLabel(categoryFilter as any)}`
                      : `Category Filter: ${categoryFilter === 'all' ? 'All Categories' : categoryFilter}`}
                  </p>
                </div>
                <div className="text-end font-mono text-xs">
                  <div className="font-bold text-zinc-900">{lang === 'ku' ? 'بەرواری دەرچوون:' : 'Issued Date:'} {new Date().toISOString().split('T')[0]}</div>
                  <div className="text-zinc-500 text-[10px] mt-0.5">{lang === 'ku' ? 'تۆمارکراو لە سیستەمی باران POS' : 'Generated by Baran POS'}</div>
                </div>
              </div>

              {/* Expenses Document Table */}
              <table className="w-full text-start text-xs border-collapse border border-zinc-300">
                <thead className="bg-zinc-100 text-zinc-900 font-sans text-[11px] uppercase border-b border-zinc-300">
                  <tr>
                    <th className="p-2 border-r border-zinc-300 text-start">{lang === 'ku' ? 'ناونیشان و وردەکاری' : 'Title & Details'}</th>
                    <th className="p-2 border-r border-zinc-300 text-start">{lang === 'ku' ? 'تۆمارکراوە لەلایەن' : 'Recorded By'}</th>
                    <th className="p-2 border-r border-zinc-300 text-start">{lang === 'ku' ? 'جۆری خەرجی' : 'Category'}</th>
                    <th className="p-2 border-r border-zinc-300 text-start">{lang === 'ku' ? 'بەروار' : 'Date'}</th>
                    <th className="p-2 border-r border-zinc-300 text-end">{lang === 'ku' ? 'بڕ' : 'Amount'}</th>
                    <th className="p-2 text-center w-24">{lang === 'ku' ? 'کردارەکان' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono text-[11px]">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id}>
                      <td className="p-2 border-r border-zinc-200 font-sans">
                        <span className="font-bold text-zinc-900 block">{exp.title}</span>
                        {exp.note && <span className="text-[10px] text-zinc-500 font-mono block">{exp.note}</span>}
                      </td>
                      <td className="p-2 border-r border-zinc-200 font-sans">{exp.recordedBy}</td>
                      <td className="p-2 border-r border-zinc-200 font-sans">{getCategoryLabel(exp.category)}</td>
                      <td className="p-2 border-r border-zinc-200 font-mono">{exp.date}</td>
                      <td className="p-2 border-r border-zinc-200 text-end font-bold text-rose-700 font-mono whitespace-nowrap">
                        {formatCurrency(exp.amount, currency, lang, exchangeRate)}
                      </td>
                      <td className="p-2 text-center font-sans text-[10px] text-emerald-700 font-bold">
                        {lang === 'ku' ? 'تۆمارکراوە' : 'Recorded'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bottom Summary Stat Box (Moved Below Table) */}
              <div className="bg-zinc-50 p-4 border border-zinc-300 flex justify-between items-center font-sans">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">{lang === 'ku' ? 'ژمارەی خەرجییە تۆمارکراوەکان' : 'Total Expense Items'}</div>
                  <div className="text-base font-black text-zinc-900 font-mono">{filteredExpenses.length} {lang === 'ku' ? 'تۆمار' : 'records'}</div>
                </div>
                <div className="text-end">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">{lang === 'ku' ? 'کۆی گشتی تێچووی خەرجییەکان' : 'Total Expense Amount'}</div>
                  <div className="text-lg font-black text-rose-700 font-mono">
                    {formatCurrency(totalExpenses, currency, lang, exchangeRate)}
                  </div>
                </div>
              </div>

              {/* Signature Footer */}
              <div className="pt-8 border-t border-zinc-300 flex justify-between items-end text-[11px] text-zinc-600 font-mono">
                <div>
                  <div>{lang === 'ku' ? 'واژۆی بەڕێوەبەر / ژمێریار' : 'Manager / Accountant Signature'}</div>
                  <div className="h-10"></div>
                  <div>__________________________</div>
                </div>
                <div className="text-end text-[10px] text-zinc-400">
                  {lang === 'ku' ? 'پەراوگەی باران - سیستەمی کۆنترۆڵی حسابات' : 'Baran Stationery Accounting System'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
