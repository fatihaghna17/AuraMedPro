import fs from 'fs';

const block = fs.readFileSync('block_notestab.txt', 'utf8');

const code = `import React from 'react';
import { Bookmark, Eye, Play, Plus, StickyNote, Trash, Trash2 } from 'lucide-react';

interface SetupNotesTabProps {
  theme: string;
  studyRoom: any;
  triggerToast: any;
  setEditingNote: any;
  setNoteRefQuestion: any;
  setIsNoteModalOpen: any;
  setBankFilter: any;
  setCurrentQuiz: any;
  setUserAnswers: any;
  setDoubtStatus: any;
  setIsRevealed: any;
  setCurrentIndex: any;
  setQuizSecondsLeft: any;
  setXpHistory: any;
  setOpenReviewIndices: any;
  setUnlockedHints: any;
  setHasSubmittedLeaderboard: any;
  setLastQuizScore: any;
  setIsDailyChallenge: any;
  setQuizTimerActive: any;
  setScreen: any;
  setShowSidebar: any;
}

export const SetupNotesTab: React.FC<SetupNotesTabProps> = ({
  theme, studyRoom, triggerToast, setEditingNote, setNoteRefQuestion,
  setIsNoteModalOpen, setBankFilter, setCurrentQuiz, setUserAnswers,
  setDoubtStatus, setIsRevealed, setCurrentIndex, setQuizSecondsLeft,
  setXpHistory, setOpenReviewIndices, setUnlockedHints, setHasSubmittedLeaderboard,
  setLastQuizScore, setIsDailyChallenge, setQuizTimerActive, setScreen,
  setShowSidebar
}) => {
  return (
    <>
${block}
    </>
  );
};
`;

fs.writeFileSync('src/components/tabs/SetupNotesTab.tsx', code);
console.log('SetupNotesTab.tsx written');
