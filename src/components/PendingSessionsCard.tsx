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
}

export default function PendingSessionsCard({ theme, sessions, onResume, onDiscard }: PendingSessionsCardProps) {
  if (sessions.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">Sesi Kuis Tertunda</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map((session) => {
          const totalQ = session.current_quiz_json?.length || 0;
          const answered = session.user_answers_json?.filter((a: any) => a !== null).length || 0;
          const pct = totalQ > 0 ? Math.round((answered / totalQ) * 100) : 0;
          return (
            <div
              key={session.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-colors ${
                theme === 'dark' ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                    {session.quiz_mode === 'simulasi' ? 'Simulasi' : 'Utuh'}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(session.updated_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                <h4 className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{session.title}</h4>
                <div className="mt-2.5">
                  <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                    <span>Progres: {answered}/{totalQ} Soal</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  onClick={() => onResume(session)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold bg-indigo-500 hover:bg-indigo-600 text-white transition-all cursor-pointer"
                >
                  Lanjutkan
                </button>
                <button
                  onClick={() => onDiscard(session.id)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-extrabold bg-rose-500/10 hover:bg-rose-500/20 text-rose-455 transition-all cursor-pointer"
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
