import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, Check } from 'lucide-react';
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
  questionDatabase?: any;
}

export default function MabarCreateRoom({ onCancel, onSubmit, availableTopics, questionDatabase }: MabarCreateRoomProps) {
  const [mode, setMode] = useState<MabarGameMode>('kahoot');
  const [topic, setTopic] = useState(availableTopics[0] || '');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [timeLimit, setTimeLimit] = useState(15);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTopics = availableTopics.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

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

        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Paket / Bank Soal</label>
          
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full p-3 rounded-lg border-2 border-gray-200 bg-white text-gray-800 font-medium cursor-pointer hover:border-blue-300 focus:border-blue-500 outline-none flex justify-between items-center"
          >
            <span className="truncate">
              {topic ? `${topic.split('/').pop()} (${questionDatabase && questionDatabase[topic] ? questionDatabase[topic].length : 0} soal)` : 'Pilih paket soal...'}
            </span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
              >
                <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Cari paket soal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm font-medium text-gray-700"
                  />
                </div>
                
                <div className="max-h-60 overflow-y-auto p-2">
                  {filteredTopics.length > 0 ? (
                    filteredTopics.map(t => {
                      const qCount = questionDatabase && questionDatabase[t] ? questionDatabase[t].length : 0;
                      const displayName = t.split('/').pop() || t;
                      const isSelected = topic === t;
                      return (
                        <div 
                          key={t}
                          onClick={() => {
                            setTopic(t);
                            setIsDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className={`p-3 rounded-lg cursor-pointer flex items-center justify-between mb-1 ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                          <span className="font-medium truncate pr-4">{displayName}</span>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-md font-bold">{qCount} soal</span>
                            {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-gray-400 text-sm font-medium">
                      Paket tidak ditemukan
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
