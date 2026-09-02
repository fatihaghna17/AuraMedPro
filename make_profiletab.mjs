import fs from 'fs';

const block = fs.readFileSync('block_profile.txt', 'utf8');

const code = `import React from 'react';
import { Download, Upload, LogOut } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface SetupProfileTabProps {
  theme: string;
  currentUser: any;
  profileUsername: string;
  userXP: number;
  currentStreak: number;
  longestStreak: number;
  totalQuestionsAnswered: number;
  streakFreezeLeft: number;
  lastActiveDate: string | null;
  exportData: any;
  importData: any;
  triggerToast: any;
  achievementFilter: string;
  setAchievementFilter: any;
  achievements: any[];
}

export const SetupProfileTab: React.FC<SetupProfileTabProps> = ({
  theme, currentUser, profileUsername, userXP, currentStreak, longestStreak,
  totalQuestionsAnswered, streakFreezeLeft, lastActiveDate, exportData,
  importData, triggerToast, achievementFilter, setAchievementFilter, achievements
}) => {
  return (
    <div className="space-y-6 max-w-md mx-auto animate-fade-in">
${block.replace(/<div className="space-y-6 max-w-md mx-auto animate-fade-in">/, '').replace(/<\/div>$/, '')}
    </div>
  );
};
`;

fs.writeFileSync('src/components/tabs/SetupProfileTab.tsx', code);
console.log('SetupProfileTab.tsx written');
