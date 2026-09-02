import fs from 'fs';
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// 1. Find the useAnswerNotes call
let hookStart = -1;
let hookEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('} = useAnswerNotes(currentUser, triggerToast, screen, currentQuiz, userAnswers);')) {
    hookEnd = i;
    for (let j = i; j >= 0; j--) {
      if (lines[j].includes('const {') && lines[j+1].includes('answerNotes,')) {
        hookStart = j;
        break;
      }
    }
    break;
  }
}

// 2. Extract the hook call
const hookCall = lines.slice(hookStart, hookEnd + 1);
for (let i = hookStart; i <= hookEnd; i++) {
  lines[i] = '// moved useAnswerNotes';
}

// Add setAnswerNotes to the hook call
for (let i = 0; i < hookCall.length; i++) {
  if (hookCall[i].includes('setNotePopupOpen,')) {
    hookCall[i] = hookCall[i].replace('setNotePopupOpen,', 'setAnswerNotes, setNotePopupOpen,');
    break;
  }
}

// 3. Find useQuizState call to insert after it
let insertIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('} = useQuizState();')) {
    insertIdx = i + 1;
    break;
  }
}

lines.splice(insertIdx, 0, ...hookCall);

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Fixed A5 TDZ');
