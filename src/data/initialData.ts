import { Product, Category, Brand, ItemType, Customer, Supplier, User, Expense, Shift, AuditLog, SalesInvoice } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_1',
    name: 'على محمد (Ali Muhammad)',
    role: 'owner',
    phone: '07725281680',
    pin: '1234',
    permissions: {
      allowedTabs: ['pos', 'print_calc', 'inventory', 'stock_expiry', 'customers', 'suppliers', 'expenses', 'shift', 'reports', 'barcode', 'audit_backup', 'admin'],
      canApplyDiscount: true,
      canVoidSale: true,
      canManageInventory: true,
      canViewReports: true,
    },
  },
  {
    id: 'usr_2',
    name: 'باران (BARAN)',
    role: 'cashier',
    phone: '07501234567',
    pin: '0000',
    permissions: {
      allowedTabs: ['pos', 'print_calc', 'customers', 'shift'],
      canApplyDiscount: true,
      canVoidSale: false,
      canManageInventory: false,
      canViewReports: false,
    },
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Paper & Sheets', nameKu: 'پەڕە و کاغەز' },
  { id: 'cat_2', name: 'Custom Printing Services', nameKu: 'سێرڤسی چاپ و کۆپی' },
  { id: 'cat_3', name: 'Pens & Writing Instruments', nameKu: 'قەڵەم و کەلوپەلی نووسین' },
  { id: 'cat_4', name: 'Ink, Toners & Cartridges', nameKu: 'مەرەکەب و تۆنەری چاپکەر' },
  { id: 'cat_5', name: 'Binding & Lamination', nameKu: 'سەحافە و کەڤەر' },
  { id: 'cat_6', name: 'Notebooks & Diaries', nameKu: 'دەفتەر و یاداشت' },
  { id: 'cat_7', name: 'Desk Accessories & Tools', nameKu: 'ئامێری مەکتەب و قەداسە' },
  { id: 'cat_8', name: 'Calculators & Geometry', nameKu: 'حاسبە و کەلوپەلی ئەندازە' },
];

export const INITIAL_BRANDS: Brand[] = [
  { id: 'brd_1', name: 'Double A' },
  { id: 'brd_2', name: 'Canon' },
  { id: 'brd_3', name: 'Faber-Castell' },
  { id: 'brd_4', name: 'M&G Stationery' },
  { id: 'brd_5', name: 'Deli Office' },
  { id: 'brd_6', name: 'HP Imager' },
  { id: 'brd_7', name: 'Baran Print Services' },
  { id: 'brd_8', name: 'Casio' },
  { id: 'brd_9', name: 'UHU' },
];

export const INITIAL_ITEM_TYPES: ItemType[] = [
  { id: 'typ_1', name: 'Physical Inventory Item' },
  { id: 'typ_2', name: 'On-Demand Printing Service' },
  { id: 'typ_3', name: 'Office Supply Pack' },
];
export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_SHIFT: Shift = {
  id: 'shf_1',
  userId: 'usr_1',
  userName: 'على محمد (Ali Muhammad)',
  startTime: new Date().toISOString(),
  openingFloat: 0,
  cashSales: 0,
  debtSales: 0,
  totalRefunds: 0,
  expectedCashInDrawer: 0,
  status: 'open',
  notes: 'دەستپێکی دەوامی باران POS.',
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_INVOICES: SalesInvoice[] = [];
