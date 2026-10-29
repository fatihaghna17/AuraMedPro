import { Flame, Play } from 'lucide-react';

interface DailyChallengeCardProps {
  theme: 'light' | 'dark';
  onStart: () => void;
}

export default function DailyChallengeCard({ theme, onStart }: DailyChallengeCardProps) {
  return (
    <div className={`p-5 rounded-xl border backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
      theme === 'dark'
        ? 'bg-gradient-to-b from-white/[0.08] via-slate-900/35 to-slate-900/45 border-white/15 shadow-xl'
        : 'liquid-glass-card'
    }`}>
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Flame className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Tantangan Harian
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Kerjakan 5 soal acak dalam 10 menit untuk mendapatkan <strong className="text-amber-600 dark:text-amber-400">2x XP</strong> dan menjaga Streak.
          </p>
        </div>
      </div>
      <button
        onClick={onStart}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        Mulai Tantangan
      </button>
    </div>
  );
}
