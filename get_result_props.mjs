import fs from 'fs';
const block = fs.readFileSync('block_result.txt', 'utf8');

const regex = /\b(set[A-Z][a-zA-Z0-9_]*)\b/g;
const setters = [...new Set(block.match(regex))];
console.log('Setters:', setters.join(', '));

const otherPossible = [
  'theme', 'currentQuiz', 'userAnswers', 'doubtStatus', 'quizSecondsLeft',
  'isAdaptiveMode', 'adaptiveHistory', 'currentDifficulty', 'studyRoom', 'currentUser', 
  'triggerToast', 'copyQuestionToClipboard', 'handleResetQuiz', 'toggleSidebar',
  'handleReportQuestion', 'handleSaveNote', 'score', 'scoreValue', 'XP_EARNED',
  'achievements', 'isDailyChallenge', 'openNotePopup', 'answerNotes', 'notePopupOpen',
  'getCorrectLetterForQuestion', 'renderHtmlText', 'getQuestionImage', 'renderQuestionImage',
  'isUserAnswerCorrect', 'renderMarkdown', 'handleEndQuiz', 'formatTimer', 'setScreen',
  'setDashboardTab', 'setQuizTimerActive', 'hasRecordedLeaderboard', 'recordQuizToLeaderboard',
  'globalLeaderboard', 'selectedDatabases', 'submitScoreToLeaderboard', 'openHistoryReviewIndices',
  'setOpenHistoryReviewIndices', 'competencyStats', 'xpHistory', 'lastQuizScore'
];

const found = otherPossible.filter(p => block.includes(p));
console.log('Props:', found.join(', '));
