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
  theme, currentIndex, totalQuestions, isAdaptiveMode, currentDifficulty,
  quizSecondsLeft, quizTimerActive = true, isFullscreen, onExit, onToggleFullscreen, onOpenMobileNav,
}: QuizHeaderProps) {
  return (
    <header className={`sticky top-0 z-40 border-b transition-colors ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-50' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between relative">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200">
            Soal {currentIndex + 1} {isAdaptiveMode ? '' : `dari ${totalQuestions}`}
          </span>
          
          {isAdaptiveMode && (
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
              currentDifficulty === 'mudah' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
              currentDifficulty === 'sedang' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
              'bg-rose-500/10 text-rose-500 border-rose-500/20'
            }`}>
              Level: {currentDifficulty}
            </span>
          )}
          
          {!quizTimerActive ? (
            <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border font-semibold ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              Tanpa Batas Waktu
            </span>
          ) : (
            <span className={`flex items-center gap-1.5 text-xs sm:text-sm px-2.5 py-1 rounded-md border font-mono transition-colors ${
              quizSecondsLeft < 300
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 font-bold animate-pulse'
                : quizSecondsLeft < 600
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 font-bold'
                  : theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-slate-200 font-semibold'
                    : 'bg-slate-100 border-slate-200 text-slate-700 font-semibold'
            }`}>
              {formatTimer(quizSecondsLeft)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFullscreen}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenMobileNav}
            className={`lg:hidden p-2 rounded-lg border transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Peta Soal"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800">
        <div 
          className="h-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>
    </header>
  );
});
