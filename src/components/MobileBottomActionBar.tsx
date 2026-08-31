interface MobileBottomActionBarProps {
  theme: 'light' | 'dark';
  currentIndex: number;
  totalQuestions: number;
  isDoubt: boolean;
  isRevealed: boolean;
  hasAnswer: boolean;
  onDoubtToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onCheck: () => void;
  onFinish: () => void;
}

export default function MobileBottomActionBar({
  theme, currentIndex, totalQuestions, isDoubt, isRevealed, hasAnswer,
  onDoubtToggle, onPrev, onNext, onCheck, onFinish,
}: MobileBottomActionBarProps) {
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 lg:hidden p-4 border-t backdrop-blur-md transition-colors ${
      theme === 'dark' ? 'bg-slate-950/90 border-slate-900/80' : 'bg-slate-50/90 border-slate-200/60'
    }`}>
      <div className="flex items-center gap-2 max-w-md mx-auto">
        <button
          onClick={onDoubtToggle}
          className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
            isDoubt
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
              : theme === 'dark'
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          🤔 Ragu
        </button>

        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={`w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl border text-xs font-bold transition-all disabled:opacity-40 cursor-pointer ${
            theme === 'dark'
              ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-800'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          ←
        </button>

        {!isRevealed && (
          <button
            onClick={() => onCheck()}
            disabled={!hasAnswer}
            className="flex-1 py-3 px-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/15 transition-all duration-200 active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer text-center"
          >
            ✓ Cek
          </button>
        )}

        {currentIndex === totalQuestions - 1 ? (
          <button
            onClick={() => onFinish()}
            className="flex-1 py-3 px-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/10 transition-all cursor-pointer text-center"
          >
            Selesai
          </button>
        ) : (
          <button
            onClick={() => onNext()}
            className="flex-1 py-3 px-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/10 transition-all duration-200 cursor-pointer text-center"
          >
            Lanjut →
          </button>
        )}
      </div>
    </div>
  );
}
