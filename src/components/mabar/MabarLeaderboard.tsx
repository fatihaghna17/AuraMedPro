import React from 'react';
import { motion } from 'motion/react';
import type { MabarRoomPlayer } from '../../lib/mabar/mabarTypes';

interface MabarLeaderboardProps {
  scores: MabarRoomPlayer[];
  currentUserId: string;
}

export default function MabarLeaderboard({ scores, currentUserId }: MabarLeaderboardProps) {
  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-t-2xl shadow-lg border-t border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="font-bold text-gray-700 text-center">Live Leaderboard</h3>
      </div>
      <div className="max-h-60 overflow-y-auto p-2">
        {scores.map((p, idx) => (
          <motion.div 
            key={p.user_id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex items-center justify-between p-3 rounded-lg mb-2 ${p.user_id === currentUserId ? 'bg-blue-50 border border-blue-200' : 'bg-white'}`}
          >
            <div className="flex items-center gap-3">
              <span className={`font-bold w-6 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-gray-400'}`}>
                {idx + 1}
              </span>
              <span className="font-semibold text-gray-800 truncate max-w-[120px]">{p.display_name}</span>
            </div>
            <div className="flex items-center gap-2">
              {p.streak > 2 && (
                <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                  🔥 {p.streak}
                </span>
              )}
              <span className="font-bold text-blue-600">{p.score.toLocaleString()}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
