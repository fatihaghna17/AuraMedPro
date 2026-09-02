import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import MabarLeaderboard from './MabarLeaderboard';
import type { MabarRoomPlayer, MabarRoom } from '../../lib/mabar/mabarTypes';
import { supabase } from '../../supabaseClient';
import { broadcastToRoom } from '../../lib/mabar/mabarRealtime';

interface MabarGameHostProps {
  room: MabarRoom;
  scores: MabarRoomPlayer[];
  globalDatabases: any;
  onFinishGame: () => void;
}

export default function MabarGameHost({
  room,
  scores,
  globalDatabases,
  onFinishGame
}: MabarGameHostProps) {
  const [questionIndex, setQuestionIndex] = useState(room.current_question_index);
  const [timeRemaining, setTimeRemaining] = useState(room.time_limit_per_question);
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [currentQuestionData, setCurrentQuestionData] = useState<any>(null);
  
  const timerRef = useRef<number | null>(null);

  const startQuestion = async (idx: number) => {
    let qData = null;
    if (globalDatabases && globalDatabases[room.topic]) {
      // In a real app we would fetch the specific question_id from mabar_room_questions
      // For now, we will just take the question at index idx from the bank
      qData = globalDatabases[room.topic][idx]; 
    }
    
    setCurrentQuestionData(qData);
    setQuestionIndex(idx);
    setIsQuestionActive(true);
    setTimeRemaining(room.time_limit_per_question);

    // Update DB
    await supabase.from('mabar_rooms').update({ current_question_index: idx }).eq('id', room.id);

    // Broadcast
    const channel = supabase.channel(`public:mabar_rooms:id=eq.${room.id}`);
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'question_start',
          payload: {
            questionIndex: idx,
            question: { text: qData?.text || 'Soal tidak ditemukan', options: qData?.options || [] }
          }
        });
        supabase.removeChannel(channel);
      }
    });
  };

  useEffect(() => {
    // Start first question on mount if it's 0
    if (room.current_question_index === 0 && !isQuestionActive && !currentQuestionData) {
      startQuestion(0);
    }
  }, []);

  useEffect(() => {
    if (isQuestionActive && timeRemaining > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (timerRef.current) window.clearInterval(timerRef.current);
            endQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isQuestionActive, timeRemaining]);

  const endQuestion = async () => {
    setIsQuestionActive(false);
    
    // Broadcast end
    const channel = supabase.channel(`public:mabar_rooms:id=eq.${room.id}`);
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'question_end',
          payload: {
            correctAnswer: currentQuestionData?.correctAnswer || currentQuestionData?.options?.find((o:any)=>o.isCorrect)?.text || ''
          }
        });
        supabase.removeChannel(channel);
      }
    });
  };

  const handleNextQuestion = () => {
    if (questionIndex + 1 < room.total_questions) {
      startQuestion(questionIndex + 1);
    }
  };

  const handleFinish = async () => {
    await supabase.from('mabar_rooms').update({ status: 'finished', finished_at: new Date().toISOString() }).eq('id', room.id);
    onFinishGame();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <p className="text-gray-500 text-sm font-bold uppercase">ROOM CODE</p>
          <h2 className="text-3xl font-black text-gray-900">{room.code}</h2>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-sm font-bold uppercase">SOAL</p>
          <h2 className="text-3xl font-black text-blue-600">{questionIndex + 1} / {room.total_questions}</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {isQuestionActive ? (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
            <h1 className="text-8xl font-black text-gray-900 mb-4">{timeRemaining}</h1>
            <p className="text-gray-500 text-xl">Menunggu pemain menjawab...</p>
            {currentQuestionData && (
              <div className="mt-8 p-4 bg-gray-100 rounded-lg max-w-xl text-left">
                <p className="font-bold text-gray-700">{currentQuestionData.text}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-8">Waktu Habis!</h1>
            {questionIndex + 1 < room.total_questions ? (
              <button onClick={handleNextQuestion} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-xl shadow-lg">
                Soal Berikutnya
              </button>
            ) : (
              <button onClick={handleFinish} className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-bold text-xl shadow-lg">
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
