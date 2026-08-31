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
    <div>
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">Analisis Sub-Kompetensi</h3>
      <div className={`border rounded-2xl divide-y overflow-hidden transition-colors ${
        theme === 'dark' ? 'bg-slate-900/40 border-slate-800/80 divide-slate-850' : 'bg-white border-slate-200 divide-slate-100'
      }`}>
        {Object.entries(analytics).map(([name, data]: [string, any]) => {
          const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
          const expanded = !!expandedCompetencies[name];
          return (
            <div key={name} className="text-xs">
              <button
                onClick={() => onToggleExpand(name)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-500/5 transition-colors font-bold text-left"
              >
                <span className="truncate pr-4">{name}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    pct >= 80
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : pct >= 60
                        ? 'bg-indigo-500/10 text-indigo-500'
                        : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {pct}%
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expanded && (
                <div className="p-3.5 bg-slate-500/[0.02] border-t border-slate-200/50 dark:border-slate-800/50 space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Total Soal Dikerjakan</span>
                    <span className="font-bold text-slate-700 dark:text-slate-350">{data.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jawaban Benar</span>
                    <span className="font-bold text-emerald-500">{data.correct}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jawaban Salah / Kosong</span>
                    <span className="font-bold text-rose-555">{data.total - data.correct}</span>
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
