import fs from 'fs';
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Find where to inject import
const importIdx = lines.findIndex(l => l.includes("import { useToast }"));
lines.splice(importIdx + 1, 0, "import { useAuth } from './hooks/useAuth';");

// Remove gamification states from their current location (around line 355-365)
// and store them.
let gStates = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const [userXP, setUserXP] = useState(0);')) {
    // Collect next 7 lines (or until we hit fetchNotifications)
    for (let j = 0; j < 10; j++) {
      if (lines[i].includes('const fetchNotifications =')) break;
      gStates.push(lines[i]);
      lines[i] = '// removed gState';
      i++;
    }
    break;
  }
}

// Convert fetchGlobalLeaderboard to function so it hoists
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const fetchGlobalLeaderboard = async () => {')) {
    lines[i] = '  async function fetchGlobalLeaderboard() {';
    break;
  }
}

// Replace auth states (lines 138-152) with gamification states + useAuth call
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const [questionDatabase')) {
    // Delete lines 138-152
    for(let j = 0; j <= 15; j++) {
      lines[i+j] = '// removed auth state';
    }
    
    // Insert new code at this position
    const injection = `
${gStates.join('\n')}
  const {
    currentUser, authLoading, authMode, emailInput, passwordInput, localSessionId,
    isSessionKicked, profileUsername, globalDatabases, uploaderMap, questionDatabase,
    isLoggingInRef, isProfileSyncedRef,
    setCurrentUser, setAuthLoading, setAuthMode, setEmailInput, setPasswordInput,
    setLocalSessionId, setIsSessionKicked, setProfileUsername, setGlobalDatabases,
    setUploaderMap, setQuestionDatabase,
    syncUserProfile, handleAuthSubmit, fetchGlobalSettings, fetchUserQuestions,
    checkActiveQuizSession, removeDatabase
  } = useAuth({
    triggerToast,
    setUserXP,
    setCurrentStreak,
    setLongestStreak,
    setStreakFreezeLeft,
    setLastActiveDate,
    setTotalQuestionsAnswered,
    setXpHistory,
    fetchGlobalLeaderboard,
  });
`;
    lines[i] = injection;
    break;
  }
}

// Now we need to remove the functions that we moved to useAuth:
// syncUserProfile: 849 - 965
// checkActiveQuizSession: 967 - 1033
// fetchGlobalSettings: 1533 - 1551
// fetchUserQuestions: 1553 - 1659
// auth listener: 1788 - 1846
// periodic session check: 1848 - 1872
// handleAuthSubmit: 1875 - 1911
// removeDatabase: 2200 - 2227

// It's safer to just replace them with empty lines or comments
// But wait, line numbers changed because of splicing!
// Since we only added 1 import line, all original line numbers are +1.
// And we didn't remove lines, we just replaced them with comments.
// So let's blank out the exact contents using a function that searches for the function start and end.
const blankOutFunc = (startText, endMarker = '  };') => {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(startText)) {
      let openBraces = 0;
      let started = false;
      for (let j = i; j < lines.length; j++) {
        const line = lines[j];
        openBraces += (line.match(/\{/g) || []).length;
        openBraces -= (line.match(/\}/g) || []).length;
        started = true;
        lines[j] = '// extracted to useAuth';
        if (started && openBraces === 0) break;
      }
      break;
    }
  }
};

blankOutFunc('const syncUserProfile =');
blankOutFunc('const checkActiveQuizSession =');
blankOutFunc('const fetchGlobalSettings =');
blankOutFunc('const fetchUserQuestions =');
blankOutFunc('const handleAuthSubmit =');
blankOutFunc('const removeDatabase = (name: string, e: React.MouseEvent) => {');

// The auth listener is a useEffect
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const checkSession = async () => {')) {
    // find the useEffect before it
    for (let j = i; j >= i - 5; j--) {
      if (lines[j].includes('useEffect(() => {')) {
        let openBraces = 0;
        for (let k = j; k < lines.length; k++) {
          openBraces += (lines[k].match(/\{/g) || []).length;
          openBraces -= (lines[k].match(/\}/g) || []).length;
          lines[k] = '// extracted auth listener';
          if (openBraces === 0) break;
        }
        break;
      }
    }
    break;
  }
}

// Periodic check
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const interval = setInterval(async () => {')) {
    // find useEffect
    for (let j = i; j >= i - 5; j--) {
      if (lines[j].includes('useEffect(() => {') || lines[j].includes('useEffect(')) {
        let openBraces = 0;
        for (let k = j; k < lines.length; k++) {
          openBraces += (lines[k].match(/\{/g) || []).length;
          openBraces -= (lines[k].match(/\}/g) || []).length;
          lines[k] = '// extracted periodic session';
          if (openBraces === 0) break;
        }
        break;
      }
    }
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('App.tsx modified for useAuth');
