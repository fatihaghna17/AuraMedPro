import fs from 'fs';
let code = fs.readFileSync('src/components/screens/ResultScreen.tsx', 'utf8');

const doubleEntry = `  setReportModal: any;
  startQuiz: any;
  shareResult: any;
  srs: any;
  hasSubmittedLeaderboard: boolean;
  isLeaderboardLoading: boolean;
  analytics: any;
  weaknessesList: any[];
  openReviewIndices: Record<number, boolean>;
  toggleReviewAccordion: any;
  setReportModal: any;`;

const singleEntry = `  startQuiz: any;
  shareResult: any;
  srs: any;
  hasSubmittedLeaderboard: boolean;
  isLeaderboardLoading: boolean;
  analytics: any;
  weaknessesList: any[];
  openReviewIndices: Record<number, boolean>;
  toggleReviewAccordion: any;
  setReportModal: any;`;

code = code.replace(doubleEntry, singleEntry);
fs.writeFileSync('src/components/screens/ResultScreen.tsx', code);
console.log('Fixed duplicate');
