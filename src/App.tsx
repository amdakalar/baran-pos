import React from 'react';
import { Sidebar } from './components/Sidebar';
import { PosRegister } from './components/PosRegister';
import { CustomPrintCalculator } from './components/CustomPrintCalculator';
import { InventoryManager } from './components/InventoryManager';
import { StockExpiryManager } from './components/StockExpiryManager';
import { CustomersManager } from './components/CustomersManager';
import { SuppliersManager } from './components/SuppliersManager';
import { ExpensesManager } from './components/ExpensesManager';
import { ShiftManager } from './components/ShiftManager';
import { DiscountsManager } from './components/DiscountsManager';
import { ReportsManager } from './components/ReportsManager';
import { BarcodePrinter } from './components/BarcodePrinter';
import { SettingsManager } from './components/SettingsManager';
import { ReceiptModal } from './components/ReceiptModal';
import { AdminPanel } from './components/AdminPanel';
import { LoginModal } from './components/LoginModal';
import { UpdatePromptModal } from './components/UpdatePromptModal';
import { APP_VERSION, fetchLatestRelease, AppUpdateInfo, openExternalUrl } from './utils/version';
import { Sparkles, Download, X } from 'lucide-react';

import {
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_ITEM_TYPES,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_EXPENSES,
  INITIAL_SHIFT,
  INITIAL_AUDIT_LOGS,
  INITIAL_INVOICES,
} from './data/initialData';

import {
  User,
  NavigationTab,
  Product,
  Category,
  Brand,
  ItemType,
  Customer,
  Supplier,
  Expense,
  Shift,
  AuditLog,
  SalesInvoice,
  HeldSale,
  StockAdjustment,
  CustomerPayment,
  PurchaseInvoice,
  SystemConfig,
} from './types';
import { Currency } from './utils/currency';
import { getSampleImageForProduct } from './utils/productImages';

// Database access is now through window.electronAPI.db (Electron IPC)
// Data is loaded asynchronously on mount and saved through IPC on changes

interface LicenseActivationScreenProps {
  hardwareId: string;
  initialMessage?: string;
  onActivated: (status: any, message: string) => void;
}

const LicenseActivationScreen: React.FC<LicenseActivationScreenProps> = ({
  hardwareId,
  initialMessage,
  onActivated,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [keyInput, setKeyInput] = React.useState('');
  const [message, setMessage] = React.useState(initialMessage || '');

  const handleCopyHwId = () => {
    if (hardwareId) {
      navigator.clipboard?.writeText(hardwareId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleActivate = async () => {
    if (!keyInput.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await window.electronAPI.license.activate(keyInput.trim());
      if (result.success) {
        onActivated(result.licenseStatus || null, result.message);
      } else {
        setMessage(result.message);
      }
    } catch (err: any) {
      setMessage(err?.message || 'هەڵەیەک ڕوویدا لە کاتی چالاککردندا');
    } finally {
      setIsSubmitting(false);
    }
  };

  const planTiers = [
    { name: 'تاقیکردنەوە (٧ ڕۆژ)', duration: '٧ ڕۆژ', price: 'بێ بەرامبەر', highlight: false },
    { name: '٣ مانگ', duration: '٩٠ ڕۆژ', price: '١٠٠,٠٠٠', highlight: false },
    { name: '٦ مانگ', duration: '١٨٠ ڕۆژ', price: '١٥٠,٠٠٠', highlight: false },
    { name: '١ ساڵ (ساڵانە)', duration: '٣٦٥ ڕۆژ', price: '٢٩٠,٠٠٠', highlight: false },
    { name: 'مۆڵەتی هەمیشەیی (Lifetime)', duration: 'بێ کۆتا', price: '٤٥٠,٠٠٠', highlight: true },
  ];

  return (
    <div 
      className="min-h-screen w-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 sm:p-6 overflow-y-auto selection:bg-indigo-500/30"
      dir="rtl"
      style={{ fontFamily: "'Noto Kufi Arabic', system-ui, sans-serif" }}
    >
      <div className="w-full max-w-[500px] bg-[#121215] border border-zinc-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 my-auto">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3.5 w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 p-2 flex items-center justify-center shadow-inner">
            <img src="./icon.png" alt="Baran POS" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            چالاککردنی مۆڵەتنامەی باران POS
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            مۆڵەتی فەرمی بەکارهێنانی سیستەم لەسەر ئەم ئامێرە
          </p>
          {message && (
            <div className="mt-3 py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-medium">
              {message}
            </div>
          )}
        </div>

        <div className="space-y-4">
          
          {/* Hardware ID Block */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300">ناسنامەی ئەم کۆمپیوتەرە (Hardware ID)</span>
              <span className="text-[11px] text-zinc-500 font-normal">تایبەت بەم ئامێرە</span>
            </div>
            
            <div className="flex items-center gap-2 bg-zinc-950/90 border border-zinc-800/90 rounded-xl p-1.5 ps-3 focus-within:border-zinc-700 transition-colors">
              <input
                type="text"
                readOnly
                value={hardwareId}
                className="flex-1 bg-transparent text-[11px] text-zinc-300 font-mono select-all focus:outline-none tracking-tight"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={handleCopyHwId}
                className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  copied 
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-200 border border-zinc-700/60'
                }`}
              >
                {copied ? 'کۆپیکرا ✓' : 'کۆپیکردن'}
              </button>
            </div>
          </div>

          {/* Plans & Pricing (Clean Minimal Table) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300">پلانەکانی بەشداریکردن</span>
              <span className="text-[11px] text-zinc-500 font-normal">بەپێی ماوە و نرخ</span>
            </div>

            <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/60 overflow-hidden divide-y divide-zinc-800/60 text-xs">
              {planTiers.map((tier, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between px-3.5 py-2 transition-colors ${
                    tier.highlight ? 'bg-indigo-950/20' : 'hover:bg-zinc-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${tier.highlight ? 'bg-indigo-400' : 'bg-zinc-600'}`} />
                    <span className={`font-medium ${tier.highlight ? 'text-indigo-200 font-semibold' : 'text-zinc-300'}`}>
                      {tier.name}
                    </span>
                  </div>
                  <span className={`font-mono text-[11px] ${
                    tier.highlight 
                      ? 'text-emerald-400 font-bold' 
                      : tier.price === 'بێ بەرامبەر'
                      ? 'text-emerald-400/90 font-medium'
                      : 'text-zinc-300 font-semibold'
                  }`}>
                    {tier.price}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activation Key Field */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-zinc-300">
              کلیلی چالاککردن (Activation Key)
            </label>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="BARAN-XXXX-XXXX-XXXX..."
              className="w-full h-11 rounded-xl bg-zinc-950/90 border border-zinc-800 px-3.5 text-xs text-white font-mono tracking-wider placeholder:text-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all uppercase"
              dir="ltr"
            />
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleActivate}
            disabled={!keyInput.trim() || isSubmitting}
            className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'چالاککردنی سیستەم'
            )}
          </button>

        </div>

        {/* Minimal Clean Footer */}
        <div className="mt-5 pt-4 border-t border-zinc-800/60 text-center">
          <p className="text-[11px] text-zinc-500 font-normal">
            سیستەمی باران POS • پارێزراوە بە ئینکریپشنی هاردوێر
          </p>
        </div>

      </div>
    </div>
  );
};

