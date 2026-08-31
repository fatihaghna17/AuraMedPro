import { Play, Flame, UploadCloud } from 'lucide-react';

interface QuickActionsRowProps {
  theme: 'light' | 'dark';
  pendingCount: number;
  pendingProgress: number | null;
  onNewQuiz: () => void;
  onResumeOrBanks: () => void;
  onBanks: () => void;
}

export default function QuickActionsRow({
  theme, pendingCount, pendingProgress, onNewQuiz, onResumeOrBanks, onBanks,
}: QuickActionsRowProps) {
  const cardClass = `min-w-[220px] snap-center flex-1 p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] hover:-translate-y-0.5 ${
    theme === 'dark' ? 'bg-slate-900/50 border-slate-800 hover:border-indigo-500/30' : 'bg-white border-slate-200 hover:border-indigo-200'
  }`;

  return (
    <div>
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">Aksi Cepat</h3>
      <div className="flex overflow-x-auto snap-x snap-mandatory lg:grid lg:grid-cols-3 gap-4 pb-2 lg:pb-0 scrollbar-none">
        
        <div onClick={onNewQuiz} className={cardClass}>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-505 flex items-center justify-center mb-3">
            <Play className="w-5 h-5 text-indigo-500" />
          </div>
          <h4 className="text-sm font-black">Try-Out Baru</h4>
          <p className="text-[11px] text-slate-400 mt-1">Konfigurasi materi & mulai simulasi kuis baru.</p>
        </div>

        <div onClick={onResumeOrBanks} className={cardClass}>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
            <Flame className="w-5 h-5 text-amber-500" />
          </div>
          <h4 className="text-sm font-black">
            {pendingCount > 0 ? 'Lanjutkan Kuis' : 'Pilih Topik Soal'}
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">
            {pendingCount > 0
              ? `Lanjutkan kuis tertunda (${pendingProgress}%)`
              : 'Jelajahi dan pilih bank soal yang tersedia.'}
          </p>
        </div>

        <div onClick={onBanks} className={cardClass}>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center mb-3">
            <UploadCloud className="w-5 h-5 text-teal-500" />
          </div>
          <h4 className="text-sm font-black">Upload Soal</h4>
          <p className="text-[11px] text-slate-400 mt-1">Impor file kuis JSON/YAML atau folder soal baru.</p>
        </div>

      </div>
    </div>
  );
}