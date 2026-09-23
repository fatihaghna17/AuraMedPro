import React, { useState, useEffect, useMemo } from 'react';
import { Award, Trash2, Calendar, Trash, Flame, Snowflake, Clock, Check, Target, Trophy, History, Crown, Play, Share2, UploadCloud, TrendingUp, Sparkles, Activity, ShieldAlert, CalendarHeart } from 'lucide-react';
import { getLevelInfo, formatNotifTime } from '../../utils/appHelpers';
import { AVATAR_FRAMES, getSavedAvatarFrame, getSuddenDeathBestStreak, AvatarFrameId } from '../../utils/avatarFrames';
import {
  CultivatorAvatar,
  CULTIVATOR_TIERS,
  CultivatorGender,
  getSavedCultivatorGender,
  getEffectiveCultivatorTier,
  getCultivatorTier
} from '../../utils/cultivatorAvatars';
import { OnboardingTour } from '../OnboardingTour';
import PomodoroWidget from '../PomodoroWidget';
import DailyChallengeCard from '../DailyChallengeCard';
import IosInstallBanner from '../IosInstallBanner';
import QuickActionsRow from '../QuickActionsRow';
import PendingSessionsCard from '../PendingSessionsCard';
import HistoryAnalyticsPanel from '../HistoryAnalyticsPanel';
import { TrialCountdownBanner } from '../TrialCountdownBanner';
import { CirclePlay } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

interface SetupHomeTabProps {
  theme: string;
  currentUser?: any;
  trialEndsAt?: string | null; subscriptionStatus?: string | null; subscriptionExpiresAt?: string | null;
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
  startDailyChallenge: any;
  setShowIosInstallModal: any;
  pendingSessions: any[];
  setDashboardTab: any;
  resumeQuizSession: any;
  discardQuizSession: any;
  historyAnalytics: any;
  questionDatabase: any;
  clearAllHistory: any;
  setSelectedHistoryDetail: any;
  setOpenHistoryReviewIndices: any;
  deleteHistoryItem: any;
  isSuperAdmin?: boolean;
  isAdminAngkatan?: boolean;
  adminAngkatanFilter?: 'all' | '23' | '24' | '25' | '26';
  setAdminAngkatanFilter?: (filter: 'all' | '23' | '24' | '25' | '26') => void;
  userAngkatan?: string;
  userProdi?: string | null;
  leaderboardScope?: 'my' | 'all';
  setLeaderboardScope?: (scope: 'my' | 'all') => void;
  leaderboardProdiFilter?: string;
  setLeaderboardProdiFilter?: (filter: string) => void;
}

