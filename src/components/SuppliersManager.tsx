import React from 'react';
import {
  Store,
  Plus,
  Search,
  X,
  Phone,
  MapPin,
  Edit3,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Building2,
  Printer,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Package,
  Eye,
  FileSpreadsheet,
  Receipt,
  RotateCcw,
  Check,
  Barcode,
} from 'lucide-react';
import { Supplier, PurchaseInvoice, Product } from '../types';
import { Currency, formatCurrency } from '../utils/currency';
import { getSampleImageForProduct } from '../utils/productImages';

interface SupplierPaymentReceipt {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  date: string;
  paidBy: string;
  notes?: string;
  remainingDebt: number;
}

interface PurchaseItemEntry {
  productId: string;
  productName: string;
  barcode?: string;
  qty: number;
  cost: number;
  retailPrice?: number;
}

interface SuppliersManagerProps {
  suppliers: Supplier[];
  products: Product[];
  purchaseInvoices?: PurchaseInvoice[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier?: (supplier: Supplier) => void;
  onDeleteSupplier?: (supplierId: string) => void;
  onCreatePurchaseInvoice: (invoice: PurchaseInvoice) => void;
  onPaySupplier: (supplierId: string, amount: number) => void;
  onAddProduct?: (product: Product) => void;
  lang?: 'en' | 'ku';
  currency?: Currency;
  exchangeRate?: number;
}

export const SuppliersManager: React.FC<SuppliersManagerProps> = ({
  suppliers,
  products,
  purchaseInvoices: propPurchaseInvoices = [],
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onCreatePurchaseInvoice,
  onPaySupplier,
  onAddProduct,
  lang = 'ku',
  currency = 'IQD',
  exchangeRate = 1500,
}) => {
  const [search, setSearch] = React.useState('');

  // Selected Supplier for Full-Page Detailed View (matches screenshot media_1787607519638.png)
  const [selectedSupplierDetail, setSelectedSupplierDetail] = React.useState<Supplier | null>(null);
  const [detailSubTab, setDetailSubTab] = React.useState<'invoices' | 'history' | 'pay_debt'>('invoices');
  const [invoiceSearch, setInvoiceSearch] = React.useState('');

  // Mode: Full Screen New Purchase Invoice (matches screenshot media_1787649198277.png)
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = React.useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = React.useState(false);
  const [pickerSearch, setPickerSearch] = React.useState('');
  const [purchaseItemSearch, setPurchaseItemSearch] = React.useState('');

  // Product Picker Sub-Views & Form States (matches media_1787652745999.png)
  const [pickerMode, setPickerMode] = React.useState<'list' | 'no_barcode' | 'new_product'>('list');
  const [noBarcodeName, setNoBarcodeName] = React.useState('');
  const [noBarcodeCost, setNoBarcodeCost] = React.useState<number>(0);
  const [noBarcodePrice, setNoBarcodePrice] = React.useState<number>(0);
  const [noBarcodeQty, setNoBarcodeQty] = React.useState<number>(1);

  const [newProdName, setNewProdName] = React.useState('');
  const [newProdBarcode, setNewProdBarcode] = React.useState('');
  const [newProdCost, setNewProdCost] = React.useState<number>(0);
  const [newProdPrice, setNewProdPrice] = React.useState<number>(0);
  const [newProdStock, setNewProdStock] = React.useState<number>(0);

  const [lastAddedFeedback, setLastAddedFeedback] = React.useState<string | null>(null);

  // Modals
  const [isAddSupplierOpen, setIsAddSupplierOpen] = React.useState(false);
  const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = React.useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = React.useState<PurchaseInvoice | null>(null);

  // Pay Supplier Debt State
  const [paySupplierTarget, setPaySupplierTarget] = React.useState<Supplier | null>(null);
  const [paySupplierAmount, setPaySupplierAmount] = React.useState<number>(0);
  const [paySupplierNote, setPaySupplierNote] = React.useState('');
  const [inlinePayAmount, setInlinePayAmount] = React.useState<number | ''>('');
  const [inlinePayFeedback, setInlinePayFeedback] = React.useState<string | null>(null);

  // Active Supplier Payment Receipt for Printing
  const [activeSupplierReceipt, setActiveSupplierReceipt] = React.useState<SupplierPaymentReceipt | null>(null);

  // Supplier Payments History State
  const [paymentsHistory, setPaymentsHistory] = React.useState<SupplierPaymentReceipt[]>(() => {
    try {
      const saved = localStorage.getItem('baran_pos_supplier_payments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Purchase Invoices History State
  const [purchaseInvoices, setPurchaseInvoices] = React.useState<PurchaseInvoice[]>(() => {
    if (propPurchaseInvoices && propPurchaseInvoices.length > 0) return propPurchaseInvoices;
    try {
      const saved = localStorage.getItem('baran_pos_purchase_invoices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return propPurchaseInvoices || [];
    }
  });

  // Sync state with props
  React.useEffect(() => {
    if (propPurchaseInvoices && propPurchaseInvoices.length > 0) {
      setPurchaseInvoices(propPurchaseInvoices);
    }
  }, [propPurchaseInvoices]);

  // Persist to LocalStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('baran_pos_purchase_invoices', JSON.stringify(purchaseInvoices));
    } catch {}
  }, [purchaseInvoices]);

  React.useEffect(() => {
    try {
      localStorage.setItem('baran_pos_supplier_payments', JSON.stringify(paymentsHistory));
    } catch {}
  }, [paymentsHistory]);

  // Form State for Add / Edit Supplier
  const [supName, setSupName] = React.useState('');
  const [supPhone, setSupPhone] = React.useState('');
  const [supAddress, setSupAddress] = React.useState('');
  const [supNotes, setSupNotes] = React.useState('');

  // Purchase Invoice Form State
  const [purchaseSupplierId, setPurchaseSupplierId] = React.useState(suppliers[0]?.id || '');
  const [purchaseSupplierInvoiceNo, setPurchaseSupplierInvoiceNo] = React.useState('');
  const [purchaseDate, setPurchaseDate] = React.useState('');
  const [purchaseItems, setPurchaseItems] = React.useState<PurchaseItemEntry[]>([]);
  const [amountPaid, setAmountPaid] = React.useState<number>(0);

  // Translation helper
  const t = (ku: string, en: string) => (lang === 'ku' ? ku : en);

  // Calculated KPI Totals
  const totalBalanceOwed = suppliers.reduce((sum, s) => sum + s.currentDebt, 0);
  const totalPurchasesSum = suppliers.reduce((sum, s) => sum + (s.totalPurchases || 0), 0);

  // Filtered Suppliers based on Search
  const filteredSuppliers = suppliers.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.companyName.toLowerCase().includes(q) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      (s.address && s.address.toLowerCase().includes(q)) ||
      s.phone.includes(q)
    );
  });

  // Current active supplier in detail view
  const currentDetailSupplier = selectedSupplierDetail
    ? suppliers.find((s) => s.id === selectedSupplierDetail.id) || selectedSupplierDetail
    : null;

  // Active supplier for new purchase invoice
  const activePurchaseSupplier = suppliers.find((s) => s.id === purchaseSupplierId) || currentDetailSupplier || suppliers[0];

