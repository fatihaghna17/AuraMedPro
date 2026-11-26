import { X, Smartphone, Share2 } from 'lucide-react';

interface IosInstallModalProps {
  isOpen: boolean;
  theme: 'light' | 'dark';
  onClose: () => void;
}

export default function IosInstallModal({ isOpen, theme, onClose }: IosInstallModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full sm:max-w-md max-h-[90dvh] overflow-y-auto p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 rounded-t-[28px] sm:rounded-3xl border shadow-2xl relative animate-scale-up max-lg-liquid-card ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-500/10 max-lg-liquid-interactive transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5 pr-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-indigo-500">
            Instal di iOS (Safari PWA)
          </h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          Akses AuraMed secara instan langsung dari Home Screen perangkat iOS Anda. Ikuti petunjuk sederhana ini menggunakan browser <strong className="text-slate-800 dark:text-slate-200">Safari</strong>:
        </p>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Buka situs ini di browser <strong className="text-slate-900 dark:text-white">Safari</strong> pada iPhone/iPad Anda.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
              2
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-center flex-wrap gap-1">
              <span>Ketuk tombol <strong className="text-slate-900 dark:text-white">Bagikan (Share)</strong></span>
              <span className="inline-flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 mx-0.5">
                <Share2 className="w-3 h-3 text-indigo-500" />
              </span>
              <span>pada bar menu Safari.</span>
            </p>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
              3
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Gulir menu ke bawah lalu ketuk opsi <strong className="text-slate-900 dark:text-white">&ldquo;Tambah ke Layar Utama&rdquo; (Add to Home Screen)</strong>.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
              4
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Ketuk <strong className="text-slate-900 dark:text-white">&ldquo;Tambah&rdquo; (Add)</strong> di pojok kanan atas untuk menyelesaikan instalasi.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/15 transition-all cursor-pointer text-center"
        >
          Mengerti & Tutup
        </button>
      </div>
    </div>
  );
}
