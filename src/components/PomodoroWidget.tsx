import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';

interface PomodoroWidgetProps {
  theme: 'light' | 'dark';
  mode: 'focus' | 'break';
  secondsLeft: number;
  isActive: boolean;
  completedSessions: number;
  onToggle: () => void;
  onReset: () => void;
}

export default function PomodoroWidget({
  theme, mode, secondsLeft, isActive, completedSessions, onToggle, onReset,
}: PomodoroWidgetProps) {
  const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60;
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const seconds = (secondsLeft % 60).toString().padStart(2, '0');
  const progress = 364.4 - (364.4 * (secondsLeft / totalTime));

  return (
    <div className={`p-5 rounded-xl border flex flex-col justify-between ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
    }`}>
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Pomodoro Timer</h3>
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="58" className="fill-none stroke-slate-200 dark:stroke-slate-800" strokeWidth="8" />
            <circle
              cx="64" cy="64" r="58"
              className={`fill-none ${mode === 'focus' ? 'stroke-indigo-600' : 'stroke-emerald-500'} transition-all duration-1000`}
              strokeWidth="8"
              strokeDasharray="364.4"
              strokeDashoffset={progress}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{minutes}:{seconds}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${mode === 'focus' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {mode === 'focus' ? 'Fokus' : 'Istirahat'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full">
          <button
            onClick={onToggle}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer ${
              isActive
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            {isActive ? 'Jeda' : 'Mulai'}
          </button>
          <button
            onClick={onReset}
            className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-3.5 flex items-center gap-1.5">
          <Coffee className="w-3.5 h-3.5" /> Sesi selesai: {completedSessions}
        </div>
      </div>
    </div>
  );
}
