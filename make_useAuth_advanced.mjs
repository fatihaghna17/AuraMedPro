import fs from 'fs';
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
const getLines = (start, end) => lines.slice(start - 1, end).join('\n');

const code = `import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Question } from '../types';
import { parseRawFileToQuestions, mapUnifiedQuestion } from '../utils/quizUtils';

export function useAuth({
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
}: any) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [localSessionId, setLocalSessionId] = useState<string | null>(null);
  const [isSessionKicked, setIsSessionKicked] = useState(false);
  const [profileUsername, setProfileUsername] = useState('user');
  const [globalDatabases, setGlobalDatabases] = useState<any[]>([]);
  const [uploaderMap, setUploaderMap] = useState<Record<string, string>>({});
  const [questionDatabase, setQuestionDatabase] = useState<Record<string, Question[]>>({});
  
  const isLoggingInRef = useRef(false);
  const isProfileSyncedRef = useRef(false);

${getLines(849, 965)}

${getLines(967, 1033)}

${getLines(1533, 1551)}

${getLines(1553, 1659)}

${getLines(1788, 1846)}

${getLines(1848, 1872)}

${getLines(1875, 1911)}

${getLines(2200, 2227)}

  return {
    currentUser, authLoading, authMode, emailInput, passwordInput, localSessionId,
    isSessionKicked, profileUsername, globalDatabases, uploaderMap, questionDatabase,
    isLoggingInRef, isProfileSyncedRef,
    setCurrentUser, setAuthLoading, setAuthMode, setEmailInput, setPasswordInput,
    setLocalSessionId, setIsSessionKicked, setProfileUsername, setGlobalDatabases,
    setUploaderMap, setQuestionDatabase,
    syncUserProfile, handleAuthSubmit, fetchGlobalSettings, fetchUserQuestions,
    checkActiveQuizSession, removeDatabase
  };
}
`;

fs.writeFileSync('src/hooks/useAuth.ts', code);
console.log('useAuth.ts created');
