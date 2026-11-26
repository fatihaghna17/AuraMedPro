import React from 'react';
import { Sparkles, X, CheckCircle2 } from 'lucide-react';

interface WhatsNewModalProps {
  onClose: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 max-lg-liquid-card w-full sm:max-w-sm max-h-[90dvh] overflow-y-auto rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800"
      >
        <div className="p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 max-lg-liquid-interactive text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-4">
            <Sparkles className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">
            Ada yang Baru! 🎉
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 font-medium">
            AuraMedPro semakin keren! Yuk lihat apa aja yang baru:
          </p>

          <div className="space-y-4">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Pembayaran via QRIS</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tinggal scan, konfirmasi ke WhatsApp Admin, langsung aktif!</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Ganti Password di Profil</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sekarang kamu bisa mengganti password akunmu di menu Profil.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Password Lebih Mudah</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Password baru sekarang menggunakan format 3 digit angka agar lebih mudah diingat.</p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-7 sm:mt-8 py-3.5 rounded-xl font-bold text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            Sip, Mengerti!
          </button>
        </div>
      </div>
    </div>
  );
};
