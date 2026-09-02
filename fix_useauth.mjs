import fs from 'fs';

let authCode = fs.readFileSync('src/hooks/useAuth.ts', 'utf8');

// fix imports
authCode = authCode.replace("import { useState", "import React, { useState");
authCode = authCode.replace("import { parseRawFileToQuestions, mapUnifiedQuestion } from '../utils/quizUtils';", "import { parseRawFileToQuestions, mapUnifiedQuestion } from '../utils/quizUtils';\nimport { SAMPLE_BANKS } from '../data/sampleBanks';");

// add missing options
authCode = authCode.replace("  fetchGlobalLeaderboard,", `  fetchGlobalLeaderboard,
  setSelectedDatabases,
  setPendingSessions,
  setGlobalCustomFolders,
  setGlobalQuizFolderMap,`);

// fix TS2740 (type mismatch Question[])
authCode = authCode.replace("mappedData[name] = questions;", "mappedData[name] = questions as any;");

fs.writeFileSync('src/hooks/useAuth.ts', authCode);


// Now fix App.tsx TDZ issues
let appCode = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// 1. Move useToast up before useAuth
let toastLine = -1;
let toastCode = '';
for (let i = 0; i < appCode.length; i++) {
  if (appCode[i].includes('const { toastMessage, triggerToast } = useToast();')) {
    toastLine = i;
    toastCode = appCode[i];
    appCode[i] = '// moved useToast';
    break;
  }
}

// 2. Add new props to useAuth call
for (let i = 0; i < appCode.length; i++) {
  if (appCode[i].includes('fetchGlobalLeaderboard,')) {
    appCode[i] = `    fetchGlobalLeaderboard,
    setSelectedDatabases,
    setPendingSessions,
    setGlobalCustomFolders,
    setGlobalQuizFolderMap,`;
    break;
  }
}

// find where useAuth is called
for (let i = 0; i < appCode.length; i++) {
  if (appCode[i].includes('const {') && appCode[i+1] && appCode[i+1].includes('currentUser, authLoading, authMode, emailInput,')) {
    // Insert useToast before it
    appCode.splice(i, 0, toastCode);
    
    // We also need to move `pendingSessions`, `globalCustomFolders`, `globalQuizFolderMap`, `selectedDatabases` BEFORE useAuth.
    // I will extract them and insert them here.
    break;
  }
}

fs.writeFileSync('src/App.tsx', appCode.join('\n'));
