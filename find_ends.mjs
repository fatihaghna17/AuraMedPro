import fs from 'fs';
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const getEnd = (start) => {
  let openBraces = 0;
  for (let i = start - 1; i < lines.length; i++) {
    const line = lines[i];
    openBraces += (line.match(/\{/g) || []).length;
    openBraces -= (line.match(/\}/g) || []).length;
    if (openBraces === 0) return i + 1;
  }
  return -1;
};

console.log('syncUserProfile:', getEnd(849));
console.log('handleAuthSubmit:', getEnd(1875));
console.log('fetchGlobalSettings:', getEnd(1533));
console.log('fetchUserQuestions:', getEnd(1553));
console.log('checkActiveQuizSession:', getEnd(967));
console.log('removeDatabase:', getEnd(2200));

// Find auth listener useEffect
let authUseEffectStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const checkSession = async () => {')) {
    // wait, the listener might be around here. Let's find where useEffect starts before it.
    for (let j = i; j >= 0; j--) {
      if (lines[j].includes('useEffect(() => {') || lines[j].includes('useEffect(')) {
        authUseEffectStart = j + 1;
        break;
      }
    }
    break;
  }
}
console.log('authUseEffect:', authUseEffectStart, getEnd(authUseEffectStart));

// Find periodic session check useEffect
let periodicUseEffectStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const interval = setInterval(async () => {') && lines[i-1] && lines[i-1].includes('useEffect')) {
    periodicUseEffectStart = i; // i is 0-indexed, so line is i+1
    break;
  }
}
console.log('periodicUseEffect:', periodicUseEffectStart, getEnd(periodicUseEffectStart));
