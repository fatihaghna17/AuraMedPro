import { X, CheckCircle2 } from 'lucide-react';
import { Question } from '../types';
import { isUserAnswerCorrect } from '../utils/quizUtils';

interface MobileQuizNavDrawerProps {
  theme: 'light' | 'dark';
  isOpen: boolean;
  currentQuiz: Question[];
  userAnswers: (string | null)[];
  doubtStatus: boolean[];
  isRevealed?: boolean[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onFinishQuiz?: () => void;
  onClose: () => void;
}

export default function MobileQuizNavDrawer({
  theme,
  isOpen,
  currentQuiz,
  userAnswers,
  doubtStatus,
  isRevealed,
  currentIndex,
  onNavigate,
  onFinishQuiz,
  onClose,
}: MobileQuizNavDrawerProps) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';
  const answeredCount = userAnswers.filter(
    (a) => a !== null && a !== undefined && a !== ''
  ).length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 lg:hidden flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/55 backdrop-blur-xs animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full sm:max-w-md max-h-[85dvh] flex flex-col rounded-t-[30px] sm:rounded-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] mobile-glass-shell relative animate-slide-up ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}
      >
        {/* Mobile sheet drag handle */}
        <div className="w-10 h-1 rounded-full bg-slate-400/40 dark:bg-white/25 mx-auto mb-3 sm:hidden shrink-0" />

        <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-xs font-extrabold uppercase tracking-wider truncate">
              Peta Soal Ujian
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold tabular-nums border shrink-0 ${
                isDark
                  ? 'bg-sky-400/15 border-sky-300/30 text-sky-200'
                  : 'bg-blue-600/10 border-blue-600/20 text-blue-700'
              }`}
            >
              {answeredCount} / {currentQuiz.length} Terjawab
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Peta Soal"
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer border ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 border-white/15 text-sky-100'
                : 'bg-white/75 hover:bg-white border-white text-slate-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 overflow-y-auto pr-1 py-0.5 tabular-nums flex-1 min-h-0">
          {currentQuiz.map((_, idx) => {
            const isAnswered =
              userAnswers[idx] !== null &&
              userAnswers[idx] !== undefined &&
              userAnswers[idx] !== '';
            const isDoubt = doubtStatus[idx];
            const isActive = idx === currentIndex;
            const revealed = !!isRevealed?.[idx];
            const isCorrect =
              isAnswered && isUserAnswerCorrect(userAnswers[idx], currentQuiz[idx]);

            let btnClass = '';
            if (isActive) {
              if (isDoubt) {
                btnClass =
                  'bg-amber-500 border-amber-300 text-white font-extrabold shadow-sm ring-2 ring-amber-400/60';
              } else if (revealed) {
                btnClass = isCorrect
                  ? 'bg-blue-600 border-blue-400 text-white font-extrabold shadow-sm ring-2 ring-blue-400/60'
                  : 'bg-rose-600 border-rose-400 text-white font-extrabold shadow-sm ring-2 ring-rose-400/60';
              } else if (isAnswered) {
                btnClass =
                  'bg-emerald-600 border-emerald-400 text-white font-extrabold shadow-sm ring-2 ring-emerald-400/60';
              } else {
                btnClass = isDark
                  ? 'bg-[#2f4578] border-[#7dd3fc] text-[#7dd3fc] border-2 font-extrabold ring-2 ring-sky-400/35'
                  : 'bg-white border-indigo-600 text-indigo-700 border-2 font-extrabold ring-2 ring-indigo-500/25';
              }
            } else if (isDoubt) {
              btnClass = 'bg-amber-500/90 border-amber-400 text-white font-bold';
            } else if (revealed) {
              btnClass = isCorrect
                ? 'bg-blue-600/90 border-blue-500 text-white font-bold'
                : 'bg-rose-500/90 border-rose-400 text-white font-bold';
            } else if (isAnswered) {
              btnClass = 'bg-emerald-500/90 border-emerald-400 text-white font-bold';
            } else {
              btnClass = isDark
                ? 'bg-white/[0.08] hover:bg-white/[0.15] border-white/[0.14] text-white/85'
                : 'bg-white/65 hover:bg-white border-white/85 text-slate-700';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onNavigate(idx)}
                className={`h-10 rounded-xl border text-xs transition-all flex items-center justify-center cursor-pointer ${btnClass}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <div
          className={`grid grid-cols-3 gap-x-2 gap-y-1.5 mt-4 pt-3.5 border-t text-[10px] font-semibold shrink-0 ${
            isDark
              ? 'border-white/12 text-sky-100/80'
              : 'border-slate-300/60 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">Terjawab</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
            <span className="truncate">Benar</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="truncate">Salah</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="truncate">Ragu</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-sky-400 shrink-0" />
            <span className="truncate">Aktif</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-300 dark:bg-white/25" />
            <span className="truncate">Kosong</span>
          </div>
        </div>

        {onFinishQuiz && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onFinishQuiz();
            }}
            className="mt-3.5 w-full h-11 rounded-2xl bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-[0_8px_20px_-4px_rgba(225,29,72,0.5)] border border-white/25 cursor-pointer shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Kumpulkan & Selesaikan Ujian</span>
          </button>
        )}
      </div>
    </div>
  );
}