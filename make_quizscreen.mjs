import fs from 'fs';
const block = fs.readFileSync('block_quiz.txt', 'utf8');

const code = `import React from 'react';
import { Bookmark, Check, CheckCircle2, Copy, Eye, Flame, Lock, Sparkles, XCircle, ChevronRight, Share2, MessageCircleQuestion } from 'lucide-react';
import { QuizHeader } from '../QuizHeader';
import { MobileQuizNavDrawer } from '../MobileQuizNavDrawer';
import { KeyboardHintPanel } from '../KeyboardHintPanel';
import { MobileBottomActionBar } from '../MobileBottomActionBar';
import { EXPLAIN_MODES } from '../../utils/aiExplain';
import { getCorrectLetterForQuestion, renderHtmlText, getQuestionImage, renderQuestionImage, isUserAnswerCorrect, renderMarkdown } from '../../utils/quizUtils';
import { motion, AnimatePresence } from 'motion/react';

interface QuizScreenProps {
  theme: string;
  currentQuiz: any[];
  currentIndex: number;
  userAnswers: any[];
  doubtStatus: any[];
  isRevealed: boolean;
  quizSecondsLeft: number;
  keyboardNavEnabled: boolean;
  isAdaptiveMode: boolean;
  currentDifficulty: string;
  aiPanelOpen: boolean;
  aiLoading: boolean;
  aiExplanation: string;
  aiFollowUp: string;
  aiMode: string;
  mobileQuizNavOpen: boolean;
  studyRoom: any;
  currentUser: any;
  triggerToast: any;
  copyQuestionToClipboard: any;
  setLightboxImage: any;
  selectAnswer: any;
  handleAIRequest: any;
  navigateQuestion: any;
  checkAnswerNow: any;
  toggleDoubt: any;
  handleNextQuestion: any;
  openFinishModal: any;
  unlockedHints: any;
  setMobileQuizNavOpen: any;
  setUserAnswers: any;
  setUnlockedHints: any;
  setModalTitle: any;
  setModalDesc: any;
  setModalAction: any;
  setModalOpen: any;
  setAiFollowUp: any;
  setCurrentIndex: any;
  setDoubtStatus: any;
  exitQuiz: any;
  toggleFullscreen: any;
  isFullscreen: boolean;
  answerNotes: Record<string, any>;
  openNotePopup: any;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  theme, currentQuiz, currentIndex, userAnswers, doubtStatus, isRevealed,
  quizSecondsLeft, keyboardNavEnabled, isAdaptiveMode, currentDifficulty,
  aiPanelOpen, aiLoading, aiExplanation, aiFollowUp, aiMode, mobileQuizNavOpen,
  studyRoom, currentUser, triggerToast, copyQuestionToClipboard, setLightboxImage,
  selectAnswer, handleAIRequest, navigateQuestion, checkAnswerNow, toggleDoubt,
  handleNextQuestion, openFinishModal, unlockedHints, setMobileQuizNavOpen,
  setUserAnswers, setUnlockedHints, setModalTitle, setModalDesc, setModalAction,
  setModalOpen, setAiFollowUp, setCurrentIndex, setDoubtStatus, exitQuiz,
  toggleFullscreen, isFullscreen, answerNotes, openNotePopup
}) => {
  return (
    <>
${block}
    </>
  );
};
`;

fs.mkdirSync('src/components/screens', { recursive: true });
fs.writeFileSync('src/components/screens/QuizScreen.tsx', code);
console.log('QuizScreen.tsx written');
