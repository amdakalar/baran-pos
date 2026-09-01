import React from 'react';
import { 
  ShoppingCart, 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  PauseCircle, 
  PlayCircle, 
  Coins, 
  User as UserIcon, 
  Printer, 
  Sparkles,
  Tag,
  Layers,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Flame,
  TrendingUp,
  AlertTriangle,
  Clock,
  XCircle,
  Package,
  Camera,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  CreditCard
} from 'lucide-react';
import { Product, Category, CartItem, Customer, HeldSale, SalesInvoice, UnitType, User, DisplayScale } from '../types';
import { Currency, formatCurrency, fromBaseIQD, toBaseIQD } from '../utils/currency';
import { getSampleImageForProduct, PRESET_SAMPLE_IMAGES, processAndSquareProductImage } from '../utils/productImages';
import { 
  normalizeBarcode, 
  findProductByBarcode, 
  playBarcodeSuccessBeep, 
  playBarcodeErrorTone, 
  useBarcodeScanner 
} from '../utils/barcodeScanner';
import { SalesReturnModal } from './SalesReturnModal';

interface PosRegisterProps {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  heldSales: HeldSale[];
  onHoldSale: (heldSale: HeldSale) => void;
  onResumeSale: (heldSaleId: string) => void;
  onDeleteHeldSale?: (heldSaleId: string) => void;
  onCompleteSale: (invoice: SalesInvoice) => void;
  onUpdateProduct?: (product: Product) => void;
  shiftId: string;
  cashierName: string;
  cashierId: string;
  customPrintJobProduct?: Product;
  lang?: 'en' | 'ku';
  currency?: Currency;
  exchangeRate?: number;
  currentUser?: User;
  invoices?: SalesInvoice[];
  displayScale?: DisplayScale;
  pendingCustomPrintJobs?: Array<{
    product: Product;
    quantity: number;
    details: string;
    calculatedPrice: number;
  }>;
  onClearPendingCustomPrintJobs?: () => void;
  onProcessReturn?: (
    invoiceId: string,
    returnedItems: { product: any; quantity: number; refundPrice: number }[],
    totalRefund: number,
    reason: string,
    isFullVoid: boolean
  ) => void;
}

const getCashierCartKey = (id: string) => `pos_cart_${id}`;

const formatUnitName = (unit?: string, lang: string = 'ku'): string => {
  if (!unit) return lang === 'ku' ? 'دانە' : 'Piece';
  if (lang === 'ku') {
    const u = String(unit).toLowerCase().trim();
    if (u === 'piece' || u === 'item' || u === 'unit' || u === 'pcs') return 'دانە';
    if (u === 'box') return 'کارتۆن';
    if (u === 'pack' || u === 'packet') return 'پاکەت';
    if (u === 'dozen') return 'دەرزەن';
    if (u === 'kg') return 'کیلۆ';
    if (u === 'g' || u === 'gram') return 'گرام';
    if (u === 'm' || u === 'meter') return 'مەتر';
    if (u === 'set') return 'سێت';
    if (u === 'roll') return 'تۆپ';
    return unit;
  }
  return unit;
};

const loadCartForCashier = (id: string): CartItem[] => {
  // Cart is loaded asynchronously via useEffect below
  return [];
};

