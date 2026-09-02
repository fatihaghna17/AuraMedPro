import React from 'react';
import { motion } from 'motion/react';
import type { MabarRoom, MabarRoomPlayer } from '../../lib/mabar/mabarTypes';

interface MabarWaitingRoomProps {
  room: MabarRoom;
  players: MabarRoomPlayer[];
  currentUserId: string;
  isHost: boolean;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onKickPlayer?: (userId: string) => void;
}

export default function MabarWaitingRoom({
  room,
  players,
  currentUserId,
  isHost,
  onStartGame,
  onLeaveRoom,
  onKickPlayer
}: MabarWaitingRoomProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col items-center">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 text-center w-full mb-8">
        <p className="text-gray-500 font-semibold uppercase tracking-wider mb-2">KODE ROOM</p>
        <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-widest">{room.code}</h1>
        <p className="mt-4 text-lg text-gray-600">Topik: <strong>{room.topic}</strong> • {room.total_questions} Soal</p>
      </motion.div>

      <div className="w-full flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Pemain ({players.length}/{room.max_players})</h2>
        {isHost && players.length > 0 && (
          <button onClick={onStartGame} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-bold shadow-md">
            Mulai Game
          </button>
        )}
      </div>

      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4">
        {players.map((p, idx) => (
          <motion.div 
            key={p.user_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col items-center relative"
          >
            {isHost && p.user_id !== currentUserId && (
              <button 
                onClick={() => onKickPlayer && onKickPlayer(p.user_id)}
                className="absolute top-2 right-2 text-red-400 hover:text-red-600 font-bold text-xs"
              >
                KICK
              </button>
            )}
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-2">
              {p.display_name.charAt(0).toUpperCase()}
            </div>
            <p className="font-bold text-gray-800 text-center truncate w-full">{p.display_name}</p>
            {p.user_id === room.host_id && <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full mt-1">HOST</span>}
          </motion.div>
        ))}
      </div>

      <div className="mt-8 flex gap-4">
        <button onClick={onLeaveRoom} className="text-red-500 font-bold hover:underline">Keluar Room</button>
      </div>
    </div>
  );
}
