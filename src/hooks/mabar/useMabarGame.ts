import { useState, useEffect, useCallback, useRef } from 'react';
import { submitAnswerToServer } from '../../lib/mabar/mabarRoomManager';
import { joinRoomChannel, leaveRoomChannel, broadcastToRoom } from '../../lib/mabar/mabarRealtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

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

  useEffect(() => {
    channelRef.current = joinRoomChannel(roomId, {
      onQuestionStart: (data) => {
        setCurrentQuestion(data.question);
        setQuestionIndex(data.questionIndex);
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

  useEffect(() => {
    if (currentQuestion && timeRemaining > 0 && !isAnswered) {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
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

  const submitAnswer = useCallback(async (answer: string) => {
    if (isAnswered || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitAnswerToServer({
        roomId,
        userId,
        questionOrderIndex: questionIndex,
        selectedAnswer: answer,
      });
      setIsAnswered(true);
      // broadcast event
      await broadcastToRoom(channelRef.current, 'player_answered', {
        userId,
        isCorrect: false, // We'll let server handle exact scoring later
        score: 0,
        responseTime: 0
      });
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [roomId, userId, questionIndex, isAnswered, isSubmitting]);

  return {
    currentQuestion,
    questionIndex,
    timeRemaining,
    isAnswered,
    isSubmitting,
    scores,
    submitAnswer,
    gameResult,
    correctAnswer
  };
}
