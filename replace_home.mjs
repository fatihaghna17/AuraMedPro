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

let start1 = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("{dashboardTab === 'home' && (")) {
    start1 = i;
    break;
  }
}
const end1 = getEnd(start1);

let start2 = -1;
for (let i = end1 + 1; i < lines.length; i++) {
  if (lines[i].includes("{dashboardTab === 'home' && (")) {
    start2 = i;
    break;
  }
}
const end2 = getEnd(start2);

const propsStr = `theme={theme} userXP={userXP} currentStreak={currentStreak} longestStreak={longestStreak} streakFreezeLeft={streakFreezeLeft} lastActiveDate={lastActiveDate} totalQuestionsAnswered={totalQuestionsAnswered} quizHistory={quizHistory} achievements={achievements} profileUsername={profileUsername} expandedCompetencies={expandedCompetencies} setExpandedCompetencies={setExpandedCompetencies} pomodoroMode={pomodoroMode} pomodoroSecondsLeft={pomodoroSecondsLeft} pomodoroActive={pomodoroActive} pomodoroCount={pomodoroCount} setPomodoroActive={setPomodoroActive} setPomodoroSecondsLeft={setPomodoroSecondsLeft} activeDashboardTab={activeDashboardTab} setActiveDashboardTab={setActiveDashboardTab} fileLeaderboard={fileLeaderboard} isLeaderboardLoading={isLeaderboardLoading} globalTimeFilter={globalTimeFilter} setGlobalTimeFilter={setGlobalTimeFilter} fileTimeFilter={fileTimeFilter} setFileTimeFilter={setFileTimeFilter} leaderboardType={leaderboardType} setLeaderboardType={setLeaderboardType} fetchFileLeaderboard={fetchFileLeaderboard} selectedLeaderboardFile={selectedLeaderboardFile} setSelectedLeaderboardFile={setSelectedLeaderboardFile} globalLeaderboard={globalLeaderboard} fetchGlobalLeaderboard={fetchGlobalLeaderboard} competencyStats={competencyStats} globalDatabases={globalDatabases}`;

// Replace start1 to end1 with SetupHomeTab call
lines.splice(start1, end1 - start1 + 1, `            {dashboardTab === 'home' && <SetupHomeTab ${propsStr} />}`);

// Recalculate start2 since lines array changed
let newStart2 = -1;
for (let i = start1 + 1; i < lines.length; i++) {
  if (lines[i].includes("{dashboardTab === 'home' && (")) {
    newStart2 = i;
    break;
  }
}
if (newStart2 !== -1) {
  const newEnd2 = getEnd(newStart2);
  lines.splice(newStart2, newEnd2 - newStart2 + 1, '// extracted to SetupHomeTab (combined)');
}

const importIdx = lines.findIndex(l => l.includes("import { SetupReportsTab }"));
lines.splice(importIdx + 1, 0, "import { SetupHomeTab } from './components/tabs/SetupHomeTab';");

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('App.tsx updated for SetupHomeTab');
