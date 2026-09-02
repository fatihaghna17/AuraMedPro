import fs from 'fs';
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const getEnd = (start) => {
  let openBraces = 0;
  let started = false;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    openBraces += (line.match(/\{/g) || []).length;
    openBraces -= (line.match(/\}/g) || []).length;
    if (line.includes('{')) started = true;
    if (started && openBraces === 0) return i;
  }
  return -1;
};

let code = `import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export function useLeaderboard(currentUser: any, profileUsername: string, triggerToast: (msg: string, icon?: string) => void) {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<any[]>([]);
  const [fileLeaderboard, setFileLeaderboard] = useState<any[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [hasSubmittedLeaderboard, setHasSubmittedLeaderboard] = useState(false);
  const [lastQuizScore, setLastQuizScore] = useState<number | null>(null);
  const [globalTimeFilter, setGlobalTimeFilter] = useState<'all' | 'weekly'>('all');
  const [fileTimeFilter, setFileTimeFilter] = useState<'all' | 'weekly'>('all');
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'file'>('global');
  const [selectedLeaderboardFile, setSelectedLeaderboardFile] = useState<string>('');
  const [activeDashboardTab, setActiveDashboardTab] = useState<'home' | 'banks' | 'new_quiz' | 'srs' | 'reports' | 'profile' | 'notes'>('home');

`;

const extractFunc = (search) => {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(search)) {
      const end = getEnd(i);
      code += lines.slice(i, end + 1).join('\n') + '\n\n';
      return { start: i, end };
    }
  }
  return null;
};

const fetchGlobalLeaderboard = extractFunc('async function fetchGlobalLeaderboard() {');
const recordQuizToLeaderboard = extractFunc('const recordQuizToLeaderboard =');

code += `  return {
    globalLeaderboard, fileLeaderboard, isLeaderboardLoading, hasSubmittedLeaderboard,
    lastQuizScore, globalTimeFilter, fileTimeFilter, leaderboardType, selectedLeaderboardFile, activeDashboardTab,
    setGlobalLeaderboard, setFileLeaderboard, setIsLeaderboardLoading, setHasSubmittedLeaderboard,
    setLastQuizScore, setGlobalTimeFilter, setFileTimeFilter, setLeaderboardType, setSelectedLeaderboardFile, setActiveDashboardTab,
    fetchGlobalLeaderboard, recordQuizToLeaderboard
  };
}
`;

fs.writeFileSync('src/hooks/useLeaderboard.ts', code);

// remove from App.tsx
const toRemove = [fetchGlobalLeaderboard, recordQuizToLeaderboard];
toRemove.forEach(r => {
  if (r) {
    for (let i = r.start; i <= r.end; i++) {
      lines[i] = '// extracted to useLeaderboard';
    }
  }
});

// remove states
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const [globalLeaderboard, setGlobalLeaderboard]')) {
    for(let j=0; j<10; j++) lines[i+j] = '// extracted leaderboard state';
    
    lines[i] += `\n  const {
    globalLeaderboard, fileLeaderboard, isLeaderboardLoading, hasSubmittedLeaderboard,
    lastQuizScore, globalTimeFilter, fileTimeFilter, leaderboardType, selectedLeaderboardFile, activeDashboardTab,
    setHasSubmittedLeaderboard, setLastQuizScore, setGlobalTimeFilter, setFileTimeFilter,
    setLeaderboardType, setSelectedLeaderboardFile, setActiveDashboardTab,
    fetchGlobalLeaderboard, recordQuizToLeaderboard
  } = useLeaderboard(currentUser, profileUsername, triggerToast);`;
    break;
  }
}

// insert import
const importIdx = lines.findIndex(l => l.includes("import { useNotifications }"));
lines.splice(importIdx + 1, 0, "import { useLeaderboard } from './hooks/useLeaderboard';");

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Done A4');