export default function App() {
  // Loading & License State
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [licenseValid, setLicenseValid] = React.useState<boolean | null>(null);
  const [licenseStatus, setLicenseStatus] = React.useState<any>(null);
  const [licenseHardwareId, setLicenseHardwareId] = React.useState<string>('');
  const [licenseMessage, setLicenseMessage] = React.useState<string>('');
  const [cloudStatus, setCloudStatus] = React.useState<any>(null);
  const [isSyncingCloud, setIsSyncingCloud] = React.useState<boolean>(false);

  // Application Persistent State
  const [users, setUsers] = React.useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = React.useState<User>(INITIAL_USERS[0]);
  const [currentTab, setCurrentTab] = React.useState<NavigationTab>('pos');
  const [lang, setLang] = React.useState<'en' | 'ku'>('ku');
  const [isOffline, setIsOffline] = React.useState<boolean>(false);
  const [currency, setCurrency] = React.useState<Currency>('IQD');
  const [exchangeRate, setExchangeRate] = React.useState<number>(1500);

  // Pending Custom Print Jobs Array State
  const [pendingCustomPrintJobs, setPendingCustomPrintJobs] = React.useState<
    Array<{
      product: Product;
      quantity: number;
      details: string;
      calculatedPrice: number;
    }>
  >([]);

  const [systemConfig, setSystemConfig] = React.useState<SystemConfig>({
    shopNameEn: 'BARAN STATIONERY',
    shopNameKu: 'پەراوگەى باران',
    posType: 'stationery',
    requireLoginPin: false,
    currency: 'IQD',
    exchangeRate: 1500,
    taxPercent: 0,
    phone: '',
    address: '',
    displayScale: 'medium',
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState<boolean>(false);
  const [loginModalTargetUser, setLoginModalTargetUser] = React.useState<User | undefined>(undefined);

  const handleUpdateSystemConfig = (config: SystemConfig) => {
    setSystemConfig(config);
    setExchangeRate(config.exchangeRate);
    if (config.requireLoginPin && !systemConfig.requireLoginPin) {
      setLoginModalTargetUser(currentUser);
      setIsLoginModalOpen(true);
    }
  };

  const handleToggleCurrency = () => {
    setCurrency((prev) => (prev === 'IQD' ? 'USD' : 'IQD'));
  };

  // Sync document direction and language for RTL support
  React.useEffect(() => {
    document.documentElement.dir = lang === 'ku' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Sync document display scale & screen density for different screen resolutions
  React.useEffect(() => {
    const scale = systemConfig.displayScale || 'medium';
    document.documentElement.style.removeProperty('zoom');
    document.body.style.removeProperty('zoom');
    document.documentElement.setAttribute('data-display-scale', scale);
  }, [systemConfig.displayScale]);

  // Security Guard: Prevent cashier from accessing admin tab or restricted tabs
  React.useEffect(() => {
    if (currentUser.role === 'cashier') {
      if (currentTab === 'admin') {
        setCurrentTab('pos');
      } else if (currentUser.permissions?.allowedTabs && !currentUser.permissions.allowedTabs.includes(currentTab)) {
        const firstAllowed = currentUser.permissions.allowedTabs[0] || 'pos';
        setCurrentTab(firstAllowed);
      }
    }
  }, [currentUser, currentTab]);

  // Entities — initialized with defaults, loaded from encrypted DB on mount
  const [products, setProducts] = React.useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = React.useState<Category[]>(INITIAL_CATEGORIES);
  const [brands] = React.useState<Brand[]>(INITIAL_BRANDS);
  const [itemTypes] = React.useState<ItemType[]>(INITIAL_ITEM_TYPES);
  const [customers, setCustomers] = React.useState<Customer[]>(INITIAL_CUSTOMERS);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [expenses, setExpenses] = React.useState<Expense[]>(INITIAL_EXPENSES);
  const [payments, setPayments] = React.useState<CustomerPayment[]>([]);
  const [currentShift, setCurrentShift] = React.useState<Shift>(INITIAL_SHIFT);
  const [invoices, setInvoices] = React.useState<SalesInvoice[]>(INITIAL_INVOICES);
  const [purchaseInvoices, setPurchaseInvoices] = React.useState<PurchaseInvoice[]>([]);
  const [heldSales, setHeldSales] = React.useState<HeldSale[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Cloud Sync Handler
  const triggerCloudSync = React.useCallback(async (customConfig?: SystemConfig, customUser?: User) => {
    if (!window.electronAPI?.cloudLicense) return;
    try {
      setIsSyncingCloud(true);
      const cfg = customConfig || systemConfig;
      const usr = customUser || currentUser;
      const res = await window.electronAPI.cloudLicense.sync({
        shopName: cfg.shopNameKu || 'پەراوگەى باران',
        customerName: usr.name || '',
        phone: cfg.phone || '',
      });
      setCloudStatus(res);
      if (res && res.isOnline) {
        setIsOffline(false);
      } else if (res && !res.isOnline) {
        setIsOffline(true);
      }
      if (res && res.isLocked) {
        setLicenseValid(false);
        setLicenseMessage(res.message);
      } else if (res && res.isOnline && res.state === 'online_active') {
        const lic = await window.electronAPI.license.check();
        setLicenseStatus(lic);
        setLicenseValid(lic.valid);
        setLicenseMessage(lic.message);
      }
    } catch (e) {
      console.error('Cloud sync error:', e);
    } finally {
      setIsSyncingCloud(false);
    }
  }, [systemConfig, currentUser]);

  // Load data from encrypted database on mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Check license first
        const licenseResult = await window.electronAPI.license.check();
        setLicenseStatus(licenseResult);
        setLicenseHardwareId(licenseResult.hardwareId);
        setLicenseMessage(licenseResult.message);

        // Check local cloud / offline status
        if (window.electronAPI.cloudLicense) {
          const localCloud = await window.electronAPI.cloudLicense.getStatus();
          setCloudStatus(localCloud);
        }

        if (!licenseResult.valid) {
          setLicenseValid(false);
          setIsLoading(false);
          return;
        }
        setLicenseValid(true);

        // Load all data from encrypted DB
        const data = await window.electronAPI.db.getMultiple([
          { key: 'baran_pos_users', fallback: INITIAL_USERS },
          { key: 'baran_pos_products', fallback: INITIAL_PRODUCTS },
          { key: 'baran_pos_categories', fallback: INITIAL_CATEGORIES },
          { key: 'baran_pos_customers', fallback: INITIAL_CUSTOMERS },
          { key: 'baran_pos_suppliers', fallback: INITIAL_SUPPLIERS },
          { key: 'baran_pos_expenses', fallback: INITIAL_EXPENSES },
          { key: 'baran_pos_payments', fallback: [] },
          { key: 'baran_pos_shift', fallback: INITIAL_SHIFT },
          { key: 'baran_pos_invoices', fallback: INITIAL_INVOICES },
          { key: 'baran_pos_purchase_invoices', fallback: [] },
          { key: 'baran_pos_held_sales', fallback: [] },
          { key: 'baran_pos_audit_logs', fallback: INITIAL_AUDIT_LOGS },
          { key: 'baran_pos_system_config', fallback: null },
        ]);

        const loadedUsers = data['baran_pos_users'] as User[];
        if (loadedUsers && loadedUsers.length > 0) {
          setUsers(loadedUsers);
          setCurrentUser(loadedUsers[0]);
        }
        setProducts(data['baran_pos_products'] as Product[] || INITIAL_PRODUCTS);
        setCategories(data['baran_pos_categories'] as Category[] || INITIAL_CATEGORIES);
        setCustomers(data['baran_pos_customers'] as Customer[] || INITIAL_CUSTOMERS);
        setSuppliers(data['baran_pos_suppliers'] as Supplier[] || INITIAL_SUPPLIERS);
        setExpenses(data['baran_pos_expenses'] as Expense[] || INITIAL_EXPENSES);
        setPayments(data['baran_pos_payments'] as CustomerPayment[] || []);
        setCurrentShift(data['baran_pos_shift'] as Shift || INITIAL_SHIFT);
        setInvoices(data['baran_pos_invoices'] as SalesInvoice[] || INITIAL_INVOICES);
        setPurchaseInvoices(data['baran_pos_purchase_invoices'] as PurchaseInvoice[] || []);
        setHeldSales(data['baran_pos_held_sales'] as HeldSale[] || []);
        setAuditLogs(data['baran_pos_audit_logs'] as AuditLog[] || INITIAL_AUDIT_LOGS);

        const loadedConfig = data['baran_pos_system_config'] as SystemConfig | null;
        if (loadedConfig) {
          setSystemConfig(loadedConfig);
          setExchangeRate(loadedConfig.exchangeRate);
        }

        // Trigger cloud heartbeat sync in background
        triggerCloudSync(loadedConfig || undefined, loadedUsers ? loadedUsers[0] : undefined);
      } catch (e) {
        console.error('Failed to load data from database:', e);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Periodic Cloud Heartbeat Sync (every 3 minutes)
  React.useEffect(() => {
    if (isLoading || licenseValid === false) return;
    const interval = setInterval(() => {
      triggerCloudSync();
    }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isLoading, licenseValid, triggerCloudSync]);

  // Save to encrypted database on changes (debounced via async IPC)
  const dbSet = React.useCallback((key: string, value: unknown) => {
    window.electronAPI?.db?.set(key, value).catch(() => {});
  }, []);

  React.useEffect(() => { if (!isLoading) dbSet('baran_pos_products', products); }, [products, isLoading, dbSet]);
  React.useEffect(() => { if (!isLoading) dbSet('baran_pos_categories', categories); }, [categories, isLoading, dbSet]);
  React.useEffect(() => { if (!isLoading) dbSet('baran_pos_customers', customers); }, [customers, isLoading, dbSet]);
  React.useEffect(() => { if (!isLoading) dbSet('baran_pos_suppliers', suppliers); }, [suppliers, isLoading, dbSet]);
  React.useEffect(() => { if (!isLoading) dbSet('baran_pos_invoices', invoices); }, [invoices, isLoading, dbSet]);
  React.useEffect(() => { if (!isLoading) dbSet('baran_pos_purchase_invoices', purchaseInvoices); }, [purchaseInvoices, isLoading, dbSet]);
  React.useEffect(() => { if (!isLoading) dbSet('baran_pos_expenses', expenses); }, [expenses, isLoading, dbSet]);
  React.useEffect(() => { if (!isLoading) dbSet('baran_pos_payments', payments); }, [payments, isLoading, dbSet]);
  React.useEffect(() => { if (!isLoading) dbSet('baran_pos_system_config', systemConfig); }, [systemConfig, isLoading, dbSet]);
  React.useEffect(() => { if (!isLoading) dbSet('baran_pos_shift', currentShift); }, [currentShift, isLoading, dbSet]);
  React.useEffect(() => { if (!isLoading) dbSet('baran_pos_held_sales', heldSales); }, [heldSales, isLoading, dbSet]);
  React.useEffect(() => { if (!isLoading) dbSet('baran_pos_audit_logs', auditLogs); }, [auditLogs, isLoading, dbSet]);
  React.useEffect(() => { if (!isLoading) dbSet('baran_pos_users', users); }, [users, isLoading, dbSet]);

  // Active Receipt Modal
  const [activeInvoiceForReceipt, setActiveInvoiceForReceipt] = React.useState<SalesInvoice | null>(null);

  // ── Auto-Update Detection & Notification Modal ──
  const [appUpdateAvailable, setAppUpdateAvailable] = React.useState<AppUpdateInfo | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    let isMounted = true;
    const checkUpdate = async () => {
      try {
        const update = await fetchLatestRelease(APP_VERSION);
        if (update && isMounted) {
          setAppUpdateAvailable(update);
          // Check if snoozed in this browser session
          const snoozedUntil = sessionStorage.getItem('baran_update_snoozed_until');
          const isSnoozed = snoozedUntil && parseInt(snoozedUntil, 10) > Date.now();
          if (!isSnoozed) {
            setIsUpdateModalOpen(true);
          }
        }
      } catch (err) {
        console.warn('[App] Update check failed:', err);
      }
    };

    // Initial check after 2 seconds
    const initialTimer = setTimeout(checkUpdate, 2000);
    // Background interval check every 30 minutes
    const intervalTimer = setInterval(checkUpdate, 30 * 60 * 1000);

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  const handleSnoozeUpdate = () => {
    // Snooze modal for 2 hours (user can still open via sidebar / settings)
    sessionStorage.setItem('baran_update_snoozed_until', String(Date.now() + 2 * 60 * 60 * 1000));
    setIsUpdateModalOpen(false);
  };

  // Audit Helper
  const logAudit = (action: string, details: string, category: AuditLog['category']) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      user: currentUser.name,
      action,
      details,
      category,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Stock Alert & Overdue Debtors Counters
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockAlert).length;
  const expiringCount = products.filter(
    (p) => p.expiryDate && new Date(p.expiryDate).getTime() < Date.now() + 86400000 * 30
  ).length;

  const getOverdueDays = (c: Customer): number => {
    if (c.currentDebt <= 0) return 0;
    if (c.lastDebtDate) {
      const diffTime = new Date().getTime() - new Date(c.lastDebtDate).getTime();
      return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    }
    return c.id === 'cust_1' ? 35 : 10;
  };
  const overdueDebtorsCount = customers.filter((c) => c.currentDebt > 0 && getOverdueDays(c) >= 30).length;

  // POS Handlers
  const handleHoldSale = (heldSale: HeldSale) => {
    setHeldSales((prev) => [heldSale, ...prev]);
    logAudit('HOLD_SALE', `کارتێکی فرۆشتن بە ${heldSale.items.length} کاڵا بۆ (${heldSale.customerName || 'کڕیاری ئاسایی'}) بە کاتی ڕاگیرا`, 'sale');
  };

  const handleResumeSale = (heldSaleId: string) => {
    setHeldSales((prev) => prev.filter((h) => h.id !== heldSaleId));
  };

  const handleCompleteSale = (invoice: SalesInvoice) => {
    // 1. Add invoice
    setInvoices((prev) => [invoice, ...prev]);

    // 2. Reduce Stock
    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = invoice.items.find((item) => item.product.id === p.id);
        if (cartItem) {
          return {
            ...p,
            stockQuantity: Math.max(0, p.stockQuantity - cartItem.quantity),
          };
        }
        return p;
      })
    );

    // 3. Update Shift Sales
    setCurrentShift((prev) => ({
      ...prev,
      cashSales: invoice.paymentMethod === 'cash' ? prev.cashSales + invoice.grandTotal : prev.cashSales,
      debtSales: invoice.paymentMethod === 'credit' ? prev.debtSales + invoice.grandTotal : prev.debtSales,
      expectedCashInDrawer:
        invoice.paymentMethod === 'cash' ? prev.expectedCashInDrawer + invoice.grandTotal : prev.expectedCashInDrawer,
    }));

    // 4. Update Customer Debt & Total Purchases
    if (invoice.customerId) {
      const todayStr = new Date().toISOString().split('T')[0];
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === invoice.customerId) {
            return {
              ...c,
              totalPurchases: (c.totalPurchases || 0) + invoice.grandTotal,
              currentDebt: invoice.paymentMethod === 'credit' ? c.currentDebt + invoice.grandTotal : c.currentDebt,
              lastDebtDate: invoice.paymentMethod === 'credit' ? todayStr : c.lastDebtDate,
            };
          }
          return c;
        })
      );
    }

    const payMethodName = invoice.paymentMethod === 'cash' ? 'کاش (نەختینە)' : 'قەرز (حساب)';
    logAudit(
      'SALE_COMPLETE',
      `پسوولەی فرۆشتنی #${invoice.invoiceNumber} بە بڕی ${invoice.grandTotal.toLocaleString()} بە شێوازی ${payMethodName} تەواو کرا`,
      'sale'
    );

    // 5. Open Receipt Modal
    setActiveInvoiceForReceipt(invoice);
  };

  // Sales Return & Invoice Void Handler
  const handleProcessReturn = (
    invoiceId: string,
    returnedItems: { product: Product; quantity: number; refundPrice: number }[],
    totalRefund: number,
    reason: string,
    isFullVoid: boolean
  ) => {
    // 1. Update Invoices: Mark target invoice as voided or returned
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            status: isFullVoid ? ('voided' as const) : ('returned' as const),
            returnReason: reason,
          };
        }
        return inv;
      })
    );

    // 2. Restock Inventory
    setProducts((prev) =>
      prev.map((p) => {
        const item = returnedItems.find((r) => r.product.id === p.id);
        if (item) {
          return {
            ...p,
            stockQuantity: p.stockQuantity + item.quantity,
          };
        }
        return p;
      })
    );

    // 3. Find invoice to know payment method and customer
    const targetInvoice = invoices.find((inv) => inv.id === invoiceId);
    const isCash = targetInvoice ? targetInvoice.paymentMethod === 'cash' : true;
    const custId = targetInvoice?.customerId;

    // 4. Update Shift (if cash refund)
    if (isCash) {
      setCurrentShift((prev) => ({
        ...prev,
        totalRefunds: prev.totalRefunds + totalRefund,
        expectedCashInDrawer: Math.max(0, prev.expectedCashInDrawer - totalRefund),
      }));
    } else if (custId) {
      // 5. Update Customer Debt (if credit sale)
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === custId
            ? {
                ...c,
                currentDebt: Math.max(0, c.currentDebt - totalRefund),
              }
            : c
        )
      );
    }

    // 6. Log Audit
    const refundTypeName = isCash ? 'سندوقی کاش (نەختینە)' : 'حسابی قەرز';
    logAudit(
      isFullVoid ? 'VOID_INVOICE' : 'RETURN_ITEMS',
      `پسوولەی #${targetInvoice?.invoiceNumber || invoiceId} ${
        isFullVoid ? 'تەواو هەڵوەشێنرایەوە' : `${returnedItems.length} کاڵای لێ گەڕێنرایەوە`
      }. بڕی ${totalRefund.toLocaleString()} گەڕێنرایەوە بۆ (${refundTypeName}). هۆکار: ${reason || 'دیاری نەکراوە'}`,
      'sale'
    );
  };

  // Custom Print Job -> POS Cart
  const handleAddCustomPrintToCart = (
    product: Product,
    quantity: number,
    details: string,
    calculatedPrice: number
  ) => {
    // Inject product into catalog temporarily
    setProducts((prev) => [product, ...prev]);
    setPendingCustomPrintJobs((prev) => [
      ...prev,
      { product, quantity, details, calculatedPrice },
    ]);
    setCurrentTab('pos');
  };

  // Inventory Handlers
  const handleAddProduct = (product: Product) => {
    const enrichedProduct: Product = {
      ...product,
      image: product.image || getSampleImageForProduct(product.nameKu || product.name, product.categoryId),
      retailPrice: product.retailPrice || 0,
      costPrice: product.costPrice || 0,
      stockQuantity: product.stockQuantity !== undefined ? product.stockQuantity : 0,
    };
    setProducts((prev) => [enrichedProduct, ...prev]);
    logAudit(
      'ADD_PRODUCT',
      `کاڵای نوێ (${enrichedProduct.nameKu || enrichedProduct.name}) بە بارکۆدی (${enrichedProduct.barcode || 'بێ بارکۆد'}) و نرخی ${enrichedProduct.retailPrice.toLocaleString()} زیادکرا بۆ کۆگا`,
      'inventory'
    );
  };

  const handleBulkAddProducts = (newProds: Product[]) => {
    setProducts((prev) => {
      const barcodeMap = new Map(prev.map((p) => [p.barcode, p]));
      const result: Product[] = [...prev];

      for (const np of newProds) {
        const fallbackImg = getSampleImageForProduct(np.nameKu || np.name, np.categoryId);
        if (np.barcode && barcodeMap.has(np.barcode)) {
          const idx = result.findIndex((p) => p.barcode === np.barcode);
          if (idx >= 0) {
            result[idx] = {
              ...result[idx],
              ...np,
              id: result[idx].id,
              image: np.image || result[idx].image || fallbackImg,
              costPrice: np.costPrice || result[idx].costPrice,
              retailPrice: np.retailPrice || result[idx].retailPrice,
              stockQuantity: np.stockQuantity !== undefined ? np.stockQuantity : result[idx].stockQuantity,
            };
          }
        } else {
          result.unshift({
            ...np,
            image: np.image || fallbackImg,
            retailPrice: np.retailPrice || 0,
            costPrice: np.costPrice || 0,
            stockQuantity: np.stockQuantity !== undefined ? np.stockQuantity : 0,
          });
        }
      }
      return result;
    });
    logAudit('BULK_IMPORT', `هاوردەکردنی بەکۆمەڵی (${newProds.length}) کاڵا بۆ ناو سیستەمی کۆگا`, 'inventory');
  };

  const handleUpdateProduct = (product: Product) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? {
              ...p,
              ...product,
              image: product.image || p.image || getSampleImageForProduct(product.nameKu || product.name, product.categoryId),
            }
          : p
      )
    );
    logAudit('UPDATE_PRODUCT', `دەستکاریکردنی زانیاری و نرخی کاڵای (${product.nameKu || product.name})`, 'inventory');
  };

  const handleStockAdjustment = (adj: StockAdjustment) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === adj.productId ? { ...p, stockQuantity: adj.newStock } : p))
    );
    const sign = adj.quantityChange > 0 ? `+${adj.quantityChange}` : `${adj.quantityChange}`;
    logAudit(
      'STOCK_ADJUSTMENT',
      `دەستکاری کۆگا بۆ (${adj.productName}): بڕی گۆڕانکاری (${sign})، کۆگای نوێ: ${adj.newStock} دانە. هۆکار: ${adj.reason || 'ڕێکخستنی دەستی'}`,
      'inventory'
    );
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    logAudit('DELETE_PRODUCT', `سڕینەوەی کاڵا لە لیستی کۆگا`, 'inventory');
  };

  const handleAddCategory = (newCat: Category) => {
    setCategories((prev) => [...prev, newCat]);
    logAudit('ADD_CATEGORY', `زیادکردنی بەشی نوێی کاڵاکان: (${newCat.nameKu || newCat.name})`, 'inventory');
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    logAudit('DELETE_CATEGORY', `سڕینەوەی بەش لە کۆگا`, 'inventory');
  };

  // Customer Debt Handlers
  const handleAddCustomer = (customer: Customer) => {
    setCustomers((prev) => [customer, ...prev]);
    logAudit('ADD_CUSTOMER', `تۆمارکردنی کڕیاری نوێ: (${customer.name}) بە مۆبایلی (${customer.phone || 'بێ ژمارە'})`, 'customer');
  };

  const handleUpdateCustomer = (customer: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === customer.id ? customer : c)));
    logAudit('UPDATE_CUSTOMER', `دەستکاریکردنی زانیاری هەژماری کڕیار: (${customer.name})`, 'customer');
  };

  const handleReceiveCustomerPayment = (payment: CustomerPayment) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setPayments((prev) => [payment, ...prev]);
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === payment.customerId
          ? {
              ...c,
              currentDebt: Math.max(0, c.currentDebt - payment.amount),
              lastDebtDate: todayStr, // Postpones overdue alert by 30 days upon payment!
            }
          : c
      )
    );
    const matchedCust = customers.find(c => c.id === payment.customerId);
    logAudit('DEBT_PAYMENT', `وەرگرتنەوەی بڕی ${payment.amount.toLocaleString()} لە قەرزی کڕیار (${matchedCust?.name || payment.customerId})`, 'debt');
  };

  const handleUpdateCustomerPayment = (updatedPayment: CustomerPayment, oldPayment: CustomerPayment) => {
    const diff = updatedPayment.amount - oldPayment.amount;

    setPayments((prev) => prev.map((p) => (p.id === updatedPayment.id ? updatedPayment : p)));
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === updatedPayment.customerId) {
          const newDebt = Math.max(0, c.currentDebt - diff);
          return {
            ...c,
            currentDebt: newDebt,
            lastDebtDate: updatedPayment.date,
          };
        }
        return c;
      })
    );

    logAudit(
      'EDIT_DEBT_PAYMENT',
      `دەستکاریکردنی پسوولەی پارەدانی قەرز: بڕی گۆڕانکاری ${diff.toLocaleString()} لە بەرواری ${updatedPayment.date}`,
      'debt'
    );
  };

  // Supplier & Purchase Invoice Handlers
  const handleAddSupplier = (supplier: Supplier) => {
    setSuppliers((prev) => [supplier, ...prev]);
    logAudit('ADD_SUPPLIER', `تۆمارکردنی دابینکەری نوێ: (${supplier.companyName})`, 'inventory');
  };

  const handleCreatePurchaseInvoice = (invoice: PurchaseInvoice) => {
    // Save to purchase invoices list
    setPurchaseInvoices((prev) => [invoice, ...prev.filter((inv) => inv.id !== invoice.id)]);

    // Restock products & update costs and selling prices
    setProducts((prev) => {
      const updated = [...prev];
      for (const item of invoice.items) {
        const existingIdx = updated.findIndex((p) => p.id === item.productId);
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            stockQuantity: updated[existingIdx].stockQuantity + item.quantity,
            costPrice: item.unitCost,
            retailPrice: item.retailPrice && item.retailPrice > 0 ? item.retailPrice : updated[existingIdx].retailPrice,
            wholesalePrice: item.retailPrice && item.retailPrice > 0 && !updated[existingIdx].wholesalePrice ? item.retailPrice : updated[existingIdx].wholesalePrice,
          };
        } else {
          // If custom item was added to invoice directly
          updated.unshift({
            id: item.productId,
            name: item.productName,
            nameKu: item.productName,
            sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
            categoryId: 'cat_1',
            brandId: 'brd_1',
            itemTypeId: 'typ_1',
            costPrice: item.unitCost,
            retailPrice: item.retailPrice && item.retailPrice > 0 ? item.retailPrice : Math.round(item.unitCost * 1.25),
            wholesalePrice: item.retailPrice && item.retailPrice > 0 ? item.retailPrice : Math.round(item.unitCost * 1.25),
            stockQuantity: item.quantity,
            unit: 'piece',
            minStockAlert: 10,
            isActive: true,
            image: getSampleImageForProduct(item.productName),
          });
        }
      }
      return updated;
    });

    // Update Supplier debt
    setSuppliers((prev) =>
      prev.map((s) => (s.id === invoice.supplierId ? { ...s, currentDebt: s.currentDebt + invoice.debtAmount } : s))
    );

    logAudit('PURCHASE_INVOICE', `تۆمارکردنی پسوولەی کڕینی کۆگا #${invoice.invoiceNumber} لە دابینکەر (${invoice.supplierName}) بە بڕی ${invoice.totalAmount.toLocaleString()}`, 'inventory');
  };

  const handlePaySupplier = (supplierId: string, amount: number) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplierId ? { ...s, currentDebt: Math.max(0, s.currentDebt - amount) } : s))
    );
    const sup = suppliers.find(s => s.id === supplierId);
    logAudit('SUPPLIER_PAYMENT', `پارەدان بە دابینکەر (${sup?.companyName || supplierId}) بە بڕی ${amount.toLocaleString()}`, 'system');
  };

  const handleUpdateSupplier = (updated: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    logAudit('SUPPLIER_UPDATE', `دەستکاریکردنی زانیاری دابینکەر: (${updated.companyName})`, 'inventory');
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    logAudit('SUPPLIER_DELETE', `سڕینەوەی دابینکەر لە سیستەم`, 'inventory');
  };

  // Expense Handlers
  const handleAddExpense = (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
    logAudit('EXPENSE_LOG', `تۆمارکردنی خەرجی: (${expense.title}) بە بڕی ${expense.amount.toLocaleString()}`, 'expense');
  };

  const handleUpdateExpense = (expense: Expense) => {
    setExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)));
    logAudit('EXPENSE_LOG', `دەستکاریکردنی خەرجی: (${expense.title}) بە بڕی ${expense.amount.toLocaleString()}`, 'expense');
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    logAudit('EXPENSE_LOG', `سڕینەوەی تۆماری خەرجی`, 'expense');
  };

  // Shift Handlers
  const handleCloseShift = (actualCash: number, notes: string) => {
    const expected = currentShift.openingFloat + currentShift.cashSales - currentShift.totalRefunds;
    const diff = actualCash - expected;

    setCurrentShift((prev) => ({
      ...prev,
      actualCashInDrawer: actualCash,
      difference: diff,
      status: 'closed',
      endTime: new Date().toISOString(),
      notes,
    }));

    logAudit('SHIFT_CLOSE', `داخستنی دەوام لەلایەن (${currentUser.name})، پارەی ناو سندوق: ${actualCash.toLocaleString()} (جیاوازی سندوق: ${diff.toLocaleString()})`, 'shift');

    // Trigger Non-blocking Zero-Lag Cloud Backup on Shift Close
    if (window.electronAPI?.cloudBackup?.create) {
      window.electronAPI.cloudBackup.create('shift_close', systemConfig.shopNameKu || systemConfig.shopNameEn).catch(() => {});
    }
  };

  const handleOpenNewShift = (openingFloat: number) => {
    const newShift: Shift = {
      id: `shf_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      startTime: new Date().toISOString(),
      openingFloat,
      cashSales: 0,
      debtSales: 0,
      totalRefunds: 0,
      expectedCashInDrawer: openingFloat,
      status: 'open',
    };
    setCurrentShift(newShift);
    logAudit('SHIFT_OPEN', `دەستپێکردنی دەوامی نوێ لەلایەن (${currentUser.name}) بە سەرمایەی سەرەتایی ${openingFloat.toLocaleString()}`, 'shift');
  };

  // Restore State
  const handleRestoreData = (restored: any) => {
    if (restored.products) {
      setProducts(
        restored.products.map((p: any) => ({
          ...p,
          image: p.image || getSampleImageForProduct(p.nameKu || p.name, p.categoryId),
          costPrice: Number(p.costPrice) || 0,
          retailPrice: Number(p.retailPrice) || 0,
          stockQuantity: Number(p.stockQuantity) || 0,
        }))
      );
    }
    if (restored.invoices) setInvoices(restored.invoices);
    if (restored.customers) setCustomers(restored.customers);
    if (restored.suppliers) setSuppliers(restored.suppliers);
    if (restored.categories) setCategories(restored.categories);
    if (restored.expenses) setExpenses(restored.expenses);
    logAudit('RESTORE_DATA', 'گەڕاندنەوەی تەواوی داتاکانی سیستەم لە فایلی باکئەپی JSON', 'system');
  };

  // Wipe All Data (Factory Reset)
  const handleClearAllData = () => {
    setProducts([]);
    setCustomers([]);
    setSuppliers([]);
    setInvoices([]);
    setPurchaseInvoices([]);
    setExpenses([]);
    setPayments([]);
    setHeldSales([]);
    setAuditLogs([]);
    window.electronAPI?.db?.clearAll().catch(() => {});
    logAudit('FACTORY_RESET', 'سڕینەوەی گشتی و ڕیسێتکردنەوەی سیستەم بۆ خاڵی سەرەتا (Factory Reset)', 'system');
  };

  // Selective Section Data Purge
  const handleClearSectionData = (section: 'products' | 'customers' | 'suppliers' | 'invoices' | 'expenses' | 'audit_logs' | 'held_sales') => {
    switch (section) {
      case 'products':
        setProducts([]);
        logAudit('PURGE_PRODUCTS', 'سڕینەوەی تەواوی کاڵاکان لە کۆگا', 'inventory');
        break;
      case 'customers':
        setCustomers([]);
        setPayments([]);
        logAudit('PURGE_CUSTOMERS', 'سڕینەوەی تەواوی هەژماری کڕیاران و مێژووی قەرزەکان', 'customer');
        break;
      case 'suppliers':
        setSuppliers([]);
        setPurchaseInvoices([]);
        logAudit('PURGE_SUPPLIERS', 'سڕینەوەی تەواوی دابینکەران و پسوولەکانی کڕین', 'inventory');
        break;
      case 'invoices':
        setInvoices([]);
        logAudit('PURGE_INVOICES', 'سڕینەوەی تەواوی پسوولەکانی فرۆشتن', 'sale');
        break;
      case 'expenses':
        setExpenses([]);
        logAudit('PURGE_EXPENSES', 'سڕینەوەی تەواوی تۆمارەکانی خەرجی', 'expense');
        break;
      case 'held_sales':
        setHeldSales([]);
        logAudit('PURGE_HELD_SALES', 'سڕینەوەی تەواوی کارتە ڕاگیراوەکانی کاشێر', 'sale');
        break;
      case 'audit_logs':
        setAuditLogs([]);
        break;
    }
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-900" dir="rtl">
        <div className="text-center">
          <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-2xl overflow-hidden shadow-xl shadow-indigo-500/10">
            <img src="./icon.png" alt="Baran POS" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>باران POS</h1>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '0ms' }}></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '150ms' }}></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="mt-3 text-sm text-zinc-400" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>چاوەڕوانبە...</p>
        </div>
      </div>
    );
  }

  // License Activation Screen
  if (licenseValid === false) {
    return (
      <LicenseActivationScreen
        hardwareId={licenseHardwareId}
        initialMessage={licenseMessage}
        onActivated={(status, message) => {
          setLicenseValid(true);
          setLicenseStatus(status);
          setLicenseMessage(message);
          window.location.reload();
        }}
      />
    );
  }

  // 48-Hour Offline Lockout Screen (Protects Ownership Rights)
  if (cloudStatus?.state === 'offline_locked') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-zinc-100 p-6 select-none" dir="rtl" style={{ fontFamily: "'Noto Kufi Arabic', system-ui, sans-serif" }}>
        <div className="max-w-md w-full bg-[#121215] border border-rose-500/40 rounded-2xl p-8 shadow-2xl text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">دەستگەیشتن بە سیستەم ڕاگیراوە</h2>
            <p className="text-xs text-rose-300/90 mt-2 leading-relaxed">
              سیستەم زیاتر لە ٤٨ کاتژمێرە لە دۆخی ئۆفلاینە و بە ئینتەرنێتەوە نەبەستراوەتەوە. بۆ پاراستنی مافی خاوەنداریەتی و سەلامەتی داتاکان، تکایە کۆمپیوتەرەکە بە ئینتەرنێتەوە ببەستەوە بۆ کرانەوەی ئۆتۆماتیکی.
            </p>
          </div>
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 font-mono select-all">
            ناسنامەی ئامێر: {licenseHardwareId ? licenseHardwareId.substring(0, 24) + '...' : '—'}
          </div>
          <button
            type="button"
            onClick={() => triggerCloudSync()}
            disabled={isSyncingCloud}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSyncingCloud ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'پشکنینەوەی پەیوەندی ئینتەرنێت'
            )}
          </button>
        </div>
      </div>
    );
  }

  // Remote Suspended Screen
  if (cloudStatus?.state === 'remote_suspended') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-zinc-100 p-6 select-none" dir="rtl" style={{ fontFamily: "'Noto Kufi Arabic', system-ui, sans-serif" }}>
        <div className="max-w-md w-full bg-[#121215] border border-rose-600/40 rounded-2xl p-8 shadow-2xl text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-600/10 border border-rose-600/30 flex items-center justify-center text-rose-500 text-2xl font-bold">
            ⛔
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">ئەم ئامێرە لە کلاود ڕاگیراوە</h2>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              مۆڵەتی بەکارهێنانی ئەم ئامێرە لەلایەن خاوەنی سیستەمەوە لە دوورەوە ڕاگیراوە (Suspended). تکایە پەیوەندی بکە بە بەڕێوەبەر بۆ چالاککردنەوە.
            </p>
          </div>
          <button
            type="button"
            onClick={() => triggerCloudSync()}
            disabled={isSyncingCloud}
            className="w-full h-11 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSyncingCloud ? 'خەریکی پشکنین...' : 'پشکنینەوەی دۆخی مۆڵەت لە کلاود'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-zinc-900 font-sans overflow-hidden select-none rounded-none" dir={lang === 'ku' ? 'rtl' : 'ltr'}>
      {/* Navigation Sidebar */}
      <Sidebar
        currentUser={currentUser}
        users={users}
        licenseStatus={licenseStatus}
        cloudStatus={cloudStatus}
        onSwitchUser={(u) => {
          setLoginModalTargetUser(u);
          setIsLoginModalOpen(true);
        }}
        onUpdateUser={(updated) => {
          setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
          if (currentUser.id === updated.id) {
            setCurrentUser(updated);
          }
        }}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        lowStockCount={lowStockCount}
        expiringCount={expiringCount}
        debtorsCount={overdueDebtorsCount}
        lang={lang}
        heldSalesCount={heldSales.length}
        requireLoginPin={systemConfig.requireLoginPin}
        systemConfig={systemConfig}
        appUpdateAvailable={appUpdateAvailable}
        onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
        onLockSystem={() => {
          setLoginModalTargetUser(currentUser);
          setIsLoginModalOpen(true);
        }}
      />

      {/* Main Desktop Screen Layout (No top header, no page footer) */}
      <main className="flex-1 flex flex-col overflow-hidden bg-zinc-100">
        {/* 48-Hour Offline Grace Period Warning Banner */}
        {cloudStatus && cloudStatus.state === 'offline_warning' && (
          <div className="bg-amber-500 text-zinc-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md shrink-0 border-b border-amber-600 z-30">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>
                ئاگاداری سەلامەتی: سیستەم لە دۆخی ئۆفلاین کار دەکات. پێویستە لەماوەی ({Math.floor(cloudStatus.remainingSeconds / 3600)} کاتژمێر و {Math.floor((cloudStatus.remainingSeconds % 3600) / 60)} خولەک) کۆمپیوتەرەکە بە ئینتەرنێتەوە ببەسترێتەوە بۆ پاراستنی مۆڵەتنامە، ئەگینا دەستگەیشتن ڕادەگیرێت.
              </span>
            </div>
            <button
              type="button"
              onClick={() => triggerCloudSync()}
              disabled={isSyncingCloud}
              className="bg-zinc-900 hover:bg-zinc-800 active:bg-black text-white px-3 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer shrink-0"
            >
              {isSyncingCloud ? 'خەریکی پشکنین...' : 'پشکنینەوەی ئینتەرنێت'}
            </button>
          </div>
        )}
        {currentTab === 'pos' && (
          <PosRegister
            products={products}
            categories={categories}
            customers={customers}
            heldSales={heldSales}
            onHoldSale={handleHoldSale}
            onResumeSale={handleResumeSale}
            onDeleteHeldSale={(id) => setHeldSales((prev) => prev.filter((h) => h.id !== id))}
            onCompleteSale={handleCompleteSale}
            shiftId={currentShift.id}
            cashierName={currentUser.name}
            cashierId={currentUser.id}
            currentUser={currentUser}
            lang={lang}
            currency={currency}
            exchangeRate={exchangeRate}
            invoices={invoices}
            pendingCustomPrintJobs={pendingCustomPrintJobs}
            onClearPendingCustomPrintJobs={() => setPendingCustomPrintJobs([])}
            onUpdateProduct={handleUpdateProduct}
            onProcessReturn={handleProcessReturn}
            displayScale={systemConfig.displayScale || 'medium'}
          />
        )}

        {currentTab === 'print_calc' && (
          <CustomPrintCalculator
            onAddToCart={handleAddCustomPrintToCart}
            lang={lang}
            currency={currency}
            exchangeRate={exchangeRate}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryManager
            products={products}
            categories={categories}
            brands={brands}
            itemTypes={itemTypes}
            onAddProduct={handleAddProduct}
            onBulkAddProducts={handleBulkAddProducts}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onStockAdjustment={handleStockAdjustment}
            lang={lang}
            currency={currency}
            exchangeRate={exchangeRate}
          />
        )}

        {currentTab === 'stock_expiry' && (
          <StockExpiryManager
            products={products}
            categories={categories}
            onUpdateProduct={handleUpdateProduct}
            onStockAdjustment={handleStockAdjustment}
            lang={lang}
            currency={currency}
            exchangeRate={exchangeRate}
          />
        )}

        {currentTab === 'customers' && (
          <CustomersManager
            customers={customers}
            payments={payments}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onReceivePayment={handleReceiveCustomerPayment}
            onUpdatePayment={handleUpdateCustomerPayment}
            lang={lang}
            currency={currency}
            exchangeRate={exchangeRate}
          />
        )}

        {currentTab === 'suppliers' && (
          <SuppliersManager
            suppliers={suppliers}
            products={products}
            purchaseInvoices={purchaseInvoices}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onCreatePurchaseInvoice={handleCreatePurchaseInvoice}
            onPaySupplier={handlePaySupplier}
            onAddProduct={handleAddProduct}
            lang={lang}
            currency={currency}
            exchangeRate={exchangeRate}
          />
        )}

        {currentTab === 'expenses' && (
          <ExpensesManager
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            lang={lang}
            currency={currency}
            exchangeRate={exchangeRate}
          />
        )}

        {currentTab === 'shift' && (
          <ShiftManager
            currentShift={currentShift}
            currentUser={currentUser}
            onCloseShift={handleCloseShift}
            onOpenNewShift={handleOpenNewShift}
            invoices={invoices}
            lang={lang}
            currency={currency}
            exchangeRate={exchangeRate}
          />
        )}

        {currentTab === 'discounts' && (
          <DiscountsManager
            products={products}
            categories={categories}
            onUpdateProduct={handleUpdateProduct}
            systemConfig={systemConfig}
            lang={lang}
            currency={currency}
            exchangeRate={exchangeRate}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsManager
            invoices={invoices}
            expenses={expenses}
            products={products}
            customers={customers}
            lang={lang}
            currency={currency}
            exchangeRate={exchangeRate}
          />
        )}

        {currentTab === 'barcode' && (
          <BarcodePrinter
            products={products}
            systemConfig={systemConfig}
            lang={lang}
            currency={currency}
            exchangeRate={exchangeRate}
            onAddProduct={handleAddProduct}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsManager
            systemConfig={systemConfig}
            onUpdateSystemConfig={handleUpdateSystemConfig}
            lang={lang}
            onToggleLang={() => setLang((prev) => (prev === 'ku' ? 'en' : 'ku'))}
            currency={currency}
            onToggleCurrency={handleToggleCurrency}
            exchangeRate={exchangeRate}
            onUpdateExchangeRate={setExchangeRate}
            isOffline={isOffline}
            onToggleOffline={() => setIsOffline(!isOffline)}
            onRestoreData={(restoredState) => {
              if (restoredState.products) setProducts(restoredState.products);
              if (restoredState.customers) setCustomers(restoredState.customers);
              if (restoredState.suppliers) setSuppliers(restoredState.suppliers);
              if (restoredState.invoices) setInvoices(restoredState.invoices);
              if (restoredState.expenses) setExpenses(restoredState.expenses);
              if (restoredState.systemConfig) setSystemConfig(restoredState.systemConfig);
            }}
            onClearAllData={handleClearAllData}
            onClearSectionData={handleClearSectionData}
            allDataForBackup={{
              products,
              categories,
              customers,
              suppliers,
              invoices,
              expenses,
              systemConfig,
              users,
            }}
            auditLogs={auditLogs}
            products={products}
            productsCount={products.length}
            customersCount={customers.length}
            suppliersCount={suppliers.length}
            invoicesCount={invoices.length}
            expensesCount={expenses.length}
            heldSalesCount={heldSales.length}
            licenseStatus={licenseStatus}
            cloudStatus={cloudStatus}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPanel
            users={users}
            onAddUser={(user) => setUsers((prev) => [...prev, user])}
            onUpdateUser={(updated) => {
              setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
              if (currentUser.id === updated.id) {
                setCurrentUser(updated);
              }
            }}
            onDeleteUser={(id) => {
              setUsers((prev) => {
                const nextUsers = prev.filter((u) => u.id !== id);
                if (currentUser.id === id && nextUsers.length > 0) {
                  setCurrentUser(nextUsers[0]);
                }
                return nextUsers;
              });
            }}
            currentUserId={currentUser.id}
            lang={lang}
          />
        )}
      </main>

      {/* Printable Receipt Modal */}
      {activeInvoiceForReceipt && (
        <ReceiptModal
          invoice={activeInvoiceForReceipt}
          onClose={() => setActiveInvoiceForReceipt(null)}
          lang={lang}
          currency={currency}
          exchangeRate={exchangeRate}
          systemConfig={systemConfig}
        />
      )}

      {/* PIN Login Modal */}
      {isLoginModalOpen && (
        <LoginModal
          users={users}
          systemConfig={systemConfig}
          defaultUserId={loginModalTargetUser?.id || currentUser.id}
          lang={lang}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            logAudit('USER_LOGIN', `بەکارهێنەر (${user.name}) بە سەرکەوتوویی چووە ژوورەوە بە PIN`, 'system');
            setIsLoginModalOpen(false);
          }}
          onCancel={() => setIsLoginModalOpen(false)}
        />
      )}

      {/* ── Interactive App Update Prompt Modal ── */}
      {isUpdateModalOpen && appUpdateAvailable && (
        <UpdatePromptModal
          updateInfo={appUpdateAvailable}
          currentVersion={APP_VERSION}
          onClose={() => setIsUpdateModalOpen(false)}
          onSnooze={handleSnoozeUpdate}
          lang={lang}
        />
      )}

      {/* Floating GitHub Release Update Notification (when modal is closed/snoozed) */}
      {!isUpdateModalOpen && appUpdateAvailable && (
        <div className="fixed bottom-5 left-5 right-5 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-gradient-to-r from-zinc-900 to-indigo-950 text-white rounded-none p-4 shadow-2xl border border-indigo-500/40 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
          <div 
            onClick={() => setIsUpdateModalOpen(true)}
            className="space-y-0.5 pr-2 cursor-pointer flex-1 min-w-0"
          >
            <div className="flex items-center gap-2 font-black text-xs">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
              <span>{lang === 'ku' ? `وەشانی نوێ (v${appUpdateAvailable.version}) بەردەستە!` : `New update (v${appUpdateAvailable.version}) available!`}</span>
            </div>
            <p className="text-[11px] text-indigo-200 line-clamp-1">{appUpdateAvailable.title}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openExternalUrl(appUpdateAvailable.downloadUrl)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black rounded-none shadow-xs flex items-center gap-1 cursor-pointer transition-all"
            >
              <Download className="w-3 h-3" />
              <span>{lang === 'ku' ? 'داونلۆد' : 'Download'}</span>
            </button>
            <button
              type="button"
              onClick={handleSnoozeUpdate}
              className="p-1.5 rounded-none text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={lang === 'ku' ? 'دواتر بیرم بخەرەوە' : 'Remind me later'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
