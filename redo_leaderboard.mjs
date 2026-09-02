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
  const [lastQuizScore, setLastQuizScore] = useState<number>(0);
  const [globalTimeFilter, setGlobalTimeFilter] = useState<'all' | '1' | '7' | '30'>('all');
  const [fileTimeFilter, setFileTimeFilter] = useState<'all' | '1' | '7' | '30'>('all');
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'file'>('global');
  const [selectedLeaderboardFile, setSelectedLeaderboardFile] = useState<string>('');
  const [activeDashboardTab, setActiveDashboardTab] = useState<'riwayat' | 'leaderboard'>('riwayat');

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
const fetchFileLeaderboard = extractFunc('const fetchFileLeaderboard =');
const recordQuizToLeaderboard = extractFunc('const recordQuizToLeaderboard =');

code += `  return {
    globalLeaderboard, fileLeaderboard, isLeaderboardLoading, hasSubmittedLeaderboard,
    lastQuizScore, globalTimeFilter, fileTimeFilter, leaderboardType, selectedLeaderboardFile, activeDashboardTab,
    setGlobalLeaderboard, setFileLeaderboard, setIsLeaderboardLoading, setHasSubmittedLeaderboard,
    setLastQuizScore, setGlobalTimeFilter, setFileTimeFilter, setLeaderboardType, setSelectedLeaderboardFile, setActiveDashboardTab,
    fetchGlobalLeaderboard, fetchFileLeaderboard, recordQuizToLeaderboard
  };
}
`;

fs.writeFileSync('src/hooks/useLeaderboard.ts', code);

// remove from App.tsx
const toRemove = [fetchGlobalLeaderboard, fetchFileLeaderboard, recordQuizToLeaderboard];
toRemove.forEach(r => {
  if (r) {
    for (let i = r.start; i <= r.end; i++) {
      lines[i] = '// extracted to useLeaderboard';
    }
  }
});

// safely remove states
const removeLine = (search) => {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(search)) {
      lines[i] = '// extracted leaderboard state';
      return i;
    }
  }
  return -1;
};

removeLine('const [activeDashboardTab, setActiveDashboardTab]');
removeLine('const [leaderboardType, setLeaderboardType]');
removeLine('const [selectedLeaderboardFile, setSelectedLeaderboardFile]');
removeLine('const [fileLeaderboard, setFileLeaderboard]');
removeLine('const [isLeaderboardLoading, setIsLeaderboardLoading]');
removeLine('const [hasSubmittedLeaderboard, setHasSubmittedLeaderboard]');
removeLine('const [lastQuizScore, setLastQuizScore]');
removeLine('const [globalTimeFilter, setGlobalTimeFilter]');
removeLine('const [fileTimeFilter, setFileTimeFilter]');

const insertLine = removeLine('const [globalLeaderboard, setGlobalLeaderboard]');

if (insertLine !== -1) {
  lines[insertLine] += `\n  const {
    globalLeaderboard, fileLeaderboard, isLeaderboardLoading, hasSubmittedLeaderboard,
    lastQuizScore, globalTimeFilter, fileTimeFilter, leaderboardType, selectedLeaderboardFile, activeDashboardTab,
    setHasSubmittedLeaderboard, setLastQuizScore, setGlobalTimeFilter, setFileTimeFilter,
    setLeaderboardType, setSelectedLeaderboardFile, setActiveDashboardTab,
    fetchGlobalLeaderboard, fetchFileLeaderboard, recordQuizToLeaderboard
  } = useLeaderboard(currentUser, profileUsername, triggerToast);`;
}

// insert import
const importIdx = lines.findIndex(l => l.includes("import { useNotifications }"));
lines.splice(importIdx + 1, 0, "import { useLeaderboard } from './hooks/useLeaderboard';");

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Done A4');
