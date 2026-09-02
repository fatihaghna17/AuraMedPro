import fs from 'fs';
const block = fs.readFileSync('block_profile.txt', 'utf8');
const allProps = [
  'theme', 'currentUser', 'profileUsername', 'userXP', 'currentStreak', 'longestStreak', 
  'totalQuestionsAnswered', 'streakFreezeLeft', 'lastActiveDate', 'uploaderMap', 
  'globalDatabases', 'pushEnabled', 'setPushEnabled', 'requestPushPermission',
  'handleLogout', 'handleExportData', 'handleImportData'
];

const foundProps = allProps.filter(p => block.includes(p));
console.log(foundProps.join(', '));
