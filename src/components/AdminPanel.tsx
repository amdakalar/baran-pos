import React from 'react';
import {
  Users,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  X,
  ShieldCheck,
  Edit2,
  UserCircle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { 
  User, 
  UserRole, 
  UserPermissions, 
  NavigationTab,
} from '../types';

const ALL_TABS_LIST: { id: NavigationTab; labelKu: string; labelEn: string }[] = [
  { id: 'pos', labelKu: 'فرۆشتن (POS)', labelEn: 'POS Terminal' },
  { id: 'print_calc', labelKu: 'حساباتی چاپ', labelEn: 'Print & Copy Calc' },
  { id: 'inventory', labelKu: 'کاڵا و بارکۆد', labelEn: 'Products & Barcode' },
  { id: 'stock_expiry', labelKu: 'کۆگا و بەسەرچوون', labelEn: 'Warehouse & Expiry' },
  { id: 'customers', labelKu: 'کڕیار و قەرز', labelEn: 'Customers & Debt' },
  { id: 'suppliers', labelKu: 'دابینکەران و کڕین', labelEn: 'Suppliers & Purchases' },
  { id: 'expenses', labelKu: 'خەرجییەکان', labelEn: 'Expenses' },
  { id: 'shift', labelKu: 'شەفتی کاشێر', labelEn: 'Shift Manager' },
  { id: 'discounts', labelKu: 'داشکاندن و ئۆفەرەکان', labelEn: 'Discounts & Offers' },
  { id: 'reports', labelKu: 'ڕاپۆرت و قازانج', labelEn: 'Reports & P&L' },
  { id: 'barcode', labelKu: 'چاپکردنی بارکۆد', labelEn: 'Barcode Printer' },
  { id: 'settings', labelKu: 'ڕێکخستن', labelEn: 'Settings' },
];

const DEFAULT_OWNER_PERMISSIONS: UserPermissions = {
  allowedTabs: ['pos', 'print_calc', 'inventory', 'stock_expiry', 'customers', 'suppliers', 'expenses', 'shift', 'discounts', 'reports', 'barcode', 'settings', 'admin'],
  canApplyDiscount: true,
  canVoidSale: true,
  canManageInventory: true,
  canViewReports: true,
};

const DEFAULT_CASHIER_PERMISSIONS: UserPermissions = {
  allowedTabs: ['pos', 'print_calc', 'customers', 'shift'],
  canApplyDiscount: true,
  canVoidSale: false,
  canManageInventory: false,
  canViewReports: false,
};

interface AdminPanelProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  currentUserId: string;
  lang?: 'en' | 'ku';
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUserId,
  lang = 'ku',
}) => {
  const t = (ku: string, en: string) => (lang === 'ku' ? ku : en);

  // Modal State
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [showPins, setShowPins] = React.useState<Record<string, boolean>>({});

  const blankUser = {
    name: '',
    role: 'cashier' as UserRole,
    phone: '',
    pin: '',
    permissions: { ...DEFAULT_CASHIER_PERMISSIONS },
  };
  const [newUser, setNewUser] = React.useState(blankUser);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = {
      id: `usr_${Date.now()}`,
      name: newUser.name.trim(),
      role: newUser.role,
      phone: newUser.phone.trim(),
      pin: newUser.pin.trim() || '0000',
      permissions: newUser.role === 'owner' ? { ...DEFAULT_OWNER_PERMISSIONS } : newUser.permissions,
    };
    onAddUser(user);
    setNewUser(blankUser);
    setIsAddUserOpen(false);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser(editingUser);
      setEditingUser(null);
    }
  };

  const togglePinVisibility = (userId: string) => {
    setShowPins((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const roleLabel = (role: UserRole) =>
    role === 'owner' ? t('خاوەنکار (بەڕێوەبەر)', 'Owner / Admin') : t('کاشێر', 'Cashier');

  return (
    <div className="flex-1 bg-[#f8f9fb] p-5 flex flex-col overflow-y-auto text-slate-900 font-sans select-none gap-5">
      
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-snug">
              {t('بەڕێوەبردنی بەکارهێنەران و دەسەڵاتەکان', 'User Accounts & Access Permissions')}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              {t('بەڕێوەبردنی هەژمارەکانی کاشێر و خاوەنکار، دیاریکردنی دەسەڵاتەکان و کۆدی PIN', 'Manage owner & cashier accounts, tab permissions, and login PINs')}
            </p>
          </div>
        </div>

        {/* Add User Action Button */}
        <button
          type="button"
          onClick={() => setIsAddUserOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t('زیادکردنی بەکارهێنەری نوێ', 'Add New User')}</span>
        </button>
      </div>

      {/* ── Users Grid List ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {users.map((user) => {
          const isCurrentUser = user.id === currentUserId;
          const isOwner = user.role === 'owner';
          const isPinVisible = !!showPins[user.id];

          return (
            <div
              key={user.id}
              className={`bg-white rounded-xl border p-5 space-y-4 shadow-2xs transition-all relative ${
                isCurrentUser ? 'border-indigo-400 ring-1 ring-indigo-400/30' : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              {/* Top Row: User Avatar, Name, Role & Actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                      isOwner
                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    }`}
                  >
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-slate-900 truncate">
                        {user.name}
                      </h3>
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-md">
                          {t('ئێستا چالاکە', 'Current Account')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${
                          isOwner
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {roleLabel(user.role)}
                      </span>
                      {user.phone && (
                        <span className="text-[11px] font-mono font-medium text-slate-500">
                          {user.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit & Delete Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingUser(user)}
                    className="p-2 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer border border-slate-200/80"
                    title={t('دەستکاریکردن', 'Edit')}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {!isCurrentUser && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t('ئایا دڵنیایت لە سڕینەوەی ئەم بەکارهێنەرە؟', 'Are you sure you want to delete this user?'))) {
                          onDeleteUser(user.id);
                        }
                      }}
                      className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer border border-slate-200/80"
                      title={t('سڕینەوە', 'Delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Middle Row: PIN Code Box & Key Permissions */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                {/* PIN Code */}
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] text-slate-500 font-bold">
                    {t('کۆدی چوونەژوورەوە (PIN):', 'Login PIN:')}
                  </span>
                  <span className="font-mono font-black text-slate-800 text-xs tracking-wider">
                    {isPinVisible ? user.pin : '••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePinVisibility(user.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Permissions Snapshot */}
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {user.permissions?.canApplyDiscount && (
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold">
                      {t('داشکاندن', 'Discount')}
                    </span>
                  )}
                  {user.permissions?.canVoidSale && (
                    <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[9px] font-bold">
                      {t('سڕینەوەی پسوولە', 'Void Sale')}
                    </span>
                  )}
                  {user.permissions?.canViewReports && (
                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[9px] font-bold">
                      {t('ڕاپۆرت', 'Reports')}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Row: Allowed Navigation Tabs */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  {t('بەشە ڕێگەپێدراوەکان بۆ کارکردن:', 'Allowed Operating Tabs:')}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isOwner ? (
                    <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-md text-[10px] font-bold">
                      {t('دەسەڵاتی تەواو بەسەر هەموو بەشەکاندا', 'Full access to all system tabs')}
                    </span>
                  ) : user.permissions?.allowedTabs && user.permissions.allowedTabs.length > 0 ? (
                    user.permissions.allowedTabs.map((tabId) => {
                      const tabInfo = ALL_TABS_LIST.find((t) => t.id === tabId);
                      return (
                        <span
                          key={tabId}
                          className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[10px] font-medium shadow-2xs"
                        >
                          {lang === 'ku' ? tabInfo?.labelKu || tabId : tabInfo?.labelEn || tabId}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-slate-400 text-xs">{t('هیچ بەشێک دیارینەکراوە', 'No tabs assigned')}</span>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ── Add User Modal ── */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/90 w-full max-w-lg shadow-2xl font-sans text-slate-900 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-900">
                  {t('زیادکردنی بەکارهێنەری نوێ', 'Add New User')}
                </h3>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            </div>

            <form onSubmit={handleAddUser} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">{t('ناوی بەکارهێنەر:', 'Full Name:')}</label>
                  <input
                    type="text"
                    required
                    placeholder="کاشێر ١"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">{t('ڕۆڵ و پلە:', 'Role:')}</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => {
                      const role = e.target.value as UserRole;
                      setNewUser({
                        ...newUser,
                        role,
                        permissions: role === 'owner' ? { ...DEFAULT_OWNER_PERMISSIONS } : { ...DEFAULT_CASHIER_PERMISSIONS },
                      });
                    }}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="cashier">{t('کاشێر (Cashier)', 'Cashier')}</option>
                    <option value="owner">{t('خاوەنکار (Owner / Admin)', 'Owner / Admin')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">{t('ژمارەی مۆبایل:', 'Phone:')}</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    dir="ltr"
                    placeholder="0770 000 0000"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value.replace(/\D/g, '') })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-mono font-bold outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">{t('کۆدی چوونەژوورەوە (PIN):', 'Login PIN:')}</label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="1234"
                    value={newUser.pin}
                    onChange={(e) => setNewUser({ ...newUser, pin: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-mono font-bold outline-none focus:border-indigo-500 text-center"
                  />
                </div>
              </div>

              {/* Tab Permissions (if Cashier) */}
              {newUser.role === 'cashier' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-800 block">
                    {t('بەشە ڕێگەپێدراوەکان بۆ ئەم کاشێرە:', 'Allowed Tabs for this Cashier:')}
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {ALL_TABS_LIST.filter(t => t.id !== 'admin' && t.id !== 'settings').map((tab) => {
                      const isAllowed = newUser.permissions.allowedTabs.includes(tab.id);
                      return (
                        <label key={tab.id} className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={() => {
                              const currentAllowed = newUser.permissions.allowedTabs;
                              const updated = isAllowed
                                ? currentAllowed.filter((id) => id !== tab.id)
                                : [...currentAllowed, tab.id];
                              setNewUser({
                                ...newUser,
                                permissions: { ...newUser.permissions, allowedTabs: updated },
                              });
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                          />
                          <span>{lang === 'ku' ? tab.labelKu : tab.labelEn}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('تۆمارکردنی بەکارهێنەر', 'Create User')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/90 w-full max-w-lg shadow-2xl font-sans text-slate-900 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-900">
                  {t('دەستکاریکردنی بەکارهێنەر', 'Edit User')}
                </h3>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                  <Edit2 className="w-4 h-4" />
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">{t('ناوی بەکارهێنەر:', 'Full Name:')}</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">{t('ڕۆڵ و پلە:', 'Role:')}</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => {
                      const role = e.target.value as UserRole;
                      setEditingUser({
                        ...editingUser,
                        role,
                        permissions: role === 'owner' ? { ...DEFAULT_OWNER_PERMISSIONS } : editingUser.permissions || { ...DEFAULT_CASHIER_PERMISSIONS },
                      });
                    }}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="cashier">{t('کاشێر (Cashier)', 'Cashier')}</option>
                    <option value="owner">{t('خاوەنکار (Owner / Admin)', 'Owner / Admin')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">{t('ژمارەی مۆبایل:', 'Phone:')}</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    dir="ltr"
                    placeholder="0770 000 0000"
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value.replace(/\D/g, '') })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-mono font-bold outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">{t('کۆدی چوونەژوورەوە (PIN):', 'Login PIN:')}</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={editingUser.pin}
                    onChange={(e) => setEditingUser({ ...editingUser, pin: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-mono font-bold outline-none focus:border-indigo-500 text-center"
                  />
                </div>
              </div>

              {/* Action Permissions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800 block">{t('دەسەڵاتی کردارەکان:', 'Action Permissions:')}</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingUser.permissions?.canApplyDiscount ?? true}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          permissions: { ...editingUser.permissions!, canApplyDiscount: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                    />
                    <span>{t('ڕێگەدان بە داشکاندن', 'Apply Discounts')}</span>
                  </label>

                  <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingUser.permissions?.canVoidSale ?? false}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          permissions: { ...editingUser.permissions!, canVoidSale: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                    />
                    <span>{t('هەڵوەشاندنەوەی پسوولە', 'Void Sales')}</span>
                  </label>

                  <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingUser.permissions?.canManageInventory ?? false}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          permissions: { ...editingUser.permissions!, canManageInventory: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                    />
                    <span>{t('دەستکاری کاڵا و کۆگا', 'Manage Inventory')}</span>
                  </label>

                  <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingUser.permissions?.canViewReports ?? false}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          permissions: { ...editingUser.permissions!, canViewReports: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                    />
                    <span>{t('بینینی ڕاپۆرتەکان', 'View Reports')}</span>
                  </label>
                </div>
              </div>

              {/* Tab Permissions (if Cashier) */}
              {editingUser.role === 'cashier' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-800 block">
                    {t('بەشە ڕێگەپێدراوەکان بۆ ئەم کاشێرە:', 'Allowed Tabs for this Cashier:')}
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {ALL_TABS_LIST.filter(t => t.id !== 'admin' && t.id !== 'settings').map((tab) => {
                      const isAllowed = editingUser.permissions?.allowedTabs.includes(tab.id) ?? false;
                      return (
                        <label key={tab.id} className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={() => {
                              const currentAllowed = editingUser.permissions?.allowedTabs || [];
                              const updated = isAllowed
                                ? currentAllowed.filter((id) => id !== tab.id)
                                : [...currentAllowed, tab.id];
                              setEditingUser({
                                ...editingUser,
                                permissions: { ...editingUser.permissions!, allowedTabs: updated },
                              });
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                          />
                          <span>{lang === 'ku' ? tab.labelKu : tab.labelEn}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('پاشەکەوتکردنی گۆڕانکارییەکان', 'Save Changes')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
