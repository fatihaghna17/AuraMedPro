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
  if (lines[i].includes("{dashboardTab === 'srs' && (")) {
    start = i;
    break;
  }
}
const end = getEnd(start);

if (start !== -1 && end !== -1) {
  const props = `theme={theme} srs={srs} triggerToast={triggerToast} srsAnswerRevealed={srsAnswerRevealed} setSrsAnswerRevealed={setSrsAnswerRevealed} srsPendingRating={srsPendingRating} setSrsPendingRating={setSrsPendingRating}`;
  
  lines.splice(start, end - start + 1, `            {dashboardTab === 'srs' && <SetupSRSTab ${props} />}`);
}

const importIdx = lines.findIndex(l => l.includes("import { SetupProfileTab }"));
lines.splice(importIdx + 1, 0, "import { SetupSRSTab } from './components/tabs/SetupSRSTab';");

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('App.tsx updated for SetupSRSTab');
