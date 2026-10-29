import { Smartphone } from 'lucide-react';

interface IosInstallBannerProps {
  theme: 'light' | 'dark';
  onInstallClick: () => void;
}

export default function IosInstallBanner({ theme, onInstallClick }: IosInstallBannerProps) {
  return (
    <div className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl ${
      theme === 'dark'
        ? 'bg-gradient-to-b from-white/[0.08] via-slate-900/35 to-slate-900/45 border-white/15 shadow-xl'
        : 'bg-white/45 border-white/70 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]'
    }`}>
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-500 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h3 className="text-xs font-black text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">📲 AuraMed PRO untuk iPhone & iPad</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Jadikan aplikasi ini sebagai PWA di perangkat iOS Anda untuk akses instan langsung dari Home Screen.
          </p>
        </div>
      </div>

      <button
        onClick={onInstallClick}
        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/15 transition-all cursor-pointer flex-shrink-0 text-center"
      >
        Petunjuk Instalasi iOS
      </button>
    </div>
  );
}
