import React from 'react';
import {
  Tag,
  Search,
  ChevronDown,
  Percent,
  Save,
  X,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Calendar,
  Image as ImageIcon,
  Printer,
  Download,
  Clock,
  Sparkles,
  Smartphone,
  Square,
  Copy,
  Check,
  Flame,
  Palette,
  Layers,
  ShoppingBag,
  TrendingDown,
  ArrowDownRight,
} from 'lucide-react';
import { Product, Category, SystemConfig } from '../types';
import { Currency, formatCurrency } from '../utils/currency';
import { getSampleImageForProduct } from '../utils/productImages';

interface DiscountsManagerProps {
  products: Product[];
  categories: Category[];
  onUpdateProduct: (product: Product) => void;
  systemConfig?: SystemConfig;
  lang?: 'en' | 'ku';
  currency?: Currency;
  exchangeRate?: number;
}

export const DiscountsManager: React.FC<DiscountsManagerProps> = ({
  products,
  categories,
  onUpdateProduct,
  systemConfig,
  lang = 'ku',
  currency = 'IQD',
  exchangeRate = 1500,
}) => {
  const t = (ku: string, en: string) => (lang === 'ku' ? ku : en);

  // Sub-Tab & Filter state
  const [activeTab, setActiveTab] = React.useState<'all' | 'discounted' | 'timed'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [selectedProductIds, setSelectedProductIds] = React.useState<Set<string>>(new Set());
  const [feedback, setFeedback] = React.useState<string>('');

  // Bulk Discount Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = React.useState(false);
  const [bulkDiscountType, setBulkDiscountType] = React.useState<'fixed' | 'percent'>('fixed');
  const [bulkFixedPrices, setBulkFixedPrices] = React.useState<Record<string, number>>({});
  const [bulkPercentValue, setBulkPercentValue] = React.useState<number | ''>('');
  const [bulkCustomerLimit, setBulkCustomerLimit] = React.useState<string>('2');
  const [bulkEndDate, setBulkEndDate] = React.useState<string>('');

  // Single Product Discount Modal State
  const [singleDiscountModalProduct, setSingleDiscountModalProduct] = React.useState<Product | null>(null);
  const [singleDiscountType, setSingleDiscountType] = React.useState<'percent' | 'fixed'>('percent');
  const [singlePercentValue, setSinglePercentValue] = React.useState<number | ''>(15);
  const [singleFixedPrice, setSingleFixedPrice] = React.useState<number>(0);
  const [singleCustomerLimit, setSingleCustomerLimit] = React.useState<string>('');
  const [singleEndDate, setSingleEndDate] = React.useState<string>('');

  const handleOpenSingleDiscountModal = (product: Product) => {
    setSingleDiscountModalProduct(product);
    if (product.promotionDiscount && product.promotionDiscount > 0) {
      setSingleDiscountType('percent');
      setSinglePercentValue(product.promotionDiscount);
      setSingleFixedPrice(Math.round(product.retailPrice - (product.retailPrice * product.promotionDiscount) / 100));
    } else {
      setSingleDiscountType('percent');
      setSinglePercentValue(15);
      setSingleFixedPrice(Math.round(product.retailPrice * 0.85));
    }
    setSingleCustomerLimit(product.promotionLimit ? String(product.promotionLimit) : '');
    setSingleEndDate(product.promotionEnd || '');
  };

  const computedSingleFinalPrice = singleDiscountModalProduct
    ? singleDiscountType === 'percent'
      ? Math.max(0, Math.round(singleDiscountModalProduct.retailPrice - (singleDiscountModalProduct.retailPrice * (Number(singlePercentValue) || 0)) / 100))
      : Math.max(0, singleFixedPrice)
    : 0;

  const handleSaveSingleDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleDiscountModalProduct) return;

    let promoPercent = 0;
    if (singleDiscountType === 'percent') {
      promoPercent = Number(singlePercentValue) || 0;
    } else {
      if (singleFixedPrice < singleDiscountModalProduct.retailPrice && singleDiscountModalProduct.retailPrice > 0) {
        promoPercent = Number((((singleDiscountModalProduct.retailPrice - singleFixedPrice) / singleDiscountModalProduct.retailPrice) * 100).toFixed(2));
      } else {
        promoPercent = 0;
      }
    }

    const limitNum = parseInt(singleCustomerLimit) || undefined;

    onUpdateProduct({
      ...singleDiscountModalProduct,
      promotionDiscount: promoPercent > 0 ? promoPercent : undefined,
      promotionEnd: singleEndDate || undefined,
      promotionLimit: limitNum,
    });

    setSingleDiscountModalProduct(null);
    setFeedback(t(`داشکاندن پاشەکەوتکرا بۆ ${singleDiscountModalProduct.nameKu || singleDiscountModalProduct.name}`, `Discount saved for ${singleDiscountModalProduct.name}`));
    setTimeout(() => setFeedback(''), 3000);
  };

  // Offer Poster Modal State & Designer Controls
  const [activePosterProduct, setActivePosterProduct] = React.useState<Product | null>(null);
  const [posterTheme, setPosterTheme] = React.useState<'dark_luxury' | 'clean_studio' | 'vibrant_crimson'>('dark_luxury');
  const [posterRatio, setPosterRatio] = React.useState<'square' | 'story'>('square');
  const [copyToast, setCopyToast] = React.useState<boolean>(false);

  // Category helpers
  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return '';
    return lang === 'ku' ? cat.nameKu || cat.name : cat.name;
  };

  // KPIs Calculations
  const activeProducts = products.filter((p) => p.isActive);
  const discountedProductsList = activeProducts.filter((p) => p.promotionDiscount && p.promotionDiscount > 0);
  const timedOffersList = discountedProductsList.filter((p) => p.promotionEnd);
  
  const avgDiscount = discountedProductsList.length > 0
    ? Math.round(discountedProductsList.reduce((sum, p) => sum + (p.promotionDiscount || 0), 0) / discountedProductsList.length)
    : 0;

  // Filtered products list
  const filteredProducts = activeProducts
    .filter((p) => {
      if (activeTab === 'discounted') return p.promotionDiscount && p.promotionDiscount > 0;
      if (activeTab === 'timed') return p.promotionDiscount && p.promotionDiscount > 0 && p.promotionEnd;
      return true;
    })
    .filter((p) => {
      if (categoryFilter !== 'all' && p.categoryId !== categoryFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (p.nameKu || p.name).toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q)
      );
    });

  // Toggle select
  const toggleSelect = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const selectedProducts = products.filter((p) => selectedProductIds.has(p.id));

  // Open Bulk Modal
  const handleOpenBulkModal = () => {
    if (selectedProductIds.size === 0) return;

    const initialPrices: Record<string, number> = {};
    selectedProducts.forEach((p) => {
      if (p.promotionDiscount && p.promotionDiscount > 0) {
        const discounted = p.retailPrice - (p.retailPrice * p.promotionDiscount) / 100;
        initialPrices[p.id] = Math.round(discounted);
      } else {
        initialPrices[p.id] = p.retailPrice;
      }
    });

    setBulkFixedPrices(initialPrices);
    setBulkPercentValue('');
    setBulkCustomerLimit('2');
    setBulkEndDate('');
    setIsBulkModalOpen(true);
  };

  // Submit Bulk Discount
  const handleSaveBulkDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseInt(bulkCustomerLimit) || undefined;

    selectedProducts.forEach((p) => {
      let promoPercent = 0;
      if (bulkDiscountType === 'fixed') {
        const newFixed = bulkFixedPrices[p.id] ?? p.retailPrice;
        if (newFixed < p.retailPrice && p.retailPrice > 0) {
          promoPercent = Number((((p.retailPrice - newFixed) / p.retailPrice) * 100).toFixed(2));
        } else {
          promoPercent = 0;
        }
      } else {
        promoPercent = Number(bulkPercentValue) || 0;
      }

      onUpdateProduct({
        ...p,
        promotionDiscount: promoPercent > 0 ? promoPercent : undefined,
        promotionEnd: bulkEndDate || undefined,
        promotionLimit: limitNum,
      });
    });

    setIsBulkModalOpen(false);
    setSelectedProductIds(new Set());
    setFeedback(
      t(
        `داشکاندن بەسەر ${selectedProducts.length} کاڵادا پاشەکەوتکرا`,
        `Discount applied to ${selectedProducts.length} products`
      )
    );
    setTimeout(() => setFeedback(''), 3000);
  };

  // Remove discount from selected
  const handleRemoveSelectedDiscounts = () => {
    selectedProducts.forEach((p) => {
      onUpdateProduct({
        ...p,
        promotionDiscount: 0,
        promotionEnd: undefined,
        promotionLimit: undefined,
      });
    });
    setSelectedProductIds(new Set());
    setFeedback(t('داشکاندنی کاڵا دیاریکراوەکان لابرا', 'Discounts removed from selected products'));
    setTimeout(() => setFeedback(''), 3000);
  };

  // Remove single discount
  const removeDiscount = (product: Product) => {
    onUpdateProduct({
      ...product,
      promotionDiscount: 0,
      promotionEnd: undefined,
      promotionLimit: undefined,
    });
    setFeedback(t('داشکاندن لابرا', 'Discount removed'));
    setTimeout(() => setFeedback(''), 2000);
  };

  // Download Offer Poster as Ultra-HD PNG
  const handleDownloadPosterPNG = (product: Product) => {
    const canvas = document.createElement('canvas');
    const isStory = posterRatio === 'story';
    const width = isStory ? 1080 : 1200;
    const height = isStory ? 1920 : 1200;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const storeName = systemConfig?.shopNameKu || systemConfig?.shopNameEn || 'پەراوگەی باران';
    const phone = systemConfig?.phone || '0750 000 0000';
    const address = systemConfig?.address || 'سلێمانی - شەقامی سەرەکی';
    const pName = lang === 'ku' ? product.nameKu || product.name : product.name;
    const discountedPrice = product.promotionDiscount
      ? Math.round(product.retailPrice - (product.retailPrice * product.promotionDiscount) / 100)
      : product.retailPrice;

    // 1. Draw Background based on theme
    if (posterTheme === 'clean_studio') {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(1, '#f1f5f9');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(99, 102, 241, 0.06)';
      ctx.lineWidth = 140;
      ctx.beginPath();
      ctx.arc(width / 2, height * 0.4, isStory ? 550 : 420, 0, Math.PI * 2);
      ctx.stroke();
    } else if (posterTheme === 'vibrant_crimson') {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#e1144a');
      bgGrad.addColorStop(0.45, '#9f1239');
      bgGrad.addColorStop(1, '#4c0519');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const radGrad = ctx.createRadialGradient(width / 2, height * 0.35, 50, width / 2, height * 0.35, 600);
      radGrad.addColorStop(0, 'rgba(251, 113, 133, 0.3)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Dark Luxury Midnight (Default)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(0.45, '#0f172a');
      bgGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const radGrad = ctx.createRadialGradient(width / 2, height * 0.35, 50, width / 2, height * 0.35, 600);
      radGrad.addColorStop(0, 'rgba(99, 102, 241, 0.22)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.strokeStyle = posterTheme === 'clean_studio' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // 2. Top Header Bar
    const topY = isStory ? 100 : 70;

    // Special Offer Tag
    ctx.fillStyle = posterTheme === 'clean_studio' ? '#ef4444' : '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(isStory ? 60 : 70, topY, isStory ? 260 : 280, 56, 12);
    ctx.fill();
    ctx.fillStyle = posterTheme === 'clean_studio' ? '#ffffff' : '#0f172a';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔥 ئۆفەری تایبەت', (isStory ? 60 : 70) + (isStory ? 130 : 140), topY + 37);

    // Store Name Badge
    ctx.fillStyle = posterTheme === 'clean_studio' ? '#ffffff' : 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    const storeBadgeW = isStory ? 340 : 380;
    const storeBadgeX = width - (isStory ? 60 : 70) - storeBadgeW;
    ctx.roundRect(storeBadgeX, topY, storeBadgeW, 56, 12);
    ctx.fill();
    ctx.strokeStyle = posterTheme === 'clean_studio' ? 'rgba(0,0,0,0.1)' : 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = posterTheme === 'clean_studio' ? '#0f172a' : '#ffffff';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText(`✨ ${storeName}`, storeBadgeX + storeBadgeW / 2, topY + 37);

    // 3. Product Image Showcase Box
    const imgSize = isStory ? 520 : 460;
    const imgX = (width - imgSize) / 2;
    const imgY = isStory ? 240 : 170;

    ctx.save();
    ctx.shadowColor = posterTheme === 'clean_studio' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 15;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(imgX, imgY, imgSize, imgSize, 24);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = posterTheme === 'clean_studio' ? '#e2e8f0' : '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(imgX, imgY, imgSize, imgSize, 24);
    ctx.stroke();

    const prodImg = new Image();
    prodImg.crossOrigin = 'anonymous';
    const imgSrc = product.image || getSampleImageForProduct(product.nameKu || product.name, product.categoryId);
    prodImg.src = imgSrc;

    const renderRemaining = () => {
      if (product.promotionDiscount && product.promotionDiscount > 0) {
        ctx.save();
        ctx.shadowColor = 'rgba(225, 20, 74, 0.5)';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#e1144a';
        ctx.beginPath();
        ctx.roundRect(imgX - 20, imgY + 25, 140, 56, 16);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'black 28px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`-%${Math.round(product.promotionDiscount)}`, imgX + 50, imgY + 39);
        ctx.restore();
      }

      const titleY = imgY + imgSize + (isStory ? 80 : 65);
      ctx.fillStyle = posterTheme === 'clean_studio' ? '#0f172a' : '#ffffff';
      ctx.font = 'black 42px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pName, width / 2, titleY);

      if (product.barcode) {
        ctx.fillStyle = posterTheme === 'clean_studio' ? '#64748b' : 'rgba(255, 255, 255, 0.6)';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`کۆد: ${product.barcode}`, width / 2, titleY + 34);
      }

      const priceBoxY = titleY + (isStory ? 80 : 55);
      const priceBoxH = isStory ? 140 : 120;
      const priceBoxW = width - (isStory ? 120 : 140);
      const priceBoxX = (width - priceBoxW) / 2;

      ctx.fillStyle = posterTheme === 'clean_studio'
        ? 'rgba(255, 255, 255, 0.9)'
        : 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.roundRect(priceBoxX, priceBoxY, priceBoxW, priceBoxH, 20);
      ctx.fill();
      ctx.strokeStyle = posterTheme === 'clean_studio'
        ? 'rgba(99, 102, 241, 0.3)'
        : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = posterTheme === 'clean_studio' ? '#4f46e5' : '#fde047';
      ctx.font = 'black 54px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${discountedPrice.toLocaleString()} د.ع`, width / 2 - 140, priceBoxY + priceBoxH / 2 + 18);

      ctx.fillStyle = posterTheme === 'clean_studio' ? '#94a3b8' : 'rgba(255, 255, 255, 0.6)';
      ctx.font = 'bold 30px Arial, sans-serif';
      const oldText = `${product.retailPrice.toLocaleString()} د.ع`;
      const oldX = width / 2 + 170;
      const oldY = priceBoxY + priceBoxH / 2 + 12;
      ctx.fillText(oldText, oldX, oldY);
      const oldW = ctx.measureText(oldText).width;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(oldX - oldW / 2 - 8, oldY - 10);
      ctx.lineTo(oldX + oldW / 2 + 8, oldY - 10);
      ctx.stroke();

      const infoY = priceBoxY + priceBoxH + (isStory ? 45 : 30);
      const infoBoxW = (priceBoxW - 24) / 2;
      const infoBoxH = isStory ? 120 : 100;

      ctx.fillStyle = posterTheme === 'clean_studio' ? '#ffffff' : 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.roundRect(priceBoxX, infoY, infoBoxW, infoBoxH, 16);
      ctx.fill();
      ctx.strokeStyle = posterTheme === 'clean_studio' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = posterTheme === 'clean_studio' ? '#64748b' : 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText('عەدەدی ڕێگەپێدراو', priceBoxX + infoBoxW / 2, infoY + 36);
      ctx.fillStyle = posterTheme === 'clean_studio' ? '#0f172a' : '#ffffff';
      ctx.font = 'black 26px Arial, sans-serif';
      ctx.fillText(
        product.promotionLimit ? `تەنها ${product.promotionLimit} دانە` : 'بێ سنوور',
        priceBoxX + infoBoxW / 2,
        infoY + 76
      );

      const box2X = priceBoxX + infoBoxW + 24;
      ctx.fillStyle = posterTheme === 'clean_studio' ? '#ffffff' : 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.roundRect(box2X, infoY, infoBoxW, infoBoxH, 16);
      ctx.fill();
      ctx.strokeStyle = posterTheme === 'clean_studio' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = posterTheme === 'clean_studio' ? '#64748b' : 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText('کۆتایی ئۆفەر', box2X + infoBoxW / 2, infoY + 36);
      ctx.fillStyle = posterTheme === 'clean_studio' ? '#0f172a' : '#ffffff';
      ctx.font = 'black 26px Arial, sans-serif';
      ctx.fillText(product.promotionEnd || 'کاتی دیارینەکراو', box2X + infoBoxW / 2, infoY + 76);

      const footerY = isStory ? height - 100 : height - 60;
      ctx.fillStyle = posterTheme === 'clean_studio' ? '#475569' : 'rgba(255, 255, 255, 0.75)';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText(`📞 پەیوەندی: ${phone}   📍 ناونیشان: ${address}`, width / 2, footerY);

      const link = document.createElement('a');
      link.download = `Offer_${product.name.replace(/\s+/g, '_')}_${posterRatio}_${posterTheme}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    };

    prodImg.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imgX + 8, imgY + 8, imgSize - 16, imgSize - 16, 18);
      ctx.clip();
      ctx.drawImage(prodImg, imgX + 8, imgY + 8, imgSize - 16, imgSize - 16);
      ctx.restore();
      renderRemaining();
    };
    prodImg.onerror = () => {
      renderRemaining();
    };
  };

  // Copy Poster to Clipboard
  const handleCopyPosterToClipboard = (product: Product) => {
    handleDownloadPosterPNG(product);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2500);
  };

  return (
    <div className="flex-1 bg-zinc-100 p-6 flex flex-col overflow-y-auto text-zinc-900 font-sans select-none gap-4">
      
      {/* ── Executive Header Control Bar (Matching ReportsManager) ── */}
      <div className="bg-zinc-900 text-white border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-none shadow-sm shrink-0">
        <div>
          <h1 className="text-base font-black uppercase tracking-wider text-zinc-100 flex items-center gap-2 font-sans">
            <Percent className="w-5 h-5 text-zinc-300" />
            {t('بەڕێوەبردنی داشکاندن و ئۆفەری بەرهەمەکان', 'Product Discounts & Promotional Offers')}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5 font-sans">
            {t('دیاریکردنی داشکاندنی نرخ لەسەر کاڵاکان، ئۆفەری کاتی و دروستکردنی پۆستەری ڕێکلام', 'Manage product discount pricing, bulk promotions and export ad posters')}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {feedback && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-bold font-sans">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Remove selected discounts */}
          {selectedProductIds.size > 0 && (
            <button
              type="button"
              onClick={handleRemoveSelectedDiscounts}
              className="h-8 px-3 bg-zinc-800 hover:bg-zinc-700 text-rose-300 border border-zinc-700 text-xs font-bold rounded-none flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('سڕینەوەی داشکاندن', 'Remove Discount')}</span>
            </button>
          )}

          {/* Bulk Discount Action Button */}
          <button
            type="button"
            onClick={handleOpenBulkModal}
            disabled={selectedProductIds.size === 0}
            className={`h-8 px-3.5 text-xs font-bold rounded-none flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
              selectedProductIds.size > 0
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>
              {selectedProductIds.size > 0
                ? t(`داشکاندن بکە (${selectedProductIds.size})`, `Apply Discount (${selectedProductIds.size})`)
                : t('داشکاندنی بەکۆمەڵ', 'Bulk Discount')}
            </span>
          </button>
        </div>
      </div>

      {/* ── Executive KPI Metrics Cards (4 Columns) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-sans shrink-0">
        {/* Card 1: Active Promo Items */}
        <div className="bg-white border border-zinc-300 p-4 space-y-1.5 rounded-none shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">
              {t('کۆی کاڵا داشکێندراوەکان', 'Active Discounted Items')}
            </span>
            <Tag className="w-4 h-4 text-zinc-700" />
          </div>
          <span className="text-2xl font-black text-rose-600 block font-mono">
            {discountedProductsList.length}
            <span className="text-xs font-bold text-zinc-500 font-sans mx-1.5">{t('کاڵا', 'items')}</span>
          </span>
          <div className="text-[11px] text-zinc-500 font-mono">
            {t(`لە کۆی ${activeProducts.length} کاڵای چالاک`, `Out of ${activeProducts.length} active products`)}
          </div>
        </div>

        {/* Card 2: Average Discount Rate */}
        <div className="bg-white border border-zinc-300 p-4 space-y-1.5 rounded-none shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">
              {t('تێکڕای ڕێژەی داشکاندن', 'Average Discount Rate')}
            </span>
            <Percent className="w-4 h-4 text-zinc-700" />
          </div>
          <span className="text-2xl font-black text-zinc-900 block font-mono">
            %{avgDiscount}
          </span>
          <div className="text-[11px] text-zinc-500 font-mono">
            {t('ڕێژەی داشکاندن بەسەر کاڵاکاندا', 'Average discount percentage')}
          </div>
        </div>

        {/* Card 3: Time-Limited Offers */}
        <div className="bg-white border border-zinc-300 p-4 space-y-1.5 rounded-none shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">
              {t('ئۆفەرە کاتییەکان', 'Time-Limited Offers')}
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-black text-amber-600 block font-mono">
            {timedOffersList.length}
            <span className="text-xs font-bold text-zinc-500 font-sans mx-1.5">{t('ئۆفەر', 'offers')}</span>
          </span>
          <div className="text-[11px] text-zinc-500 font-mono">
            {t('بەرواری کۆتایی هاتنیان هەیە', 'Have expiry end dates')}
          </div>
        </div>

        {/* Card 4: Total Catalog Items */}
        <div className="bg-white border border-zinc-300 p-4 space-y-1.5 rounded-none shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">
              {t('کۆی بەرهەمە چالاکەکان', 'Total Active Products')}
            </span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-700 block font-mono">
            {activeProducts.length}
            <span className="text-xs font-bold text-zinc-500 font-sans mx-1.5">{t('بەرهەم', 'products')}</span>
          </span>
          <div className="text-[11px] text-zinc-500 font-mono">
            {t(`لە ${categories.length} بەشی جیاوازدا`, `Across ${categories.length} categories`)}
          </div>
        </div>
      </div>

      {/* ── Sub-Tabs & Filtering Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        {/* Sub-Tab Selector Buttons */}
        <div className="flex items-center bg-zinc-200 border border-zinc-300 p-0.5 rounded-none h-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`h-full px-3.5 font-bold uppercase text-[11px] transition-all rounded-none flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'all' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t(`هەموو کاڵاکان (${activeProducts.length})`, `All Items (${activeProducts.length})`)}</span>
          </button>

          <button
            onClick={() => setActiveTab('discounted')}
            className={`h-full px-3.5 font-bold uppercase text-[11px] transition-all rounded-none flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'discounted' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-rose-600" />
            <span>{t(`داشکێندراوەکان (${discountedProductsList.length})`, `Discounted (${discountedProductsList.length})`)}</span>
          </button>

          <button
            onClick={() => setActiveTab('timed')}
            className={`h-full px-3.5 font-bold uppercase text-[11px] transition-all rounded-none flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'timed' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{t(`ئۆفەری کاتی (${timedOffersList.length})`, `Timed Offers (${timedOffersList.length})`)}</span>
          </button>
        </div>

        {/* Category Filter & Search Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-8 pl-3 pr-7 rtl:pr-3 rtl:pl-7 bg-white border border-zinc-300 text-xs font-bold text-zinc-800 rounded-none appearance-none cursor-pointer shadow-2xs outline-none focus:border-zinc-700"
            >
              <option value="all">{t('هەموو بەشەکان', 'All Categories')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {lang === 'ku' ? cat.nameKu || cat.name : cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute top-1/2 -translate-y-1/2 left-2 rtl:left-auto rtl:right-auto rtl:left-2 pointer-events-none" />
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute top-1/2 -translate-y-1/2 right-2.5 rtl:right-auto rtl:left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder={t('گەڕان بەدوای ناو یان بارکۆد...', 'Search by name or barcode...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-56 bg-white border border-zinc-300 rounded-none pr-8 rtl:pr-2.5 rtl:pl-8 pl-2.5 text-xs text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-zinc-700 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* ── Main Data Table (Matching Reports & Shift Tables) ── */}
      <div className="bg-white border border-zinc-300 rounded-none shadow-2xs overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-xs text-start border-collapse min-w-[950px]">
            <thead className="bg-zinc-900 text-white font-mono text-[11px] uppercase sticky top-0 z-10">
              <tr className="divide-x rtl:divide-x-reverse divide-zinc-800">
                {/* Checkbox */}
                <th className="py-2.5 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedProductIds.size === filteredProducts.length}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded-none border-zinc-400 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                  />
                </th>
                <th className="py-2.5 px-4 text-start font-sans">{t('کاڵا و بارکۆد', 'Product & Barcode')}</th>
                <th className="py-2.5 px-4 text-center font-sans">{t('بەش', 'Category')}</th>
                <th className="py-2.5 px-4 text-center font-sans">{t('نرخی ئاسایی', 'Regular Price')}</th>
                <th className="py-2.5 px-4 text-center font-sans">{t('ڕێژەی داشکاندن', 'Discount')}</th>
                <th className="py-2.5 px-4 text-center font-sans">{t('عەدەدی ڕێگەپێدراو', 'Allowed Qty')}</th>
                <th className="py-2.5 px-4 text-center font-sans">{t('نرخی نوێ', 'New Price')}</th>
                <th className="py-2.5 px-4 text-center font-sans">{t('کۆتایی ئۆفەر', 'End Date')}</th>
                <th className="py-2.5 px-4 text-center font-sans">{t('کردارەکان', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs font-sans">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-zinc-400 font-bold">
                    {t('هیچ کاڵایەک نەدۆزرایەوە', 'No products found')}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const hasDiscount = product.promotionDiscount && product.promotionDiscount > 0;
                  const discountedPrice = hasDiscount
                    ? Math.round(product.retailPrice - (product.retailPrice * (product.promotionDiscount || 0)) / 100)
                    : product.retailPrice;
                  const isChecked = selectedProductIds.has(product.id);

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-zinc-50 divide-x rtl:divide-x-reverse divide-zinc-100 transition-colors ${
                        isChecked ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(product.id)}
                          className="w-3.5 h-3.5 rounded-none border-zinc-400 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                        />
                      </td>

                      {/* Product Name & Barcode */}
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-zinc-900 text-xs leading-snug">
                          {lang === 'ku' ? product.nameKu || product.name : product.name}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                          {product.barcode || product.sku}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-2.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 bg-zinc-100 border border-zinc-300 text-zinc-700 text-[10px] font-bold rounded-none">
                          {getCategoryName(product.categoryId)}
                        </span>
                      </td>

                      {/* Regular Price */}
                      <td className="py-2.5 px-4 text-center font-bold font-mono">
                        {hasDiscount ? (
                          <span className="line-through text-zinc-400">
                            {formatCurrency(product.retailPrice, currency, lang, exchangeRate)}
                          </span>
                        ) : (
                          <span className="text-zinc-700">
                            {formatCurrency(product.retailPrice, currency, lang, exchangeRate)}
                          </span>
                        )}
                      </td>

                      {/* Discount Type Badge */}
                      <td className="py-2.5 px-4 text-center">
                        {hasDiscount ? (
                          <span className="inline-block px-2 py-0.5 bg-rose-50 border border-rose-300 text-rose-700 text-[11px] font-black font-mono rounded-none">
                            -%{Math.round(product.promotionDiscount || 0)}
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>

                      {/* Customer Allowed Limit */}
                      <td className="py-2.5 px-4 text-center">
                        {hasDiscount && product.promotionLimit ? (
                          <span className="font-bold font-mono text-amber-700">
                            {product.promotionLimit} {t('دانە', 'pcs')}
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>

                      {/* New Price */}
                      <td className="py-2.5 px-4 text-center font-black font-mono text-emerald-700">
                        {formatCurrency(discountedPrice, currency, lang, exchangeRate)}
                      </td>

                      {/* End Date */}
                      <td className="py-2.5 px-4 text-center font-mono">
                        {hasDiscount && product.promotionEnd ? (
                          <span className="text-amber-700 font-bold flex items-center justify-center gap-1 text-[11px]">
                            <span>{product.promotionEnd}</span>
                            <Clock className="w-3 h-3 text-amber-600" />
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Set/Edit Single Discount Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenSingleDiscountModal(product)}
                            className={`p-1.5 border rounded-none transition-all cursor-pointer shadow-2xs ${
                              hasDiscount
                                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            }`}
                            title={hasDiscount ? t('دەستکاریکردنی داشکاندن', 'Edit Discount') : t('دانانی داشکاندن', 'Set Discount')}
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>

                          {hasDiscount && (
                            <button
                              type="button"
                              onClick={() => setActivePosterProduct(product)}
                              className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 rounded-none transition-all cursor-pointer shadow-2xs"
                              title={t('پێشاندانی وێنەی ڕێکلامی ئۆفەر', 'Show Offer Poster')}
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {hasDiscount && (
                            <button
                              type="button"
                              onClick={() => removeDiscount(product)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-none transition-all cursor-pointer"
                              title={t('سڕینەوەی داشکاندن', 'Remove Discount')}
                            >
                              <X className="w-3.5 h-3.5" />
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

      {/* ── Bulk Discount Modal (Minimal Formal) ── */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-lg shadow-2xl font-sans text-zinc-900 overflow-hidden rounded-none flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-zinc-900 text-white px-5 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-rose-400" />
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  {t('داشکاندن بکە بەسەر کاڵاکان', 'Apply Discount to Products')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveBulkDiscount} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Alert Info Banner */}
              <div className="bg-zinc-50 border border-zinc-300 p-3 flex items-start gap-2 text-zinc-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="font-bold leading-relaxed">
                  {t(
                    `داشکاندن دەکرێت بەسەر ${selectedProducts.length} کاڵای دیاریکراودا. کاتێک بەروارەکە بەسەرچوو خۆکارانە دەگەڕێتەوە نرخی ئاسایی.`,
                    `Discount will be applied to ${selectedProducts.length} selected items. Once expired, prices will automatically revert to regular.`
                  )}
                </div>
              </div>

              {/* Segmented Switch: جۆری داشکاندن */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-800 block">
                  {t('جۆری داشکاندن', 'Discount Type')}
                </label>
                <div className="grid grid-cols-2 gap-1 bg-zinc-200 border border-zinc-300 p-0.5 rounded-none">
                  {/* Option 1: Fixed New Price */}
                  <button
                    type="button"
                    onClick={() => setBulkDiscountType('fixed')}
                    className={`py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all rounded-none cursor-pointer ${
                      bulkDiscountType === 'fixed'
                        ? 'bg-white text-zinc-900 font-black shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>{t('نرخی نوێی جێگیر', 'Fixed New Price')}</span>
                  </button>

                  {/* Option 2: % Percentage */}
                  <button
                    type="button"
                    onClick={() => setBulkDiscountType('percent')}
                    className={`py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all rounded-none cursor-pointer ${
                      bulkDiscountType === 'percent'
                        ? 'bg-white text-zinc-900 font-black shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>{t('ڕێژەی سەدی (%)', '% Percentage')}</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Price List (if fixed mode) */}
              {bulkDiscountType === 'fixed' ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-800 block">
                    {t('نرخی نوێ بۆ هەر کاڵایەک دیاری بکە:', 'Specify new price for each product:')}
                  </label>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {selectedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-zinc-50 border border-zinc-200 p-2.5 flex items-center justify-between gap-3"
                      >
                        {/* Price Input */}
                        <div className="w-28 shrink-0">
                          <input
                            type="number"
                            required
                            value={bulkFixedPrices[product.id] ?? product.retailPrice}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setBulkFixedPrices((prev) => ({ ...prev, [product.id]: val }));
                            }}
                            className="w-full h-8 bg-white border border-zinc-300 focus:border-zinc-900 px-2 text-center text-xs font-mono font-bold text-zinc-900 outline-none rounded-none shadow-2xs"
                          />
                        </div>

                        {/* Product info */}
                        <div className="text-end min-w-0">
                          <div className="text-xs font-bold text-zinc-800 truncate">
                            {lang === 'ku' ? product.nameKu || product.name : product.name}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                            {t('نرخی ئاسایی:', 'Regular:')}{' '}
                            <span className="font-bold text-zinc-600">
                              {product.retailPrice.toLocaleString()} {t('د.ع.', 'IQD')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Percentage Mode Input */
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-800 block">
                    {t('ڕێژەی داشکاندن دیاری بکە (%):', 'Enter discount percentage (%):')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      placeholder="15"
                      value={bulkPercentValue}
                      onChange={(e) => setBulkPercentValue(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      className="w-full h-9 bg-white border border-zinc-300 focus:border-zinc-900 px-3 text-xs font-mono font-bold text-zinc-900 outline-none rounded-none shadow-2xs"
                    />
                    <span className="absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-auto rtl:left-3 font-black text-zinc-400 text-xs pointer-events-none">
                      %
                    </span>
                  </div>
                </div>
              )}

              {/* Customer Limit / Quota Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-800 block">
                  {t('عەدەدی ڕێگەپێدراو بۆ کڕیار (ئارەزوومەندانە)', 'Allowed quantity per customer (Optional)')}
                </label>
                <input
                  type="text"
                  placeholder={t('نموونە: ٢ دانە', 'e.g. 2 pieces')}
                  value={bulkCustomerLimit}
                  onChange={(e) => setBulkCustomerLimit(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 focus:border-zinc-900 px-3 text-xs text-zinc-800 placeholder:text-zinc-400 outline-none rounded-none shadow-2xs"
                />
                <p className="text-[10px] text-zinc-400 font-medium">
                  {t('ئەگەر خاڵی بێت، بۆ هەمووی دادەشکێت بێ سنوور.', 'If left empty, discount applies without limits.')}
                </p>
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-800 block">
                  {t('کۆتایی هاتنی داشکاندن', 'Discount End Date')}
                </label>
                <input
                  type="date"
                  value={bulkEndDate}
                  onChange={(e) => setBulkEndDate(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 focus:border-zinc-900 px-3 text-xs font-mono text-zinc-800 outline-none cursor-pointer rounded-none shadow-2xs"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="h-9 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-none transition-colors cursor-pointer"
                >
                  {t('پاشگەزبوونەوە', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-none transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5 inline-block mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                  <span>{t('پاشەکەوتکردنی داشکاندن', 'Save Discount')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Single Product Discount Modal (Minimal Formal) ── */}
      {singleDiscountModalProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md shadow-2xl font-sans text-zinc-900 overflow-hidden rounded-none flex flex-col">
            {/* Modal Header */}
            <div className="bg-zinc-900 text-white px-5 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-rose-400" />
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  {t('دانانی داشکاندن بۆ کاڵا', 'Set Product Discount')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSingleDiscountModalProduct(null)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSingleDiscount} className="p-5 space-y-4 text-xs">
              {/* Product Info Card */}
              <div className="bg-zinc-50 border border-zinc-200 p-3 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-900 text-xs">
                    {lang === 'ku' ? singleDiscountModalProduct.nameKu || singleDiscountModalProduct.name : singleDiscountModalProduct.name}
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-500">{singleDiscountModalProduct.barcode}</span>
                </div>
                <div className="text-end">
                  <span className="text-[10px] text-zinc-500 font-bold block">{t('نرخی ئاسایی', 'Regular Price')}</span>
                  <span className="font-mono font-black text-xs text-zinc-800">
                    {formatCurrency(singleDiscountModalProduct.retailPrice, currency, lang, exchangeRate)}
                  </span>
                </div>
              </div>

              {/* Discount Mode Switch: Fixed New Price vs Percentage */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-800 block">
                  {t('جۆری داشکاندن', 'Discount Method')}
                </label>
                <div className="grid grid-cols-2 gap-1 bg-zinc-200 border border-zinc-300 p-0.5 rounded-none">
                  <button
                    type="button"
                    onClick={() => setSingleDiscountType('percent')}
                    className={`py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all rounded-none cursor-pointer ${
                      singleDiscountType === 'percent'
                        ? 'bg-white text-zinc-900 font-black shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>{t('ڕێژەی سەدی (%)', 'Percentage (%)')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSingleDiscountType('fixed')}
                    className={`py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all rounded-none cursor-pointer ${
                      singleDiscountType === 'fixed'
                        ? 'bg-white text-zinc-900 font-black shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>{t('نرخی نوێی داشکێندراو', 'New Fixed Price')}</span>
                  </button>
                </div>
              </div>

              {/* Percentage Input with quick chips */}
              {singleDiscountType === 'percent' ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-zinc-800">
                      {t('ڕێژەی داشکاندن (%):', 'Discount Percentage (%):')}
                    </label>
                    <div className="flex gap-1">
                      {[5, 10, 15, 20, 25, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setSinglePercentValue(pct)}
                          className={`px-2 py-0.5 text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                            singlePercentValue === pct
                              ? 'bg-zinc-900 text-white border-zinc-900'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                          }`}
                        >
                          %{pct}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      required
                      value={singlePercentValue}
                      onChange={(e) => setSinglePercentValue(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      placeholder="15"
                      className="w-full h-9 bg-white border border-zinc-300 focus:border-zinc-900 px-3 text-xs font-mono font-bold text-zinc-900 outline-none rounded-none shadow-2xs"
                    />
                    <span className="absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-auto rtl:left-3 font-bold text-zinc-400 text-xs pointer-events-none">
                      %
                    </span>
                  </div>
                </div>
              ) : (
                /* Fixed Price Input */
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-800 block">
                    {t('نرخی نوێی فرۆشتن دیاری بکە:', 'Specify New Retail Price:')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={singleDiscountModalProduct.retailPrice}
                    required
                    value={singleFixedPrice}
                    onChange={(e) => setSingleFixedPrice(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 bg-white border border-zinc-300 focus:border-zinc-900 px-3 text-xs font-mono font-bold text-zinc-900 outline-none rounded-none shadow-2xs"
                  />
                </div>
              )}

              {/* Calculated Price Result Banner */}
              <div className="bg-emerald-50 border border-emerald-300 p-2.5 flex items-center justify-between text-emerald-900">
                <span className="font-bold text-xs">{t('نرخی کۆتایی دوای داشکاندن:', 'Final Discounted Price:')}</span>
                <span className="font-mono font-black text-sm text-emerald-700">
                  {formatCurrency(computedSingleFinalPrice, currency, lang, exchangeRate)}
                </span>
              </div>

              {/* Customer Limit / Quota Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-800 block">
                  {t('عەدەدی ڕێگەپێدراو بۆ کڕیار (ئارەزوومەندانە)', 'Allowed quantity per customer (Optional)')}
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder={t('نموونە: ٢ دانە (خاڵی بێت بێ سنوورە)', 'e.g. 2 pieces (Empty = Unlimited)')}
                  value={singleCustomerLimit}
                  onChange={(e) => setSingleCustomerLimit(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 focus:border-zinc-900 px-3 text-xs text-zinc-800 outline-none rounded-none shadow-2xs font-mono"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-800 block">
                  {t('کۆتایی هاتنی داشکاندن (بەروار)', 'Offer End Date')}
                </label>
                <input
                  type="date"
                  value={singleEndDate}
                  onChange={(e) => setSingleEndDate(e.target.value)}
                  className="w-full h-9 bg-white border border-zinc-300 focus:border-zinc-900 px-3 text-xs font-mono text-zinc-800 outline-none cursor-pointer rounded-none shadow-2xs"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSingleDiscountModalProduct(null)}
                  className="h-9 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-none transition-colors cursor-pointer"
                >
                  {t('پاشگەزبوونەوە', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-none transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5 inline-block mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                  <span>{t('پاشەکەوتکردن', 'Save Discount')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Offer Poster Designer & Preview Modal (Minimal Formal) ── */}
      {activePosterProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div 
            className="bg-white border border-zinc-300 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] rounded-none text-zinc-900"
            dir={lang === 'ku' ? 'rtl' : 'ltr'}
          >
            {/* Modal Header */}
            <div className="bg-zinc-900 text-white px-5 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-300" />
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  {t('ستۆدیۆی دیزاینی وێنەی ڕێکلامی ئۆفەر', 'Pro Offer Advertisement Studio')}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActivePosterProduct(null)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Designer Toolbar: Ratio & Theme Controls */}
            <div className="p-3 px-5 bg-zinc-100 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Ratio Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-600 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-zinc-700" />
                  {t('قەبارە:', 'Ratio:')}
                </span>
                <div className="bg-zinc-200 border border-zinc-300 p-0.5 rounded-none flex items-center h-7">
                  <button
                    type="button"
                    onClick={() => setPosterRatio('square')}
                    className={`px-2.5 h-full text-xs font-bold transition-all flex items-center gap-1 rounded-none cursor-pointer ${
                      posterRatio === 'square'
                        ? 'bg-white text-zinc-900 shadow-2xs font-black'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Square className="w-3 h-3" />
                    <span>{t('١:١ چوارگۆشە (Post)', '1:1 Square')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosterRatio('story')}
                    className={`px-2.5 h-full text-xs font-bold transition-all flex items-center gap-1 rounded-none cursor-pointer ${
                      posterRatio === 'story'
                        ? 'bg-white text-zinc-900 shadow-2xs font-black'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>{t('٩:١٦ ستۆری (Story)', '9:16 Story')}</span>
                  </button>
                </div>
              </div>

              {/* Theme Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-600 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-zinc-700" />
                  {t('تێم:', 'Theme:')}
                </span>
                <div className="bg-zinc-200 border border-zinc-300 p-0.5 rounded-none flex items-center h-7">
                  <button
                    type="button"
                    onClick={() => setPosterTheme('dark_luxury')}
                    className={`px-2.5 h-full text-xs font-bold transition-all rounded-none cursor-pointer ${
                      posterTheme === 'dark_luxury'
                        ? 'bg-zinc-900 text-white shadow-2xs font-black'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {t('تۆخی فەرمی', 'Dark Luxury')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosterTheme('clean_studio')}
                    className={`px-2.5 h-full text-xs font-bold transition-all rounded-none cursor-pointer ${
                      posterTheme === 'clean_studio'
                        ? 'bg-white text-zinc-900 shadow-2xs font-black'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {t('ستۆدیۆی سپی', 'Clean Studio')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosterTheme('vibrant_crimson')}
                    className={`px-2.5 h-full text-xs font-bold transition-all rounded-none cursor-pointer ${
                      posterTheme === 'vibrant_crimson'
                        ? 'bg-rose-600 text-white shadow-2xs font-black'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {t('سووری ئۆفەر', 'Crimson Promo')}
                  </button>
                </div>
              </div>
            </div>

            {/* Poster Card Live Display */}
            <div className="p-6 bg-zinc-100 overflow-y-auto flex items-center justify-center flex-1 min-h-[380px]">
              <div
                id="offer-poster-element"
                className={`w-full shadow-xl overflow-hidden transition-all duration-300 select-none relative flex flex-col justify-between rounded-none ${
                  posterRatio === 'story'
                    ? 'max-w-[340px] min-h-[580px] p-5.5'
                    : 'max-w-[380px] min-h-[420px] p-5'
                } ${
                  posterTheme === 'clean_studio'
                    ? 'bg-gradient-to-b from-white to-zinc-100 text-zinc-900 border border-zinc-300'
                    : posterTheme === 'vibrant_crimson'
                    ? 'bg-gradient-to-b from-[#e1144a] via-[#9f1239] to-[#4c0519] text-white border border-rose-500/30'
                    : 'bg-gradient-to-b from-[#090d16] via-[#0f172a] to-[#1e1b4b] text-white border border-zinc-700'
                }`}
              >
                {/* Poster Top Bar */}
                <div className="flex items-center justify-between gap-2 z-10">
                  <span
                    className={`px-3 py-1 font-black text-[11px] rounded-none shadow-xs flex items-center gap-1 tracking-wide ${
                      posterTheme === 'clean_studio'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-400 text-zinc-950'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    {t('ئۆفەری تایبەت', 'SPECIAL OFFER')}
                  </span>

                  <span
                    className={`px-3 py-1 font-black text-[11px] rounded-none tracking-wider font-sans border ${
                      posterTheme === 'clean_studio'
                        ? 'border-zinc-300 bg-white text-zinc-800'
                        : 'border-white/20 bg-white/10 text-white'
                    }`}
                  >
                    ✨ {systemConfig?.shopNameKu || 'پەراوگەی باران'}
                  </span>
                </div>

                {/* Product Image Box with Floating Discount Pill */}
                <div
                  className={`relative mx-auto my-3.5 bg-white p-1 rounded-none border-2 shadow-lg overflow-hidden shrink-0 z-10 flex items-center justify-center transition-all ${
                    posterRatio === 'story' ? 'w-48 h-48' : 'w-44 h-44'
                  } ${posterTheme === 'clean_studio' ? 'border-zinc-300' : 'border-white'}`}
                >
                  <img
                    src={
                      activePosterProduct.image ||
                      getSampleImageForProduct(
                        activePosterProduct.nameKu || activePosterProduct.name,
                        activePosterProduct.categoryId
                      )
                    }
                    alt={activePosterProduct.name}
                    className="w-full h-full object-cover rounded-none"
                  />
                  {activePosterProduct.promotionDiscount && activePosterProduct.promotionDiscount > 0 && (
                    <div className="absolute top-2 left-2 bg-[#e1144a] text-white px-2.5 py-0.5 font-black text-xs rounded-none shadow-lg border border-white/50 animate-pulse">
                      -%{Math.round(activePosterProduct.promotionDiscount)}
                    </div>
                  )}
                </div>

                {/* Product Title & Code */}
                <div className="text-center px-2 z-10 space-y-0.5">
                  <h2 className="font-black text-base sm:text-lg leading-tight truncate drop-shadow-xs">
                    {lang === 'ku' ? activePosterProduct.nameKu || activePosterProduct.name : activePosterProduct.name}
                  </h2>
                  {activePosterProduct.barcode && (
                    <p
                      className={`text-[11px] font-mono font-bold ${
                        posterTheme === 'clean_studio' ? 'text-zinc-500' : 'text-zinc-400'
                      }`}
                    >
                      کۆد: {activePosterProduct.barcode}
                    </p>
                  )}
                </div>

                {/* Price Banner */}
                <div
                  className={`rounded-none p-3 my-2.5 flex items-center justify-center gap-3 z-10 border transition-all ${
                    posterTheme === 'clean_studio'
                      ? 'bg-white border-zinc-300 shadow-xs'
                      : 'bg-white/10 border-white/20'
                  }`}
                >
                  <span
                    className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                      posterTheme === 'clean_studio' ? 'text-emerald-700' : 'text-yellow-300'
                    }`}
                    dir="ltr"
                  >
                    {formatCurrency(
                      activePosterProduct.promotionDiscount
                        ? Math.round(
                            activePosterProduct.retailPrice -
                              (activePosterProduct.retailPrice * activePosterProduct.promotionDiscount) / 100
                          )
                        : activePosterProduct.retailPrice,
                      currency,
                      lang,
                      exchangeRate
                    )}
                  </span>
                  <span
                    className={`line-through font-mono text-sm font-bold ${
                      posterTheme === 'clean_studio' ? 'text-zinc-400' : 'text-white/60'
                    }`}
                    dir="ltr"
                  >
                    {formatCurrency(activePosterProduct.retailPrice, currency, lang, exchangeRate)}
                  </span>
                </div>

                {/* Bottom 2 Info Boxes */}
                <div className="grid grid-cols-2 gap-2 z-10">
                  <div
                    className={`rounded-none p-2 text-center border ${
                      posterTheme === 'clean_studio'
                        ? 'bg-white border-zinc-200 shadow-2xs'
                        : 'bg-black/35 border-white/10'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold block ${
                        posterTheme === 'clean_studio' ? 'text-zinc-500' : 'text-white/70'
                      }`}
                    >
                      {t('عەدەدی ڕێگەپێدراو', 'Allowed Quantity')}
                    </span>
                    <span className="text-xs font-black font-mono block mt-0.5">
                      {activePosterProduct.promotionLimit
                        ? `${t('تەنها', 'Only')} ${activePosterProduct.promotionLimit} ${t('دانە', 'pcs')}`
                        : t('بێ سنوور', 'Unlimited')}
                    </span>
                  </div>

                  <div
                    className={`rounded-none p-2 text-center border ${
                      posterTheme === 'clean_studio'
                        ? 'bg-white border-zinc-200 shadow-2xs'
                        : 'bg-black/35 border-white/10'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold block ${
                        posterTheme === 'clean_studio' ? 'text-zinc-500' : 'text-white/70'
                      }`}
                    >
                      {t('کۆتایی ئۆفەر', 'Offer End')}
                    </span>
                    <span className="text-xs font-black font-mono block mt-0.5">
                      {activePosterProduct.promotionEnd || t('کاتی دیارینەکراو', 'Limited time')}
                    </span>
                  </div>
                </div>

                {/* Footer Location & Contact Bar */}
                <div
                  className={`mt-2 pt-2 border-t text-[10px] font-mono text-center font-bold z-10 flex items-center justify-around ${
                    posterTheme === 'clean_studio'
                      ? 'border-zinc-300 text-zinc-500'
                      : 'border-white/10 text-white/70'
                  }`}
                >
                  <span>📞 {systemConfig?.phone || '0750 000 0000'}</span>
                  <span>📍 {systemConfig?.address || 'سلێمانی - شەقامی سەرەکی'}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions Toolbar */}
            <div className="p-4 px-6 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3 bg-white shrink-0">
              {copyToast && (
                <div className="w-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-none flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{t('وێنەکە کۆپی کرا و داونلۆد دەکرێت!', 'Image copied & downloaded!')}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleDownloadPosterPNG(activePosterProduct)}
                className="flex-1 min-w-[160px] h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-none flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>{t('داونلۆد وەک وێنەی HD (PNG)', 'Download Ultra-HD Image')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyPosterToClipboard(activePosterProduct)}
                className="h-9 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>{t('کۆپیکردن', 'Copy')}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="h-9 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>{t('چاپکردن', 'Print')}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
