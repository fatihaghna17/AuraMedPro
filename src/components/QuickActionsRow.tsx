import React from 'react';
import { Play, Flame, UploadCloud, ChevronRight, Plus } from 'lucide-react';

interface QuickActionsRowProps {
  theme: 'light' | 'dark' | string;
  pendingCount: number;
  pendingProgress: number | null;
  onNewQuiz: () => void;
  onResumeOrBanks: () => void;
  onBanks: () => void;
}

export default function QuickActionsRow({
  theme, pendingCount, pendingProgress, onNewQuiz, onResumeOrBanks, onBanks,
}: QuickActionsRowProps) {
  const isDark = theme === 'dark';
  const cardClass = `group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
    isDark 
      ? 'bg-slate-900/60 hover:bg-slate-900/90 border-white/[0.08] hover:border-indigo-500/40 shadow-lg shadow-black/10' 
      : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-indigo-300 shadow-sm'
  }`;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* Card 1: Try-Out Baru */}
        <div onClick={onNewQuiz} className={cardClass}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" strokeWidth={3} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white truncate">
                Try-Out Baru
              </h4>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate">
                Simulasi kuis adaptif & blok
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

        {/* Card 2: Lanjutkan Kuis / Topik */}
        <div onClick={onResumeOrBanks} className={cardClass}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white truncate">
                {pendingCount > 0 ? 'Lanjutkan Kuis' : 'Pilih Topik Soal'}
              </h4>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate">
                {pendingCount > 0
                  ? `Sesi tertunda (${pendingProgress}%)`
                  : 'Jelajahi bank soal'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

        {/* Card 3: Bank & Upload Soal */}
        <div onClick={onBanks} className={cardClass}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white truncate">
                Bank & Upload Soal
              </h4>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate">
                Impor file kuis JSON/YAML
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

      </div>
    </div>
  );
}