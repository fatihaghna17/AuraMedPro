import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import MabarLeaderboard from './MabarLeaderboard';
import type { MabarRoomPlayer, MabarRoom } from '../../lib/mabar/mabarTypes';
import {
  joinRoomChannel,
  leaveRoomChannel,
  broadcastToRoom,
  type RealtimeChannel,
} from '../../lib/mabar/mabarRealtime';
import { cloudflareApi } from '../../services/cloudflareApi';

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
  onFinishGame,
}: MabarGameHostProps) {
  const [questionIndex, setQuestionIndex] = useState(room.current_question_index || 0);
  const [timeRemaining, setTimeRemaining] = useState(room.time_limit_per_question || 15);
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [currentQuestionData, setCurrentQuestionData] = useState<any>(null);

  const timerRef = useRef<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Setup persistent Realtime channel on mount
  useEffect(() => {
    channelRef.current = joinRoomChannel(room.id, {});
    return () => {
      leaveRoomChannel(channelRef.current);
    };
  }, [room.id]);

  const startQuestion = async (idx: number) => {
    let qData = null;
    try {
      const stateRes = await cloudflareApi.mabarGetState(room.id);
      const questions = stateRes.data?.questions || [];
      const rq =
        questions.find(
          (item: any) => item.order_index === idx || item.question_index === idx
        ) || questions[idx];

      if (rq && rq.question_id && questionDatabase && questionDatabase[room.topic]) {
        const originalIndex = parseInt(rq.question_id, 10);
        qData = questionDatabase[room.topic][originalIndex];
      } else if (rq?.data) {
        qData = rq.data;
      } else if (questionDatabase && questionDatabase[room.topic]) {
        qData = questionDatabase[room.topic][idx];
      }
    } catch (e) {
      console.warn('[MabarGameHost] Question lookup fallback:', e);
      if (questionDatabase && questionDatabase[room.topic]) {
        qData = questionDatabase[room.topic][idx];
      }
    }

    setCurrentQuestionData(qData);
    setQuestionIndex(idx);
    setIsQuestionActive(true);
    setTimeRemaining(room.time_limit_per_question || 15);

    // Update D1
    await cloudflareApi.mabarAction({ action: 'next', roomId: room.id, nextIndex: idx });

    // Normalize options
    const rawOptions = qData?.pilihan || qData?.options || [];
    const normalizedOptions = rawOptions.map((opt: any) => ({
      text: typeof opt === 'string' ? opt : opt?.text || opt?.label || String(opt || ''),
    }));

    // Broadcast question_start to all players on mabar-room-${room.id}
    await broadcastToRoom(channelRef.current, 'question_start', {
      questionIndex: idx,
      question: {
        text: qData?.pertanyaan || qData?.text || 'Soal tidak ditemukan',
        options: normalizedOptions,
      },
    });
  };

  useEffect(() => {
    // Start first question on mount
    if (!isQuestionActive && !currentQuestionData) {
      startQuestion(0);
    }
  }, []);

  useEffect(() => {
    if (isQuestionActive && timeRemaining > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
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

    // Broadcast end to all players
    await broadcastToRoom(channelRef.current, 'question_end', {
      correctAnswer:
        currentQuestionData?.jawaban_benar || currentQuestionData?.correctAnswer || '',
    });
  };

  const handleNextQuestion = () => {
    if (questionIndex + 1 < room.total_questions) {
      startQuestion(questionIndex + 1);
    }
  };

  const handleFinish = async () => {
    await cloudflareApi.mabarAction({
      action: 'finish',
      roomId: room.id,
      finalScores: scores,
    });
    await broadcastToRoom(channelRef.current, 'game_finished', {
      roomId: room.id,
      scores: scores,
    });
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
          <h2 className="text-3xl font-black text-blue-600">
            {questionIndex + 1} / {room.total_questions}
          </h2>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[300px] mb-8">
        <div className="w-24 h-24 rounded-full border-4 border-blue-500 flex items-center justify-center mb-6">
          <span className="text-4xl font-black text-blue-600">{timeRemaining}</span>
        </div>

        <h3 className="text-2xl font-bold text-gray-800 text-center max-w-2xl mb-8">
          {currentQuestionData?.pertanyaan || currentQuestionData?.text || 'Memuat pertanyaan...'}
        </h3>

        {!isQuestionActive && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 font-bold mb-4">
            Kunci Jawaban:{' '}
            {currentQuestionData?.jawaban_benar || currentQuestionData?.correctAnswer || '-'}
          </div>
        )}

        <div className="flex gap-4">
          {!isQuestionActive && questionIndex + 1 < room.total_questions && (
            <button
              onClick={handleNextQuestion}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow hover:bg-blue-700 transition"
            >
              Soal Berikutnya →
            </button>
          )}

          {!isQuestionActive && questionIndex + 1 >= room.total_questions && (
            <button
              onClick={handleFinish}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold shadow hover:bg-green-700 transition"
            >
              Selesaikan Kuis 🏁
            </button>
          )}
        </div>
      </div>

      <div className="mt-auto">
        <h4 className="font-bold text-gray-700 mb-2">Live Leaderboard</h4>
        <MabarLeaderboard scores={scores} currentUserId="" />
      </div>
    </div>
  );
}