export const PosRegister: React.FC<PosRegisterProps> = ({
  products,
  categories,
  customers,
  heldSales,
  onHoldSale,
  onResumeSale,
  onDeleteHeldSale,
  onCompleteSale,
  onUpdateProduct,
  shiftId,
  cashierName,
  cashierId,
  customPrintJobProduct,
  lang = 'en',
  currency = 'IQD',
  exchangeRate = 1500,
  currentUser,
  invoices = [],
  displayScale = 'medium',
  pendingCustomPrintJobs = [],
  onClearPendingCustomPrintJobs,
  onProcessReturn,
}) => {
  // Active Cashier ID
  const activeCashierId = currentUser?.id || cashierId;

  // State
  const [barcodeInput, setBarcodeInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [selectedCat, setSelectedCat] = React.useState<string>('all');
  const [cartItems, setCartItems] = React.useState<CartItem[]>(() => loadCartForCashier(activeCashierId));
  const prevCashierIdRef = React.useRef<string>(activeCashierId);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>('walk_in');
  const [pricingTier, setPricingTier] = React.useState<'retail' | 'wholesale'>('retail');
  const [viewMode, setViewMode] = React.useState<'list' | 'grid-2' | 'grid-3' | 'grid-4' | 'grid-5'>('grid-5');
  const [discountType, setDiscountType] = React.useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = React.useState<number>(0);
  const [isReturnModalOpen, setIsReturnModalOpen] = React.useState(false);

  // Load cart from encrypted DB on mount
  React.useEffect(() => {
    window.electronAPI?.db?.get<CartItem[]>(getCashierCartKey(activeCashierId), []).then((saved) => {
      if (saved && saved.length > 0) setCartItems(saved);
    }).catch(() => {});
  }, []);

  // Switch Cashier Session: Isolate each cashier's cart and reset cart state per cashier
  React.useEffect(() => {
    if (prevCashierIdRef.current !== activeCashierId) {
      // 1. Save previous cashier's cart if any
      if (cartItems.length > 0) {
        window.electronAPI?.db?.set(getCashierCartKey(prevCashierIdRef.current), cartItems).catch(() => {});
      } else {
        window.electronAPI?.db?.delete(getCashierCartKey(prevCashierIdRef.current)).catch(() => {});
      }

      // 2. Load current cashier's isolated cart
      window.electronAPI?.db?.get<CartItem[]>(getCashierCartKey(activeCashierId), []).then((saved) => {
        setCartItems(saved && saved.length > 0 ? saved : []);
      }).catch(() => setCartItems([]));

      // 3. Reset customer selection & discount for clean cashier session
      setSelectedCustomerId('walk_in');
      setDiscountValue(0);
      setIsPayModalOpen(false);
      setIsHeldModalOpen(false);
      setIsCustomerSearchOpen(false);

      // 4. Update ref
      prevCashierIdRef.current = activeCashierId;
    }
  }, [activeCashierId]);

  // Persist active cashier cart whenever it changes
  React.useEffect(() => {
    if (cartItems.length > 0) {
      window.electronAPI?.db?.set(getCashierCartKey(activeCashierId), cartItems).catch(() => {});
    } else {
      window.electronAPI?.db?.delete(getCashierCartKey(activeCashierId)).catch(() => {});
    }
  }, [cartItems, activeCashierId]);

  // Sorting & Pagination State (Default 16 cards per page for all users)
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = React.useState<number>(16);
  const [sortBy, setSortBy] = React.useState<'top_selling' | 'name' | 'price_asc' | 'price_desc' | 'stock'>('top_selling');

  // Reset page when search, category filter, or sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCat, sortBy]);

  // Modals
  const [isPayModalOpen, setIsPayModalOpen] = React.useState(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<'cash' | 'credit'>('cash');
  const [cashTendered, setCashTendered] = React.useState<number>(0);
  const [holdNote, setHoldNote] = React.useState('');
  const [creditLimitOverrideConfirmed, setCreditLimitOverrideConfirmed] = React.useState(false);

  // Searchable Customer Selector Dropdown State
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = React.useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = React.useState('');

  // Product Image Editor Modal State
  const [editingImageProduct, setEditingImageProduct] = React.useState<Product | null>(null);
  const [newImageUrl, setNewImageUrl] = React.useState<string>('');

  // Stock Exceeded Alert Modal State
  const [stockAlert, setStockAlert] = React.useState<{
    isOpen: boolean;
    productName: string;
    requestedQty: number;
    availableStock: number;
  } | null>(null);

  const barcodeInputRef = React.useRef<HTMLInputElement>(null);
  const processedPrintJobIdsRef = React.useRef<Set<string>>(new Set());

  // Auto-add pending custom print jobs to cart when navigating from Print Calculator (processed exactly ONCE)
  React.useEffect(() => {
    if (pendingCustomPrintJobs && pendingCustomPrintJobs.length > 0) {
      const newJobs = pendingCustomPrintJobs.filter(
        (job) => !processedPrintJobIdsRef.current.has(job.product.id)
      );

      if (newJobs.length > 0) {
        newJobs.forEach((job) => {
          processedPrintJobIdsRef.current.add(job.product.id);
          handleAddToCart(
            job.product,
            job.quantity,
            undefined,
            job.calculatedPrice
          );
        });
        onClearPendingCustomPrintJobs?.();
      }
    }
  }, [pendingCustomPrintJobs]);

  // Auto-focus barcode input and listen for F3 key shortcut
  React.useEffect(() => {
    barcodeInputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Deferred search query for zero-lag 60fps typing performance
  const deferredCustomerQuery = React.useDeferredValue(customerSearchQuery);

  // Filter customers for POS dropdown search:
  // Before search, show top 3 highest purchasing customers only!
  // When search query is entered, search all matching customers!
  const filteredCustomerList = React.useMemo(() => {
    if (!deferredCustomerQuery.trim()) {
      return [...customers]
        .sort((a, b) => b.totalPurchases - a.totalPurchases)
        .slice(0, 3);
    }
    const q = deferredCustomerQuery.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.notes && c.notes.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [customers, deferredCustomerQuery]);

  // Map product id -> total quantity sold in invoices
  const productSalesMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    if (invoices) {
      invoices.forEach((inv) => {
        inv.items.forEach((item) => {
          map[item.product.id] = (map[item.product.id] || 0) + item.quantity;
        });
      });
    }
    return map;
  }, [invoices]);

  // Filter Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.nameKu && p.nameKu.includes(search)) ||
      p.barcode.includes(search) ||
      p.sku.toLowerCase().includes(search.toLowerCase());

    const matchesCat = selectedCat === 'all' || p.categoryId === selectedCat;

    return matchesSearch && matchesCat && p.isActive;
  });

  // Sort Filtered Products
  const sortedProducts = React.useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const soldA = productSalesMap[a.id] || 0;
      const soldB = productSalesMap[b.id] || 0;

      if (sortBy === 'top_selling') {
        if (soldB !== soldA) return soldB - soldA;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name') {
        const nameA = lang === 'ku' ? (a.nameKu || a.name) : a.name;
        const nameB = lang === 'ku' ? (b.nameKu || b.name) : b.name;
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'price_asc') return a.retailPrice - b.retailPrice;
      if (sortBy === 'price_desc') return b.retailPrice - a.retailPrice;
      if (sortBy === 'stock') return b.stockQuantity - a.stockQuantity;
      return 0;
    });
  }, [filteredProducts, sortBy, productSalesMap, lang]);

  // Pagination Calculations
  const totalItems = sortedProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const validPage = Math.min(currentPage, totalPages);

  const paginatedProducts = React.useMemo(() => {
    if (itemsPerPage >= 9999) return sortedProducts;
    const start = (validPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, validPage, itemsPerPage]);

  // Check if a product has an active discount that has not expired
  const isProductDiscountActive = (product: Product): boolean => {
    if (!product.promotionDiscount || product.promotionDiscount <= 0) return false;
    if (product.promotionEnd) {
      const today = new Date().toISOString().split('T')[0];
      if (product.promotionEnd < today) return false; // expired
    }
    return true;
  };

  // Calculate effective price taking pricing tier and active discount into account
  const getProductPriceInfo = (product: Product, tier: 'retail' | 'wholesale' = pricingTier) => {
    const originalPrice = tier === 'wholesale' ? product.wholesalePrice : product.retailPrice;
    const isDiscounted = tier === 'retail' && isProductDiscountActive(product);
    const discountPercent = isDiscounted ? (product.promotionDiscount || 0) : 0;
    const effectivePrice = isDiscounted
      ? Math.max(0, originalPrice - (originalPrice * discountPercent) / 100)
      : originalPrice;

    return {
      originalPrice,
      effectivePrice,
      isDiscounted,
      discountPercent,
      endDate: product.promotionEnd,
    };
  };

  // Add Item to Cart with Stock Check & Active Promotion Discount
  const handleAddToCart = (product: Product, quantity = 1, unitSelected?: UnitType, customPrice?: number) => {
    const unit = unitSelected || product.unit;

    // Check available stock
    const existingInCart = cartItems.find(
      (item) => item.product.id === product.id && item.unitSelected === unit
    )?.quantity || 0;
    const requestedTotal = existingInCart + quantity;

    if (requestedTotal > product.stockQuantity) {
      setStockAlert({
        isOpen: true,
        productName: lang === 'ku' ? (product.nameKu || product.name) : product.name,
        requestedQty: requestedTotal,
        availableStock: product.stockQuantity,
      });
      return;
    }

    const priceInfo = getProductPriceInfo(product, pricingTier);
    let baseUnitPrice = priceInfo.effectivePrice;

    // Apply customer special discount if set
    if (selectedCustomer?.specialDiscountPercent) {
      baseUnitPrice = baseUnitPrice * (1 - selectedCustomer.specialDiscountPercent / 100);
    }

    if (customPrice !== undefined) {
      baseUnitPrice = customPrice;
    }

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.unitSelected === unit
      );

      if (existingIdx >= 0) {
        const existingItem = prev[existingIdx];
        const updatedItem = {
          ...existingItem,
          quantity: existingItem.quantity + quantity,
        };
        const remaining = prev.filter((_, idx) => idx !== existingIdx);
        return [updatedItem, ...remaining];
      }

      return [
        {
          product,
          quantity,
          unitSelected: unit,
          pricePerUnit: baseUnitPrice,
          discount: 0,
        },
        ...prev,
      ];
    });
  };

  // Live Barcode Feedback State
  const [barcodeFeedback, setBarcodeFeedback] = React.useState<{
    type: 'success' | 'error';
    message: string;
    productName?: string;
  } | null>(null);

  const lastProcessedScanRef = React.useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Unified Barcode Processing (supports manual enter & hardware presentation scanner)
  const processBarcodeScan = React.useCallback(
    (rawScan: string) => {
      if (!rawScan) return;
      const clean = normalizeBarcode(rawScan);
      if (!clean) return;

      const now = Date.now();
      if (lastProcessedScanRef.current.code === clean && now - lastProcessedScanRef.current.time < 350) {
        return; // debounce duplicate triggers within 350ms
      }
      lastProcessedScanRef.current = { code: clean, time: now };

      const matchedProduct = findProductByBarcode(products, clean);

      if (matchedProduct) {
        handleAddToCart(matchedProduct);
        playBarcodeSuccessBeep();
        setBarcodeInput('');
        setBarcodeFeedback(null);
      } else {
        playBarcodeErrorTone();
        setBarcodeFeedback({
          type: 'error',
          message: lang === 'ku'
            ? `هیچ کاڵایەک نەدۆزرایەوە بە بارکۆدی: ${clean}`
            : `No product found for barcode: ${clean}`,
        });
        setBarcodeInput('');
        setTimeout(() => setBarcodeFeedback(null), 3500);
      }
    },
    [products, handleAddToCart, lang]
  );

  // Global Hardware Barcode Scanner Listener for Omnidirectional / Desktop Scanner
  useBarcodeScanner({
    onScan: (scannedCode) => {
      processBarcodeScan(scannedCode);
    },
    enabled: !isPayModalOpen && !isHeldModalOpen && !isReturnModalOpen && !editingImageProduct,
  });

  // Handle Barcode Scanner Form Submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = (barcodeInputRef.current?.value || barcodeInput || '').trim();
    if (!rawVal) return;
    processBarcodeScan(rawVal);
  };

  // Update Cart Line Quantity with Stock Check
  const handleUpdateQty = (index: number, delta: number) => {
    const item = cartItems[index];
    const newQty = item.quantity + delta;

    if (delta > 0 && newQty > item.product.stockQuantity) {
      setStockAlert({
        isOpen: true,
        productName: lang === 'ku' ? (item.product.nameKu || item.product.name) : item.product.name,
        requestedQty: newQty,
        availableStock: item.product.stockQuantity,
      });
      return;
    }

    setCartItems((prev) => {
      const updated = [...prev];
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  // Update Unit Type for Line
  const handleToggleLineUnit = (index: number, newUnit: UnitType) => {
    setCartItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      item.unitSelected = newUnit;

      // Adjust price according to unit conversion factor and active discounts
      const pInfo = getProductPriceInfo(item.product, pricingTier);
      if (item.product.unitConversion) {
        if (newUnit === item.product.unitConversion.bulkUnit) {
          item.pricePerUnit = pInfo.effectivePrice * item.product.unitConversion.conversionFactor;
        } else {
          item.pricePerUnit = pInfo.effectivePrice;
        }
      } else {
        item.pricePerUnit = pInfo.effectivePrice;
      }
      return updated;
    });
  };

  // Calculate Subtotal & Totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.pricePerUnit * (1 - item.discount / 100),
    0
  );

  const globalDiscountAmount = React.useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * (discountValue || 0)) / 100;
    } else {
      const amtInIQD = toBaseIQD(discountValue || 0, currency, exchangeRate);
      return Math.min(subtotal, Math.max(0, amtInIQD));
    }
  }, [subtotal, discountType, discountValue, currency, exchangeRate]);

  const grandTotal = Math.max(0, subtotal - globalDiscountAmount);

  // Hold Sale
  const handleHoldActiveCart = () => {
    if (cartItems.length === 0) return;

    const custName = selectedCustomer && selectedCustomerId !== 'walk_in'
      ? selectedCustomer.name
      : (lang === 'ku' ? 'کڕیاری گشتی' : 'Walk-in Retail');

    const newHeld: HeldSale = {
      id: `held_${Date.now()}`,
      customerName: custName,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: [...cartItems],
      note: holdNote || (lang === 'ku' ? 'داواکاری هەڵگیراو' : 'Saved order'),
      discountType,
      discountValue,
    };

    onHoldSale(newHeld);
    setCartItems([]);
    setDiscountValue(0);
    setHoldNote('');
  };

  // Resume Sale
  const handleResumeHeld = (held: HeldSale) => {
    setCartItems(held.items);
    if (held.discountType) setDiscountType(held.discountType);
    if (held.discountValue !== undefined) setDiscountValue(held.discountValue);
    onResumeSale(held.id);
    setIsHeldModalOpen(false);
  };

  // Process Final Checkout
  const handleFinalizePayment = () => {
    if (cartItems.length === 0) return;

    // Check if debt payment is selected for unregistered / walk-in customer
    if (paymentMethod === 'credit' && (!selectedCustomer || selectedCustomerId === 'walk_in')) {
      alert(
        lang === 'ku'
          ? 'تکایە سەرەتا کڕیارێکی تۆمارکراو لە سیستەمدا هەڵبژێرە! فرۆشتن بە قەرز بۆ کڕیاری گشتی (تۆمارنەکراو) ڕێگەپێنەدراوە.'
          : 'Please select a registered customer first! Debt sales are strictly forbidden for walk-in retail.'
      );
      return;
    }

    // Check if customer credit limit is exceeded
    if (paymentMethod === 'credit' && selectedCustomer && selectedCustomer.creditLimit > 0) {
      const projectedDebt = selectedCustomer.currentDebt + grandTotal;
      if (projectedDebt > selectedCustomer.creditLimit && !creditLimitOverrideConfirmed) {
        const exceededAmount = projectedDebt - selectedCustomer.creditLimit;
        const confirmMsg =
          lang === 'ku'
            ? `⚠️ ئاگاداری سنووری قەرز!\n\nقەرزی ئەم کڕیارە (${selectedCustomer.name}) لە بەرزترین سنووری دیاریکراو تێپەڕ دەبێت:\n\n• بەرزترین سنووری قەرز: ${formatCurrency(selectedCustomer.creditLimit, currency, lang, exchangeRate)}\n• قەرزی پێشوو: ${formatCurrency(selectedCustomer.currentDebt, currency, lang, exchangeRate)}\n• بڕی ئەم کڕینە: ${formatCurrency(grandTotal, currency, lang, exchangeRate)}\n• کۆی گشتی قەرز دەبێتە: ${formatCurrency(projectedDebt, currency, lang, exchangeRate)}\n• بڕی تێپەڕیو لە سنوور: ${formatCurrency(exceededAmount, currency, lang, exchangeRate)}\n\nئایا دڵنیایت کە دەتەوێت سەرەڕای تێپەڕاندنی سنوور، قەرزەکە تۆمار بکەیت؟`
            : `⚠️ Credit Limit Exceeded Warning!\n\nThis sale exceeds the maximum allowed credit limit for customer (${selectedCustomer.name}):\n\n• Credit Limit: ${formatCurrency(selectedCustomer.creditLimit, currency, lang, exchangeRate)}\n• Current Debt: ${formatCurrency(selectedCustomer.currentDebt, currency, lang, exchangeRate)}\n• Sale Amount: ${formatCurrency(grandTotal, currency, lang, exchangeRate)}\n• Total Projected Debt: ${formatCurrency(projectedDebt, currency, lang, exchangeRate)}\n• Exceeded By: ${formatCurrency(exceededAmount, currency, lang, exchangeRate)}\n\nDo you want to authorize this credit sale anyway?`;

        const userConfirmed = window.confirm(confirmMsg);
        if (!userConfirmed) {
          return;
        }
      }
    }

    // Check if any cart item exceeds available stock
    const invalidItem = cartItems.find((item) => item.quantity > item.product.stockQuantity);
    if (invalidItem) {
      setStockAlert({
        isOpen: true,
        productName: lang === 'ku' ? (invalidItem.product.nameKu || invalidItem.product.name) : invalidItem.product.name,
        requestedQty: invalidItem.quantity,
        availableStock: invalidItem.product.stockQuantity,
      });
      return;
    }

    const amountPaid = paymentMethod === 'cash' ? Math.max(cashTendered, grandTotal) : 0;
    const changeDue = paymentMethod === 'cash' ? Math.max(0, cashTendered - grandTotal) : 0;
    const debtAdded = paymentMethod === 'credit' ? grandTotal : 0;

    const invoice: SalesInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cashierId,
      cashierName,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
      items: cartItems,
      subtotal,
      discountTotal: globalDiscountAmount,
      grandTotal,
      paymentMethod,
      amountPaid,
      changeDue,
      debtAdded,
      shiftId,
      status: 'completed',
    };

    onCompleteSale(invoice);
    setIsPayModalOpen(false);
    setCartItems([]);
    try {
      window.electronAPI?.db?.delete(getCashierCartKey(activeCashierId)).catch(() => {});
    } catch {}
    setCashTendered(0);
    setDiscountValue(0);
  };

  // Instant 1-Click Cash Sale (for Walk-in or Selected Customer)
  const handleQuickCashCheckout = () => {
    if (cartItems.length === 0) return;

    // Check if any cart item exceeds available stock
    const invalidItem = cartItems.find((item) => item.quantity > item.product.stockQuantity);
    if (invalidItem) {
      setStockAlert({
        isOpen: true,
        productName: lang === 'ku' ? (invalidItem.product.nameKu || invalidItem.product.name) : invalidItem.product.name,
        requestedQty: invalidItem.quantity,
        availableStock: invalidItem.product.stockQuantity,
      });
      return;
    }

    const invoice: SalesInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cashierId,
      cashierName,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
      items: cartItems,
      subtotal,
      discountTotal: globalDiscountAmount,
      grandTotal,
      paymentMethod: 'cash',
      amountPaid: grandTotal,
      changeDue: 0,
      debtAdded: 0,
      shiftId,
      status: 'completed',
    };

    onCompleteSale(invoice);
    setIsPayModalOpen(false);
    setCartItems([]);
    try {
      window.electronAPI?.db?.delete(getCashierCartKey(activeCashierId)).catch(() => {});
    } catch {}
    setCashTendered(0);
    setDiscountValue(0);
  };

  return (
    <div className="flex-1 bg-zinc-100 flex flex-col md:flex-row overflow-hidden text-zinc-900 select-none font-sans">
      {/* Left Catalog & Product Selection Panel */}
      <div className="flex-1 flex flex-col border-r rtl:border-l rtl:border-r-0 border-zinc-300 overflow-hidden">
        {/* Barcode, Search & View Controls Header */}
        <div className="bg-[#f4f5f7] p-3 border-b border-zinc-300 space-y-2">
          {/* Top Row: [Barcode Scanner (Wide)] | [Search Input (Compact)] | [Sort Dropdown] | [View Mode Switcher] */}
          <div className="flex items-center gap-2">
            {/* Barcode Scanner Input - Primary Wide Input */}
            <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
              <Barcode className="w-4 h-4 text-zinc-500 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 pointer-events-none" />
              <input
                ref={barcodeInputRef}
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder={
                  lang === 'ku'
                    ? 'بارکۆد سکان بکە یان داخڵی بکە... (F3)'
                    : 'Scan or enter barcode... (F3)'
                }
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-zinc-900 pl-9 rtl:pl-3 pr-3 rtl:pr-9 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 font-mono rounded shadow-2xs outline-none transition-all h-8.5"
              />
              {barcodeInput && (
                <button
                  type="button"
                  onClick={() => setBarcodeInput('')}
                  className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* General Search Input - Compact Width */}
            <div className="w-48 sm:w-56 md:w-60 relative shrink-0">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder={lang === 'ku' ? 'گەڕان بە ناو...' : 'Search by name...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 pl-9 rtl:pl-3 pr-3 rtl:pr-9 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 font-sans rounded shadow-2xs outline-none transition-all h-8.5"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown - Minimal & Compact */}
            <div className="flex items-center gap-1.5 bg-white border border-zinc-300 hover:border-zinc-400 px-2.5 h-8.5 rounded shadow-2xs shrink-0 transition-colors">
              <ArrowUpDown className="w-3 h-3 text-zinc-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-medium font-sans text-zinc-700 focus:outline-none cursor-pointer pr-1 rtl:pr-0 rtl:pl-1"
              >
                <option value="top_selling">{lang === 'ku' ? '🔥 زیاترین فرۆشراو' : '🔥 Most Sold'}</option>
                <option value="name">{lang === 'ku' ? 'ناو (ئەلفوبێ)' : 'Name (A-Z)'}</option>
                <option value="price_asc">{lang === 'ku' ? 'نرخ (لە کەمەوە)' : 'Price (Low to High)'}</option>
                <option value="price_desc">{lang === 'ku' ? 'نرخ (لە بەرزەوە)' : 'Price (High to Low)'}</option>
                <option value="stock">{lang === 'ku' ? 'زۆرترین کۆگا' : 'Highest Stock'}</option>
              </select>
            </div>

            {/* View Mode Switcher (5 Buttons) - Minimal */}
            <div className="flex items-center bg-white border border-zinc-300 p-0.5 rounded shadow-2xs gap-0.5 h-8.5 shrink-0">
              {/* 1: List View */}
              <button
                type="button"
                title={lang === 'ku' ? 'پیشاندانی لیستی' : 'List View'}
                onClick={() => setViewMode('list')}
                className={`p-1 rounded-xs transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>

              {/* 2: 2 Columns */}
              <button
                type="button"
                title={lang === 'ku' ? '2 ستوون' : '2 Columns'}
                onClick={() => setViewMode('grid-2')}
                className={`p-1 rounded-xs transition-colors cursor-pointer ${
                  viewMode === 'grid-2'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="8" height="8" rx="1.5" />
                  <rect x="13" y="3" width="8" height="8" rx="1.5" />
                  <rect x="3" y="13" width="8" height="8" rx="1.5" />
                  <rect x="13" y="13" width="8" height="8" rx="1.5" />
                </svg>
              </button>

              {/* 3: 3 Columns (9 dots / standard grid) */}
              <button
                type="button"
                title={lang === 'ku' ? '3 ستوون' : '3 Columns'}
                onClick={() => setViewMode('grid-3')}
                className={`p-1 rounded-xs transition-colors cursor-pointer ${
                  viewMode === 'grid-3'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="4.5" height="4.5" rx="1" />
                  <rect x="9.75" y="3" width="4.5" height="4.5" rx="1" />
                  <rect x="16.5" y="3" width="4.5" height="4.5" rx="1" />
                  <rect x="3" y="9.75" width="4.5" height="4.5" rx="1" />
                  <rect x="9.75" y="9.75" width="4.5" height="4.5" rx="1" />
                  <rect x="16.5" y="9.75" width="4.5" height="4.5" rx="1" />
                  <rect x="3" y="16.5" width="4.5" height="4.5" rx="1" />
                  <rect x="9.75" y="16.5" width="4.5" height="4.5" rx="1" />
                  <rect x="16.5" y="16.5" width="4.5" height="4.5" rx="1" />
                </svg>
              </button>

              {/* 4: 4 Columns */}
              <button
                type="button"
                title={lang === 'ku' ? '4 ستوون' : '4 Columns'}
                onClick={() => setViewMode('grid-4')}
                className={`p-1 rounded-xs transition-colors cursor-pointer ${
                  viewMode === 'grid-4'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
                  <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
                  <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
                  <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
                </svg>
              </button>

              {/* 5: 5 Columns / Dense */}
              <button
                type="button"
                title={lang === 'ku' ? '5 ستوون (چڕ)' : '5 Columns (Dense)'}
                onClick={() => setViewMode('grid-5')}
                className={`p-1 rounded-xs transition-colors cursor-pointer ${
                  viewMode === 'grid-5'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="12" y1="3" x2="12" y2="21" />
                </svg>
              </button>
            </div>
          </div>

          {/* Bottom Row: Category Tabs - Clean full width display */}
          <div className="flex flex-wrap items-center gap-1.5 w-full pt-1.5 border-t border-zinc-200/80 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCat('all')}
              className={`h-7 px-3 text-[11px] font-bold tracking-wide rounded border transition-all shrink-0 cursor-pointer shadow-2xs ${
                selectedCat === 'all'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:text-blue-600 hover:bg-zinc-50'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                className={`h-7 px-3 text-[11px] font-bold tracking-wide rounded border transition-all shrink-0 cursor-pointer shadow-2xs ${
                  selectedCat === cat.id
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:text-blue-600 hover:bg-zinc-50'
                }`}
              >
                {lang === 'ku' ? (cat.nameKu || cat.name) : (cat.nameKu ? `${cat.name} (${cat.nameKu})` : cat.name)}
              </button>
            ))}
          </div>
        </div>

        {/* Live Barcode Scan Feedback Notification */}
        {barcodeFeedback && (
          <div className="px-3 pt-2">
            <div
              className={`flex items-center justify-between px-3.5 py-2 rounded-lg border text-xs font-medium transition-all shadow-xs animate-in fade-in slide-in-from-top-1 ${
                barcodeFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {barcodeFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>
                  {barcodeFeedback.message}
                  {barcodeFeedback.productName && (
                    <strong className="mx-1 font-bold">({barcodeFeedback.productName})</strong>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setBarcodeFeedback(null)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Product Catalog Grid / List */}
        <div
          className={
            viewMode === 'list'
              ? 'flex-1 p-3 overflow-y-auto bg-zinc-100/90 flex flex-col gap-1.5 content-start'
              : viewMode === 'grid-2'
              ? 'flex-1 p-3 overflow-y-auto bg-zinc-100/90 grid grid-cols-2 gap-3 content-start'
              : viewMode === 'grid-3'
              ? 'flex-1 p-3 overflow-y-auto bg-zinc-100/90 grid grid-cols-2 sm:grid-cols-3 gap-2.5 content-start'
              : viewMode === 'grid-4'
              ? 'flex-1 p-3 overflow-y-auto bg-zinc-100/90 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 content-start'
              : displayScale === 'small'
              ? 'flex-1 p-2.5 overflow-y-auto bg-zinc-100/90 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 content-start'
              : displayScale === 'large'
              ? 'flex-1 p-4 overflow-y-auto bg-zinc-100/90 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3.5 content-start'
              : 'flex-1 p-3 overflow-y-auto bg-zinc-100/90 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 content-start'
          }
        >
          {paginatedProducts.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center text-zinc-400 space-y-2">
              <Search className="w-10 h-10 stroke-1 text-zinc-300" />
              <p className="text-xs font-bold uppercase tracking-wider">
                {lang === 'ku' ? 'هیچ کاڵایەک نەدۆزرایەوە' : 'No products found'}
              </p>
            </div>
          ) : (
            paginatedProducts.map((p) => {
              const priceInfo = getProductPriceInfo(p, pricingTier);
              const soldQty = productSalesMap[p.id] || 0;

              // Compute in-cart quantity & live remaining stock
              const inCartQty = cartItems.find((c) => c.product.id === p.id)?.quantity || 0;
              const remainingStock = Math.max(0, p.stockQuantity - inCartQty);
              const isLowStock = remainingStock <= p.minStockAlert && remainingStock > 0;
              const isOutOfStock = remainingStock === 0;

              if (viewMode === 'list') {
                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && handleAddToCart(p)}
                    className={`flex items-center justify-between p-2.5 bg-white border transition-all rounded-md select-none group ${
                      isOutOfStock
                        ? 'bg-zinc-50 border-zinc-200 opacity-50 cursor-not-allowed'
                        : inCartQty > 0
                        ? 'border-blue-600 ring-1 ring-blue-600 cursor-pointer shadow-xs'
                        : 'border-zinc-200/90 hover:border-blue-500 cursor-pointer shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Thumbnail Image */}
                      <div className="relative w-12 h-12 bg-white rounded-md overflow-hidden shrink-0 border border-zinc-200 flex items-center justify-center p-1">
                        <img
                          src={p.image || getSampleImageForProduct(p.nameKu || p.name, p.categoryId)}
                          alt={p.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          onError={(e) => {
                            const fallback = getSampleImageForProduct(p.nameKu || p.name, p.categoryId);
                            if (e.currentTarget.src !== fallback) {
                              e.currentTarget.src = fallback;
                            }
                          }}
                        />
                        {onUpdateProduct && (
                          <button
                            type="button"
                            title={lang === 'ku' ? 'گۆڕینی وێنەی کاڵا' : 'Change Image'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingImageProduct(p);
                              setNewImageUrl(p.image || '');
                            }}
                            className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Stock Badge with White Border */}
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md leading-none shrink-0 flex items-center gap-1 border border-white shadow-xs ${
                          isOutOfStock
                            ? 'bg-zinc-600 text-white'
                            : isLowStock
                            ? 'bg-rose-600 text-white'
                            : inCartQty > 0
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#00875a] text-white'
                        }`}
                      >
                        {remainingStock}
                        <Package className="w-2.5 h-2.5 stroke-[2.5]" />
                      </span>

                      {/* Product Name, Barcode & Discount Badge */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className={`font-bold text-xs leading-snug truncate ${isOutOfStock ? 'text-zinc-400' : 'text-zinc-900'}`}>
                            {lang === 'ku' ? (p.nameKu || p.name) : p.name}
                          </h3>
                          {priceInfo.isDiscounted && (
                            <span className="bg-rose-50 border border-rose-200 text-[#e1144a] text-[9px] font-black font-mono px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <Tag className="w-2.5 h-2.5 stroke-[2.5]" />
                              -{Math.round(priceInfo.discountPercent)}% {lang === 'ku' ? 'داشکاندن' : 'OFF'}
                            </span>
                          )}
                        </div>
                        <div className="inline-block bg-[#f1f5f9] border border-zinc-200/90 px-2 py-0.5 rounded-md mt-0.5">
                          <p className="text-[9px] text-zinc-600 font-mono font-bold" dir="ltr">
                            {p.barcode || p.sku}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Price & Add Button */}
                    <div className="flex items-center gap-3 shrink-0">
                      {soldQty > 0 && !isOutOfStock && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 shrink-0">
                          <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {soldQty}
                        </span>
                      )}
                      <div className="flex flex-col items-end">
                        {priceInfo.isDiscounted && (
                          <span className="line-through text-zinc-400 font-mono font-bold text-[10px] leading-none mb-0.5">
                            {formatCurrency(priceInfo.originalPrice, currency, lang, exchangeRate)}
                          </span>
                        )}
                        <span
                          className={`text-sm font-black font-mono leading-none ${
                            isOutOfStock
                              ? 'text-zinc-400'
                              : priceInfo.isDiscounted
                              ? 'text-[#e1144a]'
                              : 'text-blue-600'
                          }`}
                          dir="ltr"
                        >
                          {formatCurrency(priceInfo.effectivePrice, currency, lang, exchangeRate)}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) handleAddToCart(p);
                        }}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                          isOutOfStock
                            ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                            : inCartQty > 0
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#edf5ff] hover:bg-blue-600 hover:text-white text-blue-600 border border-blue-200'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                );
              }

              // Dynamic scale classes
              const cardPadding = displayScale === 'small' ? 'p-2' : displayScale === 'large' ? 'p-3.5 sm:p-4' : 'p-2.5 sm:p-3';
              const imgAspect = displayScale === 'small' ? 'aspect-[4/3] rounded-md' : displayScale === 'large' ? 'aspect-[4/3] rounded-xl' : 'aspect-square sm:aspect-[4/3] rounded-lg';
              const nameText = displayScale === 'small' ? 'text-[11px]' : displayScale === 'large' ? 'text-sm sm:text-base' : 'text-xs sm:text-[13px]';
              const barcodePadding = displayScale === 'small' ? 'py-0.5 px-1.5 mt-1 text-[9px]' : displayScale === 'large' ? 'py-1 px-2.5 mt-2 text-xs' : 'py-0.5 px-2 mt-1.5 text-[10px] sm:text-[11px]';
              const plusBtnSize = displayScale === 'small' ? 'w-7 h-7' : displayScale === 'large' ? 'w-9 h-9 sm:w-10 sm:h-10' : 'w-8 h-8 sm:w-9 sm:h-9';
              const priceText = displayScale === 'small' ? 'text-xs sm:text-sm' : displayScale === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base';

              return (
                <div
                  key={p.id}
                  onClick={() => !isOutOfStock && handleAddToCart(p)}
                  className={`group flex flex-col justify-between bg-white border ${cardPadding} transition-all rounded-xl select-none ${
                    isOutOfStock
                      ? 'border-zinc-200 opacity-55 cursor-not-allowed bg-zinc-50'
                      : inCartQty > 0
                      ? 'border-blue-600 ring-2 ring-blue-600/30 shadow-xs cursor-pointer'
                      : 'border-zinc-200/90 hover:border-blue-500 hover:shadow-md shadow-2xs cursor-pointer active:scale-[0.99]'
                  }`}
                >
                  {/* Top Section: Image Container with Soft Stock Badge & Discount Badge */}
                  <div className={`relative w-full ${imgAspect} bg-white flex items-center justify-center overflow-hidden shrink-0 border border-zinc-200/80 p-2`}>
                    <img
                      src={p.image || getSampleImageForProduct(p.nameKu || p.name, p.categoryId)}
                      alt={p.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        const fallback = getSampleImageForProduct(p.nameKu || p.name, p.categoryId);
                        if (e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback;
                        }
                      }}
                    />

                    {/* Stock Badge – Emerald Green with White border */}
                    <div
                      className={`absolute top-1.5 left-1.5 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono flex items-center gap-1 shadow-xs border-2 border-white leading-none ${
                        isOutOfStock
                          ? 'bg-zinc-600 text-white'
                          : isLowStock
                          ? 'bg-rose-600 text-white'
                          : 'bg-[#00875a] text-white'
                      }`}
                    >
                      <span>{remainingStock}</span>
                      <Package className="w-3 h-3 stroke-[2.5]" />
                    </div>

                    {/* Discount Badge on Top Right */}
                    {priceInfo.isDiscounted && (
                      <div className="absolute top-1.5 right-1.5 z-10 bg-[#e1144a] text-white px-1.5 py-0.5 rounded-md text-[9px] font-black font-mono flex items-center gap-1 shadow-xs border border-white leading-none">
                        <Tag className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>-{Math.round(priceInfo.discountPercent)}%</span>
                      </div>
                    )}

                    {/* Quick Image Change Button on Hover */}
                    {onUpdateProduct && !priceInfo.isDiscounted && (
                      <button
                        type="button"
                        title={lang === 'ku' ? 'گۆڕینی وێنەی کاڵا' : 'Change Image'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingImageProduct(p);
                          setNewImageUrl(p.image || '');
                        }}
                        className="absolute top-1.5 right-1.5 z-10 bg-black/60 hover:bg-black text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                      >
                        <Camera className="w-3 h-3" />
                      </button>
                    )}

                    {/* In-cart indicator stripe */}
                    {inCartQty > 0 && !isOutOfStock && (
                      <div className="absolute bottom-0 inset-x-0 bg-blue-600 text-white text-[10px] font-bold font-mono py-0.5 text-center leading-none">
                        {lang === 'ku' ? `${inCartQty} لە سەبەتەدا` : `${inCartQty} in cart`}
                      </div>
                    )}
                  </div>

                  {/* Product Details Section */}
                  <div className="flex-1 flex flex-col justify-between pt-2">
                    <div>
                      {/* Product Name – Under Image */}
                      <h3
                        className={`font-bold leading-snug text-center w-full truncate px-0.5 ${nameText} ${
                          isOutOfStock ? 'text-zinc-400' : 'text-zinc-900'
                        }`}
                        title={lang === 'ku' ? (p.nameKu || p.name) : p.name}
                      >
                        {lang === 'ku' ? (p.nameKu || p.name) : p.name}
                      </h3>

                      {/* Barcode / SKU Pill Box – Under Name */}
                      {(p.barcode || p.sku) && (
                        <div className={`w-full bg-[#f1f5f9] border border-zinc-200/90 ${barcodePadding} rounded-md text-center shadow-2xs`}>
                          <span
                            className="font-mono font-bold text-zinc-700 tracking-wider select-all leading-none truncate block"
                            dir="ltr"
                          >
                            {p.barcode || p.sku}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: + button on left, price on right (without currency symbol) */}
                    <div dir="ltr" className="flex items-center justify-between gap-1.5 mt-2 pt-2 border-t border-zinc-100">
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) handleAddToCart(p);
                        }}
                        className={`${plusBtnSize} rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 ${
                          isOutOfStock
                            ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                            : inCartQty > 0
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-[#edf5ff] hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 shadow-2xs'
                        }`}
                        title={lang === 'ku' ? 'زیادکردن بۆ سەبەتە' : 'Add to cart'}
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>

                      <div className="flex flex-col items-end min-w-0">
                        {priceInfo.isDiscounted && (
                          <span className="line-through text-zinc-400 font-mono font-bold text-[10px] leading-none mb-0.5">
                            {Number(priceInfo.originalPrice || 0).toLocaleString()}
                          </span>
                        )}
                        <span
                          className={`font-black font-mono leading-none shrink-0 min-w-0 truncate ${priceText} ${
                            isOutOfStock
                              ? 'text-zinc-400'
                              : priceInfo.isDiscounted
                              ? 'text-[#e1144a]'
                              : 'text-blue-600'
                          }`}
                        >
                          {Number(priceInfo.effectivePrice || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Pagination Bar (پاین) */}
        <div className="bg-white border-t border-zinc-300 p-3 flex flex-wrap items-center justify-between gap-3 text-xs select-none font-mono shrink-0">
          {/* Item Count Summary */}
          <div className="text-zinc-600 text-[11px] font-bold">
            {lang === 'ku'
              ? `پیشاندانی ${totalItems === 0 ? 0 : (validPage - 1) * itemsPerPage + 1} - ${Math.min(validPage * itemsPerPage, totalItems)} لە ${totalItems} کاڵا`
              : `Showing ${totalItems === 0 ? 0 : (validPage - 1) * itemsPerPage + 1} - ${Math.min(validPage * itemsPerPage, totalItems)} of ${totalItems} items`}
          </div>

          {/* Pagination Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validPage <= 1}
              className="px-2.5 py-1 bg-white border border-zinc-300 text-zinc-800 hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-white font-bold text-xs flex items-center gap-1 transition-colors rounded-none cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-0 rotate-180" />
              <span>{lang === 'ku' ? 'پێشوو' : 'Prev'}</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - validPage) <= 1)
              .map((page, idx, arr) => {
                const prevPage = arr[idx - 1];
                const showEllipsis = prevPage && page - prevPage > 1;
                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className="px-1 text-zinc-400 font-bold">...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-xs font-bold font-mono transition-colors rounded-none cursor-pointer ${
                        validPage === page
                          ? 'bg-black text-white border border-black'
                          : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validPage >= totalPages}
              className="px-2.5 py-1 bg-white border border-zinc-300 text-zinc-800 hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-white font-bold text-xs flex items-center gap-1 transition-colors rounded-none cursor-pointer disabled:cursor-not-allowed"
            >
              <span>{lang === 'ku' ? 'داهاتوو' : 'Next'}</span>
              <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-0 rotate-180" />
            </button>
          </div>

          {/* Items Per Page Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 font-bold uppercase">{lang === 'ku' ? 'ژمارەی کارت:' : 'Per page:'}</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const val = Number(e.target.value);
                setItemsPerPage(val);
                setCurrentPage(1);
                try {
                  window.electronAPI?.db?.set('pos_items_per_page', val).catch(() => {});
                } catch {}
              }}
              className="bg-zinc-50 border border-zinc-300 px-2 py-1 text-xs font-bold font-mono text-zinc-900 focus:outline-none rounded-none cursor-pointer"
            >
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={16}>16</option>
              <option value={24}>24</option>
              <option value={32}>32</option>
              <option value={9999}>{lang === 'ku' ? 'هەمووی' : 'All'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Right POS Cart & Payment Panel */}
      <div className="w-full md:w-[375px] lg:w-[400px] xl:w-[420px] bg-white flex flex-col h-full border-l rtl:border-r rtl:border-l-0 border-zinc-300 text-xs select-none shrink-0">
        {/* Customer & Pricing Tier Header */}
        <div className="p-4 bg-zinc-50 border-b border-zinc-300 space-y-3">
          <div className="flex items-center justify-between gap-2 relative">
            {/* Searchable Customer Selector Widget */}
            <div className="flex-1 relative font-sans">
              <button
                type="button"
                onClick={() => setIsCustomerSearchOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between gap-2 bg-white px-3 py-2 border rounded-none text-start text-xs cursor-pointer transition-all ${
                  isCustomerSearchOpen
                    ? 'border-black ring-1 ring-black bg-zinc-50'
                    : selectedCustomer && selectedCustomerId !== 'walk_in' && selectedCustomer.creditLimit > 0 && (selectedCustomer.currentDebt >= selectedCustomer.creditLimit || selectedCustomer.currentDebt + grandTotal > selectedCustomer.creditLimit)
                    ? 'border-rose-600 bg-rose-50/70'
                    : 'border-zinc-300 hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                  <UserIcon className="w-4 h-4 text-zinc-600 shrink-0" />
                  <span className="font-bold text-zinc-900 truncate">
                    {selectedCustomerId === 'walk_in'
                      ? (lang === 'ku' ? 'کڕیاری گشتی' : 'Walk-in Customer')
                      : selectedCustomer?.name}
                  </span>
                  {selectedCustomer && selectedCustomer.currentDebt > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                      {lang === 'ku' ? 'قەرز: ' : 'Debt: '}
                      {formatCurrency(selectedCustomer.currentDebt, currency, lang, exchangeRate)}
                    </span>
                  )}
                  {selectedCustomer && selectedCustomerId !== 'walk_in' && selectedCustomer.creditLimit > 0 && (
                    selectedCustomer.currentDebt >= selectedCustomer.creditLimit || selectedCustomer.currentDebt + grandTotal > selectedCustomer.creditLimit ? (
                      <span className="text-[9px] font-mono font-black px-1.5 py-0.5 bg-rose-700 text-white shrink-0">
                        {lang === 'ku' ? '⚠️ تێپەڕاندنی سنووری قەرز' : '⚠️ Exceeding Credit Limit'}
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold text-zinc-600 shrink-0">
                        {lang === 'ku'
                          ? `(سنوور: ${formatCurrency(selectedCustomer.creditLimit, currency, lang, exchangeRate)})`
                          : `(Limit: ${formatCurrency(selectedCustomer.creditLimit, currency, lang, exchangeRate)})`}
                      </span>
                    )
                  )}
                </div>
                <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              </button>

              {/* Search Dropdown Popup - Flush & Perfectly Aligned */}
              {isCustomerSearchOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30 bg-black/5"
                    onClick={() => setIsCustomerSearchOpen(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-300 shadow-2xl z-40 p-2.5 space-y-2 rounded-none font-sans text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Minimal Formal Search Bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 rtl:left-auto rtl:right-2.5 top-2.5" />
                      <input
                        type="text"
                        autoFocus
                        placeholder={lang === 'ku' ? 'گەڕان بە ناو یان مۆبایل...' : 'Search customer or phone...'}
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        className="w-full h-8 bg-zinc-50 border border-zinc-300 pl-8 rtl:pl-2.5 pr-2.5 rtl:pr-8 text-xs text-zinc-900 placeholder-zinc-400 font-sans outline-none focus:border-black rounded-none"
                      />
                      {customerSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setCustomerSearchQuery('')}
                          className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-2 text-zinc-400 hover:text-black"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Customer Results List */}
                    <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 scrollbar-thin px-0.5">
                      {/* Walk-in Customer */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId('walk_in');
                          setIsCustomerSearchOpen(false);
                          setCustomerSearchQuery('');
                        }}
                        className={`w-full py-2.5 px-3 text-start flex items-center justify-between hover:bg-zinc-100 rounded-none transition-colors cursor-pointer ${
                          selectedCustomerId === 'walk_in' ? 'bg-zinc-100 font-black text-black' : 'text-zinc-700'
                        }`}
                      >
                        <span className="font-bold text-xs">{lang === 'ku' ? 'کڕیاری گشتی (Walk-in)' : 'Walk-in Customer'}</span>
                        {selectedCustomerId === 'walk_in' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>

                      {/* Top 3 Header when pre-search */}
                      {!customerSearchQuery.trim() && (
                        <div className="text-[10px] font-mono font-bold text-zinc-500 px-3 py-1 bg-zinc-100 uppercase tracking-tight">
                          {lang === 'ku' ? '🔥 ۳ کڕیاری سەرەکی (زۆرترین کڕیار):' : '🔥 Top 3 Customers:'}
                        </div>
                      )}

                      {/* Registered Customers - Name, Phone, Debt & Credit Limit */}
                      {filteredCustomerList.map((c) => {
                        const isOverLimit = c.creditLimit > 0 && (c.currentDebt >= c.creditLimit || (selectedCustomerId === c.id && c.currentDebt + grandTotal > c.creditLimit));
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setIsCustomerSearchOpen(false);
                              setCustomerSearchQuery('');
                            }}
                            className={`w-full py-2.5 px-3 text-start flex items-center justify-between gap-3 hover:bg-zinc-100 rounded-none transition-colors cursor-pointer border-b border-zinc-100 ${
                              selectedCustomerId === c.id
                                ? 'bg-zinc-100 font-black text-black'
                                : isOverLimit
                                ? 'bg-rose-50/60 hover:bg-rose-100/80 text-zinc-900'
                                : 'bg-white text-zinc-800'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-zinc-900 truncate">
                                  {c.name}
                                </span>
                                {isOverLimit && (
                                  <span className="text-[9px] font-mono font-black bg-rose-700 text-white px-1.5 py-0.5 rounded-none shrink-0 border border-rose-800">
                                    {lang === 'ku' ? '⚠️ تێپەڕاندنی سنوور' : '⚠️ Over Limit'}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2 mt-0.5">
                                <span>{c.phone || '-'}</span>
                                {c.creditLimit > 0 && (
                                  <span className="text-zinc-600">
                                    {lang === 'ku'
                                      ? `بەرزترین سنوور: ${formatCurrency(c.creditLimit, currency, lang, exchangeRate)}`
                                      : `Limit: ${formatCurrency(c.creditLimit, currency, lang, exchangeRate)}`}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-end shrink-0 font-mono">
                              {c.currentDebt > 0 ? (
                                <span className="text-xs font-black text-rose-700 block">
                                  {formatCurrency(c.currentDebt, currency, lang, exchangeRate)}
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-700 font-bold block">
                                  {lang === 'ku' ? 'بێ قەرز' : 'No Debt'}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}

                      {filteredCustomerList.length === 0 && (
                        <div className="p-4 text-center text-zinc-400 text-[11px] font-bold uppercase">
                          {lang === 'ku' ? 'هیچ کڕیارێک نەدۆزرایەوە' : 'No customer found'}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Held Sales Button */}
            <button
              onClick={() => setIsHeldModalOpen(true)}
              className="p-2.5 bg-white hover:bg-zinc-200 text-zinc-900 border border-zinc-300 rounded-none relative transition-colors cursor-pointer"
              title={lang === 'ku' ? 'سەیرکردنی داواکارییە هەڵگیراوەکان' : 'View Held Carts'}
            >
              <PauseCircle className="w-4 h-4 text-zinc-800" />
              {heldSales.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white font-bold font-mono text-[9px] flex items-center justify-center">
                  {heldSales.length}
                </span>
              )}
            </button>

            {/* Sales Return & Invoice Void Button */}
            {onProcessReturn && (
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(true)}
                className="p-2.5 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-zinc-300 hover:border-rose-300 rounded-none relative transition-colors cursor-pointer"
                title={lang === 'ku' ? 'گەڕاندنەوەی کاڵا و هەڵوەشاندنەوەی پسوولە' : 'Sales Return & Void Invoice'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Over Credit Limit Warning Banner for Selected Customer */}
          {selectedCustomer && selectedCustomerId !== 'walk_in' && selectedCustomer.creditLimit > 0 && (selectedCustomer.currentDebt >= selectedCustomer.creditLimit || selectedCustomer.currentDebt + grandTotal > selectedCustomer.creditLimit) && (
            <div className="bg-rose-950/95 border border-rose-600 text-rose-100 p-2.5 space-y-1.5 rounded-none font-sans text-xs shadow-2xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 font-bold text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{lang === 'ku' ? 'ئاگاداری: ئەم کڕیارە سنووری قەرزی تێپەڕاندووە' : 'Warning: Customer Exceeded Credit Limit'}</span>
                </div>
                <span className="text-[10px] font-mono font-black px-1.5 py-0.5 bg-rose-900 text-rose-200 border border-rose-700 shrink-0">
                  {lang === 'ku' ? 'تێپەڕیوە بە: ' : 'Excess: '}
                  +{formatCurrency(Math.max(0, (selectedCustomer.currentDebt + grandTotal) - selectedCustomer.creditLimit), currency, lang, exchangeRate)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-rose-800/80 text-[10px] font-mono">
                <div className="bg-rose-900/40 p-1 px-1.5 border border-rose-800/60">
                  <span className="text-rose-400 font-sans block text-[9px]">{lang === 'ku' ? 'بەرزترین سنوور' : 'Credit Limit'}</span>
                  <span className="font-bold text-rose-100">{formatCurrency(selectedCustomer.creditLimit, currency, lang, exchangeRate)}</span>
                </div>
                <div className="bg-rose-900/40 p-1 px-1.5 border border-rose-800/60">
                  <span className="text-rose-400 font-sans block text-[9px]">{lang === 'ku' ? 'قەرزی پێشوو' : 'Current Debt'}</span>
                  <span className="font-bold text-rose-100">{formatCurrency(selectedCustomer.currentDebt, currency, lang, exchangeRate)}</span>
                </div>
                <div className="bg-rose-900/40 p-1 px-1.5 border border-rose-800/60">
                  <span className="text-rose-400 font-sans block text-[9px]">{lang === 'ku' ? 'کۆی نوێ بەم کڕینەوە' : 'New Total Debt'}</span>
                  <span className="font-black text-white">{formatCurrency(selectedCustomer.currentDebt + grandTotal, currency, lang, exchangeRate)}</span>
                </div>
              </div>
              <div className="text-[10px] text-rose-200/90 font-sans pt-0.5 border-t border-rose-800/50">
                {lang === 'ku'
                  ? '💡 تێبینی: دەتوانیت بە نەقد (کاش) کاڵاکانی پێبفرۆشیت بەبێ ئەوەی قەرزی لەسەر زیاد بێت.'
                  : '💡 Note: You can complete this sale in cash without increasing customer debt.'}
              </div>
            </div>
          )}

          {/* Pricing Tier Toggle (Retail vs Wholesale) */}
          <div className="flex justify-between items-center bg-white p-1 border border-zinc-300 font-mono">
            <span className="text-[10px] text-zinc-500 uppercase font-bold px-2">{lang === 'ku' ? 'جۆر:' : 'Tier:'}</span>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setPricingTier('retail');
                  setCartItems((prev) =>
                    prev.map((item) => {
                      const pInfo = getProductPriceInfo(item.product, 'retail');
                      let newPrice = pInfo.effectivePrice;
                      if (item.unitSelected && item.product.unitConversion && item.unitSelected === item.product.unitConversion.bulkUnit) {
                        newPrice *= item.product.unitConversion.conversionFactor;
                      }
                      return { ...item, pricePerUnit: newPrice };
                    })
                  );
                }}
                className={`px-3 py-1 text-[10px] font-bold uppercase transition-colors rounded-none cursor-pointer ${
                  pricingTier === 'retail' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {lang === 'ku' ? 'تاک' : 'Retail'}
              </button>
              <button
                onClick={() => {
                  setPricingTier('wholesale');
                  setCartItems((prev) =>
                    prev.map((item) => {
                      const pInfo = getProductPriceInfo(item.product, 'wholesale');
                      let newPrice = pInfo.effectivePrice;
                      if (item.unitSelected && item.product.unitConversion && item.unitSelected === item.product.unitConversion.bulkUnit) {
                        newPrice *= item.product.unitConversion.conversionFactor;
                      }
                      return { ...item, pricePerUnit: newPrice };
                    })
                  );
                }}
                className={`px-3 py-1 text-[10px] font-bold uppercase transition-colors rounded-none cursor-pointer ${
                  pricingTier === 'wholesale' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {lang === 'ku' ? 'کۆ' : 'Wholesale'}
              </button>
            </div>
          </div>
        </div>

        {/* Cart Header with Action Buttons & Shift Info */}
        <div className="p-3 border-b border-zinc-200 bg-white space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-900">
                {lang === 'ku' ? 'سەبەتەی فرۆشتن' : 'Sales Cart'}
              </h2>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 font-bold rounded">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            </div>
            {shiftId ? (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{lang === 'ku' ? 'شەفت کراوەیە' : 'Shift Active'}</span>
              </div>
            ) : (
              <span className="text-[10px] text-amber-600 font-bold">
                {lang === 'ku' ? 'شەفت نەکراوەتەوە' : 'No Active Shift'}
              </span>
            )}
          </div>

          {/* Cart Header Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Clear Cart Button */}
            <button
              type="button"
              onClick={() => {
                setCartItems([]);
                setDiscountValue(0);
                try {
                  window.electronAPI?.db?.delete(getCashierCartKey(activeCashierId)).catch(() => {});
                } catch {}
              }}
              disabled={cartItems.length === 0}
              className="flex-1 h-7.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:hover:bg-rose-50 text-rose-600 border border-rose-200 px-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{lang === 'ku' ? 'پاککردنەوەی سەبەتە' : 'Clear Cart'}</span>
            </button>

            {/* Held Sales Button */}
            <button
              type="button"
              onClick={() => setIsHeldModalOpen(true)}
              className="flex-1 h-7.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer relative"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>
                {lang === 'ku' ? `فرۆشتنە ڕاگیراوەکان (${heldSales.length})` : `Held Sales (${heldSales.length})`}
              </span>
            </button>
          </div>
        </div>

        {/* Cart Line Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#fbfcfd]">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 space-y-2">
              <ShoppingCart className="w-9 h-9 stroke-1 text-zinc-300" />
              <p className="text-xs uppercase font-bold tracking-wider text-zinc-400">
                {lang === 'ku' ? 'سەبەتە بەتاڵە. کاڵا هەڵبژێرە لە کۆگاوە.' : 'Cart Empty. Select items from catalog.'}
              </p>
            </div>
          ) : (
            cartItems.map((item, index) => {
              const lineTotal = item.quantity * item.pricePerUnit * (1 - item.discount / 100);

              return (
                <div
                  key={`${item.product.id}_${item.unitSelected}_${index}`}
                  className="bg-white px-2.5 py-2 sm:px-3 sm:py-2.5 border border-slate-200 hover:border-slate-300 rounded-lg shadow-2xs transition-all grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2"
                >
                  {/* Col 1: Product Name (Top) + Barcode (Bottom directly under name) */}
                  <div className="min-w-0 pr-0.5 text-start">
                    <h4 className="font-black text-slate-900 text-xs truncate leading-snug text-start">
                      {lang === 'ku' ? item.product.nameKu || item.product.name : item.product.name}
                    </h4>
                    {(item.product.barcode || item.product.sku) && (
                      <p className="text-[10px] text-slate-400 font-mono tracking-tight leading-tight mt-0.5 truncate text-start">
                        {item.product.barcode || item.product.sku}
                      </p>
                    )}
                  </div>

                  {/* Col 2: Fixed-width Unit Selector (Centered) */}
                  <div className="w-[68px] shrink-0">
                    {item.product.unitConversion ? (
                      <div className="relative w-full">
                        <select
                          value={item.unitSelected}
                          onChange={(e) => handleToggleLineUnit(index, e.target.value as UnitType)}
                          className="w-full bg-white border border-slate-200 hover:border-slate-300 text-slate-800 h-8 px-1 text-xs font-bold rounded outline-none cursor-pointer shadow-2xs appearance-none text-center"
                        >
                          <option value={item.product.unitConversion.baseUnit}>
                            {formatUnitName(item.product.unitConversion.baseUnit, lang)}
                          </option>
                          <option value={item.product.unitConversion.bulkUnit}>
                            {formatUnitName(item.product.unitConversion.bulkUnit, lang)}
                          </option>
                        </select>
                        <ChevronLeft className="w-3 h-3 text-slate-400 -rotate-90 absolute top-1/2 -translate-y-1/2 left-1 rtl:left-1 rtl:right-auto pointer-events-none" />
                      </div>
                    ) : (
                      <div className="w-full bg-white border border-slate-200 text-slate-800 h-8 px-1 text-xs font-bold rounded flex items-center justify-center gap-1 shadow-2xs">
                        <span className="truncate">{formatUnitName(item.unitSelected || item.product.unit, lang)}</span>
                        <ChevronLeft className="w-3 h-3 text-slate-400 -rotate-90 shrink-0" />
                      </div>
                    )}
                  </div>

                  {/* Col 3: Fixed-width Stepper Controls */}
                  <div className="w-[94px] shrink-0 flex items-center bg-slate-100/90 p-0.5 rounded-md border border-slate-200/80 gap-0.5 justify-between">
                    {/* Minus Button (Vibrant Red) */}
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(index, -1)}
                      className="w-7 h-7 bg-[#e1144a] hover:bg-rose-700 active:scale-95 text-white font-bold rounded flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
                      title={lang === 'ku' ? 'کەمکردنەوە' : 'Decrease'}
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>

                    {/* Quantity Input Box */}
                    <input
                      type="number"
                      min={1}
                      max={item.product.stockQuantity}
                      value={item.quantity}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        const clamped = Math.min(Math.max(1, val), item.product.stockQuantity);
                        const diff = clamped - item.quantity;
                        if (diff !== 0) handleUpdateQty(index, diff);
                      }}
                      className="w-8 h-7 bg-white border border-slate-200/80 text-center font-black text-xs text-blue-600 font-mono outline-none rounded shadow-2xs focus:border-blue-500 shrink-0"
                    />

                    {/* Plus Button (Vibrant Blue) */}
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(index, 1)}
                      disabled={item.quantity >= item.product.stockQuantity}
                      className="w-7 h-7 bg-[#2563eb] hover:bg-blue-700 active:scale-95 text-white font-bold rounded flex items-center justify-center transition-all cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                      title={lang === 'ku' ? 'زیادکردن' : 'Increase'}
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Col 4: Fixed-width Price */}
                  <div className="w-[78px] shrink-0 text-start">
                    <span
                      className="font-black text-xs font-mono text-blue-600 leading-none block truncate"
                      dir="ltr"
                    >
                      {formatCurrency(lineTotal, currency, lang, exchangeRate)}
                    </span>
                  </div>

                  {/* Col 5: Fixed-width Delete Button */}
                  <div className="w-5 shrink-0 flex items-center justify-center">
                    <button
                      type="button"
                      title={lang === 'ku' ? 'سڕینەوە' : 'Delete'}
                      onClick={() => handleUpdateQty(index, -item.quantity)}
                      className="text-slate-300 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 stroke-[1.8]" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Totals & Checkout Panel */}
        <div className="bg-zinc-50 p-4 border-t border-zinc-300 space-y-3 font-mono">
          {/* Subtotal & Discount summary */}
          <div className="space-y-2 text-xs">
            {/* Subtotal */}
            <div className="flex justify-between items-center text-zinc-600">
              <span className="font-sans font-medium">{lang === 'ku' ? 'کۆی گشتی' : 'Subtotal'}</span>
              <span className="text-zinc-900 font-bold">{formatCurrency(subtotal, currency, lang, exchangeRate)}</span>
            </div>

            {/* Discount Box (Percentage % or Cash Amount IQD) */}
            <div className="bg-white p-2.5 border border-zinc-200 rounded space-y-2">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-sans font-bold text-zinc-700 text-[11px]">
                    {lang === 'ku' ? 'داشکاندن:' : 'Discount:'}
                  </span>
                  {/* Mode Toggle: % vs IQD / Currency */}
                  <div className="flex bg-zinc-100 border border-zinc-200 p-0.5 rounded text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        if (discountType !== 'percent') {
                          setDiscountType('percent');
                          if (subtotal > 0 && discountValue > 0) {
                            const percent = Math.round((toBaseIQD(discountValue, currency, exchangeRate) / subtotal) * 100);
                            setDiscountValue(Math.min(100, Math.max(0, percent)));
                          }
                        }
                      }}
                      className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer ${
                        discountType === 'percent'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                      }`}
                      title={lang === 'ku' ? 'داشکاندن بە ڕێژەی سەدی (%)' : 'Discount by Percentage (%)'}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (discountType !== 'amount') {
                          setDiscountType('amount');
                          if (subtotal > 0 && discountValue > 0) {
                            const amt = Math.round((subtotal * discountValue) / 100);
                            setDiscountValue(fromBaseIQD(amt, currency, exchangeRate));
                          }
                        }
                      }}
                      className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer ${
                        discountType === 'amount'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                      }`}
                      title={lang === 'ku' ? 'داشکاندن بە بڕی پارە (دینار)' : 'Discount by Cash Amount'}
                    >
                      {currency === 'USD' ? '$' : (lang === 'ku' ? 'پارە' : 'IQD')}
                    </button>
                  </div>
                </div>

                {/* Input & Unit */}
                <div className="flex items-center gap-1.5 flex-1 justify-end max-w-[140px]">
                  <div className="relative w-full">
                    <input
                      type="number"
                      min={0}
                      max={discountType === 'percent' ? 100 : fromBaseIQD(subtotal, currency, exchangeRate)}
                      step={discountType === 'percent' ? '1' : (currency === 'USD' ? '0.25' : '250')}
                      value={discountValue === 0 ? '' : discountValue}
                      placeholder="0"
                      disabled={currentUser?.role === 'cashier' && currentUser.permissions ? !currentUser.permissions.canApplyDiscount : false}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (discountType === 'percent') {
                          setDiscountValue(Math.min(100, Math.max(0, val)));
                        } else {
                          const maxVal = fromBaseIQD(subtotal, currency, exchangeRate);
                          setDiscountValue(Math.min(maxVal, Math.max(0, val)));
                        }
                      }}
                      className="w-full bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 px-2 py-1 text-end text-zinc-900 font-bold text-xs rounded outline-none transition-all disabled:opacity-50 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                      title={currentUser?.role === 'cashier' && currentUser.permissions && !currentUser.permissions.canApplyDiscount ? (lang === 'ku' ? 'دەسەڵاتی داشکاندنت نییە' : 'No discount permission') : ''}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-zinc-500 shrink-0">
                    {discountType === 'percent' ? '%' : (currency === 'USD' ? '$' : (lang === 'ku' ? '' : 'IQD'))}
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1 items-center pt-1 border-t border-zinc-100">
                <span className="text-[10px] text-zinc-400 font-sans font-bold ml-1 rtl:ml-0 rtl:mr-1">
                  {lang === 'ku' ? 'خێرا:' : 'Quick:'}
                </span>
                {discountType === 'percent' ? (
                  [5, 10, 15, 20, 25].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      disabled={currentUser?.role === 'cashier' && currentUser.permissions ? !currentUser.permissions.canApplyDiscount : false}
                      onClick={() => setDiscountValue(pct)}
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-xs border transition-colors cursor-pointer ${
                        discountValue === pct
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))
                ) : (
                  (currency === 'USD'
                    ? [1, 2, 5, 10]
                    : [500, 1000, 2500, 5000, 10000]
                  ).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      disabled={currentUser?.role === 'cashier' && currentUser.permissions ? !currentUser.permissions.canApplyDiscount : false}
                      onClick={() => {
                        const maxVal = fromBaseIQD(subtotal, currency, exchangeRate);
                        setDiscountValue(Math.min(maxVal, amt));
                      }}
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-xs border transition-colors cursor-pointer ${
                        discountValue === amt
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}
                    >
                      {currency === 'USD' ? `$${amt}` : `${amt.toLocaleString()}`}
                    </button>
                  ))
                )}

                {discountValue > 0 && (
                  <button
                    type="button"
                    onClick={() => setDiscountValue(0)}
                    className="px-1.5 py-0.5 text-[10px] font-bold rounded-xs bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer ml-auto rtl:ml-0 rtl:mr-auto"
                    title={lang === 'ku' ? 'سڕینەوەی داشکاندن' : 'Clear discount'}
                  >
                    {lang === 'ku' ? 'سڕینەوە' : 'Reset'}
                  </button>
                )}
              </div>

              {/* Active Discount Summary Pill */}
              {globalDiscountAmount > 0 && (
                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 px-2 py-1 rounded text-[11px] font-bold text-emerald-800">
                  <span>{lang === 'ku' ? 'داشکێنراوە:' : 'Deducted:'}</span>
                  <div className="flex items-center gap-1 font-mono">
                    <span>-{formatCurrency(globalDiscountAmount, currency, lang, exchangeRate)}</span>
                    {discountType === 'amount' && subtotal > 0 && (
                      <span className="text-[10px] text-emerald-600 font-normal mr-1 rtl:mr-0 rtl:ml-1">
                        ({((globalDiscountAmount / subtotal) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-end border-t border-zinc-300 pt-2.5 text-zinc-900">
              <span className="text-xs font-bold uppercase tracking-widest font-sans mb-1">{lang === 'ku' ? 'کۆی کۆتایی' : 'Grand Total'}</span>
              <span className="text-3xl font-black text-blue-600">{formatCurrency(grandTotal, currency, lang, exchangeRate)}</span>
            </div>
          </div>

          {/* Hold Cart & Clear Cart Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setCartItems([]);
                setDiscountValue(0);
              }}
              disabled={cartItems.length === 0}
              className="py-3 bg-zinc-200 hover:bg-zinc-300 disabled:opacity-50 text-zinc-800 font-bold uppercase text-xs transition-colors rounded-none cursor-pointer disabled:cursor-not-allowed"
            >
              {lang === 'ku' ? 'سڕینەوە' : 'Clear'}
            </button>
            <button
              onClick={handleHoldActiveCart}
              disabled={cartItems.length === 0}
              className="py-3 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white font-bold uppercase text-xs transition-colors rounded-none flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              {lang === 'ku' ? 'هەڵگرتنی داواکاری' : 'Hold Order'}
            </button>
          </div>

          {/* Payment Action Buttons */}
          <div className="space-y-2">
            {/* Primary Direct Cash Sale Button */}
            <button
              onClick={handleQuickCashCheckout}
              disabled={cartItems.length === 0}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black uppercase text-xs tracking-wider transition-colors rounded-none shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Coins className="w-4 h-4" />
              <span>
                {selectedCustomer && selectedCustomerId !== 'walk_in'
                  ? (lang === 'ku' ? `فرۆشتنی نەقد (کاش) بۆ ${selectedCustomer.name}` : `Cash Sale to ${selectedCustomer.name}`)
                  : (lang === 'ku' ? 'فرۆشتنی نەقد (کاش)' : 'Quick Cash Sale')}
              </span>
            </button>

            {/* Split row: Credit Sale & Detailed Modal */}
            <div className="grid grid-cols-2 gap-2">
              {/* Credit Sale Button */}
              {selectedCustomer && selectedCustomerId !== 'walk_in' ? (
                <button
                  onClick={() => {
                    setPaymentMethod('credit');
                    setCreditLimitOverrideConfirmed(false);
                    setIsPayModalOpen(true);
                  }}
                  disabled={cartItems.length === 0}
                  className="py-2.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-bold text-xs transition-colors rounded-none flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{lang === 'ku' ? 'فرۆشتن بە قەرز' : 'Sell on Credit'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsCustomerSearchOpen(true)}
                  disabled={cartItems.length === 0}
                  className="py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-700 border border-zinc-300 font-bold text-xs transition-colors rounded-none flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <UserIcon className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{lang === 'ku' ? 'دیاریکردنی کڕیار بۆ قەرز' : 'Select for Credit'}</span>
                </button>
              )}

              {/* Detailed Payment Modal Button */}
              <button
                onClick={() => {
                  setPaymentMethod('cash');
                  setCashTendered(grandTotal);
                  setIsPayModalOpen(true);
                }}
                disabled={cartItems.length === 0}
                className="py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs transition-colors rounded-none flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                <span>{lang === 'ku' ? 'شێوازی تر / بەشەکی' : 'Custom / Change'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md p-6 space-y-5 shadow-2xl text-zinc-900 rounded-none font-sans">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-zinc-900">
                {lang === 'ku' ? 'پارەدانی فاکتۆر' : 'Checkout Payment'}
              </h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-zinc-500 hover:text-black cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              {/* Payment Mode Selector: Cash vs Debt */}
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1 font-sans">
                  {lang === 'ku' ? 'ڕێگەی پارەدان' : 'Payment Method'}
                </label>
                <div className="flex bg-zinc-100 p-1 border border-zinc-300 rounded-none">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex-1 py-2 font-bold uppercase rounded-none cursor-pointer transition-colors ${
                      paymentMethod === 'cash' ? 'bg-emerald-600 text-white' : 'text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {lang === 'ku' ? 'کاش (نەقد)' : 'Cash'}
                  </button>
                  <button
                    onClick={() => setPaymentMethod('credit')}
                    className={`flex-1 py-2 font-bold uppercase rounded-none cursor-pointer transition-colors ${
                      paymentMethod === 'credit' ? 'bg-rose-600 text-white' : 'text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {lang === 'ku' ? 'قەرزی کڕیار' : 'Customer Debt'}
                  </button>
                </div>
              </div>

              {/* Customer Info Pill in Modal */}
              {selectedCustomer && selectedCustomerId !== 'walk_in' && (
                paymentMethod === 'cash' ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 flex items-center justify-between text-emerald-900 text-xs rounded-none font-sans">
                    <div className="flex items-center gap-1.5 font-bold">
                      <UserIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{lang === 'ku' ? `کڕیار: ${selectedCustomer.name}` : `Customer: ${selectedCustomer.name}`}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 border border-emerald-200 shrink-0">
                      {lang === 'ku' ? 'پارەدانی نەقد (بێ قەرز)' : 'Cash Payment (No Debt)'}
                    </span>
                  </div>
                ) : null
              )}

              {/* Total Due Badge */}
              <div className="bg-zinc-50 p-4 border border-zinc-200 flex justify-between items-center rounded-none">
                <span className="text-zinc-600 font-bold uppercase text-[11px]">{lang === 'ku' ? 'کۆی بڕی بەها:' : 'Total Amount Due:'}</span>
                <span className="text-zinc-900 font-black text-2xl">{formatCurrency(grandTotal, currency, lang, exchangeRate)}</span>
              </div>

              {/* Cash Tendered Calculator */}
              {paymentMethod === 'cash' ? (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block">
                    {lang === 'ku' ? `بڕی وەرگیراو${currency === 'USD' ? ' ($)' : ''}` : `Cash Tendered (${currency === 'IQD' ? 'IQD' : '$'})`}
                  </label>
                  <input
                    type="number"
                    step={currency === 'USD' ? '0.01' : '250'}
                    value={cashTendered}
                    onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-zinc-300 px-3 py-2 text-zinc-900 font-black text-lg rounded-none focus:border-black outline-none"
                  />

                  {/* Quick Cash Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {(currency === 'USD'
                      ? [Math.ceil(fromBaseIQD(grandTotal, 'USD', exchangeRate)), 10, 20, 50, 100]
                      : [Math.ceil(grandTotal / 1000) * 1000, 10000, 25000, 50000, 100000]
                    ).slice(0, 4).map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setCashTendered(currency === 'USD' ? amt * exchangeRate : amt)}
                        className="py-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-900 font-bold text-xs rounded-none"
                      >
                        {currency === 'USD' ? `$${amt}` : (lang === 'ku' ? amt.toLocaleString() : `${amt.toLocaleString()} IQD`)}
                      </button>
                    ))}
                  </div>

                  <div className="bg-zinc-50 p-3 border border-zinc-200 flex justify-between font-bold text-sm pt-2 rounded-none">
                    <span className="text-zinc-600">{lang === 'ku' ? 'ماوەی وەرگیراو:' : 'Change Due:'}</span>
                    <span className="text-emerald-700 font-black">
                      {formatCurrency(
                        Math.max(0, toBaseIQD(cashTendered, currency, exchangeRate) - grandTotal),
                        currency,
                        lang,
                        exchangeRate
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 font-sans">
                  {!selectedCustomer || selectedCustomerId === 'walk_in' ? (
                    <div className="p-4 space-y-1.5 rounded-none border bg-rose-50 border-rose-300 text-rose-900">
                      <div className="font-black uppercase text-xs flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="text-rose-700">{lang === 'ku' ? 'ڕێگەپێنەدراوە: کڕیار تۆمار نەکراوە!' : 'Forbidden: No registered customer!'}</span>
                      </div>
                      <p className="text-[11px]">
                        {lang === 'ku'
                          ? 'تکایە سەرەتا کڕیارێکی تۆمارکراو لە سەرەوە هەڵبژێرە. فرۆشتن بە قەرز بۆ کڕیاری گشتی نابێت.'
                          : 'Please select a registered customer first. Debt sales are strictly restricted to registered customers.'}
                      </p>
                    </div>
                  ) : (
                    (() => {
                      const projDebt = selectedCustomer.currentDebt + grandTotal;
                      const cLimit = selectedCustomer.creditLimit || 0;
                      const isBreached = cLimit > 0 && projDebt > cLimit;
                      const excess = Math.max(0, projDebt - cLimit);
                      const remainingAfter = Math.max(0, cLimit - projDebt);

                      return (
                        <div className="space-y-2.5">
                          {/* Customer Debt Status Card */}
                          <div className="bg-zinc-50 border border-zinc-300 p-3.5 space-y-2 rounded-none">
                            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                              <div className="flex items-center gap-1.5">
                                <UserIcon className="w-4 h-4 text-zinc-700" />
                                <span className="font-extrabold text-xs text-zinc-900">{selectedCustomer.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-zinc-500">{selectedCustomer.phone || '-'}</span>
                            </div>

                            {/* 4 Metrics Grid */}
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                              <div className="bg-white p-2 border border-zinc-200">
                                <span className="text-[9px] uppercase font-bold text-zinc-500 block font-sans">
                                  {lang === 'ku' ? 'بەرزترین سنووری قەرز' : 'Credit Limit'}
                                </span>
                                <span className="font-extrabold text-zinc-900 text-xs">
                                  {formatCurrency(cLimit, currency, lang, exchangeRate)}
                                </span>
                              </div>

                              <div className="bg-white p-2 border border-zinc-200">
                                <span className="text-[9px] uppercase font-bold text-zinc-500 block font-sans">
                                  {lang === 'ku' ? 'قەرزی پێشوو' : 'Current Debt'}
                                </span>
                                <span className="font-extrabold text-rose-700 text-xs">
                                  {formatCurrency(selectedCustomer.currentDebt, currency, lang, exchangeRate)}
                                </span>
                              </div>

                              <div className="bg-white p-2 border border-zinc-200">
                                <span className="text-[9px] uppercase font-bold text-zinc-500 block font-sans">
                                  {lang === 'ku' ? 'قەرزی ئەم کڕینە' : 'This Sale Debt'}
                                </span>
                                <span className="font-extrabold text-blue-600 text-xs">
                                  +{formatCurrency(grandTotal, currency, lang, exchangeRate)}
                                </span>
                              </div>

                              <div className={`p-2 border ${isBreached ? 'bg-rose-100/70 border-rose-300' : 'bg-white border-zinc-200'}`}>
                                <span className="text-[9px] uppercase font-bold text-zinc-500 block font-sans">
                                  {lang === 'ku' ? 'کۆی قەرزی نوێ' : 'New Total Debt'}
                                </span>
                                <span className={`font-black text-xs ${isBreached ? 'text-rose-800' : 'text-zinc-900'}`}>
                                  {formatCurrency(projDebt, currency, lang, exchangeRate)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Limit Breach Alert Banner */}
                          {isBreached ? (
                            <div className="p-3 bg-rose-50 border-2 border-rose-600 text-rose-950 space-y-2 rounded-none shadow-xs animate-in fade-in duration-200">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <h4 className="font-black text-xs text-rose-900">
                                    {lang === 'ku'
                                      ? 'ئاگاداری: ئەم کڕینە لە بەرزترین سنووری قەرز تێپەڕ دەبێت!'
                                      : 'Warning: This sale exceeds the customer credit limit!'}
                                  </h4>
                                  <p className="text-[11px] text-rose-800 leading-snug">
                                    {lang === 'ku' ? (
                                      <>
                                        بڕی تێپەڕیو لە سنوور:{' '}
                                        <span className="font-mono font-black text-rose-950 bg-rose-200/80 px-1 py-0.2">
                                          {formatCurrency(excess, currency, lang, exchangeRate)}
                                        </span>{' '}
                                        (سنوورەکەی {formatCurrency(cLimit, currency, lang, exchangeRate)} بوو، قەرزی کۆتایی دەبێتە {formatCurrency(projDebt, currency, lang, exchangeRate)}).
                                      </>
                                    ) : (
                                      <>
                                        Exceeded limit by:{' '}
                                        <span className="font-mono font-black text-rose-950 bg-rose-200/80 px-1 py-0.2">
                                          {formatCurrency(excess, currency, lang, exchangeRate)}
                                        </span>{' '}
                                        (Limit is {formatCurrency(cLimit, currency, lang, exchangeRate)}, new debt will be {formatCurrency(projDebt, currency, lang, exchangeRate)}).
                                      </>
                                    )}
                                  </p>
                                </div>
                              </div>

                              <label className="flex items-center gap-2 pt-1 border-t border-rose-200 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={creditLimitOverrideConfirmed}
                                  onChange={(e) => setCreditLimitOverrideConfirmed(e.target.checked)}
                                  className="w-4 h-4 text-rose-600 focus:ring-rose-500 rounded-none cursor-pointer"
                                />
                                <span className="text-[11px] font-bold text-rose-900">
                                  {lang === 'ku'
                                    ? 'ڕێگەدان بە تێپەڕاندنی بەرزترین سنووری قەرز بۆ ئەم پسوڵەیە'
                                    : 'Authorize credit limit override for this invoice'}
                                </span>
                              </label>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex justify-between items-center rounded-none font-bold">
                              <span>{lang === 'ku' ? 'ماوەی بەردەست لە سنووری قەرز:' : 'Remaining credit available:'}</span>
                              <span className="font-mono font-black text-emerald-900">
                                {formatCurrency(remainingAfter, currency, lang, exchangeRate)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {/* Confirm Payment Action */}
              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 bg-zinc-200 text-zinc-800 font-bold uppercase text-xs rounded-none hover:bg-zinc-300"
                >
                  {lang === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
                </button>
                <button
                  onClick={handleFinalizePayment}
                  className={`px-5 py-2.5 text-white font-black uppercase text-xs tracking-wider rounded-none cursor-pointer transition-colors ${
                    paymentMethod === 'cash' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {paymentMethod === 'cash'
                    ? (lang === 'ku' ? 'تەواوکردنی فرۆشتنی نەقد و چاپ' : 'Complete Cash Sale & Print')
                    : (lang === 'ku' ? 'تەواوکردنی فرۆشتن بە قەرز و چاپ' : 'Complete Credit Sale & Print')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Held Sales List Modal */}
      {isHeldModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-lg p-5 space-y-4 shadow-2xl text-zinc-900 rounded-none font-sans">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <PauseCircle className="w-5 h-5 text-zinc-800" />
                <h3 className="font-black text-xs uppercase tracking-wider text-zinc-900">
                  {lang === 'ku' ? 'داواکارییە هەڵگیراوەکان' : 'Held Orders & Saved Carts'}
                </h3>
                {heldSales.length > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-zinc-100 text-zinc-800 border border-zinc-300 px-2 py-0.5 rounded-none">
                    {heldSales.length} {lang === 'ku' ? 'داواکاری' : 'Saved'}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsHeldModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Held Orders List */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-0.5">
              {heldSales.length === 0 ? (
                <div className="text-center py-10 text-zinc-400 font-bold text-xs space-y-2">
                  <PauseCircle className="w-8 h-8 mx-auto text-zinc-300 stroke-1" />
                  <p>{lang === 'ku' ? 'هیچ داواکارییەکی هەڵگیراو لە سیستەمدا نییە.' : 'No held orders currently saved.'}</p>
                </div>
              ) : (
                heldSales.map((h) => {
                  const heldTotal = h.items.reduce(
                    (sum, it) => sum + it.quantity * it.pricePerUnit * (1 - it.discount / 100),
                    0
                  );
                  const totalQuantity = h.items.reduce((sum, it) => sum + it.quantity, 0);

                  return (
                    <div
                      key={h.id}
                      className="bg-white border border-zinc-300 p-3.5 space-y-2.5 rounded-none hover:border-zinc-500 transition-colors shadow-2xs"
                    >
                      {/* Header Row: Customer & Time */}
                      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-xs text-zinc-900 truncate font-sans">
                            {h.customerName}
                          </span>
                          {h.note && h.note !== 'داواکاری هەڵگیراو' && h.note !== 'Saved order' && h.note !== 'Cart saved on register' && (
                            <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded-none truncate max-w-[150px]">
                              {h.note}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono shrink-0">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{h.createdAt}</span>
                        </div>
                      </div>

                      {/* Items Summary Badges / Chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {h.items.slice(0, 4).map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-zinc-50 border border-zinc-200 text-zinc-800 px-2 py-0.5 text-[11px] font-sans flex items-center gap-1.5 rounded-none"
                          >
                            <span className="font-bold truncate max-w-[150px]">
                              {lang === 'ku' ? (item.product.nameKu || item.product.name) : item.product.name}
                            </span>
                            <span className="font-mono font-bold text-zinc-600 text-[10px]">
                              ×{item.quantity}
                            </span>
                          </div>
                        ))}
                        {h.items.length > 4 && (
                          <span className="text-[10px] font-mono font-bold text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 self-center">
                            +{h.items.length - 4} {lang === 'ku' ? 'کاڵای تر' : 'more'}
                          </span>
                        )}
                      </div>

                      {/* Bottom Row: Total Calculation & Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] text-zinc-500 font-sans">
                            {totalQuantity} {lang === 'ku' ? 'دانە' : 'items'}
                          </span>
                          <span className="text-zinc-300">|</span>
                          <span className="font-black font-mono text-xs text-zinc-900">
                            {formatCurrency(heldTotal, currency, lang, exchangeRate)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (onDeleteHeldSale) {
                                onDeleteHeldSale(h.id);
                              } else {
                                onResumeSale(h.id);
                              }
                            }}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer rounded-none"
                            title={lang === 'ku' ? 'سڕینەوەی ئەم داواکارییە' : 'Delete saved order'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResumeHeld(h)}
                            className="h-7 px-3 bg-black hover:bg-zinc-800 text-white font-bold text-[11px] uppercase flex items-center gap-1 rounded-none transition-colors cursor-pointer shadow-2xs"
                          >
                            <PlayCircle className="w-3 h-3" />
                            <span>{lang === 'ku' ? 'دەستپێکردنەوە' : 'Resume'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stock Quantity Exceeded Warning Modal */}
      {stockAlert && stockAlert.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md p-6 space-y-4 shadow-2xl text-zinc-900 rounded-none font-sans">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{lang === 'ku' ? 'ئاگاداری کۆگا: نەبوونی بڕی بەردەست' : 'Stock Exceeded Alert'}</span>
              </h3>
              <button onClick={() => setStockAlert(null)} className="text-zinc-400 hover:text-zinc-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-rose-50 border border-rose-200 p-3 text-rose-900 font-sans space-y-1">
                <p className="font-bold">
                  {lang === 'ku'
                    ? `بەداخەوە! بڕی داواکراو زیاترە لە بڕی بەردەست لە کۆگادا.`
                    : `Requested quantity exceeds available inventory stock!`}
                </p>
              </div>

              <div className="bg-zinc-50 p-3 border border-zinc-200 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-sans">{lang === 'ku' ? 'ناوی کاڵا:' : 'Product:'}</span>
                  <span className="font-bold text-zinc-900 font-sans">{stockAlert.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-sans">{lang === 'ku' ? 'بڕی بەردەست لە کۆگا:' : 'Available Stock:'}</span>
                  <span className="font-black text-emerald-800">{stockAlert.availableStock}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-1">
                  <span className="text-zinc-500 font-sans">{lang === 'ku' ? 'بڕی داواکراو بۆ فرۆشتن:' : 'Requested Quantity:'}</span>
                  <span className="font-black text-rose-700">{stockAlert.requestedQty}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setStockAlert(null)}
                className="h-9 px-5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs uppercase rounded-none transition-colors"
              >
                {lang === 'ku' ? 'تێگەیشتم (داخستن)' : 'Understood'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Product Image Modal */}
      {editingImageProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md p-5 space-y-4 shadow-2xl text-zinc-900 rounded-md font-sans">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-zinc-900">
                  {lang === 'ku' ? 'گۆڕینی وێنەی کاڵا' : 'Change Product Image'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingImageProduct(null)}
                className="text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-zinc-700 block mb-1">
                  {lang === 'ku' ? (editingImageProduct.nameKu || editingImageProduct.name) : editingImageProduct.name}
                </span>
                <p className="text-[10px] text-zinc-400 font-mono" dir="ltr">
                  {editingImageProduct.barcode || editingImageProduct.sku}
                </p>
              </div>

              {/* Image Preview */}
              <div className="flex justify-center">
                <div className="w-32 h-32 bg-white border border-zinc-300 rounded-md overflow-hidden flex items-center justify-center relative shadow-xs p-1.5">
                  {newImageUrl ? (
                    <img
                      src={newImageUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Package className="w-10 h-10 text-zinc-300" />
                  )}
                </div>
              </div>

              {/* URL Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-600 block">
                  {lang === 'ku' ? 'بەستەری وێنە (Image URL):' : 'Image URL:'}
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setNewImageUrl(val);
                    if (val.startsWith('http')) {
                      try {
                        const squared = await processAndSquareProductImage(val, 400);
                        setNewImageUrl(squared);
                      } catch {}
                    }
                  }}
                  className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 px-3 py-1.5 text-xs text-zinc-900 rounded outline-none font-mono"
                  dir="ltr"
                />
              </div>

              {/* File Upload Option */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-600 block">
                  {lang === 'ku' ? 'یان بارکردنی وێنە لە کۆمپیوتەرەکەت:' : 'Or Upload from your computer:'}
                </label>
                <label className="flex items-center justify-center gap-2 border border-dashed border-zinc-300 hover:border-blue-500 bg-zinc-50 hover:bg-blue-50/50 p-2.5 rounded cursor-pointer transition-colors text-zinc-700">
                  <Upload className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-medium">
                    {lang === 'ku' ? 'هەڵبژاردنی وێنە لە فایلەکان...' : 'Browse image file...'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const squared = await processAndSquareProductImage(file, 400);
                          setNewImageUrl(squared);
                        } catch {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setNewImageUrl(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Preset Sample Images */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-zinc-500 block">
                  {lang === 'ku' ? 'نموونەی وێنە ئامادەکراوەکان:' : 'Preset Sample Images:'}
                </span>
                <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto p-1 bg-zinc-50 border border-zinc-200 rounded">
                  {PRESET_SAMPLE_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewImageUrl(preset.url)}
                      className={`relative aspect-square rounded overflow-hidden border transition-all cursor-pointer ${
                        newImageUrl === preset.url
                          ? 'border-blue-600 ring-2 ring-blue-600'
                          : 'border-zinc-200 hover:border-blue-400'
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingImageProduct(null)}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded transition-colors cursor-pointer"
              >
                {lang === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateProduct && editingImageProduct) {
                    onUpdateProduct({
                      ...editingImageProduct,
                      image: newImageUrl,
                    });
                  }
                  setEditingImageProduct(null);
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition-colors cursor-pointer shadow-xs"
              >
                {lang === 'ku' ? 'پاشەکەوتکردن' : 'Save Image'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sales Return & Invoice Void Modal */}
      {onProcessReturn && (
        <SalesReturnModal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          invoices={invoices}
          currentUser={currentUser || { id: 'usr_1', name: cashierName, role: 'cashier', phone: '', pin: '0000' }}
          onProcessReturn={(invoiceId, returnedItems, totalRefund, reason, isFullVoid) => {
            onProcessReturn(invoiceId, returnedItems, totalRefund, reason, isFullVoid);
          }}
          lang={lang}
          currency={currency}
          exchangeRate={exchangeRate}
        />
      )}
    </div>
  );
};
