import React, { useState, useEffect, useMemo } from 'react';
import { Award, Trash2, Calendar, Trash, Flame, Snowflake, Clock, Check, Target, Trophy, History, Crown, Play, Share2, UploadCloud, TrendingUp, Sparkles, Activity, ShieldAlert, CalendarHeart } from 'lucide-react';
import { getLevelInfo, formatNotifTime, getStreakFlameStyle } from '../../utils/appHelpers';
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
import { LeaderboardCard } from '../LeaderboardCard';
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
  onTogglePomodoro?: () => void;
  onResetPomodoro?: () => void;
  onSelectPomodoroMode?: (mode: 'focus' | 'break' | 'long_break') => void;
  onAddPomodoroMinutes?: (mins: number) => void;
  setPomodoroActive?: any;
  setPomodoroSecondsLeft?: any;
  activeDashboardTab?: any;
  setActiveDashboardTab?: any;
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
  discardAllQuizSessions?: () => void;
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
  pomodoroActive, pomodoroCount, onTogglePomodoro, onResetPomodoro, onSelectPomodoroMode, onAddPomodoroMinutes, setPomodoroActive, setPomodoroSecondsLeft,
  activeDashboardTab, setActiveDashboardTab, fileLeaderboard, isLeaderboardLoading,
  globalTimeFilter, setGlobalTimeFilter, fileTimeFilter, setFileTimeFilter,
  leaderboardType, setLeaderboardType, fetchFileLeaderboard, selectedLeaderboardFile,
  setSelectedLeaderboardFile, globalLeaderboard, fetchGlobalLeaderboard,
  startDailyChallenge, setShowIosInstallModal, pendingSessions, setDashboardTab,
  resumeQuizSession, discardQuizSession, discardAllQuizSessions, historyAnalytics, questionDatabase,
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

  // Initial fetch for Leaderboard
  useEffect(() => {
    fetchGlobalLeaderboard?.();
    if (selectedLeaderboardFile) {
      fetchFileLeaderboard?.(selectedLeaderboardFile);
    } else if (Object.keys(questionDatabase).length > 0) {
      const firstFile = Object.keys(questionDatabase)[0];
      setSelectedLeaderboardFile?.(firstFile);
      fetchFileLeaderboard?.(firstFile);
    }
  }, []);

  const currentFrame = AVATAR_FRAMES.find(f => f.id === savedFrameId) || AVATAR_FRAMES[0];
  const userBestSuddenDeath = getSuddenDeathBestStreak();
  const streakFlame = getStreakFlameStyle(currentStreak);

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

  const textColor = theme === 'dark' ? '#9399b2' : '#6c6f85';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const chartFill = theme === 'dark' ? '#74c7ec' : '#209fb5';

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
      {/* TOP ROW: PAGE HEADER                                                     */}
      {/* ========================================================================= */}
      <div className="w-full p-4 sm:p-6 rounded-2xl liquid-glass-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div 
            onClick={() => setDashboardTab('profile')}
            className={`relative shrink-0 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 ${currentFrame.ringClass}`}
            title="Klik untuk melihat profil & kustomisasi avatar"
          >
            <CultivatorAvatar 
              tier={cultivatorTier}
              gender={cultivatorGender}
              className="w-full h-full"
              uid="home_hero"
            />
            <span className="absolute -bottom-1 -right-1 text-xs">
              {currentFrame.badge}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight truncate text-slate-900 dark:text-slate-100">
              Halo, {profileUsername}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-2.5 gap-y-1.5 mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                <span>{CULTIVATOR_TIERS[cultivatorTier - 1]?.badge}</span>
                <span>Tingkat {cultivatorTier}</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Lv {getLevelInfo(userXP).level} • {userBestSuddenDeath >= 100 || savedFrameId === 'demon_king_100' ? 'Raja Iblis 👹' : getLevelInfo(userXP).rank}</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{userXP} XP</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span 
                className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold"
                title={`Streak Belajar: ${currentStreak} Hari • ${streakFlame.tierName}`}
              >
                <Flame className={`w-3.5 h-3.5 fill-current ${streakFlame.flameColor}`} />
                <span>{currentStreak} Hari Streak</span>
              </span>
            </div>
          </div>
        </div>

        {/* Level progress bar on right */}
        <div className="w-full md:w-64 shrink-0 tabular-nums">
          <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Progres Level</span>
            <span>{getLevelInfo(userXP).progress}% ke Lv {getLevelInfo(userXP).level + 1}</span>
          </div>
          <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
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
      {/* DASHBOARD 2-COLUMN GRID: LEFT (POMODORO & ACTIVITY), RIGHT (HISTORY & RANKS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* ======================================================================= */}
        {/* COLUMN 1 (KIRI - lg:col-span-5): POMODORO TIMER AT TOP, ACTIVITY, ETC.   */}
        {/* ======================================================================= */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-5 min-w-0">
          {/* 1. POMODORO TIMER (DI PALING ATAS, LANGSUNG KELIHATAN) */}
          <PomodoroWidget
            theme={theme as 'light' | 'dark'}
            mode={pomodoroMode}
            secondsLeft={pomodoroSecondsLeft}
            isActive={pomodoroActive}
            completedSessions={pomodoroCount}
            onToggle={onTogglePomodoro || (() => setPomodoroActive?.(!pomodoroActive))}
            onReset={onResetPomodoro || (() => {
              setPomodoroActive?.(false);
              setPomodoroSecondsLeft?.(pomodoroMode === 'focus' ? 25 * 60 : pomodoroMode === 'long_break' ? 15 * 60 : 5 * 60);
            })}
            onSelectMode={onSelectPomodoroMode}
            onAddMinutes={onAddPomodoroMinutes}
          />

          {/* 2. AKTIVITAS BELAJAR */}
          <div className="p-4 sm:p-6 rounded-2xl liquid-glass-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Aktivitas Belajar
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">7 hari terakhir</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold tabular-nums bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {totalQuestionsAnswered} Total Soal
                </span>
              </div>

              {/* Mini stats row */}
              <div className="grid grid-cols-2 gap-3 mb-4 tabular-nums">
                <div className="p-3 sm:p-3.5 rounded-xl liquid-glass-subtle text-center">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                    Benar Minggu Ini
                  </span>
                  <span className="text-xl font-extrabold text-emerald-500 mt-0.5 block">
                    {activityData.reduce((acc, curr) => acc + curr.JawabanBenar, 0)}
                  </span>
                </div>
                <div className="p-3 sm:p-3.5 rounded-xl liquid-glass-subtle text-center">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                    Sesi Pomodoro
                  </span>
                  <span className="text-xl font-extrabold text-amber-500 mt-0.5 block">
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
                        <stop offset="5%" stopColor={chartFill} stopOpacity={0.28}/>
                        <stop offset="95%" stopColor={chartFill} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: textColor }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: textColor }} />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#181825' : '#eff1f5',
                        borderColor: theme === 'dark' ? '#313244' : '#ccd0da',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area type="monotone" dataKey="JawabanBenar" stroke={chartFill} strokeWidth={2.5} fillOpacity={1} fill="url(#colorHomeActivity)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 3. TANTANGAN HARIAN */}
          <DailyChallengeCard
            theme={theme}
            userXP={userXP}
            startDailyChallenge={startDailyChallenge}
            setShowIosInstallModal={setShowIosInstallModal}
          />

          {/* 4. SESI TERTUNDA */}
          {pendingSessions.length > 0 && (
            <PendingSessionsCard
              theme={theme as 'light' | 'dark'}
              sessions={pendingSessions}
              onResume={resumeQuizSession}
              onDiscard={discardQuizSession}
              onDiscardAll={discardAllQuizSessions}
            />
          )}

          {/* 5. ANALISIS SUB-KOMPETENSI */}
          <HistoryAnalyticsPanel
            theme={theme as 'light' | 'dark'}
            analytics={historyAnalytics}
            expandedCompetencies={expandedCompetencies}
            onToggleExpand={(name) => setExpandedCompetencies((prev: any) => ({ ...prev, [name]: !prev[name] }))}
          />
        </div>

        {/* ======================================================================= */}
        {/* COLUMN 2 (KANAN - lg:col-span-7): RIWAYAT KUIS & LEADERBOARD CBT        */}
        {/* ======================================================================= */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5 min-w-0">
          {/* 1. RIWAYAT PERCOBAAN KUIS (STANDALONE DEDICATED CARD) */}
          <div className="p-4 sm:p-6 rounded-2xl liquid-glass-card flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap border-b border-slate-200/60 dark:border-white/10 pb-3.5">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Riwayat Percobaan Kuis
                </h3>
                {quizHistory.length > 0 && (
                  <span className="text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {quizHistory.length} Sesi
                  </span>
                )}
              </div>

              {quizHistory.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold liquid-glass-subtle-interactive text-rose-600 dark:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Kosongkan Riwayat
                </button>
              )}
            </div>

            {/* Scrollable Container (Single scroll on mobile, fixed height on desktop) */}
            <div className="max-h-none lg:max-h-[380px] lg:overflow-y-auto lg:pr-1 space-y-4">
              {quizHistory.length === 0 ? (
                <div className="text-center p-8 sm:p-10">
                  <Award className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2.5" />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Belum ada riwayat pengerjaan kuis
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[400px] mx-auto">
                    Selesaikan minimal satu kali kuis untuk mencatat riwayat skor beserta hasil analisis sub-kompetensi di sini.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Top Stats Overview */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 tabular-nums">
                    <div className="p-2.5 sm:p-3.5 rounded-xl liquid-glass-subtle text-center">
                      <div className="text-base sm:text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                        {quizHistory.length}
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        Jumlah Percobaan
                      </div>
                    </div>

                    <div className="p-2.5 sm:p-3.5 rounded-xl liquid-glass-subtle text-center">
                      <div className="text-base sm:text-xl font-extrabold text-emerald-500">
                        {Math.round(quizHistory.reduce((acc, curr) => acc + curr.score, 0) / quizHistory.length)}
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        Rata-rata Skor
                      </div>
                    </div>

                    <div className="p-2.5 sm:p-3.5 rounded-xl liquid-glass-subtle text-center">
                      <div className="text-base sm:text-xl font-extrabold text-amber-500">
                        {Math.max(...quizHistory.map((h) => h.score))}
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        Skor Tertinggi
                      </div>
                    </div>
                  </div>

                  {/* Detailed List */}
                  <div className="space-y-2 max-h-[340px] lg:max-h-[350px] overflow-y-auto pr-1">
                    {quizHistory.map((item) => {
                      const scoreColor = item.score >= 80 
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                        : item.score >= 65 
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20' 
                        : item.score >= 40 
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' 
                        : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedHistoryDetail(item);
                            setOpenHistoryReviewIndices({});
                          }}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3.5 rounded-xl liquid-glass-subtle-interactive gap-2.5 sm:gap-3 cursor-pointer group/history"
                          title="Klik untuk membuka detail soal & pembahasan"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center font-bold text-sm tabular-nums shrink-0 ${scoreColor}`}>
                              <span>{item.score}</span>
                              <span className="text-[8px] opacity-80">Skor</span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-xs truncate lg:max-w-md text-slate-900 dark:text-slate-100 group-hover/history:text-indigo-600 dark:group-hover/history:text-indigo-400 transition-colors">
                                {item.files.join(', ')}
                              </div>
                              <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap tabular-nums">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(item.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                </span>
                                <span>•</span>
                                <span>{item.total} Soal</span>
                                <span>•</span>
                                <span className="text-emerald-500 font-semibold">✔ {item.correct}</span>
                                <span className="text-rose-500 font-semibold">✘ {item.wrong}</span>
                                <span className="text-slate-400 font-semibold">∅ {item.empty}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/40 dark:border-white/5" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                              Pembahasan →
                            </span>

                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                item.mode === 'rmo'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  : item.mode === 'blok'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                              }`}>
                                {item.mode === 'rmo' ? 'RMO' : item.mode === 'blok' ? 'Ujian Blok' : item.mode === 'simulasi' ? 'Simulasi' : 'Sequential'}
                              </span>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteHistoryItem(item.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                                title="Hapus riwayat"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. LEADERBOARD CBT (STANDALONE DEDICATED CARD) */}
          <LeaderboardCard
            theme={theme}
            currentUser={currentUser}
            profileUsername={profileUsername}
            cultivatorTier={cultivatorTier}
            cultivatorGender={cultivatorGender}
            currentFrame={currentFrame}
            userBestSuddenDeath={userBestSuddenDeath}
            leaderboardType={leaderboardType}
            setLeaderboardType={setLeaderboardType}
            globalLeaderboard={globalLeaderboard}
            fileLeaderboard={fileLeaderboard}
            isLeaderboardLoading={isLeaderboardLoading}
            globalTimeFilter={globalTimeFilter}
            setGlobalTimeFilter={setGlobalTimeFilter}
            fileTimeFilter={fileTimeFilter}
            setFileTimeFilter={setFileTimeFilter}
            selectedLeaderboardFile={selectedLeaderboardFile}
            setSelectedLeaderboardFile={setSelectedLeaderboardFile}
            fetchFileLeaderboard={fetchFileLeaderboard}
            questionDatabase={questionDatabase}
            isSuperAdmin={isSuperAdmin}
            isAdminAngkatan={isAdminAngkatan}
            adminAngkatanFilter={adminAngkatanFilter}
            setAdminAngkatanFilter={setAdminAngkatanFilter}
            userAngkatan={userAngkatan}
            userProdi={userProdi}
            leaderboardScope={leaderboardScope}
            setLeaderboardScope={setLeaderboardScope}
            leaderboardProdiFilter={leaderboardProdiFilter}
            setLeaderboardProdiFilter={setLeaderboardProdiFilter}
          />
          </div>
        </div>
      </div>
  );
};
