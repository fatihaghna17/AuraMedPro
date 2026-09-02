import fs from 'fs';
const block = fs.readFileSync('block_quiz.txt', 'utf8');

const regex = /\b(set[A-Z][a-zA-Z0-9_]*)\b/g;
const setters = [...new Set(block.match(regex))];
console.log('Setters:', setters.join(', '));

const otherPossible = [
  'theme', 'currentQuiz', 'currentIndex', 'userAnswers', 'doubtStatus', 'isRevealed',
  'quizSecondsLeft', 'isDailyChallenge', 'keyboardNavEnabled', 'isAdaptiveMode', 
  'adaptiveHistory', 'currentDifficulty', 'aiPanelOpen', 'aiLoading', 'aiResponse', 
  'aiFollowUp', 'aiMode', 'showSidebar', 'mobileQuizNavOpen', 'studyRoom', 'currentUser', 
  'triggerToast', 'copyQuestionToClipboard', 'setLightboxImage', 'selectAnswer', 
  'handleAIRequest', 'navigateQuestion', 'checkAnswerNow', 'toggleDoubt', 
  'handleNextQuestion', 'openFinishModal', 'finishQuiz', 'setScreen', 'setQuizTimerActive', 
  'setReportModalOpen', 'setReportRefQuestion', 'openNotePopup', 'answerNotes', 'notePopupOpen',
  'getCorrectLetterForQuestion', 'renderHtmlText', 'getQuestionImage', 'renderQuestionImage',
  'unlockedHints'
];

const found = otherPossible.filter(p => block.includes(p));
console.log('Props:', found.join(', '));
