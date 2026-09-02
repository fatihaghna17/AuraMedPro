import fs from 'fs';
const b1 = fs.readFileSync('block1.txt', 'utf8');
const b2 = fs.readFileSync('block2.txt', 'utf8');

const code = `import React from 'react';
import { Award, Flame, Snowflake, Clock, Check, Target, Trophy, History, Crown, Play, Share2, UploadCloud, TrendingUp, Sparkles, Activity, ShieldAlert, CalendarHeart } from 'lucide-react';
import { getLevelInfo, formatNotifTime } from '../../utils/appHelpers';
import OnboardingTour from '../OnboardingTour';
import CompetencyWidget from '../CompetencyWidget';
import PomodoroWidget from '../PomodoroWidget';
import { CirclePlay } from 'lucide-react';

interface SetupHomeTabProps {
  theme: string;
  userXP: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezeLeft: number;
  lastActiveDate: string | null;
  totalQuestionsAnswered: number;
  quizHistory: any[];
  achievements: any[];
  profileUsername: string;
  expandedCompetencies: any;
  setExpandedCompetencies: any;
  pomodoroMode: any;
  pomodoroSecondsLeft: number;
  pomodoroActive: boolean;
  pomodoroCount: number;
  setPomodoroActive: any;
  setPomodoroSecondsLeft: any;
  activeDashboardTab: any;
  setActiveDashboardTab: any;
  fileLeaderboard: any[];
  isLeaderboardLoading: boolean;
  globalTimeFilter: any;
  setGlobalTimeFilter: any;
  fileTimeFilter: any;
  setFileTimeFilter: any;
  leaderboardType: any;
  setLeaderboardType: any;
  fetchFileLeaderboard: any;
  selectedLeaderboardFile: string;
  setSelectedLeaderboardFile: any;
  globalLeaderboard: any[];
  fetchGlobalLeaderboard: any;
  competencyStats: any;
  globalDatabases: string[];
}

export const SetupHomeTab: React.FC<SetupHomeTabProps> = ({
  theme, userXP, currentStreak, longestStreak, streakFreezeLeft, lastActiveDate,
  totalQuestionsAnswered, quizHistory, achievements, profileUsername,
  expandedCompetencies, setExpandedCompetencies, pomodoroMode, pomodoroSecondsLeft,
  pomodoroActive, pomodoroCount, setPomodoroActive, setPomodoroSecondsLeft,
  activeDashboardTab, setActiveDashboardTab, fileLeaderboard, isLeaderboardLoading,
  globalTimeFilter, setGlobalTimeFilter, fileTimeFilter, setFileTimeFilter,
  leaderboardType, setLeaderboardType, fetchFileLeaderboard, selectedLeaderboardFile,
  setSelectedLeaderboardFile, globalLeaderboard, fetchGlobalLeaderboard, competencyStats,
  globalDatabases
}) => {
  return (
    <div className="space-y-6">
${b1}
${b2}
    </div>
  );
};
`;

fs.writeFileSync('src/components/tabs/SetupHomeTab.tsx', code);
console.log('SetupHomeTab.tsx written');
