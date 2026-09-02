import fs from 'fs';

let code = fs.readFileSync('src/components/screens/ResultScreen.tsx', 'utf8');

const missingProps = `
  startQuiz: any;
  shareResult: any;
  srs: any;
  hasSubmittedLeaderboard: boolean;
  isLeaderboardLoading: boolean;
  analytics: any;
  weaknessesList: any[];
  openReviewIndices: Record<number, boolean>;
  toggleReviewAccordion: any;
  setReportModalOpen: any;
`;

code = code.replace('setReportModal: any;', 'setReportModalOpen: any;\n' + missingProps);

const missingDestructure = `, startQuiz, shareResult, srs, hasSubmittedLeaderboard, isLeaderboardLoading, analytics, weaknessesList, openReviewIndices, toggleReviewAccordion`;
code = code.replace('setReportModal\n})', 'setReportModalOpen' + missingDestructure + '\n})');
code = code.replace(/setReportModal\(\{/g, 'setReportModalOpen({');

fs.writeFileSync('src/components/screens/ResultScreen.tsx', code);

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
const passProps = ` startQuiz={startQuiz} shareResult={shareResult} srs={srs} hasSubmittedLeaderboard={hasSubmittedLeaderboard} isLeaderboardLoading={isLeaderboardLoading} analytics={analytics} weaknessesList={weaknessesList} openReviewIndices={openReviewIndices} toggleReviewAccordion={toggleReviewAccordion}`;

// Fix setReportModalOpen name
appCode = appCode.replace('setReportModal={setReportModalOpen}', 'setReportModalOpen={setReportModalOpen}' + passProps);

fs.writeFileSync('src/App.tsx', appCode);

console.log('Fixed ResultScreen dependencies');
