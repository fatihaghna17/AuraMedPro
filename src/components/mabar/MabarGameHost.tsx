import React, { useState } from 'react';
import { motion } from 'motion/react';
import MabarLeaderboard from './MabarLeaderboard';
import type { MabarRoomPlayer } from '../../lib/mabar/mabarTypes';

interface MabarGameHostProps {
  roomId: string;
  questionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  isQuestionActive: boolean;
  scores: MabarRoomPlayer[];
  onNextQuestion: () => void;
  onFinishGame: () => void;
}

export default function MabarGameHost({
  roomId,
  questionIndex,
  totalQuestions,
  timeRemaining,
  isQuestionActive,
  scores,
  onNextQuestion,
  onFinishGame
}: MabarGameHostProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <p className="text-gray-500 text-sm font-bold uppercase">ROOM CODE</p>
          <h2 className="text-3xl font-black text-gray-900">{roomId}</h2>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-sm font-bold uppercase">SOAL</p>
          <h2 className="text-3xl font-black text-blue-600">{questionIndex + 1} / {totalQuestions}</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {isQuestionActive ? (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
            <h1 className="text-8xl font-black text-gray-900 mb-4">{timeRemaining}</h1>
            <p className="text-gray-500 text-xl">Menunggu pemain menjawab...</p>
          </motion.div>
        ) : (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-8">Waktu Habis!</h1>
            {questionIndex + 1 < totalQuestions ? (
              <button onClick={onNextQuestion} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-xl shadow-lg">
                Soal Berikutnya
              </button>
            ) : (
              <button onClick={onFinishGame} className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-bold text-xl shadow-lg">
                Akhiri Game & Lihat Podium
              </button>
            )}
          </motion.div>
        )}
      </div>

      <div className="mt-auto pt-8">
        <MabarLeaderboard scores={scores} currentUserId="" />
      </div>
    </div>
  );
}
