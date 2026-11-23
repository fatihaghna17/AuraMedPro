// src/components/flashcard3d/SessionSummary.tsx
import React from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';

interface SessionSummaryProps {
  deckTitle: string;
  totalCards: number;
  knownCount: number;
  unknownCount: number;
  onRepeatUnknown: () => void;
  onRepeatAll: () => void;
  onBackToList: () => void;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  deckTitle,
  totalCards,
  knownCount,
  unknownCount,
  onRepeatUnknown,
  onRepeatAll,
  onBackToList,
}) => {
  const pct = totalCards > 0 ? Math.round((knownCount / totalCards) * 100) : 0;
  const allMastered = unknownCount === 0 && totalCards > 0;

  return (
    <div className="w-full max-w-[520px] mx-auto fc3d-panel rounded-[28px] p-7 sm:p-9 text-center animate-fade-in-up">
      <div className="w-12 h-12 mx-auto rounded-2xl fc3d-chip flex items-center justify-center text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-6 h-6" />
      </div>

      <h2 className="mt-5 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 text-balance">
        {allMastered ? 'Semua kartu sudah hafal' : 'Satu putaran selesai'}
      </h2>
      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 truncate">{deckTitle}</p>

      {/* Progress visual ringkas */}
      <div className="mt-7 space-y-2.5 text-left">
        <div className="flex items-baseline justify-between text-xs font-semibold tabular-nums">
          <span className="text-emerald-700 dark:text-emerald-300">Hafal {knownCount}</span>
          <span className="text-slate-500 dark:text-slate-400">{pct}% dari {totalCards} kartu</span>
          <span className="text-rose-700 dark:text-rose-300">Belum {unknownCount}</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden bg-slate-900/10 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2.5">
        {unknownCount > 0 ? (
          <>
            <button
              type="button"
              onClick={onRepeatUnknown}
              className="w-full py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Ulangi yang belum hafal ({unknownCount})
            </button>
            <button
              type="button"
              onClick={onRepeatAll}
              className="w-full py-3 px-5 rounded-2xl liquid-glass-subtle-interactive text-slate-800 dark:text-slate-200 text-sm font-semibold cursor-pointer"
            >
              Ulangi semua kartu ({totalCards})
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onRepeatAll}
            className="w-full py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Ulangi semua kartu ({totalCards})
          </button>
        )}

        <button
          type="button"
          onClick={onBackToList}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 mt-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke daftar deck
        </button>
      </div>
    </div>
  );
};
