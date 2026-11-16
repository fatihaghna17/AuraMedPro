import { X, ChevronRight } from 'lucide-react';
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
  onClose: () => void;
}

export default function MobileQuizNavDrawer({
  isOpen, currentQuiz, userAnswers, doubtStatus, isRevealed, currentIndex, onNavigate, onClose,
}: MobileQuizNavDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm p-6 rounded-2xl liquid-glass-card relative animate-scale-in text-slate-900 dark:text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl liquid-glass-subtle-interactive text-slate-500 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 pr-8">
          Peta Soal Ujian
        </h3>

        <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1 tabular-nums">
          {currentQuiz.map((_, idx) => {
            const isAnswered = userAnswers[idx] !== null && userAnswers[idx] !== undefined && userAnswers[idx] !== '';
            const isDoubt = doubtStatus[idx];
            const isActive = idx === currentIndex;
            const revealed = !!isRevealed?.[idx];
            const isCorrect = isAnswered && isUserAnswerCorrect(userAnswers[idx], currentQuiz[idx]);
            
            let btnClass = "";
            if (isActive) {
              if (isDoubt) {
                btnClass = "bg-amber-500 border-amber-400 text-white font-bold shadow-sm ring-2 ring-amber-400/50";
              } else if (revealed) {
                if (isCorrect) {
                  btnClass = "bg-blue-600 border-blue-500 text-white font-bold shadow-sm ring-2 ring-blue-400/50";
                } else {
                  btnClass = "bg-rose-600 border-rose-500 text-white font-bold shadow-sm ring-2 ring-rose-400/50";
                }
              } else if (isAnswered) {
                btnClass = "bg-emerald-600 border-emerald-500 text-white font-bold shadow-sm ring-2 ring-emerald-400/50";
              } else {
                btnClass = "border-indigo-500 text-indigo-600 dark:text-indigo-400 border-2 font-bold ring-2 ring-indigo-500/30";
              }
            } else if (isDoubt) {
              btnClass = "bg-amber-500 border-amber-500 text-white";
            } else if (revealed) {
              if (isCorrect) {
                btnClass = "bg-blue-600 border-blue-600 text-white";
              } else {
                btnClass = "bg-rose-500 border-rose-500 text-white";
              }
            } else if (isAnswered) {
              btnClass = "bg-emerald-500 border-emerald-500 text-white";
            } else {
              btnClass = "liquid-glass-subtle-interactive text-slate-600 dark:text-slate-300";
            }

            return (
              <button
                key={idx}
                onClick={() => onNavigate(idx)}
                className={`h-10 rounded-xl border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${btnClass}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-200/60 dark:border-white/10 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Terjawab (Belum Cek)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
            <span>Benar (Sudah Cek)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span>Salah (Sudah Cek)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span>Ragu-ragu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-indigo-500 shrink-0" />
            <span>Sedang Aktif</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-300 dark:bg-slate-700" />
            <span>Belum Dijawab</span>
          </div>
        </div>
      </div>
    </div>
  );
}