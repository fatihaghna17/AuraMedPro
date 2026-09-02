import fs from 'fs';

const b1 = fs.readFileSync('block1.txt', 'utf8');
const b2 = fs.readFileSync('block2.txt', 'utf8');
const combined = b1 + '\n' + b2;

// using regex to find variables might be hard. I will just define a huge list of all possible props and check if they are in the string.
const allProps = [
  'theme', 'currentUser', 'userXP', 'currentStreak', 'longestStreak', 'streakFreezeLeft', 'lastActiveDate', 'totalQuestionsAnswered', 'quizHistory', 'achievements',
  'profileUsername', 'competencyStats', 'expandedCompetencies', 'setExpandedCompetencies',
  'pomodoroMode', 'pomodoroSecondsLeft', 'pomodoroActive', 'pomodoroCount', 'setPomodoroActive', 'setPomodoroSecondsLeft',
  'activeDashboardTab', 'setActiveDashboardTab', 'hasSubmittedLeaderboard', 'setIsLeaderboardLoading', 'submitScoreToLeaderboard', 'fileLeaderboard', 'isLeaderboardLoading', 'globalTimeFilter', 'setGlobalTimeFilter', 'fileTimeFilter', 'setFileTimeFilter', 'leaderboardType', 'setLeaderboardType', 'fetchFileLeaderboard', 'selectedLeaderboardFile', 'setSelectedLeaderboardFile', 'globalDatabases', 'globalLeaderboard', 'triggerToast', 'fetchGlobalLeaderboard'
];

const foundProps = allProps.filter(p => combined.includes(p));
console.log(foundProps.join(', '));
