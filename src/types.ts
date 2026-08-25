export type UserRole = 'owner' | 'cashier';

export interface UserPermissions {
  allowedTabs: NavigationTab[];
  canApplyDiscount: boolean;
  canVoidSale: boolean;
  canManageInventory: boolean;
  canViewReports: boolean;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  pin: string;
  permissions?: UserPermissions;
}

export type UnitType = 'piece' | 'pack' | 'box' | 'ream' | 'carton' | 'sheet';

export interface UnitConversion {
  baseUnit: UnitType; // e.g., 'piece' or 'sheet'
  bulkUnit: UnitType; // e.g., 'box' or 'ream'
  conversionFactor: number; // e.g., 24 pieces in 1 box, or 500 sheets in 1 ream
}

export interface Product {
  id: string;
  name: string;
  nameKu?: string;
  sku: string;
  barcode: string;
  categoryId: string;
  brandId: string;
  itemTypeId: string;
  costPrice: number; // Purchase price
  retailPrice: number; // Selling price (retail)
  wholesalePrice: number; // Selling price (wholesale)
  stockQuantity: number; // Total stock in base unit
  unit: UnitType;
  unitConversion?: UnitConversion;
  minStockAlert: number;
  expiryDate?: string;
  image?: string;
  isActive: boolean;
  promotionDiscount?: number; // Discount percentage during promo
  promotionEnd?: string;
  promotionLimit?: number; // Allowed pieces per customer during promotion
}

export interface Category {
  id: string;
  name: string;
  nameKu?: string;
  icon?: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface ItemType {
  id: string;
  name: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitSelected: UnitType; // baseUnit or bulkUnit
  pricePerUnit: number; // calculated according to unitSelected and wholesale/retail toggle
  discount: number; // percentage or fixed per line
  isCustomPrintJob?: boolean;
  customPrintDetails?: string;
}

export interface HeldSale {
  id: string;
  customerName: string;
  createdAt: string;
  items: CartItem[];
  note?: string;
  discountType?: 'percent' | 'amount';
  discountValue?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  creditLimit: number;
  currentDebt: number;
  totalPurchases: number;
  specialDiscountPercent?: number;
  notes?: string;
  lastDebtDate?: string; // Date when debt was recorded/updated (YYYY-MM-DD)
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  amount: number;
  date: string;
  receivedBy: string;
  paymentMethod: 'cash';
  notes?: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  currentDebt: number;
  totalPurchases?: number;
  address?: string;
  notes?: string;
}

export interface PurchaseInvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  retailPrice?: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierInvoiceNumber?: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseInvoiceItem[];
  totalAmount: number;
  amountPaid: number;
  debtAmount: number;
  createdUser: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  amount: number;
  date: string;
  paidBy: string;
  notes?: string;
}

export type ExpenseCategory = 'rent' | 'electricity_water' | 'salaries' | 'maintenance' | 'supplies' | 'other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  date: string;
  recordedBy: string;
  note?: string;
}

export interface Shift {
  id: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  openingFloat: number;
  cashSales: number;
  debtSales: number;
  totalRefunds: number;
  expectedCashInDrawer: number;
  actualCashInDrawer?: number;
  difference?: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  time: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  paymentMethod: 'cash' | 'credit'; // 'credit' = customer debt
  amountPaid: number;
  changeDue: number;
  debtAdded: number;
  shiftId: string;
  status: 'completed' | 'voided' | 'returned';
  returnReason?: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  type: 'damaged_waste' | 'manual_correction' | 'stock_in';
  quantityChange: number; // positive or negative
  previousStock: number;
  newStock: number;
  reason: string;
  date: string;
  user: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  category: 'sale' | 'inventory' | 'customer' | 'shift' | 'expense' | 'system' | 'debt';
}

export interface CustomPrintCalculation {
  paperSize: 'A4' | 'A3' | 'A5' | 'Photo 4x6';
  printType: 'bw_single' | 'bw_double' | 'color_single' | 'color_double';
  pages: number;
  copies: number;
  binding: 'none' | 'spiral' | 'tape' | 'hardcover';
  lamination: boolean;
  calculatedPrice: number;
}

export type NavigationTab = 
  | 'pos'
  | 'print_calc'
  | 'inventory'
  | 'stock_expiry'
  | 'customers'
  | 'suppliers'
  | 'expenses'
  | 'shift'
  | 'discounts'
  | 'reports'
  | 'barcode'
  | 'settings'
  | 'audit_backup'
  | 'admin';

export interface SystemConfig {
  shopNameEn: string;
  shopNameKu: string;
  posType: 'stationery' | 'market' | 'restaurant' | 'pharmacy' | 'electronics' | 'clothing' | 'custom';
  posTypeCustomLabel?: string;
  requireLoginPin: boolean;
  currency: 'IQD' | 'USD';
  exchangeRate: number;
  taxPercent: number;
  phone: string;
  address: string;
  receiptHeaderKu?: string;
  receiptFooterKu?: string;
  theme?: 'light' | 'dark';
}
