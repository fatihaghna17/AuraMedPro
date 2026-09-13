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
  theme, isOpen, currentQuiz, userAnswers, doubtStatus, isRevealed, currentIndex, onNavigate, onClose,
}: MobileQuizNavDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl relative animate-scale-up ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-455 hover:text-slate-205 hover:bg-slate-800/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-4 pr-8">
          Peta Soal Ujian
        </h3>

        <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1">
          {currentQuiz.map((_, idx) => {
            const isAnswered = userAnswers[idx] !== null && userAnswers[idx] !== undefined && userAnswers[idx] !== '';
            const isDoubt = doubtStatus[idx];
            const isActive = idx === currentIndex;
            const revealed = !!isRevealed?.[idx];
            const isCorrect = isAnswered && isUserAnswerCorrect(userAnswers[idx], currentQuiz[idx]);
            
            let btnClass = "";
            if (isActive) {
              if (isDoubt) {
                btnClass = "bg-amber-500 border-amber-400 text-white font-black shadow-md ring-2 ring-amber-400 ring-offset-2";
              } else if (revealed) {
                if (isCorrect) {
                  btnClass = "bg-blue-600 border-blue-500 text-white font-black shadow-md ring-2 ring-blue-400 ring-offset-2";
                } else {
                  btnClass = "bg-rose-600 border-rose-500 text-white font-black shadow-md ring-2 ring-rose-400 ring-offset-2";
                }
              } else if (isAnswered) {
                btnClass = "bg-emerald-600 border-emerald-500 text-white font-black shadow-md ring-2 ring-emerald-400 ring-offset-2";
              } else {
                btnClass = "border-indigo-500 text-indigo-500 border-2 font-black shadow-sm ring-2 ring-indigo-500/30";
              }
            } else if (isDoubt) {
              btnClass = "bg-amber-500 border-amber-500 text-white shadow-sm";
            } else if (revealed) {
              if (isCorrect) {
                // SUDAH DICEK & BENAR: Biru / Indigo (bukan hijau!)
                btnClass = "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/20";
              } else {
                // SUDAH DICEK & SALAH: Merah
                btnClass = "bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-500/20";
              }
            } else if (isAnswered) {
              // TERJAWAB TAPI BELUM DICEK: Hijau
              btnClass = "bg-emerald-500 border-emerald-500 text-white shadow-sm";
            } else {
              btnClass = theme === 'dark' 
                ? 'bg-slate-800 border-slate-750 text-slate-450' 
                : 'bg-slate-100 text-slate-600 border-slate-200/60';
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

        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] font-bold text-slate-500">
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
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <span>Belum Dijawab</span>
          </div>
        </div>
      </div>
    </div>
  );
}