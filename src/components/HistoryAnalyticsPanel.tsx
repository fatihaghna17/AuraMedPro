import { ChevronDown } from 'lucide-react';

interface HistoryAnalyticsPanelProps {
  theme: 'light' | 'dark';
  analytics: Record<string, { total: number; correct: number }>;
  expandedCompetencies: Record<string, boolean>;
  onToggleExpand: (name: string) => void;
}

export default function HistoryAnalyticsPanel({
  theme, analytics, expandedCompetencies, onToggleExpand,
}: HistoryAnalyticsPanelProps) {
  return (
    <div className={`p-5 rounded-xl border backdrop-blur-xl ${
      theme === 'dark' ? 'bg-gradient-to-b from-white/[0.08] via-slate-900/35 to-slate-900/45 border-white/15 shadow-xl' : 'bg-white/45 border-white/70 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]'
    }`}>
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Analisis Sub-Kompetensi</h3>
      <div className={`divide-y ${
        theme === 'dark' ? 'divide-white/10' : 'divide-slate-200/60'
      }`}>
        {Object.entries(analytics).map(([name, data]: [string, any]) => {
          const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
          const expanded = !!expandedCompetencies[name];
          return (
            <div key={name} className="text-xs">
              <button
                onClick={() => onToggleExpand(name)}
                className="w-full flex items-center justify-between py-3 px-2 hover:bg-white/50 dark:hover:bg-white/[0.08] transition-colors duration-150 font-semibold text-left rounded-md cursor-pointer"
              >
                <span className="truncate pr-4 text-slate-800 dark:text-slate-200">{name}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    pct >= 80
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : pct >= 60
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}>
                    {pct}%
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expanded && (
                <div className="p-3 mb-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Total Soal Dikerjakan</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{data.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jawaban Benar</span>
                    <span className="font-bold text-emerald-500">{data.correct}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jawaban Salah / Kosong</span>
                    <span className="font-bold text-rose-500">{data.total - data.correct}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
