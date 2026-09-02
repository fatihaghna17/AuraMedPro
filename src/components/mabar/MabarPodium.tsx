import React from 'react';
import { motion } from 'motion/react';
import type { MabarRoomPlayer } from '../../lib/mabar/mabarTypes';

interface MabarPodiumProps {
  topPlayers: MabarRoomPlayer[];
  onBackToLobby: () => void;
}

export default function MabarPodium({ topPlayers, onBackToLobby }: MabarPodiumProps) {
  const p1 = topPlayers[0];
  const p2 = topPlayers[1];
  const p3 = topPlayers[2];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-12 text-center">Podium Mabar</h1>

      <div className="flex items-end justify-center gap-2 md:gap-4 h-64 mb-16 w-full max-w-2xl">
        {/* Juara 2 */}
        {p2 && (
          <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="flex flex-col items-center w-1/3">
            <div className="font-bold text-gray-700 truncate w-full text-center mb-2">{p2.display_name}</div>
            <div className="bg-gray-300 w-full h-32 rounded-t-lg flex flex-col items-center justify-start pt-4 shadow-inner relative">
              <span className="text-4xl">🥈</span>
              <span className="font-black text-gray-600 mt-2">{p2.score}</span>
            </div>
          </motion.div>
        )}

        {/* Juara 1 */}
        {p1 && (
          <motion.div initial={{ y: 300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1, type: 'spring' }} className="flex flex-col items-center w-1/3 z-10">
            <div className="font-bold text-gray-800 truncate w-full text-center text-xl mb-2">🏆 {p1.display_name}</div>
            <div className="bg-yellow-400 w-full h-48 rounded-t-lg flex flex-col items-center justify-start pt-4 shadow-lg relative border-2 border-yellow-500">
              <span className="text-5xl">🥇</span>
              <span className="font-black text-yellow-900 mt-2 text-xl">{p1.score}</span>
            </div>
          </motion.div>
        )}

        {/* Juara 3 */}
        {p3 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="flex flex-col items-center w-1/3">
            <div className="font-bold text-gray-700 truncate w-full text-center mb-2">{p3.display_name}</div>
            <div className="bg-amber-600 w-full h-24 rounded-t-lg flex flex-col items-center justify-start pt-4 shadow-inner relative">
              <span className="text-3xl">🥉</span>
              <span className="font-black text-amber-100 mt-2">{p3.score}</span>
            </div>
          </motion.div>
        )}
      </div>

      <button onClick={onBackToLobby} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg">
        Kembali ke Lobby
      </button>
    </div>
  );
}
