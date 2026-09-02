import fs from 'fs';
let code = fs.readFileSync('src/components/tabs/SetupProfileTab.tsx', 'utf8');

// The file should already have correct imports because I wrote to it. But let's verify.
if (!code.includes("import { getRarityColor")) {
  code = code.replace("import { Download, Upload, LogOut } from 'lucide-react';", "import { Download, Upload, LogOut } from 'lucide-react';\nimport { getRarityColor, getRarityBg } from '../../utils/achievements';");
  fs.writeFileSync('src/components/tabs/SetupProfileTab.tsx', code);
}

// Fix App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
const lines = appCode.split('\n');

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
  if (lines[i].includes("{dashboardTab === 'profile' && (")) {
    start = i;
    break;
  }
}
const end = getEnd(start);

if (start !== -1 && end !== -1) {
  const props = `theme={theme} currentUser={currentUser} profileUsername={profileUsername} userXP={userXP} currentStreak={currentStreak} longestStreak={longestStreak} totalQuestionsAnswered={totalQuestionsAnswered} streakFreezeLeft={streakFreezeLeft} lastActiveDate={lastActiveDate} exportData={exportData} importData={importData} triggerToast={triggerToast} achievementFilter={achievementFilter} setAchievementFilter={setAchievementFilter} achievements={achievements}`;
  
  lines.splice(start, end - start + 1, `            {dashboardTab === 'profile' && <SetupProfileTab ${props} />}`);
}

const importIdx = lines.findIndex(l => l.includes("import { SetupNewQuizTab }"));
if (importIdx !== -1) {
  lines.splice(importIdx + 1, 0, "import { SetupProfileTab } from './components/tabs/SetupProfileTab';");
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Fixed SetupProfileTab and updated App.tsx correctly');
