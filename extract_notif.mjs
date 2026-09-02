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

let code = `import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { formatNotifTime } from '../utils/appHelpers';

export function useNotifications(currentUser: any, srs: any, triggerToast: (msg: string, icon?: string) => void) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState<{ id: string; type: 'srs' | 'new_quiz'; text: string; time: string; bankName?: string }[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(() => ('Notification' in window && Notification.permission === 'granted') || localStorage.getItem('auramed_push') === 'dismissed');

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

const showBrowserNotification = extractFunc('const showBrowserNotification =');
const requestPushPermission = extractFunc('const requestPushPermission =');
const fetchNotifications = extractFunc('const fetchNotifications =');
const markAllNotifRead = extractFunc('const markAllNotifRead =');

// find auto request permission useEffect
let autoReq = null;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("localStorage.getItem('auramed_push') !== 'dismissed'") && lines[i-1] && lines[i-1].includes('useEffect')) {
    const start = i - 1;
    const end = getEnd(start);
    code += lines.slice(start, end + 1).join('\n') + '\n\n';
    autoReq = { start, end };
    break;
  }
}

// find notif polling useEffect
let polling = null;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('fetchNotifications();') && lines[i+1] && lines[i+1].includes('const interval = setInterval(fetchNotifications, 60000);')) {
    // find useEffect above
    for (let j = i; j >= 0; j--) {
      if (lines[j].includes('useEffect')) {
        const start = j;
        const end = getEnd(start);
        code += lines.slice(start, end + 1).join('\n') + '\n\n';
        polling = { start, end };
        break;
      }
    }
    break;
  }
}

code += `  return {
    notifOpen, notifList, notifCount, pushEnabled,
    setNotifOpen, setNotifList, setNotifCount, setPushEnabled,
    showBrowserNotification, requestPushPermission, fetchNotifications, markAllNotifRead
  };
}
`;

fs.writeFileSync('src/hooks/useNotifications.ts', code);

// now remove from App.tsx
const toRemove = [showBrowserNotification, requestPushPermission, fetchNotifications, markAllNotifRead, autoReq, polling];
toRemove.forEach(r => {
  if (r) {
    for (let i = r.start; i <= r.end; i++) {
      lines[i] = '// extracted to useNotifications';
    }
  }
});

// remove states
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const [notifOpen, setNotifOpen] = useState(false);')) {
    lines[i] = '// extracted notifOpen';
    lines[i+1] = '// extracted notifList';
    lines[i+2] = '// extracted notifCount';
    lines[i+3] = '// extracted pushEnabled';
    
    // inject hook
    lines[i] += `\n  const {
    notifOpen, notifList, notifCount, pushEnabled,
    setNotifOpen, requestPushPermission, fetchNotifications, markAllNotifRead,
    showBrowserNotification
  } = useNotifications(currentUser, srs, triggerToast);`;
    break;
  }
}

// insert import
const importIdx = lines.findIndex(l => l.includes("import { useAuth }"));
lines.splice(importIdx + 1, 0, "import { useNotifications } from './hooks/useNotifications';");

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Done A3');
