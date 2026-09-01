import React from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Tag, 
  Calendar,
  Layers,
  X,
  DollarSign,
  Printer,
  RefreshCw,
  Image as ImageIcon,
  Camera,
  Upload,
  Check,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileUp,
  FileDown,
  Info
} from 'lucide-react';
import { Product, Category, Brand, ItemType, StockAdjustment, UnitType } from '../types';
import { Currency, formatCurrency } from '../utils/currency';
import { getSampleImageForProduct } from '../utils/productImages';
import { normalizeBarcode } from '../utils/barcodeScanner';

interface InventoryManagerProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  itemTypes: ItemType[];
  onAddProduct: (product: Product) => void;
  onBulkAddProducts?: (products: Product[]) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onAddCategory?: (category: Category) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onStockAdjustment: (adj: StockAdjustment) => void;
  lang?: 'en' | 'ku';
  currency?: Currency;
  exchangeRate?: number;
}

const PRESET_SAMPLE_IMAGES = [
  { name: 'پەڕە و کاغەز', url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=400&q=80' },
  { name: 'قەڵەم و نووسین', url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80' },
  { name: 'دەفتەر و کتێب', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80' },
  { name: 'سەحافە و لامینەیت', url: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=400&q=80' },
  { name: 'مەرەکەب و تۆنەر', url: 'https://images.unsplash.com/photo-1612815150553-99ea45ef16ef?auto=format&fit=crop&w=400&q=80' },
  { name: 'ئامێری مەکتەب و قەداسە', url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=400&q=80' },
];

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  categories,
  brands,
  itemTypes,
  onAddProduct,
  onBulkAddProducts,
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
  onDeleteCategory,
  onStockAdjustment,
  lang = 'ku',
  currency = 'IQD',
  exchangeRate = 1500,
}) => {
  const [search, setSearch] = React.useState('');
  const [selectedCat, setSelectedCat] = React.useState<string>('all');
  const [filterAlert, setFilterAlert] = React.useState<'all' | 'low_stock' | 'expiring'>('all');

  // Modals
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [adjustingProduct, setAdjustingProduct] = React.useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = React.useState(false);
  const [customImageUrl, setCustomImageUrl] = React.useState('');
  const [newCategoryName, setNewCategoryName] = React.useState('');

  // Bulk Import / Export States
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [importPreviewList, setImportPreviewList] = React.useState<Product[]>([]);
  const [importError, setImportError] = React.useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = React.useState<string | null>(null);
  const [updateExistingOnBarcode, setUpdateExistingOnBarcode] = React.useState(true);

  // Form State for Add/Edit
  const [saveSuccessFeedback, setSaveSuccessFeedback] = React.useState<string | null>(null);
  const nameInputRef = React.useRef<HTMLInputElement | null>(null);
  const [formState, setFormState] = React.useState<Partial<Product>>({
    name: '',
    nameKu: '',
    sku: '',
    barcode: '',
    categoryId: categories[0]?.id || '',
    brandId: brands[0]?.id || '',
    itemTypeId: itemTypes[0]?.id || '',
    costPrice: 0,
    retailPrice: 0,
    wholesalePrice: 0,
    stockQuantity: 0,
    unit: 'piece',
    minStockAlert: 10,
    isActive: true,
    image: '',
  });

  // Stock Adjustment State
  const [adjType, setAdjType] = React.useState<'damaged_waste' | 'manual_correction' | 'stock_in'>('manual_correction');
  const [adjQty, setAdjQty] = React.useState<number>(0);
  const [adjReason, setAdjReason] = React.useState('');

  const t = (ku: string, en: string) => (lang === 'ku' ? ku : en);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const cleanSearch = normalizeBarcode(search).toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.nameKu && p.nameKu.includes(search)) ||
      (p.barcode && normalizeBarcode(p.barcode).toLowerCase().includes(cleanSearch)) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = selectedCat === 'all' || p.categoryId === selectedCat;

    let matchesAlert = true;
    if (filterAlert === 'low_stock') {
      matchesAlert = p.stockQuantity <= p.minStockAlert;
    } else if (filterAlert === 'expiring') {
      matchesAlert = Boolean(p.expiryDate && new Date(p.expiryDate).getTime() < Date.now() + 86400000 * 30);
    }

    return matchesSearch && matchesCat && matchesAlert;
  });

  // KPI Calculations
  const totalInventoryCost = products.reduce(
    (acc, p) => acc + (p.costPrice || 0) * (p.stockQuantity || 0),
    0
  );
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockAlert).length;
  const expiringCount = products.filter(
    (p) => p.expiryDate && new Date(p.expiryDate).getTime() < Date.now() + 86400000 * 30
  ).length;

  const handleOpenAdd = () => {
    setSaveSuccessFeedback(null);
    setFormState({
      id: `prod_${Date.now()}`,
      name: '',
      nameKu: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: '',
      categoryId: categories[0]?.id || '',
      brandId: brands[0]?.id || '',
      itemTypeId: itemTypes[0]?.id || '',
      costPrice: 0,
      retailPrice: 0,
      wholesalePrice: 0,
      stockQuantity: 0,
      unit: 'piece',
      minStockAlert: 10,
      isActive: true,
      image: '',
    });
    setEditingProduct(null);
    setIsAddModalOpen(true);
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 80);
  };

  const handleOpenEdit = (product: Product) => {
    setSaveSuccessFeedback(null);
    const kurdishName = product.nameKu || product.name || '';
    setFormState({
      ...product,
      name: kurdishName,
      nameKu: kurdishName,
    });
    setEditingProduct(product);
    setIsAddModalOpen(true);
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 80);
  };

  const handleDelete = (product: Product) => {
    if (
      confirm(
        t(
          `دڵنیایت لە سڕینەوەی کاڵای "${product.nameKu || product.name}"؟`,
          `Are you sure you want to delete "${product.nameKu || product.name}"?`
        )
      )
    ) {
      if (onDeleteProduct) {
        onDeleteProduct(product.id);
      }
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const kurdishName = (formState.nameKu || formState.name || '').trim();
    if (!kurdishName) return;

    const finalBarcode = formState.barcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const finalImage = formState.image || (editingProduct?.image) || getSampleImageForProduct(kurdishName, formState.categoryId);
    const finalProduct = {
      ...formState,
      name: kurdishName,
      nameKu: kurdishName,
      barcode: finalBarcode,
      image: finalImage,
      costPrice: Number(formState.costPrice) || 0,
      retailPrice: Number(formState.retailPrice) || 0,
      wholesalePrice: Number(formState.wholesalePrice) || Number(formState.retailPrice) || 0,
      stockQuantity: Number(formState.stockQuantity) || 0,
      minStockAlert: Number(formState.minStockAlert) || 10,
    } as Product;

    if (editingProduct) {
      onUpdateProduct(finalProduct);
      setIsAddModalOpen(false);
      setEditingProduct(null);
      setSaveSuccessFeedback(null);
    } else {
      onAddProduct(finalProduct);
      setSaveSuccessFeedback(kurdishName);
      setTimeout(() => setSaveSuccessFeedback(null), 4000);

      // Keep dialog open & reset inputs for continuous entry
      setFormState({
        id: `prod_${Date.now()}`,
        name: '',
        nameKu: '',
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        barcode: '',
        categoryId: formState.categoryId || categories[0]?.id || '',
        brandId: formState.brandId || brands[0]?.id || '',
        itemTypeId: formState.itemTypeId || itemTypes[0]?.id || '',
        costPrice: 0,
        retailPrice: 0,
        wholesalePrice: 0,
        stockQuantity: 0,
        unit: formState.unit || 'piece',
        minStockAlert: 10,
        isActive: true,
        image: '',
      });

      // Refocus name input for immediate next entry
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || adjQty === 0) return;

    const diff =
      adjType === 'damaged_waste' ? -Math.abs(adjQty) : adjType === 'stock_in' ? Math.abs(adjQty) : adjQty;
    const newStock = Math.max(0, adjustingProduct.stockQuantity + diff);

    const adjustment: StockAdjustment = {
      id: `adj_${Date.now()}`,
      productId: adjustingProduct.id,
      productName: adjustingProduct.name,
      type: adjType,
      quantityChange: diff,
      previousStock: adjustingProduct.stockQuantity,
      newStock,
      reason: adjReason || (adjType === 'damaged_waste' ? 'Damaged / Expired stock' : 'Manual correction'),
      date: new Date().toISOString(),
      user: 'على محمد',
    };

    onStockAdjustment(adjustment);
    setAdjustingProduct(null);
    setAdjQty(0);
    setAdjReason('');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name,
      nameKu: name,
    };

    if (onAddCategory) {
      onAddCategory(newCat);
    }
    setNewCategoryName('');
  };

  const handleDeleteCat = (cat: Category) => {
    const count = products.filter((p) => p.categoryId === cat.id).length;
    if (count > 0) {
      alert(
        t(
          `ناتوانیت ئەم پۆلە بسڕیتەوە چونکە (${count}) کاڵای لەسەرە. تکایە سەرەتا کاڵاکان بگوازەرەوە بۆ پۆلێکی تر.`,
          `Cannot delete category "${cat.nameKu || cat.name}" because it contains ${count} items. Please reassign items first.`
        )
      );
      return;
    }

    if (
      confirm(
        t(
          `دڵنیایت لە سڕینەوەی پۆلی "${cat.nameKu || cat.name}"؟`,
          `Are you sure you want to delete category "${cat.nameKu || cat.name}"?`
        )
      )
    ) {
      if (onDeleteCategory) {
        onDeleteCategory(cat.id);
      }
    }
  };

  // Helper for Unit Breakdown String (e.g. "25 پاکەت" or "9 باکس و 3 دانە")
  const getBulkUnitString = (p: Product) => {
    if (p.unitConversion && p.unitConversion.conversionFactor > 1) {
      const factor = p.unitConversion.conversionFactor;
      const bulkCount = Math.floor(p.stockQuantity / factor);
      const remainder = p.stockQuantity % factor;

      if (bulkCount > 0 && remainder > 0) {
        return `${bulkCount} ${p.unitConversion.bulkUnit} و ${remainder} ${p.unitConversion.baseUnit}`;
      } else if (bulkCount > 0 && remainder === 0) {
        return `${bulkCount} ${p.unitConversion.bulkUnit}`;
      }
    }

    const unitMap: Record<string, string> = {
      piece: t('دانە', 'piece'),
      pack: t('پاکەت', 'pack'),
      box: t('باکس', 'box'),
      carton: t('کارتۆن', 'carton'),
      ream: t('ڕیم', 'ream'),
      sheet: t('لاپەڕە', 'sheet'),
    };
    return `${p.stockQuantity} ${unitMap[p.unit] || p.unit || t('دانە', 'units')}`;
  };

  // 1. Export Products to Excel / CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (products.length === 0) {
      alert(t('هیچ کاڵایەک لە سیستەمدا نییە بۆ دەرهێنان', 'No products available to export'));
      return;
    }

    const headers = [
      'ناوی کاڵا (Kurdish Name)',
      'ناوی ئینگلیزی (English Name)',
      'بارکۆد (Barcode)',
      'کۆد (SKU)',
      'پۆل (Category)',
      'تێچووی کڕین (Cost IQD)',
      'نرخی تاک (Retail IQD)',
      'نرخی کۆ (Wholesale IQD)',
      'بڕی کۆگا (Stock Quantity)',
      'یەکە (Unit)',
      'کەمترین ئاگاداری (Min Stock Alert)'
    ];

    const rows = products.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId);
      const catName = cat?.nameKu || cat?.name || '';
      return [
        `"${(p.nameKu || p.name || '').replace(/"/g, '""')}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${p.barcode || ''}"`,
        `"${p.sku || ''}"`,
        `"${catName.replace(/"/g, '""')}"`,
        p.costPrice || 0,
        p.retailPrice || 0,
        p.wholesalePrice || 0,
        p.stockQuantity || 0,
        `"${p.unit || 'piece'}"`,
        p.minStockAlert || 10,
      ].join(',');
    });

    // Add UTF-8 BOM so Excel opens Kurdish / Arabic characters perfectly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `baran_products_export_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Download Sample Import Template
  const handleDownloadTemplate = () => {
    const headers = [
      'ناوی کاڵا',
      'ناوی ئینگلیزی',
      'بارکۆد',
      'پۆل',
      'تێچووی کڕین',
      'نرخی فرۆشتن',
      'نرخی کۆ',
      'بڕی کۆگا',
      'یەکە'
    ];

    const sampleRows = [
      ['پەڕەی دۆبڵ ئەی A4', 'Double A A4 Paper', '8853301000018', 'پەڕە و کاغەز', '6750', '9000', '7875', '120', 'ream'],
      ['قەڵەمی جاف فابەر کاستڵ', 'Faber-Castell Pen', '4005401425512', 'قەڵەم و نووسین', '300', '750', '500', '450', 'piece'],
      ['تۆنەری کانۆن NPG-59', 'Canon NPG-59 Toner', '4960999812301', 'مەرەکەب و تۆنەر', '42000', '57000', '48000', '8', 'piece']
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sample_products_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Handle File Upload & Robust Multi-Encoding Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      if (!buffer) return;

      let text = '';
      try {
        // 1. Try UTF-8 first
        const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
        text = utf8Decoder.decode(buffer);

        // 2. If it contains replacement character or is corrupted, try Windows-1256 (Arabic/Kurdish ANSI code page)
        if (text.includes('\uFFFD')) {
          try {
            const winDecoder = new TextDecoder('windows-1256');
            const winText = winDecoder.decode(buffer);
            if (!winText.includes('\uFFFD')) {
              text = winText;
            }
          } catch {}
        }
      } catch {
        const fallbackDecoder = new TextDecoder('utf-8');
        text = fallbackDecoder.decode(buffer);
      }

      parseImportFile(text, file.name);
    };
    reader.readAsArrayBuffer(file);
  };

  const parseImportFile = (content: string, fileName: string) => {
    try {
      if (fileName.endsWith('.json')) {
        const json = JSON.parse(content);
        if (Array.isArray(json)) {
          setImportPreviewList(json as Product[]);
          setImportError(null);
          return;
        }
      }

      // CSV / TSV Parser
      const lines = content.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setImportError(t('فایلەکە بەتاڵە یان داتای پێویستی تێدا نییە', 'File is empty or contains no data rows'));
        return;
      }

      // Detect delimiter
      const firstLine = lines[0];
      const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

      const parseLine = (line: string) => {
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            if (inQuotes && line[i + 1] === char) {
              cur += char;
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === delimiter && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const rawHeaders = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/["'\uFEFF]/g, '').trim());

      const getColIdx = (keywords: string[]) => {
        return rawHeaders.findIndex((h) => keywords.some((kw) => h.includes(kw)));
      };

      const nameIdx = getColIdx(['ناو', 'name', 'product', 'item', 'ناوی کاڵا']);
      const nameEnIdx = getColIdx(['ئینگلیزی', 'english', 'en']);
      const barcodeIdx = getColIdx(['بارکۆد', 'barcode', 'code', 'کۆد']);
      const skuIdx = getColIdx(['sku']);
      const catIdx = getColIdx(['پۆل', 'category', 'cat', 'بەش']);
      const costIdx = getColIdx(['کڕین', 'تێچوو', 'cost', 'buy']);
      const retailIdx = getColIdx(['فرۆشتن', 'تاک', 'price', 'retail', 'sale']);
      const wholesaleIdx = getColIdx(['کۆ', 'wholesale']);
      const stockIdx = getColIdx(['بڕ', 'کۆگا', 'stock', 'qty', 'quantity']);
      const unitIdx = getColIdx(['یەکە', 'unit']);

      const parsed: Product[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = parseLine(lines[i]);
        if (cols.length === 0 || !cols.some((c) => c.trim().length > 0)) continue;

        const name = (nameIdx >= 0 ? cols[nameIdx] : cols[0]) || '';
        if (!name) continue;

        const nameEn = (nameEnIdx >= 0 ? cols[nameEnIdx] : '') || name;
        const barcode = (barcodeIdx >= 0 ? cols[barcodeIdx] : '') || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`;
        const sku = (skuIdx >= 0 ? cols[skuIdx] : '') || `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
        const catName = (catIdx >= 0 ? cols[catIdx] : '') || '';
        const costPrice = parseInt((costIdx >= 0 ? cols[costIdx] : '').replace(/[^\d.-]/g, '')) || 0;
        const retailPrice = parseInt((retailIdx >= 0 ? cols[retailIdx] : '').replace(/[^\d.-]/g, '')) || 0;
        const wholesalePrice = parseInt((wholesaleIdx >= 0 ? cols[wholesaleIdx] : '').replace(/[^\d.-]/g, '')) || retailPrice;
        const stockQuantity = parseInt((stockIdx >= 0 ? cols[stockIdx] : '').replace(/[^\d.-]/g, '')) || 0;
        const unit = (unitIdx >= 0 ? cols[unitIdx] : 'piece') || 'piece';

        let categoryId = categories[0]?.id || 'cat_1';
        if (catName) {
          const matchCat = categories.find(
            (c) =>
              c.name.toLowerCase() === catName.toLowerCase() ||
              (c.nameKu && c.nameKu.toLowerCase() === catName.toLowerCase())
          );
          if (matchCat) {
            categoryId = matchCat.id;
          }
        }

        parsed.push({
          id: `prod_imp_${Date.now()}_${i}`,
          name: nameEn || name,
          nameKu: name,
          barcode,
          sku,
          categoryId,
          brandId: brands[0]?.id || 'brd_1',
          itemTypeId: itemTypes[0]?.id || 'typ_1',
          costPrice,
          retailPrice,
          wholesalePrice,
          stockQuantity,
          unit: unit as UnitType,
          minStockAlert: 10,
          isActive: true,
        });
      }

      if (parsed.length === 0) {
        setImportError(t('هیچ کاڵایەکی دروست لە فایلەکەدا نەدۆزرایەوە', 'No valid product rows could be parsed'));
        return;
      }

      setImportPreviewList(parsed);
      setImportError(null);
    } catch (err: any) {
      setImportError(t(`هەڵە لە خوێندنەوەی فایل: ${err.message}`, `Error reading file: ${err.message}`));
    }
  };

  // 4. Confirm Bulk Import
  const handleConfirmImport = () => {
    if (importPreviewList.length === 0) return;

    if (onBulkAddProducts) {
      onBulkAddProducts(importPreviewList);
    } else {
      importPreviewList.forEach((p) => onAddProduct(p));
    }

    setImportSuccessMsg(t(`بە سەرکەوتوویی (${importPreviewList.length}) کاڵا تۆمار کران`, `Successfully imported ${importPreviewList.length} products`));
    setTimeout(() => setImportSuccessMsg(null), 3000);
    setIsImportModalOpen(false);
    setImportPreviewList([]);
  };

  return (
    <div className="flex-1 bg-[#f8fafc] p-5 lg:p-6 flex flex-col overflow-hidden text-slate-900 font-sans select-none gap-4">
      {/* Toast Notification Banner */}
      {importSuccessMsg && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between animate-bounce shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{importSuccessMsg}</span>
          </div>
          <button onClick={() => setImportSuccessMsg(null)} className="text-white/80 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        {/* Right side in RTL: Title & Icon */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ede9fe] border border-[#ddd6fe] flex items-center justify-center text-[#6366f1] shadow-2xs shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-snug">
              {t('بەشی کاڵا و بارکۆد', 'Products & Barcode Management')}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              {t('تۆماری کاڵاکان و کۆدەکانیان (نرخەکان لە بەشی دابینکەران و کڕین دیاری دەکرێت)', 'Product catalog and barcodes (pricing is determined in Purchases)')}
            </p>
          </div>
        </div>

        {/* Left side in RTL: Action Buttons (Add, Import, Export, Add Category) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Add New Product */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t('زیادکردنی کاڵای نوێ', 'Add New Product')}</span>
          </button>

          {/* 2. Import Products */}
          <button
            type="button"
            onClick={() => {
              setImportPreviewList([]);
              setImportError(null);
              setIsImportModalOpen(true);
            }}
            className="px-3.5 py-2 bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#047857] border border-[#a7f3d0] text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-98"
            title={t('هێنانی کاڵا لە فایلی Excel / CSV بە کۆمەڵ', 'Import products in bulk from Excel / CSV')}
          >
            <FileUp className="w-4 h-4 text-[#059669]" />
            <span>{t('هێنانی فایل (Import)', 'Import Products')}</span>
          </button>

          {/* 3. Export Products */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd] text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-98"
            title={t('دەرهێنانی هەموو کاڵاکان بۆ فایلی Excel / CSV', 'Export all products to Excel / CSV')}
          >
            <FileDown className="w-4 h-4 text-[#0284c7]" />
            <span>{t('ئێکسپۆرت (Export)', 'Export CSV')}</span>
          </button>

          {/* 4. Add Category */}
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('زیادکردنی پۆل', 'Add Category')}</span>
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 shrink-0">
        {/* Card 1: Total Products (سەرجەمى کاڵاکان) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 block">
              {t('سەرجەمى کاڵاکان', 'Total Products')}
            </span>
            <span className="text-base font-black font-mono text-slate-900 block">
              {products.length} {t('کاڵا', 'items')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Inventory Value (بەهای کۆگا (تێچوو)) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 block">
              {t('بەهای کۆگا (تێچوو)', 'Inventory Value (Cost)')}
            </span>
            <span className="text-base font-black font-mono text-slate-900 block">
              {formatCurrency(totalInventoryCost, currency, lang, exchangeRate)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Low Stock (کاڵای کەمی کۆگا) */}
        <div 
          onClick={() => setFilterAlert(filterAlert === 'low_stock' ? 'all' : 'low_stock')}
          className={`bg-white rounded-xl border p-4 shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            filterAlert === 'low_stock' ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 block">
              {t('کاڵای کەمی کۆگا', 'Low Stock Alert')}
            </span>
            <span className={`text-base font-black font-mono block ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {lowStockCount} {t('کاڵا', 'items')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Expiring Soon (نزیک بەسەرچوون (٣٠ ڕۆژ)) */}
        <div 
          onClick={() => setFilterAlert(filterAlert === 'expiring' ? 'all' : 'expiring')}
          className={`bg-white rounded-xl border p-4 shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            filterAlert === 'expiring' ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 block">
              {t('نزیک بەسەرچوون (٣٠ ڕۆژ)', 'Expiring Soon (30 Days)')}
            </span>
            <span className={`text-base font-black font-mono block ${expiringCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {expiringCount} {t('کاڵا', 'items')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
        {/* Category Dropdown (Left in RTL) */}
        <div className="relative w-full sm:w-60 shrink-0">
          <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full h-9.5 bg-white border border-slate-200/90 pl-8 rtl:pl-3 pr-3 rtl:pr-8 text-xs font-bold text-slate-700 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
          >
            <option value="all">{t('هەموو پۆلێنەکان', 'All Categories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {lang === 'ku' ? (c.nameKu || c.name) : c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Wide Search Bar (Right in RTL) */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={t('گەڕان بە ناو یان بارکۆد...', 'Search by name or barcode...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9.5 bg-white border border-slate-200/90 pl-9 rtl:pl-3 pr-3 rtl:pr-9 text-xs text-slate-900 placeholder-slate-400 font-sans rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table (Clean Spreadsheet / Sheet Style with Alternating Row Colors) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs text-start border-collapse">
            <thead className="bg-[#f1f5f9] text-slate-700 font-bold border-b border-slate-300 sticky top-0 z-10 text-[11px] shadow-2xs">
              <tr className="divide-x rtl:divide-x-reverse divide-slate-200/80">
                <th className="p-3.5 text-start font-bold">{t('زانیاری کاڵا', 'Product Info')}</th>
                <th className="p-3.5 text-center font-bold">{t('کۆدی بارکۆد', 'Barcode Code')}</th>
                <th className="p-3.5 text-center font-bold">{t('پۆلین', 'Category')}</th>
                <th className="p-3.5 text-center font-bold">{t('نرخەکان', 'Prices')}</th>
                <th className="p-3.5 text-center font-bold">{t('بڕ بە کارتۆن و دانە', 'Package Breakdown')}</th>
                <th className="p-3.5 text-center font-bold">{t('کۆی گشتی', 'Total Units')}</th>
                <th className="p-3.5 text-center font-bold">{t('بەسەرچوون', 'Expiry Date')}</th>
                <th className="p-3.5 text-center font-bold">{t('کردارەکان', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 font-sans">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 space-y-2">
                    <Package className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                    <p className="text-xs font-bold">{t('هیچ کاڵایەک نەدۆزرایەوە', 'No products found')}</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, index) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  const expiryDisplay = p.expiryDate || '2028-01-01';
                  // Zebra Striping: Alternating white and light-grey rows
                  const isEven = index % 2 === 0;
                  const rowBg = isEven ? 'bg-white' : 'bg-[#f8fafc]';

                  return (
                    <tr
                      key={p.id}
                      className={`${rowBg} hover:bg-indigo-50/40 transition-colors divide-x rtl:divide-x-reverse divide-slate-200/50`}
                    >
                      {/* 1. Item Info: Thumbnail Image + Product Name */}
                      <td className="p-2.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 flex items-center justify-center shadow-2xs">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.currentTarget.style.display = 'none'); }}
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-300 stroke-1" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs truncate max-w-[220px]" title={p.nameKu || p.name}>
                              {p.nameKu || p.name}
                            </h4>
                          </div>
                        </div>
                      </td>

                      {/* 2. Barcode Pill Box */}
                      <td className="p-2.5 text-center">
                        <div className="inline-block bg-slate-100/90 border border-slate-200/90 px-3 py-1 rounded-md font-mono font-bold text-xs text-slate-700 select-all shadow-2xs">
                          {p.barcode || p.sku}
                        </div>
                      </td>

                      {/* 3. Category Pill Badge */}
                      <td className="p-2.5 text-center">
                        <span className="inline-block bg-blue-50 border border-blue-200/80 text-blue-600 font-bold text-[11px] px-2.5 py-1 rounded-md shadow-2xs">
                          {cat ? (lang === 'ku' ? (cat.nameKu || cat.name) : cat.name) : t('گشتی', 'General')}
                        </span>
                      </td>

                      {/* 4. Cost and Selling Prices */}
                      <td className="p-2.5 text-center">
                        {p.retailPrice > 0 || p.costPrice > 0 ? (
                          <div className="flex items-center justify-center gap-1.5 font-mono text-xs">
                            <span className="text-rose-600 font-bold">
                              {t('کڕین:', 'Cost:')} {formatCurrency(p.costPrice, currency, lang, exchangeRate)}
                            </span>
                            <span className="text-slate-300 font-bold">/</span>
                            <span className="text-emerald-600 font-bold">
                              {t('فرۆشتن:', 'Sell:')} {formatCurrency(p.retailPrice, currency, lang, exchangeRate)}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-block bg-slate-100 text-slate-500 font-medium text-[11px] px-2.5 py-0.5 rounded-md border border-slate-200/90 shadow-2xs">
                            {t('لە کڕین دادەنرێت', 'Set in Purchases')}
                          </span>
                        )}
                      </td>

                      {/* 5. Package Breakdown (e.g. "25 پاکەت" or "9 باکس و 3 دانە") */}
                      <td className="p-2.5 text-center">
                        <span className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] px-2.5 py-1 rounded-md shadow-2xs">
                          {getBulkUnitString(p)}
                        </span>
                      </td>

                      {/* 6. Total Units (کۆی گشتی) */}
                      <td className="p-2.5 text-center">
                        <span className="inline-block bg-slate-100 border border-slate-200/80 text-slate-800 font-bold text-xs px-3 py-1 rounded-md font-mono shadow-2xs">
                          {p.stockQuantity} {t('دانە', 'units')}
                        </span>
                      </td>

                      {/* 7. Expiry Date (Clean Minimal Grey Badge) */}
                      <td className="p-2.5 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100/90 border border-slate-200/90 text-slate-700 rounded-md font-mono text-xs font-semibold shadow-2xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{expiryDisplay}</span>
                        </div>
                      </td>

                      {/* 8. Actions (Clean Minimal Grey Actions) */}
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(p)}
                            className="p-1.5 hover:bg-slate-200/70 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                            title={t('سڕینەوە', 'Delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 hover:bg-slate-200/70 text-slate-400 hover:text-indigo-600 rounded-md transition-colors cursor-pointer"
                            title={t('دەستکاری', 'Edit')}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdjustingProduct(p)}
                            className="p-1.5 hover:bg-slate-200/70 text-slate-400 hover:text-slate-800 rounded-md transition-colors cursor-pointer"
                            title={t('رێکخستنی کۆگا', 'Adjust Stock')}
                          >
                            <Printer className="w-4 h-4" />
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

      {/* Add / Edit Product Modal — Minimal, Formal & Smooth UI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
          <div
            className="bg-white border border-slate-200/90 w-full max-w-lg shadow-2xl rounded-2xl overflow-hidden text-slate-900 transition-all duration-200 flex flex-col max-h-[92vh]"
            dir={lang === 'ku' ? 'rtl' : 'ltr'}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-50/75 border-b border-slate-200/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-slate-900 leading-tight">
                    {editingProduct
                      ? t('دەستکاریکردنی کاڵا', 'Edit Product')
                      : t('زیادکردنی کاڵای نوێ', 'Add New Product')}
                  </h2>
                  {!editingProduct && (
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {t('تۆمارکردنی یەک لە دوای یەکی کاڵاکان بە بێ داخران', 'Continuous product entry without modal closing')}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                  setSaveSuccessFeedback(null);
                }}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success Feedback Alert */}
            {saveSuccessFeedback && (
              <div className="mx-5 mt-3.5 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs shrink-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px]">
                    {t(
                      `کاڵای "${saveSuccessFeedback}" بە سەرکەوتوویی زیادکرا. ئینپوتەکان ئامادەن بۆ کاڵای دواتر.`,
                      `"${saveSuccessFeedback}" added successfully. Ready for next item.`
                    )}
                  </span>
                </div>
                <span className="text-[9px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded">
                  {t('تۆمارکرا ✓', 'Saved ✓')}
                </span>
              </div>
            )}

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs min-h-0">
              {/* Field 1: Product Name */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {t('ناوی کاڵا:', 'Product Name:')} <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  placeholder={t('ناوی کاڵا بنووسە...', 'Enter product name...')}
                  value={formState.nameKu || formState.name || ''}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value, nameKu: e.target.value })}
                  className="w-full h-9 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Field 2 & 3: Barcode & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                {/* Barcode */}
                <div className="w-full min-w-0 flex flex-col">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {t('بارکۆدی کاڵا:', 'Barcode:')}
                  </label>
                  <div className="flex items-center gap-1.5 w-full min-w-0">
                    <input
                      type="text"
                      placeholder={t('بارکۆدی کاڵا...', 'Barcode...')}
                      value={formState.barcode}
                      onChange={(e) => setFormState({ ...formState, barcode: e.target.value })}
                      className="w-full min-w-0 flex-1 h-9 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 outline-none shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormState((prev) => ({
                          ...prev,
                          barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
                        }))
                      }
                      className="h-9 w-9 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                      title={t('دروستکردنی بارکۆدی ئۆتۆماتیکی', 'Generate Barcode')}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Category */}
                <div className="w-full min-w-0 flex flex-col">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {t('پۆلێن (Category):', 'Category:')}
                  </label>
                  <select
                    value={formState.categoryId}
                    onChange={(e) => setFormState({ ...formState, categoryId: e.target.value })}
                    className="w-full min-w-0 h-9 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-2.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer shadow-2xs truncate"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {lang === 'ku' ? (c.nameKu || c.name) : c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 4 & 5: Unit Type & Low Stock Alert */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                {/* Unit Type */}
                <div className="w-full min-w-0 flex flex-col">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {t('جۆری یەکە:', 'Unit Type:')}
                  </label>
                  <select
                    value={formState.unit}
                    onChange={(e) => setFormState({ ...formState, unit: e.target.value as UnitType })}
                    className="w-full min-w-0 h-9 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-2.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer shadow-2xs truncate"
                  >
                    <option value="piece">{t('دانە (Piece)', 'Piece (دانە)')}</option>
                    <option value="pack">{t('پاکەت (Pack)', 'Pack (پاکەت)')}</option>
                    <option value="box">{t('باکس (Box)', 'Box (باکس)')}</option>
                    <option value="carton">{t('کارتۆن (Carton)', 'Carton (کارتۆن)')}</option>
                    <option value="ream">{t('ڕیم (Ream)', 'Ream (ڕیم)')}</option>
                    <option value="sheet">{t('لاپەڕە (Sheet)', 'Sheet (لاپەڕە)')}</option>
                  </select>
                </div>

                {/* Low Stock Alert */}
                <div className="w-full min-w-0 flex flex-col">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {t('ئاگاداری کەمترین بڕ:', 'Low Stock Alert:')}
                  </label>
                  <input
                    type="number"
                    value={formState.minStockAlert}
                    onChange={(e) => setFormState({ ...formState, minStockAlert: parseInt(e.target.value) || 0 })}
                    className="w-full min-w-0 h-9 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 text-xs font-mono font-bold text-slate-900 outline-none shadow-2xs text-center"
                  />
                </div>
              </div>

              {/* Field 6: Product Image */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {t('وێنەی کاڵا:', 'Product Image:')}
                </label>
                {formState.image ? (
                  <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <img
                      src={formState.image}
                      alt="Preview"
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 shadow-2xs shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-slate-700 block truncate">
                        {t('وێنە دیاریکراوە', 'Image selected')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsImagePickerOpen(true)}
                        className="text-[10px] text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
                      >
                        {t('گۆڕین', 'Change')}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormState({ ...formState, image: '' })}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title={t('سڕینەوەی وێنە', 'Remove image')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsImagePickerOpen(true)}
                    className="w-full h-9 bg-slate-50 hover:bg-blue-50/60 text-slate-700 hover:text-blue-700 border border-dashed border-slate-300 hover:border-blue-400 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t('هەڵبژاردنی وێنە یان نموونە', 'Select Product Image')}</span>
                  </button>
                )}
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-50/75 border-t border-slate-200/80 flex items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                  setSaveSuccessFeedback(null);
                }}
                className="h-9 px-4 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                {t('داخستن', 'Close')}
              </button>

              <button
                type="button"
                onClick={handleSaveProduct}
                className="h-9 px-5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {editingProduct
                    ? t('پاشەکەوتکردنی گۆڕانکاری', 'Save Changes')
                    : t('تۆمارکردن و کاڵای نوێ', 'Save & Add Another')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Picker Sub-Modal */}
      {isImagePickerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-60 p-4 font-sans animate-fade-in">
          <div className="bg-white border border-slate-200/90 w-full max-w-md p-5 space-y-4 shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>{t('هەڵبژاردنی وێنەی کاڵا', 'Select Product Image')}</span>
              </h3>
              <button onClick={() => setIsImagePickerOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Upload from Computer */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  {t('ئاپلۆدکردن لە کۆمپیوتەرەوە:', 'Upload from Computer:')}
                </label>
                <label className="flex items-center justify-center gap-2.5 p-3.5 bg-blue-50/50 hover:bg-blue-50/90 border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-xl cursor-pointer transition-all text-blue-600 font-bold text-xs shadow-2xs group">
                  <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>{t('کلیک بکە بۆ هەڵبژاردنی وێنە لە کۆمپیوتەر', 'Click to choose image file from computer')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setFormState((prev) => ({ ...prev, image: reader.result as string }));
                            setIsImagePickerOpen(false);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Presets Grid */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-700 block mb-2">
                  {t('وێنەی نموونەیی ئامادەکراو:', 'Sample Presets:')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_SAMPLE_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormState({ ...formState, image: preset.url });
                        setIsImagePickerOpen(false);
                      }}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-blue-500 transition-all cursor-pointer shadow-2xs"
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] font-bold py-0.5 text-center truncate">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Image Link */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {t('یان لینکی وێنە (URL):', 'Or Image URL:')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    className="flex-1 h-9 bg-white border border-slate-300 rounded-lg px-3 text-xs text-slate-900 focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customImageUrl) {
                        setFormState({ ...formState, image: customImageUrl });
                        setCustomImageUrl('');
                        setIsImagePickerOpen(false);
                      }
                    }}
                    className="px-3.5 h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    {t('دانان', 'Apply')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-md p-5 space-y-4 shadow-2xl rounded-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-900">
                {t(`رێکخستنی کۆگا: ${adjustingProduct.nameKu || adjustingProduct.name}`, `Stock Adjustment: ${adjustingProduct.name}`)}
              </h3>
              <button onClick={() => setAdjustingProduct(null)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  {t('جۆری رێکخستن', 'Adjustment Type')}
                </label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full h-9 bg-slate-50 border border-slate-300 px-3 text-slate-900 font-bold focus:border-indigo-600 outline-none rounded-lg cursor-pointer"
                >
                  <option value="manual_correction">{t('ڕاستکردنەوەی دەستی', 'Manual Correction')}</option>
                  <option value="damaged_waste">{t('کاڵای خراپبوو / زیان (کەمکردنەوە)', 'Damaged / Waste (Reduce)')}</option>
                  <option value="stock_in">{t('کاڵای هاتوو / وەرگرتن (زیادکردن)', 'Stock Inbound (Add)')}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1 font-mono">
                  {t('بڕی کاڵا', 'Quantity')}
                </label>
                <input
                  type="number"
                  required
                  value={adjQty}
                  onChange={(e) => setAdjQty(parseInt(e.target.value) || 0)}
                  className="w-full h-9 bg-white border border-slate-300 px-3 text-slate-900 font-bold focus:border-indigo-600 outline-none rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  {t('هۆکار / تێبینی', 'Reason / Audit Note')}
                </label>
                <input
                  type="text"
                  placeholder={t('نموونە: کاغەز شەڵاوبوو، مەلەوانکە خراپبوو...', 'e.g. Water damage, defective package')}
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full h-9 bg-white border border-slate-300 px-3 text-slate-900 focus:border-indigo-600 outline-none rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  {t('هەڵوەشاندنەوە', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  {t('جێبەجێکردن', 'Apply Adjustment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Add & Manage Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-md p-5 space-y-4 shadow-2xl rounded-2xl" dir={lang === 'ku' ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  {t('بەڕێوەبردن و زیادکردنی پۆلێن', 'Manage & Add Categories')}
                </h3>
              </div>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleCreateCategory} className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                {t('زیادکردنی پۆلێنی نوێ:', 'Add New Category:')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder={t('ناوی پۆلێن بنووسە (نموونە: قەڵەم و نووسین)...', 'Enter category name (e.g. Pens & Writing)...')}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 h-9.5 bg-white border border-slate-300 rounded-lg px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-2xs"
                />
                <button
                  type="submit"
                  className="px-4 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0 active:scale-98"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{t('زیادکردن', 'Add')}</span>
                </button>
              </div>
            </form>

            {/* List of Existing Categories */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>{t('پۆلێنە تۆمارکراوەکان', 'Existing Categories')}</span>
                <span>{categories.length} {t('پۆل', 'categories')}</span>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
                {categories.map((c) => {
                  const itemCount = products.filter((p) => p.categoryId === c.id).length;
                  return (
                    <div
                      key={c.id}
                      className="p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl flex items-center justify-between text-xs transition-colors hover:bg-slate-100/70"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-800">
                          {c.nameKu || c.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md shadow-2xs">
                          {itemCount} {t('کاڵا', 'items')}
                        </span>
                        {onDeleteCategory && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCat(c)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title={t('سڕینەوەی پۆل', 'Delete Category')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="w-full h-9.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              {t('تەواو / داخستن', 'Done / Close')}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: Bulk Import Products from File */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-2xl p-6 space-y-4 shadow-2xl rounded-2xl max-h-[90vh] flex flex-col" dir={lang === 'ku' ? 'rtl' : 'ltr'}>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 leading-snug">
                    {t('هێنانی کاڵاکان لە فایلی Excel / CSV', 'Import Products from Excel / CSV')}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {t('داخڵکردنی کاڵا بە کۆمەڵ لە ڕێگەی فایلی خشتەبەندییەوە', 'Bulk upload items via spreadsheet file')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportPreviewList([]);
                  setImportError(null);
                }}
                className="text-slate-400 hover:text-slate-900 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Download Recommendation Banner */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-amber-900 block">
                  {t('پێویستت بە فایلی نموونەییە بۆ ڕێکخستنی داتا؟', 'Need a sample file to prepare your list?')}
                </span>
                <span className="text-[11px] text-amber-700 block">
                  {t('فایلی نموونەیی داببەزێنە، داتاکانت تێدا پڕبکەرەوە و لێرەدا بەرزی بکەرەوە.', 'Download template, fill in products and upload it here.')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('داگرتنی نموونە', 'Download Template')}</span>
              </button>
            </div>

            {/* Excel UTF-8 Tip Box */}
            <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-xl p-3 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-slate-700">
                <span className="font-bold text-indigo-900 block text-xs">
                  {t('💡 بۆ ئەوەی فۆنت و پیتە کوردییەکان لە Excel تێک نەچن:', '💡 To preserve Kurdish letters in Excel:')}
                </span>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {t(
                    'کاتێک فایلەکە لە پرۆگرامی Excel دەستکاری دەکەیت و پاشەکەوتی (Save As) دەکەیتەوە، دڵنیابە لە هەڵبژاردنی جۆری فایل: "CSV UTF-8 (Comma delimited) (*.csv)" تاوەکو پیتە کوردییەکان نەبنە نیشانەی پرسیار (????).',
                    'When saving in Excel, make sure to choose "CSV UTF-8 (Comma delimited) (*.csv)" so Kurdish characters do not turn into question marks (????).'
                  )}
                </p>
              </div>
            </div>

            {/* File Upload Drop Area */}
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/20 rounded-2xl p-6 text-center transition-all relative">
              <input
                type="file"
                accept=".csv,.tsv,.txt,.json"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <div className="space-y-2 pointer-events-none">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
                  <FileUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {t('فایلی Excel / CSV ڕابکێشە ئێرە یان کلیک بکە بۆ دیاریکردن', 'Drag & drop Excel / CSV file here or click to browse')}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t('فۆرماتە پشتیوانیکراوەکان: .csv, .tsv, .txt, .json', 'Supported formats: .csv, .tsv, .txt, .json')}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {importError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Warning if characters turned into ??? */}
            {importPreviewList.some((p) => p.nameKu.includes('???') || p.name.includes('???')) && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">{t('ئاگاداری: پیتە کوردییەکان بوونەتە نیشانەی پرسیار (????)!', 'Warning: Text was saved as question marks (????)!')}</span>
                  <span className="text-[11px] text-rose-700 block mt-0.5">
                    {t(
                      'ئەمە بەهۆی ئەوەیە کاتێک لە Excel فایلەکەت پاشەکەوت کردووە جۆری ئاسایی CSV هەڵبژێردراوە. بۆ چارەسەر: فایلەکە لە Excel بکەرەوە، بڕۆ بۆ File -> Save As و جۆری فایلەکە بکە بە "CSV UTF-8 (Comma delimited) (*.csv)".',
                      'This happened because Excel saved it as standard ANSI CSV. To fix: Open the file in Excel, click Save As and select "CSV UTF-8 (Comma delimited) (*.csv)".'
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Preview Section */}
            {importPreviewList.length > 0 && (
              <div className="flex-1 flex flex-col min-h-0 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    {t('پێشبینینی کاڵا دۆزراوەکان:', 'Preview of detected products:')}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                    {importPreviewList.length} {t('کاڵا ئامادەیە بۆ هاوردەکردن', 'items ready to import')}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl max-h-48">
                  <table className="w-full text-xs text-start border-collapse">
                    <thead className="bg-[#f1f5f9] text-slate-700 font-bold border-b border-slate-300 sticky top-0 text-[11px]">
                      <tr>
                        <th className="p-2 text-start">{t('ناوی کاڵا', 'Name')}</th>
                        <th className="p-2 text-center">{t('بارکۆد', 'Barcode')}</th>
                        <th className="p-2 text-center">{t('تێچوو', 'Cost')}</th>
                        <th className="p-2 text-center">{t('فرۆشتن', 'Price')}</th>
                        <th className="p-2 text-center">{t('کۆگا', 'Stock')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-sans">
                      {importPreviewList.slice(0, 15).map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 text-[11px]">
                          <td className="p-2 font-bold text-slate-800">{p.nameKu || p.name}</td>
                          <td className="p-2 text-center font-mono text-slate-600">{p.barcode || '-'}</td>
                          <td className="p-2 text-center font-mono">{formatCurrency(p.costPrice, currency, lang, exchangeRate)}</td>
                          <td className="p-2 text-center font-mono font-bold text-indigo-600">{formatCurrency(p.retailPrice, currency, lang, exchangeRate)}</td>
                          <td className="p-2 text-center font-mono font-bold">{p.stockQuantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importPreviewList.length > 15 && (
                  <p className="text-[10px] text-slate-400 text-center">
                    {t(`پیشاندانی ١٥ لە کۆی ${importPreviewList.length} کاڵا`, `Showing 15 of ${importPreviewList.length} products`)}
                  </p>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportPreviewList([]);
                  setImportError(null);
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {t('پاشگەزبوونەوە', 'Cancel')}
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importPreviewList.length === 0}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                  importPreviewList.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {importPreviewList.length > 0
                    ? t(`تۆمارکردن و هێنانی (${importPreviewList.length}) کاڵا`, `Import (${importPreviewList.length}) Products`)
                    : t('تۆمارکردنی کاڵاکان', 'Import Products')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
