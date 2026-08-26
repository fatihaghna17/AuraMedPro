import { useState } from 'react';
import { Question } from '../types';

export const useQuizState = () => {
  const [screen, setScreen] = useState<'setup' | 'quiz' | 'result'>('setup');
  const [currentQuiz, setCurrentQuiz] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [doubtStatus, setDoubtStatus] = useState<boolean[]>([]);
  const [isRevealed, setIsRevealed] = useState<boolean[]>([]);
  const [unlockedHints, setUnlockedHints] = useState<Record<number, number>>({});
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [quizSecondsLeft, setQuizSecondsLeft] = useState<number>(0);
  const [quizTimerActive, setQuizTimerActive] = useState<boolean>(false);
  const [isDailyChallenge, setIsDailyChallenge] = useState<boolean>(false);
  const [keyboardNavEnabled, setKeyboardNavEnabled] = useState<boolean>(true);
  
  // Phase 5: Adaptive Quiz States
  const [isAdaptiveMode, setIsAdaptiveMode] = useState<boolean>(false);
  const [adaptiveHistory, setAdaptiveHistory] = useState<boolean[]>([]);
  const [currentDifficulty, setCurrentDifficulty] = useState<'mudah' | 'sedang' | 'sukar'>('sedang');
  const [adaptiveQuestionPool, setAdaptiveQuestionPool] = useState<Question[]>([]);

  return {
    screen, setScreen,
    currentQuiz, setCurrentQuiz,
    currentIndex, setCurrentIndex,
    userAnswers, setUserAnswers,
    doubtStatus, setDoubtStatus,
    isRevealed, setIsRevealed,
    unlockedHints, setUnlockedHints,
    showSidebar, setShowSidebar,
    quizSecondsLeft, setQuizSecondsLeft,
    quizTimerActive, setQuizTimerActive,
    isDailyChallenge, setIsDailyChallenge,
    keyboardNavEnabled, setKeyboardNavEnabled,
    isAdaptiveMode, setIsAdaptiveMode,
    adaptiveHistory, setAdaptiveHistory,
    currentDifficulty, setCurrentDifficulty,
    adaptiveQuestionPool, setAdaptiveQuestionPool
  };
};
