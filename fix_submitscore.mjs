import fs from 'fs';
let hookCode = fs.readFileSync('src/hooks/useLeaderboard.ts', 'utf8');
let appCode = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const getEnd = (start) => {
  let openBraces = 0;
  let started = false;
  for (let i = start; i < appCode.length; i++) {
    const line = appCode[i];
    openBraces += (line.match(/\{/g) || []).length;
    openBraces -= (line.match(/\}/g) || []).length;
    if (line.includes('{')) started = true;
    if (started && openBraces === 0) return i;
  }
  return -1;
};

let start = -1;
let end = -1;
for (let i = 0; i < appCode.length; i++) {
  if (appCode[i].includes('const submitScoreToLeaderboard = async () => {')) {
    start = i;
    end = getEnd(i);
    break;
  }
}

let funcCode = '';
if (start !== -1) {
  // Wait, submitScoreToLeaderboard needs `selectedDatabases` and `currentQuiz`!
  // These are NOT in useLeaderboard. So they must be passed as arguments!
  // Wait, if it's called from ResultScreen, we can just pass them as arguments to submitScoreToLeaderboard.
  // In App.tsx: submitScoreToLeaderboard() is passed to onSubmitLeaderboard.
  // Wait, if we change its signature, we have to change where it's called.
  console.log('Needs refactoring');
}
