import fs from 'fs';
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const code = `import React from 'react';
import { AlertCircle } from 'lucide-react';

interface SetupReportsTabProps {
  theme: string;
  adminReports: any[];
}

export const SetupReportsTab: React.FC<SetupReportsTabProps> = ({ theme, adminReports }) => {
  return (
    <div className="lg:col-span-12 p-6 rounded-2xl transition-all duration-300 border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-rose-500" />
        </div>
        <div>
          <h2 className={\`text-xl font-black tracking-tight \${theme === 'dark' ? 'text-white' : 'text-slate-800'}\`}>Laporan Pengguna</h2>
          <p className={\`text-xs font-bold \${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}\`}>Tinjau laporan terkait soal dari pengguna</p>
        </div>
      </div>

      <div className={\`p-6 rounded-2xl border \${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}\`}>
        {adminReports.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-20 text-slate-400" />
            <p className="text-sm font-bold text-slate-500">Belum ada laporan soal saat ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {adminReports.map((report) => (
              <div key={report.id} className={\`p-4 rounded-xl border \${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}\`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                    {report.issue_type}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(report.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="mb-2">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bank Soal: {report.question_bank_name}</h4>
                  <p className={\`text-sm font-bold line-clamp-2 \${theme === 'dark' ? 'text-white' : 'text-slate-800'}\`}>
                    {report.question_text}
                  </p>
                </div>
                {report.description && (
                  <div className="mt-3 p-3 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold">Keterangan:</span> {report.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
`;

fs.mkdirSync('src/components/tabs', { recursive: true });
fs.writeFileSync('src/components/tabs/SetupReportsTab.tsx', code);

let start = -1;
let end = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("{dashboardTab === 'reports' && (")) {
    start = i;
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes(")}")) { // end of reports
        // confirm it's the end of reports
        if (lines[j+2] && lines[j+2].includes('dashboardTab === \'analysis\'')) {
          end = j;
          break;
        }
      }
    }
    break;
  }
}

if (start !== -1 && end !== -1) {
  lines.splice(start, end - start + 1, "            {dashboardTab === 'reports' && <SetupReportsTab theme={theme} adminReports={adminReports} />}");
}

const importIdx = lines.findIndex(l => l.includes("import { useAnswerNotes }"));
lines.splice(importIdx + 1, 0, "import { SetupReportsTab } from './components/tabs/SetupReportsTab';");

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Done B7');
