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
  isFullscreen: boolean;
  onExit: () => void;
  onToggleFullscreen: () => void;
  onOpenMobileNav: () => void;
}

export default React.memo(function QuizHeader({
  theme, currentIndex, totalQuestions, isAdaptiveMode, currentDifficulty,
  quizSecondsLeft, isFullscreen, onExit, onToggleFullscreen, onOpenMobileNav,
}: QuizHeaderProps) {
  return (
    <header className={`sticky top-0 z-40 border-b transition-colors quiz-card ${
      theme === 'dark' ? 'bg-slate-950 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between relative">
        <button
          onClick={onExit}
          className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>

        <div className="flex items-center gap-4">
          <span className="text-xs sm:text-sm font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
            Soal {currentIndex + 1} {isAdaptiveMode ? '' : `dari ${totalQuestions}`}
          </span>
          
          {isAdaptiveMode && (
            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
              currentDifficulty === 'mudah' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
              currentDifficulty === 'sedang' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
              'bg-rose-500/10 text-rose-500 border-rose-500/20'
            }`}>
              Level: {currentDifficulty}
            </span>
          )}
          
          <span className={`flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1 rounded-full border transition-colors ${
            quizSecondsLeft < 300
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 font-black animate-pulse'
              : quizSecondsLeft < 600
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 font-extrabold'
                : theme === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-slate-300 font-bold'
                  : 'bg-slate-100 border-slate-200 text-slate-750 font-bold'
          }`}>
            ⏱️ {formatTimer(quizSecondsLeft)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFullscreen}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenMobileNav}
            className={`lg:hidden p-2 rounded-xl border transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-800 text-slate-450 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-200 text-slate-655 hover:bg-slate-200'
            }`}
            title="Peta Soal"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/50 dark:bg-slate-800/50">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>
    </header>
  );
});
