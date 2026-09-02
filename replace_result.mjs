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
  if (lines[i].includes("screen === 'result' && currentQuiz.length > 0 && (")) {
    start = i;
    break;
  }
}
const end = getEnd(start);

if (start !== -1 && end !== -1) {
  const props = `theme={theme} currentQuiz={currentQuiz} userAnswers={userAnswers} studyRoom={studyRoom} currentUser={currentUser} openNotePopup={openNotePopup} answerNotes={answerNotes} setScreen={setScreen} setDashboardTab={setDashboardTab} selectedDatabases={selectedDatabases} submitScoreToLeaderboard={submitScoreToLeaderboard} lastQuizScore={lastQuizScore} setLightboxImage={setLightboxImage} setReportModal={setReportModalOpen}`;
  
  lines.splice(start, end - start + 1, `        {screen === 'result' && currentQuiz.length > 0 && <ResultScreen ${props} />}`);
}

const importIdx = lines.findIndex(l => l.includes("import { QuizScreen }"));
lines.splice(importIdx + 1, 0, "import { ResultScreen } from './components/screens/ResultScreen';");

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('App.tsx updated for ResultScreen');
