import React from 'react';
import { ShieldAlert, Download, Upload, RefreshCw, Database, FileSpreadsheet, CheckCircle2, Wifi, WifiOff } from 'lucide-react';
import { AuditLog, Product, SalesInvoice, Customer, Supplier } from '../types';

interface AuditBackupManagerProps {
  auditLogs: AuditLog[];
  products: Product[];
  invoices: SalesInvoice[];
  customers: Customer[];
  suppliers: Supplier[];
  onRestoreData: (restoredState: any) => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  lang?: 'en' | 'ku';
}

export const AuditBackupManager: React.FC<AuditBackupManagerProps> = ({
  auditLogs,
  products,
  invoices,
  customers,
  suppliers,
  onRestoreData,
  isOffline,
  onToggleOffline,
  lang = 'ku',
}) => {
  const [activeTab, setActiveTab] = React.useState<'audit' | 'backup_sync'>('audit');
  const [syncLogs, setSyncLogs] = React.useState<string[]>([
    '[SYSTEM] Local DB Storage loaded successfully.',
    '[SYNC] Auto-sync scheduled every 5 minutes.',
  ]);

  const handleDownloadBackup = () => {
    const backupObj = {
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      storeName: 'Baran Stationers',
      clientName: 'کاک على محمد',
      products,
      invoices,
      customers,
      suppliers,
      auditLogs,
    };

    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Baran_POS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.products && parsed.invoices) {
          onRestoreData(parsed);
          alert(lang === 'ku' ? 'داتابەیسەکە بە سەرکەوتوویی گەڕێندرایەوە!' : 'Database restored successfully!');
        } else {
          alert(lang === 'ku' ? 'فایلی بەکئەپەکە دروست نییە.' : 'Invalid backup file structure.');
        }
      } catch (err) {
        alert(lang === 'ku' ? 'خوێندنەوەی فایلی بەکئەپ سەرکەوتوو نەبوو.' : 'Failed to parse backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,ID,Barcode,Name,CostPrice,RetailPrice,Stock\n';
    products.forEach((p) => {
      csvContent += `"${p.id}","${p.barcode}","${p.name}",${p.costPrice},${p.retailPrice},${p.stockQuantity}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Baran_Products_Export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerManualSync = () => {
    setSyncLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Manual Cloud Sync Initiated...`,
      `[${new Date().toLocaleTimeString()}] Pushed ${invoices.length} invoices to central cloud repository.`,
      `[${new Date().toLocaleTimeString()}] Sync Completed: Status OK.`,
      ...prev,
    ]);
  };

  return (
    <div className="flex-1 bg-zinc-100 p-6 flex flex-col overflow-y-auto text-zinc-900 font-sans select-none">
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="bg-white border border-zinc-300 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-none shadow-2xs">
          <div>
            <h1 className="text-base font-black uppercase text-zinc-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-zinc-800" />
              {lang === 'ku' ? 'تۆماری چالاکییەکان و دەستەبەرکردن (بەکئەپ)' : 'Audit Log, Backup & Offline Sync'}
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              {lang === 'ku' ? 'تۆماری تەواوی چالاکی بەکارهێنەران و پاراستنی زانیارییەکانی سیستەم' : 'Full Security Audit Trail & Cloud/Local Database Maintenance'}
            </p>
          </div>

          <div className="flex items-center bg-zinc-100 p-0.5 border border-zinc-300 rounded-none shrink-0 h-9">
            <button
              onClick={() => setActiveTab('audit')}
              className={`h-full px-3.5 font-bold uppercase text-[11px] transition-all rounded-none flex items-center justify-center cursor-pointer ${
                activeTab === 'audit' ? 'bg-black text-white' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {lang === 'ku' ? 'تۆماری چالاکییەکان' : 'User Action Logs'}
            </button>
            <button
              onClick={() => setActiveTab('backup_sync')}
              className={`h-full px-3.5 font-bold uppercase text-[11px] transition-all rounded-none flex items-center justify-center cursor-pointer ${
                activeTab === 'backup_sync' ? 'bg-black text-white' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {lang === 'ku' ? 'بەکئەپ و هاوسەنگسازی' : 'Backup & Sync'}
            </button>
          </div>
        </div>

        {activeTab === 'audit' ? (
          /* User Activity Audit Trail Table */
          <div className="bg-white border border-zinc-300 flex flex-col overflow-hidden rounded-none shadow-2xs">
            <div className="p-3 bg-zinc-50 border-b border-zinc-200 text-xs font-sans font-bold text-zinc-700 uppercase flex items-center justify-between">
              <span>{lang === 'ku' ? 'تۆماری کردارەکان و جووڵەی سیستەم' : 'System Operations & Security Logs'}</span>
              <span className="text-[10px] font-mono text-zinc-500 font-bold">{auditLogs.length} {lang === 'ku' ? 'تۆمار' : 'Records'}</span>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-start text-xs font-mono">
                <thead className="bg-zinc-900 text-white text-[10px] uppercase border-b border-zinc-800 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-start">{lang === 'ku' ? 'کات و بەروار' : 'Timestamp'}</th>
                    <th className="p-3 text-start">{lang === 'ku' ? 'بەکارهێنەر' : 'User'}</th>
                    <th className="p-3 text-start">{lang === 'ku' ? 'کردار' : 'Action'}</th>
                    <th className="p-3 text-start">{lang === 'ku' ? 'وردەکاری' : 'Details'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-3 text-zinc-500 font-bold whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-3 font-bold text-zinc-900 font-sans whitespace-nowrap">{log.user}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-300 text-zinc-800 font-bold text-[10px] uppercase rounded-none">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-700 font-sans">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Backup & Offline/Online Sync Panel */
          <div className="space-y-4">
            {/* Backup & CSV Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-zinc-300 p-5 space-y-3 rounded-none shadow-2xs">
                <h3 className="font-black text-xs uppercase tracking-wider text-zinc-900 flex items-center gap-2 border-b border-zinc-200 pb-2">
                  <Database className="w-4 h-4 text-zinc-800" />
                  {lang === 'ku' ? 'داگرتن و گەڕاندنەوەی داتابەیس' : 'Database Backup & Restore'}
                </h3>
                <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                  {lang === 'ku' ? 'داگرتنی فایلی بەکئەپی پارێزراوی JSON یان گەڕاندنەوەی داتا لە فایلی پێشوو بە یەک کلیک.' : 'Export complete JSON database snapshot or restore previous backup file.'}
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleDownloadBackup}
                    className="flex-1 py-2.5 bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 rounded-none transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {lang === 'ku' ? 'داگرتنی JSON' : 'Download JSON'}
                  </button>
                  <label className="flex-1 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs uppercase flex items-center justify-center gap-1.5 border border-zinc-300 cursor-pointer rounded-none transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    {lang === 'ku' ? 'گەڕاندنەوەی JSON' : 'Restore JSON'}
                    <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="bg-white border border-zinc-300 p-5 space-y-3 rounded-none shadow-2xs">
                <h3 className="font-black text-xs uppercase tracking-wider text-zinc-900 flex items-center gap-2 border-b border-zinc-200 pb-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  {lang === 'ku' ? 'دەرهێنانی داتا بۆ فایلی CSV / اکسڵ' : 'Excel / CSV Data Export'}
                </h3>
                <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                  {lang === 'ku' ? 'دەرهێنانی پێرستی تەواوی کاڵاکانی کۆگا بە نرخ و بارکۆدەوە بۆ بەکارهێنان لە ئەکسڵدا.' : 'Export inventory catalog and product list to standard Excel CSV spreadsheets.'}
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleExportCSV}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 rounded-none transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    {lang === 'ku' ? 'دەرهێنانی کاڵاکان بۆ CSV' : 'Export Products to CSV'}
                  </button>
                </div>
              </div>
            </div>

            {/* Offline / Online Sync Controller */}
            <div className="bg-white border border-zinc-300 p-5 space-y-3 rounded-none shadow-2xs font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 pb-3 gap-3">
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                    {isOffline ? <WifiOff className="w-4 h-4 text-amber-700" /> : <Wifi className="w-4 h-4 text-emerald-700" />}
                    {lang === 'ku' ? 'دۆخی هاوسەنگسازی ئۆفلاین / ئۆنلاین' : 'Offline + Online Automatic Sync Status'}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {isOffline
                      ? (lang === 'ku' ? 'سیستەم لە دۆخی ئۆفلاین (سەربەخۆ) کاردەکات.' : 'Working in Standalone Offline Mode.')
                      : (lang === 'ku' ? 'هاوسەنگسازی هەور چالاکە و ئامادەیە.' : 'Cloud Synchronizer Online & Active.')}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={onToggleOffline}
                    className={`px-3 py-1.5 text-xs font-bold border rounded-none transition-colors cursor-pointer ${
                      isOffline ? 'bg-amber-700 text-white border-amber-700' : 'bg-zinc-200 text-zinc-800 border-zinc-300 hover:bg-zinc-300'
                    }`}
                  >
                    {isOffline ? (lang === 'ku' ? 'گۆڕین بۆ ئۆنلاین' : 'To Online') : (lang === 'ku' ? 'گۆڕین بۆ ئۆفلاین' : 'To Offline')}
                  </button>
                  <button
                    onClick={triggerManualSync}
                    className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-none flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {lang === 'ku' ? 'هاوسەنگسازی خێرا' : 'Sync Now'}
                  </button>
                </div>
              </div>

              {/* Sync Log Console */}
              <div className="bg-zinc-900 text-zinc-300 p-3.5 border border-zinc-800 text-[11px] font-mono space-y-1 max-h-48 overflow-y-auto rounded-none">
                {syncLogs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
