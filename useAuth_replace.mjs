import fs from 'fs';

const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
const getLines = (start, end) => lines.slice(start - 1, end).join('\n');

const imports = "import { useAuth } from './hooks/useAuth';\n";
let content = fs.readFileSync('src/App.tsx', 'utf8');

// replace states 138-152
const hookCall = `  const {
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
    syncLocalQuizSessions,
    fetchGlobalLeaderboard,
    setSelectedDatabases
  });
`;

// It's safer to just comment out the old lines and insert the new ones, then delete the old lines later if tests pass.
