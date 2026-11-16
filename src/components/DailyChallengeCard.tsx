import { Flame, Play } from 'lucide-react';

interface DailyChallengeCardProps {
  theme: 'light' | 'dark' | string;
  onStart?: () => void;
  startDailyChallenge?: () => void;
  userXP?: number;
  setShowIosInstallModal?: (show: boolean) => void;
}

export default function DailyChallengeCard({ onStart, startDailyChallenge }: DailyChallengeCardProps) {
  const handleStart = onStart || startDailyChallenge;
  return (
    <div className="p-5 rounded-2xl liquid-glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 shadow-xs">
          <Flame className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Tantangan Harian
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
            Kerjakan 5 soal acak dalam 10 menit untuk mendapatkan <strong className="text-amber-600 dark:text-amber-400 font-bold">2x XP</strong> dan menjaga Streak.
          </p>
        </div>
      </div>
      <button
        onClick={handleStart}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm shadow-amber-500/20 transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        Mulai Tantangan
      </button>
    </div>
  );
}

