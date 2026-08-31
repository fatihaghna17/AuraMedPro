import { Flame, Play } from 'lucide-react';

interface DailyChallengeCardProps {
  theme: 'light' | 'dark';
  onStart: () => void;
}

export default function DailyChallengeCard({ theme, onStart }: DailyChallengeCardProps) {
  return (
    <div className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
      theme === 'dark'
        ? 'bg-gradient-to-r from-amber-500/10 to-orange-600/10 border-amber-500/20 shadow-lg'
        : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-sm'
    }`}>
      <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
        <Flame className="w-40 h-40 text-amber-500" />
      </div>
      <div className="flex items-start gap-4 z-10 relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            Tantangan Harian
          </h3>
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            Kerjakan 5 soal acak dalam 10 menit. Dapatkan <strong className="text-amber-600 dark:text-amber-400">2x XP</strong> dan pertahankan Streak Belajar Anda!
          </p>
        </div>
      </div>
      <button
        onClick={onStart}
        className="z-10 relative flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25 transition-all cursor-pointer whitespace-nowrap min-w-[140px]"
      >
        <Play className="w-4 h-4 fill-current" />
        Mulai Sekarang
      </button>
    </div>
  );
}
