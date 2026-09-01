export function formatAuditAction(action: string, lang: string = 'ku'): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  const isKu = lang !== 'en';
  switch (action) {
    case 'SALE_COMPLETE':
      return {
        label: isKu ? 'فرۆشتنی پسوولە' : 'Sale Completed',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case 'HOLD_SALE':
      return {
        label: isKu ? 'ڕاگرتنی کارت' : 'Cart Held',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
      };
    case 'VOID_INVOICE':
      return {
        label: isKu ? 'هەڵوەشاندنەوەی پسوولە' : 'Void Invoice',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
    case 'RETURN_ITEMS':
      return {
        label: isKu ? 'گەڕاندنەوەی کاڵا' : 'Returned Items',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
      };
    case 'ADD_PRODUCT':
      return {
        label: isKu ? 'زیادکردنی کاڵا' : 'Product Added',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
      };
    case 'UPDATE_PRODUCT':
      return {
        label: isKu ? 'دەستکاریکردنی کاڵا' : 'Product Updated',
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
      };
    case 'DELETE_PRODUCT':
      return {
        label: isKu ? 'سڕینەوەی کاڵا' : 'Product Deleted',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
    case 'STOCK_ADJUSTMENT':
      return {
        label: isKu ? 'دەستکاری کۆگا' : 'Stock Adjustment',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
      };
    case 'BULK_IMPORT':
      return {
        label: isKu ? 'هاوردەکردنی بەکۆمەڵ' : 'Bulk Import',
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
      };
    case 'ADD_CATEGORY':
      return {
        label: isKu ? 'زیادکردنی بەش' : 'Category Added',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
      };
    case 'DELETE_CATEGORY':
      return {
        label: isKu ? 'سڕینەوەی بەش' : 'Category Deleted',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
    case 'ADD_CUSTOMER':
      return {
        label: isKu ? 'تۆمارکردنی کڕیار' : 'Customer Added',
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
      };
    case 'UPDATE_CUSTOMER':
      return {
        label: isKu ? 'دەستکاریکردنی کڕیار' : 'Customer Updated',
        bg: 'bg-cyan-50',
        text: 'text-cyan-700',
        border: 'border-cyan-200',
      };
    case 'DEBT_PAYMENT':
      return {
        label: isKu ? 'وەرگرتنەوەی قەرز' : 'Debt Repayment',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case 'EDIT_DEBT_PAYMENT':
      return {
        label: isKu ? 'دەستکاری پارەدانی قەرز' : 'Edit Debt Payment',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
      };
    case 'ADD_SUPPLIER':
      return {
        label: isKu ? 'تۆمارکردنی دابینکەر' : 'Supplier Added',
        bg: 'bg-violet-50',
        text: 'text-violet-700',
        border: 'border-violet-200',
      };
    case 'SUPPLIER_UPDATE':
      return {
        label: isKu ? 'دەستکاریکردنی دابینکەر' : 'Supplier Updated',
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
      };
    case 'SUPPLIER_DELETE':
      return {
        label: isKu ? 'سڕینەوەی دابینکەر' : 'Supplier Deleted',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
    case 'PURCHASE_INVOICE':
      return {
        label: isKu ? 'پسوولەی کڕینی کۆگا' : 'Purchase Invoice',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
      };
    case 'SUPPLIER_PAYMENT':
      return {
        label: isKu ? 'پارەدان بە دابینکەر' : 'Supplier Payment',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case 'EXPENSE_LOG':
      return {
        label: isKu ? 'تۆمارکردنی خەرجی' : 'Expense Record',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
    case 'SHIFT_OPEN':
      return {
        label: isKu ? 'دەستپێکردنی دەوام' : 'Shift Opened',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case 'SHIFT_CLOSE':
      return {
        label: isKu ? 'داخستنی دەوام' : 'Shift Closed',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-300',
      };
    case 'USER_LOGIN':
      return {
        label: isKu ? 'چوونەژوورەوەی یوزەر' : 'User Login',
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
      };
    case 'RESTORE_DATA':
      return {
        label: isKu ? 'گەڕاندنەوەی باکئەپ' : 'Restore Backup',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
      };
    case 'FACTORY_RESET':
      return {
        label: isKu ? 'سڕینەوەی گشتی سیستەم' : 'Factory Reset',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
    default:
      return {
        label: action.replace(/_/g, ' '),
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
      };
  }
}

export function formatAuditCategory(category: string, lang: string = 'ku'): string {
  const isKu = lang !== 'en';
  switch (category) {
    case 'sale':
      return isKu ? 'فرۆشتن' : 'Sales';
    case 'inventory':
      return isKu ? 'کۆگا و کاڵا' : 'Inventory';
    case 'customer':
      return isKu ? 'کڕیار' : 'Customer';
    case 'debt':
      return isKu ? 'قەرز و پارەدان' : 'Debt';
    case 'shift':
      return isKu ? 'دەوام و شەفت' : 'Shift';
    case 'expense':
      return isKu ? 'خەرجی' : 'Expense';
    case 'system':
      return isKu ? 'سیستەم' : 'System';
    default:
      return category;
  }
}

export function formatAuditDetails(details: string, action?: string, lang: string = 'ku'): string {
  if (!details) return '';
  if (lang === 'en') return details;

  if (/[\u0600-\u06FF]/.test(details) && !details.startsWith('Cart held') && !details.startsWith('Invoice #') && !details.startsWith('Added new product')) {
    return details;
  }

  const d = details;

  const saleMatch = d.match(/Invoice #(\S+) completed \(\$?([0-9.,]+)\) via (\w+)/i);
  if (saleMatch) {
    const pMethod = saleMatch[3].toUpperCase() === 'CASH' ? 'کاش (نەختینە)' : 'قەرز (حساب)';
    return `پسوولەی فرۆشتنی #${saleMatch[1]} بە بڕی ${saleMatch[2]} بە شێوازی ${pMethod} تەواو کرا`;
  }

  const holdMatch = d.match(/Cart held with (\d+) items for (.*)/i);
  if (holdMatch) {
    return `کارتێکی فرۆشتن بە ${holdMatch[1]} کاڵا بۆ (${holdMatch[2]}) ڕاگیرا`;
  }

  const prodMatch = d.match(/Added new product (.*) \((.*)\)/i);
  if (prodMatch) {
    return `کاڵای نوێ (${prodMatch[1]}) بە بارکۆدی (${prodMatch[2]}) زیادکرا بۆ کۆگا`;
  }

  const loginMatch = d.match(/User (.*) logged in via PIN/i);
  if (loginMatch) {
    return `بەکارهێنەر (${loginMatch[1]}) بە سەرکەوتوویی چووە ژوورەوە بە PIN`;
  }

  const shiftCloseMatch = d.match(/Shift closed by (.*?)\. Actual Cash: \$?([0-9.,]+) \(Diff: \$?([0-9.,-]+)\)/i);
  if (shiftCloseMatch) {
    return `دەوام داخرا لەلایەن (${shiftCloseMatch[1]}). پارەی سندوق: ${shiftCloseMatch[2]} (جیاوازی: ${shiftCloseMatch[3]})`;
  }

  const shiftOpenMatch = d.match(/New shift opened by (.*?) with float \$?([0-9.,]+)/i);
  if (shiftOpenMatch) {
    return `دەوامی نوێ کرایەوە لەلایەن (${shiftOpenMatch[1]}) بە سەرمایەی سەرەتایی ${shiftOpenMatch[2]}`;
  }

  const expMatch = d.match(/Recorded overhead expense: (.*?) \(\$?([0-9.,]+)\)/i);
  if (expMatch) {
    return `تۆمارکردنی خەرجی: (${expMatch[1]}) بە بڕی ${expMatch[2]}`;
  }

  const debtMatch = d.match(/Received debt repayment for customer ID (.*)/i);
  if (debtMatch) {
    return `وەرگرتنەوەی قەرزی کڕیار (ناسنامە: ${debtMatch[1]})`;
  }

  const bulkMatch = d.match(/Imported (\d+) products in bulk/i);
  if (bulkMatch) {
    return `هاوردەکردنی بەکۆمەڵی (${bulkMatch[1]}) کاڵا بۆ ناو سیستەم`;
  }

  const adjMatch = d.match(/(.*?): (.*?) adjusted by ([0-9.,-]+)/i);
  if (adjMatch) {
    return `دەستکاری کۆگا بۆ (${adjMatch[2]}): بڕی گۆڕانکاری (${adjMatch[3]})`;
  }

  return details;
}

export function formatAuditTime(timestamp: string, lang: string = 'ku'): string {
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return timestamp;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    if (lang === 'ku') {
      const isPm = hours >= 12;
      const period = isPm ? 'پ.ن' : 'ب.ن';
      const formattedHours = hours % 12 || 12;
      return `${year}/${month}/${day} - ${formattedHours}:${minutes} ${period}`;
    }

    return `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:${minutes}`;
  } catch {
    return timestamp;
  }
}