  // Filtered Invoices for current selected supplier
  const supplierInvoices = currentDetailSupplier
    ? purchaseInvoices.filter((inv) => {
        const matchesSupplier = 
          inv.supplierId === currentDetailSupplier.id ||
          (inv.supplierName && currentDetailSupplier.companyName && inv.supplierName.trim().toLowerCase() === currentDetailSupplier.companyName.trim().toLowerCase());
        if (!matchesSupplier) return false;
        if (!invoiceSearch.trim()) return true;
        const q = invoiceSearch.toLowerCase();
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          (inv.supplierInvoiceNumber && inv.supplierInvoiceNumber.toLowerCase().includes(q)) ||
          inv.date.toLowerCase().includes(q) ||
          inv.items.some((it) => it.productName.toLowerCase().includes(q))
        );
      })
    : [];

  // Filtered Repayment History for current selected supplier
  const supplierPayments = currentDetailSupplier
    ? paymentsHistory.filter((p) => p.supplierId === currentDetailSupplier.id)
    : [];

  // Open Add Modal
  const handleOpenAddModal = () => {
    setSupName('');
    setSupPhone('');
    setSupAddress('');
    setSupNotes('');
    setIsAddSupplierOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (sup: Supplier, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingSupplier(sup);
    setSupName(sup.companyName);
    setSupPhone(sup.phone);
    setSupAddress(sup.address || '');
    setSupNotes(sup.notes || '');
  };

  // Save New Supplier
  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    const newSup: Supplier = {
      id: `sup_${Date.now()}`,
      companyName: supName.trim(),
      contactPerson: supName.trim(),
      phone: supPhone.trim() || '0750 000 0000',
      address: supAddress.trim() || '',
      notes: supNotes.trim() || '',
      currentDebt: 0,
      totalPurchases: 0,
    };

    onAddSupplier(newSup);
    setIsAddSupplierOpen(false);
  };

  // Save Edit Supplier
  const handleSaveEditSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !supName.trim()) return;

    const updated: Supplier = {
      ...editingSupplier,
      companyName: supName.trim(),
      contactPerson: supName.trim(),
      phone: supPhone.trim() || '0750 000 0000',
      address: supAddress.trim() || '',
      notes: supNotes.trim() || '',
    };

    if (onUpdateSupplier) {
      onUpdateSupplier(updated);
    }
    if (selectedSupplierDetail && selectedSupplierDetail.id === updated.id) {
      setSelectedSupplierDetail(updated);
    }
    setEditingSupplier(null);
  };

  // Delete Supplier
  const handleDelete = (sup: Supplier, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(t(`دڵنیایت لە سڕینەوەی دابینکەری "${sup.companyName}"؟`, `Delete supplier "${sup.companyName}"?`))) {
      if (onDeleteSupplier) {
        onDeleteSupplier(sup.id);
      }
      if (selectedSupplierDetail && selectedSupplierDetail.id === sup.id) {
        setSelectedSupplierDetail(null);
      }
    }
  };

  // Open New Purchase Invoice Full Page
  const handleOpenNewPurchaseModal = (supplierId?: string) => {
    setEditingInvoiceId(null);
    const targetSupId = supplierId || currentDetailSupplier?.id || suppliers[0]?.id || '';
    setPurchaseSupplierId(targetSupId);
    setPurchaseSupplierInvoiceNo('');
    setPurchaseDate('');
    setPurchaseItems([]);
    setAmountPaid(0);
    setPurchaseItemSearch('');
    setIsNewPurchaseOpen(true);
  };

  // Open Edit Purchase Invoice Full Page
  const handleOpenEditPurchaseModal = (invoice: PurchaseInvoice) => {
    setEditingInvoiceId(invoice.id);
    setPurchaseSupplierId(invoice.supplierId);
    setPurchaseSupplierInvoiceNo(invoice.supplierInvoiceNumber || '');
    
    // Extract or clean date
    const dateMatch = invoice.date.match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/);
    if (dateMatch) {
      setPurchaseDate(dateMatch[0].replace(/\//g, '-'));
    } else {
      setPurchaseDate('');
    }

    setPurchaseItems(
      invoice.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        barcode: products.find((p) => p.id === it.productId)?.barcode,
        qty: it.quantity,
        cost: it.unitCost,
        retailPrice: it.retailPrice !== undefined ? it.retailPrice : (products.find((p) => p.id === it.productId)?.retailPrice || 0),
      }))
    );
    setAmountPaid(invoice.amountPaid);
    setPurchaseItemSearch('');
    setIsNewPurchaseOpen(true);
  };

  // Add Product to Invoice (Keeps picker open for multi-item selection)
  const handleAddProductToInvoice = (p: Product) => {
    const existingIndex = purchaseItems.findIndex((it) => it.productId === p.id);
    if (existingIndex >= 0) {
      const next = [...purchaseItems];
      next[existingIndex].qty += 1;
      setPurchaseItems(next);
    } else {
      setPurchaseItems([
        ...purchaseItems,
        {
          productId: p.id,
          productName: p.nameKu || p.name,
          barcode: p.barcode,
          qty: 1,
          cost: p.costPrice || 0,
          retailPrice: p.retailPrice || (p.costPrice ? Math.round(p.costPrice * 1.25) : 0),
        },
      ]);
    }
    setLastAddedFeedback(p.nameKu || p.name);
    setTimeout(() => setLastAddedFeedback(null), 1400);
  };

  // Barcode Scanner & Enter Key Handler in Picker Search
  const handlePickerSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && pickerSearch.trim()) {
      e.preventDefault();
      const q = pickerSearch.trim().toLowerCase();
      const matched = products.find(
        (p) =>
          p.barcode === pickerSearch.trim() ||
          p.barcode?.toLowerCase() === q ||
          p.nameKu?.toLowerCase() === q ||
          p.name.toLowerCase() === q
      );
      if (matched) {
        handleAddProductToInvoice(matched);
        setPickerSearch('');
      }
    }
  };

  // Add Item Without Barcode
  const handleAddNoBarcodeItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noBarcodeName.trim()) return;

    const cost = noBarcodeCost || 0;
    const price = noBarcodePrice || (cost ? Math.round(cost * 1.25) : 0);
    const customItem: PurchaseItemEntry = {
      productId: `nb_${Date.now()}`,
      productName: noBarcodeName.trim(),
      barcode: undefined,
      qty: Math.max(1, noBarcodeQty || 1),
      cost: cost,
      retailPrice: price,
    };

    setPurchaseItems((prev) => [...prev, customItem]);
    setLastAddedFeedback(customItem.productName);
    setTimeout(() => setLastAddedFeedback(null), 1400);

    setNoBarcodeName('');
    setNoBarcodeCost(0);
    setNoBarcodePrice(0);
    setNoBarcodeQty(1);
    setPickerMode('list');
  };

  // Create New Product in Catalog & Add to Invoice
  const handleCreateNewProductAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const barcode = newProdBarcode.trim() || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`;
    const cost = newProdCost || 0;
    const retail = newProdPrice || (cost ? Math.round(cost * 1.3) : 0);
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      name: newProdName.trim(),
      nameKu: newProdName.trim(),
      barcode: barcode,
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      categoryId: 'cat_1',
      brandId: 'brd_1',
      itemTypeId: 'typ_1',
      costPrice: cost,
      retailPrice: retail,
      wholesalePrice: retail,
      stockQuantity: newProdStock || 0,
      unit: 'piece',
      minStockAlert: 10,
      isActive: true,
      image: getSampleImageForProduct(newProdName.trim()),
    };

    if (onAddProduct) {
      onAddProduct(newProduct);
    }

    const newItem: PurchaseItemEntry = {
      productId: newProduct.id,
      productName: newProduct.nameKu || newProduct.name,
      barcode: newProduct.barcode,
      qty: 1,
      cost: newProduct.costPrice,
      retailPrice: newProduct.retailPrice,
    };

    setPurchaseItems((prev) => [...prev, newItem]);
    setLastAddedFeedback(newItem.productName);
    setTimeout(() => setLastAddedFeedback(null), 1400);

    setNewProdName('');
    setNewProdBarcode('');
    setNewProdCost(0);
    setNewProdPrice(0);
    setNewProdStock(0);
    setPickerMode('list');
  };

  // Save Purchase Invoice (Create or Update)
  const handleSavePurchase = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const sup = suppliers.find((s) => s.id === purchaseSupplierId) || activePurchaseSupplier;
    if (!sup || purchaseItems.length === 0) return;

    const items = purchaseItems.map((pi) => {
      const prod = products.find((p) => p.id === pi.productId);
      return {
        productId: pi.productId,
        productName: pi.productName || prod?.nameKu || prod?.name || 'کاڵا',
        quantity: pi.qty,
        unitCost: pi.cost,
        retailPrice: pi.retailPrice,
        totalCost: pi.qty * pi.cost,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);
    const debtAmount = Math.max(0, totalAmount - amountPaid);
    const now = new Date();
    const formattedDate = purchaseDate
      ? `${purchaseDate} - ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
      : `${now.toLocaleDateString('ar-IQ')} - ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    if (editingInvoiceId) {
      // EDIT MODE: Update existing invoice
      const targetInvoice = purchaseInvoices.find((inv) => inv.id === editingInvoiceId);
      const oldDebt = targetInvoice ? targetInvoice.debtAmount : 0;
      const oldTotal = targetInvoice ? targetInvoice.totalAmount : 0;
      const diffDebt = debtAmount - oldDebt;
      const diffTotal = totalAmount - oldTotal;

      const updatedInvoice: PurchaseInvoice = {
        id: editingInvoiceId,
        invoiceNumber: targetInvoice?.invoiceNumber || `PUR-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        supplierInvoiceNumber: purchaseSupplierInvoiceNo.trim() || targetInvoice?.supplierInvoiceNumber || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        supplierId: sup.id,
        supplierName: sup.companyName,
        date: formattedDate,
        items,
        totalAmount,
        amountPaid,
        debtAmount,
        createdUser: targetInvoice?.createdUser || 'على محمد',
      };

      setPurchaseInvoices((prev) =>
        prev.map((inv) => (inv.id === editingInvoiceId ? updatedInvoice : inv))
      );

      // Adjust supplier balance and purchases
      if (onUpdateSupplier) {
        onUpdateSupplier({
          ...sup,
          currentDebt: Math.max(0, sup.currentDebt + diffDebt),
          totalPurchases: Math.max(0, (sup.totalPurchases || 0) + diffTotal),
        });
      }

      setEditingInvoiceId(null);
    } else {
      // CREATE MODE: Add new invoice
      const invoice: PurchaseInvoice = {
        id: `pur_${Date.now()}`,
        invoiceNumber: `PUR-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        supplierInvoiceNumber: purchaseSupplierInvoiceNo.trim() || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        supplierId: sup.id,
        supplierName: sup.companyName,
        date: formattedDate,
        items,
        totalAmount,
        amountPaid,
        debtAmount,
        createdUser: 'على محمد',
      };

      onCreatePurchaseInvoice(invoice);
      setPurchaseInvoices((prev) => [invoice, ...prev]);

      // Update total purchases & debt on supplier
      if (onUpdateSupplier) {
        onUpdateSupplier({
          ...sup,
          currentDebt: sup.currentDebt + debtAmount,
          totalPurchases: (sup.totalPurchases || 0) + totalAmount,
        });
      }
    }

    if (sup) {
      setSelectedSupplierDetail(sup);
      setDetailSubTab('invoices');
    }

    setIsNewPurchaseOpen(false);
    setPurchaseSupplierInvoiceNo('');
    setPurchaseItems([]);
  };

  // Confirm Debt Repayment
  const handleConfirmPaySupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySupplierTarget || paySupplierAmount <= 0) return;

    const remainingDebt = Math.max(0, paySupplierTarget.currentDebt - paySupplierAmount);
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('ar-IQ')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const receipt: SupplierPaymentReceipt = {
      id: `SPAY-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierId: paySupplierTarget.id,
      supplierName: paySupplierTarget.companyName,
      amount: paySupplierAmount,
      date: formattedDate,
      paidBy: 'على محمد',
      notes: paySupplierNote || (lang === 'ku' ? 'دانەوەی قەرزی دابینکەر' : 'Supplier debt repayment'),
      remainingDebt,
    };

    onPaySupplier(paySupplierTarget.id, paySupplierAmount);
    setPaymentsHistory((prev) => [receipt, ...prev]);
    setPaySupplierTarget(null);
    setPaySupplierAmount(0);
    setPaySupplierNote('');
    setActiveSupplierReceipt(receipt);
  };

  // Confirm Inline Debt Repayment from Tab 3 (matches media_1787657626962.png)
  const handleInlinePaySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentDetailSupplier) return;
    const payVal = typeof inlinePayAmount === 'number' ? inlinePayAmount : parseInt(String(inlinePayAmount)) || 0;
    if (payVal <= 0) return;

    const prevDebt = currentDetailSupplier.currentDebt;
    const remainingDebt = Math.max(0, prevDebt - payVal);
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('ar-IQ')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const receipt: SupplierPaymentReceipt = {
      id: `SPAY-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierId: currentDetailSupplier.id,
      supplierName: currentDetailSupplier.companyName,
      amount: payVal,
      date: formattedDate,
      paidBy: 'على محمد',
      notes: lang === 'ku' ? 'دانەوەی قەرزی دابینکەر' : 'Supplier debt repayment',
      previousDebt: prevDebt,
      remainingDebt,
    };

    onPaySupplier(currentDetailSupplier.id, payVal);
    setPaymentsHistory((prev) => [receipt, ...prev]);
    setInlinePayAmount('');
    setInlinePayFeedback(
      t(
        `بڕی ${formatCurrency(payVal, currency, lang, exchangeRate)} وەک دانەوەی قەرز بە سەرکەوتوویی تۆمارکرا.`,
        `Payment of ${formatCurrency(payVal, currency, lang, exchangeRate)} recorded.`
      )
    );
    setTimeout(() => setInlinePayFeedback(null), 4000);
  };

  // Computed Values for New Purchase View
  const purchaseItemsCount = purchaseItems.length;
  const purchaseTotalUnits = purchaseItems.reduce((sum, it) => sum + (it.qty || 0), 0);
  const purchaseGrandTotal = purchaseItems.reduce((sum, it) => sum + (it.qty || 0) * (it.cost || 0), 0);

  return (
    <div className="flex-1 bg-[#f8fafc] p-5 lg:p-6 flex flex-col overflow-hidden text-slate-900 font-sans select-none gap-4" dir={lang === 'ku' ? 'rtl' : 'ltr'}>
      
      {/* VIEW MODE 1: CREATE NEW PURCHASE INVOICE (Exact match to media_1787649198277.png) */}
      {isNewPurchaseOpen && activePurchaseSupplier ? (
        <div className="flex-1 flex flex-col overflow-hidden gap-4">
          
          {/* Top Bar: Title & Supplier on Right, Actions on Left (in RTL) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-white p-3.5 px-4 rounded-xl border border-slate-200/90 shadow-2xs">
            {/* Right in RTL: Title + Supplier Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0 font-black text-sm">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 leading-snug">
                  {editingInvoiceId ? t('دەستکاریکردنی وەصڵی کڕین', 'Edit Purchase Invoice') : t('وەصڵی نوێی کڕین', 'New Purchase Invoice')}
                </h1>
                <p className="text-xs text-indigo-600 font-bold">
                  {activePurchaseSupplier.companyName} {editingInvoiceId && `(${purchaseInvoices.find((i) => i.id === editingInvoiceId)?.invoiceNumber || ''})`}
                </p>
              </div>
            </div>

            {/* Left in RTL: Buttons: [گەڕانەوە] + [+ زیادکردنی کاڵا بۆ وەصڵ] */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsProductPickerOpen(true)}
                className="px-4 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm active:scale-98 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{t('زیادکردنی کاڵا بۆ وەصڵ', 'Add Product to Invoice')}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsNewPurchaseOpen(false)}
                className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <ArrowRight className="w-4 h-4 rtl:rotate-0 rotate-180" />
                <span>{t('گەڕانەوە', 'Back')}</span>
              </button>
            </div>
          </div>

          {/* Main 2-Column Split Layout (Items Area on Right, Summary Sidebar on Left in RTL) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden min-h-0">
            
            {/* Right Column in RTL / Items Area (8 cols on lg) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col overflow-hidden min-h-0">
              
              {/* Search Bar at Top matching screenshot */}
              <div className="relative w-full mb-3 shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('گەڕان لە ناو کاڵاکانی وەصڵ...', 'Search inside invoice items...')}
                  value={purchaseItemSearch}
                  onChange={(e) => setPurchaseItemSearch(e.target.value)}
                  className="w-full h-10 bg-white border border-slate-200/90 pl-10 rtl:pl-3.5 pr-3.5 rtl:pr-10 text-xs text-slate-900 placeholder-slate-400 font-sans rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs transition-all"
                />
              </div>

              {/* Main Content: Empty State vs Items Table */}
              <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
                {purchaseItems.length === 0 ? (
                  /* Empty State (Exact match to media_1787649198277.png) */
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                      <Package className="w-7 h-7 stroke-[1.5]" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-black text-sm text-slate-800">
                        {t('وەصڵەکە بەتاڵە', 'The invoice is empty')}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {t('بارکۆد سکان بکە یان دوگمەی «زیادکردنی کاڵا» دابگرە', 'Scan barcode or click "Add Product" button')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsProductPickerOpen(true)}
                      className="mt-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>{t('زیادکردنی کاڵا', 'Add Product')}</span>
                    </button>
                  </div>
                ) : (
                  /* Table of Added Items with Sticky Header and Smooth Scrollable Body */
                  <div className="flex-1 overflow-y-auto border border-slate-200/90 rounded-xl shadow-2xs min-h-0">
                    <table className="w-full text-xs text-start border-collapse">
                      <thead className="bg-[#f1f5f9] text-slate-700 font-bold border-b border-slate-300 text-[11px] sticky top-0 z-10 shadow-2xs">
                        <tr className="divide-x rtl:divide-x-reverse divide-slate-200">
                          <th className="py-2.5 px-3 text-start font-bold">{t('ناوی کاڵا', 'Product Name')}</th>
                          <th className="py-2.5 px-3 text-center font-bold w-28">{t('تێچووی کڕین (IQD)', 'Unit Cost')}</th>
                          <th className="py-2.5 px-3 text-center font-bold w-28 text-emerald-700 bg-emerald-50/50">{t('نرخی فرۆشتن (IQD)', 'Selling Price')}</th>
                          <th className="py-2.5 px-3 text-center font-bold w-28">{t('بڕ (دانە)', 'Quantity')}</th>
                          <th className="py-2.5 px-3 text-center font-bold w-28">{t('کۆی گشتی کڕین', 'Total')}</th>
                          <th className="py-2.5 px-2 text-center font-bold w-12">{t('کردار', 'Action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 font-sans">
                        {purchaseItems
                          .filter((it) => {
                            if (!purchaseItemSearch.trim()) return true;
                            return it.productName.toLowerCase().includes(purchaseItemSearch.toLowerCase());
                          })
                          .map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50 divide-x rtl:divide-x-reverse divide-slate-200/50 transition-colors">
                              {/* Product Name */}
                              <td className="py-2 px-3">
                                <span className="font-bold text-slate-900 block text-xs leading-tight">{item.productName}</span>
                                {item.barcode && (
                                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{item.barcode}</span>
                                )}
                              </td>

                              {/* Unit Cost */}
                              <td className="py-2 px-2 text-center">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={item.cost === 0 ? '' : item.cost}
                                  onChange={(e) => {
                                    const next = [...purchaseItems];
                                    const realIdx = purchaseItems.indexOf(item);
                                    if (realIdx >= 0) {
                                      next[realIdx].cost = parseInt(e.target.value) || 0;
                                      setPurchaseItems(next);
                                    }
                                  }}
                                  className="w-full h-8 bg-white border border-slate-300 rounded-lg px-2 text-xs font-mono font-bold text-center outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                                />
                              </td>

                              {/* Retail / Selling Price */}
                              <td className="py-2 px-2 text-center">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={item.retailPrice === 0 ? '' : item.retailPrice}
                                  onChange={(e) => {
                                    const next = [...purchaseItems];
                                    const realIdx = purchaseItems.indexOf(item);
                                    if (realIdx >= 0) {
                                      next[realIdx].retailPrice = parseInt(e.target.value) || 0;
                                      setPurchaseItems(next);
                                    }
                                  }}
                                  className="w-full h-8 bg-emerald-50/30 border border-emerald-300 focus:border-emerald-600 rounded-lg px-2 text-xs font-mono font-black text-center text-emerald-700 outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                                  title={t('نرخی فرۆشتن لە بەشی POS', 'Selling Price for POS')}
                                />
                              </td>

                              {/* Quantity Stepper */}
                              <td className="py-2 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...purchaseItems];
                                      const realIdx = purchaseItems.indexOf(item);
                                      if (realIdx >= 0) {
                                        next[realIdx].qty = Math.max(1, (next[realIdx].qty || 1) - 1);
                                        setPurchaseItems(next);
                                      }
                                    }}
                                    className="w-6 h-6 bg-slate-100 hover:bg-slate-200 rounded-md font-bold text-slate-700 flex items-center justify-center cursor-pointer active:scale-95 transition-all text-xs"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    value={item.qty === 0 ? '' : item.qty}
                                    onChange={(e) => {
                                      const next = [...purchaseItems];
                                      const realIdx = purchaseItems.indexOf(item);
                                      if (realIdx >= 0) {
                                        next[realIdx].qty = parseInt(e.target.value) || 0;
                                        setPurchaseItems(next);
                                      }
                                    }}
                                    className="w-12 h-7 bg-white border border-slate-300 rounded-md text-xs font-mono font-bold text-center outline-none focus:border-indigo-500 shadow-2xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...purchaseItems];
                                      const realIdx = purchaseItems.indexOf(item);
                                      if (realIdx >= 0) {
                                        next[realIdx].qty = (next[realIdx].qty || 0) + 1;
                                        setPurchaseItems(next);
                                      }
                                    }}
                                    className="w-6 h-6 bg-slate-100 hover:bg-slate-200 rounded-md font-bold text-slate-700 flex items-center justify-center cursor-pointer active:scale-95 transition-all text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>

                              {/* Line Total */}
                              <td className="py-2 px-3 text-center font-mono font-black text-indigo-600 text-xs">
                                {formatCurrency(item.qty * item.cost, currency, lang, exchangeRate)}
                              </td>

                              {/* Delete Item */}
                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPurchaseItems(purchaseItems.filter((it) => it !== item));
                                  }}
                                  className="w-7 h-7 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                                  title={t('سڕینەوە', 'Delete')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Left Column in RTL / Summary Sidebar (4 cols on lg) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                
                {/* Header: پوختەی وەصڵ */}
                <div className="flex items-center gap-2 text-slate-700 border-b border-slate-100 pb-3">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-xs">{t('پوختەی وەصڵ', 'Invoice Summary')}</span>
                </div>

                {/* Field 1: ژمارەی وەصڵ * */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    {t('ژمارەی وەصڵ', 'Invoice Number')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t('ژمارەی وەصڵ بنووسە...', 'Enter invoice number...')}
                    value={purchaseSupplierInvoiceNo}
                    onChange={(e) => setPurchaseSupplierInvoiceNo(e.target.value)}
                    className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-2xs font-mono"
                  />
                </div>

                {/* Field 2: بەرواری وەصڵ * */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    {t('بەرواری وەصڵ', 'Invoice Date')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-2xs font-mono"
                  />
                </div>

                {/* KPI Summary Grid (2 Cards: ژمارەی کاڵاکان & کۆی دانەکان) */}
                <div className="grid grid-cols-2 gap-3">
                  {/* ژمارەی کاڵاکان */}
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-center space-y-0.5">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      {t('ژمارەی کاڵاکان', 'Items Count')}
                    </span>
                    <span className="text-xl font-black font-mono text-indigo-600 block">
                      {purchaseItemsCount}
                    </span>
                  </div>

                  {/* کۆی دانەکان */}
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-center space-y-0.5">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      {t('کۆی دانەکان', 'Total Units')}
                    </span>
                    <span className="text-xl font-black font-mono text-emerald-600 block">
                      {purchaseTotalUnits}
                    </span>
                  </div>
                </div>

                {/* Grand Total Box (کۆی گشتیی وەصڵ) */}
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-5 text-center space-y-1">
                  <span className="text-xs font-bold text-indigo-700 block">
                    {t('کۆی گشتیی وەصڵ', 'Grand Total')}
                  </span>
                  <span className="text-2xl font-black font-mono text-indigo-600 block">
                    {purchaseGrandTotal === 0 ? '0' : formatCurrency(purchaseGrandTotal, currency, lang, exchangeRate)}
                  </span>
                </div>

                {/* Field 3: پارەی دراو کاش: */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    {t('پارەی دراو کاش:', 'Cash Paid Amount:')}
                  </label>
                  <input
                    type="number"
                    placeholder={t('بەتاڵ = هەمووی قەرز', 'Empty = Full Debt')}
                    value={amountPaid === 0 ? '' : amountPaid}
                    onChange={(e) => setAmountPaid(parseInt(e.target.value) || 0)}
                    className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSavePurchase}
                  disabled={purchaseItems.length === 0}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                    purchaseItems.length > 0
                      ? 'bg-[#4f46e5] hover:bg-[#4338ca] text-white active:scale-98'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {editingInvoiceId
                      ? t('پاشەکەوتکردنی گۆڕانکارییەکان', 'Save Changes')
                      : t('تۆمارکردنی وەصڵ', 'Save Invoice')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : currentDetailSupplier ? (
        /* VIEW MODE 2: SUPPLIER PROFILE & DETAILED INVOICES VIEW (Matches media_1787607519638.png) */
        <div className="flex-1 flex flex-col overflow-hidden gap-4">
          
          {/* Top Bar: Title on right, 3 Sub-Tabs in middle, Back Button on left */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-white p-3.5 px-4 rounded-xl border border-slate-200/90 shadow-2xs">
            
            {/* Right in RTL: Supplier Name & Profile Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0 font-black text-sm">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm md:text-base font-black text-slate-900 leading-snug">
                  {currentDetailSupplier.companyName}
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  {t('پرۆفایلی دابینکەر و تۆماری کڕین و قەرزەکان', 'Supplier profile, purchase invoices & debt records')}
                </p>
              </div>
            </div>

            {/* Middle in RTL: 3 Sub-Tabs matching screenshot */}
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
              {/* Tab 1: وەصڵەکانی کڕین */}
              <button
                type="button"
                onClick={() => setDetailSubTab('invoices')}
                className={`px-3.5 py-1.5 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  detailSubTab === 'invoices'
                    ? 'bg-[#4f46e5] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{t('وەصڵەکانی کڕین', 'Purchase Invoices')}</span>
              </button>

              {/* Tab 2: مێژووی وەصڵەکان (x) */}
              <button
                type="button"
                onClick={() => setDetailSubTab('history')}
                className={`px-3.5 py-1.5 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  detailSubTab === 'history'
                    ? 'bg-[#4f46e5] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t(`مێژووی وەصڵەکان (${supplierPayments.length})`, `Payment History (${supplierPayments.length})`)}</span>
              </button>

              {/* Tab 3: دانەوەی قەرز (Matches media_1787657626962.png) */}
              <button
                type="button"
                onClick={() => setDetailSubTab('pay_debt')}
                className={`px-3.5 py-1.5 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  detailSubTab === 'pay_debt'
                    ? 'bg-[#059669] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{t('دانەوەی قەرز', 'Pay Debt')}</span>
              </button>
            </div>

            {/* Left in RTL: Back Button (گەڕانەوە ➔) */}
            <div>
              <button
                type="button"
                onClick={() => setSelectedSupplierDetail(null)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <ArrowRight className="w-4 h-4 rtl:rotate-0 rotate-180" />
                <span>{t('گەڕانەوە', 'Back')}</span>
              </button>
            </div>
          </div>

          {/* Top 3 KPI Cards for Supplier matching screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 shrink-0">
            {/* Card 1 (Right in RTL): Total Purchases */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-500 block">
                  {t('سەرجەمی کڕینەکان', 'Total Purchases')}
                </span>
                <span className="text-base font-black font-mono text-emerald-600 block">
                  {formatCurrency(currentDetailSupplier.totalPurchases || 0, currency, lang, exchangeRate)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2 (Middle in RTL): Total Balance Owed */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-500 block">
                  {t('کۆی قەرزی سەر ئێمە', 'Total Payables / Debt')}
                </span>
                <span className="text-base font-black font-mono text-rose-600 block">
                  {formatCurrency(currentDetailSupplier.currentDebt, currency, lang, exchangeRate)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3 (Left in RTL): Phone & Contact */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-500 block">
                  {t('پەیوەندی و ناونیشان', 'Contact & Address')}
                </span>
                <span className="text-sm font-black font-mono text-slate-900 block">
                  {currentDetailSupplier.phone || '0750 000 0000'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Sub-Tab 1 Content: Invoices Table */}
          {detailSubTab === 'invoices' && (
            <div className="flex-1 flex flex-col overflow-hidden gap-3">
              {/* Search Bar on Right and Add Invoice Button on Left in RTL */}
              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                {/* Search Bar on Right in RTL */}
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={t('کۆدی وەصڵ، بەروار یان ناوی کاڵا بنووسە بۆ گەڕان...', 'Search by invoice code, date or item name...')}
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="w-full h-10 bg-white border border-slate-200/90 pl-10 rtl:pl-3.5 pr-3.5 rtl:pr-10 text-xs text-slate-900 placeholder-slate-400 font-sans rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs transition-all"
                  />
                  {invoiceSearch && (
                    <button
                      type="button"
                      onClick={() => setInvoiceSearch('')}
                      className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* + تۆمارکردنی وەصڵی نوێی کڕین Button on Left in RTL */}
                <button
                  type="button"
                  onClick={() => handleOpenNewPurchaseModal(currentDetailSupplier.id)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-98 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{t('تۆمارکردنی وەصڵی نوێی کڕین', 'Add Purchase Invoice')}</span>
                </button>
              </div>

              {/* Data Table: Invoices Table with Zebra Striping (Exact Match to media_1787607740645.png) */}
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-xs text-start border-collapse">
                    <thead className="bg-[#f1f5f9] text-slate-700 font-bold border-b border-slate-300 sticky top-0 z-10 text-[11px] shadow-2xs">
                      <tr className="divide-x rtl:divide-x-reverse divide-slate-200/80">
                        <th className="p-3.5 text-center font-bold tracking-wide">{t('کۆدی وەصڵ', 'Invoice Code')}</th>
                        <th className="p-3.5 text-center font-bold tracking-wide">{t('ژمارەی وەصڵی دابینکەر', 'Supplier Invoice #')}</th>
                        <th className="p-3.5 text-center font-bold tracking-wide">{t('بەروار', 'Date')}</th>
                        <th className="p-3.5 text-center font-bold tracking-wide">{t('ژمارەی کاڵا', 'Items Count')}</th>
                        <th className="p-3.5 text-center font-bold tracking-wide">{t('کۆی گشتیی وەصڵ', 'Total Amount')}</th>
                        <th className="p-3.5 text-center font-bold tracking-wide">{t('پارەی دراو', 'Paid Amount')}</th>
                        <th className="p-3.5 text-center font-bold tracking-wide">{t('قەرزی ماوە', 'Remaining Debt')}</th>
                        <th className="p-3.5 text-center font-bold tracking-wide">{t('کردارەکان', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 font-sans">
                      {supplierInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-12 text-center text-slate-400 space-y-2">
                            <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                            <p className="text-xs font-bold">{t('هیچ وەصڵێکی کڕین نەدۆزرایەوە', 'No purchase invoices found')}</p>
                          </td>
                        </tr>
                      ) : (
                        supplierInvoices.map((inv, index) => {
                          const isEven = index % 2 === 0;
                          const rowBg = isEven ? 'bg-white' : 'bg-[#f8fafc]';

                          return (
                            <tr
                              key={inv.id}
                              className={`${rowBg} hover:bg-indigo-50/40 transition-colors divide-x rtl:divide-x-reverse divide-slate-200/60`}
                            >
                              {/* 1. کۆدی وەصڵ */}
                              <td className="p-3.5 text-center font-mono font-black text-[#4f46e5] text-xs">
                                {inv.invoiceNumber}
                              </td>

                              {/* 2. ژمارەی وەصڵی دابینکەر */}
                              <td className="p-3.5 text-center font-mono font-bold text-slate-800 text-xs">
                                {inv.supplierInvoiceNumber || '-'}
                              </td>

                              {/* 3. بەروار */}
                              <td className="p-3.5 text-center text-slate-700 text-xs font-sans whitespace-nowrap">
                                {inv.date}
                              </td>

                              {/* 4. ژمارەی کاڵا */}
                              <td className="p-3.5 text-center font-bold text-slate-800 text-xs">
                                {inv.items.length} {t('کاڵا', 'items')}
                              </td>

                              {/* 5. کۆی گشتیی وەصڵ */}
                              <td className="p-3.5 text-center font-mono font-black text-slate-900 text-xs">
                                {formatCurrency(inv.totalAmount, currency, lang, exchangeRate)}
                              </td>

                              {/* 6. پارەی دراو */}
                              <td className="p-3.5 text-center font-mono font-black text-emerald-600 text-xs">
                                {formatCurrency(inv.amountPaid, currency, lang, exchangeRate)}
                              </td>

                              {/* 7. قەرزی ماوە */}
                              <td className="p-3.5 text-center font-mono font-black text-rose-600 text-xs">
                                {formatCurrency(inv.debtAmount, currency, lang, exchangeRate)}
                              </td>

                              {/* 8. کردارەکان: [بینین 👁] + [دەستکاری ✏] matching media_1787607740645.png */}
                              <td className="p-3.5 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-2">
                                  {/* بینین Button */}
                                  <button
                                    type="button"
                                    onClick={() => setViewingInvoice(inv)}
                                    className="px-3 py-1.5 bg-[#e0e7ff]/80 hover:bg-[#c7d2fe] text-[#4338ca] font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{t('بینین', 'View')}</span>
                                  </button>

                                  {/* دەستکاری Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditPurchaseModal(inv)}
                                    className="px-3 py-1.5 bg-[#fef3c7] hover:bg-[#fde68a] text-[#d97706] font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>{t('دەستکاری', 'Edit')}</span>
                                  </button>
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
            </div>
          )}

          {/* Sub-Tab 2 Content: Repayment Receipts History */}
          {detailSubTab === 'history' && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex-1 flex flex-col min-h-0">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                <span>{t('مێژووی دانەوەی قەرز و وەصڵەکان', 'Payment & Debt Receipts History')}</span>
                <span className="text-[11px] font-mono text-slate-500">
                  {supplierPayments.length} {t('وەصڵ', 'receipts')}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-xs text-start border-collapse">
                  <thead className="bg-[#f1f5f9] text-slate-700 font-bold border-b border-slate-300 sticky top-0">
                    <tr className="divide-x rtl:divide-x-reverse divide-slate-200/80">
                      <th className="p-3 text-start">{t('کۆدی وەصڵ', 'Receipt #')}</th>
                      <th className="p-3 text-start">{t('بەروار', 'Date')}</th>
                      <th className="p-3 text-center">{t('بڕی پارەی دراو', 'Amount Paid')}</th>
                      <th className="p-3 text-center">{t('قەرزی ماوە', 'Remaining Debt')}</th>
                      <th className="p-3 text-start">{t('پارەدەری پسوڵە', 'Paid By')}</th>
                      <th className="p-3 text-start">{t('تێبینی', 'Notes')}</th>
                      <th className="p-3 text-center">{t('چاپکردن', 'Print')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-xs">
                    {supplierPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-400 font-sans">
                          {t('هیچ مێژوویەکی دانەوەی قەرز تۆمار نەکراوە.', 'No debt repayment history recorded.')}
                        </td>
                      </tr>
                    ) : (
                      supplierPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 divide-x rtl:divide-x-reverse divide-slate-200/50">
                          <td className="p-3 font-bold text-indigo-600">{p.id}</td>
                          <td className="p-3 text-slate-500 font-sans text-[11px]">{p.date}</td>
                          <td className="p-3 text-center font-bold text-emerald-600">
                            {formatCurrency(p.amount, currency, lang, exchangeRate)}
                          </td>
                          <td className="p-3 text-center font-bold text-rose-600">
                            {formatCurrency(p.remainingDebt, currency, lang, exchangeRate)}
                          </td>
                          <td className="p-3 text-slate-800 font-sans">{p.paidBy}</td>
                          <td className="p-3 text-slate-600 font-sans">{p.notes || '-'}</td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setActiveSupplierReceipt(p)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                              title={t('چاپکردنی وەصڵ', 'Print')}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-Tab 3 Content: Debt Repayment View (Exact Match to media_1787657626962.png) */}
          {detailSubTab === 'pay_debt' && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden min-h-0">
              
              {/* Right Column in RTL: تۆمارکردنی دانەوەی قەرز بۆ دابینکەر */}
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  {/* Card Header matching screenshot */}
                  <div className="flex items-center gap-2 pb-2">
                    <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                    <h3 className="font-black text-sm text-slate-800">
                      {t('تۆمارکردنی دانەوەی قەرز بۆ دابینکەر', 'Register Debt Repayment to Supplier')}
                    </h3>
                  </div>

                  {/* Feedback Toast if just paid */}
                  {inlinePayFeedback && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{inlinePayFeedback}</span>
                    </div>
                  )}

                  {/* Pink/Rose Summary Banner (کۆی قەرزی ماوە) */}
                  <div className="bg-[#fff1f2] border border-rose-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                    <span className="text-xs font-bold text-slate-700">
                      {t('کۆی قەرزی ماوە:', 'Remaining Debt:')}
                    </span>
                    <span className="text-2xl font-black font-mono text-[#e11d48]">
                      IQD {currentDetailSupplier.currentDebt.toLocaleString()}
                    </span>
                  </div>

                  {/* Repayment Form */}
                  <form onSubmit={handleInlinePaySubmit} className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        {t('بڕی پارەی دراو:', 'Paid Amount:')}
                      </label>
                      <input
                        type="number"
                        placeholder={t('بڕی پارە بە دینار بنووسە...', 'Enter amount in IQD...')}
                        value={inlinePayAmount}
                        onChange={(e) => setInlinePayAmount(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        className="w-full h-11 bg-white border border-slate-200 hover:border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-3.5 text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 outline-none shadow-2xs transition-all"
                      />
                    </div>
                  </form>
                </div>

                {/* Full Width Green Action Button matching screenshot */}
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleInlinePaySubmit}
                    disabled={!inlinePayAmount || Number(inlinePayAmount) <= 0}
                    className={`w-full py-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                      inlinePayAmount && Number(inlinePayAmount) > 0
                        ? 'bg-[#059669] hover:bg-[#047857] active:scale-[0.98] text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('تۆمارکردنی دانەوەی قەرز', 'Register Debt Repayment')}</span>
                  </button>
                </div>
              </div>

              {/* Left Column in RTL: مێژووی دانەوەی قەرزەکان */}
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col min-h-0">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <h3 className="font-black text-sm text-slate-800">
                    {t('مێژووی دانەوەی قەرزەکان', 'Debt Repayment History')}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">
                    {supplierPayments.length} {t('تۆمار', 'records')}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                  <table className="w-full text-xs text-start border-collapse">
                    <thead className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200 text-[11px] sticky top-0 z-10 shadow-2xs">
                      <tr className="divide-x rtl:divide-x-reverse divide-slate-200/80">
                        <th className="py-2.5 px-3 text-start">{t('بەروار', 'Date')}</th>
                        <th className="py-2.5 px-3 text-center">{t('بڕی پارەی دراو', 'Amount Paid')}</th>
                        <th className="py-2.5 px-3 text-center">{t('قەرزی پێشوو', 'Previous Debt')}</th>
                        <th className="py-2.5 px-3 text-center">{t('قەرزی نوێ', 'New Debt')}</th>
                        <th className="py-2.5 px-3 text-center">{t('جۆر', 'Type')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans text-xs">
                      {supplierPayments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-14 text-center text-slate-400 font-bold">
                            {t('هیچ تۆمارێکی دانەوەی قەرز تۆمارنەکراوە بۆ ئەم دابینکەرە', 'No debt repayment history recorded for this supplier')}
                          </td>
                        </tr>
                      ) : (
                        supplierPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50 divide-x rtl:divide-x-reverse divide-slate-100 transition-colors">
                            <td className="py-3 px-3 text-slate-700 font-medium text-[11px] whitespace-nowrap font-mono">
                              {p.date}
                            </td>
                            <td className="py-3 px-3 text-center font-black font-mono text-emerald-600">
                              {formatCurrency(p.amount, currency, lang, exchangeRate)}
                            </td>
                            <td className="py-3 px-3 text-center font-bold font-mono text-slate-500">
                              {formatCurrency(p.previousDebt ?? (p.remainingDebt + p.amount), currency, lang, exchangeRate)}
                            </td>
                            <td className="py-3 px-3 text-center font-black font-mono text-rose-600">
                              {formatCurrency(p.remainingDebt, currency, lang, exchangeRate)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                {t('کاش', 'Cash')}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      ) : (
        /* VIEW MODE 3: SUPPLIERS GRID OF CARDS (Matches media_1787606960836.png) */
        <div className="flex-1 flex flex-col overflow-hidden gap-4">
          
          {/* Top Header Row matching Screenshot */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            
            {/* Title on Right in RTL */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 leading-snug">
                  {t('بەڕێوەبردنی دابینکەران', 'Supplier Management')}
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  {t('تۆماری کۆمپانیاکان و دابینکەرانی پەراوگە', 'Directory of stationery suppliers, purchases & payable debts')}
                </p>
              </div>
            </div>

            {/* Action Button: + زیادکردنی دابینکەر (Left in RTL) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-4 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{t('زیادکردنی دابینکەر', 'Add Supplier')}</span>
              </button>
            </div>
          </div>

          {/* 3 Summary KPI Cards Matching the Screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 shrink-0">
            
            {/* Card 1 (Right in RTL): Total Suppliers (سەرجەمی دابینکەران) */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-500 block">
                  {t('سەرجەمی دابینکەران', 'Total Suppliers')}
                </span>
                <span className="text-base font-black font-mono text-slate-900 block">
                  {suppliers.length} {t('کۆمپانیا', 'Companies')}
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2 (Middle in RTL): Total Debt (کۆی قەرزی سەر ئێمە) */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-500 block">
                  {t('کۆی قەرزی سەر ئێمە', 'Total Payables / Debt')}
                </span>
                <span className="text-base font-black font-mono text-rose-600 block">
                  {formatCurrency(totalBalanceOwed, currency, lang, exchangeRate)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3 (Left in RTL): Total Purchases (کۆی گشتیی کڕینەکان) */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-500 block">
                  {t('کۆی گشتیی کڕینەکان', 'Total Purchases')}
                </span>
                <span className="text-base font-black font-mono text-emerald-600 block">
                  {formatCurrency(totalPurchasesSum, currency, lang, exchangeRate)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search Bar matching the exact design */}
          <div className="relative w-full shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={t('گەڕان بەدوای دابینکەر یان ژمارەی مۆبایل...', 'Search by supplier name or phone number...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 bg-white border border-slate-200/90 pl-10 rtl:pl-3.5 pr-3.5 rtl:pr-10 text-xs text-slate-900 placeholder-slate-400 font-sans rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Grid of Supplier Cards (3 cols on lg, 2 on md, 1 on sm) */}
          <div className="flex-1 overflow-y-auto">
            {filteredSuppliers.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 space-y-2 shadow-2xs">
                <Store className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                <p className="text-xs font-bold">{t('هیچ دابینکەرێک نەدۆزرایەوە', 'No suppliers found')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredSuppliers.map((sup) => {
                  const firstLetter = sup.companyName.trim().charAt(0) || 'ک';
                  const isClean = sup.currentDebt === 0;

                  return (
                    <div
                      key={sup.id}
                      onClick={() => {
                        setSelectedSupplierDetail(sup);
                        setDetailSubTab('invoices');
                      }}
                      className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                      {/* Top Row: Info + Actions */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          
                          {/* Left Actions in RTL (Edit / Delete) */}
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditModal(sup, e)}
                              className="px-2 py-1 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-600 font-bold text-[11px] rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{t('دەستکاری', 'Edit')}</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => handleDelete(sup, e)}
                              className="p-1 bg-rose-50/70 hover:bg-rose-100 border border-rose-200/80 text-rose-500 hover:text-rose-700 rounded-md transition-colors cursor-pointer shadow-2xs"
                              title={t('سڕینەوە', 'Delete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Right Details in RTL (Avatar + Name + Phone + Address) */}
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="min-w-0 text-end rtl:text-right">
                              <h3 className="font-black text-xs md:text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate" title={sup.companyName}>
                                {sup.companyName}
                              </h3>
                              <div className="flex items-center justify-end gap-2 text-[10px] text-slate-500 mt-1 flex-wrap font-medium">
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone className="w-3 h-3 text-indigo-500 shrink-0" />
                                  <span>{sup.phone}</span>
                                </span>
                                {sup.address && (
                                  <span className="flex items-center gap-1 truncate max-w-[140px]" title={sup.address}>
                                    <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                                    <span>{sup.address}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Avatar Letter Badge */}
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 font-black text-sm flex items-center justify-center shrink-0">
                              {firstLetter}
                            </div>
                          </div>
                        </div>

                        {/* Middle Financial Summary Row */}
                        <div className="mt-3.5 pt-2.5 pb-2 border-t border-slate-100 flex items-center justify-between">
                          {/* Left in RTL: قەرزی سەرمان */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 block">
                              {t('قەرزی سەرمان', 'Payable Debt')}
                            </span>
                            {isClean ? (
                              <span className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] px-2.5 py-0.5 rounded-md shadow-2xs">
                                {t('سافییە', 'Clean / Paid')}
                              </span>
                            ) : (
                              <span className="inline-block bg-rose-50/70 border border-rose-200/90 text-rose-600 font-mono font-black text-xs px-2.5 py-0.5 rounded-md shadow-2xs">
                                {formatCurrency(sup.currentDebt, currency, lang, exchangeRate)}
                              </span>
                            )}
                          </div>

                          {/* Right in RTL: کۆی کڕینەکان */}
                          <div className="space-y-1 text-end rtl:text-right">
                            <span className="text-[10px] font-bold text-slate-400 block">
                              {t('کۆی کڕینەکان', 'Total Purchases')}
                            </span>
                            <span className="text-xs font-black font-mono text-slate-900 block">
                              {formatCurrency(sup.totalPurchases || 0, currency, lang, exchangeRate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Footer Row: پرۆفایل و تۆماری وەصڵەکان */}
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-indigo-600 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                          <ChevronLeft className="w-4 h-4 rtl:block hidden" />
                          <ChevronRight className="w-4 h-4 rtl:hidden block" />
                        </div>
                        <div className="text-indigo-600 font-bold text-[11px] flex items-center gap-1.5">
                          <span>{t('پرۆفایل و تۆماری وەصڵەکان', 'Profile & Invoices')}</span>
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Product Picker Modal (Exact match to media_1787652745999.png) */}
      {isProductPickerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div
            className="bg-white border border-slate-200/90 w-full max-w-lg p-5 space-y-4 shadow-2xl rounded-2xl max-h-[90vh] flex flex-col relative"
            dir={lang === 'ku' ? 'rtl' : 'ltr'}
          >
            {/* Added Toast Notification Banner */}
            {lastAddedFeedback && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-30 animate-bounce">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>«{lastAddedFeedback}» {t('زیادکرا بۆ وەصڵەکە', 'added to invoice')}</span>
              </div>
            )}

            {/* Header matching media_1787652745999.png */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              {/* Right in RTL: Icon + Title + Subtitle */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Package className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="font-black text-sm md:text-base text-slate-900 leading-snug">
                    {t('زیادکردنی کاڵا بۆ وەصڵ', 'Add Product to Invoice')}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {t('بارکۆد سکان بکە یان کاڵای نوێ تۆمار بکە (پیشاندانی تەنها ١٠ کاڵا)', 'Scan barcode or register new item (Showing top 10 items)')}
                  </p>
                </div>
              </div>

              {/* Left in RTL: Close Button (X) */}
              <button
                type="button"
                onClick={() => {
                  setIsProductPickerOpen(false);
                  setPickerMode('list');
                }}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pickerMode === 'list' && (
              <>
                {/* 2 Quick Action Buttons on Top (Right: + زیادکردنی کاڵا بەبێ بارکۆد, Left: + دروستکردنی کاڵای نوێ) */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Button 1 (Right in RTL): + زیادکردنی کاڵا بەبێ بارکۆد (Yellow theme) */}
                  <button
                    type="button"
                    onClick={() => setPickerMode('no_barcode')}
                    className="w-full py-2.5 px-3 bg-[#fef9c3] hover:bg-[#fef08a] border border-[#fde047] text-[#a16207] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>{t('زیادکردنی کاڵا بەبێ بارکۆد', 'Add item without barcode')}</span>
                  </button>

                  {/* Button 2 (Left in RTL): + دروستکردنی کاڵای نوێ (Green theme) */}
                  <button
                    type="button"
                    onClick={() => setPickerMode('new_product')}
                    className="w-full py-2.5 px-3 bg-[#f0fdf4] hover:bg-[#dcfce7] border border-[#bbf7d0] text-[#15803d] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>{t('دروستکردنی کاڵای نوێ', 'Create new product')}</span>
                  </button>
                </div>

                {/* Search Bar with prominent blue/purple border */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={t('بارکۆد سکان بکە یان ناوی کاڵا لە کۆگا بنووسە...', 'Scan barcode or write product name from warehouse...')}
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    onKeyDown={handlePickerSearchKeyDown}
                    className="w-full h-11 bg-white border-2 border-indigo-500 rounded-xl pl-10 rtl:pl-3.5 pr-3.5 rtl:pr-10 text-xs text-slate-900 placeholder-slate-400 font-sans outline-none focus:ring-2 focus:ring-indigo-300 shadow-2xs"
                    autoFocus
                  />
                  {pickerSearch && (
                    <button
                      type="button"
                      onClick={() => setPickerSearch('')}
                      className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Subtitle Caption */}
                <div className="text-center text-[11px] text-slate-500 font-bold">
                  {t('کاڵاکانی کۆگا (تەنها ١٠ دانە پیشان دەدرێت — بۆ کاڵاکانی تر بارکۆد سکان بکە)', 'Warehouse products (Top 10 displayed — scan barcode for others)')}
                </div>

                {/* Products Cards List */}
                <div className="flex-1 overflow-y-auto space-y-2 max-h-80 pr-1 pl-1">
                  {products
                    .filter((p) => {
                      if (!pickerSearch.trim()) return true;
                      const q = pickerSearch.toLowerCase();
                      return (
                        p.name.toLowerCase().includes(q) ||
                        (p.nameKu && p.nameKu.toLowerCase().includes(q)) ||
                        (p.barcode && p.barcode.includes(q))
                      );
                    })
                    .slice(0, pickerSearch.trim() ? 50 : 10)
                    .map((p) => {
                      const addedItem = purchaseItems.find((it) => it.productId === p.id);
                      const addedQty = addedItem?.qty || 0;
                      const stockVal = p.stockQuantity ?? (p as any).stock ?? 0;

                      return (
                        <div
                          key={p.id}
                          onClick={() => handleAddProductToInvoice(p)}
                          className="bg-white hover:bg-indigo-50/40 border border-slate-200/90 hover:border-indigo-300 p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-2xs group active:scale-[0.99]"
                        >
                          {/* Right in RTL: Icon + Name + Barcode */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <Package className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-black text-xs text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                {p.nameKu || p.name}
                              </div>
                              {p.barcode && (
                                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                  {p.barcode}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Left in RTL: Stock Badge & Added count */}
                          <div className="flex items-center gap-2 shrink-0">
                            {addedQty > 0 && (
                              <span className="bg-indigo-600 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
                                +{addedQty}
                              </span>
                            )}
                            <div className="bg-[#f0fdf4] border border-[#86efac] text-[#15803d] font-bold text-[11px] font-mono px-3 py-1 rounded-lg">
                              {t(`کۆگا : ${stockVal}`, `Stock : ${stockVal}`)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}

            {/* SUB-VIEW 1: Add Item Without Barcode */}
            {pickerMode === 'no_barcode' && (
              <form onSubmit={handleAddNoBarcodeItem} className="space-y-3.5 py-1">
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-center gap-2 text-amber-800 text-xs font-bold">
                  <Plus className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t('زیادکردنی کاڵای دەستی یان خزمەتگوزاری بەبێ بارکۆد', 'Add custom item or service without barcode')}</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {t('ناوی کاڵا یان خزمەتگوزاری *', 'Product / Service Name *')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('ناوی کاڵا بنووسە...', 'Enter product name...')}
                    value={noBarcodeName}
                    onChange={(e) => setNoBarcodeName(e.target.value)}
                    className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-2xs font-sans"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t('تێچووی کڕین (IQD)', 'Unit Cost')}
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={noBarcodeCost === 0 ? '' : noBarcodeCost}
                      onChange={(e) => setNoBarcodeCost(parseInt(e.target.value) || 0)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-lg px-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500 shadow-2xs text-center"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-emerald-700 block mb-1">
                      {t('نرخی فرۆشتن (IQD)', 'Selling Price')}
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={noBarcodePrice === 0 ? '' : noBarcodePrice}
                      onChange={(e) => setNoBarcodePrice(parseInt(e.target.value) || 0)}
                      className="w-full h-10 bg-emerald-50/30 border border-emerald-300 rounded-lg px-2 text-xs font-mono font-bold text-emerald-700 outline-none focus:border-emerald-500 shadow-2xs text-center"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t('بڕ / ژمارە', 'Quantity')}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={noBarcodeQty === 0 ? '' : noBarcodeQty}
                      onChange={(e) => setNoBarcodeQty(parseInt(e.target.value) || 1)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-lg px-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500 shadow-2xs text-center"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPickerMode('list')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    {t('گەڕانەوە بۆ پێڕست', 'Back to list')}
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('زیادکردن بۆ وەصڵ', 'Add to invoice')}</span>
                  </button>
                </div>
              </form>
            )}

            {/* SUB-VIEW 2: Create New Product In Catalog */}
            {pickerMode === 'new_product' && (
              <form onSubmit={handleCreateNewProductAndAdd} className="space-y-3 py-1">
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('تۆمارکردنی کاڵای نوێ لە کۆگا و زیادکردنی ڕاستەوخۆ بۆ وەصڵ', 'Register new product in warehouse and add to invoice')}</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {t('ناوی کاڵا *', 'Product Name *')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('ناوی کاڵا بنووسە...', 'Enter product name...')}
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-2xs font-sans"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t('بارکۆد (ئارەزوومەندانە)', 'Barcode (Optional)')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('بارکۆد بنووسە یان سکان بکە...', 'Enter or scan barcode...')}
                      value={newProdBarcode}
                      onChange={(e) => setNewProdBarcode(e.target.value)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-mono text-slate-900 outline-none focus:border-indigo-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t('تێچووی کڕین (IQD)', 'Cost Price (IQD)')}
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newProdCost === 0 ? '' : newProdCost}
                      onChange={(e) => setNewProdCost(parseInt(e.target.value) || 0)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t('نرخی فرۆشتن (IQD)', 'Sale Price (IQD)')}
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newProdPrice === 0 ? '' : newProdPrice}
                      onChange={(e) => setNewProdPrice(parseInt(e.target.value) || 0)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t('بڕی سەرەتایی لە کۆگا', 'Initial Stock')}
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newProdStock === 0 ? '' : newProdStock}
                      onChange={(e) => setNewProdStock(parseInt(e.target.value) || 0)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPickerMode('list')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    {t('گەڕانەوە بۆ پێڕست', 'Back to list')}
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('تۆمارکردن و زیادکردن بۆ وەصڵ', 'Save & Add to Invoice')}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Footer with Close Button */}
            {pickerMode === 'list' && (
              <div className="pt-2 flex justify-start border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductPickerOpen(false)}
                  className="px-6 py-2.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {t('داخستن', 'Close')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Add New Supplier (Matching uploaded screenshot media_1787607270001.png) */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-2xl rounded-2xl" dir={lang === 'ku' ? 'rtl' : 'ltr'}>
            
            {/* Header matching screenshot */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Store className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900">
                  {t('تۆمارکردنی دابینکەری نوێ', 'Register New Supplier')}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddSupplierOpen(false)} 
                className="text-slate-400 hover:text-slate-900 cursor-pointer p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3.5 text-xs">
              {/* Field 1: Company / Supplier Name */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {t('ناوی دابینکەر / کۆمپانیا:', 'Supplier / Company Name:')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('ناوی کۆمپانیا یان نوێنەر...', 'Company or representative name...')}
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-2xs transition-all"
                />
              </div>

              {/* Field 2: Phone Number */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {t('ژمارەی مۆبایل:', 'Phone Number:')}
                </label>
                <input
                  type="text"
                  placeholder="0750 000 0000"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-2xs transition-all text-start"
                />
              </div>

              {/* Field 3: Address */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {t('ناونیشان:', 'Address:')}
                </label>
                <input
                  type="text"
                  placeholder={t('شار، گەڕەک یان ناونیشانی کۆمپانیا...', 'City, district or company address...')}
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-2xs transition-all"
                />
              </div>

              {/* Field 4: Notes */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {t('تێبینی:', 'Notes:')}
                </label>
                <textarea
                  rows={2}
                  placeholder={t('هەر تێبینییەکی زیادە...', 'Any additional notes...')}
                  value={supNotes}
                  onChange={(e) => setSupNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-2xs resize-none transition-all"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 flex items-center justify-start gap-3">
                <button
                  type="submit"
                  className="px-7 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer active:scale-98"
                >
                  {t('تۆمارکردن', 'Register')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="text-slate-500 hover:text-slate-800 font-bold text-xs cursor-pointer px-2 py-2 transition-colors"
                >
                  {t('پاشگەزبوونەوە', 'Cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Supplier */}
      {editingSupplier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-2xl rounded-2xl" dir={lang === 'ku' ? 'rtl' : 'ltr'}>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900">
                  {t('دەستکاریکردنی زانیاریی دابینکەر', 'Edit Supplier Info')}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingSupplier(null)} 
                className="text-slate-400 hover:text-slate-900 cursor-pointer p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSupplier} className="space-y-3.5 text-xs">
              {/* Field 1: Company / Supplier Name */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {t('ناوی دابینکەر / کۆمپانیا:', 'Supplier / Company Name:')}
                </label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-2xs transition-all"
                />
              </div>

              {/* Field 2: Phone Number */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {t('ژمارەی مۆبایل:', 'Phone Number:')}
                </label>
                <input
                  type="text"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3 text-xs font-mono text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-2xs transition-all text-start"
                />
              </div>

              {/* Field 3: Address */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {t('ناونیشان:', 'Address:')}
                </label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-2xs transition-all"
                />
              </div>

              {/* Field 4: Notes */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {t('تێبینی:', 'Notes:')}
                </label>
                <textarea
                  rows={2}
                  value={supNotes}
                  onChange={(e) => setSupNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-2xs resize-none transition-all"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 flex items-center justify-start gap-3">
                <button
                  type="submit"
                  className="px-7 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer active:scale-98"
                >
                  {t('پاشەکەوتکردن', 'Save Changes')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
                  className="text-slate-500 hover:text-slate-800 font-bold text-xs cursor-pointer px-2 py-2 transition-colors"
                >
                  {t('پاشگەزبوونەوە', 'Cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: View Invoice Details (Matches media_1787653289394.png) */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-xl p-5 space-y-4 shadow-2xl rounded-2xl max-h-[88vh] flex flex-col" dir={lang === 'ku' ? 'rtl' : 'ltr'}>
            
            {/* Header matching media_1787653289394.png */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 leading-snug">{t('وردەکاری پسوڵەی کڕین', 'Purchase Invoice Details')}</h3>
                  <span className="text-[11px] font-mono text-slate-500">{viewingInvoice.invoiceNumber} • {viewingInvoice.supplierInvoiceNumber || ''}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200/80 shadow-2xs"
                  title={t('چاپکردنی وەصڵ', 'Print Invoice')}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('چاپکردن', 'Print')}</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setViewingInvoice(null)} 
                  className="text-slate-400 hover:text-slate-900 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Info Summary Box */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] font-medium">{t('کۆمپانیا:', 'Supplier:')}</span>
                <span className="font-bold text-slate-900">{viewingInvoice.supplierName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-medium">{t('بەروار:', 'Date:')}</span>
                <span className="font-bold text-slate-900 font-sans">{viewingInvoice.date}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-medium">{t('تۆمارکەر:', 'Recorded By:')}</span>
                <span className="font-bold text-slate-900">{viewingInvoice.createdUser}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200/90 rounded-xl shadow-2xs">
              <table className="w-full text-xs text-start border-collapse">
                <thead className="bg-[#f1f5f9] text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                  <tr className="divide-x rtl:divide-x-reverse divide-slate-200">
                    <th className="p-3 text-start">{t('ناوی کاڵا', 'Item Name')}</th>
                    <th className="p-3 text-center">{t('بڕ', 'Qty')}</th>
                    <th className="p-3 text-center">{t('تێچووی دانە', 'Unit Cost')}</th>
                    <th className="p-3 text-center">{t('کۆی گشتی', 'Total Cost')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 font-sans">
                  {viewingInvoice.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 divide-x rtl:divide-x-reverse divide-slate-200/50">
                      <td className="p-3 font-bold text-slate-800">{it.productName}</td>
                      <td className="p-3 text-center font-mono font-bold">{it.quantity}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700">
                        {formatCurrency(it.unitCost, currency, lang, exchangeRate)}
                      </td>
                      <td className="p-3 text-center font-mono font-black text-slate-900">
                        {formatCurrency(it.totalCost, currency, lang, exchangeRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Totals Box */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 text-xs">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-bold block">{t('کۆی گشتی:', 'Total:')}</span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  {formatCurrency(viewingInvoice.totalAmount, currency, lang, exchangeRate)}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-bold block">{t('پارەی دراو:', 'Paid:')}</span>
                <span className="font-mono font-black text-emerald-600 text-sm">
                  {formatCurrency(viewingInvoice.amountPaid, currency, lang, exchangeRate)}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-bold block">{t('قەرزی ماوە:', 'Debt:')}</span>
                <span className="font-mono font-black text-rose-600 text-sm">
                  {formatCurrency(viewingInvoice.debtAmount, currency, lang, exchangeRate)}
                </span>
              </div>
            </div>

            {/* Footer with Print Invoice and Close Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {t('داخستن', 'Close')}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
              >
                <Printer className="w-4 h-4" />
                <span>{t('چاپکردنی وەصڵ', 'Print Invoice')}</span>
              </button>
            </div>

            {/* Hidden Printable Invoice Element for Window.Print */}
            <div id="printable-purchase-invoice" className="hidden" dir="rtl">
              <div className="p-6 max-w-2xl mx-auto space-y-4 font-sans text-slate-900 bg-white">
                <div className="text-center border-b-2 border-slate-800 pb-3">
                  <h1 className="text-xl font-black text-slate-900">{t('سیستەمی باران - پسوڵەی کڕین', 'BARAN POS - Purchase Invoice')}</h1>
                  <p className="text-xs font-mono text-slate-600 mt-1">
                    کۆدی وەصڵ: {viewingInvoice.invoiceNumber} | ژمارەی پسوڵەی دابینکەر: {viewingInvoice.supplierInvoiceNumber || 'N/A'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs border border-slate-300 p-3 rounded-lg bg-slate-50">
                  <div>
                    <span className="text-slate-500 font-bold block">دابینکەر / کۆمپانیا:</span>
                    <span className="font-black text-sm">{viewingInvoice.supplierName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">بەروار و کات:</span>
                    <span className="font-bold">{viewingInvoice.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">تۆمارکراوە لەلایەن:</span>
                    <span className="font-bold">{viewingInvoice.createdUser}</span>
                  </div>
                </div>

                <table className="w-full text-xs text-start border-collapse border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold">
                    <tr>
                      <th className="border border-slate-300 p-2 text-start">ناوی کاڵا</th>
                      <th className="border border-slate-300 p-2 text-center w-16">بڕ</th>
                      <th className="border border-slate-300 p-2 text-center w-28">تێچووی دانە</th>
                      <th className="border border-slate-300 p-2 text-center w-32">کۆی گشتی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingInvoice.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-300 p-2 font-bold">{it.productName}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-bold">{it.quantity}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono">
                          {formatCurrency(it.unitCost, currency, lang, exchangeRate)}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-black">
                          {formatCurrency(it.totalCost, currency, lang, exchangeRate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border border-slate-300 p-3 rounded-lg bg-slate-50 space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold">
                    <span>کۆی گشتیی پسوڵە:</span>
                    <span className="font-mono font-black text-sm">{formatCurrency(viewingInvoice.totalAmount, currency, lang, exchangeRate)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>پارەی دراو (کاش):</span>
                    <span className="font-mono font-black">{formatCurrency(viewingInvoice.amountPaid, currency, lang, exchangeRate)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-bold border-t border-slate-200 pt-1">
                    <span>قەرزی ماوە لەسەر ئێمە:</span>
                    <span className="font-mono font-black text-sm">{formatCurrency(viewingInvoice.debtAmount, currency, lang, exchangeRate)}</span>
                  </div>
                </div>

                <div className="pt-6 flex justify-between text-[11px] text-slate-500 border-t border-slate-200">
                  <span>واژۆی ژمێریار: ..........................</span>
                  <span>واژۆی دابینکەر: ..........................</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Pay Supplier Debt Modal */}
      {paySupplierTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-md p-5 space-y-4 shadow-2xl rounded-2xl" dir={lang === 'ku' ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm text-slate-900">
                  {t(`دانەوەی قەرزی دابینکەر: ${paySupplierTarget.companyName}`, `Pay Debt: ${paySupplierTarget.companyName}`)}
                </h3>
              </div>
              <button onClick={() => setPaySupplierTarget(null)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPaySupplier} className="space-y-3 text-xs">
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800">{t('کۆی قەرزی ئێستا:', 'Current Balance Owed:')}</span>
                <span className="text-sm font-black font-mono text-rose-700">
                  {formatCurrency(paySupplierTarget.currentDebt, currency, lang, exchangeRate)}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('بڕی دانەوە (IQD):', 'Payment Amount:')}
                </label>
                <input
                  type="number"
                  required
                  value={paySupplierAmount || ''}
                  onChange={(e) => setPaySupplierAmount(parseInt(e.target.value) || 0)}
                  className="w-full h-9.5 bg-white border border-slate-300 rounded-lg px-3 text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('تێبینی / ژمارەی وەصڵ:', 'Notes / Receipt Reference:')}
                </label>
                <input
                  type="text"
                  placeholder={t('تێبینی...', 'Notes...')}
                  value={paySupplierNote}
                  onChange={(e) => setPaySupplierNote(e.target.value)}
                  className="w-full h-9.5 bg-white border border-slate-300 rounded-lg px-3 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-start gap-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {t('تەئکیدکردن و چاپکردنی وەصڵ', 'Confirm & Print Receipt')}
                </button>
                <button
                  type="button"
                  onClick={() => setPaySupplierTarget(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  {t('پاشگەزبوونەوە', 'Cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Payment Printable Receipt */}
      {activeSupplierReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-slate-300 w-full max-w-sm p-6 space-y-4 shadow-2xl rounded-2xl" dir={lang === 'ku' ? 'rtl' : 'ltr'}>
            <div className="text-center border-b border-slate-200 pb-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-1" />
              <h2 className="text-sm font-black uppercase text-slate-900">{t('وەصڵی دانەوەی قەرزی دابینکەر', 'Supplier Debt Receipt')}</h2>
              <span className="text-[10px] font-mono text-slate-500">#{activeSupplierReceipt.id}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{t('کۆمپانیا:', 'Supplier:')}</span>
                <span className="font-bold text-slate-900">{activeSupplierReceipt.supplierName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{t('بڕی دراو:', 'Amount Paid:')}</span>
                <span className="font-black font-mono text-emerald-600">
                  {formatCurrency(activeSupplierReceipt.amount, currency, lang, exchangeRate)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{t('قەرزی ماوە:', 'Remaining Debt:')}</span>
                <span className="font-black font-mono text-rose-600">
                  {formatCurrency(activeSupplierReceipt.remainingDebt, currency, lang, exchangeRate)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{t('بەروار:', 'Date:')}</span>
                <span className="font-mono text-slate-700">{activeSupplierReceipt.date}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">{t('پارەدەری ڕێگەپێدراو:', 'Paid By:')}</span>
                <span className="font-bold text-slate-900">{activeSupplierReceipt.paidBy}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>{t('چاپکردن', 'Print')}</span>
              </button>
              <button
                onClick={() => setActiveSupplierReceipt(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {t('داخستن', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
