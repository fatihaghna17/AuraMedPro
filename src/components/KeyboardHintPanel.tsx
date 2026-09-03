interface KeyboardHintPanelProps {
  theme: 'light' | 'dark';
}

export default function KeyboardHintPanel({ theme }: KeyboardHintPanelProps) {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 hidden sm:flex justify-center animate-fade-in">
      <div className={`text-[10px] sm:text-xs font-bold px-4 py-2 rounded-full border shadow-sm flex items-center gap-4 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <span><kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[9px] mr-1">1</kbd>-<kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[9px] ml-1 mr-1.5">5</kbd> / <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[9px] mr-1">A</kbd>-<kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[9px] ml-1 mr-1.5">E</kbd> Jawaban</span>
        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
        <span><kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[9px] mr-1.5">↵ Enter</kbd> Cek Jawaban</span>
        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
        <span><kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[9px] mr-1.5">←→</kbd> Navigasi</span>
        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
        <span><kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[9px] mr-1.5">R</kbd> Ragu</span>
        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
        <span><kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[9px] mr-1.5">/</kbd> Ketik</span>
      </div>
    </div>
  );
}
