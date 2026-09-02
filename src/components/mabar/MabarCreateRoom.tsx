import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { MabarGameMode, MabarSubMode } from '../../lib/mabar/mabarTypes';

interface MabarCreateRoomProps {
  onCancel: () => void;
  onSubmit: (params: {
    mode: MabarGameMode;
    subMode?: MabarSubMode;
    topic: string;
    totalQuestions: number;
    timeLimitPerQuestion: number;
    maxPlayers: number;
  }) => Promise<void>;
  availableTopics: string[];
}

export default function MabarCreateRoom({ onCancel, onSubmit, availableTopics }: MabarCreateRoomProps) {
  const [mode, setMode] = useState<MabarGameMode>('kahoot');
  const [topic, setTopic] = useState(availableTopics[0] || '');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [timeLimit, setTimeLimit] = useState(15);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        mode,
        topic,
        totalQuestions,
        timeLimitPerQuestion: timeLimit,
        maxPlayers: maxPlayers
      });
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Buat Room Mabar</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Mode</label>
          <div className="flex gap-4">
            <button type="button" onClick={() => setMode('kahoot')} className={`flex-1 py-3 rounded-lg font-bold border-2 ${mode === 'kahoot' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>Kuis Bersama</button>
            <button type="button" onClick={() => setMode('cerdas_cermat')} className={`flex-1 py-3 rounded-lg font-bold border-2 ${mode === 'cerdas_cermat' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500'}`}>Cerdas Cermat</button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Topik Kuis</label>
          <select value={topic} onChange={e => setTopic(e.target.value)} className="w-full p-3 rounded-lg border-2 border-gray-200 bg-white">
            {availableTopics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah Soal</label>
          <div className="flex gap-2">
            {[5, 10, 15, 20].map(num => (
              <button key={num} type="button" onClick={() => setTotalQuestions(num)} className={`flex-1 py-2 rounded-lg font-bold border-2 ${totalQuestions === num ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-200 text-gray-600'}`}>
                {num}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Waktu per Soal (Detik)</label>
          <div className="flex gap-2">
            {[10, 15, 20, 30].map(num => (
              <button key={num} type="button" onClick={() => setTimeLimit(num)} className={`flex-1 py-2 rounded-lg font-bold border-2 ${timeLimit === num ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-200 text-gray-600'}`}>
                {num}s
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Maksimal Pemain / Tim</label>
          <div className="flex gap-2">
            {[2, 5, 10, 20, 50].map(num => (
              <button key={num} type="button" onClick={() => setMaxPlayers(num)} className={`flex-1 py-2 rounded-lg font-bold border-2 ${maxPlayers === num ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-200 text-gray-600'}`}>
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-4">
          <button type="button" onClick={onCancel} className="px-6 py-2 text-gray-500 hover:text-gray-700 font-bold">Batal</button>
          <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50">
            {isSubmitting ? 'Membuat...' : 'Buat Room'}
          </button>
        </div>

      </form>
    </motion.div>
  );
}
