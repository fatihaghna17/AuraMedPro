import { X, ChevronRight } from 'lucide-react';
import { Question } from '../types';

interface MobileQuizNavDrawerProps {
  theme: 'light' | 'dark';
  isOpen: boolean;
  currentQuiz: Question[];
  userAnswers: (string | null)[];
  doubtStatus: boolean[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

export default function MobileQuizNavDrawer({
  theme, isOpen, currentQuiz, userAnswers, doubtStatus, currentIndex, onNavigate, onClose,
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
            const isAnswered = userAnswers[idx] !== null;
            const isDoubt = doubtStatus[idx];
            const isActive = idx === currentIndex;
            
            let btnClass = "";
            if (isActive) {
              btnClass = "border-indigo-500 text-indigo-500 border-2 font-black shadow-sm ring-1 ring-indigo-500/20";
            } else if (isDoubt) {
              btnClass = "bg-amber-500 border-amber-500 text-white shadow-sm";
            } else if (isAnswered) {
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
            <span className="w-2 rounded-full h-2 bg-emerald-500" />
            <span>Terjawab</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 rounded-full h-2 bg-amber-500" />
            <span>Ragu-ragu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 rounded-full h-2 bg-indigo-500" />
            <span>Aktif</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 rounded-full h-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <span>Belum Dijawab</span>
          </div>
        </div>
      </div>
    </div>
  );
}