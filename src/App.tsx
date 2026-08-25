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

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(fallback) && Array.isArray(parsed)) {
        return parsed.length > 0 ? (parsed as T) : fallback;
      }
      return parsed as T;
    }
  } catch (e) {
    console.error(`Failed to load ${key} from storage:`, e);
  }
  return fallback;
};

export default function App() {
  // Application Persistent State
  const [users, setUsers] = React.useState<User[]>(() => loadFromStorage('baran_pos_users', INITIAL_USERS));
  const [currentUser, setCurrentUser] = React.useState<User>(() => users[0] || INITIAL_USERS[0]);
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

  const [systemConfig, setSystemConfig] = React.useState<SystemConfig>(() =>
    loadFromStorage('baran_pos_system_config', {
      shopNameEn: 'BARAN STATIONERY',
      shopNameKu: 'پەراوگەى باران',
      posType: 'stationery',
      requireLoginPin: false,
      currency: 'IQD',
      exchangeRate: 1500,
      taxPercent: 0,
      phone: '',
      address: '',
    })
  );

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

  // Entities with LocalStorage Persistence
  const [products, setProducts] = React.useState<Product[]>(() => loadFromStorage('baran_pos_products', INITIAL_PRODUCTS));
  const [categories, setCategories] = React.useState<Category[]>(() => loadFromStorage('baran_pos_categories', INITIAL_CATEGORIES));
  const [brands] = React.useState<Brand[]>(INITIAL_BRANDS);
  const [itemTypes] = React.useState<ItemType[]>(INITIAL_ITEM_TYPES);
  const [customers, setCustomers] = React.useState<Customer[]>(() => loadFromStorage('baran_pos_customers', INITIAL_CUSTOMERS));
  const [suppliers, setSuppliers] = React.useState<Supplier[]>(() => loadFromStorage('baran_pos_suppliers', INITIAL_SUPPLIERS));
  const [expenses, setExpenses] = React.useState<Expense[]>(() => loadFromStorage('baran_pos_expenses', INITIAL_EXPENSES));
  const [payments, setPayments] = React.useState<CustomerPayment[]>(() => loadFromStorage('baran_pos_payments', []));
  const [currentShift, setCurrentShift] = React.useState<Shift>(() => loadFromStorage('baran_pos_shift', INITIAL_SHIFT));
  const [invoices, setInvoices] = React.useState<SalesInvoice[]>(() => loadFromStorage('baran_pos_invoices', INITIAL_INVOICES));
  const [purchaseInvoices, setPurchaseInvoices] = React.useState<PurchaseInvoice[]>(() => loadFromStorage('baran_pos_purchase_invoices', []));
  const [heldSales, setHeldSales] = React.useState<HeldSale[]>(() => loadFromStorage('baran_pos_held_sales', []));
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>(() => loadFromStorage('baran_pos_audit_logs', INITIAL_AUDIT_LOGS));

  // Sync to LocalStorage
  React.useEffect(() => {
    try { localStorage.setItem('baran_pos_products', JSON.stringify(products)); } catch {}
  }, [products]);

  React.useEffect(() => {
    try { localStorage.setItem('baran_pos_categories', JSON.stringify(categories)); } catch {}
  }, [categories]);

  React.useEffect(() => {
    try { localStorage.setItem('baran_pos_customers', JSON.stringify(customers)); } catch {}
  }, [customers]);

  React.useEffect(() => {
    try { localStorage.setItem('baran_pos_suppliers', JSON.stringify(suppliers)); } catch {}
  }, [suppliers]);

  React.useEffect(() => {
    try { localStorage.setItem('baran_pos_invoices', JSON.stringify(invoices)); } catch {}
  }, [invoices]);

  React.useEffect(() => {
    try { localStorage.setItem('baran_pos_purchase_invoices', JSON.stringify(purchaseInvoices)); } catch {}
  }, [purchaseInvoices]);

  React.useEffect(() => {
    try { localStorage.setItem('baran_pos_expenses', JSON.stringify(expenses)); } catch {}
  }, [expenses]);

  React.useEffect(() => {
    try { localStorage.setItem('baran_pos_payments', JSON.stringify(payments)); } catch {}
  }, [payments]);

  React.useEffect(() => {
    try { localStorage.setItem('baran_pos_system_config', JSON.stringify(systemConfig)); } catch {}
  }, [systemConfig]);

  React.useEffect(() => {
    try { localStorage.setItem('baran_pos_shift', JSON.stringify(currentShift)); } catch {}
  }, [currentShift]);

  React.useEffect(() => {
    try { localStorage.setItem('baran_pos_held_sales', JSON.stringify(heldSales)); } catch {}
  }, [heldSales]);

  React.useEffect(() => {
    try { localStorage.setItem('baran_pos_audit_logs', JSON.stringify(auditLogs)); } catch {}
  }, [auditLogs]);

  // Active Receipt Modal
  const [activeInvoiceForReceipt, setActiveInvoiceForReceipt] = React.useState<SalesInvoice | null>(null);

  // Audit Helper
  const logAudit = (action: string, details: string, category: AuditLog['category']) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
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
    logAudit('HOLD_SALE', `Cart held with ${heldSale.items.length} items for ${heldSale.customerName}`, 'sale');
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

    logAudit(
      'SALE_COMPLETE',
      `Invoice #${invoice.invoiceNumber} completed ($${invoice.grandTotal.toFixed(2)}) via ${invoice.paymentMethod.toUpperCase()}`,
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
    logAudit(
      isFullVoid ? 'VOID_INVOICE' : 'RETURN_ITEMS',
      `Invoice #${targetInvoice?.invoiceNumber || invoiceId} ${
        isFullVoid ? 'fully voided' : `returned ${returnedItems.length} items`
      }. Refunded ${totalRefund} IQD (${isCash ? 'Cash drawer' : 'Customer debt'}). Reason: ${reason}`,
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
    logAudit('ADD_PRODUCT', `Added new product ${enrichedProduct.name} (${enrichedProduct.barcode})`, 'inventory');
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
    logAudit('BULK_IMPORT', `Imported ${newProds.length} products in bulk`, 'inventory');
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
    logAudit('UPDATE_PRODUCT', `Updated catalog product ${product.name}`, 'inventory');
  };

  const handleStockAdjustment = (adj: StockAdjustment) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === adj.productId ? { ...p, stockQuantity: adj.newStock } : p))
    );
    logAudit('STOCK_ADJUSTMENT', `${adj.type}: ${adj.productName} adjusted by ${adj.quantityChange}`, 'inventory');
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    logAudit('DELETE_PRODUCT', `Deleted catalog product ${productId}`, 'inventory');
  };

  const handleAddCategory = (newCat: Category) => {
    setCategories((prev) => [...prev, newCat]);
    logAudit('ADD_CATEGORY', `Added new product category: ${newCat.nameKu || newCat.name}`, 'inventory');
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    logAudit('DELETE_CATEGORY', `Deleted category ${categoryId}`, 'inventory');
  };

  // Customer Debt Handlers
  const handleAddCustomer = (customer: Customer) => {
    setCustomers((prev) => [customer, ...prev]);
    logAudit('ADD_CUSTOMER', `Registered customer account: ${customer.name}`, 'customer');
  };

  const handleUpdateCustomer = (customer: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === customer.id ? customer : c)));
    logAudit('UPDATE_CUSTOMER', `Updated customer account: ${customer.name}`, 'customer');
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
    logAudit('DEBT_PAYMENT', `Received debt repayment for customer ID ${payment.customerId}`, 'debt');
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
      `Edited payment receipt #${updatedPayment.id}: amount adjusted by ${diff}, date set to ${updatedPayment.date}`,
      'debt'
    );
  };

  // Supplier & Purchase Invoice Handlers
  const handleAddSupplier = (supplier: Supplier) => {
    setSuppliers((prev) => [supplier, ...prev]);
    logAudit('ADD_SUPPLIER', `Registered vendor supplier ${supplier.companyName}`, 'system');
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

    logAudit('PURCHASE_INVOICE', `Purchase invoice ${invoice.invoiceNumber} recorded ($${invoice.totalAmount})`, 'inventory');
  };

  const handlePaySupplier = (supplierId: string, amount: number) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplierId ? { ...s, currentDebt: Math.max(0, s.currentDebt - amount) } : s))
    );
    logAudit('SUPPLIER_PAYMENT', `Paid $${amount} to supplier ID ${supplierId}`, 'system');
  };

  const handleUpdateSupplier = (updated: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    logAudit('SUPPLIER_UPDATE', `Updated supplier: ${updated.companyName}`, 'inventory');
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    logAudit('SUPPLIER_DELETE', `Deleted supplier ID: ${supplierId}`, 'inventory');
  };

  // Expense Handlers
  const handleAddExpense = (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
    logAudit('EXPENSE_LOG', `Recorded overhead expense: ${expense.title} ($${expense.amount})`, 'expense');
  };

  const handleUpdateExpense = (expense: Expense) => {
    setExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)));
    logAudit('EXPENSE_LOG', `Updated expense record: ${expense.title} ($${expense.amount})`, 'expense');
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    logAudit('EXPENSE_LOG', `Deleted expense record ID: ${expenseId}`, 'expense');
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

    logAudit('SHIFT_CLOSE', `Shift closed by ${currentUser.name}. Actual Cash: $${actualCash} (Diff: $${diff})`, 'shift');
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
    logAudit('SHIFT_OPEN', `New shift opened by ${currentUser.name} with float $${openingFloat}`, 'shift');
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
    logAudit('RESTORE_DATA', 'Database restored from JSON backup', 'system');
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
    try {
      localStorage.removeItem('baran_pos_products');
      localStorage.removeItem('baran_pos_customers');
      localStorage.removeItem('baran_pos_suppliers');
      localStorage.removeItem('baran_pos_invoices');
      localStorage.removeItem('baran_pos_purchase_invoices');
      localStorage.removeItem('baran_pos_expenses');
      localStorage.removeItem('baran_pos_payments');
      localStorage.removeItem('baran_pos_held_sales');
      localStorage.removeItem('baran_pos_audit_logs');
      localStorage.removeItem('pos_cart_usr_1');
      localStorage.removeItem('pos_cart_usr_2');
      localStorage.removeItem('baran_pos_cart');
    } catch {}
    logAudit('FACTORY_RESET', 'Entire database wiped and reset to factory empty state', 'system');
  };

  // Selective Section Data Purge
  const handleClearSectionData = (section: 'products' | 'customers' | 'suppliers' | 'invoices' | 'expenses' | 'audit_logs' | 'held_sales') => {
    switch (section) {
      case 'products':
        setProducts([]);
        try {
          localStorage.removeItem('baran_pos_products');
          localStorage.removeItem('pos_cart_usr_1');
          localStorage.removeItem('pos_cart_usr_2');
          localStorage.removeItem('baran_pos_cart');
        } catch {}
        logAudit('PURGE_PRODUCTS', 'All products cleared from catalog', 'inventory');
        break;
      case 'customers':
        setCustomers([]);
        setPayments([]);
        try {
          localStorage.removeItem('baran_pos_customers');
          localStorage.removeItem('baran_pos_payments');
        } catch {}
        logAudit('PURGE_CUSTOMERS', 'All customer accounts and debt histories cleared', 'customer');
        break;
      case 'suppliers':
        setSuppliers([]);
        setPurchaseInvoices([]);
        try {
          localStorage.removeItem('baran_pos_suppliers');
          localStorage.removeItem('baran_pos_purchase_invoices');
          localStorage.removeItem('baran_pos_supplier_payments');
        } catch {}
        logAudit('PURGE_SUPPLIERS', 'All supplier records and vendor data cleared', 'inventory');
        break;
      case 'invoices':
        setInvoices([]);
        try {
          localStorage.removeItem('baran_pos_invoices');
        } catch {}
        logAudit('PURGE_INVOICES', 'All sales invoice transaction history cleared', 'sale');
        break;
      case 'expenses':
        setExpenses([]);
        try {
          localStorage.removeItem('baran_pos_expenses');
        } catch {}
        logAudit('PURGE_EXPENSES', 'All overhead expenses records cleared', 'expense');
        break;
      case 'held_sales':
        setHeldSales([]);
        try {
          localStorage.removeItem('baran_pos_held_sales');
          localStorage.removeItem('pos_cart_usr_1');
          localStorage.removeItem('pos_cart_usr_2');
          localStorage.removeItem('baran_pos_cart');
        } catch {}
        logAudit('PURGE_HELD_SALES', 'All held carts and cashier temporary carts cleared', 'sale');
        break;
      case 'audit_logs':
        setAuditLogs([]);
        try {
          localStorage.removeItem('baran_pos_audit_logs');
        } catch {}
        break;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-zinc-900 font-sans overflow-hidden select-none rounded-none" dir={lang === 'ku' ? 'rtl' : 'ltr'}>
      {/* Navigation Sidebar */}
      <Sidebar
        currentUser={currentUser}
        users={users}
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
        onLockSystem={() => {
          setLoginModalTargetUser(currentUser);
          setIsLoginModalOpen(true);
        }}
      />

      {/* Main Desktop Screen Layout (No top header, no page footer) */}
      <main className="flex-1 flex flex-col overflow-hidden bg-zinc-100">
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
            logAudit('USER_LOGIN', `User ${user.name} logged in via PIN`, 'system');
            setIsLoginModalOpen(false);
          }}
          onCancel={() => setIsLoginModalOpen(false)}
        />
      )}
    </div>
  );
}
