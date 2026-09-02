import fs from 'fs';

let code = fs.readFileSync('src/components/tabs/SetupHomeTab.tsx', 'utf8');

// Add missing imports
code = code.replace("import { Award,", "import { Award, Trash2,");
code = code.replace("import PomodoroWidget from '../PomodoroWidget';", "import PomodoroWidget from '../PomodoroWidget';\nimport DailyChallengeCard from '../DailyChallengeCard';\nimport IosInstallBanner from '../IosInstallBanner';\nimport QuickActionsRow from '../QuickActionsRow';\nimport PendingSessionsCard from '../PendingSessionsCard';\nimport HistoryAnalyticsPanel from '../HistoryAnalyticsPanel';");

// Add missing props
const missingProps = `
  startDailyChallenge: any;
  setShowIosInstallModal: any;
  pendingSessions: any[];
  setDashboardTab: any;
  resumeQuizSession: any;
  discardQuizSession: any;
  historyAnalytics: any;
  questionDatabase: any;
  clearAllHistory: any;
  setSelectedHistoryDetail: any;
  setOpenHistoryReviewIndices: any;
  deleteHistoryItem: any;
`;

code = code.replace('globalDatabases: string[];', 'globalDatabases: string[];' + missingProps);

const missingDestructure = `,
  startDailyChallenge, setShowIosInstallModal, pendingSessions, setDashboardTab,
  resumeQuizSession, discardQuizSession, historyAnalytics, questionDatabase,
  clearAllHistory, setSelectedHistoryDetail, setOpenHistoryReviewIndices,
  deleteHistoryItem`;

code = code.replace('globalDatabases\n})', 'globalDatabases' + missingDestructure + '\n})');

fs.writeFileSync('src/components/tabs/SetupHomeTab.tsx', code);

// Now fix App.tsx to pass these props
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const missingPropsPass = ` startDailyChallenge={startDailyChallenge} setShowIosInstallModal={setShowIosInstallModal} pendingSessions={pendingSessions} setDashboardTab={setDashboardTab} resumeQuizSession={resumeQuizSession} discardQuizSession={discardQuizSession} historyAnalytics={historyAnalytics} questionDatabase={questionDatabase} clearAllHistory={clearAllHistory} setSelectedHistoryDetail={setSelectedHistoryDetail} setOpenHistoryReviewIndices={setOpenHistoryReviewIndices} deleteHistoryItem={deleteHistoryItem}`;

appCode = appCode.replace('globalDatabases={globalDatabases} />', 'globalDatabases={globalDatabases}' + missingPropsPass + ' />');

fs.writeFileSync('src/App.tsx', appCode);

console.log('Fixed dependencies for SetupHomeTab');
