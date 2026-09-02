import fs from 'fs';

let code = fs.readFileSync('src/components/tabs/SetupNotesTab.tsx', 'utf8');

// Add missing props
const missingProps = `
  bankFilter: string;
  startBookmarkPractice: any;
  userXP: number;
  activeQuizSessionIdRef: any;
  hasRecordedLeaderboard: any;
`;

code = code.replace('setShowSidebar: any;', 'setShowSidebar: any;\n' + missingProps);

const missingDestructure = `, bankFilter, startBookmarkPractice, userXP, activeQuizSessionIdRef, hasRecordedLeaderboard`;

code = code.replace('setShowSidebar\n})', 'setShowSidebar' + missingDestructure + '\n})');

fs.writeFileSync('src/components/tabs/SetupNotesTab.tsx', code);

// Fix App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const missingPropsPass = ` bankFilter={bankFilter} startBookmarkPractice={startBookmarkPractice} userXP={userXP} activeQuizSessionIdRef={activeQuizSessionIdRef} hasRecordedLeaderboard={hasRecordedLeaderboard}`;

appCode = appCode.replace('setShowSidebar={setShowSidebar} />', 'setShowSidebar={setShowSidebar}' + missingPropsPass + ' />');

fs.writeFileSync('src/App.tsx', appCode);
console.log('Fixed dependencies for SetupNotesTab');
