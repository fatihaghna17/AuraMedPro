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
  currentIndex, totalQuestions, isDoubt, isRevealed, hasAnswer, hideCheckAnswer = false,
  onDoubtToggle, onPrev, onNext, onCheck, onFinish, onOpenMap,
}: MobileBottomActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden px-3 py-2.5 liquid-glass-card border-t">
      <div className="flex items-center gap-2 max-w-md mx-auto">
        {onOpenMap && (
          <button
            type="button"
            onClick={onOpenMap}
            title="Peta Soal"
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl liquid-glass-subtle-interactive text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onDoubtToggle}
          className={`px-3 h-10 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
            isDoubt
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-300'
              : 'liquid-glass-subtle-interactive text-slate-700 dark:text-slate-200'
          }`}
        >
          <Flag className={`w-3.5 h-3.5 ${isDoubt ? 'fill-current' : ''}`} />
          <span>Ragu</span>
        </button>

        <button
          type="button"
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl liquid-glass-subtle-interactive text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
          title="Soal Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {!isRevealed && !hideCheckAnswer && (
          <button
            type="button"
            onClick={() => onCheck()}
            disabled={!hasAnswer}
            className="flex-1 h-10 px-3 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-colors disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Cek</span>
          </button>
        )}

        {currentIndex === totalQuestions - 1 ? (
          <button
            type="button"
            onClick={() => onFinish()}
            className="flex-1 h-10 px-3 flex items-center justify-center gap-1 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 transition-colors cursor-pointer"
          >
            <span>Selesai</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNext()}
            className="flex-1 h-10 px-3 flex items-center justify-center gap-1 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-colors cursor-pointer"
          >
            <span>Lanjut</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

