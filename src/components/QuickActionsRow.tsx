import React from 'react';
import { Flame, UploadCloud, ChevronRight, Plus } from 'lucide-react';

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
  const cardClass = `group flex items-center justify-between p-4 rounded-xl border transition-colors duration-150 cursor-pointer ${
    isDark 
      ? 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700' 
      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-xs'
  }`;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Card 1: Try-Out Baru */}
        <div onClick={onNewQuiz} className={cardClass}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                Try-Out Baru
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Simulasi kuis adaptif & blok
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors shrink-0 ml-2" />
        </div>

        {/* Card 2: Lanjutkan Kuis / Topik */}
        <div onClick={onResumeOrBanks} className={cardClass}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {pendingCount > 0 ? 'Lanjutkan Kuis' : 'Pilih Topik Soal'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {pendingCount > 0
                  ? `Sesi tertunda (${pendingProgress}%)`
                  : 'Jelajahi bank soal'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors shrink-0 ml-2" />
        </div>

        {/* Card 3: Bank & Upload Soal */}
        <div onClick={onBanks} className={cardClass}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                Bank & Upload Soal
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Impor file kuis JSON/YAML
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors shrink-0 ml-2" />
        </div>

      </div>
    </div>
  );
}