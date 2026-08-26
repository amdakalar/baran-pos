import React from 'react';
import {
  Settings,
  Store,
  Phone,
  MapPin,
  Coins,
  Sun,
  Moon,
  Globe,
  Save,
  CheckCircle2,
  Github,
  Database,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  FileSpreadsheet,
  Lock,
  Unlock,
  Search,
  ShieldAlert,
  Trash2,
  AlertOctagon,
  Activity,
  ShoppingBag,
  Users,
  Truck,
  Receipt,
  DollarSign,
  PauseCircle,
  Filter,
  X,
  AlertTriangle,
  Percent,
  Printer,
} from 'lucide-react';
import { SystemConfig, AuditLog, Product } from '../types';
import { Currency } from '../utils/currency';

interface SettingsManagerProps {
  systemConfig: SystemConfig;
  onUpdateSystemConfig: (config: SystemConfig) => void;
  lang?: 'en' | 'ku';
  onToggleLang?: () => void;
  currency?: Currency;
  onToggleCurrency?: () => void;
  exchangeRate?: number;
  onUpdateExchangeRate?: (rate: number) => void;
  isOffline?: boolean;
  onToggleOffline?: () => void;
  onRestoreData?: (restoredState: any) => void;
  onClearAllData?: () => void;
  onClearSectionData?: (section: 'products' | 'customers' | 'suppliers' | 'invoices' | 'expenses' | 'audit_logs' | 'held_sales') => void;
  allDataForBackup?: any;
  auditLogs?: AuditLog[];
  products?: Product[];
  productsCount?: number;
  customersCount?: number;
  suppliersCount?: number;
  invoicesCount?: number;
  expensesCount?: number;
  heldSalesCount?: number;
}

