import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import MabarLeaderboard from './MabarLeaderboard';
import type { MabarRoomPlayer, MabarRoom } from '../../lib/mabar/mabarTypes';
import { supabase } from '../../supabaseClient';
import { broadcastToRoom } from '../../lib/mabar/mabarRealtime';

interface MabarGameHostProps {
  room: MabarRoom;
  scores: MabarRoomPlayer[];
  questionDatabase: any;
  onFinishGame: () => void;
}

export default function MabarGameHost({
  room,
  scores,
  questionDatabase,
  onFinishGame
}: MabarGameHostProps) {
  const [questionIndex, setQuestionIndex] = useState(room.current_question_index);
  const [timeRemaining, setTimeRemaining] = useState(room.time_limit_per_question);
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [currentQuestionData, setCurrentQuestionData] = useState<any>(null);
  
  const timerRef = useRef<number | null>(null);

  const startQuestion = async (idx: number) => {
    let qData = null;
    if (questionDatabase && questionDatabase[room.topic]) {
      // Fetch the actual question_id (which is the original index) from DB
      const { data: rq } = await supabase
        .from('mabar_room_questions')
        .select('question_id')
        .eq('room_id', room.id)
        .eq('order_index', idx)
        .single();
        
      if (rq && rq.question_id) {
        const originalIndex = parseInt(rq.question_id, 10);
        qData = questionDatabase[room.topic][originalIndex];
      } else {
        // Fallback
        qData = questionDatabase[room.topic][idx]; 
      }
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
            question: { text: qData?.pertanyaan || qData?.text || 'Soal tidak ditemukan', options: qData?.pilihan || qData?.options || [] }
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
            correctAnswer: currentQuestionData?.jawaban_benar || currentQuestionData?.correctAnswer || ''
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
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center flex flex-col items-center gap-8 w-full px-4">
            {currentQuestionData && (
              <div className="w-full max-w-4xl bg-white border-2 border-blue-100 p-8 md:p-12 rounded-3xl shadow-sm text-center">
                <h2 className="text-3xl md:text-5xl font-black text-gray-800 leading-tight">
                  {currentQuestionData.pertanyaan || currentQuestionData.text}
                </h2>
              </div>
            )}
            
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gray-50 border-8 border-blue-500 flex items-center justify-center shadow-inner">
                <h1 className="text-6xl font-black text-blue-600">{timeRemaining}</h1>
              </div>
              <p className="text-gray-500 font-bold mt-4 tracking-wider uppercase">Menunggu pemain menjawab...</p>
            </div>
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
