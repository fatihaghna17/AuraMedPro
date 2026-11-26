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
  pendingCount, pendingProgress, onNewQuiz, onResumeOrBanks, onBanks,
}: QuickActionsRowProps) {
  const cardClass = "group flex items-center justify-between p-3.5 sm:p-5 rounded-2xl liquid-glass-interactive cursor-pointer";

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
        
        {/* Card 1: Try-Out Baru */}
        <div onClick={onNewQuiz} className={cardClass}>
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 flex items-center justify-center shrink-0 shadow-xs">
              <Plus className="w-4.5 h-4.5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                Try-Out Baru
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Simulasi kuis adaptif & blok
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

        {/* Card 2: Lanjutkan Kuis / Topik */}
        <div onClick={onResumeOrBanks} className={cardClass}>
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center shrink-0 shadow-xs">
              <Flame className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {pendingCount > 0 ? 'Lanjutkan Kuis' : 'Pilih Topik Soal'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 tabular-nums">
                {pendingCount > 0
                  ? `Sesi tertunda (${pendingProgress}%)`
                  : 'Jelajahi bank soal'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

        {/* Card 3: Bank & Upload Soal */}
        <div onClick={onBanks} className={cardClass}>
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0 shadow-xs">
              <UploadCloud className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                Bank & Upload Soal
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Impor file kuis JSON/YAML
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

      </div>
    </div>
  );
}