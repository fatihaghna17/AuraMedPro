import React from 'react';
import { ArrowLeft, Maximize2, Minimize2, Menu } from 'lucide-react';
import { formatTimer } from '../utils/quizUtils';

interface QuizHeaderProps {
  theme: 'light' | 'dark';
  currentIndex: number;
  totalQuestions: number;
  isAdaptiveMode: boolean;
  currentDifficulty: string;
  quizSecondsLeft: number;
  quizTimerActive?: boolean;
  isFullscreen: boolean;
  onExit: () => void;
  onToggleFullscreen: () => void;
  onOpenMobileNav: () => void;
}

export default React.memo(function QuizHeader({
  currentIndex, totalQuestions, isAdaptiveMode, currentDifficulty,
  quizSecondsLeft, quizTimerActive = true, isFullscreen, onExit, onToggleFullscreen, onOpenMobileNav,
}: QuizHeaderProps) {
  return (
    <header className="sticky top-0 z-40 liquid-glass-card border-b text-slate-900 dark:text-slate-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between relative">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold liquid-glass-subtle-interactive text-slate-700 dark:text-slate-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Simpan & Keluar</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-4 tabular-nums">
          <span className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Soal {currentIndex + 1} {isAdaptiveMode ? '' : `dari ${totalQuestions}`}
          </span>
          
          {isAdaptiveMode && (
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
              currentDifficulty === 'mudah' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' :
              currentDifficulty === 'sedang' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25' :
              'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25'
            }`}>
              Level: {currentDifficulty}
            </span>
          )}
          
          {!quizTimerActive ? (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg liquid-glass-subtle text-slate-600 dark:text-slate-300 font-semibold">
              Tanpa Batas Waktu
            </span>
          ) : (
            <span className={`flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1 rounded-lg border font-mono tabular-nums transition-colors ${
              quizSecondsLeft < 300
                ? 'bg-rose-500/15 border-rose-500/35 text-rose-600 dark:text-rose-400 font-bold animate-pulse'
                : quizSecondsLeft < 600
                  ? 'bg-amber-500/15 border-amber-500/35 text-amber-600 dark:text-amber-400 font-bold'
                  : 'liquid-glass-subtle text-slate-800 dark:text-slate-100 font-bold'
            }`}>
              {formatTimer(quizSecondsLeft)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl liquid-glass-subtle-interactive text-slate-700 dark:text-slate-200 cursor-pointer"
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenMobileNav}
            className="lg:hidden p-2 rounded-xl liquid-glass-subtle-interactive text-slate-700 dark:text-slate-200 cursor-pointer"
            title="Peta Soal"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-200/70 dark:bg-slate-800/70">
        <div 
          className="h-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>
    </header>
  );
});

