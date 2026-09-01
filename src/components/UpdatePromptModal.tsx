import React from 'react';
import { 
  Download, 
  Sparkles, 
  X, 
  CheckCircle2, 
  ExternalLink, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { AppUpdateInfo, APP_VERSION, openExternalUrl } from '../utils/version';

interface UpdatePromptModalProps {
  updateInfo: AppUpdateInfo;
  currentVersion?: string;
  onClose: () => void;
  lang?: 'en' | 'ku';
  onSnooze?: () => void;
}

export const UpdatePromptModal: React.FC<UpdatePromptModalProps> = ({
  updateInfo,
  currentVersion = APP_VERSION,
  onClose,
  lang = 'ku',
  onSnooze,
}) => {
  const isKu = lang === 'ku';
  const ArrowIcon = isKu ? ArrowLeft : ArrowRight;

  const handleDownload = () => {
    openExternalUrl(updateInfo.downloadUrl);
  };

  const handleRemindLater = () => {
    if (onSnooze) {
      onSnooze();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center z-[100] p-4 font-sans animate-in fade-in duration-200">
      <div 
        className="bg-white border border-zinc-300 w-full max-w-lg shadow-2xl rounded-none text-zinc-900 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150" 
        dir={isKu ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 text-white px-5 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-white flex items-center gap-2">
                <span>{isKu ? 'وەشانی نوێی سیستەم بەردەستە' : 'New System Update Available'}</span>
                <span className="bg-emerald-500 text-zinc-950 text-[10px] font-mono font-black px-1.5 py-0.5 rounded-none">
                  v{updateInfo.version}
                </span>
              </h3>
              <p className="text-[11px] text-zinc-300 font-medium">
                {isKu ? 'تکایە سیستەمەکەت نوێ بکەرەوە بۆ بەدەستهێنانی نوێترین تایبەتمەندییەکان' : 'Please update your system to receive the latest features'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-zinc-400 hover:text-white cursor-pointer transition-colors p-1"
            title={isKu ? 'داخستن' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs font-sans">
          {/* Version Comparison Card */}
          <div className="bg-zinc-50 border border-zinc-200 p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">
                {isKu ? 'وەشانی ئێستات:' : 'Current Version:'}
              </span>
              <div className="flex items-center gap-1.5 font-mono text-zinc-700 font-bold text-sm">
                <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                <span>v{currentVersion}</span>
              </div>
            </div>

            <div className="flex items-center justify-center px-3 text-indigo-600">
              <ArrowIcon className="w-5 h-5" />
            </div>

            <div className="space-y-0.5 text-start">
              <span className="text-[10px] text-emerald-700 font-bold block uppercase tracking-wider">
                {isKu ? 'وەشانی نوێ (ڕاسپێردراو):' : 'New Version (Target):'}
              </span>
              <div className="flex items-center gap-1.5 font-mono text-emerald-700 font-black text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>v{updateInfo.version}</span>
              </div>
            </div>
          </div>

          {/* Release Title & Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-700 block">
                {isKu ? 'زانیاری و وردەکارییەکانی ئەم وەشانە:' : 'Release Notes & Changelog:'}
              </label>
              {updateInfo.publishedAt && (
                <span className="text-[10px] font-mono text-zinc-400">
                  {new Date(updateInfo.publishedAt).toLocaleDateString(isKu ? 'ar-EG' : 'en-US')}
                </span>
              )}
            </div>

            <div className="bg-white border border-zinc-200 p-3 max-h-48 overflow-y-auto space-y-2 text-zinc-800">
              <h4 className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{updateInfo.title}</span>
              </h4>
              {updateInfo.releaseNotes ? (
                <p className="text-[11px] text-zinc-600 whitespace-pre-wrap leading-relaxed font-sans border-t border-zinc-100 pt-2">
                  {updateInfo.releaseNotes}
                </p>
              ) : (
                <p className="text-[11px] text-zinc-500 italic">
                  {isKu ? 'تایبەتمەندی و چاکسازیی نوێ لەم وەشانەدا زیادکراوە.' : 'Includes performance improvements and bug fixes.'}
                </p>
              )}
            </div>
          </div>

          {/* Safety & Backup Notice */}
          <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 flex items-start gap-2 text-[11px] text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-snug">
              {isKu 
                ? 'نوێکردنەوە هیچ داتایەکت ناسڕێتەوە و هەموو زانیاری، فرۆشتن و کاڵاکانت بە تەواوی پارێزراون.' 
                : 'Updating will not affect your stored data. All products, sales, and accounts are safe.'}
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleRemindLater}
            className="h-9 px-4 bg-white hover:bg-zinc-100 text-zinc-700 font-bold text-xs rounded-none border border-zinc-300 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{isKu ? 'دواتر بیرم بخەرەوە' : 'Remind Me Later'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-none transition-all cursor-pointer shadow-xs flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isKu ? 'داونلۆد و نوێکردنەوەی خێرا' : 'Download & Update Now'}</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </button>
        </div>
      </div>
    </div>
  );
};
