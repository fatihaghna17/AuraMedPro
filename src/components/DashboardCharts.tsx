import React, { useMemo } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  BarChart, Bar
} from 'recharts';

interface DashboardChartsProps {
  quizHistory: any[];
  theme: string;
}

export function DashboardCharts({ quizHistory, theme }: DashboardChartsProps) {
  // 1. Calculate Skill Radar Data
  const radarData = useMemo(() => {
    const stats: Record<string, { correct: number; total: number }> = {};
    
    quizHistory.forEach(entry => {
      if (!entry.questions || !entry.userAnswers) return;
      
      entry.questions.forEach((q: any, i: number) => {
        const subKompetensi = q.metadata?.sub_kompetensi_klinis || 'Umum';
        const userAnswer = entry.userAnswers[i];
        
        if (!stats[subKompetensi]) {
          stats[subKompetensi] = { correct: 0, total: 0 };
        }
        
        stats[subKompetensi].total += 1;
        
        // Simple check for correct answer
        let isCorrect = false;
        if (q.jawaban_benar) {
          // Cocokkan jawaban user dengan jawaban_benar
          if (userAnswer === q.jawaban_benar) {
            isCorrect = true;
          } else if (q.pilihan && q.pilihan.length > 0) {
            // Cek apakah jawaban_benar adalah teks yang cocok dengan salah satu opsi
            const correctIdx = q.pilihan.findIndex(
              (opt: string) => opt.trim().toLowerCase() === q.jawaban_benar.trim().toLowerCase()
            );
            if (correctIdx !== -1 && userAnswer === q.pilihan[correctIdx]) {
              isCorrect = true;
            }
            // Cek apakah user menjawab dengan teks opsi yang benar
            if (!isCorrect) {
              isCorrect = userAnswer === q.jawaban_benar;
            }
          }
        }

        if (isCorrect) {
          stats[subKompetensi].correct += 1;
        }
      });
    });

    const data = Object.keys(stats).map(key => {
      const { correct, total } = stats[key];
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      return {
        subject: key.length > 15 ? key.substring(0, 15) + '...' : key,
        fullSubject: key,
        accuracy,
        fullMark: 100,
      };
    });
    
    return data.length > 0 ? data : [
      { subject: 'Kardio', accuracy: 0, fullMark: 100 },
      { subject: 'Respirasi', accuracy: 0, fullMark: 100 },
      { subject: 'Gastro', accuracy: 0, fullMark: 100 },
      { subject: 'Neuro', accuracy: 0, fullMark: 100 },
      { subject: 'Muskulo', accuracy: 0, fullMark: 100 },
    ];
  }, [quizHistory]);

  // 2. Calculate Daily Activity (Area Chart)
  const activityData = useMemo(() => {
    const daily: Record<string, number> = {};
    
    // Default last 7 days empty
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      daily[dateStr] = 0;
    }

    quizHistory.forEach(entry => {
      const d = new Date(entry.date);
      const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      if (daily[dateStr] !== undefined) {
        daily[dateStr] += (entry.correct || 0);
      } else {
        daily[dateStr] = (entry.correct || 0);
      }
    });

    return Object.keys(daily).slice(-7).map(key => ({
      name: key,
      JawabanBenar: daily[key],
    }));
  }, [quizHistory]);

  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const radarFill = theme === 'dark' ? '#818cf8' : '#6366f1';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Area Chart: Aktivitas Harian */}
      <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">Aktivitas 7 Hari Terakhir</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={radarFill} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={radarFill} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: textColor }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: textColor }} />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                  borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area type="monotone" dataKey="JawabanBenar" stroke={radarFill} strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar Chart: Analisis Sub-kompetensi */}
      <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">Kekuatan Sub-kompetensi (%)</h3>
        <div className="h-64 w-full flex items-center justify-center">
          {quizHistory.length === 0 ? (
            <div className="text-xs text-slate-500 font-bold text-center">
              Selesaikan kuis untuk melihat analisis kekuatan belajar Anda.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke={gridColor} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: textColor, fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Akurasi"
                  dataKey="accuracy"
                  stroke={radarFill}
                  strokeWidth={2}
                  fill={radarFill}
                  fillOpacity={0.3}
                />
                <RechartsTooltip
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
