import React from 'react';
import { Award, Trash2, Calendar, Trash, Flame, Snowflake, Clock, Check, Target, Trophy, History, Crown, Play, Share2, UploadCloud, TrendingUp, Sparkles, Activity, ShieldAlert, CalendarHeart } from 'lucide-react';
import { getLevelInfo, formatNotifTime } from '../../utils/appHelpers';
import { OnboardingTour } from '../OnboardingTour';
import PomodoroWidget from '../PomodoroWidget';
import DailyChallengeCard from '../DailyChallengeCard';
import IosInstallBanner from '../IosInstallBanner';
import QuickActionsRow from '../QuickActionsRow';
import PendingSessionsCard from '../PendingSessionsCard';
import HistoryAnalyticsPanel from '../HistoryAnalyticsPanel';
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

}

export const SetupHomeTab: React.FC<SetupHomeTabProps> = ({
  theme, userXP, currentStreak, longestStreak, streakFreezeLeft, lastActiveDate,
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
  deleteHistoryItem
}) => {
  return (
    <div className="space-y-6">
              <div className="space-y-6">
                <OnboardingTour theme={theme} onComplete={() => console.log('Tour done')} />
                {/* Greeting & Level progress card */}
                <div className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border-indigo-500/10 shadow-2xl'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-400 via-indigo-500 to-amber-400" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                    <div>
                      <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-indigo-900'}`}>
                        👋 Selamat datang, {profileUsername}!
                      </h1>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-indigo-500" />
                          <span>Level {getLevelInfo(userXP).level} • {getLevelInfo(userXP).rank}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-teal-500" />
                          <span>{userXP} XP</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span>{currentStreak} Hari Streak</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Level progress bar */}
                  <div className="mt-6">
                    <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                      <span>Progres Level</span>
                      <span>{getLevelInfo(userXP).progress}% ke Level {getLevelInfo(userXP).level + 1}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full transition-all duration-550"
                        style={{ width: `${getLevelInfo(userXP).progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <DailyChallengeCard theme={theme} onStart={startDailyChallenge} />

                <IosInstallBanner theme={theme} onInstallClick={() => setShowIosInstallModal(true)} />

                {/* Main section contents */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left panel: Quick Actions & Sesi Tertunda */}
                  <div className="lg:col-span-8 space-y-6">
                    
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

                    <PendingSessionsCard
                      theme={theme}
                      sessions={pendingSessions}
                      onResume={resumeQuizSession}
                      onDiscard={discardQuizSession}
                    />

                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    <HistoryAnalyticsPanel
                      theme={theme}
                      analytics={historyAnalytics}
                      expandedCompetencies={expandedCompetencies}
                      onToggleExpand={(name) => setExpandedCompetencies(prev => ({ ...prev, [name]: !prev[name] }))}
                    />

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
              <div className={`lg:col-span-12 p-6 rounded-2xl transition-all duration-300 border ${
                theme === 'dark'
                  ? 'bg-slate-900/45 border-white/[0.08] shadow-2xl backdrop-blur-md'
                  : 'bg-white/70 border-slate-200/60 shadow-sm backdrop-blur-md'
              }`}>
                <div className="flex items-center justify-between gap-4 mb-6 flex-wrap border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
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
                    <div className="space-y-6">
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
                              onClick={() => {
                                setSelectedHistoryDetail(item);
                                setOpenHistoryReviewIndices({});
                              }}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border gap-4 transition-all hover:translate-x-1 cursor-pointer group/history ${
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

                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-500 capitalize">
                                  {item.mode === 'simulasi' ? 'Simulasi' : 'Sequential'}
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
                  <div className="space-y-6">
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

                    {/* Time Filter Tabs */}
                    <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100/50 dark:bg-slate-800/35 border border-slate-200/40 dark:border-slate-700/20 w-max">
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
                                    const isCurrent = row.username === profileUsername;
                                    const rankNum = row.isCurrentUserOutOfTop10 ? row.actualRank : index + 1;
                                    return (
                                    <tr key={index} className={`border-b last:border-0 ${
                                      isCurrent 
                                        ? (theme === 'dark' ? 'bg-indigo-900/40 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200')
                                        : (theme === 'dark' ? 'border-slate-800/50 hover:bg-slate-800/10' : 'border-slate-200/30 hover:bg-slate-100/30')
                                    }`}>
                                      <td className="py-3.5 px-4 text-center font-bold">
                                        {rankNum === 1 ? '👑' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : rankNum}
                                      </td>
                                      <td className="py-3.5 px-4 font-extrabold flex items-center gap-2">
                                        <span className={`${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                          {row.username} {isCurrent && '(Anda)'}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[8px] bg-indigo-500/10 text-indigo-500 font-black uppercase">
                                          LV {row.level || 1}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 text-center font-extrabold text-indigo-500">
                                        {row.total_questions_answered || 0} Soal
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
                                    const isCurrent = row.username === profileUsername;
                                    const rankNum = row.isCurrentUserOutOfTop10 ? row.actualRank : index + 1;
                                    return (
                                    <tr key={index} className={`border-b last:border-0 ${
                                      isCurrent 
                                        ? (theme === 'dark' ? 'bg-indigo-900/40 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200')
                                        : (theme === 'dark' ? 'border-slate-800/50 hover:bg-slate-800/10' : 'border-slate-200/30 hover:bg-slate-100/30')
                                    }`}>
                                      <td className="py-3.5 px-4 text-center font-bold">
                                        {rankNum === 1 ? '👑' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : rankNum}
                                      </td>
                                      <td className="py-3.5 px-4 font-extrabold flex items-center gap-2">
                                        <span className={`${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                          {row.username} {isCurrent && '(Anda)'}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[8px] bg-indigo-500/10 text-indigo-500 font-black uppercase">
                                          LV {row.level || 1}
                                        </span>
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
  );
};
