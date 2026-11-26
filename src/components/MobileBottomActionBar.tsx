import { Check, ChevronLeft, ChevronRight, Flag, LayoutGrid, RotateCcw } from 'lucide-react';

interface MobileBottomActionBarProps {
  theme: 'light' | 'dark' | string;
  currentIndex: number;
  totalQuestions: number;
  isDoubt: boolean;
  isRevealed: boolean;
  hasAnswer: boolean;
  hideCheckAnswer?: boolean;
  isLastQuestion?: boolean;
  showClearAnswer?: boolean;
  onClearAnswer?: () => void;
  onDoubtToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onCheck: () => void;
  onFinish: () => void;
  onOpenMap?: () => void;
}

export default function MobileBottomActionBar({
  theme,
  currentIndex,
  totalQuestions,
  isDoubt,
  isRevealed,
  hasAnswer,
  hideCheckAnswer = false,
  isLastQuestion,
  showClearAnswer = false,
  onClearAnswer,
  onDoubtToggle,
  onPrev,
  onNext,
  onCheck,
  onFinish,
  onOpenMap,
}: MobileBottomActionBarProps) {
  const isDark = theme === 'dark';
  const atEnd = isLastQuestion ?? currentIndex === totalQuestions - 1;

  return (
    <div className="fixed left-3 right-3 bottom-[max(0.6rem,env(safe-area-inset-bottom))] z-30 lg:hidden max-w-lg mx-auto p-1.5 rounded-[26px] mobile-glass-shell select-none">
      <div className="flex items-center gap-1.5">
        {onOpenMap && (
          <button
            type="button"
            onClick={onOpenMap}
            title="Peta Soal"
            aria-label="Peta Soal"
            className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-[18px] border cursor-pointer transition-colors ${
              isDark
                ? 'bg-white/[0.10] hover:bg-white/[0.18] border-white/[0.16] text-white'
                : 'bg-white/70 hover:bg-white border-white/90 text-slate-800 shadow-2xs'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onDoubtToggle}
          title="Tandai Ragu-Ragu"
          className={`px-2.5 h-10 flex-shrink-0 flex items-center justify-center gap-1 rounded-[18px] text-[11.5px] font-extrabold border transition-colors cursor-pointer ${
            isDoubt
              ? 'bg-amber-500/25 border-amber-400/60 text-amber-600 dark:text-amber-300 shadow-xs'
              : isDark
              ? 'bg-white/[0.08] hover:bg-white/[0.16] border-white/[0.14] text-white/90'
              : 'bg-white/65 hover:bg-white border-white/85 text-slate-700'
          }`}
        >
          <Flag className={`w-3.5 h-3.5 shrink-0 ${isDoubt ? 'fill-current' : ''}`} />
          <span className="hidden min-[375px]:inline">Ragu</span>
        </button>

        {showClearAnswer && hasAnswer && !isRevealed && onClearAnswer && (
          <button
            type="button"
            onClick={onClearAnswer}
            title="Hapus Jawaban (Hindari minus poin RMO)"
            aria-label="Hapus Jawaban"
            className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-[18px] border transition-colors cursor-pointer ${
              isDark
                ? 'bg-rose-500/18 border-rose-400/35 text-rose-300'
                : 'bg-rose-500/12 border-rose-500/25 text-rose-600'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={onPrev}
          disabled={currentIndex === 0}
          aria-label="Soal Sebelumnya"
          className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-[18px] border disabled:opacity-35 cursor-pointer transition-colors ${
            isDark
              ? 'bg-white/[0.08] hover:bg-white/[0.16] border-white/[0.14] text-white'
              : 'bg-white/65 hover:bg-white border-white/85 text-slate-800'
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
            className="flex-1 min-w-0 h-10 px-2.5 flex items-center justify-center gap-1 rounded-[18px] text-xs font-extrabold bg-gradient-to-b from-sky-400 to-indigo-600 text-white shadow-[0_6px_16px_-4px_rgba(79,70,229,0.5)] border border-white/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span className="truncate">Cek</span>
          </button>
        )}

        {atEnd ? (
          <button
            type="button"
            onClick={() => onFinish()}
            className="flex-1 min-w-0 h-10 px-3 flex items-center justify-center gap-1 rounded-[18px] text-xs font-extrabold bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-[0_6px_16px_-4px_rgba(225,29,72,0.5)] border border-white/25 transition-all cursor-pointer"
          >
            <span className="truncate">Selesai</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNext()}
            className="flex-1 min-w-0 h-10 px-2.5 flex items-center justify-center gap-1 rounded-[18px] text-xs font-extrabold bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-[0_6px_16px_-4px_rgba(79,70,229,0.5)] border border-white/25 transition-all cursor-pointer"
          >
            <span className="truncate">Lanjut</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}
