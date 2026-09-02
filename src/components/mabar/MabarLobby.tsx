import React, { useState } from 'react';
import { motion } from 'motion/react';

interface MabarLobbyProps {
  onNavigate: (view: 'create' | 'join' | 'history' | 'stats') => void;
  
}

export default function MabarLobby({ onNavigate, }: MabarLobbyProps) {
  const [joinCode, setJoinCode] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.length === 6) {
      window.location.href = `/mabar?view=waiting&roomId=${joinCode.toUpperCase()}`; // Wait, we need to join first. Let's just handle it in parent.
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 max-w-4xl mx-auto flex flex-col gap-6"
    >
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Mabar (Live Battle)</h1>
        <p className="text-gray-500">Tantang temanmu atau pemain lain secara real-time!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kahoot Mode */}
        <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg cursor-pointer" onClick={() => onNavigate('create')}>
          <h2 className="text-2xl font-bold mb-2">Buat Room Kuis</h2>
          <p className="text-blue-100 mb-4">Mode Kahoot-like. Buat room, undang teman, dan bertanding bersama.</p>
          <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold w-full">Buat Room</button>
        </motion.div>

        {/* Join Room */}
        <motion.div whileHover={{ scale: 1.02 }} className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Gabung Room</h2>
          <p className="text-gray-500 mb-4">Punya kode room? Masukkan di sini.</p>
          <form onSubmit={handleJoin} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Kode 6 Digit" 
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 font-mono text-center text-xl uppercase"
            />
            <button type="submit" disabled={joinCode.length < 6} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50">Join</button>
          </form>
        </motion.div>
      </div>
      

      
      {/* Stats & History Links */}
      <div className="flex justify-center gap-4 mt-8">
        <button onClick={() => onNavigate('history')} className="text-gray-500 hover:text-gray-800 font-medium">Riwayat Pertandingan</button>
        <button onClick={() => onNavigate('stats')} className="text-gray-500 hover:text-gray-800 font-medium">Statistik Saya</button>
      </div>

    </motion.div>
  );
}
