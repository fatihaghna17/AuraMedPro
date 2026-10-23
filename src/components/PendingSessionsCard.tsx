import { Trash2 } from 'lucide-react';

interface PendingSession {
  id: string;
  title: string;
  quiz_mode: string;
  updated_at: string;
  current_quiz_json?: any[];
  user_answers_json?: (any[] | null)[];
}

interface PendingSessionsCardProps {
  theme: 'light' | 'dark';
  sessions: PendingSession[];
  onResume: (session: PendingSession) => void;
  onDiscard: (id: string) => void;
  onDiscardAll?: () => void;
}

export default function PendingSessionsCard({ theme, sessions, onResume, onDiscard, onDiscardAll }: PendingSessionsCardProps) {
  if (sessions.length === 0) return null;

  return (
    <div className={`p-5 rounded-xl border backdrop-blur-md ${
      theme === 'dark' ? 'bg-slate-900/60 border-white/[0.08] shadow-lg' : 'bg-white/80 border-white/80 shadow-sm'
    }`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
          Sesi Kuis Tertunda <span className="font-semibold text-slate-500 dark:text-slate-400">({sessions.length})</span>
        </h3>
        {onDiscardAll && sessions.length > 1 && (
          <button
            onClick={onDiscardAll}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors duration-150 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            Hapus Semua
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sessions.map((session) => {
          const totalQ = session.current_quiz_json?.length || 0;
          const answered = session.user_answers_json?.filter((a: any) => a !== null).length || 0;
          const pct = totalQ > 0 ? Math.round((answered / totalQ) * 100) : 0;
          return (
            <div
              key={session.id}
              className={`p-3.5 rounded-lg border flex flex-col justify-between gap-3 transition-colors ${
                theme === 'dark' ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    {session.quiz_mode === 'simulasi' ? 'Simulasi' : 'Sequential'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {new Date(session.updated_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                <h4 className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{session.title}</h4>
                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                    <span>Progres: {answered}/{totalQ} Soal</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  onClick={() => onResume(session)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-150 cursor-pointer"
                >
                  Lanjutkan
                </button>
                <button
                  onClick={() => onDiscard(session.id)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors duration-150 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