export const SetupHomeTab: React.FC<SetupHomeTabProps> = ({
  theme, currentUser, trialEndsAt, subscriptionStatus, subscriptionExpiresAt, userXP, currentStreak, longestStreak, streakFreezeLeft, lastActiveDate,
  totalQuestionsAnswered, quizHistory, achievements, profileUsername,
  expandedCompetencies, setExpandedCompetencies, pomodoroMode, pomodoroSecondsLeft,
  pomodoroActive, pomodoroCount, setPomodoroActive, setPomodoroSecondsLeft,
  activeDashboardTab, setActiveDashboardTab, fileLeaderboard, isLeaderboardLoading,
  globalTimeFilter, setGlobalTimeFilter, fileTimeFilter, setFileTimeFilter,
  leaderboardType, setLeaderboardType, fetchFileLeaderboard, selectedLeaderboardFile,
  setSelectedLeaderboardFile, globalLeaderboard, fetchGlobalLeaderboard,
  startDailyChallenge, setShowIosInstallModal, pendingSessions, setDashboardTab,
  resumeQuizSession, discardQuizSession, historyAnalytics, questionDatabase,
  clearAllHistory, setSelectedHistoryDetail, setOpenHistoryReviewIndices,
  deleteHistoryItem,
  isSuperAdmin = false,
  isAdminAngkatan = false,
  adminAngkatanFilter = 'all',
  setAdminAngkatanFilter,
  userAngkatan,
  userProdi,
  leaderboardScope = 'all',
  setLeaderboardScope,
  leaderboardProdiFilter = 'all',
  setLeaderboardProdiFilter
}) => {
  const [savedFrameId, setSavedFrameId] = useState<AvatarFrameId>(getSavedAvatarFrame());
  const [cultivatorGender, setCultivatorGender] = useState<CultivatorGender>(getSavedCultivatorGender());
  const [cultivatorTier, setCultivatorTier] = useState<number>(getEffectiveCultivatorTier(getLevelInfo(userXP).level));

  useEffect(() => {
    const handleUpdate = () => {
      setSavedFrameId(getSavedAvatarFrame());
      setCultivatorGender(getSavedCultivatorGender());
      setCultivatorTier(getEffectiveCultivatorTier(getLevelInfo(userXP).level));
    };
    handleUpdate();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('auramedpro_frame_changed', handleUpdate);
    window.addEventListener('auramedpro_avatar_gender_changed', handleUpdate);
    window.addEventListener('auramedpro_avatar_tier_changed', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('auramedpro_frame_changed', handleUpdate);
      window.removeEventListener('auramedpro_avatar_gender_changed', handleUpdate);
      window.removeEventListener('auramedpro_avatar_tier_changed', handleUpdate);
    };
  }, [userXP]);

  const currentFrame = AVATAR_FRAMES.find(f => f.id === savedFrameId) || AVATAR_FRAMES[0];
  const userBestSuddenDeath = getSuddenDeathBestStreak();

  // 7-day activity data calculation for Bento Panel 1
  const activityData = useMemo(() => {
    const daily: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      daily[dateStr] = 0;
    }

    quizHistory.forEach(entry => {
      const d = new Date(entry.date);
      const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      if (daily[dateStr] !== undefined) {
        daily[dateStr] += (entry.correct || 0);
      } else {
        daily[dateStr] = (entry.correct || 0);
      }
    });

    return Object.keys(daily).slice(-7).map(key => ({
      name: key,
      JawabanBenar: daily[key],
    }));
  }, [quizHistory]);

  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const chartFill = theme === 'dark' ? '#818cf8' : '#6366f1';

  return (
    <div className="space-y-6">
      {/* ⏱️ Top Trial Countdown Banner */}
      <TrialCountdownBanner
        theme={theme}
        trialEndsAt={trialEndsAt} subscriptionStatus={subscriptionStatus} subscriptionExpiresAt={subscriptionExpiresAt}
        userAngkatan={userAngkatan}
        isSuperAdmin={isSuperAdmin}
        isAdminAngkatan={isAdminAngkatan}
      />

      <OnboardingTour theme={theme} onComplete={() => console.log('Tour done')} />
      <IosInstallBanner theme={theme} onInstallClick={() => setShowIosInstallModal(true)} />

      {/* ========================================================================= */}
      {/* TOP ROW: GREETING HERO BAR                                               */}
      {/* ========================================================================= */}
      <div className={`w-full p-5 sm:p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/80 border-indigo-500/15 shadow-xl'
          : 'bg-white/80 backdrop-blur-xl border-white/80 shadow-sm'
      }`}>
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-400 via-indigo-500 to-amber-400" />
        
        <div className="flex items-center gap-3.5">
          <div 
            onClick={() => setDashboardTab('profile')}
            className={`relative shrink-0 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-all ${currentFrame.ringClass} ${currentFrame.glowClass}`}
            title="Klik untuk melihat profil & kustomisasi avatar"
          >
            <CultivatorAvatar 
              tier={cultivatorTier}
              gender={cultivatorGender}
              className="w-full h-full"
              uid="home_hero"
            />
            <span className="absolute -bottom-1 -right-1 text-xs drop-shadow">
              {currentFrame.badge}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className={`text-xl sm:text-2xl font-black tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-indigo-900'}`}>
              Selamat datang, {profileUsername}!
            </h1>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 text-indigo-400 font-extrabold">
                <span>{CULTIVATOR_TIERS[cultivatorTier - 1]?.badge}</span>
                <span>Tingkat {cultivatorTier}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-indigo-500" />
                <span>Lv {getLevelInfo(userXP).level} • {userBestSuddenDeath >= 100 || savedFrameId === 'demon_king_100' ? 'Raja Iblis 👹' : getLevelInfo(userXP).rank}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                <span>{userXP} XP</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>{currentStreak} Hari Streak</span>
              </span>
            </div>
          </div>
        </div>

        {/* Level progress bar on right */}
        <div className="w-full md:w-72 shrink-0">
          <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1.5">
            <span>Progres Level</span>
            <span>{getLevelInfo(userXP).progress}% ke Level {getLevelInfo(userXP).level + 1}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full transition-all duration-550"
              style={{ width: `${getLevelInfo(userXP).progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions Full Width Row (3 balanced horizontal cards) */}
      <QuickActionsRow
        theme={theme}
        pendingCount={pendingSessions.length}
        pendingProgress={pendingSessions.length > 0 ? Math.round((pendingSessions[0].user_answers_json?.filter((a: any) => a !== null).length / pendingSessions[0].current_quiz_json?.length) * 100) : null}
        onNewQuiz={() => setDashboardTab('new')}
        onResumeOrBanks={() => {
          if (pendingSessions.length > 0) {
            resumeQuizSession(pendingSessions[0]);
          } else {
            setDashboardTab('banks');
          }
        }}
        onBanks={() => setDashboardTab('banks')}
      />

      {/* ========================================================================= */}
      {/* BENTO GRID (4 PANELS): COMPACT 2x2 LAYOUT                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ----------------------------------------------------------------------- */}
        {/* PANEL 1: KIRI ATAS - AKTIVITAS BELAJAR (Task Time / Study Activity)     */}
        {/* ----------------------------------------------------------------------- */}
        <div className={`lg:col-span-5 p-6 rounded-3xl transition-all duration-300 border flex flex-col justify-between animate-fade-in-up animation-delay-100 ${
          theme === 'dark'
            ? 'bg-slate-900/60 border-white/[0.08] shadow-2xl backdrop-blur-md'
            : 'bg-white/80 backdrop-blur-xl border-white/80 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-black tracking-tight text-slate-800 dark:text-white uppercase">
                  Aktivitas Belajar
                </h3>
                <p className="text-[11px] font-bold text-slate-400">7 hari terakhir</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {totalQuestionsAnswered} Total Soal
              </span>
            </div>

            {/* Mini stats row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`p-3 rounded-2xl border text-center ${
                theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200/60'
              }`}>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Benar Minggu Ini
                </span>
                <span className="text-xl font-black text-emerald-500">
                  {activityData.reduce((acc, curr) => acc + curr.JawabanBenar, 0)}
                </span>
              </div>
              <div className={`p-3 rounded-2xl border text-center ${
                theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200/60'
              }`}>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Sesi Pomodoro
                </span>
                <span className="text-xl font-black text-amber-500">
                  {pomodoroCount}
                </span>
              </div>
            </div>

            {/* 7-Day Activity Chart */}
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHomeActivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartFill} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={chartFill} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: textColor }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: textColor }} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                      borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area type="monotone" dataKey="JawabanBenar" stroke={chartFill} strokeWidth={2.5} fillOpacity={1} fill="url(#colorHomeActivity)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* PANEL 2: KANAN ATAS - RIWAYAT KUIS & LEADERBOARD (SCROLLABLE IN 1 SPOT) */}
        {/* ----------------------------------------------------------------------- */}
        <div className={`lg:col-span-7 p-6 rounded-3xl transition-all duration-300 border flex flex-col animate-fade-in-up animation-delay-150 ${
          theme === 'dark'
            ? 'bg-slate-900/60 border-white/[0.08] shadow-2xl backdrop-blur-md'
            : 'bg-white/80 backdrop-blur-xl border-white/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveDashboardTab('riwayat')}
                className={`text-xs sm:text-sm font-extrabold uppercase tracking-wider pb-1 transition-all border-b-2 cursor-pointer ${
                  activeDashboardTab === 'riwayat'
                    ? 'text-indigo-500 border-indigo-500'
                    : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                Riwayat Percobaan
              </button>
              <button
                onClick={async () => {
                  setActiveDashboardTab('leaderboard');
                  await fetchGlobalLeaderboard();
                  if (selectedLeaderboardFile) {
                    await fetchFileLeaderboard(selectedLeaderboardFile);
                  } else if (Object.keys(questionDatabase).length > 0) {
                    const firstFile = Object.keys(questionDatabase)[0];
                    setSelectedLeaderboardFile(firstFile);
                    await fetchFileLeaderboard(firstFile);
                  }
                }}
                className={`text-xs sm:text-sm font-extrabold uppercase tracking-wider pb-1 transition-all border-b-2 cursor-pointer ${
                  activeDashboardTab === 'leaderboard'
                    ? 'text-indigo-500 border-indigo-500'
                    : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                🏆 Leaderboard CBT
              </button>
            </div>

            {activeDashboardTab === 'riwayat' && quizHistory.length > 0 && (
              <button
                onClick={clearAllHistory}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 active:scale-105 active:translate-y-0 hover:scale-[1.02] hover:-translate-y-0.5 ${
                  theme === 'dark'
                    ? 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/80 text-rose-400'
                    : 'bg-rose-50 hover:bg-rose-100 border-rose-200/60 text-rose-600'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Kosongkan Riwayat
              </button>
            )}
          </div>

          {/* Scrollable Container (Fixed height, internal scroll) */}
          <div className="max-h-[380px] overflow-y-auto pr-1 space-y-4">
            {activeDashboardTab === 'riwayat' ? (
                  quizHistory.length === 0 ? (
                    <div className="text-center p-12">
                      <Award className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Belum ada riwayat pengerjaan kuis.
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[420px] mx-auto">
                        Selesaikan minimal satu kali try-out kuis CBT untuk mencatat riwayat skor beserta hasil analisis sub-kompetensi detail di sini.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      {/* Top Stats Overview */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className={`p-4 rounded-xl border text-center ${
                          theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-100/50 border-slate-200/60'
                        }`}>
                          <div className="text-2xl font-extrabold text-indigo-500">
                            {quizHistory.length}
                          </div>
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                            Jumlah Percobaan
                          </div>
                        </div>

                        <div className={`p-4 rounded-xl border text-center ${
                          theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-100/50 border-slate-200/60'
                        }`}>
                          <div className="text-2xl font-extrabold text-emerald-500">
                            {Math.round(quizHistory.reduce((a, b) => a + b.score, 0) / quizHistory.length)}
                          </div>
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                            Rata-rata Skor
                          </div>
                        </div>

                        <div className={`p-4 rounded-xl border text-center ${
                          theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-100/50 border-slate-200/60'
                        }`}>
                          <div className="text-2xl font-extrabold text-amber-500">
                            {Math.max(...quizHistory.map((h) => h.score))}
                          </div>
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                            Skor Tertinggi
                          </div>
                        </div>
                      </div>

                      {/* Detailed List */}
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                        {quizHistory.map((item, index) => {
                          const scoreColor = item.score >= 80 
                            ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
                            : item.score >= 65 
                            ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' 
                            : item.score >= 40 
                            ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' 
                            : 'text-rose-500 bg-rose-500/10 border-rose-500/20';

                          return (
                            <div
                              key={item.id}
                              style={{ animationDelay: `${Math.min(index * 40, 300)}ms` }}
                              onClick={() => {
                                setSelectedHistoryDetail(item);
                                setOpenHistoryReviewIndices({});
                              }}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border gap-4 transition-all hover:translate-x-1 cursor-pointer group/history animate-fade-in-up ${
                                theme === 'dark'
                                  ? 'bg-slate-800/20 hover:bg-slate-800/40 border-slate-800'
                                  : 'bg-white hover:bg-slate-100 border-slate-200/60 shadow-sm'
                              }`}
                              title="Klik untuk membuka detail soal & pembahasan"
                            >
                              <div className="flex items-center gap-3.5">
                                <div className={`w-12 h-12 rounded-full border flex flex-col items-center justify-center font-extrabold text-sm ${scoreColor}`}>
                                  <span>{item.score}</span>
                                  <span className="text-[7px] opacity-75 uppercase">Skor</span>
                                </div>

                                <div className="min-w-0">
                                  <div className="font-bold text-xs truncate max-w-[280px] sm:max-w-md group-hover/history:text-indigo-500 transition-colors">
                                    {item.files.join(', ')}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(item.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </span>
                                    <span>•</span>
                                    <span>{item.total} Soal</span>
                                    <span>•</span>
                                    <span className="text-emerald-500 font-bold">✔ {item.correct}</span>
                                    <span className="text-rose-500 font-bold">✘ {item.wrong}</span>
                                    <span className="text-slate-400 font-bold">∅ {item.empty}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[10px] font-extrabold text-indigo-500 group-hover/history:translate-x-1 transition-transform flex items-center gap-0.5">
                                  Lihat Pembahasan →
                                </span>

                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  item.mode === 'rmo'
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                    : item.mode === 'blok'
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : 'bg-indigo-500/10 text-indigo-500'
                                }`}>
                                  {item.mode === 'rmo' ? '🏆 RMO' : item.mode === 'blok' ? '📝 Ujian Blok' : item.mode === 'simulasi' ? 'Simulasi' : 'Sequential'}
                                </span>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteHistoryItem(item.id);
                                  }}
                                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus riwayat"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="space-y-6 animate-fade-in">
                    {/* Leaderboard Type Toggles */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/60 p-1 border border-slate-200/40 dark:border-slate-700/30">
                        <button
                          onClick={() => setLeaderboardType('global')}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            leaderboardType === 'global'
                              ? 'bg-indigo-50 text-white shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          Global (Total Soal)
                        </button>
                        <button
                          onClick={() => {
                            setLeaderboardType('file');
                            if (!selectedLeaderboardFile && Object.keys(questionDatabase).length > 0) {
                              const firstFile = Object.keys(questionDatabase)[0];
                              setSelectedLeaderboardFile(firstFile);
                              fetchFileLeaderboard(firstFile);
                            }
                          }}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            leaderboardType === 'file'
                              ? 'bg-indigo-50 text-white shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          Per File Soal
                        </button>
                      </div>

                      {leaderboardType === 'file' && Object.keys(questionDatabase).length > 0 && (
                        <div className="w-full sm:w-64">
                          <select
                            value={selectedLeaderboardFile}
                            onChange={(e) => setSelectedLeaderboardFile(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              theme === 'dark'
                                ? 'bg-slate-800 border-slate-700 text-slate-200'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            {Object.keys(questionDatabase).map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Filters: Prodi Filter Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-slate-200/40 dark:border-slate-800/40">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-1">
                          Program Studi:
                        </span>
                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/50 dark:bg-slate-800/35 border border-slate-200/40 dark:border-slate-700/20 flex-wrap">
                          {[
                            { key: 'all', label: 'Semua Prodi', icon: '🌐' },
                            { key: 'kedokteran', label: 'Kedokteran', icon: '🩺' },
                            { key: 'farmasi', label: 'Farmasi', icon: '💊' },
                            { key: 'kebidanan', label: 'Kebidanan', icon: '👶' },
                          ].map((item) => {
                            const isSelected = (leaderboardProdiFilter || 'all') === item.key;
                            const isMyProdi = userProdi && userProdi.toLowerCase() === item.key;
                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => setLeaderboardProdiFilter && setLeaderboardProdiFilter(item.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                                {isMyProdi && (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider ${
                                    isSelected ? 'bg-white/25 text-white' : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                                  }`}>
                                    Saya
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <span className="self-end sm:self-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {leaderboardType === 'global' ? globalLeaderboard.length : fileLeaderboard.length} Peserta
                      </span>
                    </div>

                    {/* Filters Row: Angkatan & Time Filter */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
                      {/* Left: Info Angkatan (User) / Dropdown Pilih Angkatan (Admin Super) / Badge Angkatan (Admin Angkatan) */}
                      {isSuperAdmin ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100/50 dark:bg-slate-800/35 border border-slate-200/40 dark:border-slate-700/20">
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-2">
                              Pilih Angkatan (Super Admin):
                            </span>
                            <select
                              value={adminAngkatanFilter || 'all'}
                              onChange={(e) => setAdminAngkatanFilter && setAdminAngkatanFilter(e.target.value as any)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer border ${
                                theme === 'dark'
                                  ? 'bg-slate-900 border-slate-700 text-slate-200'
                                  : 'bg-white border-slate-200 text-slate-800'
                              }`}
                            >
                              <option value="all">🌐 Semua Angkatan (Seluruh User)</option>
                              <option value="23">Angkatan 2023 (Seluruh User)</option>
                              <option value="24">Angkatan 2024 (Seluruh User)</option>
                              <option value="25">Angkatan 2025 (Seluruh User)</option>
                              <option value="26">Angkatan 2026 (Seluruh User)</option>
                            </select>
                          </div>
                        </div>
                      ) : isAdminAngkatan ? (
                        <div className="flex items-center gap-2">
                          <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5 shadow-sm">
                            <span>🛡️</span>
                            <span>Admin Angkatan {userAngkatan ? `20${userAngkatan}` : 'Saya'} — Seluruh Mahasiswa</span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/50 dark:bg-slate-800/35 border border-slate-200/40 dark:border-slate-700/20 w-max">
                          <button
                            type="button"
                            onClick={() => setLeaderboardScope && setLeaderboardScope('my')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                              leaderboardScope === 'my'
                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <span>🎓</span>
                            <span>Angkatan {userAngkatan ? `20${userAngkatan}` : 'Saya'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLeaderboardScope && setLeaderboardScope('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                              leaderboardScope === 'all'
                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <span>🌐</span>
                            <span>Lintas Angkatan</span>
                          </button>
                        </div>
                      )}

                      {/* Time Filter Tabs */}
                      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100/50 dark:bg-slate-800/35 border border-slate-200/40 dark:border-slate-700/20 w-max">
                        {[
                          { key: 'all', label: 'Semua Waktu' },
                          { key: '1', label: 'Hari Ini' },
                          { key: '7', label: 'Minggu Ini' },
                          { key: '30', label: 'Bulan Ini' }
                        ].map((filter) => {
                          const isActive = leaderboardType === 'global'
                            ? globalTimeFilter === filter.key
                            : fileTimeFilter === filter.key;
                          return (
                            <button
                              key={filter.key}
                              onClick={() => {
                                if (leaderboardType === 'global') {
                                   setGlobalTimeFilter(filter.key as any);
                                } else {
                                   setFileTimeFilter(filter.key as any);
                                }
                              }}
                              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-indigo-500 text-white shadow-sm'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                            >
                              {filter.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Aura Prestige Legend */}
                    <div className="flex items-center gap-2 flex-wrap px-1 text-[10px]">
                      <span className="font-bold text-slate-450 uppercase tracking-wider text-[9px]">Efek Aura:</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-slate-950 shadow-sm border border-yellow-200 flex items-center gap-1">
                        <span>👑</span>
                        <span>Level 95+ (Aura Sultan)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/35 flex items-center gap-1">
                        <span>💀</span>
                        <span>Streak 20+ Sudden Death (Aura Survivor)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-500/15 text-teal-600 dark:text-teal-300 border border-teal-500/35 flex items-center gap-1">
                        <span>⚡</span>
                        <span>3000+ Soal (Aura Veteran)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/35 flex items-center gap-1">
                        <span>🔥</span>
                        <span>500 Soal Hari Ini (Aura Maraton)</span>
                      </span>
                    </div>

                    {/* Active Aura Status for Current User */}
                    {(currentFrame.auraClass || userBestSuddenDeath >= 20) && (
                      <div className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all animate-fade-in ${
                        currentFrame.id === 'demon_king_100' || userBestSuddenDeath >= 100
                          ? 'bg-black/90 border-red-600/90 text-red-400 shadow-md shadow-red-950/80 ring-1 ring-red-500/50'
                          : currentFrame.id === 'sudden_death_master' || userBestSuddenDeath >= 20
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300 shadow-sm shadow-rose-500/10'
                          : currentFrame.id === 'caduceus_mythic'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300 shadow-sm shadow-amber-500/10'
                          : currentFrame.id === 'veteran_3000'
                          ? 'bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-300 shadow-sm shadow-teal-500/10'
                          : 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-300 shadow-sm shadow-purple-500/10'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            currentFrame.id === 'demon_king_100' || userBestSuddenDeath >= 100
                              ? 'p-[2px] bg-gradient-to-tr from-black via-zinc-950 to-red-600 border border-red-500 shadow-md shadow-red-900/60'
                              : currentFrame.id === 'sudden_death_master' || userBestSuddenDeath >= 20
                              ? 'p-[2px] bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 border border-rose-300 shadow-md shadow-rose-500/40'
                              : currentFrame.ringClass
                          }`}>
                            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-xs">
                              {currentFrame.id === 'demon_king_100' || userBestSuddenDeath >= 100 ? '👹' : currentFrame.id === 'sudden_death_master' || userBestSuddenDeath >= 20 ? '💀' : currentFrame.badge}
                            </div>
                          </div>
                          <div>
                            <span className="font-extrabold block">
                              Aura Aktif Anda: {currentFrame.id === 'demon_king_100' || userBestSuddenDeath >= 100 ? 'Raja Iblis (Demon Lord)' : currentFrame.id === 'sudden_death_master' || userBestSuddenDeath >= 20 ? 'Tengkorak Emas (Survivor)' : currentFrame.name}
                            </span>
                            <span className="text-[10px] opacity-85 block">
                              Efek animasi bercahaya aktif di kartu profil dan baris peringkat Anda pada tabel di bawah.
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-current/10 border border-current/30 shrink-0 flex items-center gap-1 animate-pulse">
                          <span>✨</span>
                          <span>AURA AKTIF</span>
                        </span>
                      </div>
                    )}

                    <div className={`overflow-hidden rounded-xl border ${
                        theme === 'dark' ? 'bg-slate-900/35 border-slate-800' : 'bg-slate-50/50 border-slate-200/50'
                      }`}>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className={`border-b text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 ${
                                theme === 'dark' ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-100/50 border-slate-200/50'
                              }`}>
                                <th className="py-3 px-4 w-16 text-center">Rank</th>
                                <th className="py-3 px-4">Peserta</th>
                                {leaderboardType === 'global' ? (
                                  <th className="py-3 px-4 text-center">Total Soal Terjawab</th>
                                ) : (
                                  <>
                                    <th className="py-3 px-4 text-center">Skor Terbaik</th>
                                    <th className="py-3 px-4 text-center">Jumlah Soal</th>
                                    <th className="py-3 px-4">Tanggal Diunggah</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {isLeaderboardLoading ? (
                                // Skeleton rows
                                Array.from({ length: 7 }).map((_, i) => (
                                  <tr key={i} className={`border-b ${
                                    theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200/30'
                                  }`}>
                                    <td className="py-3.5 px-4 text-center">
                                      <div className={`w-6 h-6 mx-auto rounded-full animate-pulse ${
                                        theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-200'
                                      }`} />
                                    </td>
                                    <td className="py-3.5 px-4">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-24 h-3.5 rounded animate-pulse ${
                                          theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-200'
                                        }`} />
                                        <div className={`w-10 h-3 rounded animate-pulse ${
                                          theme === 'dark' ? 'bg-slate-700/40' : 'bg-slate-100'
                                        }`} />
                                      </div>
                                    </td>
                                    {leaderboardType === 'global' ? (
                                      <td className="py-3.5 px-4 text-center">
                                        <div className={`w-16 h-3.5 mx-auto rounded animate-pulse ${
                                          theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-200'
                                        }`} />
                                      </td>
                                    ) : (
                                      <>
                                        <td className="py-3.5 px-4 text-center">
                                          <div className={`w-12 h-3.5 mx-auto rounded animate-pulse ${
                                            theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-200'
                                          }`} />
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                          <div className={`w-14 h-3.5 mx-auto rounded animate-pulse ${
                                            theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-200'
                                          }`} />
                                        </td>
                                        <td className="py-3.5 px-4">
                                          <div className={`w-20 h-3 rounded animate-pulse ${
                                            theme === 'dark' ? 'bg-slate-700/40' : 'bg-slate-100'
                                          }`} />
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))
                              ) : leaderboardType === 'global' ? (
                                globalLeaderboard.length === 0 ? (
                                  <tr>
                                    <td colSpan={3} className="py-8 text-center text-slate-400">Belum ada data peringkat global.</td>
                                  </tr>
                                ) : (
                                  globalLeaderboard.map((row, index) => {
                                    const isCurrent = Boolean(
                                      (currentUser?.id && (row.id === currentUser.id || row.user_id === currentUser.id)) ||
                                      (row.username && profileUsername && (
                                        row.username === profileUsername ||
                                        row.username.trim().toLowerCase() === profileUsername.trim().toLowerCase()
                                      )) ||
                                      (currentUser?.user_metadata?.username && row.username && (
                                        row.username.trim().toLowerCase() === currentUser.user_metadata.username.trim().toLowerCase()
                                      )) ||
                                      (currentUser?.email && row.username && (
                                        row.username.trim().toLowerCase() === currentUser.email.split('@')[0].trim().toLowerCase()
                                      ))
                                    );
                                    const rankNum = row.isCurrentUserOutOfTop10 ? row.actualRank : index + 1;
                                    const userLvl = Number(row.level) || 1;
                                    const userQuestions = Number(row.total_questions_answered) || 0;
                                    const isLevel95 = userLvl >= 95;
                                    const isOver3000 = !isLevel95 && userQuestions >= 3000;

                                    const hasDemonKingAura = isCurrent && (
                                      currentFrame.id === 'demon_king_100' ||
                                      savedFrameId === 'demon_king_100' ||
                                      userBestSuddenDeath >= 100
                                    );

                                    const hasSuddenDeathAura = isCurrent && !hasDemonKingAura && (
                                      currentFrame.id === 'sudden_death_master' ||
                                      savedFrameId === 'sudden_death_master' ||
                                      userBestSuddenDeath >= 20
                                    );

                                    const hasSultanAura = isCurrent
                                      ? (!hasDemonKingAura && !hasSuddenDeathAura && (currentFrame.id === 'caduceus_mythic' || (isLevel95 && currentFrame.id !== 'veteran_3000' && currentFrame.id !== 'quest_500_today')))
                                      : isLevel95;

                                    const hasVeteranAura = isCurrent
                                      ? (!hasDemonKingAura && !hasSuddenDeathAura && (currentFrame.id === 'veteran_3000' || (isOver3000 && currentFrame.id !== 'caduceus_mythic' && currentFrame.id !== 'quest_500_today')))
                                      : isOver3000;

                                    const hasQuestAura = isCurrent && !hasDemonKingAura && !hasSuddenDeathAura && currentFrame.id === 'quest_500_today';

                                    let rowClasses = "border-b last:border-0 transition-all duration-300 relative ";
                                    if (hasDemonKingAura) {
                                      rowClasses += "aura-demon-king-row " + (
                                        theme === 'dark'
                                          ? 'bg-gradient-to-r from-black via-red-950/80 to-black border-red-600 shadow-[0_0_28px_rgba(220,38,38,0.7)] text-red-100'
                                          : 'bg-gradient-to-r from-zinc-900 via-red-950 to-zinc-900 border-red-600 shadow-[0_0_24px_rgba(220,38,38,0.6)] text-red-50'
                                      );
                                    } else if (hasSuddenDeathAura) {
                                      rowClasses += "aura-suddendeath-row " + (
                                        theme === 'dark'
                                          ? 'bg-gradient-to-r from-rose-600/25 via-red-500/20 to-amber-500/25 border-rose-500/80 shadow-[0_0_24px_rgba(244,63,94,0.45)]'
                                          : 'bg-gradient-to-r from-rose-100 via-red-50/80 to-amber-100 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.35)]'
                                      );
                                    } else if (hasSultanAura) {
                                      rowClasses += "aura-mythic-row " + (
                                        theme === 'dark'
                                          ? 'bg-gradient-to-r from-amber-500/20 via-purple-600/25 to-amber-500/20 border-amber-400/80 shadow-[0_0_22px_rgba(245,158,11,0.35)]'
                                          : 'bg-gradient-to-r from-amber-100/95 via-purple-100/70 to-amber-100/95 border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.25)]'
                                      );
                                    } else if (hasVeteranAura) {
                                      rowClasses += "aura-veteran-row " + (
                                        theme === 'dark'
                                          ? 'bg-gradient-to-r from-teal-500/15 via-cyan-500/15 to-teal-500/15 border-teal-400/70 shadow-[0_0_14px_rgba(20,184,166,0.25)]'
                                          : 'bg-gradient-to-r from-teal-50/95 via-cyan-50/70 to-teal-50/95 border-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.18)]'
                                      );
                                    } else if (hasQuestAura) {
                                      rowClasses += "aura-quest-row " + (
                                        theme === 'dark'
                                          ? 'bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20 border-purple-400/80 shadow-[0_0_18px_rgba(168,85,247,0.3)]'
                                          : 'bg-gradient-to-r from-purple-50/95 via-indigo-50/70 to-purple-50/95 border-purple-400 shadow-[0_0_14px_rgba(168,85,247,0.2)]'
                                      );
                                    } else if (isCurrent) {
                                      rowClasses += (theme === 'dark' ? 'bg-indigo-900/40 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200');
                                    } else {
                                      rowClasses += (theme === 'dark' ? 'border-slate-800/50 hover:bg-slate-800/20' : 'border-slate-200/30 hover:bg-slate-100/40');
                                    }

                                    return (
                                    <tr key={index} className={rowClasses}>
                                      <td className="py-3.5 px-4 text-center font-black">
                                        <span className={
                                          hasDemonKingAura
                                            ? "text-red-500 dark:text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] text-sm"
                                            : hasSuddenDeathAura
                                            ? "text-rose-500 dark:text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] text-sm"
                                            : hasSultanAura 
                                            ? "text-amber-500 dark:text-yellow-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] text-sm"
                                            : hasVeteranAura
                                            ? "text-teal-500 dark:text-teal-300 drop-shadow-[0_0_6px_rgba(20,184,166,0.5)]"
                                            : hasQuestAura
                                            ? "text-purple-500 dark:text-purple-300 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]"
                                            : "font-bold"
                                        }>
                                          {rankNum === 1 ? '👑' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : rankNum}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 font-extrabold flex items-center gap-2.5 flex-wrap">
                                        {/* Mini Cultivator Avatar with Frame Ring */}
                                        <div className={`relative shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                          hasDemonKingAura
                                            ? 'p-[1.5px] bg-gradient-to-tr from-black via-zinc-900 to-red-600 border border-red-500 shadow-md shadow-red-950 animate-pulse'
                                            : hasSuddenDeathAura 
                                            ? 'p-[1.5px] bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 border border-rose-300 shadow-md shadow-rose-500/60 animate-pulse'
                                            : hasSultanAura
                                            ? 'p-[1.5px] bg-gradient-to-tr from-amber-400 via-purple-500 to-yellow-300 border border-yellow-200 shadow-md shadow-amber-500/50'
                                            : hasVeteranAura
                                            ? 'p-[1.5px] bg-gradient-to-tr from-teal-400 to-cyan-500 border border-teal-200 shadow-sm shadow-teal-500/40'
                                            : hasQuestAura
                                            ? 'p-[1.5px] bg-gradient-to-tr from-purple-500 to-indigo-500 border border-purple-200 shadow-sm shadow-purple-500/40'
                                            : isCurrent
                                            ? currentFrame.ringClass
                                            : 'p-[1px] bg-slate-200 dark:bg-slate-700'
                                        }`}>
                                          <CultivatorAvatar 
                                            tier={isCurrent ? cultivatorTier : getCultivatorTier(row.level || 1)}
                                            gender={isCurrent ? cultivatorGender : 'pria'}
                                            className="w-full h-full"
                                            uid={`lb1_${index}_${row.username}`}
                                          />
                                          <span className="absolute -bottom-1 -right-1 text-[9px] drop-shadow">
                                            {hasDemonKingAura ? '👹' : hasSuddenDeathAura ? '💀' : hasSultanAura ? '👑' : hasVeteranAura ? '⚡' : hasQuestAura ? '🔥' : isCurrent ? currentFrame.badge : '🩺'}
                                          </span>
                                        </div>
                                        <span className={
                                          hasDemonKingAura
                                            ? (theme === 'dark'
                                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-red-500 font-black drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]'
                                                : 'text-red-950 font-black')
                                            : hasSuddenDeathAura
                                            ? (theme === 'dark'
                                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-red-300 to-amber-300 font-black drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                                                : 'text-rose-950 font-black')
                                            : hasSultanAura
                                            ? (theme === 'dark' 
                                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 font-black drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                                : 'text-amber-950 font-black')
                                            : hasVeteranAura
                                            ? (theme === 'dark' ? 'text-teal-200 font-black' : 'text-teal-900 font-black')
                                            : hasQuestAura
                                            ? (theme === 'dark' ? 'text-purple-200 font-black' : 'text-purple-900 font-black')
                                            : (isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200')
                                        }>
                                          {isCurrent && <span className="mr-1">{currentFrame.badge}</span>}
                                          {row.username} {isCurrent && '(Anda)'}
                                        </span>
                                        {/* Prodi Badge */}
                                        {(() => {
                                          const rowProdi = (row.prodi || 'kedokteran').toLowerCase();
                                          const isFarmasi = rowProdi === 'farmasi';
                                          const isKebidanan = rowProdi === 'kebidanan';
                                          return (
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 ${
                                              isFarmasi
                                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                                : isKebidanan
                                                ? 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30'
                                                : 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
                                            }`}>
                                              <span>{isFarmasi ? '💊' : isKebidanan ? '👶' : '🩺'}</span>
                                              <span>{isFarmasi ? 'Farmasi' : isKebidanan ? 'Kebidanan' : 'Kedokteran'}</span>
                                            </span>
                                          );
                                        })()}
                                        {row.angkatan && (
                                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                                            hasDemonKingAura
                                              ? 'bg-red-950/80 text-red-400 border-red-600/50'
                                              : hasSultanAura
                                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
                                              : hasSuddenDeathAura
                                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/30'
                                              : hasVeteranAura
                                              ? 'bg-teal-500/15 text-teal-600 dark:text-teal-300 border-teal-500/30'
                                              : hasQuestAura
                                              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30'
                                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                          }`}>
                                            '{row.angkatan}
                                          </span>
                                        )}
                                        {hasDemonKingAura ? (
                                          <>
                                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-red-950/80 text-red-300 font-black uppercase border border-red-600/60 shadow-sm shadow-red-900/50">
                                              LV {userLvl}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-black via-red-950 to-red-700 text-red-200 shadow-sm shadow-red-900/40 border border-red-500/60 flex items-center gap-0.5 animate-pulse">
                                              <span>👹</span>
                                              <span>RAJA IBLIS</span>
                                            </span>
                                          </>
                                        ) : hasSultanAura ? (
                                          <>
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/40 border border-yellow-200 flex items-center gap-0.5 animate-pulse">
                                              <span>✨</span>
                                              <span>LV {userLvl}</span>
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 via-purple-600 to-pink-500 text-white shadow-sm shadow-amber-500/30 border border-amber-300/40 flex items-center gap-1">
                                              <span>👑</span>
                                              <span>AURA SULTAN</span>
                                            </span>
                                          </>
                                        ) : hasSuddenDeathAura ? (
                                          <>
                                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-rose-500/20 text-rose-600 dark:text-rose-300 font-black uppercase border border-rose-500/35">
                                              LV {userLvl}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white shadow-sm shadow-rose-500/25 border border-rose-300/30 flex items-center gap-0.5 animate-pulse">
                                              <span>💀</span>
                                              <span>AURA SURVIVOR</span>
                                            </span>
                                          </>
                                        ) : hasVeteranAura ? (
                                          <>
                                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-teal-500/20 text-teal-600 dark:text-teal-300 font-black uppercase border border-teal-500/35">
                                              LV {userLvl}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-sm shadow-teal-500/25 border border-teal-300/30 flex items-center gap-0.5">
                                              <span>⚡</span>
                                              <span>AURA 3000+</span>
                                            </span>
                                          </>
                                        ) : hasQuestAura ? (
                                          <>
                                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-purple-500/20 text-purple-600 dark:text-purple-300 font-black uppercase border border-purple-500/35">
                                              LV {userLvl}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white shadow-sm shadow-purple-500/25 border border-purple-300/30 flex items-center gap-0.5">
                                              <span>🔥</span>
                                              <span>AURA MARATON</span>
                                            </span>
                                          </>
                                        ) : (
                                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-indigo-500/10 text-indigo-500 font-black uppercase">
                                            LV {userLvl}
                                          </span>
                                        )}
                                      </td>
                                      <td className={`py-3.5 px-4 text-center font-extrabold ${
                                        hasDemonKingAura
                                          ? 'text-red-500 dark:text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                                          : hasSultanAura
                                          ? 'text-amber-500 dark:text-yellow-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]'
                                          : hasSuddenDeathAura
                                          ? 'text-rose-500 dark:text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.4)]'
                                          : hasVeteranAura
                                          ? 'text-teal-500 dark:text-teal-300'
                                          : hasQuestAura
                                          ? 'text-purple-500 dark:text-purple-300'
                                          : 'text-indigo-500'
                                      }`}>
                                        {hasDemonKingAura && '👹 '}
                                        {hasSultanAura && '🔥 '}
                                        {hasSuddenDeathAura && '💀 '}
                                        {hasVeteranAura && '⚡ '}
                                        {hasQuestAura && '✨ '}
                                        {userQuestions} Soal
                                      </td>
                                    </tr>
                                  )})
                                )
                              ) : (
                                fileLeaderboard.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400">Belum ada data peringkat untuk file ini.</td>
                                  </tr>
                                ) : (
                                  fileLeaderboard.map((row, index) => {
                                    const isCurrent = Boolean(
                                      (currentUser?.id && (row.id === currentUser.id || row.user_id === currentUser.id)) ||
                                      (row.username && profileUsername && (
                                        row.username === profileUsername ||
                                        row.username.trim().toLowerCase() === profileUsername.trim().toLowerCase()
                                      )) ||
                                      (currentUser?.user_metadata?.username && row.username && (
                                        row.username.trim().toLowerCase() === currentUser.user_metadata.username.trim().toLowerCase()
                                      )) ||
                                      (currentUser?.email && row.username && (
                                        row.username.trim().toLowerCase() === currentUser.email.split('@')[0].trim().toLowerCase()
                                      ))
                                    );
                                    const rankNum = row.isCurrentUserOutOfTop10 ? row.actualRank : index + 1;
                                    const userLvl = Number(row.level) || 1;
                                    const userQuestions = Number(row.total_questions_answered) || 0;
                                    const isLevel95 = userLvl >= 95;
                                    const isOver3000 = !isLevel95 && userQuestions >= 3000;

                                    const hasDemonKingAura = isCurrent && (
                                      currentFrame.id === 'demon_king_100' ||
                                      savedFrameId === 'demon_king_100' ||
                                      userBestSuddenDeath >= 100
                                    );

                                    const hasSuddenDeathAura = isCurrent && !hasDemonKingAura && (
                                      currentFrame.id === 'sudden_death_master' ||
                                      savedFrameId === 'sudden_death_master' ||
                                      userBestSuddenDeath >= 20
                                    );

                                    const hasSultanAura = isCurrent
                                      ? (!hasDemonKingAura && !hasSuddenDeathAura && (currentFrame.id === 'caduceus_mythic' || (isLevel95 && currentFrame.id !== 'veteran_3000' && currentFrame.id !== 'quest_500_today')))
                                      : isLevel95;

                                    const hasVeteranAura = isCurrent
                                      ? (!hasDemonKingAura && !hasSuddenDeathAura && (currentFrame.id === 'veteran_3000' || (isOver3000 && currentFrame.id !== 'caduceus_mythic' && currentFrame.id !== 'quest_500_today')))
                                      : isOver3000;

                                    const hasQuestAura = isCurrent && !hasDemonKingAura && !hasSuddenDeathAura && currentFrame.id === 'quest_500_today';

                                    let rowClasses = "border-b last:border-0 transition-all duration-300 relative ";
                                    if (hasDemonKingAura) {
                                      rowClasses += "aura-demon-king-row " + (
                                        theme === 'dark'
                                          ? 'bg-gradient-to-r from-black via-red-950/80 to-black border-red-600 shadow-[0_0_28px_rgba(220,38,38,0.7)] text-red-100'
                                          : 'bg-gradient-to-r from-zinc-900 via-red-950 to-zinc-900 border-red-600 shadow-[0_0_24px_rgba(220,38,38,0.6)] text-red-50'
                                      );
                                    } else if (hasSuddenDeathAura) {
                                      rowClasses += "aura-suddendeath-row " + (
                                        theme === 'dark'
                                          ? 'bg-gradient-to-r from-rose-600/25 via-red-500/20 to-amber-500/25 border-rose-500/80 shadow-[0_0_24px_rgba(244,63,94,0.45)]'
                                          : 'bg-gradient-to-r from-rose-100 via-red-50/80 to-amber-100 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.35)]'
                                      );
                                    } else if (hasSultanAura) {
                                      rowClasses += "aura-mythic-row " + (
                                        theme === 'dark'
                                          ? 'bg-gradient-to-r from-amber-500/20 via-purple-600/25 to-amber-500/20 border-amber-400/80 shadow-[0_0_22px_rgba(245,158,11,0.35)]'
                                          : 'bg-gradient-to-r from-amber-100/95 via-purple-100/70 to-amber-100/95 border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.25)]'
                                      );
                                    } else if (hasVeteranAura) {
                                      rowClasses += "aura-veteran-row " + (
                                        theme === 'dark'
                                          ? 'bg-gradient-to-r from-teal-500/15 via-cyan-500/15 to-teal-500/15 border-teal-400/70 shadow-[0_0_14px_rgba(20,184,166,0.25)]'
                                          : 'bg-gradient-to-r from-teal-50/95 via-cyan-50/70 to-teal-50/95 border-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.18)]'
                                      );
                                    } else if (hasQuestAura) {
                                      rowClasses += "aura-quest-row " + (
                                        theme === 'dark'
                                          ? 'bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20 border-purple-400/80 shadow-[0_0_18px_rgba(168,85,247,0.3)]'
                                          : 'bg-gradient-to-r from-purple-50/95 via-indigo-50/70 to-purple-50/95 border-purple-400 shadow-[0_0_14px_rgba(168,85,247,0.2)]'
                                      );
                                    } else if (isCurrent) {
                                      rowClasses += (theme === 'dark' ? 'bg-indigo-900/40 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200');
                                    } else {
                                      rowClasses += (theme === 'dark' ? 'border-slate-800/50 hover:bg-slate-800/20' : 'border-slate-200/30 hover:bg-slate-100/40');
                                    }

                                    return (
                                    <tr key={index} className={rowClasses}>
                                      <td className="py-3.5 px-4 text-center font-black">
                                        <span className={
                                          hasDemonKingAura
                                            ? "text-red-500 dark:text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] text-sm"
                                            : hasSuddenDeathAura
                                            ? "text-rose-500 dark:text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] text-sm"
                                            : hasSultanAura 
                                            ? "text-amber-500 dark:text-yellow-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] text-sm"
                                            : hasVeteranAura
                                            ? "text-teal-500 dark:text-teal-300 drop-shadow-[0_0_6px_rgba(20,184,166,0.5)]"
                                            : hasQuestAura
                                            ? "text-purple-500 dark:text-purple-300 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]"
                                            : "font-bold"
                                        }>
                                          {rankNum === 1 ? '👑' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : rankNum}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 font-extrabold flex items-center gap-2.5 flex-wrap">
                                        {/* Mini Cultivator Avatar with Frame Ring */}
                                        <div className={`relative shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                          hasDemonKingAura
                                            ? 'p-[1.5px] bg-gradient-to-tr from-black via-zinc-900 to-red-600 border border-red-500 shadow-md shadow-red-950 animate-pulse'
                                            : hasSuddenDeathAura 
                                            ? 'p-[1.5px] bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 border border-rose-300 shadow-md shadow-rose-500/60 animate-pulse'
                                            : hasSultanAura
                                            ? 'p-[1.5px] bg-gradient-to-tr from-amber-400 via-purple-500 to-yellow-300 border border-yellow-200 shadow-md shadow-amber-500/50'
                                            : hasVeteranAura
                                            ? 'p-[1.5px] bg-gradient-to-tr from-teal-400 to-cyan-500 border border-teal-200 shadow-sm shadow-teal-500/40'
                                            : hasQuestAura
                                            ? 'p-[1.5px] bg-gradient-to-tr from-purple-500 to-indigo-500 border border-purple-200 shadow-sm shadow-purple-500/40'
                                            : isCurrent
                                            ? currentFrame.ringClass
                                            : 'p-[1px] bg-slate-200 dark:bg-slate-700'
                                        }`}>
                                          <CultivatorAvatar 
                                            tier={isCurrent ? cultivatorTier : getCultivatorTier(row.level || 1)}
                                            gender={isCurrent ? cultivatorGender : 'pria'}
                                            className="w-full h-full"
                                            uid={`lb2_${index}_${row.username}`}
                                          />
                                          <span className="absolute -bottom-1 -right-1 text-[9px] drop-shadow">
                                            {hasDemonKingAura ? '👹' : hasSuddenDeathAura ? '💀' : hasSultanAura ? '👑' : hasVeteranAura ? '⚡' : hasQuestAura ? '🔥' : isCurrent ? currentFrame.badge : '🩺'}
                                          </span>
                                        </div>
                                        <span className={
                                          hasDemonKingAura
                                            ? (theme === 'dark'
                                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-red-500 font-black drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]'
                                                : 'text-red-950 font-black')
                                            : hasSuddenDeathAura
                                            ? (theme === 'dark'
                                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-red-300 to-amber-300 font-black drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                                                : 'text-rose-950 font-black')
                                            : hasSultanAura
                                            ? (theme === 'dark' 
                                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 font-black drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                                : 'text-amber-950 font-black')
                                            : hasVeteranAura
                                            ? (theme === 'dark' ? 'text-teal-200 font-black' : 'text-teal-900 font-black')
                                            : hasQuestAura
                                            ? (theme === 'dark' ? 'text-purple-200 font-black' : 'text-purple-900 font-black')
                                            : (isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200')
                                        }>
                                          {isCurrent && <span className="mr-1">{currentFrame.badge}</span>}
                                          {row.username} {isCurrent && '(Anda)'}
                                        </span>
                                        {/* Prodi Badge */}
                                        {(() => {
                                          const rowProdi = (row.prodi || 'kedokteran').toLowerCase();
                                          const isFarmasi = rowProdi === 'farmasi';
                                          const isKebidanan = rowProdi === 'kebidanan';
                                          return (
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 ${
                                              isFarmasi
                                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                                : isKebidanan
                                                ? 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30'
                                                : 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
                                            }`}>
                                              <span>{isFarmasi ? '💊' : isKebidanan ? '👶' : '🩺'}</span>
                                              <span>{isFarmasi ? 'Farmasi' : isKebidanan ? 'Kebidanan' : 'Kedokteran'}</span>
                                            </span>
                                          );
                                        })()}
                                        {row.angkatan && (
                                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                                            hasDemonKingAura
                                              ? 'bg-red-950/80 text-red-400 border-red-600/50'
                                              : hasSultanAura
                                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
                                              : hasSuddenDeathAura
                                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/30'
                                              : hasVeteranAura
                                              ? 'bg-teal-500/15 text-teal-600 dark:text-teal-300 border-teal-500/30'
                                              : hasQuestAura
                                              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30'
                                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                          }`}>
                                            '{row.angkatan}
                                          </span>
                                        )}
                                        {hasDemonKingAura ? (
                                          <>
                                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-red-950/80 text-red-300 font-black uppercase border border-red-600/60 shadow-sm shadow-red-900/50">
                                              LV {userLvl}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-black via-red-950 to-red-700 text-red-200 shadow-sm shadow-red-900/40 border border-red-500/60 flex items-center gap-0.5 animate-pulse">
                                              <span>👹</span>
                                              <span>RAJA IBLIS</span>
                                            </span>
                                          </>
                                        ) : hasSultanAura ? (
                                          <>
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/40 border border-yellow-200 flex items-center gap-0.5 animate-pulse">
                                              <span>✨</span>
                                              <span>LV {userLvl}</span>
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 via-purple-600 to-pink-500 text-white shadow-sm shadow-amber-500/30 border border-amber-300/40 flex items-center gap-1">
                                              <span>👑</span>
                                              <span>AURA SULTAN</span>
                                            </span>
                                          </>
                                        ) : hasSuddenDeathAura ? (
                                          <>
                                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-rose-500/20 text-rose-600 dark:text-rose-300 font-black uppercase border border-rose-500/35">
                                              LV {userLvl}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white shadow-sm shadow-rose-500/25 border border-rose-300/30 flex items-center gap-0.5 animate-pulse">
                                              <span>💀</span>
                                              <span>AURA SURVIVOR</span>
                                            </span>
                                          </>
                                        ) : hasVeteranAura ? (
                                          <>
                                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-teal-500/20 text-teal-600 dark:text-teal-300 font-black uppercase border border-teal-500/35">
                                              LV {userLvl}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-sm shadow-teal-500/25 border border-teal-300/30 flex items-center gap-0.5">
                                              <span>⚡</span>
                                              <span>AURA 3000+</span>
                                            </span>
                                          </>
                                        ) : hasQuestAura ? (
                                          <>
                                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-purple-500/20 text-purple-600 dark:text-purple-300 font-black uppercase border border-purple-500/35">
                                              LV {userLvl}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white shadow-sm shadow-purple-500/25 border border-purple-300/30 flex items-center gap-0.5">
                                              <span>🔥</span>
                                              <span>AURA MARATON</span>
                                            </span>
                                          </>
                                        ) : (
                                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-indigo-500/10 text-indigo-500 font-black uppercase">
                                            LV {userLvl}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-3.5 px-4 text-center font-extrabold text-emerald-500 text-sm">
                                        {row.score}%
                                      </td>
                                      <td className="py-3.5 px-4 text-center font-semibold text-slate-500">
                                        {row.questions_count} Soal
                                      </td>
                                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                                        {new Date(row.created_at).toLocaleDateString('id-ID')}
                                      </td>
                                    </tr>
                                  )})
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

        {/* ----------------------------------------------------------------------- */}
        {/* PANEL 3: KIRI BAWAH - TANTANGAN HARIAN & SESI TERTUNDA                 */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-5 space-y-4 animate-fade-in-up animation-delay-200">
          {pendingSessions.length > 0 && (
            <PendingSessionsCard
              theme={theme}
              sessions={pendingSessions}
              onResume={resumeQuizSession}
              onDiscard={discardQuizSession}
            />
          )}
          <DailyChallengeCard theme={theme} onStart={startDailyChallenge} />
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* PANEL 4: KANAN BAWAH - ANALISIS SUB-KOMPETENSI & POMODORO TIMER        */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up animation-delay-250">
          <div className={`p-5 rounded-3xl border transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-slate-900/60 border-white/[0.08] shadow-xl backdrop-blur-md'
              : 'bg-white/80 backdrop-blur-xl border-white/80 shadow-sm'
          }`}>
            <HistoryAnalyticsPanel
              theme={theme}
              analytics={historyAnalytics}
              expandedCompetencies={expandedCompetencies}
              onToggleExpand={(name) => setExpandedCompetencies((prev: any) => ({ ...prev, [name]: !prev[name] }))}
            />
          </div>

          <div className={`p-5 rounded-3xl border transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-slate-900/60 border-white/[0.08] shadow-xl backdrop-blur-md'
              : 'bg-white/80 backdrop-blur-xl border-white/80 shadow-sm'
          }`}>
            <PomodoroWidget
              theme={theme}
              mode={pomodoroMode}
              secondsLeft={pomodoroSecondsLeft}
              isActive={pomodoroActive}
              completedSessions={pomodoroCount}
              onToggle={() => setPomodoroActive(!pomodoroActive)}
              onReset={() => {
                setPomodoroActive(false);
                setPomodoroSecondsLeft(pomodoroMode === 'focus' ? 25 * 60 : 5 * 60);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
