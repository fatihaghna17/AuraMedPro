import fs from 'fs';
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const getEnd = (start) => {
  let openBraces = 0;
  let started = false;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    openBraces += (line.match(/\{/g) || []).length;
    openBraces -= (line.match(/\}/g) || []).length;
    if (line.includes('{')) started = true;
    if (started && openBraces === 0) return i;
  }
  return -1;
};

let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("screen === 'quiz' && currentQuiz.length > 0 && (")) {
    start = i;
    break;
  }
}
const end = getEnd(start);

if (start !== -1 && end !== -1) {
  const props = `theme={theme} currentQuiz={currentQuiz} currentIndex={currentIndex} userAnswers={userAnswers} doubtStatus={doubtStatus} isRevealed={isRevealed} quizSecondsLeft={quizSecondsLeft} keyboardNavEnabled={keyboardNavEnabled} isAdaptiveMode={isAdaptiveMode} currentDifficulty={currentDifficulty} aiPanelOpen={aiPanelOpen} aiLoading={aiLoading} aiExplanation={aiExplanation} aiFollowUp={aiFollowUp} aiMode={aiMode} mobileQuizNavOpen={mobileQuizNavOpen} studyRoom={studyRoom} currentUser={currentUser} triggerToast={triggerToast} copyQuestionToClipboard={copyQuestionToClipboard} setLightboxImage={setLightboxImage} selectAnswer={selectAnswer} handleAIRequest={handleAIRequest} navigateQuestion={navigateQuestion} checkAnswerNow={checkAnswerNow} toggleDoubt={toggleDoubt} handleNextQuestion={handleNextQuestion} openFinishModal={openFinishModal} unlockedHints={unlockedHints} setMobileQuizNavOpen={setMobileQuizNavOpen} setUserAnswers={setUserAnswers} setUnlockedHints={setUnlockedHints} setModalTitle={setModalTitle} setModalDesc={setModalDesc} setModalAction={setModalAction} setModalOpen={setModalOpen} setAiFollowUp={setAiFollowUp} setCurrentIndex={setCurrentIndex} setDoubtStatus={setDoubtStatus} exitQuiz={exitQuiz} toggleFullscreen={toggleFullscreen} isFullscreen={isFullscreen} answerNotes={answerNotes} openNotePopup={openNotePopup}`;
  
  lines.splice(start, end - start + 1, `        {screen === 'quiz' && currentQuiz.length > 0 && <QuizScreen ${props} />}`);
}

const importIdx = lines.findIndex(l => l.includes("import { SetupNotesTab }"));
lines.splice(importIdx + 1, 0, "import { QuizScreen } from './components/screens/QuizScreen';");

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('App.tsx updated for QuizScreen');
