import { Check, ChevronLeft, ChevronRight, Flag, LayoutGrid } from 'lucide-react';

interface MobileBottomActionBarProps {
  theme: 'light' | 'dark' | string;
  currentIndex: number;
  totalQuestions: number;
  isDoubt: boolean;
  isRevealed: boolean;
  hasAnswer: boolean;
  hideCheckAnswer?: boolean;
  onDoubtToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onCheck: () => void;
  onFinish: () => void;
  onOpenMap?: () => void;
}

export default function MobileBottomActionBar({
  theme, currentIndex, totalQuestions, isDoubt, isRevealed, hasAnswer, hideCheckAnswer = false,
  onDoubtToggle, onPrev, onNext, onCheck, onFinish, onOpenMap,
}: MobileBottomActionBarProps) {
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 lg:hidden px-3 py-2.5 border-t backdrop-blur-md transition-colors ${
      theme === 'dark' ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white/85 border-slate-200/80'
    }`}>
      <div className="flex items-center gap-2 max-w-md mx-auto">
        {onOpenMap && (
          <button
            type="button"
            onClick={onOpenMap}
            title="Peta Soal"
            className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onDoubtToggle}
          className={`px-3 h-10 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
            isDoubt
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
              : theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flag className={`w-3.5 h-3.5 ${isDoubt ? 'fill-current' : ''}`} />
          <span>Ragu</span>
        </button>

        <button
          type="button"
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-40 cursor-pointer ${
            theme === 'dark'
              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
          title="Soal Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {!isRevealed && !hideCheckAnswer && (
          <button
            type="button"
            onClick={() => onCheck()}
            disabled={!hasAnswer}
            className="flex-1 h-10 px-3 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Cek</span>
          </button>
        )}

        {currentIndex === totalQuestions - 1 ? (
          <button
            type="button"
            onClick={() => onFinish()}
            className="flex-1 h-10 px-3 flex items-center justify-center gap-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
          >
            <span>Selesai</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNext()}
            className="flex-1 h-10 px-3 flex items-center justify-center gap-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
          >
            <span>Lanjut</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
