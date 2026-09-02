import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../../supabaseClient';

interface MabarPlayerStatsProps {
  userId: string;
  onBack: () => void;
}

export default function MabarPlayerStats({ userId, onBack }: MabarPlayerStatsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from('mabar_player_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      setStats(data || {
        total_matches: 0,
        total_wins: 0,
        total_losses: 0,
        total_draws: 0,
        highest_score: 0,
        elo_rating: 1000,
        best_streak: 0
      });
      setLoading(false);
    };
    fetchStats();
  }, [userId]);

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-6">
      <button onClick={onBack} className="self-start text-blue-600 font-bold hover:underline">← Kembali</button>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Statistik Mabar</h2>
        
        {loading ? (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-20 bg-gray-200 rounded-xl"></div>
            <div className="h-20 bg-gray-200 rounded-xl"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center">
              <span className="text-blue-500 font-semibold text-sm uppercase">Rating ELO</span>
              <span className="text-3xl font-black text-blue-700">{stats.elo_rating}</span>
            </motion.div>
            
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col items-center">
              <span className="text-purple-500 font-semibold text-sm uppercase">Total Main</span>
              <span className="text-3xl font-black text-purple-700">{stats.total_matches}</span>
            </motion.div>
            
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col items-center">
              <span className="text-green-500 font-semibold text-sm uppercase">Win Rate</span>
              <span className="text-3xl font-black text-green-700">
                {stats.total_matches > 0 ? Math.round((stats.total_wins / stats.total_matches) * 100) : 0}%
              </span>
            </motion.div>

            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex flex-col items-center">
              <span className="text-yellow-600 font-semibold text-sm uppercase">Skor Tertinggi</span>
              <span className="text-3xl font-black text-yellow-700">{stats.highest_score}</span>
            </motion.div>

            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col items-center">
              <span className="text-orange-500 font-semibold text-sm uppercase">Best Streak</span>
              <span className="text-3xl font-black text-orange-700">🔥 {stats.best_streak}</span>
            </motion.div>
            
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col items-center justify-center">
              <span className="text-gray-500 font-semibold text-sm">Menang: <span className="text-green-600 font-bold">{stats.total_wins}</span></span>
              <span className="text-gray-500 font-semibold text-sm">Kalah: <span className="text-red-600 font-bold">{stats.total_losses}</span></span>
              <span className="text-gray-500 font-semibold text-sm">Seri: <span className="text-gray-700 font-bold">{stats.total_draws}</span></span>
            </motion.div>

          </div>
        )}
      </div>
    </div>
  );
}