type SettingsSubTab = 'store_profile' | 'system_preferences' | 'audit_logs' | 'database_management' | 'system_updates';

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  systemConfig,
  onUpdateSystemConfig,
  lang = 'ku',
  onToggleLang,
  currency = 'IQD',
  onToggleCurrency,
  exchangeRate = 1500,
  onUpdateExchangeRate,
  isOffline = false,
  onToggleOffline,
  onRestoreData,
  onClearAllData,
  onClearSectionData,
  allDataForBackup,
  auditLogs = [],
  products = [],
  productsCount = 0,
  customersCount = 0,
  suppliersCount = 0,
  invoicesCount = 0,
  expensesCount = 0,
  heldSalesCount = 0,
}) => {
  const t = (ku: string, en: string) => (lang === 'ku' ? ku : en);

  // Active Sub-Tab
  const [activeTab, setActiveTab] = React.useState<SettingsSubTab>('store_profile');

  // Form State
  const [shopNameKu, setShopNameKu] = React.useState(systemConfig.shopNameKu || 'پەراوگەی باران');
  const [shopNameEn, setShopNameEn] = React.useState(systemConfig.shopNameEn || 'BARAN STATIONERY');
  const [phone, setPhone] = React.useState(systemConfig.phone || '0750 000 0000');
  const [address, setAddress] = React.useState(systemConfig.address || 'سلێمانی - شەقامی سەرەکی');
  const [taxPercent, setTaxPercent] = React.useState<number>(systemConfig.taxPercent || 0);
  const [receiptHeaderKu, setReceiptHeaderKu] = React.useState(systemConfig.receiptHeaderKu || 'بەخێربێن بۆ پەراوگەی باران');
  const [receiptFooterKu, setReceiptFooterKu] = React.useState(systemConfig.receiptFooterKu || 'سوپاس بۆ سەردانەکەت! بەهیوای دووبارە دیدەنتان');
  const [selectedCurrency, setSelectedCurrency] = React.useState<'IQD' | 'USD'>(systemConfig.currency || 'IQD');
  const [themeMode, setThemeMode] = React.useState<'light' | 'dark'>(systemConfig.theme || 'light');
  const [requireLoginPin, setRequireLoginPin] = React.useState<boolean>(systemConfig.requireLoginPin ?? false);
  const [customRate, setCustomRate] = React.useState<number>(exchangeRate);

  // Sync state if systemConfig prop changes
  React.useEffect(() => {
    setShopNameKu(systemConfig.shopNameKu || 'پەراوگەی باران');
    setShopNameEn(systemConfig.shopNameEn || 'BARAN STATIONERY');
    setPhone(systemConfig.phone || '');
    setAddress(systemConfig.address || '');
    setTaxPercent(systemConfig.taxPercent || 0);
    setReceiptHeaderKu(systemConfig.receiptHeaderKu || 'بەخێربێن بۆ پەراوگەی باران');
    setReceiptFooterKu(systemConfig.receiptFooterKu || 'سوپاس بۆ سەردانەکەت! بەهیوای دووبارە دیدەنتان');
    setSelectedCurrency(systemConfig.currency || 'IQD');
    setThemeMode(systemConfig.theme || 'light');
    setRequireLoginPin(systemConfig.requireLoginPin ?? false);
  }, [systemConfig]);

  React.useEffect(() => {
    setCustomRate(exchangeRate);
  }, [exchangeRate]);

  // Feedback Toast
  const [feedback, setFeedback] = React.useState('');

  // Confirmation Modal State for Data Clearance
  const [confirmModal, setConfirmModal] = React.useState<{
    isOpen: boolean;
    title: string;
    description: string;
    countText?: string;
    isDangerAll?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // GitHub Update State
  const [isCheckingUpdate, setIsCheckingUpdate] = React.useState(false);
  const [updateStatus, setUpdateStatus] = React.useState<string | null>(null);

  // Audit Search & Category State
  const [auditSearch, setAuditSearch] = React.useState('');
  const [auditCategory, setAuditCategory] = React.useState<string>('all');

  // Handle Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: SystemConfig = {
      ...systemConfig,
      shopNameKu: shopNameKu.trim(),
      shopNameEn: shopNameEn.trim(),
      phone: phone.trim(),
      address: address.trim(),
      currency: selectedCurrency,
      exchangeRate: customRate,
      taxPercent: Number(taxPercent) || 0,
      receiptHeaderKu: receiptHeaderKu.trim(),
      receiptFooterKu: receiptFooterKu.trim(),
      theme: themeMode,
      requireLoginPin: requireLoginPin,
    };

    onUpdateSystemConfig(updated);
    if (onUpdateExchangeRate && customRate !== exchangeRate) {
      onUpdateExchangeRate(customRate);
    }

    setFeedback(t('ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوتکران', 'Settings saved successfully'));
    setTimeout(() => setFeedback(''), 3000);
  };

  // Handle Check GitHub Updates
  const handleCheckUpdates = () => {
    setIsCheckingUpdate(true);
    setUpdateStatus(null);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      setUpdateStatus(t('سیستەمەکەت نوێترین وەشانە (v2.5.0)', 'System is up to date (v2.5.0)'));
    }, 1200);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allDataForBackup || {}, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `baran_pos_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setFeedback(t('فایلی باکئەپ بە سەرکەوتوویی داونلۆدکرا', 'Backup JSON file exported successfully'));
      setTimeout(() => setFeedback(''), 3000);
    } catch {
      alert(t('هەڵە لە دروستکردنی فایلی پاشەکەوت', 'Error creating backup file'));
    }
  };

  // Export Products CSV
  const handleExportCSV = () => {
    try {
      const headers = ['ID', 'Name (Ku)', 'Name (En)', 'Barcode', 'Category', 'Cost Price', 'Retail Price', 'Stock Quantity'];
      const rows = products.map((p) => [
        p.id,
        `"${(p.nameKu || '').replace(/"/g, '""')}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        p.barcode,
        p.categoryId,
        p.costPrice,
        p.retailPrice,
        p.stockQuantity,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `baran_pos_products_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setFeedback(t('فایلی CSV بە سەرکەوتوویی داونلۆدکرا', 'Products CSV exported successfully'));
      setTimeout(() => setFeedback(''), 3000);
    } catch {
      alert(t('هەڵە لە دەرهێنانی لیستی کاڵاکان', 'Error exporting products CSV'));
    }
  };

  // Import JSON Backup
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (onRestoreData) {
          onRestoreData(parsed);
          setFeedback(t('داتاکان بە سەرکەوتوویی گەڕێنرانەوە', 'Database restored successfully'));
          setTimeout(() => setFeedback(''), 3000);
        }
      } catch {
        alert(t('فایلی هەڵبژێردراو نادروستە یان تێکچووە', 'Invalid or corrupt backup JSON file'));
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditCategory !== 'all' && log.category !== auditCategory) return false;
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    return (
      log.user?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q) ||
      log.timestamp?.includes(q)
    );
  });

  // Audit Category Badges Count
  const salesLogsCount = auditLogs.filter((l) => l.category === 'sale').length;
  const inventoryLogsCount = auditLogs.filter((l) => l.category === 'inventory').length;
  const authLogsCount = auditLogs.filter((l) => l.category === 'system' || (l.category as string) === 'auth').length;

  return (
    <div className="flex-1 bg-[#f8fafc] p-4 sm:p-6 flex flex-col overflow-y-auto text-slate-900 font-sans select-none gap-5" dir={lang === 'ku' ? 'rtl' : 'ltr'}>
      
      {/* ── Top Header & Tab Navigation Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
        
        {/* Right in RTL: Title & Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {t('ڕێکخستنەکانی سیستەم', 'System Settings')}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {t('زانیارییەکانی پەراوگە، لۆگی چالاکییەکان، پاشەکەوت و سڕینەوەی داتاکان', 'Stationery store info, activity logs, backups & selective data reset')}
            </p>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="bg-slate-200/70 p-1 rounded-xl flex items-center gap-1 shrink-0 self-start lg:self-auto border border-slate-300/40 shadow-2xs overflow-x-auto max-w-full">
          
          {/* Tab 1: Store & Receipt Profile */}
          <button
            type="button"
            onClick={() => setActiveTab('store_profile')}
            className={`px-3 py-2 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'store_profile'
                ? 'bg-white text-indigo-600 font-black shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>{t('ناسنامەی پەراوگە و پسوولە', 'Store Profile & Receipts')}</span>
          </button>

          {/* Tab 2: System Preferences & Security */}
          <button
            type="button"
            onClick={() => setActiveTab('system_preferences')}
            className={`px-3 py-2 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'system_preferences'
                ? 'bg-white text-indigo-600 font-black shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>{t('ڕووکار، دراو و ئاسایش', 'Preferences & Security')}</span>
          </button>

          {/* Tab 3: Activity & Audit Trail Logs */}
          <button
            type="button"
            onClick={() => setActiveTab('audit_logs')}
            className={`px-3 py-2 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'audit_logs'
                ? 'bg-white text-indigo-600 font-black shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{t('لۆگی چالاکییەکان', 'Activity Logs')}</span>
            {auditLogs.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-black">
                {auditLogs.length}
              </span>
            )}
          </button>

          {/* Tab 4: Database Backup & Data Reset */}
          <button
            type="button"
            onClick={() => setActiveTab('database_management')}
            className={`px-3 py-2 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'database_management'
                ? 'bg-white text-indigo-600 font-black shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{t('پاشەکەوت و سڕینەوەی داتا', 'Backup & Data Purge')}</span>
          </button>

          {/* Tab 5: System Updates */}
          <button
            type="button"
            onClick={() => setActiveTab('system_updates')}
            className={`px-3 py-2 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'system_updates'
                ? 'bg-white text-indigo-600 font-black shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('نوێکردنەوەی سیستەم', 'Updates')}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Notification */}
      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs animate-fade-in shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* ── Subtab 1: Store & Receipt Profile (with Live Thermal Preview) ── */}
      {activeTab === 'store_profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Form: Profile Inputs */}
          <div className="lg:col-span-7 space-y-5">
            <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-indigo-600 shrink-0" />
                  <h2 className="font-black text-sm text-slate-800">
                    {t('زانیاری و ناسنامەی پەراوگە', 'Stationery Store Profile')}
                  </h2>
                </div>
                <button
                  type="submit"
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t('پاشەکەوتکردن', 'Save Changes')}</span>
                </button>
              </div>

              {/* Shop Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">{t('ناوی پەراوگە (کوردی):', 'Shop Name (Kurdish):')}</label>
                  <input
                    type="text"
                    value={shopNameKu}
                    onChange={(e) => setShopNameKu(e.target.value)}
                    placeholder="پەراوگەی باران"
                    className="w-full h-10 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 text-xs text-slate-800 outline-none transition-all shadow-2xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">{t('ناوی پەراوگە (English):', 'Shop Name (English):')}</label>
                  <input
                    type="text"
                    value={shopNameEn}
                    onChange={(e) => setShopNameEn(e.target.value)}
                    placeholder="BARAN STATIONERY"
                    className="w-full h-10 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 text-xs text-slate-800 outline-none transition-all shadow-2xs"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Phone & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">{t('ژمارەی پەیوەندی / واتسئەپ:', 'Phone / WhatsApp:')}</label>
                  <div className="relative">
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="0770 000 0000"
                      className="w-full h-10 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 text-xs font-mono text-slate-800 outline-none transition-all shadow-2xs"
                      dir="ltr"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">{t('ناونیشان و شار:', 'Address / Location:')}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="سلێمانی - شەقامی سەرەکی"
                      className="w-full h-10 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 text-xs text-slate-800 outline-none transition-all shadow-2xs"
                    />
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Receipt Header & Footer */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">{t('سەردێڕی سەرەوەی پسوولە (Header):', 'Receipt Header Text:')}</label>
                  <input
                    type="text"
                    value={receiptHeaderKu}
                    onChange={(e) => setReceiptHeaderKu(e.target.value)}
                    placeholder="بەخێربێن بۆ پەراوگەی باران"
                    className="w-full h-10 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 text-xs text-slate-800 outline-none transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">{t('پەیامی خوارەوەی پسوولە (Footer):', 'Receipt Footer Text:')}</label>
                  <input
                    type="text"
                    value={receiptFooterKu}
                    onChange={(e) => setReceiptFooterKu(e.target.value)}
                    placeholder="سوپاس بۆ سەردانەکەت! بەهیوای دووبارە دیدەنتان"
                    className="w-full h-10 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 text-xs text-slate-800 outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Default Sales Tax */}
              <div className="pt-3 border-t border-slate-100">
                <div className="space-y-1.5 max-w-xs">
                  <label className="text-xs font-bold text-slate-700 block">{t('ڕێژەی باجی پێشوەختە (%):', 'Default Tax Rate (%):')}</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 text-xs font-mono font-bold text-slate-800 outline-none transition-all shadow-2xs"
                    />
                    <span className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 pointer-events-none font-bold text-xs">
                      %
                    </span>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right Preview: Live Thermal Receipt Preview Widget */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-3 flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                  <Printer className="w-4 h-4 text-indigo-600" />
                  <span>{t('پێشبینینی ڕاستەوخۆی پسوولەی فرۆشتن', 'Live Thermal Receipt Preview')}</span>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-bold">
                  80mm POS
                </span>
              </div>

              {/* Realistic 80mm Receipt Paper Card */}
              <div className="w-full max-w-[280px] bg-[#fffef7] text-slate-900 border border-amber-200/60 rounded-xl p-4 shadow-sm font-mono text-[11px] space-y-2.5">
                
                {/* Store Header */}
                <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                  <h4 className="font-black text-sm tracking-tight text-slate-900">{shopNameKu || 'پەراوگەی باران'}</h4>
                  {shopNameEn && <p className="text-[9px] text-slate-500 font-sans uppercase font-bold">{shopNameEn}</p>}
                  <p className="text-[10px] text-indigo-600 font-medium pt-0.5">{receiptHeaderKu}</p>
                  {phone && <p className="text-[10px] text-slate-600" dir="ltr">{phone}</p>}
                  {address && <p className="text-[9px] text-slate-500">{address}</p>}
                </div>

                {/* Sample Transaction Meta */}
                <div className="flex justify-between text-[9px] text-slate-500 border-b border-dashed border-slate-300 pb-1.5">
                  <span>INV: #2026-0889</span>
                  <span>2026-08-25 14:30</span>
                </div>

                {/* Sample Items Table */}
                <div className="space-y-1 text-[10px] border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>دەفتەری ١٠٠ لاپەڕە (x2)</span>
                    <span>3,000 د.ع</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>قەڵەمی جاف شین (x5)</span>
                    <span>1,250 د.ع</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>کاغەزی A4 Double A</span>
                    <span>6,500 د.ع</span>
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-1 text-[11px] pt-0.5">
                  <div className="flex justify-between text-slate-600">
                    <span>{t('کۆی گشتی:', 'Subtotal:')}</span>
                    <span>10,750 د.ع</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 text-xs border-t border-slate-800 pt-1">
                    <span>{t('بڕی کۆتایی:', 'TOTAL:')}</span>
                    <span className="text-indigo-600">10,750 د.ع</span>
                  </div>
                </div>

                {/* Footer Message */}
                <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-600 leading-tight">
                  <p>{receiptFooterKu}</p>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center font-medium">
                {t('ئەم پێشبینییە لە کاتی چاپکردندا لەسەر ئامێری پسوولە دەردەکەوێت.', 'Live simulated thermal print layout.')}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* ── Subtab 2: System Preferences, Currency & Security ── */}
      {activeTab === 'system_preferences' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              <h2 className="font-black text-sm text-slate-800">
                {t('ڕووکار، زمان، دراو و ئاسایشی سیستەم', 'Appearance, Language, Currency & System Security')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* 1. Theme Mode */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <label className="text-xs font-bold text-slate-800 block">
                  {t('شێوازی ڕووکار (Theme Mode):', 'System Theme:')}
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-200/60 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setThemeMode('light');
                      onUpdateSystemConfig({ ...systemConfig, theme: 'light' });
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      themeMode === 'light'
                        ? 'bg-white text-amber-600 font-black shadow-2xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t('ڕۆشن', 'Light')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setThemeMode('dark');
                      onUpdateSystemConfig({ ...systemConfig, theme: 'dark' });
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      themeMode === 'dark'
                        ? 'bg-slate-900 text-white font-black shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t('تاریک', 'Dark')}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  {t('دیاریکردنی شێوازی بینینی ڕۆشن بۆ ئاسانی کارکردن بە ڕۆژ.', 'Select clean light or modern dark palette.')}
                </p>
              </div>

              {/* 2. System Language Switcher */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <label className="text-xs font-bold text-slate-800 block">
                  {t('زمانی سیستەم (Language):', 'System Language:')}
                </label>
                <button
                  type="button"
                  onClick={onToggleLang}
                  className="w-full h-11 px-3.5 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <span>{lang === 'ku' ? 'کوردی (سۆرانی - ڕاست بۆ چەپ)' : 'English (US - LTR)'}</span>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-black bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {lang === 'ku' ? 'گۆڕین' : 'Switch'}
                  </span>
                </button>
                <p className="text-[11px] text-slate-500">
                  {t('پشتیوانی تەواوی زمانی کوردی سۆرانی بە ئاراستەی فەرمی RTL.', 'Full Kurdish Sorani RTL and English LTR support.')}
                </p>
              </div>

              {/* 3. User Login PIN Requirement */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <label className="text-xs font-bold text-slate-800 block">
                  {t('داواکردنی کۆدی نهێنی (PIN) بۆ یوزەرەکان:', 'Require User Login PIN:')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !requireLoginPin;
                    setRequireLoginPin(nextVal);
                    onUpdateSystemConfig({ ...systemConfig, requireLoginPin: nextVal });
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer border shadow-2xs ${
                    requireLoginPin
                      ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {requireLoginPin ? <Lock className="w-4 h-4 text-indigo-600" /> : <Unlock className="w-4 h-4 text-slate-400" />}
                    <span>{requireLoginPin ? t('چالاکە (PIN پێویستە)', 'Enabled (PIN Required)') : t('ناچالاکە (چوونەژوورەوەی ڕاستەوخۆ)', 'Disabled (Direct)')}</span>
                  </div>
                  <span className={`w-3.5 h-3.5 rounded-full border-2 ${requireLoginPin ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`} />
                </button>
                <p className="text-[11px] text-slate-500">
                  {t('بۆ پاراستنی هەژماری کاشێر و بەڕێوەبەر لە کاتی گۆڕینی یوزەردا.', 'Enhances cashier shift security and role permissions.')}
                </p>
              </div>

            </div>

            {/* Currency & Exchange Rate Section */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="font-black text-xs text-slate-800 flex items-center gap-2 mb-3">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>{t('ڕێکخستنی دراو و نرخی گۆڕینەوە (Currency & Exchange Rate)', 'Currency & Exchange Rate Configuration')}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Primary Currency Toggle */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t('دراوی سەرەکی فرۆشتن:', 'Primary Store Currency:')}
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-200/60 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCurrency('IQD');
                        onUpdateSystemConfig({ ...systemConfig, currency: 'IQD' });
                      }}
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedCurrency === 'IQD' ? 'bg-white text-indigo-600 shadow-2xs font-black' : 'text-slate-600'
                      }`}
                    >
                      دیناری عێراقی (IQD)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCurrency('USD');
                        onUpdateSystemConfig({ ...systemConfig, currency: 'USD' });
                      }}
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedCurrency === 'USD' ? 'bg-white text-indigo-600 shadow-2xs font-black' : 'text-slate-600'
                      }`}
                    >
                      دۆلاری ئەمریکی (USD $)
                    </button>
                  </div>
                </div>

                {/* Exchange Rate per $100 */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t('نرخی ١٠٠ دۆلار بەرامبەر دینار:', 'USD Exchange Rate (per $100):')}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={customRate * 100}
                        onChange={(e) => {
                          const val = (parseFloat(e.target.value) || 150000) / 100;
                          setCustomRate(val);
                          if (onUpdateExchangeRate) onUpdateExchangeRate(val);
                        }}
                        className="w-full h-11 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-xl px-3.5 text-xs font-mono font-black text-slate-800 outline-none transition-all shadow-2xs"
                      />
                      <span className="absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 font-black text-slate-400 text-xs pointer-events-none">
                        د.ع
                      </span>
                    </div>

                    <div className="px-3.5 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-center shrink-0">
                      <span className="text-[10px] text-indigo-500 font-bold block">{t('نموونە:', 'Example:')}</span>
                      <span className="text-xs font-mono font-black text-indigo-700">$10 = {(customRate * 10).toLocaleString()} د.ع</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Subtab 3: Activity & Audit Trail Logs ── */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-5">
          
          {/* Top KPI & Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800">
                    {t('لۆگی تەواوی چالاکی و ڕووداوەکانی سیستەم', 'System Activity & Audit Trail Logs')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {t('تۆماری هەموو کردارەکانی فرۆشتن، کۆگا، سڕینەوە، دەوام و هەژمارەکان', 'Chronological log of sales, inventory modifications, deletions and auth events')}
                  </p>
                </div>
              </div>

              {/* Clear Logs Button */}
              {onClearSectionData && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: t('سڕینەوەی لۆگی چالاکییەکان', 'Clear Activity Logs'),
                      description: t('ئایا دڵنیایت لە سڕینەوەی تەواوی تۆمار و لۆگەکانی سیستەم؟', 'Are you sure you want to permanently clear all system audit logs?'),
                      countText: `${auditLogs.length} ${t('لۆگ', 'logs')}`,
                      onConfirm: () => {
                        onClearSectionData('audit_logs');
                        setFeedback(t('تەواوی لۆگی چالاکییەکان بە سەرکەوتوویی سڕانەوە', 'Audit logs cleared successfully'));
                        setTimeout(() => setFeedback(''), 3000);
                      },
                    });
                  }}
                  disabled={auditLogs.length === 0}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('سڕینەوەی لۆگەکان', 'Clear Logs')}</span>
                </button>
              )}
            </div>

            {/* Quick KPI Count Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">{t('کۆی لۆگەکان', 'Total Logs')}</span>
                <span className="text-sm font-black font-mono text-slate-900">{auditLogs.length}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700">{t('فرۆشتن', 'Sales')}</span>
                <span className="text-sm font-black font-mono text-emerald-700">{salesLogsCount}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700">{t('کۆگا و مەخزەن', 'Inventory')}</span>
                <span className="text-sm font-black font-mono text-amber-700">{inventoryLogsCount}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700">{t('سیستەم و ئاسایش', 'System / Auth')}</span>
                <span className="text-sm font-black font-mono text-indigo-700">{authLogsCount}</span>
              </div>
            </div>

            {/* Search & Category Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="relative flex-1 min-w-[220px]">
                <input
                  type="text"
                  placeholder={t('گەڕان لە لۆگەکان (بەپێی بەکارهێنەر، کردار، یان وردەکاری)...', 'Search logs by user, action, details...')}
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="h-10 w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
                />
                <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 pointer-events-none" />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  {t('فلتەر:', 'Filter:')}
                </span>
                <select
                  value={auditCategory}
                  onChange={(e) => setAuditCategory(e.target.value)}
                  className="h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-indigo-500 shadow-2xs"
                >
                  <option value="all">{t('هەموو بەشەکان', 'All Categories')}</option>
                  <option value="system">{t('سیستەم (System)', 'System')}</option>
                  <option value="sale">{t('فرۆشتن (Sale)', 'Sales')}</option>
                  <option value="inventory">{t('کۆگا و کاڵا (Inventory)', 'Inventory')}</option>
                  <option value="debt">{t('قەرز و پارەدان (Debt)', 'Debt')}</option>
                  <option value="shift">{t('دەوام (Shift)', 'Shift')}</option>
                  <option value="expense">{t('خەرجی (Expense)', 'Expense')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Logs Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-xs text-start border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4 text-start">{t('بەکارهێنەر', 'User')}</th>
                    <th className="py-3 px-4 text-start">{t('کردار', 'Action')}</th>
                    <th className="py-3 px-4 text-start">{t('وردەکاری چالاکی', 'Activity Details')}</th>
                    <th className="py-3 px-4 text-center">{t('بەش', 'Category')}</th>
                    <th className="py-3 px-4 text-start">{t('کات و بەروار', 'Timestamp')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-xs">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <span className="block font-bold">{t('هیچ لۆگێکی تۆمارکراو نەدۆزرایەوە', 'No activity logs found')}</span>
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-black text-slate-900">{log.user}</td>
                        <td className="py-3 px-4 font-bold font-mono text-indigo-600">{log.action}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium max-w-md break-words">{log.details}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                            log.category === 'sale'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : log.category === 'inventory'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : log.category === 'debt'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {log.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── Subtab 4: Database Backup & Granular Data Purge Suite ── */}
      {activeTab === 'database_management' && (
        <div className="space-y-6">
          
          {/* Top 3 Actions: JSON Backup, CSV Export, Restore */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Export JSON */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="font-black text-xs text-slate-800 flex items-center gap-2">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>{t('داونلۆدکردنی باکئەپ (JSON)', 'Export JSON Backup')}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {t('هەموو زانیاری و داتاکانی فرۆشگاکەت لە ناو یەک فایلی پارێزراودا دەپارێزێت.', 'Exports full database snapshot into JSON file.')}
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('داونلۆدکردنی باکئەپ', 'Export JSON')}</span>
              </button>
            </div>

            {/* 2. Export Products CSV */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="font-black text-xs text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span>{t('دەرهێنانی لیستی کاڵاکان (CSV)', 'Export Products CSV')}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {t('دەرهێنانی زانیاری، بارکۆد و نرخی تەواوی کاڵاکان بۆ ئۆفیس و ئێکسڵ.', 'Exports product catalog into CSV spreadsheet format.')}
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{t('دەرهێنانی CSV', 'Export CSV')}</span>
              </button>
            </div>

            {/* 3. Restore JSON */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="font-black text-xs text-slate-800 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>{t('گەڕاندنەوەی داتابەیس لە فایلەوە', 'Restore Database')}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {t('فایلی پێشووی پاشەکەوت هەڵبژێرە بۆ گەڕاندنەوەی تەواوی داتاکان.', 'Select previous JSON backup file to restore system state.')}
                </p>
              </div>

              <label className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>{t('هەڵبژاردنی فایل', 'Select File')}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* ── Selective Departmental Purge Grid (سڕینەوەی بەشەکان بە جیا) ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  {t('بەڕێوەبردنی سڕینەوەی داتا بەپێی بەشەکان (Selective Data Purge)', 'Selective Section Data Deletion')}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {t('دەتوانیت هەر بەشێکی داتابەیس بە تەنها و بە دیاریکردن خاوێن بکەیتەوە بێ ئەوەی بەشەکانی تر تێکبچن.', 'Selectively wipe data of individual modules without affecting other parts of the database.')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
              
              {/* 1. Products & Inventory */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-indigo-600" />
                    <span className="font-black text-xs text-slate-800">{t('کاڵاکان و مەخزەن', 'Products & Stock')}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-mono font-bold text-slate-700">
                    {productsCount} {t('دانە', 'items')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {t('سڕینەوەی لیستی کاڵاکان، نرخەکان و کۆگای پەراوگە.', 'Deletes all product records, prices and current stock.')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: t('سڕینەوەی کاڵاکان', 'Delete All Products'),
                      description: t('ئایا دڵنیایت لە سڕینەوەی تەواوی کاڵاکانی کۆگا؟', 'Are you sure you want to delete all products from the catalog?'),
                      countText: `${productsCount} ${t('کاڵا', 'products')}`,
                      onConfirm: () => {
                        if (onClearSectionData) onClearSectionData('products');
                        setFeedback(t('تەواوی کاڵاکان بە سەرکەوتوویی سڕانەوە', 'Products catalog cleared'));
                        setTimeout(() => setFeedback(''), 3000);
                      },
                    });
                  }}
                  disabled={productsCount === 0}
                  className="w-full py-2 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-rose-600 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('سڕینەوەی کاڵاکان', 'Clear Products')}</span>
                </button>
              </div>

              {/* 2. Customers & Debts */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="font-black text-xs text-slate-800">{t('کڕیاران و قەرزەکان', 'Customers & Debts')}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-mono font-bold text-slate-700">
                    {customersCount} {t('کڕیار', 'customers')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {t('سڕینەوەی هەژماری کڕیاران و مێژووی پارەدانی قەرزەکان.', 'Deletes customer accounts and debt payment histories.')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: t('سڕینەوەی کڕیاران و قەرزەکان', 'Delete All Customers'),
                      description: t('ئایا دڵنیایت لە سڕینەوەی هەموو کڕیاران و تەواوی تۆماری قەرزەکانیان؟', 'Are you sure you want to delete all customer accounts and their debt history?'),
                      countText: `${customersCount} ${t('کڕیار', 'customers')}`,
                      onConfirm: () => {
                        if (onClearSectionData) onClearSectionData('customers');
                        setFeedback(t('تەواوی کڕیاران و قەرزەکان بە سەرکەوتوویی سڕانەوە', 'Customers and debts cleared'));
                        setTimeout(() => setFeedback(''), 3000);
                      },
                    });
                  }}
                  disabled={customersCount === 0}
                  className="w-full py-2 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-rose-600 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('سڕینەوەی کڕیاران', 'Clear Customers')}</span>
                </button>
              </div>

              {/* 3. Suppliers & Invoices */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span className="font-black text-xs text-slate-800">{t('دابینکەران و کڕین', 'Suppliers & Purchases')}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-mono font-bold text-slate-700">
                    {suppliersCount} {t('دابینکەر', 'suppliers')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {t('سڕینەوەی دابینکەران، پسوولەکانی کڕین و مێژووی پارەدان.', 'Deletes supplier records, purchase invoices and payment history.')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: t('سڕینەوەی دابینکەران', 'Delete All Suppliers'),
                      description: t('ئایا دڵنیایت لە سڕینەوەی هەموو دابینکەران و پسوولەکانی کڕین؟', 'Are you sure you want to delete all suppliers and purchase logs?'),
                      countText: `${suppliersCount} ${t('دابینکەر', 'suppliers')}`,
                      onConfirm: () => {
                        if (onClearSectionData) onClearSectionData('suppliers');
                        setFeedback(t('تەواوی دابینکەران بە سەرکەوتوویی سڕانەوە', 'Suppliers data cleared'));
                        setTimeout(() => setFeedback(''), 3000);
                      },
                    });
                  }}
                  disabled={suppliersCount === 0}
                  className="w-full py-2 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-rose-600 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('سڕینەوەی دابینکەران', 'Clear Suppliers')}</span>
                </button>
              </div>

              {/* 4. Sales Invoices History */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-purple-600" />
                    <span className="font-black text-xs text-slate-800">{t('پسوولەکانی فرۆشتن', 'Sales Invoices')}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-mono font-bold text-slate-700">
                    {invoicesCount} {t('پسوولە', 'invoices')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {t('سڕینەوەی مێژووی تەواوی پسوولەکانی فرۆشتن و ڕاپۆرتەکان.', 'Deletes completed sales invoice history and transactions.')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: t('سڕینەوەی پسوولەکانی فرۆشتن', 'Delete Sales Invoices'),
                      description: t('ئایا دڵنیایت لە سڕینەوەی مێژووی تەواوی پسوولەکانی فرۆشتن؟', 'Are you sure you want to permanently clear sales transaction history?'),
                      countText: `${invoicesCount} ${t('پسوولە', 'invoices')}`,
                      onConfirm: () => {
                        if (onClearSectionData) onClearSectionData('invoices');
                        setFeedback(t('تەواوی پسوولەکانی فرۆشتن بە سەرکەوتوویی سڕانەوە', 'Sales invoices cleared'));
                        setTimeout(() => setFeedback(''), 3000);
                      },
                    });
                  }}
                  disabled={invoicesCount === 0}
                  className="w-full py-2 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-rose-600 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('سڕینەوەی فرۆشتنەکان', 'Clear Invoices')}</span>
                </button>
              </div>

              {/* 5. Expenses */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <span className="font-black text-xs text-slate-800">{t('تۆماری خەرجییەکان', 'Expenses Records')}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-mono font-bold text-slate-700">
                    {expensesCount} {t('تۆمار', 'records')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {t('سڕینەوەی تەواوی تۆمارکراوەکانی خەرجی دوکان و پەراوگە.', 'Deletes recorded daily/monthly expenses history.')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: t('سڕینەوەی خەرجییەکان', 'Delete All Expenses'),
                      description: t('ئایا دڵنیایت لە سڕینەوەی هەموو تۆمارەکانی خەرجی؟', 'Are you sure you want to permanently clear expenses records?'),
                      countText: `${expensesCount} ${t('خەرجی', 'expenses')}`,
                      onConfirm: () => {
                        if (onClearSectionData) onClearSectionData('expenses');
                        setFeedback(t('تەواوی خەرجییەکان بە سەرکەوتوویی سڕانەوە', 'Expenses cleared'));
                        setTimeout(() => setFeedback(''), 3000);
                      },
                    });
                  }}
                  disabled={expensesCount === 0}
                  className="w-full py-2 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-rose-600 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('سڕینەوەی خەرجییەکان', 'Clear Expenses')}</span>
                </button>
              </div>

              {/* 6. Held Carts / Sales */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PauseCircle className="w-4 h-4 text-cyan-600" />
                    <span className="font-black text-xs text-slate-800">{t('سەبەتەی هەڵپەسێردراو', 'Held Sales / Carts')}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-mono font-bold text-slate-700">
                    {heldSalesCount} {t('دانە', 'held')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {t('پاککردنەوەی سەبەتەی هەڵپەسێردراو و کاتیی کاشێرەکان.', 'Clears all held carts and temporary cashier basket items.')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: t('سڕینەوەی سەبەتەی هەڵپەسێردراو', 'Clear Held Carts'),
                      description: t('ئایا دڵنیایت لە پاککردنەوەی هەموو سەبەتە هەڵپەسێردراوەکان؟', 'Are you sure you want to clear all held sales and cart caches?'),
                      onConfirm: () => {
                        if (onClearSectionData) onClearSectionData('held_sales');
                        setFeedback(t('تەواوی سەبەتە هەڵپەسێردراوەکان پاککرانەوە', 'Held carts cleared'));
                        setTimeout(() => setFeedback(''), 3000);
                      },
                    });
                  }}
                  className="w-full py-2 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-rose-600 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('پاککردنەوەی سەبەتەکان', 'Clear Carts')}</span>
                </button>
              </div>

            </div>
          </div>

          {/* ── Danger Zone: Full Wipe / Factory Reset ── */}
          <div className="bg-rose-50/60 border-2 border-rose-200/80 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-rose-900">
                    {t('سڕینەوەی گشتیی هەموو داتاکان (Factory Database Reset)', 'Wipe Entire Database (Factory Reset)')}
                  </h3>
                  <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                    {t('سڕینەوەی یەکجارەکی هەموو کاڵاکان، کڕیاران، دابینکەران، پسوولەکان، خەرجییەکان و لۆگەکان لە داتابەیسدا. (ئەم کردارە ناگەڕێتەوە)', 'Permanently deletes all products, customers, suppliers, invoices, expenses, and logs. This operation is irreversible.')}
                  </p>
                </div>
              </div>

              {onClearAllData && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: t('سڕینەوەی تەواوی داتاکانی داتابەیس', 'Wipe Entire Database'),
                      description: t('ئاگاداربە! ئەم کردارە هەموو داتاکانی سیستەمەکە بە تەواوی دەسڕێتەوە و دەیکاتەوە سفر وەک ڕۆژی یەکەم. ئایا دڵنیایت؟', 'WARNING: This will permanently wipe ALL products, customers, debts, invoices, expenses, and logs! Are you absolutely sure?'),
                      isDangerAll: true,
                      onConfirm: () => {
                        onClearAllData();
                        setFeedback(t('تەواوی داتاکانی داتابەیس بە سەرکەوتوویی سڕانەوە', 'All database collections have been completely wiped'));
                        setTimeout(() => setFeedback(''), 4000);
                      },
                    });
                  }}
                  className="px-5 py-3 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-rose-600/25 transition-all cursor-pointer shrink-0"
                >
                  <AlertOctagon className="w-4 h-4" />
                  <span>{t('سڕینەوەی گشتیی هەموو داتاکان', 'Wipe Entire Database')}</span>
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ── Subtab 5: System Updates ── */}
      {activeTab === 'system_updates' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Github className="w-4 h-4 text-slate-800 shrink-0" />
              <h2 className="font-black text-sm text-slate-800">
                {t('نوێکردنەوەی بەرنامە لە GitHub', 'System Updates from GitHub')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">
                  {t('وەشانی ئێستا:', 'Current Version:')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black font-mono text-indigo-600">v2.5.0</span>
                  <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-md">
                    {t('جێگیر و چالاک', 'Stable & Active')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium pt-1 leading-relaxed">
                  {t('سیستەمی باران POS بە بەردەوامی نوێ دەکرێتەوە بۆ باشترین ئەزموونی کارکردن.', 'Baran POS is constantly maintained with latest features and optimizations.')}
                </p>
              </div>

              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    {t('پەیوەندی بە GitHub:', 'GitHub Connection:')}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-800">
                      {t('پەیوەستکراوە بە سێرڤەری گەشەپێدان', 'Connected to Repository')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckUpdates}
                  disabled={isCheckingUpdate}
                  className="w-full py-2.5 bg-slate-900 hover:bg-black active:scale-[0.99] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                  <span>{isCheckingUpdate ? t('پشکنین دەکرێت...', 'Checking...') : t('پشکنین بۆ نوێکردنەوە', 'Check for Updates')}</span>
                </button>
              </div>
            </div>

            {updateStatus && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{updateStatus}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Confirmation Modal for Data Deletions ── */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden font-sans text-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${confirmModal.isDangerAll ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                {confirmModal.isDangerAll ? <AlertOctagon className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-black text-base text-slate-900">
                {confirmModal.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {confirmModal.description}
              </p>
              {confirmModal.countText && (
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 flex items-center justify-between">
                  <span>{t('بڕی داتا بۆ سڕینەوە:', 'Data Count:')}</span>
                  <span className="text-rose-600 font-black">{confirmModal.countText}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className={`flex-1 py-3 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer ${
                  confirmModal.isDangerAll ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                }`}
              >
                {t('دڵنیام، بیسڕەوە', 'Yes, Delete')}
              </button>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                {t('پاشگەزبوونەوە', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

