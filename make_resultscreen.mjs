import fs from 'fs';
const block = fs.readFileSync('block_result.txt', 'utf8');

const code = `import React from 'react';
import { Activity, AlertCircle, Award, Bookmark, Brain, ChevronDown, FileText, Flag, Home, RefreshCw, RotateCcw, Share2, StickyNote } from 'lucide-react';
import { getCorrectLetterForQuestion, renderHtmlText, renderQuestionImage, isUserAnswerCorrect, getFeedbackForScore, generateQuestionFingerprint } from '../../utils/quizUtils';
import { supabase } from '../../supabaseClient';

interface ResultScreenProps {
  theme: string;
  currentQuiz: any[];
  userAnswers: any[];
  studyRoom: any;
  currentUser: any;
  openNotePopup: any;
  answerNotes: Record<string, any>;
  setScreen: any;
  setDashboardTab: any;
  selectedDatabases: string[];
  submitScoreToLeaderboard: any;
  lastQuizScore: number;
  setLightboxImage: any;
  setReportModal: any;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  theme, currentQuiz, userAnswers, studyRoom, currentUser, openNotePopup,
  answerNotes, setScreen, setDashboardTab, selectedDatabases,
  submitScoreToLeaderboard, lastQuizScore, setLightboxImage, setReportModal
}) => {
  return (
    <>
${block}
    </>
  );
};
`;

fs.writeFileSync('src/components/screens/ResultScreen.tsx', code);
console.log('ResultScreen.tsx written');
