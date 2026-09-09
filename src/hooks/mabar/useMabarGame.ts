// src/hooks/mabar/useMabarGame.ts
// Game loop & answer submission for Mabar players via Cloudflare D1

import { useState, useEffect, useCallback, useRef } from 'react';
import { submitAnswerToServer } from '../../lib/mabar/mabarRoomManager';
import {
  joinRoomChannel,
  leaveRoomChannel,
  broadcastToRoom,
  type RealtimeChannel,
} from '../../lib/mabar/mabarRealtime';
import { cloudflareApi } from '../../services/cloudflareApi';

interface UseMabarGameProps {
  roomId: string;
  userId: string;
  isHost: boolean;
  totalQuestions: number;
  timeLimit: number;
}

export function useMabarGame({
  roomId,
  userId,
  isHost,
  totalQuestions,
  timeLimit,
}: UseMabarGameProps) {
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scores, setScores] = useState<any[]>([]);
  const [gameResult, setGameResult] = useState<any>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const questionIndexRef = useRef(0);

  // 1. Channel listeners for instant local broadcast events
  useEffect(() => {
    channelRef.current = joinRoomChannel(roomId, {
      onQuestionStart: (data) => {
        setCurrentQuestion(data.question);
        setQuestionIndex(data.questionIndex);
        questionIndexRef.current = data.questionIndex;
        setTimeRemaining(timeLimit);
        setIsAnswered(false);
        setCorrectAnswer(null);
      },
      onQuestionEnd: (data) => {
        setIsAnswered(true);
        setTimeRemaining(0);
        setCorrectAnswer(data.correctAnswer);
      },
      onGameFinished: (data) => {
        setGameResult(data);
        setCurrentQuestion(null);
      },
    });

    return () => {
      leaveRoomChannel(channelRef.current);
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [roomId, timeLimit]);

  // 2. State polling fallback via Cloudflare D1
  useEffect(() => {
    if (!roomId) return;

    let isMounted = true;
    const pollState = async () => {
      try {
        const res = await cloudflareApi.mabarGetState(roomId);
        if (!isMounted || !res.data) return;

        const { room, questions, players } = res.data;

        if (Array.isArray(players)) {
          setScores(players);
        }

        if (room?.status === 'finished') {
          setGameResult({ roomId, scores: players || [] });
          setCurrentQuestion(null);
          return;
        }

        const roomQIndex = room?.current_question_index ?? 0;
        // If room moved to next question and client hasn't caught up
        if (
          Array.isArray(questions) &&
          questions.length > roomQIndex &&
          (!currentQuestion || questionIndexRef.current !== roomQIndex)
        ) {
          const rawQ = questions[roomQIndex];
          const qData = rawQ?.data || rawQ;
          const rawOptions = qData?.pilihan || qData?.options || [];
          const normalizedOptions = rawOptions.map((opt: any) => ({
            text: typeof opt === 'string' ? opt : opt?.text || opt?.label || String(opt || ''),
          }));

          questionIndexRef.current = roomQIndex;
          setQuestionIndex(roomQIndex);
          setCurrentQuestion({
            text: qData?.pertanyaan || qData?.text || 'Soal tidak ditemukan',
            options: normalizedOptions,
          });
          setTimeRemaining(timeLimit);
          setIsAnswered(false);
          setCorrectAnswer(null);
        }
      } catch (e) {
        console.warn('[useMabarGame] Polling error:', e);
      }
    };

    pollState();
    const pollInterval = setInterval(pollState, 1500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [roomId, timeLimit, currentQuestion]);

  // 3. Local question timer
  useEffect(() => {
    if (currentQuestion && timeRemaining > 0 && !isAnswered) {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) window.clearInterval(timerRef.current);
            if (!isAnswered) {
              setIsAnswered(true);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [currentQuestion, isAnswered]);

  const submitAnswer = useCallback(
    async (answer: string) => {
      if (isAnswered || isSubmitting) return;
      setIsSubmitting(true);
      try {
        const result = await submitAnswerToServer({
          roomId,
          userId,
          questionOrderIndex: questionIndex,
          selectedAnswer: answer,
        });
        setIsAnswered(true);

        // broadcast event locally
        await broadcastToRoom(channelRef.current, 'player_answered', {
          userId,
          isCorrect: result.isCorrect,
          score: result.score,
          responseTime: result.responseTimeMs,
        });
      } catch (error) {
        console.error('Failed to submit answer:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [roomId, userId, questionIndex, isAnswered, isSubmitting]
  );

  return {
    currentQuestion,
    questionIndex,
    timeRemaining,
    isAnswered,
    isSubmitting,
    scores,
    submitAnswer,
    gameResult,
    correctAnswer,
  };
}
