import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../../supabaseClient';

interface MabarMatchHistoryProps {
  userId: string;
  onBack: () => void;
}

export default function MabarMatchHistory({ userId, onBack }: MabarMatchHistoryProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('mabar_match_history')
        .select('*, mabar_rooms(topic, mode)')
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(20);
      
      if (data) setHistory(data);
      setLoading(false);
    };
    fetchHistory();
  }, [userId]);

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-6">
      <button onClick={onBack} className="self-start text-blue-600 font-bold hover:underline">← Kembali</button>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Riwayat Pertandingan</h2>
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-100 rounded-xl"></div>
            <div className="h-16 bg-gray-100 rounded-xl"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-gray-500 py-8">Belum ada riwayat mabar.</div>
        ) : (
          <div className="space-y-3">
            {history.map((match, i) => {
              let bg = 'bg-gray-50 border-gray-200';
              let resultText = 'SERI';
              let resultColor = 'text-gray-600';
              
              if (match.result === 'win') {
                bg = 'bg-green-50 border-green-200';
                resultText = 'MENANG';
                resultColor = 'text-green-600';
              } else if (match.result === 'lose') {
                bg = 'bg-red-50 border-red-200';
                resultText = 'KALAH';
                resultColor = 'text-red-600';
              }

              return (
                <motion.div 
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-xl border flex justify-between items-center ${bg}`}
                >
                  <div>
                    <h3 className="font-bold text-gray-800">{match.mabar_rooms?.topic || 'Unknown Topic'}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(match.played_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} • 
                      <span className="uppercase font-semibold ml-1">{match.mode === 'cerdas_cermat' ? 'Cerdas Cermat' : 'Kahoot'}</span>
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className={`font-black text-lg ${resultColor}`}>{resultText}</span>
                    <span className="font-bold text-gray-700 text-sm">Skor: {match.score}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
