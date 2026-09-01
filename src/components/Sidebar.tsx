import React from 'react';
import { 
  ShoppingCart, 
  Printer, 
  Package, 
  Users, 
  DollarSign, 
  Clock, 
  BarChart3, 
  Barcode, 
  Settings, 
  User as UserIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Store, 
  AlertTriangle, 
  FileText, 
  Percent, 
  Check, 
  Lock, 
  PanelLeftClose, 
  PanelLeft,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import { User, NavigationTab, SystemConfig } from '../types';
import { AppUpdateInfo } from '../utils/version';

interface SidebarProps {
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  onUpdateUser?: (user: User) => void;
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  lowStockCount: number;
  expiringCount: number;
  debtorsCount?: number;
  lang?: 'en' | 'ku';
  heldSalesCount: number;
  requireLoginPin?: boolean;
  onLockSystem?: () => void;
  systemConfig?: SystemConfig;
  licenseStatus?: any;
  cloudStatus?: any;
  appUpdateAvailable?: AppUpdateInfo | null;
  onOpenUpdateModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  users,
  onSwitchUser,
  onUpdateUser,
  currentTab,
  onSelectTab,
  lowStockCount,
  expiringCount,
  debtorsCount = 0,
  lang = 'ku',
  heldSalesCount,
  requireLoginPin,
  onLockSystem,
  systemConfig,
  licenseStatus,
  cloudStatus,
  appUpdateAvailable,
  onOpenUpdateModal,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(false);

  const [showUserDropdown, setShowUserDropdown] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [pinInput, setPinInput] = React.useState('');
  const [showPin, setShowPin] = React.useState(false);
  const [pinSuccessMsg, setPinSuccessMsg] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const isManager = currentUser.role === 'owner' || (currentUser.role as string) === 'admin';

  const handleUpdatePin = () => {
    if (!pinInput || pinInput.length < 4) {
      alert(lang === 'ku' ? 'تکایە لانی کەم ٤ ژمارە بنووسە بۆ PIN' : 'Please enter at least 4 digits for PIN');
      return;
    }
    if (onUpdateUser) {
      onUpdateUser({
        ...currentUser,
        pin: pinInput,
      });
      setPinSuccessMsg(lang === 'ku' ? 'کۆدی PIN بە سەرکەوتوویی گۆڕدرا!' : 'PIN successfully updated!');
      setTimeout(() => setPinSuccessMsg(''), 3000);
    }
  };

  const handleUserClick = () => {
    if (isManager) {
      onSelectTab('admin');
    } else {
      setPinInput(currentUser.pin || '');
      setIsProfileModalOpen(true);
    }
  };

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const navItems = [
    {
      id: 'pos' as NavigationTab,
      labelEn: 'Sales Screen (POS)',
      labelKu: 'شاشەی فرۆشتن',
      icon: ShoppingCart,
      shortcut: 'F1',
      badge: heldSalesCount > 0 ? (lang === 'ku' ? `${heldSalesCount}` : `${heldSalesCount}`) : null,
      badgeCount: heldSalesCount,
    },
    {
      id: 'print_calc' as NavigationTab,
      labelEn: 'Print Calculator',
      labelKu: 'حساباتی چاپ و کۆپی',
      icon: Printer,
      badgeCount: 0,
    },
    {
      id: 'inventory' as NavigationTab,
      labelEn: 'Products & Barcode',
      labelKu: 'کاڵاکان و بارکۆد',
      icon: Package,
      badgeCount: 0,
    },
    {
      id: 'stock_expiry' as NavigationTab,
      labelEn: 'Warehouse & Expiry',
      labelKu: 'عەمبار و بەسەرچوون',
      icon: AlertTriangle,
      badge: (lowStockCount + expiringCount) > 0 ? `${lowStockCount + expiringCount}` : null,
      badgeCount: lowStockCount + expiringCount,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'suppliers' as NavigationTab,
      labelEn: 'Suppliers & Purchases',
      labelKu: 'دابینکەران و کڕین',
      icon: Users,
      badgeCount: 0,
    },
    {
      id: 'customers' as NavigationTab,
      labelEn: 'Customers & Debts',
      labelKu: 'کڕیاران و قەرز',
      icon: Users,
      badge: debtorsCount > 0 ? `${debtorsCount}` : null,
      badgeCount: debtorsCount,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'expenses' as NavigationTab,
      labelEn: 'Expenses',
      labelKu: 'خەرجییەکان',
      icon: DollarSign,
      badgeCount: 0,
    },
    {
      id: 'reports' as NavigationTab,
      labelEn: 'Reports & Profits',
      labelKu: 'ڕاپۆرت و قازانج',
      icon: BarChart3,
      badgeCount: 0,
    },
    {
      id: 'shift' as NavigationTab,
      labelEn: 'Shift & Sales Logs',
      labelKu: 'لۆگی شەفت و فرۆشتن',
      icon: FileText,
      badgeCount: 0,
    },
    {
      id: 'discounts' as NavigationTab,
      labelEn: 'Discounts & Offers',
      labelKu: 'داشکاندن و ئۆفەرەکان',
      icon: Percent,
      badgeCount: 0,
    },
    {
      id: 'barcode' as NavigationTab,
      labelEn: 'Barcode Labels',
      labelKu: 'چاپکردنی بارکۆد',
      icon: Barcode,
      badgeCount: 0,
    },
    {
      id: 'settings' as NavigationTab,
      labelEn: 'Settings',
      labelKu: 'ڕێکخستنەکان',
      icon: Settings,
      badgeCount: 0,
    },
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (currentUser.role === 'owner') return true;
    if (item.id === 'settings') return false; // Strictly for owners/admins
    if (!currentUser.permissions?.allowedTabs) {
      return ['pos', 'print_calc', 'customers', 'shift'].includes(item.id);
    }
    return currentUser.permissions.allowedTabs.includes(item.id);
  });

  const shopTitleKu = systemConfig?.shopNameKu || 'پەراوگەی باران';
  const shopTitleEn = systemConfig?.shopNameEn || 'Baran Stationery POS';
  const displayScale = systemConfig?.displayScale || 'medium';

  // Dynamic Scale Styling Configs for Small / Medium / Large
  const scale = {
    small: {
      asideWidth: isCollapsed ? 'w-16' : 'w-56',
      headerPadding: isCollapsed ? 'pt-3 pb-2.5 px-1.5' : 'pt-3 pb-2.5 px-3',
      logoBox: 'w-8 h-8 rounded-lg p-0.5',
      titleText: 'text-xs font-black',
      subtitleText: 'text-[9px]',
      toggleBtn: 'w-7 h-7 rounded-md',
      toggleIcon: 'w-3.5 h-3.5',
      navPadding: isCollapsed ? 'p-2' : 'px-2.5 py-1.5 text-[11px]',
      navGap: 'gap-2',
      navIconSize: 'w-3.5 h-3.5',
      navSpaceY: 'space-y-0.5',
      navContainerPadding: 'p-1.5',
      shortcutBadge: 'text-[9px] px-1 py-0.2',
      counterBadge: 'text-[8px] px-1.5 py-0.2',
      footerPadding: isCollapsed ? 'p-1.5' : 'p-2',
      userCardPadding: isCollapsed ? 'p-1' : 'p-1.5 px-2',
      userRoleLabel: 'text-[8px]',
      userNameText: 'text-[11px] font-black',
      userIconBox: 'w-7 h-7 rounded-lg',
      userIconSize: 'w-3.5 h-3.5',
    },
    medium: {
      asideWidth: isCollapsed ? 'w-20' : 'w-64',
      headerPadding: isCollapsed ? 'pt-4 pb-3.5 px-2' : 'pt-3.5 pb-3 px-3.5',
      logoBox: 'w-10 h-10 rounded-xl p-1',
      titleText: 'text-sm font-black',
      subtitleText: 'text-[10px]',
      toggleBtn: 'w-8 h-8 rounded-lg',
      toggleIcon: 'w-4 h-4',
      navPadding: isCollapsed ? 'p-2.5' : 'px-3 py-2 text-xs',
      navGap: 'gap-2.5',
      navIconSize: 'w-4 h-4',
      navSpaceY: 'space-y-1',
      navContainerPadding: 'p-2',
      shortcutBadge: 'text-[10px] px-1.5 py-0.5',
      counterBadge: 'text-[9px] px-1.5 py-0.5',
      footerPadding: isCollapsed ? 'p-2' : 'p-2.5',
      userCardPadding: isCollapsed ? 'p-1.5' : 'p-1.5 px-2.5',
      userRoleLabel: 'text-[9px]',
      userNameText: 'text-xs font-black',
      userIconBox: 'w-8 h-8 rounded-xl',
      userIconSize: 'w-4 h-4',
    },
    large: {
      asideWidth: isCollapsed ? 'w-24' : 'w-72',
      headerPadding: isCollapsed ? 'pt-5 pb-4 px-2.5' : 'pt-4 pb-3.5 px-4',
      logoBox: 'w-12 h-12 rounded-xl p-1',
      titleText: 'text-base font-black',
      subtitleText: 'text-xs',
      toggleBtn: 'w-9 h-9 rounded-lg',
      toggleIcon: 'w-4.5 h-4.5',
      navPadding: isCollapsed ? 'p-3' : 'px-3.5 py-2.5 text-sm',
      navGap: 'gap-3',
      navIconSize: 'w-4.5 h-4.5',
      navSpaceY: 'space-y-1.5',
      navContainerPadding: 'p-2.5',
      shortcutBadge: 'text-[11px] px-2 py-0.5',
      counterBadge: 'text-[10px] px-2 py-0.5',
      footerPadding: isCollapsed ? 'p-2.5' : 'p-3',
      userCardPadding: isCollapsed ? 'p-2' : 'p-2 px-3',
      userRoleLabel: 'text-[10px]',
      userNameText: 'text-sm font-black',
      userIconBox: 'w-9 h-9 rounded-xl',
      userIconSize: 'w-4.5 h-4.5',
    },
  }[displayScale];

  // Format Role Display String
  const getRoleDisplayName = (user: User) => {
    if (user.role === 'owner' || (user.role as string) === 'admin') {
      return lang === 'ku' ? 'بەڕێوەبەر (خاوەنکار)' : 'Manager (Owner)';
    }
    if (user.role === 'cashier') {
      return lang === 'ku' ? `${user.name} (کارمەند)` : `${user.name} (Cashier)`;
    }
    return user.name;
  };

  return (
    <aside
      className={`bg-[#f8fafc] border-l rtl:border-l rtl:border-r-0 border-slate-200/90 flex flex-col h-screen select-none shrink-0 text-slate-800 font-sans transition-all duration-200 z-30 shadow-xs overflow-hidden ${
        scale.asideWidth
      }`}
      dir={lang === 'ku' ? 'rtl' : 'ltr'}
    >
      {/* ── Top Header Banner ── */}
      <div className={`border-b border-slate-200/80 transition-all shrink-0 ${
        isCollapsed ? `${scale.headerPadding} flex flex-col items-center gap-2` : scale.headerPadding
      }`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2">
            {/* Right in RTL: Logo Box + Store Title */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className={`${scale.logoBox} overflow-hidden bg-white border border-slate-200/90 flex items-center justify-center shadow-2xs shrink-0`}>
                <img src="./icon.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className={`${scale.titleText} tracking-tight leading-tight text-slate-900 truncate`} title={shopTitleKu}>
                  {shopTitleKu}
                </h1>
                <p className={`${scale.subtitleText} font-bold text-indigo-600 tracking-tight truncate mt-0.5`} title={shopTitleEn}>
                  {shopTitleEn}
                </p>
              </div>
            </div>

            {/* Left in RTL: Collapse Toggle Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              className={`${scale.toggleBtn} bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer shadow-2xs shrink-0 flex items-center justify-center`}
              title={lang === 'ku' ? 'بچووککردنەوەی سایدبار' : 'Collapse Sidebar'}
            >
              <PanelLeftClose className={`${scale.toggleIcon} rtl:rotate-180`} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className={`${scale.logoBox} overflow-hidden bg-white border border-slate-200/90 flex items-center justify-center shadow-2xs shrink-0`}>
              <img src="./icon.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <button
              type="button"
              onClick={toggleCollapse}
              className={`${scale.toggleBtn} bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer shadow-2xs flex items-center justify-center`}
              title={lang === 'ku' ? 'گەورەکردنی سایدبار' : 'Expand Sidebar'}
            >
              <PanelLeft className={`${scale.toggleIcon} rtl:rotate-180`} />
            </button>
          </div>
        )}

        {/* ── App Update Available Notification Badge ── */}
        {appUpdateAvailable && (
          <div className="mt-2.5">
            <button
              type="button"
              onClick={onOpenUpdateModal}
              className={`w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-amber-400/50 ${
                isCollapsed ? 'p-2' : 'px-2.5 py-1.5 text-[11px]'
              }`}
              title={lang === 'ku' ? `وەشانی نوێ بەردەستە (v${appUpdateAvailable.version}) - کرتە بکە بۆ نوێکردنەوە` : `New update available (v${appUpdateAvailable.version}) - Click to update`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-200 animate-pulse" />
              {!isCollapsed && (
                <span className="truncate font-black">
                  {lang === 'ku' ? `نوێکردنەوە v${appUpdateAvailable.version}` : `Update v${appUpdateAvailable.version}`}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Navigation Menu Items ── */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${scale.navContainerPadding} ${scale.navSpaceY} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const label = lang === 'ku' ? item.labelKu : item.labelEn;

          return (
            <div key={item.id} className="relative group">
              <button
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full relative flex items-center ${
                  isCollapsed ? `justify-center ${scale.navPadding}` : `justify-between ${scale.navPadding}`
                } font-bold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
                title={isCollapsed ? label : undefined}
              >
                {/* Active Indicator Bar on the edge */}
                {isActive && (
                  <span className="absolute top-1.5 bottom-1.5 right-0 rtl:right-0 rtl:left-auto w-1 bg-indigo-500 rounded-l-full" />
                )}

                {/* Right side in RTL: Icon + Label */}
                <div className={`flex items-center ${scale.navGap} truncate`}>
                  <Icon
                    className={`${scale.navIconSize} shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className={`truncate ${isActive ? 'font-black text-white' : 'font-bold text-slate-700 group-hover:text-slate-900'}`}>
                      {label}
                    </span>
                  )}
                </div>

                {/* Left side in RTL: Shortcut Badge (e.g. F1) or Counter Badge */}
                {!isCollapsed && (
                  <div className="flex items-center gap-1.5">
                    {item.shortcut && (
                      <span className={`${scale.shortcutBadge} font-mono font-black rounded-md shadow-2xs ${
                        isActive
                          ? 'bg-slate-800 text-slate-200 border border-slate-700/80'
                          : 'bg-slate-200/80 text-slate-600 group-hover:bg-slate-300/80'
                      }`}>
                        {item.shortcut}
                      </span>
                    )}

                    {item.badge && !item.shortcut && (
                      <span
                        className={`${scale.counterBadge} font-mono font-black rounded-full ${
                          item.badgeColor || 'bg-indigo-600 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Collapsed view badge dot */}
                {isCollapsed && item.badgeCount > 0 && (
                  <span
                    className={`absolute top-1.5 right-1.5 rtl:right-auto rtl:left-1.5 w-2 h-2 rounded-full ${
                      item.badgeColor || 'bg-rose-500'
                    } ring-2 ring-white`}
                  />
                )}
              </button>

              {/* Collapsed Hover Tooltip */}
              {isCollapsed && (
                <div className="absolute z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-700 shadow-xl whitespace-nowrap top-1/2 -translate-y-1/2 start-full ms-2">
                  <div className="flex items-center gap-2">
                    <span>{label}</span>
                    {item.shortcut && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-indigo-600 text-white rounded-md">
                        {item.shortcut}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Active User / Role Footer ── */}
      <div 
        ref={dropdownRef}
        className={`bg-[#f8fafc] border-t border-slate-200/90 relative text-xs font-sans ${scale.footerPadding}`}
      >
        {/* User Card */}
        <div
          className={`relative group flex items-center ${
            isCollapsed ? `justify-center ${scale.userCardPadding}` : `justify-between gap-1.5 ${scale.userCardPadding}`
          } ${
            isManager && currentTab === 'admin'
              ? 'bg-slate-900 border-slate-900 text-white shadow-xs ring-1 ring-slate-800'
              : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-xs text-slate-800'
          } border rounded-xl shadow-2xs transition-all`}
        >
          {/* Active indicator bar on edge when admin tab is open */}
          {isManager && currentTab === 'admin' && (
            <span className="absolute top-1.5 bottom-1.5 right-0 rtl:right-0 rtl:left-auto w-1 bg-indigo-500 rounded-l-full" />
          )}

          {/* Chevron Dropdown Button on Left (in RTL) to switch account */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowUserDropdown(!showUserDropdown);
              }}
              className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                isManager && currentTab === 'admin'
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
              }`}
              title={lang === 'ku' ? 'گۆڕینی هەژمار' : 'Switch Account'}
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showUserDropdown ? 'rotate-180 text-indigo-500' : ''}`} />
            </button>
          )}

          {/* Main User Card clickable area -> Admin Panel (for Manager) OR Profile Modal (for Cashier) */}
          <div
            onClick={handleUserClick}
            className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'justify-between gap-2 min-w-0 flex-1'} cursor-pointer`}
            title={
              isManager
                ? (lang === 'ku' ? 'چوون بۆ بەشی بەڕێوەبردن (Admin Panel)' : 'Go to Admin Panel')
                : (lang === 'ku' ? 'بینینی پرۆفایلی کارمەند' : 'View Employee Profile')
            }
          >
            {/* Center Info: دیاریکردنی ڕۆڵی بەکارهێنەر + خاوەنکار (Owner) / کارمەند */}
            {!isCollapsed && (
              <div className="min-w-0 flex-1 text-start">
                <span className={`font-bold block leading-tight ${scale.userRoleLabel} ${
                  isManager && currentTab === 'admin' ? 'text-slate-400' : 'text-slate-400'
                }`}>
                  {lang === 'ku' ? 'ڕۆڵی بەکارهێنەر:' : 'User Role Selected:'}
                </span>
                <span className={`block leading-tight mt-0.5 truncate transition-colors ${scale.userNameText} ${
                  isManager && currentTab === 'admin'
                    ? 'text-indigo-400'
                    : 'text-indigo-600 group-hover:text-indigo-700'
                }`}>
                  {getRoleDisplayName(currentUser)}
                </span>
              </div>
            )}

            {/* User Icon Box on Right (in RTL) */}
            <div className={`${scale.userIconBox} flex items-center justify-center shrink-0 transition-all shadow-2xs ${
              isManager && currentTab === 'admin'
                ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                : 'bg-indigo-50 border border-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
            }`}>
              <UserIcon className={`${scale.userIconSize} stroke-[2.2]`} />
            </div>
          </div>

          {/* Collapsed Hover Tooltip */}
          {isCollapsed && (
            <div className="absolute z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-700 shadow-xl whitespace-nowrap top-1/2 -translate-y-1/2 start-full ms-2">
              <span>
                {isManager
                  ? (lang === 'ku' ? 'بەشی بەڕێوەبردن (Admin Panel)' : 'Admin Panel')
                  : (lang === 'ku' ? 'پرۆفایلی کارمەند' : 'Employee Profile')}
              </span>
            </div>
          )}
        </div>

        {/* License Plan & Cloud Status Badges */}
        {!isCollapsed && licenseStatus && licenseStatus.valid && (
          <div className="mt-1.5 space-y-1">
            <div className="px-2 py-1 rounded-lg bg-slate-100/80 border border-slate-200/90 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1 font-bold text-slate-700 truncate">
                <span>{licenseStatus.isLifetime ? '👑' : '⏳'}</span>
                <span className="truncate">{licenseStatus.planNameKu || 'مۆڵەتی باران'}</span>
              </div>
              <span className={`font-mono font-black px-1.5 py-0.2 rounded-md text-[9px] shrink-0 ${
                licenseStatus.isLifetime
                  ? 'bg-emerald-600 text-white'
                  : licenseStatus.daysRemaining && licenseStatus.daysRemaining <= 10
                  ? 'bg-rose-500 text-white'
                  : 'bg-indigo-600 text-white'
              }`}>
                {licenseStatus.isLifetime ? 'هەمیشەیی' : `${licenseStatus.daysRemaining} ڕۆژ`}
              </span>
            </div>

            {/* Cloud Status Indicator */}
            {cloudStatus && (
              <div className={`px-2 py-0.5 rounded-lg flex items-center justify-between text-[9px] font-bold ${
                cloudStatus.isOnline
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                  : cloudStatus.state === 'offline_warning'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                  : 'bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}>
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${cloudStatus.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                  <span>{cloudStatus.isOnline ? 'کلاود چالاکە' : 'ئۆفلاین'}</span>
                </span>
                {!cloudStatus.isOnline && cloudStatus.remainingSeconds > 0 && (
                  <span className="font-mono text-[8px]">
                    {Math.floor(cloudStatus.remainingSeconds / 3600)} کاتژمێر
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* User Switch Dropdown Modal / Popup */}
        {showUserDropdown && (
          <div className={`absolute bottom-full mb-2 bg-white border border-slate-200/90 shadow-xl z-50 p-2 rounded-2xl ${
            isCollapsed ? 'start-full ms-2 w-56' : 'left-2.5 right-2.5'
          }`}>
            <div className="text-[10px] font-mono text-slate-400 mb-2 font-bold uppercase tracking-wider px-1.5 flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span>{lang === 'ku' ? 'گۆڕینی هەژمار و ڕۆڵ' : 'Switch Operating Account'}</span>
              {requireLoginPin && onLockSystem && (
                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLockSystem();
                  }}
                  className="text-slate-500 hover:text-rose-600 flex items-center gap-1 text-[10px] cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>PIN</span>
                </button>
              )}
            </div>

            <div className="space-y-1">
              {users.map((user) => {
                const isSelected = user.id === currentUser.id;
                const isUserOwner = user.role === 'owner' || (user.role as string) === 'admin';
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      onSwitchUser(user);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-start p-2 text-xs flex items-center justify-between rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold'
                        : 'bg-slate-50/70 border border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${
                        isUserOwner ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      <div className="truncate text-start">
                        <span className="truncate block font-bold text-xs">{user.name}</span>
                        <span className="text-[9px] text-slate-400 block font-mono">
                          {lang === 'ku' ? (isUserOwner ? 'بەڕێوەبەر (Owner)' : 'کارمەند (Cashier)') : user.role}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Employee Profile Modal (For regular staff/cashier) ── */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-slate-900" dir={lang === 'ku' ? 'rtl' : 'ltr'}>
          <div className="bg-white border border-slate-300 w-full max-w-md shadow-2xl rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#4f46e5] flex items-center justify-center text-white font-black text-sm shadow-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">
                    {lang === 'ku' ? 'پرۆفایلی کارمەند' : 'Employee Profile'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {currentUser.role === 'cashier' ? (lang === 'ku' ? 'کارمەند / کاشێر' : 'Staff / Cashier') : currentUser.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Personal Info Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-bold">{lang === 'ku' ? 'ناوی کارمەند:' : 'Full Name:'}</span>
                  <span className="font-black text-slate-900 text-sm">{currentUser.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-bold">{lang === 'ku' ? 'ڕۆڵی بەکارهێنەر:' : 'Role:'}</span>
                  <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-md text-[11px]">
                    {lang === 'ku' ? 'کارمەندی فرۆشتن / کاشێر' : 'Sales Staff / Cashier'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-bold">{lang === 'ku' ? 'ژمارەی مۆبایل:' : 'Phone:'}</span>
                  <span className="font-mono font-bold text-slate-800">{currentUser.phone || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">{lang === 'ku' ? 'کۆدی ناسێنەر:' : 'User ID:'}</span>
                  <span className="font-mono text-[11px] text-slate-500">{currentUser.id}</span>
                </div>
              </div>

              {/* Permissions Summary */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  {lang === 'ku' ? 'مۆڵەت و دەسەڵاتەکانی ئەم هەژمارە:' : 'Assigned Permissions:'}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <span className="font-bold text-slate-700">{lang === 'ku' ? 'داشکاندنی فرۆشتن' : 'Discount'}</span>
                    <span className={`font-black font-mono ${currentUser.permissions?.canApplyDiscount ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {currentUser.permissions?.canApplyDiscount ? (lang === 'ku' ? '✓ ڕێگەپێدراو' : '✓ Allowed') : (lang === 'ku' ? '✗ ناچالاک' : '✗ Denied')}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <span className="font-bold text-slate-700">{lang === 'ku' ? 'سڕینەوەی پسوڵە' : 'Void Sale'}</span>
                    <span className={`font-black font-mono ${currentUser.permissions?.canVoidSale ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {currentUser.permissions?.canVoidSale ? (lang === 'ku' ? '✓ ڕێگەپێدراو' : '✓ Allowed') : (lang === 'ku' ? '✗ ناچالاک' : '✗ Denied')}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <span className="font-bold text-slate-700">{lang === 'ku' ? 'بەڕێوەبردنی کاڵا' : 'Inventory'}</span>
                    <span className={`font-black font-mono ${currentUser.permissions?.canManageInventory ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {currentUser.permissions?.canManageInventory ? (lang === 'ku' ? '✓ ڕێگەپێدراو' : '✓ Allowed') : (lang === 'ku' ? '✗ ناچالاک' : '✗ Denied')}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <span className="font-bold text-slate-700">{lang === 'ku' ? 'بینینی ڕاپۆرت' : 'Reports'}</span>
                    <span className={`font-black font-mono ${currentUser.permissions?.canViewReports ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {currentUser.permissions?.canViewReports ? (lang === 'ku' ? '✓ ڕێگەپێدراو' : '✓ Allowed') : (lang === 'ku' ? '✗ ناچالاک' : '✗ Denied')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Change PIN Security */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="font-bold text-slate-700 block">
                  {lang === 'ku' ? 'گۆڕینی کۆدی نهێنی (PIN):' : 'Change Login PIN:'}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={6}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder={lang === 'ku' ? 'PINـی نوێ (٤ ژمارە)' : 'New PIN (4 digits)'}
                      className="w-full h-9 bg-white border border-slate-300 focus:border-indigo-500 rounded-lg px-3 text-xs font-mono font-bold text-slate-900 outline-none shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute top-1/2 -translate-y-1/2 left-2 rtl:left-2 rtl:right-auto text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpdatePin}
                    className="h-9 px-4 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    {lang === 'ku' ? 'پاشەکەوتکردن' : 'Save'}
                  </button>
                </div>
                {pinSuccessMsg && (
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {pinSuccessMsg}
                  </p>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    setShowUserDropdown(true);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 text-xs font-bold underline cursor-pointer"
                >
                  {lang === 'ku' ? 'گۆڕینی هەژمار / دەرچوون' : 'Switch Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  {lang === 'ku' ? 'داخستن' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
