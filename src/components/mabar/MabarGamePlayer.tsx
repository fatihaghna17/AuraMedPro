import React from 'react';
import { useMabarGame } from '../../hooks/mabar/useMabarGame';
import MabarQuestionCard from './MabarQuestionCard';
import MabarTimerBar from './MabarTimerBar';
import MabarLeaderboard from './MabarLeaderboard';
import type { MabarRoomPlayer } from '../../lib/mabar/mabarTypes';

interface MabarGamePlayerProps {
  roomId: string;
  userId: string;
  mode: 'kahoot' | 'cerdas_cermat';
  totalQuestions: number;
  timeLimit: number;
  players: MabarRoomPlayer[];
  onGameEnd: (result: any) => void;
}

export default function MabarGamePlayer({
  roomId,
  userId,
  mode,
  totalQuestions,
  timeLimit,
  players,
  onGameEnd,
}: MabarGamePlayerProps) {
  const {
    currentQuestion,
    questionIndex,
    timeRemaining,
    isAnswered,
    isSubmitting,
    submitAnswer,
    gameResult,
    correctAnswer
  } = useMabarGame({ roomId, userId, isHost: false, totalQuestions, timeLimit });

  React.useEffect(() => {
    if (gameResult) {
      onGameEnd(gameResult);
    }
  }, [gameResult, onGameEnd]);

  // Merge live scores from hook with players list if needed.
  // For now, we will pass the players array to Leaderboard (it updates from useMabarRoom).

  return (
    <div className="flex flex-col h-screen max-h-[100dvh] bg-gray-50">
      <MabarTimerBar
        timeRemaining={timeRemaining}
        totalTime={timeLimit}
        isActive={!!currentQuestion && !isAnswered}
      />
      
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        {currentQuestion ? (
          <MabarQuestionCard
            question={currentQuestion}
            onAnswer={submitAnswer}
            isAnswered={isAnswered}
            isSubmitting={isSubmitting}
            correctAnswer={correctAnswer}
          />
        ) : (
          <div className="text-center text-gray-500 font-bold text-xl animate-pulse">
            Menunggu Soal...
          </div>
        )}
      </div>

      <div className="mt-auto">
        <MabarLeaderboard scores={players} currentUserId={userId} />
      </div>
    </div>
  );
}
