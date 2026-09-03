import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as jsYaml from 'js-yaml';
import confetti from 'canvas-confetti';
import { supabase } from './supabaseClient';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { uploadQuestionsToR2, deleteQuestionsFromR2 } from './r2Storage';
import { cloudflareApi } from './services/cloudflareApi';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  Award,
  Activity,
  FileText,
  ClipboardList,
  RotateCcw,
  UploadCloud,
  Trash2,
  Sun,
  Moon,
  ChevronDown,
  Home,
  Play,
  Flame,
  HelpCircle,
  Check,
  X,
  Lock,
  Plus,
  Calendar,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronRight,
  Folder,
  FolderOpen,
  LogOut,
  User,
  Download,
  Copy,
  Bell,
  Clock,
  BarChart2,
  PlusCircle,
  Menu,
  ArrowLeft,
  Search,
  FolderPlus,
  Maximize2,
  Minimize2,
  Smartphone,
  Share2,
  Brain,
  StickyNote,
  Bookmark,
  Flag,
  Pause,
  Upload,
  Coffee,
  Save,
  MessageSquarePlus
} from 'lucide-react';

import { Question, HistoryEntry, FeatureFlags, QuestionMetadata } from './types';
import { requestAIExplanation, EXPLAIN_MODES, type ExplainMode } from './utils/aiExplain';
import { getLevelInfo, shuffleArray, shuffleQuestionOptions, formatNotifTime } from './utils/appHelpers';
import { saveHistoryToLocalStorage, loadHistoryFromLocalStorage, safeLocalStorageParse } from './utils/quizStorage';
import { SAMPLE_BANKS } from './data/sampleBanks';
// Kalimat roasting yang lucu, sarkas, dan menghibur ala mahasiswa kedokteran & umum
import {
  SCORE_FEEDBACKS,
  getFeedbackForScore,
  formatTimer,
  getCorrectLetterForQuestion,
  isUserAnswerCorrect,
  renderHtmlText,
  renderMarkdown,
  getQuestionImage,
  renderQuestionImage,
  mapUnifiedQuestion,
  parseRawFileToQuestions
} from './utils/quizUtils';
import { useQuizState } from './hooks/useQuizState';
import { useSRS } from './hooks/useSRS';
import { useToast } from './hooks/useToast';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import { useLeaderboard } from './hooks/useLeaderboard';
import { useAnswerNotes } from './hooks/useAnswerNotes';
import { SetupHomeTab } from './components/tabs/SetupHomeTab';
import { QuizScreen } from './components/screens/QuizScreen';
import { ResultScreen } from './components/screens/ResultScreen';
import { useStudyRoom } from './hooks/useStudyRoom';
import { useAchievements } from './hooks/useAchievements';
import { getIntervalLabel, generateQuestionFingerprint, type SRSCard, type QualityRating } from './utils/srsAlgorithm';
import { getRarityColor, getRarityBg, type AchievementStats } from './utils/achievements';

import { SetupReportsTab } from './components/tabs/SetupReportsTab';
import { SetupBanksTab } from './components/tabs/SetupBanksTab';
import { SetupNewQuizTab } from './components/tabs/SetupNewQuizTab';
import { SetupProfileTab } from './components/tabs/SetupProfileTab';
import { SetupSRSTab } from './components/tabs/SetupSRSTab';
import { SetupNotesTab } from './components/tabs/SetupNotesTab';

// Helper for dynamic imports with auto-reload on stale deployment chunk
const lazyWithRetry = <T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) =>
  React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.warn('Dynamic import failed, reloading page for latest version...', error);
      window.location.reload();
      throw error;
    }
  });

// Lazy loaded heavy external components
const DashboardCharts = lazyWithRetry(() => import('./components/DashboardCharts').then(m => ({ default: m.DashboardCharts })));
const MabarMain = lazyWithRetry(() => import("./components/mabar/MabarMain"));
import LightboxModal from './components/LightboxModal';
import IosInstallModal from './components/IosInstallModal';
import SkeletonLoader from './components/SkeletonLoader';
import ConfirmModal from './components/ConfirmModal';
import BottomNav from './components/BottomNav';
import PomodoroWidget from './components/PomodoroWidget';
import NotificationDropdown from './components/NotificationDropdown';
import SidebarNav from './components/SidebarNav';
import LoginForm from './components/LoginForm';
import PasteJsonModal from './components/PasteJsonModal';
import NoteEditorModal from './components/NoteEditorModal';
import ReportQuestionModal from './components/ReportQuestionModal';
import MoveQuizModal from './components/MoveQuizModal';
import AnswerNotePopup from './components/AnswerNotePopup';
import AchievementPopup from './components/AchievementPopup';
import QuizHeader from './components/QuizHeader';
import KeyboardHintPanel from './components/KeyboardHintPanel';
import MobileQuizNavDrawer from './components/MobileQuizNavDrawer';
import MobileBottomActionBar from './components/MobileBottomActionBar';
import DailyChallengeCard from './components/DailyChallengeCard';
import IosInstallBanner from './components/IosInstallBanner';
import QuickActionsRow from './components/QuickActionsRow';
import SearchFilterHeader from './components/SearchFilterHeader';
import UploadZone from './components/UploadZone';
import FormatGuide from './components/FormatGuide';
import PendingSessionsCard from './components/PendingSessionsCard';
import HistoryAnalyticsPanel from './components/HistoryAnalyticsPanel';

export default function App() {
  // === STATE MANAGEMENT ===
  
  // AI Tutor States
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiFollowUp, setAiFollowUp] = useState('');
  const [aiMode, setAiMode] = useState<ExplainMode>('explain');

  // === React states ===
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('cbt_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });


  const [userXP, setUserXP] = useState(0);
  const [currentCombo, setCurrentCombo] = useState(0); // in-quiz consecutive correct answers
  const [currentStreak, setCurrentStreak] = useState(0); // daily learning streak
  const [longestStreak, setLongestStreak] = useState(0);
  const [streakFreezeLeft, setStreakFreezeLeft] = useState(1);
  const [lastActiveDate, setLastActiveDate] = useState<string | null>(null);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  const [xpHistory, setXpHistory] = useState<number[]>([0]);

  // Sync XP and Streak back to Supabase profiles when changed
  const { toastMessage, triggerToast } = useToast();
  const [guestRoomCode, setGuestRoomCode] = useState('');
  
  const handleGuestJoin = async (nickname: string, roomCode: string) => {
    const cleanNick = (nickname || '').trim();
    const cleanCode = (roomCode || '').trim().toUpperCase();

    if (!cleanNick || !cleanCode) {
      triggerToast('Nama dan Kode Room wajib diisi!', '⚠️');
      return;
    }
    
    triggerToast('Masuk sebagai tamu...', '⏳');

    // Use anonymous sign-in — signUp with fake email fails because
    // Supabase requires email confirmation, so no session is created.
    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        data: { username: cleanNick, is_guest: true }
      }
    });
    
    if (error) {
      triggerToast('Gagal masuk guest: ' + error.message, '❌');
      return;
    }

    const user = data?.user;
    if (!user) {
      triggerToast('Gagal membuat sesi tamu.', '❌');
      return;
    }

    // Set user immediately so the dashboard renders
    setCurrentUser(user);
    setGuestRoomCode(cleanCode);
    setDashboardTab('mabar');
    triggerToast(`Selamat datang ${cleanNick}! Masuk ke room...`, '✅');
  };
  const [selectedDatabases, setSelectedDatabases] = useState<string[]>([]);
  const [pendingSessions, setPendingSessions] = useState<any[]>([]);
  const [globalCustomFolders, setGlobalCustomFolders] = useState<string[]>([]);
  const [globalQuizFolderMap, setGlobalQuizFolderMap] = useState<Record<string, string>>({});
  const {
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
    fetchGlobalLeaderboard: () => fetchGlobalLeaderboard(),
    setSelectedDatabases,
    setPendingSessions,
    setGlobalCustomFolders,
    setGlobalQuizFolderMap,
  });

// removed auth state
// removed auth state
// removed auth state
// removed auth state
// removed auth state
// removed auth state
// removed auth state
// removed auth state
// removed auth state
// removed auth state
// removed auth state
// removed auth state
// removed auth state
// removed auth state
// removed auth state
// removed for TDZ
  const [questionLimits, setQuestionLimits] = useState<Record<string, number>>({});
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [quizMode, setQuizMode] = useState<'utuh' | 'simulasi'>('utuh');
  const [customFolders, setCustomFolders] = useState<string[]>(() =>
    safeLocalStorageParse<string[]>('cbt_custom_folders', [], Array.isArray)
  );
  const [quizFolderMap, setQuizFolderMap] = useState<Record<string, string>>(() =>
    safeLocalStorageParse<Record<string, string>>('cbt_quiz_folder_map', {}, (v) => !!v && typeof v === 'object' && !Array.isArray(v))
  );
  
// removed for TDZ
  const [moveQuizModal, setMoveQuizModal] = useState<{ quizKey: string; quizName: string } | null>(null);

// removed for TDZ
  const [quizHistory, setQuizHistory] = useState<HistoryEntry[]>(() => loadHistoryFromLocalStorage());
  const [selectedHistoryDetail, setSelectedHistoryDetail] = useState<HistoryEntry | null>(null);
  const [openHistoryReviewIndices, setOpenHistoryReviewIndices] = useState<Record<number, boolean>>({});

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const folderScrollRef = useRef<HTMLDivElement>(null);

  // Auto Fullscreen on Desktop upon first user interaction (click)
  useEffect(() => {
    const handleFirstClick = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.log("Auto-fullscreen request failed/blocked: ", err);
        });
      }
      window.removeEventListener('click', handleFirstClick);
    };

    window.addEventListener('click', handleFirstClick);
    return () => {
      window.removeEventListener('click', handleFirstClick);
    };
  }, []);
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Leaderboard and saved sessions states
// removed for TDZ
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteFileName, setPasteFileName] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [pasteError, setPasteError] = useState('');
  const activeQuizSessionIdRef = useRef<string | null>(null);
  const hasRecordedLeaderboard = useRef(false);
// extracted leaderboard state
// extracted leaderboard state
// extracted leaderboard state
// extracted leaderboard state
  const {
    globalLeaderboard, fileLeaderboard, isLeaderboardLoading, hasSubmittedLeaderboard,
    lastQuizScore, globalTimeFilter, fileTimeFilter, leaderboardType, selectedLeaderboardFile, activeDashboardTab,
    setIsLeaderboardLoading, setHasSubmittedLeaderboard, setLastQuizScore, setGlobalTimeFilter, setFileTimeFilter,
    setLeaderboardType, setSelectedLeaderboardFile, setActiveDashboardTab,
    fetchGlobalLeaderboard, fetchFileLeaderboard, recordQuizToLeaderboard
  } = useLeaderboard(currentUser, profileUsername, triggerToast);
// extracted leaderboard state
// extracted leaderboard state
// extracted leaderboard state
// extracted leaderboard state
// extracted leaderboard state
// extracted leaderboard state

  // === CATATAN SOAL ===
// extracted answerNotes state
// moved useAnswerNotes
// moved useAnswerNotes
// moved useAnswerNotes
// moved useAnswerNotes
// moved useAnswerNotes
// extracted answerNotes state
// extracted answerNotes state
// extracted answerNotes state
// extracted answerNotes state

  // Overhaul Tab States
  const [dashboardTab, setDashboardTab] = useState<'home' | 'banks' | 'new' | 'srs' | 'notes' | 'analysis' | 'profile' | 'reports' | 'mabar'>('home');
  const [adminReports, setAdminReports] = useState<any[]>([]);

  useEffect(() => {
    if (dashboardTab === 'reports' && (currentUser?.user_metadata?.username === 'admin' || currentUser?.user_metadata?.username === 'collector')) {
      const fetchReports = async () => {
        const { data, error } = await supabase
          .from('question_reports')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setAdminReports(data);
        }
      };
      fetchReports();
    }
  }, [dashboardTab, currentUser]);

  // Reset swipe hint setiap kali buka tab Bank Soal
  useEffect(() => {
    if (dashboardTab === 'banks') {
      setShowSwipeHint(true);
    }
  }, [dashboardTab]);
  const [mobileQuizNavOpen, setMobileQuizNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bankFilter, setBankFilter] = useState<'all' | 'ukmppd' | 'flashcard' | 'custom'>('all');
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'quiz' | 'streak' | 'mastery'>('all');
  const [expandedCompetencies, setExpandedCompetencies] = useState<Record<string, boolean>>({});
  
  // Note Editor State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [noteRefQuestion, setNoteRefQuestion] = useState<any>(null);

  // Active quiz states
  const {
    screen, setScreen,
    currentQuiz, setCurrentQuiz,
    currentIndex, setCurrentIndex,
    userAnswers, setUserAnswers,
    doubtStatus, setDoubtStatus,
    isRevealed, setIsRevealed,
    unlockedHints, setUnlockedHints,
    showSidebar, setShowSidebar,
    quizSecondsLeft, setQuizSecondsLeft,
    quizTimerActive, setQuizTimerActive,
    isDailyChallenge, setIsDailyChallenge,
    keyboardNavEnabled, setKeyboardNavEnabled,
    isAdaptiveMode, setIsAdaptiveMode,
    adaptiveHistory, setAdaptiveHistory,
    currentDifficulty, setCurrentDifficulty,
    adaptiveQuestionPool, setAdaptiveQuestionPool
  } = useQuizState();
  const {
    answerNotes, notePopupOpen, noteInput, noteSaving,
    setAnswerNotes, setNotePopupOpen, setNoteInput, setNoteSaving,
    fetchAnswerNotes, saveAnswerNote, deleteAnswerNote, openNotePopup
  } = useAnswerNotes(currentUser, triggerToast, screen, currentQuiz, userAnswers);

  const srs = useSRS(currentUser?.id || null);
  const [srsAnswerRevealed, setSrsAnswerRevealed] = useState(false);
  const [srsPendingRating, setSrsPendingRating] = useState<QualityRating | null>(null);

  useEffect(() => {
    setSrsAnswerRevealed(false);
    setSrsPendingRating(null);
  }, [srs.currentReviewIndex, srs.isReviewing]);
  const studyRoom = useStudyRoom(currentUser?.id || null);
  const achievements = useAchievements(currentUser?.id || null, (xpReward) => {
    setUserXP(prev => prev + xpReward);
    triggerToast(`Selamat! +${xpReward} XP dari Achievement!`, '🏆');
  });
  // PWA iOS Install Prompt effect
  useEffect(() => {
    const isIos = /ipad|iphone|ipod/.test(navigator.userAgent.toLowerCase()) && !(window as any).MSStream;
    const isStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    const hasSeenPrompt = localStorage.getItem('cbt_ios_prompt_seen');
    if (isIos && !isStandalone && !hasSeenPrompt) {
      setShowIosInstallModal(true);
      localStorage.setItem('cbt_ios_prompt_seen', 'true');
    }
  }, []);

  // Active quiz timer effect
  useEffect(() => {
    if (!quizTimerActive || screen !== 'quiz') return;

    const interval = setInterval(() => {
      setQuizSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0; // Hanya update state, jangan panggil fungsi lain
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quizTimerActive, screen]);

  // Handle timeout
  useEffect(() => {
    if (quizSecondsLeft === 0 && quizTimerActive && screen === 'quiz') {
      setQuizTimerActive(false);
      finishQuiz();
      triggerToast('Waktu Ujian Telah Habis!', '⏰');
    }
  }, [quizSecondsLeft, quizTimerActive, screen]);
  
// removed gState
// removed gState
// removed gState
// removed gState
// removed gState
// removed gState
// removed gState
// removed gState
// removed gState
// removed gState
  useEffect(() => {
    if (!currentUser || authLoading || !isProfileSyncedRef.current) return;
    
    const updateProfile = async () => {
      try {
        const currentLevel = Math.min(100, Math.floor(0.5 + 0.5 * Math.sqrt(1 + userXP / 12.5))) || 1;
        await supabase
          .from('profiles')
          .update({
            xp: userXP,
            level: currentLevel,
            streak: currentStreak, // legacy
            current_streak: currentStreak,
            longest_streak: longestStreak,
            streak_freeze_left: streakFreezeLeft,
            last_active_date: lastActiveDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentUser.id);
      } catch (err) {
        console.error('Gagal sinkronisasi data gamifikasi ke cloud:', err);
      }
    };
    
    updateProfile();
  }, [userXP, currentStreak, longestStreak, streakFreezeLeft, lastActiveDate, currentUser, authLoading]);

  // Floating text / XP notification
  const [floatingXP, setFloatingXP] = useState<{ id: number; text: string; isBenar: boolean; x: number; y: number } | null>(null);

  // === NOTIFIKASI ===
// moved useToast
// extracted notifOpen
  const {
    notifOpen, notifList, notifCount, pushEnabled,
    setNotifOpen, requestPushPermission, fetchNotifications, markAllNotifRead,
    showBrowserNotification
  } = useNotifications(currentUser, srs, triggerToast);
// extracted notifList
// extracted notifCount
// extracted pushEnabled

  // Show browser Notification (appears on device lock screen / notification center)

  // Request push notification permission

  // Modal confirm states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalAction, setModalAction] = useState<(() => void) | null>(null);

  // Accordion review states
  const [openReviewIndices, setOpenReviewIndices] = useState<Record<number, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [reportModal, setReportModal] = useState<{ isOpen: boolean; questionIndex: number | null }>({ isOpen: false, questionIndex: null });
  const [reportIssueType, setReportIssueType] = useState<string>('Jawaban Salah');
  const [reportDescription, setReportDescription] = useState<string>('');
  
  const shareResult = async () => {
    const total = currentQuiz.length;
    const correct = userAnswers.filter((a, i) => isUserAnswerCorrect(a, currentQuiz[i])).length;
    const levelInfo = getLevelInfo(userXP);
    const text = `🩺 AuraMedPro Quiz Result\n${'━'.repeat(24)}\n📊 Skor: ${lastQuizScore}% (${correct}/${total})\n📚 Topik: ${selectedDatabases.map(d => d.replace(/\.(json|yaml|yml)$/i, '')).join(', ')}\n🔥 Streak: ${currentStreak} Hari\n⚡ Level ${levelInfo.level} — ${levelInfo.rank}\n${'━'.repeat(24)}\n🔥 Ayo belajar di AuraMedPro!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'AuraMedPro Result', text });
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return;
      }
    }
    
    await navigator.clipboard.writeText(text);
    triggerToast('Hasil kuis disalin ke clipboard!', '📋');
  };

  // === Pomodoro Timer State ===
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = useState(25 * 60);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'break'>('focus');
  const [pomodoroCount, setPomodoroCount] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (pomodoroActive && pomodoroSecondsLeft > 0) {
      interval = setInterval(() => {
        setPomodoroSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (pomodoroActive && pomodoroSecondsLeft === 0) {
      setPomodoroActive(false);
      const isFocus = pomodoroMode === 'focus';
      if (isFocus) setPomodoroCount(c => c + 1);
      
      triggerToast(isFocus ? 'Sesi fokus selesai! Waktunya istirahat.' : 'Waktu istirahat selesai! Mari fokus lagi.', isFocus ? '☕' : '🧠');
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(isFocus ? 'AuraMedPro: Fokus Selesai' : 'AuraMedPro: Istirahat Selesai', {
          body: isFocus ? 'Bagus! Waktunya istirahat sejenak 5 menit.' : 'Waktu istirahat selesai. Ayo lanjut belajar!'
        });
      }
      
      setPomodoroMode(isFocus ? 'break' : 'focus');
      setPomodoroSecondsLeft(isFocus ? 5 * 60 : 25 * 60);
    }
    return () => clearInterval(interval);
  }, [pomodoroActive, pomodoroSecondsLeft, pomodoroMode]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);


  const submitReport = async () => {
    if (reportModal.questionIndex === null || !currentUser) return;
    const q = currentQuiz[reportModal.questionIndex];
    
    try {
      cloudflareApi.reportQuestion({
        user_id: currentUser.id,
        question_id: selectedDatabases[0] || 'Kuis',
        reason: reportIssueType,
        details: reportDescription,
      }).catch(() => {});

      const { error } = await supabase.from('question_reports').insert([{
        user_id: currentUser.id,
        question_bank_name: selectedDatabases[0] || 'Kuis',
        question_text: q.question,
        issue_type: reportIssueType,
        description: reportDescription
      }]);

      if (error) throw error;
      triggerToast('Laporan berhasil dikirim. Terima kasih!', '🚩');
    } catch (e: any) {
      console.error(e);
      triggerToast('Gagal mengirim laporan', '❌');
    } finally {
      setReportModal({ isOpen: false, questionIndex: null });
      setReportIssueType('Jawaban Salah');
      setReportDescription('');
    }
  };

  const handleAIRequest = async (mode: ExplainMode) => {
    setAiMode(mode);
    setAiLoading(true);
    setAiPanelOpen(true);
    
    const q = currentQuiz[currentIndex];
    const correctLetter = getCorrectLetterForQuestion(q);
    const correctOptionText = q.pilihan ? q.pilihan[['A', 'B', 'C', 'D', 'E'].indexOf(correctLetter)] : q.jawaban_benar;
    const userAnswerLetter = userAnswers[currentIndex];
    const userAnswerText = userAnswerLetter && q.pilihan ? q.pilihan[['A', 'B', 'C', 'D', 'E'].indexOf(userAnswerLetter)] : userAnswerLetter || undefined;
    
    try {
      const resp = await requestAIExplanation({
        question: q.pertanyaan,
        correctAnswer: correctOptionText || q.jawaban_benar,
        explanation: q.pembahasan,
        userAnswer: userAnswerText,
        context: q.metadata?.sub_kompetensi_klinis,
        mode,
        followUp: mode === 'clarify' ? aiFollowUp : undefined
      });
      setAiExplanation(resp);
      if (mode === 'clarify') setAiFollowUp('');
    } catch (e: any) {
      triggerToast(e.message || 'Gagal menghubungi AI Tutor', '❌');
    } finally {
      setAiLoading(false);
    }
  };

  const exportData = () => {
    const data = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      quiz_history: quizHistory,
      srs_cards: srs.cards,
      study_notes: studyRoom.notes,
      bookmarks: studyRoom.bookmarks
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auramedpro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Data berhasil diexport!', '💾');
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const data = JSON.parse(text);
        if (data.version !== '1.0') throw new Error('Format tidak didukung');
        
        // Merge logic for local storage
        if (data.quiz_history) {
          const merged = [...quizHistory, ...data.quiz_history];
          localStorage.setItem('cbt_quiz_history', JSON.stringify(merged));
        }
        if (data.srs_cards) {
          localStorage.setItem('cbt_srs_cards', JSON.stringify([...srs.cards, ...data.srs_cards]));
        }
        if (data.study_notes) {
          localStorage.setItem('cbt_study_notes', JSON.stringify([...studyRoom.notes, ...data.study_notes]));
        }
        if (data.bookmarks) {
          localStorage.setItem('cbt_bookmarks', JSON.stringify([...studyRoom.bookmarks, ...data.bookmarks]));
        }
        
        triggerToast('Data berhasil diimport! Memuat ulang...', '✅');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        triggerToast('Gagal mengimport data', '❌');
      }
    };
    reader.readAsText(file);
  };




  // Group question databases by folder
  const groupedDatabases = React.useMemo(() => {
    const folders: Record<string, { key: string; displayName: string; questions: Question[] }[]> = {};
    const rootItems: { key: string; displayName: string; questions: Question[] }[] = [];

    // Pre-populate custom folders (Global and Local)
    [...globalCustomFolders, ...customFolders].forEach(folder => {
      if (!folders[folder]) folders[folder] = [];
    });

    Object.entries(questionDatabase).forEach(([key, questionsData]) => {
      const questions = questionsData as Question[];
      
      // Prioritize: Local Map -> Global Map -> None
      let folderPath = quizFolderMap[key] !== undefined ? quizFolderMap[key] : globalQuizFolderMap[key];
      let displayName = key;

      if (!folderPath && key.includes('/')) {
        const parts = key.split('/');
        folderPath = parts.slice(0, -1).join('/');
        displayName = parts[parts.length - 1];
      } else if (folderPath && folderPath !== 'root') {
        // If mapped to a custom folder, extract the real display name (remove old path if any)
        if (key.includes('/')) {
          displayName = key.split('/').pop() || key;
        } else {
          displayName = key;
        }
      }

      // If folderPath is explicitly 'root', we clear it so it goes to rootItems
      if (folderPath === 'root') {
        folderPath = undefined;
        if (key.includes('/')) {
          displayName = key.split('/').pop() || key;
        }
      }

      displayName = displayName.replace(/\.(json|yaml|yml)$/i, '');

      if (folderPath) {
        if (!folders[folderPath]) {
          folders[folderPath] = [];
        }
        folders[folderPath].push({ key, displayName, questions });
      } else {
        rootItems.push({ key, displayName, questions });
      }
    });

    return { folders, rootItems };
  }, [questionDatabase, customFolders, quizFolderMap, globalCustomFolders, globalQuizFolderMap]);

  // Filtered databases memo based on search query and category filter
  const filteredDatabases = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    const matchFilter = (key: string) => {
      if (bankFilter === 'all') return true;
      if (bankFilter === 'ukmppd') return key.toLowerCase().includes('ukmppd');
      if (bankFilter === 'flashcard') return key.toLowerCase().includes('flashcard') || key.toLowerCase().includes('isian') || key.toLowerCase().includes('kombinasi') || key.toLowerCase().includes('card');
      if (bankFilter === 'custom') return !key.toLowerCase().includes('ukmppd') && !key.toLowerCase().includes('flashcard') && !key.toLowerCase().includes('isian') && !key.toLowerCase().includes('kombinasi') && !key.toLowerCase().includes('card');
      return true;
    };

    const folders: Record<string, { key: string; displayName: string; questions: Question[] }[]> = {};
    const rootItems: { key: string; displayName: string; questions: Question[] }[] = [];

    Object.entries(groupedDatabases.folders).forEach(([folderPath, files]) => {
      const filteredFiles = (files as { key: string; displayName: string; questions: Question[] }[]).filter(f => f.displayName.toLowerCase().includes(q) && matchFilter(f.key));
      // Include empty folders only if not searching
      if (filteredFiles.length > 0 || (q === '' && bankFilter === 'all')) {
        folders[folderPath] = filteredFiles;
      }
    });

    groupedDatabases.rootItems.forEach(item => {
      if (item.displayName.toLowerCase().includes(q) && matchFilter(item.key)) {
        rootItems.push(item);
      }
    });

    return { folders, rootItems };
  }, [groupedDatabases, searchQuery, bankFilter]);

  // Apply theme class to document
  useEffect(() => {
    localStorage.setItem('cbt_theme', theme);
  }, [theme]);

  // Save custom folders to local storage
  useEffect(() => {
    localStorage.setItem('cbt_custom_folders', JSON.stringify(customFolders));
  }, [customFolders]);

  // Save quiz folder mapping to local storage
  useEffect(() => {
    localStorage.setItem('cbt_quiz_folder_map', JSON.stringify(quizFolderMap));
  }, [quizFolderMap]);

  // Save history helper
  
  // === FETCH NOTIFIKASI ===
  



  // Fetch notifikasi saat user login + refresh berkala

  // Helper to show custom dynamic toast

  // Trigger floating XP indicator
  const triggerFloatingXP = (text: string, isBenar: boolean, event?: React.MouseEvent<HTMLButtonElement>) => {
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 3;
    if (event?.currentTarget) {
      try {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 40;
        y = rect.top - 15;
      } catch {}
    }
    setFloatingXP({ id: Date.now(), text, isBenar, x, y });
    setTimeout(() => setFloatingXP(null), 1500);
  };

  // === AUTHENTICATION METHODS ===



  const resumeQuizSession = (session: any) => {
    try {
      const pool = typeof session.current_quiz_json === 'string'
        ? JSON.parse(session.current_quiz_json)
        : session.current_quiz_json;
      const answers = typeof session.user_answers_json === 'string'
        ? JSON.parse(session.user_answers_json)
        : session.user_answers_json;
      const doubt = typeof session.doubt_status_json === 'string'
        ? JSON.parse(session.doubt_status_json)
        : session.doubt_status_json;
      const revealed = typeof session.is_revealed_json === 'string'
        ? JSON.parse(session.is_revealed_json)
        : session.is_revealed_json;
      const hints = typeof session.unlocked_hints_json === 'string'
        ? JSON.parse(session.unlocked_hints_json)
        : session.unlocked_hints_json;
      const selectedDbs = typeof session.selected_databases === 'string'
        ? JSON.parse(session.selected_databases)
        : session.selected_databases;

      activeQuizSessionIdRef.current = session.id;

      setCurrentQuiz(pool);
      setUserAnswers(answers);
      setDoubtStatus(doubt);
      setIsRevealed(revealed);
      setUnlockedHints(hints);
      setCurrentIndex(session.current_index);
      setSelectedDatabases(selectedDbs || []);
      setQuizMode(session.quiz_mode);

      hasRecordedLeaderboard.current = false;
      setScreen('quiz');
      setShowSidebar(true);
      setQuizSecondsLeft(session.seconds_left !== undefined ? session.seconds_left : pool.length * 60);
      setQuizTimerActive(true);
      triggerToast(`Melanjutkan kuis: ${session.title}!`, '🚀');
    } catch (err) {
      console.error('Error parsing session data:', err);
      triggerToast('Gagal memuat sesi kuis tertunda', '❌');
    }
  };

  const discardQuizSession = async (sessionId: string) => {
    if (!currentUser) return;
    setModalTitle('Hapus Sesi Tertunda?');
    setModalDesc('Sesi kuis ini akan dihapus secara permanen. Apakah Anda yakin?');
    setModalAction(() => async () => {
      try {
        let localList: any[] = [];
        try {
          const saved = localStorage.getItem('cbt_active_sessions');
          if (saved) localList = JSON.parse(saved);
        } catch (e) {}

        const updatedList = localList.filter(s => s.id !== sessionId);
        try { localStorage.setItem('cbt_active_sessions', JSON.stringify(updatedList)); } catch(e) { console.warn('localStorage full'); }
        setPendingSessions(updatedList);

        if (updatedList.length > 0) {
          await supabase
            .from('quiz_sessions')
            .upsert({
              user_id: currentUser.id,
              current_quiz_json: { is_multi_session: true, sessions: updatedList },
              updated_at: new Date().toISOString()
            });
        } else {
          await supabase
            .from('quiz_sessions')
            .delete()
            .eq('user_id', currentUser.id);
        }
        
        triggerToast('Sesi kuis tertunda dihapus.', '🗑');
      } catch (err) {
        console.error(err);
        triggerToast('Gagal menghapus sesi tertunda', '❌');
      }
    });
    setModalOpen(true);
  };



  const submitScoreToLeaderboard = async () => {
    if (!currentUser || selectedDatabases.length === 0) return;
    try {
      setIsLeaderboardLoading(true);
      const dbName = selectedDatabases[0];
      const { error } = await supabase
        .from('leaderboard')
        .upsert({
          user_id: currentUser.id,
          file_name: dbName,
          score: lastQuizScore,
          questions_count: currentQuiz.length,
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id,file_name' });

      if (error) throw error;
      setHasSubmittedLeaderboard(true);
      triggerToast('Skor Anda berhasil diunggah ke leaderboard!', '🏆');
      await fetchFileLeaderboard(dbName);
    } catch (err) {
      console.error(err);
      triggerToast('Gagal mengunggah skor ke leaderboard', '❌');
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  // === RECORD QUIZ RESULTS TO LEADERBOARD ===

  // Auto-record ke leaderboard saat kuis selesai (batch submit)
  useEffect(() => {
    const isQuizDone = screen === 'result';
    const hasQuestions = currentQuiz && currentQuiz.length > 0;
    const hasAnswers = userAnswers && userAnswers.length > 0;

    if (isQuizDone && hasQuestions && hasAnswers && !hasRecordedLeaderboard.current && currentUser) {
      hasRecordedLeaderboard.current = true;

      // Hitung jumlah jawaban benar
      let correctCount = 0;
      currentQuiz.forEach((q: Question, i: number) => {
        if (i < userAnswers.length) {
          const userAns = userAnswers[i];
          if (isUserAnswerCorrect(userAns, q)) {
            correctCount++;
          }
        }
      });

      if (correctCount > 0) {
        let quizName = 'Kuis';
        if (selectedDatabases && selectedDatabases.length > 0) {
          quizName = selectedDatabases.length === 1 ? selectedDatabases[0] : selectedDatabases.join(', ');
        }

        console.log(`[Leaderboard] Recording: ${correctCount}/${currentQuiz.length} correct for ${quizName}`);
        recordQuizToLeaderboard(quizName, correctCount, currentQuiz.length);
      }
    }
  }, [screen, currentQuiz, userAnswers, currentUser, selectedDatabases, recordQuizToLeaderboard]);

  // Debounced auto-save effect
  useEffect(() => {
    if (screen !== 'quiz' || !currentUser || currentQuiz.length === 0) return;

    const timer = setTimeout(async () => {
      if (!activeQuizSessionIdRef.current) return; // Prevent auto-save if quiz is already finished

      try {
        const activeId = activeQuizSessionIdRef.current;

        const title = selectedDatabases.map(db => db.replace('.json', '').replace('.yaml', '')).join(', ') || 'Kuis Kustom';
        const currentSession = {
          id: activeId,
          title,
          current_quiz_json: currentQuiz,
          current_index: currentIndex,
          user_answers_json: userAnswers,
          doubt_status_json: doubtStatus,
          is_revealed_json: isRevealed,
          unlocked_hints_json: unlockedHints,
          selected_databases: selectedDatabases,
          quiz_mode: quizMode,
          seconds_left: quizSecondsLeft,
          updated_at: new Date().toISOString()
        };

        let localList: any[] = [];
        try {
          const saved = localStorage.getItem('cbt_active_sessions');
          if (saved) localList = JSON.parse(saved);
        } catch (e) {}

        const idx = localList.findIndex(s => s.id === activeId);
        if (idx !== -1) {
          localList[idx] = currentSession;
        } else {
          localList.unshift(currentSession);
        }

        try { localStorage.setItem('cbt_active_sessions', JSON.stringify(localList)); } catch(e) { console.warn('localStorage full'); }
        setPendingSessions(localList);

        // 1. Simpan ke Cloudflare D1 (0 Egress!)
        cloudflareApi.saveQuizSession(currentUser.id, { is_multi_session: true, sessions: localList }).catch(() => {});

        // 2. Fallback Supabase
        await supabase
          .from('quiz_sessions')
          .upsert({
            user_id: currentUser.id,
            current_quiz_json: { is_multi_session: true, sessions: localList },
            updated_at: new Date().toISOString()
          });
      } catch (err) {
        console.error('Gagal menyimpan sesi kuis otomatis:', err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [screen, currentQuiz, currentIndex, userAnswers, doubtStatus, isRevealed, unlockedHints, selectedDatabases, quizMode, currentUser]);

  useEffect(() => {
    if (selectedLeaderboardFile && activeDashboardTab === 'leaderboard' && leaderboardType === 'file') {
      fetchFileLeaderboard(selectedLeaderboardFile);
    }
  }, [selectedLeaderboardFile, activeDashboardTab, fileTimeFilter, leaderboardType]);

  useEffect(() => {
    if (activeDashboardTab === 'leaderboard' && leaderboardType === 'global') {
      fetchGlobalLeaderboard();
    }
  }, [activeDashboardTab, leaderboardType, globalTimeFilter, profileUsername]);



  // === CATATAN SOAL FUNCTIONS ===
  // Uses fingerprint hash as question_text value to avoid PostgreSQL 2700-byte index limit on raw HTML.
  // Backward-compat: old rows with raw HTML are re-keyed via fingerprint at fetch time.





  useEffect(() => {
    if (currentUser) {
      fetchAnswerNotes();
    } else {
      setAnswerNotes({});
    }
  }, [currentUser, fetchAnswerNotes]);

  // Auto-show note popup for first wrong answer without note when reviewing results


  // Auth Listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener
// extracted auth listener

  // Periodic active session checking
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session
// extracted periodic session

  // Auth Submit Handler

  const handleCreateFolder = async () => {
    const folderName = window.prompt("Masukkan nama folder baru:");
    if (folderName && folderName.trim() !== "") {
      const name = folderName.trim();
      const isAdmin = profileUsername === 'collector' || profileUsername === 'admin';
      
      let isGlobal = false;
      if (isAdmin) {
        isGlobal = window.confirm("Jadikan folder ini global (terlihat untuk semua pengguna)?\nBatal (Cancel) untuk folder personal.");
      }

      if (isGlobal) {
        if (!globalCustomFolders.includes(name)) {
          const newGlobal = [...globalCustomFolders, name];
          setGlobalCustomFolders(newGlobal);
          try {
            cloudflareApi.saveAppSettings('customFolders', newGlobal).catch(() => {});
            await supabase.from('app_settings').upsert({ key: 'customFolders', value: newGlobal });
            triggerToast(`Folder global "${name}" berhasil dibuat!`, '🌍');
          } catch (e) {
            triggerToast(`Gagal menyimpan ke server`, '❌');
          }
        } else {
          triggerToast(`Folder "${name}" sudah ada.`, '⚠️');
        }
      } else {
        if (!customFolders.includes(name)) {
          setCustomFolders(prev => [...prev, name]);
          triggerToast(`Folder "${name}" berhasil dibuat secara personal!`, '📁');
        } else {
          triggerToast(`Folder "${name}" sudah ada.`, '⚠️');
        }
      }
    }
  };

  const handleMoveQuiz = async (quizKey: string, targetFolder: string) => {
    const isAdmin = profileUsername === 'collector' || profileUsername === 'admin';
    if (isAdmin) {
      const newMap = { ...globalQuizFolderMap };
      if (targetFolder === 'root') {
        delete newMap[quizKey];
        triggerToast(`Kuis dipindahkan ke file lepas secara Global`, '🌍');
      } else {
        newMap[quizKey] = targetFolder;
        triggerToast(`Kuis dipindahkan ke folder "${targetFolder}" secara Global`, '🌍');
      }
      setGlobalQuizFolderMap(newMap);
      
      // Hapus dari personal map agar global terpancar
      setQuizFolderMap(prev => {
        const pMap = { ...prev };
        delete pMap[quizKey];
        return pMap;
      });

      try {
        cloudflareApi.saveAppSettings('quizFolderMap', newMap).catch(() => {});
        await supabase.from('app_settings').upsert({ key: 'quizFolderMap', value: newMap });
      } catch (e) {
        console.error(e);
      }
    } else {
      setQuizFolderMap(prev => {
        const newMap = { ...prev };
        if (targetFolder === 'root') {
          // Khusus non-admin, target 'root' akan kita anggap paksa override agar lepas
          newMap[quizKey] = 'root';
          triggerToast(`Kuis dikembalikan ke file lepas`, '📦');
        } else {
          newMap[quizKey] = targetFolder;
          triggerToast(`Kuis dipindahkan ke folder "${targetFolder}"`, '📂');
        }
        return newMap;
      });
    }
  };

  const handleResetPersonal = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua susunan folder personal Anda dan kembali ke susunan Global/Admin?")) {
      setCustomFolders([]);
      setQuizFolderMap({});
      triggerToast("Susunan folder personal direset", "♻️");
    }
  };

  // === DATABASE METHODS ===
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    reader.onload = (event) => {
      const raw = event.target?.result as string;
      if (ext !== 'json' && ext !== 'yaml' && ext !== 'yml') {
        triggerToast('Hanya mendukung format .json, .yaml, atau .yml', '❌');
        return;
      }

      const finalQuestions = parseRawFileToQuestions(raw, ext);
      if (finalQuestions && finalQuestions.length > 0) {
        // Simpan ke database Supabase
        (async () => {
          try {
            // 1. Upload ke Cloudflare R2 (0 Egress)
            const r2Res = await uploadQuestionsToR2(file.name, finalQuestions);

            // 2. Simpan metadata ke Cloudflare D1
            if (r2Res) {
              await cloudflareApi.saveQuestionBank({
                name: file.name,
                user_id: currentUser.id,
                r2_key: r2Res.r2_key,
                r2_url: r2Res.r2_url,
              });
            } else {
              await cloudflareApi.saveQuestionBank({
                name: file.name,
                user_id: currentUser.id,
                questions_json: finalQuestions,
              });
            }

            // 3. Simpan ke Supabase hanya referensi R2 agar tidak boros egress!
            const supaPayload = r2Res 
              ? { r2_key: r2Res.r2_key, r2_url: r2Res.r2_url } 
              : finalQuestions;

            const { error } = await supabase
              .from('question_banks')
              .upsert({ user_id: currentUser.id, name: file.name, questions_json: supaPayload }, { onConflict: 'user_id,name' });
            if (error) throw error;
            const updated = { ...questionDatabase, [file.name]: finalQuestions };
            setQuestionDatabase(updated);
            // Data disimpan di Supabase, tidak perlu localStorage
            setSelectedDatabases((prev) => [...new Set([...prev, file.name])]);
            triggerToast(`Berhasil memuat ${finalQuestions.length} soal dari "${file.name}"`, '✅');
          } catch (err) {
            console.error(err);
            // Fallback lokal jika database cloud bermasalah
            const updated = { ...questionDatabase, [file.name]: finalQuestions };
            setQuestionDatabase(updated);
            // Data disimpan di Supabase, tidak perlu localStorage
            setSelectedDatabases((prev) => [...new Set([...prev, file.name])]);
            triggerToast(`Berhasil memuat soal secara lokal, gagal menyimpan di cloud Supabase`, '⚠️');
          }
        })();
      } else {
        triggerToast('Gagal mem-parsing file tersebut atau tidak ditemukan soal valid', '❌');
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let loadedCount = 0;
    let skippedCount = 0;
    let totalQuestionsCount = 0;
    const newDatabases: Record<string, Question[]> = {};

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = file.webkitRelativePath || file.name;
      const ext = file.name.split('.').pop()?.toLowerCase();

      // Only process json, yaml, yml files
      if (ext !== 'json' && ext !== 'yaml' && ext !== 'yml') {
        skippedCount++;
        continue;
      }

      try {
        const raw = await readFileAsText(file);
        const finalQuestions = parseRawFileToQuestions(raw, ext);

        if (finalQuestions && finalQuestions.length > 0) {
          newDatabases[path] = finalQuestions;
          loadedCount++;
          totalQuestionsCount += finalQuestions.length;
        } else {
          skippedCount++;
        }
      } catch (err) {
        console.error(`Error parsing file ${path}:`, err);
        skippedCount++;
      }
    }

    if (loadedCount > 0) {
      try {
        // Simpan setiap bank soal ke Cloudflare R2 & D1 (0 Egress)
        for (const [name, questions] of Object.entries(newDatabases)) {
          const r2Res = await uploadQuestionsToR2(name, questions);
          if (r2Res) {
            cloudflareApi.saveQuestionBank({
              name,
              user_id: currentUser.id,
              r2_key: r2Res.r2_key,
              r2_url: r2Res.r2_url,
            }).catch(() => {});
          } else {
            cloudflareApi.saveQuestionBank({
              name,
              user_id: currentUser.id,
              questions_json: questions,
            }).catch(() => {});
          }

          const supaPayload = r2Res ? { r2_key: r2Res.r2_key, r2_url: r2Res.r2_url } : questions;
          await supabase
            .from('question_banks')
            .upsert({ user_id: currentUser.id, name, questions_json: supaPayload }, { onConflict: 'user_id,name' });
        }

        const updated = { ...questionDatabase, ...newDatabases };
        setQuestionDatabase(updated);
        // Data disimpan di Supabase, tidak perlu localStorage
        
        // Auto-select all newly loaded databases
        const newKeys = Object.keys(newDatabases);
        setSelectedDatabases((prev) => [...new Set([...prev, ...newKeys])]);

        // Expand folders that were newly loaded
        const foldersToOpen = { ...openFolders };
        newKeys.forEach((k) => {
          if (k.includes('/')) {
            const folderName = k.substring(0, k.lastIndexOf('/'));
            foldersToOpen[folderName] = true;
          }
        });
        setOpenFolders(foldersToOpen);

        triggerToast(`Berhasil memuat ${loadedCount} bank soal (${totalQuestionsCount} soal) dari folder!`, '✅');
      } catch (err) {
        console.error(err);
        // Tetap simpan lokal sebagai fallback
        const updated = { ...questionDatabase, ...newDatabases };
        setQuestionDatabase(updated);
        // Data disimpan di Supabase, tidak perlu localStorage
        const newKeys = Object.keys(newDatabases);
        setSelectedDatabases((prev) => [...new Set([...prev, ...newKeys])]);
        triggerToast(`Berhasil memuat folder secara lokal, gagal menyimpan di cloud Supabase`, '⚠️');
      }
    } else {
      triggerToast('Tidak ditemukan berkas soal .json/.yaml valid di dalam folder', '⚠️');
    }

    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const handlePasteSubmit = async () => {
    setPasteError('');
    if (!pasteFileName.trim()) {
      setPasteError('Nama kuis wajib diisi!');
      return;
    }
    if (!pasteContent.trim()) {
      setPasteError('Kode JSON/YAML tidak boleh kosong!');
      return;
    }

    const name = pasteFileName.endsWith('.json') || pasteFileName.endsWith('.yaml') || pasteFileName.endsWith('.yml') 
      ? pasteFileName 
      : `${pasteFileName}.json`;

    // Try parsing
    let ext = 'json';
    if (pasteContent.trim().startsWith('-') || !pasteContent.trim().startsWith('[')) {
      ext = 'yaml'; // Simple heuristic
    }

    const finalQuestions = parseRawFileToQuestions(pasteContent, ext);
    if (finalQuestions && finalQuestions.length > 0) {
      if (currentUser) {
        try {
          // R2 upload sebagai backup saja (best-effort)
          uploadQuestionsToR2(name, finalQuestions).catch(err =>
            console.warn('R2 upload skipped:', err)
          );
          const { error } = await supabase
            .from('question_banks')
            .upsert({ user_id: currentUser.id, name, questions_json: finalQuestions }, { onConflict: 'user_id,name' });
          if (error) throw error;
          
          triggerToast(`Berhasil menyimpan ${finalQuestions.length} soal sebagai "${name}"`, '✅');
        } catch (err) {
          triggerToast(`Berhasil menyimpan secara lokal, gagal upload ke cloud`, '⚠️');
        }
      } else {
        triggerToast(`Berhasil menyimpan ${finalQuestions.length} soal sebagai "${name}"`, '✅');
      }

      const updated = { ...questionDatabase, [name]: finalQuestions };
      setQuestionDatabase(updated);
      // Data disimpan di Supabase, tidak perlu localStorage
      setSelectedDatabases((prev) => [...new Set([...prev, name])]);
      
      setPasteModalOpen(false);
      setPasteFileName('');
      setPasteContent('');
    } else {
      setPasteError('Gagal mem-parsing isi teks. Pastikan format JSON/YAML valid.');
    }
  };


  const removeGlobalDatabase = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Hapus kuis global "${name}"?\n\nKuis ini akan dihapus untuk SEMUA pengguna. Tindakan ini tidak bisa dibatalkan.`)) return;
    (async () => {
      try {
        // Hapus dari Cloudflare D1
        cloudflareApi.deleteQuestionBank(name).catch(() => {});

        // Hapus dari Supabase tanpa filter user_id (karena global)
        const { data: bankData, error: fetchErr } = await supabase
          .from('question_banks')
          .select('questions_json')
          .eq('name', name)
          .single();

        if (!fetchErr && bankData?.questions_json) {
          const qj = bankData.questions_json;
          // Jika data berupa referensi R2, hapus file dari R2 juga
          if (qj && !Array.isArray(qj) && qj.r2_key) {
            await deleteQuestionsFromR2(qj.r2_key);
          }
        }

        const { error } = await supabase
          .from('question_banks')
          .delete()
          .eq('name', name);
        if (error) throw error;

        // Update semua local state
        const updated = { ...questionDatabase };
        delete updated[name];
        setQuestionDatabase(updated);
        setSelectedDatabases((prev) => prev.filter((d) => d !== name));
        setGlobalDatabases((prev) => prev.filter((d) => d !== name));
        setQuestionLimits((prev) => { const next = { ...prev }; delete next[name]; return next; });

        // Hapus dari global folder map
        setGlobalQuizFolderMap((prev) => {
          const next = { ...prev };
          delete next[name];
          // Simpan perubahan ke Cloudflare D1 + Supabase
          cloudflareApi.saveAppSettings('quizFolderMap', next).catch(() => {});
          supabase.from('app_settings').upsert({ key: 'quizFolderMap', value: next }).then(() => {}, console.error);
          return next;
        });

        triggerToast(`Kuis global "${name}" berhasil dihapus!`, '🗑️');
      } catch (err) {
        console.error(err);
        triggerToast(`Gagal menghapus kuis global "${name}"`, '❌');
      }
    })();
  };

  const removeFolder = (folderPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalTitle('Hapus Folder?');
    setModalDesc(`Apakah Anda yakin ingin menghapus folder "${folderPath}" beserta seluruh bank soal di dalamnya?`);
    setModalAction(() => async () => {
      const keysToRemove = Object.keys(questionDatabase).filter(
        (key) => key.startsWith(folderPath + '/')
      );
      if (keysToRemove.length === 0) return;

      try {
        // Hapus setiap file dari Cloudflare D1 & Supabase
        for (const key of keysToRemove) {
          cloudflareApi.deleteQuestionBank(key).catch(() => {});
          const { error } = await supabase
            .from('question_banks')
            .delete()
            .eq('name', key)
            .eq('user_id', currentUser.id);
          if (error) throw error;
        }

        const updated = { ...questionDatabase };
        keysToRemove.forEach((k) => delete updated[k]);

        setQuestionDatabase(updated);
        // Data disimpan di Supabase, tidak perlu localStorage

        setSelectedDatabases((prev) => prev.filter((d) => !keysToRemove.includes(d)));
        setQuestionLimits((prev) => {
          const next = { ...prev };
          keysToRemove.forEach((k) => delete next[k]);
          return next;
        });

        triggerToast(`Folder "${folderPath}" dan semua isinya berhasil dihapus!`, '🗑️');
      } catch (err) {
        console.error(err);
        // Fallback hapus lokal
        const updated = { ...questionDatabase };
        keysToRemove.forEach((k) => delete updated[k]);
        setQuestionDatabase(updated);
        // Data disimpan di Supabase, tidak perlu localStorage
        setSelectedDatabases((prev) => prev.filter((d) => !keysToRemove.includes(d)));
        triggerToast(`Folder dihapus secara lokal, gagal menghapus beberapa file di cloud`, '⚠️');
      }
    });
    setModalOpen(true);
  };

  const clearAllDatabases = () => {
    setModalTitle('Hapus Semua Database?');
    setModalDesc('Semua bank soal yang tersimpan di server dan browser akan dihapus permanen.');
    setModalAction(() => async () => {
      try {
        const { error } = await supabase
          .from('question_banks')
          .delete()
          .eq('user_id', currentUser.id);
        if (error) throw error;
        setQuestionDatabase({});
        // Data disimpan di Supabase, tidak perlu localStorage
        setSelectedDatabases([]);
        triggerToast('Seluruh database berhasil dibersihkan', '🗑');
      } catch (err) {
        console.error(err);
        setQuestionDatabase({});
        // Data disimpan di Supabase, tidak perlu localStorage
        setSelectedDatabases([]);
        triggerToast('Database dibersihkan lokal, gagal membersihkan di cloud', '⚠️');
      }
    });
    setModalOpen(true);
  };

  const downloadDatabase = (name: string, questions: Question[], e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questions, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", name.endsWith('.json') || name.endsWith('.yaml') || name.endsWith('.yml') ? name : `${name}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerToast(`Berhasil mengunduh "${name}"`, '📥');
    } catch (err) {
      console.error(err);
      triggerToast('Gagal mengunduh file', '❌');
    }
  };

  const copyQuestionToClipboard = () => {
    const q = currentQuiz[currentIndex];
    if (!q) return;

    let textToCopy = `Soal:\n${q.pertanyaan.replace(/<[^>]*>/g, '')}\n\n`;
    if (q.pilihan && q.pilihan.length > 0) {
      const letters = ['A', 'B', 'C', 'D', 'E'];
      textToCopy += 'Pilihan Jawaban:\n';
      q.pilihan.forEach((opt, i) => {
        textToCopy += `${letters[i]}. ${opt}\n`;
      });
    }
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        triggerToast('Soal & opsi disalin ke clipboard!', '📋');
      })
      .catch((err) => {
        console.error('Gagal menyalin kuis:', err);
        triggerToast('Gagal menyalin soal', '❌');
      });
  };

  const loadSampleQuestions = async () => {
    try {
      // Simpan semua SAMPLE_BANKS ke Cloudflare D1 & Supabase
      for (const [name, questions] of Object.entries(SAMPLE_BANKS)) {
        cloudflareApi.saveQuestionBank({ user_id: currentUser.id, name, questions_json: questions }).catch(() => {});
        const { error } = await supabase
          .from('question_banks')
          .upsert({ user_id: currentUser.id, name, questions_json: questions }, { onConflict: 'user_id,name' });
        if (error) throw error;
      }
      
      const updated = { ...questionDatabase, ...SAMPLE_BANKS };
      setQuestionDatabase(updated);
      // Data disimpan di Supabase, tidak perlu localStorage
      setSelectedDatabases(Object.keys(SAMPLE_BANKS));
      triggerToast('Bank soal sampel kedokteran & sains berhasil dimuat!', '✨');
    } catch (err) {
      console.error(err);
      // Fallback lokal
      const updated = { ...questionDatabase, ...SAMPLE_BANKS };
      setQuestionDatabase(updated);
      // Data disimpan di Supabase, tidak perlu localStorage
      setSelectedDatabases(Object.keys(SAMPLE_BANKS));
      triggerToast('Bank soal sampel dimuat lokal, gagal memuat ke cloud', '⚠️');
    }
  };

  // === HISTORIS METHODS ===
  const deleteHistoryItem = (id: number) => {
    const updated = quizHistory.filter((item) => item.id !== id);
    saveHistoryToLocalStorage(updated, setQuizHistory);
    triggerToast('Satu riwayat kuis dihapus', '🗑');
  };

  const clearAllHistory = () => {
    setModalTitle('Hapus Semua Riwayat?');
    setModalDesc('Seluruh catatan hasil skor kuis terdahulu akan dihapus secara permanen.');
    setModalAction(() => () => {
      saveHistoryToLocalStorage([], setQuizHistory);
      triggerToast('Riwayat percobaan berhasil dikosongkan', '🗑');
    });
    setModalOpen(true);
  };

  // === QUIZ LOGIC ===
  

  const startQuiz = () => {
    if (selectedDatabases.length === 0) {
      triggerToast('Pilih minimal satu bank soal di bawah!', '⚠️');
      return;
    }

    let pool: Question[] = [];
    selectedDatabases.forEach((dbName) => {
      let qList = [...(questionDatabase[dbName] || [])];
      if (qList.length === 0) return;

      const hasShuffleCards = qList.some((q) => q.featureFlags?.shuffleCards === true);
      if (shuffleQuestions || hasShuffleCards) {
        qList = shuffleArray(qList);
      }

      if (shuffleOptions) {
        qList = qList.map(shuffleQuestionOptions);
      }

      const limit = questionLimits[dbName] || 0;
      if (limit > 0 && limit < qList.length) {
        qList = qList.slice(0, limit);
      }

      pool = pool.concat(qList);
    });

    if (quizMode === 'simulasi' && selectedDatabases.length > 1) {
      pool = shuffleArray(pool);
    }

    if (pool.length === 0) {
      triggerToast('Tidak ada soal yang tersedia dengan pengaturan ini!', '⚠️');
      return;
    }

    if (isAdaptiveMode) {
      setAdaptiveQuestionPool(pool);
      // Pick first question (sedang if possible)
      let firstQ = pool.find(q => q.metadata?.tingkat_kesulitan?.toLowerCase() === 'sedang');
      if (!firstQ) firstQ = pool[0];
      
      setCurrentQuiz([firstQ]);
      setUserAnswers([null]);
      setDoubtStatus([false]);
      setIsRevealed([false]);
      setAdaptiveHistory([]);
      setCurrentDifficulty('sedang');
      setCurrentIndex(0);
      setQuizSecondsLeft(Math.min(pool.length, 30) * 60); // Max 30 questions limit for adaptive
    } else {
      setCurrentQuiz(pool);
      setUserAnswers(new Array(pool.length).fill(null));
      setDoubtStatus(new Array(pool.length).fill(false));
      setIsRevealed(new Array(pool.length).fill(false));
      setCurrentIndex(0);
      setQuizSecondsLeft(pool.length * 60);
    }

    // Reset Gamification (keep persistent lifetime stats)
    setXpHistory([userXP]);
    setOpenReviewIndices({});
    setUnlockedHints({});
    setHasSubmittedLeaderboard(false);
    setLastQuizScore(0);
    setIsDailyChallenge(false);

    activeQuizSessionIdRef.current = 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    hasRecordedLeaderboard.current = false;
    setQuizTimerActive(true);
    setScreen('quiz');
    setShowSidebar(true);
    triggerToast('Kuis dimulai! Selamat mengerjakan, semoga sukses!', '🚀');
  };

  const startDailyChallenge = () => {
    let allQuestions: Question[] = [];
    Object.values(questionDatabase).forEach(qList => {
      allQuestions = [...allQuestions, ...(qList as Question[])];
    });

    if (allQuestions.length === 0) {
      triggerToast('Tidak ada soal tersedia untuk Daily Challenge!', '⚠️');
      return;
    }

    // Shuffle and pick 5
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 5);
    
    // Process them
    const pool = shuffled.map(q => shuffleQuestionOptions(q));

    setCurrentQuiz(pool);
    setUserAnswers(new Array(pool.length).fill(null));
    setDoubtStatus(new Array(pool.length).fill(false));
    setIsRevealed(new Array(pool.length).fill(false));
    setCurrentIndex(0);

    // Reset Gamification
    setXpHistory([userXP]);
    setOpenReviewIndices({});
    setUnlockedHints({});
    setHasSubmittedLeaderboard(false);
    setLastQuizScore(0);
    setIsDailyChallenge(true);

    activeQuizSessionIdRef.current = 'quiz_daily_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    hasRecordedLeaderboard.current = false;
    setQuizSecondsLeft(600); // 10 minutes
    setQuizTimerActive(true);
    setScreen('quiz');
    setShowSidebar(true);
    triggerToast('Daily Challenge dimulai! 10 Menit, 5 Soal, 2x XP!', '🔥');
  };

  const startBookmarkPractice = () => {
    if (!studyRoom.bookmarks || studyRoom.bookmarks.length === 0) {
      triggerToast('Belum ada soal yang di-bookmark!', '⚠️');
      return;
    }

    const bookmarkQuestions = studyRoom.bookmarks
      .map(b => b.question_json)
      .filter(Boolean);

    if (bookmarkQuestions.length === 0) {
      triggerToast('Data soal bookmark tidak valid!', '⚠️');
      return;
    }

    const pool = shuffleQuestions 
      ? shuffleArray(bookmarkQuestions) 
      : [...bookmarkQuestions];

    const processedPool = shuffleOptions 
      ? pool.map(shuffleQuestionOptions) 
      : pool;

    setCurrentQuiz(processedPool);
    setUserAnswers(new Array(processedPool.length).fill(null));
    setDoubtStatus(new Array(processedPool.length).fill(false));
    setIsRevealed(new Array(processedPool.length).fill(false));
    setCurrentIndex(0);
    setQuizSecondsLeft(processedPool.length * 60);

    // Reset Gamification & States
    setXpHistory([userXP]);
    setOpenReviewIndices({});
    setUnlockedHints({});
    setHasSubmittedLeaderboard(false);
    setLastQuizScore(0);
    setIsDailyChallenge(false);

    activeQuizSessionIdRef.current = 'quiz_bookmark_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    hasRecordedLeaderboard.current = false;
    setQuizTimerActive(true);
    setScreen('quiz');
    setShowSidebar(true);
    triggerToast(`Latihan ${processedPool.length} soal bookmark dimulai!`, '🔖');
  };

  const checkAnswerNow = (event: React.MouseEvent<HTMLButtonElement>) => {
    const userAnswer = userAnswers[currentIndex];
    const q = currentQuiz[currentIndex];
    const isIsian = !q.pilihan || q.pilihan.length === 0;

    if (!userAnswer || userAnswer.trim() === '') {
      triggerToast(isIsian ? 'Masukkan jawaban Anda terlebih dahulu!' : 'Pilih salah satu pilihan jawaban dulu!', '⚠️');
      return;
    }

    if (isRevealed[currentIndex]) return;

    const isCorrect = isUserAnswerCorrect(userAnswer, q);
    let baseXP = q.metadata?.xp || 100;

    // Hint penalty logic for Isian Singkat
    if (isIsian && isCorrect) {
      const hintsUsed = unlockedHints[currentIndex] || 0;
      const penaltyRate = q.featureFlags?.hintPenalty !== undefined ? q.featureFlags.hintPenalty : 0.25;
      const penalty = hintsUsed * penaltyRate;
      baseXP = Math.max(10, Math.floor(baseXP * (1 - penalty)));
    }

    let xpGained = 0;

    // Daily Streak Logic
    if (currentUser) {
      const nowInJakarta = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      const todayStr = nowInJakarta.toISOString().split('T')[0];
      
      let nextDailyStreak = currentStreak;
      let nextLongestStreak = longestStreak;
      let isStreakUpdated = false;

      if (lastActiveDate !== todayStr) {
        if (lastActiveDate) {
          const lastActiveDateObj = new Date(lastActiveDate);
          lastActiveDateObj.setHours(0, 0, 0, 0);
          const todayDateObj = new Date(todayStr);
          todayDateObj.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((todayDateObj.getTime() - lastActiveDateObj.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            nextDailyStreak += 1;
            isStreakUpdated = true;
          } else if (diffDays > 1) {
            // It should have been handled at login, but just in case
            if (diffDays === 2 && streakFreezeLeft > 0) {
              setStreakFreezeLeft(prev => prev - 1);
              nextDailyStreak += 1;
              isStreakUpdated = true;
            } else {
              nextDailyStreak = 1;
              isStreakUpdated = true;
            }
          }
        } else {
          nextDailyStreak = 1;
          isStreakUpdated = true;
        }

        if (isStreakUpdated) {
          if (nextDailyStreak > nextLongestStreak) nextLongestStreak = nextDailyStreak;
          setCurrentStreak(nextDailyStreak);
          setLongestStreak(nextLongestStreak);
          setLastActiveDate(todayStr);
          triggerToast(`🔥 Daily Streak bertambah: ${nextDailyStreak} Hari!`, '🔥');
        }
      }
    }

    let nextCombo = currentCombo;
    if (isCorrect) {
      nextCombo += 1;
      xpGained = baseXP + (nextCombo - 1) * 20; // 20 XP combo bonus
      
      // Daily Challenge 2x XP bonus
      if (isDailyChallenge) {
        xpGained *= 2;
      }
      
      // Phase 5: Adaptive Quiz - Hard questions give 1.5x XP
      if (isAdaptiveMode && q.metadata?.tingkat_kesulitan?.toLowerCase() === 'sukar') {
        xpGained = Math.floor(xpGained * 1.5);
      }
      
      // Adaptive History update
      if (isAdaptiveMode) {
        setAdaptiveHistory(prev => [...prev, isCorrect]);
      }
      
      const nextXP = userXP + xpGained;
      setUserXP(nextXP);
      setCurrentCombo(nextCombo);
      setXpHistory((prev) => [...prev, nextXP]);
      triggerFloatingXP(`+${xpGained} XP! 🔥`, true, event);
      triggerToast('Jawaban Benar! Anda mendapatkan XP bonus.', '✅');

      // Live update total_questions_answered
      if (currentUser) {
        setTotalQuestionsAnswered((prev) => {
          const nextTotal = prev + 1;
          supabase
            .from('profiles')
            .update({ total_questions_answered: nextTotal })
            .eq('id', currentUser.id)
            .then(({ error }) => {
              if (error) console.error('Error updating live total_questions_answered:', error);
            });
          return nextTotal;
        });
      }
    } else {
      let xpLoss = Math.floor(baseXP / 2);
      const nextXP = Math.max(0, userXP - xpLoss);
      setUserXP(nextXP);
      setCurrentCombo(0);
      setXpHistory((prev) => [...prev, nextXP]);
      triggerFloatingXP(`-${xpLoss} XP`, false, event);
      triggerToast('Jawaban Kurang Tepat. Pelajari pembahasannya!', '❌');
    }
    
    // Adaptive History update for both correct and wrong
    if (isAdaptiveMode) {
      setAdaptiveHistory(prev => [...prev, isCorrect]);
    }

    const updatedRevealed = [...isRevealed];
    updatedRevealed[currentIndex] = true;
    setIsRevealed(updatedRevealed);
  };

  const selectAnswer = (ans: string) => {
    if (isRevealed[currentIndex]) return;
    const updated = [...userAnswers];
    updated[currentIndex] = ans;
    setUserAnswers(updated);
  };

  const toggleDoubt = () => {
    const updated = [...doubtStatus];
    updated[currentIndex] = !updated[currentIndex];
    setDoubtStatus(updated);
  };

  const navigateQuestion = (direction: number) => {
    const target = currentIndex + direction;
    if (target >= 0 && target < currentQuiz.length) {
      setCurrentIndex(target);
    }
  };

  const handleNextQuestion = () => {
    if (isAdaptiveMode && currentIndex === currentQuiz.length - 1 && currentQuiz.length < 30) {
      if (userAnswers[currentIndex] === null) return; // Prevent advancing without answering
      const recent = adaptiveHistory.slice(-5);
      let nextDiff = currentDifficulty;
      if (recent.length >= 5) {
        const correctCount = recent.filter(x => x).length;
        if (correctCount >= 4) {
          nextDiff = nextDiff === 'mudah' ? 'sedang' : 'sukar';
        } else if (correctCount <= 2) {
          nextDiff = nextDiff === 'sukar' ? 'sedang' : 'mudah';
        }
      }
      
      let nextQs = adaptiveQuestionPool.filter(q => q.metadata?.tingkat_kesulitan?.toLowerCase() === nextDiff);
      const askedIds = currentQuiz.map(q => q.pertanyaan);
      nextQs = nextQs.filter(q => !askedIds.includes(q.pertanyaan));
      
      if (nextQs.length === 0) {
        nextQs = adaptiveQuestionPool.filter(q => !askedIds.includes(q.pertanyaan));
      }
      
      if (nextQs.length === 0) {
        openFinishModal();
        return;
      }
      
      const nextQ = nextQs[Math.floor(Math.random() * nextQs.length)];
      setCurrentDifficulty(nextDiff);
      setCurrentQuiz(prev => [...prev, nextQ]);
      setUserAnswers(prev => [...prev, null]);
      setDoubtStatus(prev => [...prev, false]);
      setIsRevealed(prev => [...prev, false]);
      setCurrentIndex(prev => prev + 1);
    } else if (currentIndex < currentQuiz.length - 1) {
      navigateQuestion(1);
    } else {
      openFinishModal();
    }
  };

  const openFinishModal = () => {
    const unanswered = userAnswers.filter((a) => a === null).length;
    const desc = unanswered > 0
      ? `Anda memiliki ${unanswered} soal yang belum dijawab. Apakah Anda yakin ingin mengakhiri sesi kuis ini sekarang?`
      : 'Semua soal telah dijawab. Apakah Anda ingin mengumpulkan jawaban dan melihat analisis skor?';

    setModalTitle('Akhiri & Kumpulkan?');
    setModalDesc(desc);
    setModalAction(() => () => finishQuiz());
    setModalOpen(true);
  };

  const finishQuiz = () => {
    setQuizTimerActive(false);
    let correct = 0;
    let empty = 0;

    currentQuiz.forEach((q, i) => {
      const ans = userAnswers[i];
      if (ans === null) {
        empty++;
      } else if (isUserAnswerCorrect(ans, q)) {
        correct++;
      }
    });

    const total = currentQuiz.length;
    const wrong = total - correct - empty;
    const finalScore = Math.round((correct / total) * 100);

    // Adaptive Mode Finish Toast
    if (isAdaptiveMode) {
      let scoreAcc = 0;
      currentQuiz.forEach(q => {
        const diff = q.metadata?.tingkat_kesulitan?.toLowerCase();
        if (diff === 'sukar') scoreAcc += 3;
        else if (diff === 'sedang') scoreAcc += 2;
        else scoreAcc += 1; // mudah
      });
      const avg = scoreAcc / total;
      const avgStr = avg > 2.5 ? 'Sukar (Hard) 🔥' : avg > 1.5 ? 'Sedang 🎯' : 'Mudah 🌟';
      setTimeout(() => {
        triggerToast(`Kuis Adaptif Selesai - Level Rata-Rata: ${avgStr}`, '🤖');
      }, 500);
    }

    // Save attempt into history
    const newEntry: HistoryEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      score: finalScore,
      correct,
      wrong,
      empty,
      total,
      files: selectedDatabases,
      mode: quizMode,
      questions: [...currentQuiz],
      userAnswers: [...userAnswers]
    };

    const updatedHistory = [newEntry, ...quizHistory].slice(0, 50);
    const historySaved = saveHistoryToLocalStorage(updatedHistory, setQuizHistory);
    if (!historySaved) {
      triggerToast('Penyimpanan perangkat penuh — riwayat kuis gagal disimpan!', '⚠️');
    }

    // Auto-add wrong answers to Spaced Repetition
    if (currentUser) {
      const dbName = selectedDatabases[0] || 'Kuis';
      srs.addWrongAnswers(currentQuiz, userAnswers, dbName);
    }

    setLastQuizScore(finalScore);

    if (currentUser) {
      const achStats: AchievementStats = {
        totalQuizzes: quizHistory.length + 1,
        totalQuestionsAnswered: totalQuestionsAnswered + currentQuiz.length,
        totalCorrect: correct,
        currentStreak,
        longestStreak,
        level: getLevelInfo(userXP).level,
        xp: userXP,
        perfectScores: finalScore === 100 ? (quizHistory.filter(h => h.score === 100).length + 1) : quizHistory.filter(h => h.score === 100).length,
        dailyChallengesCompleted: quizHistory.filter(h => h.files.includes('daily')).length,
        uniqueBanksAttempted: new Set(quizHistory.flatMap(h => h.files)).size,
      };
      achievements.checkAchievements(achStats);
    }

    // Delete active session and update total questions count in Supabase
    const activeId = activeQuizSessionIdRef.current;
    activeQuizSessionIdRef.current = null; // Invalidate immediately to prevent race conditions with autoSaveSession

    if (currentUser && activeId) {
      (async () => {
        try {
          // 1. Remove this session from multiple active sessions list
          let localList: any[] = [];
          try {
            const saved = localStorage.getItem('cbt_active_sessions');
            if (saved) localList = JSON.parse(saved);
          } catch (e) {}

          const updatedList = localList.filter(s => s.id !== activeId);
          try { localStorage.setItem('cbt_active_sessions', JSON.stringify(updatedList)); } catch(e) { console.warn('localStorage full'); }
          setPendingSessions(updatedList);

          if (updatedList.length > 0) {
            await supabase
              .from('quiz_sessions')
              .upsert({
                user_id: currentUser.id,
                current_quiz_json: { is_multi_session: true, sessions: updatedList },
                updated_at: new Date().toISOString()
              });
          } else {
            await supabase
              .from('quiz_sessions')
              .delete()
              .eq('user_id', currentUser.id);
          }
        } catch (err) {
          console.error('Error updating session after quiz completion:', err);
        }
      })();
    }

    if (currentUser) {
      const quizFileName = selectedDatabases.length === 1
        ? selectedDatabases[0]
        : selectedDatabases.length > 1
        ? selectedDatabases.join(', ')
        : 'Kuis';
      recordQuizToLeaderboard(quizFileName, correct, total);
    }

    setScreen('result');
    triggerToast('Kuis diselesaikan! Lihat analisis performa Anda.', '🏆');

    // Celebration confetti if score is >= 80
    if (finalScore >= 80) {
      // Primary burst
      confetti({
        particleCount: 150,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6']
      });

      // Side bursts
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.8 },
          colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6']
        });
      }, 250);

      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.8 },
          colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6']
        });
      }, 400);

      // Fireworks style burst
      setTimeout(() => {
        const end = Date.now() + (2 * 1000); // 2 seconds of random fireworks
        const interval = setInterval(() => {
          if (Date.now() > end) {
            return clearInterval(interval);
          }
          confetti({
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            origin: { x: Math.random(), y: Math.random() - 0.2 }
          });
        }, 200);
      }, 800);
    }
  };

  const exitQuiz = () => {
    setModalTitle('Simpan & Keluar Kuis?');
    setModalDesc('Progres pengerjaan kuis Anda telah disimpan secara otomatis. Anda dapat melanjutkannya kapan saja ketika kembali.');
    setModalAction(() => async () => {
      if (currentUser) {
        try {
          const activeId = activeQuizSessionIdRef.current || `session_${Date.now()}`;
          const title = selectedDatabases.map(db => db.replace('.json', '').replace('.yaml', '')).join(', ') || 'Kuis Kustom';
          
          const currentSession = {
            id: activeId,
            title,
            current_quiz_json: currentQuiz,
            current_index: currentIndex,
            user_answers_json: userAnswers,
            doubt_status_json: doubtStatus,
            is_revealed_json: isRevealed,
            unlocked_hints_json: unlockedHints,
            selected_databases: selectedDatabases,
            quiz_mode: quizMode,
            updated_at: new Date().toISOString()
          };

          let localList: any[] = [];
          try {
            const saved = localStorage.getItem('cbt_active_sessions');
            if (saved) localList = JSON.parse(saved);
          } catch (e) {}

          const idx = localList.findIndex(s => s.id === activeId);
          if (idx !== -1) {
            localList[idx] = currentSession;
          } else {
            localList.unshift(currentSession);
          }

          try { localStorage.setItem('cbt_active_sessions', JSON.stringify(localList)); } catch(e) { console.warn('localStorage full'); }
          setPendingSessions(localList);

          await supabase
            .from('quiz_sessions')
            .upsert({
              user_id: currentUser.id,
              current_quiz_json: { is_multi_session: true, sessions: localList },
              updated_at: new Date().toISOString()
            });
        } catch (err) {
          console.error('Gagal menyimpan sesi kuis sebelum keluar:', err);
        }
      }
      activeQuizSessionIdRef.current = null;
      setQuizTimerActive(false);
      setScreen('setup');
      setCurrentQuiz([]);
    });
    setModalOpen(true);
  };

  // Helper functions for scoring
  
  // Analytics calculator
  const analytics = React.useMemo(() => {
    const competencies: Record<string, { correct: number; total: number }> = {};
    const cognitives: Record<string, { correct: number; total: number }> = {};
    const difficulties: Record<string, { correct: number; total: number }> = {};

    let hasMetadata = false;

    currentQuiz.forEach((q, i) => {
      const userAns = userAnswers[i];
      const isCorrect = isUserAnswerCorrect(userAns, q);

      if (q.metadata) {
        hasMetadata = true;
        const comp = q.metadata.sub_kompetensi_klinis || 'Umum';
        const cog = q.metadata.tingkat_kognitif || 'Aplikasi';
        const diff = q.metadata.tingkat_kesulitan || 'Sedang';

        if (!competencies[comp]) competencies[comp] = { correct: 0, total: 0 };
        if (!cognitives[cog]) cognitives[cog] = { correct: 0, total: 0 };
        if (!difficulties[diff]) difficulties[diff] = { correct: 0, total: 0 };

        competencies[comp].total++;
        cognitives[cog].total++;
        difficulties[diff].total++;

        if (isCorrect) {
          competencies[comp].correct++;
          cognitives[cog].correct++;
          difficulties[diff].correct++;
        }
      }
    });

    return { competencies, cognitives, difficulties, hasMetadata };
  }, [currentQuiz, userAnswers]);

  // Find clinical weakness below 70%
  const weaknessesList = React.useMemo(() => {
    const list: { name: string; percentage: number; correct: number; total: number }[] = [];
    Object.entries(analytics.competencies).forEach(([name, data]: [string, any]) => {
      const pct = Math.round((data.correct / data.total) * 100);
      if (pct < 70) {
        list.push({ name, percentage: pct, correct: data.correct, total: data.total });
      }
    });
    return list;
  }, [analytics.competencies]);

  // History Analytics Calculator
  const historyAnalytics = React.useMemo(() => {
    const competencies: Record<string, { correct: number; total: number }> = {};
    
    quizHistory.forEach(entry => {
      if (!entry.questions) return;
      entry.questions.forEach((q, i) => {
        const userAns = entry.userAnswers?.[i];
        const isCorrect = isUserAnswerCorrect(userAns, q);
        const comp = q.metadata?.sub_kompetensi_klinis || 'Klinis Umum';
        
        if (!competencies[comp]) {
          competencies[comp] = { correct: 0, total: 0 };
        }
        competencies[comp].total++;
        if (isCorrect) {
          competencies[comp].correct++;
        }
      });
    });
    
    // Default fallback mock categories if history is empty
    if (Object.keys(competencies).length === 0) {
      return {
        'Tropis & Infeksi': { correct: 17, total: 20 },
        'Anatomi & Fisiologi': { correct: 14, total: 20 },
        'Kardiologi & Vaskular': { correct: 12, total: 20 },
        'Neurologi & Psikiatri': { correct: 10, total: 20 }
      };
    }
    
    return competencies;
  }, [quizHistory]);

  // Toggle review items
  const toggleReviewAccordion = (idx: number) => {
    setOpenReviewIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Gunakan Custom Hook untuk Navigasi Keyboard
  useKeyboardNavigation({
    isActive: keyboardNavEnabled,
    screen,
    currentQuiz,
    currentIndex,
    setCurrentIndex,
    selectAnswer,
    toggleDoubt,
    setIsQuestionMapOpen: () => {},
    handleNext: handleNextQuestion,
    closeModals: () => {
      setModalOpen(false);
      setLightboxImage(null);
    },
    toggleImageZoom: () => {
      const q = currentQuiz[currentIndex];
      if (q?.gambar) {
        setLightboxImage(lightboxImage ? null : q.gambar);
      }
    }
  });

  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${theme === 'dark' ? 'dark text-brand-text bg-brand-bg' : 'text-slate-900 bg-slate-50'}`}>
      
      {/* Dynamic Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <span className="absolute w-[450px] h-[450px] rounded-full bg-rose-400/20 dark:bg-rose-900/10 blur-[100px] -top-[120px] -left-[100px] animate-float-orb" />
        <span className="absolute w-[400px] h-[400px] rounded-full bg-indigo-400/20 dark:bg-indigo-900/10 blur-[100px] top-[25%] -right-[140px] animate-float-orb [animation-delay:-6s]" />
        <span className="absolute w-[480px] h-[480px] rounded-full bg-purple-400/20 dark:bg-purple-900/10 blur-[100px] -bottom-[160px] left-[15%] animate-float-orb [animation-delay:-12s]" />
        <span className="absolute w-[320px] h-[320px] rounded-full bg-amber-200/20 dark:bg-amber-900/10 blur-[90px] bottom-[10%] right-[8%] animate-float-orb [animation-delay:-3s]" />
      </div>

      {authLoading ? (
        <SkeletonLoader theme={theme} />
      ) : !currentUser ? (
        <LoginForm
          theme={theme}
          isSessionKicked={isSessionKicked}
          onSubmit={handleAuthSubmit}
          onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
          emailValue={emailInput}
          onEmailChange={setEmailInput}
          passwordValue={passwordInput}
          onPasswordChange={setPasswordInput}
          onGuestJoin={handleGuestJoin}
        />
      ) : (
        <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-brand-bg text-brand-text' : 'bg-slate-50 text-slate-900'}`}>
          {screen === 'setup' && (
            <>
              {/* SIDEBAR DESKTOP */}
              <SidebarNav
                theme={theme}
                activeTab={dashboardTab}
                srsDueCount={srs.stats.dueCount}
                currentStreak={currentStreak}
                streakFreezeLeft={streakFreezeLeft}
                username={profileUsername || ''}
                userLevel={getLevelInfo(userXP).level}
                isAdmin={currentUser?.user_metadata?.username === 'admin' || currentUser?.user_metadata?.username === 'collector'}
                onTabChange={(tab) => setDashboardTab(tab as any)}
                onLogout={async () => {
                  await supabase.auth.signOut();
                  triggerToast('Sampai jumpa lagi!', '👋');
                }}
              />

              {/* BOTTOM NAVIGATION FOR MOBILE */}
              <BottomNav 
                theme={theme}
                activeTab={dashboardTab}
                srsDueCount={srs.stats.dueCount}
                isAdmin={currentUser?.user_metadata?.username === 'admin' || currentUser?.user_metadata?.username === 'collector'}
                onTabChange={(tab) => setDashboardTab(tab as any)}
              />
            </>
          )}

          {/* MAIN WRAPPER CONTAINER */}
          <div className={`flex flex-col min-h-screen flex-1 transition-all ${screen === 'setup' ? 'lg:pl-60' : ''}`}>
            
            {/* Sticky Header (Compact) */}
            {screen === 'setup' && (
              <header className={`sticky top-0 z-20 backdrop-blur-md transition-colors border-b ${
                theme === 'dark' ? 'bg-slate-950/60 border-slate-900/80 text-white' : 'bg-slate-50/60 border-slate-200/60 text-slate-900'
              }`}>
                <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                  <div className="lg:hidden flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-650 text-white flex items-center justify-center font-extrabold shadow-sm">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-black text-base tracking-tight">AuraMed</span>
                  </div>

                  <div className="hidden lg:block text-xs font-bold text-slate-450">
                    Dashboard Platform
                  </div>

                  {/* Header actions (XP, Theme, Bell) */}
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                      theme === 'dark' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-500/5 border-amber-500/15 text-amber-600'
                    }`}>
                      <Flame className="w-3.5 h-3.5 fill-current text-amber-500 animate-pulse" />
                      <span>LV {getLevelInfo(userXP).level}</span>
                      <span className="opacity-30 font-normal">|</span>
                      <span>{userXP} XP</span>
                    </div>

                    {/* Notification Bell + Dropdown */}
                    <NotificationDropdown
                      theme={theme}
                      isOpen={notifOpen}
                      onClose={() => setNotifOpen(false)}
                      onToggle={() => setNotifOpen(!notifOpen)}
                      notifList={notifList}
                      notifCount={notifCount}
                      onMarkAllRead={markAllNotifRead}
                      pushPermission={typeof Notification !== 'undefined' ? Notification.permission : 'default'}
                      onRequestPush={requestPushPermission}
                    />

                    <button
                      onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
                      className={`p-2 rounded-xl border transition-all ${
                        theme === 'dark' ? 'bg-slate-900/80 border-slate-800 text-indigo-400' : 'bg-white border-slate-200 text-amber-500'
                      }`}
                    >
                      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </header>
            )}

        {/* === SETUP SCREEN (DASHBOARD REDESIGN) === */}
        {screen === 'setup' && (
          <div className="space-y-6 animate-fade-in pb-16 lg:pb-0">
            <React.Suspense fallback={
              <div className="flex items-center justify-center p-12 min-h-[300px]">
                <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            }>
            {/* 🏠 TAB 1: BERANDA */}
            {dashboardTab === 'home' && <SetupHomeTab theme={theme} userXP={userXP} currentStreak={currentStreak} longestStreak={longestStreak} streakFreezeLeft={streakFreezeLeft} lastActiveDate={lastActiveDate} totalQuestionsAnswered={totalQuestionsAnswered} quizHistory={quizHistory} achievements={achievements} profileUsername={profileUsername} expandedCompetencies={expandedCompetencies} setExpandedCompetencies={setExpandedCompetencies} pomodoroMode={pomodoroMode} pomodoroSecondsLeft={pomodoroSecondsLeft} pomodoroActive={pomodoroActive} pomodoroCount={pomodoroCount} setPomodoroActive={setPomodoroActive} setPomodoroSecondsLeft={setPomodoroSecondsLeft} activeDashboardTab={activeDashboardTab} setActiveDashboardTab={setActiveDashboardTab} fileLeaderboard={fileLeaderboard} isLeaderboardLoading={isLeaderboardLoading} globalTimeFilter={globalTimeFilter} setGlobalTimeFilter={setGlobalTimeFilter} fileTimeFilter={fileTimeFilter} setFileTimeFilter={setFileTimeFilter} leaderboardType={leaderboardType} setLeaderboardType={setLeaderboardType} fetchFileLeaderboard={fetchFileLeaderboard} selectedLeaderboardFile={selectedLeaderboardFile} setSelectedLeaderboardFile={setSelectedLeaderboardFile} globalLeaderboard={globalLeaderboard} fetchGlobalLeaderboard={fetchGlobalLeaderboard} startDailyChallenge={startDailyChallenge} setShowIosInstallModal={setShowIosInstallModal} pendingSessions={pendingSessions} setDashboardTab={setDashboardTab} resumeQuizSession={resumeQuizSession} discardQuizSession={discardQuizSession} historyAnalytics={historyAnalytics} questionDatabase={questionDatabase} clearAllHistory={clearAllHistory} setSelectedHistoryDetail={setSelectedHistoryDetail} setOpenHistoryReviewIndices={setOpenHistoryReviewIndices} deleteHistoryItem={deleteHistoryItem} />}

            {/* 📚 TAB 2: BANK SOAL */}
            {dashboardTab === 'banks' && (
              <div className="space-y-6 animate-fade-in">
                
                <SearchFilterHeader
                  theme={theme}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  bankFilter={bankFilter}
                  onFilterChange={setBankFilter}
                />

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-8">
                    <UploadZone
                      theme={theme}
                      fileInputRef={fileInputRef}
                      folderInputRef={folderInputRef}
                      onFileUpload={handleFileUpload}
                      onFolderUpload={handleFolderUpload}
                      onPasteClick={() => setPasteModalOpen(true)}
                    />
                  </div>

                  <div className="md:col-span-4">
                    <FormatGuide theme={theme} />
                  </div>
                </div>

                {/* Databases Lists (Folders & Root Items) */}
                <div className={`p-6 rounded-3xl border transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-slate-900/40 border-white/[0.08] shadow-xl'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Pilih Soal yang Ingin Diujikan</h3>
                      {(Object.keys(quizFolderMap).length > 0 || customFolders.length > 0) && (
                        <button 
                          onClick={handleResetPersonal}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors border border-rose-500/20 ml-auto"
                          title="Hapus folder susunan sendiri dan kembali ke susunan Admin"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset Personal
                        </button>
                      )}
                      <button 
                        onClick={handleCreateFolder}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-lg transition-colors border border-indigo-500/20"
                        title="Buat folder baru untuk mengelompokkan kuis"
                      >
                        <Plus className="w-3 h-3" /> Buat Folder
                      </button>
                    </div>
                    {selectedDatabases.length > 0 && (
                      <button 
                        onClick={() => setSelectedDatabases([])}
                        className="text-[10px] font-black text-rose-500 hover:underline bg-transparent"
                      >
                        Batal Pilih Semua ({selectedDatabases.length})
                      </button>
                    )}
                  </div>

                  {Object.keys(questionDatabase).length === 0 ? (
                    <div className="text-center p-12">
                      <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Tidak ada bank soal tersedia</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Unggah berkas soal JSON/YAML terlebih dahulu atau gunakan bank soal bawaan.</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Arrow kiri — desktop only */}
                      {Object.keys(filteredDatabases.folders).length > 1 && (
                        <button
                          onClick={() => folderScrollRef.current?.scrollBy({ left: -340, behavior: 'smooth' })}
                          className={`hidden lg:flex absolute -left-3 top-6 z-10 w-8 h-8 items-center justify-center rounded-full border shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                            theme === 'dark'
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />
                        </button>
                      )}

                      {/* Arrow kanan — desktop only */}
                      {Object.keys(filteredDatabases.folders).length > 1 && (
                        <button
                          onClick={() => folderScrollRef.current?.scrollBy({ left: 340, behavior: 'smooth' })}
                          className={`hidden lg:flex absolute -right-3 top-6 z-10 w-8 h-8 items-center justify-center rounded-full border shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                            theme === 'dark'
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}

                    <div 
                      ref={folderScrollRef}
                      onScroll={() => {
                        // Sembunyikan swipe hint setelah user mulai scroll
                        if (showSwipeHint && folderScrollRef.current) {
                          if (folderScrollRef.current.scrollLeft > 20) setShowSwipeHint(false);
                        }
                      }}
                      className="flex gap-6 overflow-x-auto pb-6 items-start snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                    >
                      {/* Swipe hint — mobile only */}
                      <AnimatePresence>
                        {showSwipeHint && Object.keys(filteredDatabases.folders).length > 1 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.8, duration: 0.4 }}
                            className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 dark:bg-slate-100/90 backdrop-blur-md shadow-lg border border-slate-700/50 dark:border-slate-300/50"
                            onAnimationComplete={() => {
                              // Auto-hide setelah 4 detik
                              setTimeout(() => setShowSwipeHint(false), 4000);
                            }}
                          >
                            <motion.span
                              animate={{ x: [0, 8, 0, -8, 0] }}
                              transition={{ duration: 1.5, repeat: 2, ease: 'easeInOut' }}
                              className="text-slate-300 dark:text-slate-700"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </motion.span>
                            <span className="text-[11px] font-bold text-slate-200 dark:text-slate-800 whitespace-nowrap">
                              Geser untuk lihat folder lain
                            </span>
                            <motion.span
                              animate={{ x: [0, 8, 0, -8, 0] }}
                              transition={{ duration: 1.5, repeat: 2, ease: 'easeInOut', delay: 0.1 }}
                              className="text-slate-300 dark:text-slate-700"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </motion.span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {/* Foldered databases */}
                      {Object.entries(filteredDatabases.folders).map(([folderPath, files]) => {
                        const filesTyped = files as any[];
                        
                        // Count selected items in this folder
                        const selectedInFolder = filesTyped.filter(f => selectedDatabases.includes(f.key)).length;
                        const totalQuestionsInFolder = filesTyped.reduce((acc, f) => acc + (f.questions?.length || 0), 0);

                        return (
                          <div 
                            key={folderPath} 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const quizKey = e.dataTransfer.getData('quizKey');
                              if (quizKey) handleMoveQuiz(quizKey, folderPath);
                            }}
                            className={`w-80 sm:w-88 flex-shrink-0 flex flex-col gap-4 rounded-[24px] p-5 border snap-start ${
                              theme === 'dark' ? 'bg-slate-900/40 border-white/[0.08]' : 'bg-slate-50/50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1 px-1">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-slate-800/50 dark:bg-slate-950/50 flex items-center justify-center flex-shrink-0 text-sm">
                                  {folderPath.toLowerCase().includes('digestif') ? '🫀' : 
                                   folderPath.toLowerCase().includes('kardiorespi') ? '🫁' :
                                   folderPath.toLowerCase().includes('muskulo') ? '🦴' :
                                   folderPath.toLowerCase().includes('neuro') ? '🧠' :
                                   folderPath.toLowerCase().includes('urogenital') ? '🩸' : '📁'}
                                </div>
                                <span className="font-extrabold text-xs uppercase tracking-wider truncate text-amber-500">{folderPath}</span>
                              </div>
                              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black whitespace-nowrap border border-amber-500/20">
                                {totalQuestionsInFolder} soal
                              </span>
                            </div>

                            <div className="flex flex-col gap-3">
                              {filesTyped.map(({ key, displayName, questions }) => {
                                const isSelected = selectedDatabases.includes(key);
                                const relatedHistory = quizHistory.filter((h) => h.files && h.files.includes(key));
                                const personalBest = relatedHistory.length > 0 ? Math.max(...relatedHistory.map((h) => h.score)) : null;
                                const progressCount = personalBest !== null ? Math.round((personalBest / 100) * questions.length) : 0;
                                const progressPercent = personalBest !== null ? personalBest : 0;

                                return (
                                  <div
                                    key={key}
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData('quizKey', key)}
                                    onClick={() => {
                                      setSelectedDatabases((prev) =>
                                        prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
                                      );
                                    }}
                                    className={`relative group flex flex-col p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                                      isSelected
                                        ? theme === 'dark' ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-indigo-50 border-indigo-500/30'
                                        : theme === 'dark' ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start mb-4 gap-3 relative z-10">
                                      <h4 className={`font-bold text-sm leading-snug flex-1 pr-2 break-words ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                        {displayName}
                                      </h4>
                                      <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                                        isSelected 
                                          ? 'bg-amber-400 border-amber-400 text-slate-900' 
                                          : theme === 'dark' ? 'border-slate-600 bg-slate-900/50' : 'border-slate-300 bg-slate-50'
                                      }`}>
                                        {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={4} />}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-end justify-between mt-auto relative z-10">
                                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                                      }`}>
                                        {questions.length} soal
                                      </span>
                                      <span className="text-[10px] font-semibold text-slate-500">
                                        Progres: {progressCount}/{questions.length}
                                      </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/50 dark:bg-slate-800/50 z-0">
                                      <div 
                                        className="h-full bg-amber-400 transition-all duration-500" 
                                        style={{ width: `${progressPercent}%` }}
                                      />
                                    </div>

                                    {/* Hover overlay for actions */}
                                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20">
                                      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          min="1"
                                          max={questions.length}
                                          placeholder="Batas"
                                          value={questionLimits[key] || ''}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setQuestionLimits((prev) => ({
                                              ...prev,
                                              [key]: isNaN(val) ? 0 : Math.min(val, questions.length)
                                            }));
                                          }}
                                          title="Batasi jumlah soal yang diujikan"
                                          className={`w-16 px-2 py-1.5 rounded-lg text-center border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500`}
                                        />
                                        
                                        {profileUsername === 'collector' && (
                                          <button
                                            onClick={(e) => downloadDatabase(key, questions, e)}
                                            className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-colors"
                                            title="Unduh bank soal"
                                          >
                                            <Download className="w-4 h-4" />
                                          </button>
                                        )}
                                        
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setMoveQuizModal({ quizKey: key, quizName: displayName });
                                          }}
                                          className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-colors"
                                          title="Pindah ke folder lain"
                                        >
                                          <FolderPlus className="w-4 h-4" />
                                        </button>

                                        {!globalDatabases.includes(key) ? (
                                          <button
                                            onClick={(e) => removeDatabase(key, e)}
                                            className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors"
                                            title="Hapus bank soal"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        ) : (profileUsername === 'admin' || profileUsername === 'collector') ? (
                                          <button
                                            onClick={(e) => removeGlobalDatabase(key, e)}
                                            className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors"
                                            title="Hapus kuis global (admin)"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        ) : null}
                                      </div>
                                    </div>

                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Loose / Root items */}
                      {true && (
                        <div 
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const quizKey = e.dataTransfer.getData('quizKey');
                            if (quizKey) handleMoveQuiz(quizKey, 'root');
                          }}
                          className={`w-80 sm:w-88 flex-shrink-0 flex flex-col gap-4 rounded-[24px] p-5 border snap-start ${
                          theme === 'dark' ? 'bg-slate-900/40 border-white/[0.08]' : 'bg-slate-50/50 border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between mb-1 px-1">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-800/50 dark:bg-slate-950/50 flex items-center justify-center flex-shrink-0 text-sm">
                                📁
                              </div>
                              <span className="font-extrabold text-xs uppercase tracking-wider truncate text-slate-400">LAINNYA</span>
                            </div>
                            <span className="px-2.5 py-1 bg-slate-500/10 text-slate-500 rounded-full text-[10px] font-black whitespace-nowrap border border-slate-500/20">
                              {filteredDatabases.rootItems.reduce((acc, f) => acc + (f.questions?.length || 0), 0)} soal
                            </span>
                          </div>

                          <div className="flex flex-col gap-3">
                            {filteredDatabases.rootItems.map(({ key, displayName, questions }) => {
                              const isSelected = selectedDatabases.includes(key);
                              const relatedHistory = quizHistory.filter((h) => h.files && h.files.includes(key));
                              const personalBest = relatedHistory.length > 0 ? Math.max(...relatedHistory.map((h) => h.score)) : null;
                              const progressCount = personalBest !== null ? Math.round((personalBest / 100) * questions.length) : 0;
                              const progressPercent = personalBest !== null ? personalBest : 0;

                              return (
                                <div
                                  key={key}
                                  draggable
                                  onDragStart={(e) => e.dataTransfer.setData('quizKey', key)}
                                  onClick={() => {
                                    setSelectedDatabases((prev) =>
                                      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
                                    );
                                  }}
                                  className={`relative group flex flex-col p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                                    isSelected
                                      ? theme === 'dark' ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-indigo-50 border-indigo-500/30'
                                      : theme === 'dark' ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-4 gap-3 relative z-10">
                                    <h4 className={`font-bold text-sm leading-snug flex-1 pr-2 break-words ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                      {displayName}
                                    </h4>
                                    <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                                      isSelected 
                                        ? 'bg-amber-400 border-amber-400 text-slate-900' 
                                        : theme === 'dark' ? 'border-slate-600 bg-slate-900/50' : 'border-slate-300 bg-slate-50'
                                    }`}>
                                      {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={4} />}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-end justify-between mt-auto relative z-10">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                                      theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                                    }`}>
                                      {questions.length} soal
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-500">
                                      Progres: {progressCount}/{questions.length}
                                    </span>
                                  </div>

                                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/50 dark:bg-slate-800/50 z-0">
                                    <div 
                                      className="h-full bg-amber-400 transition-all duration-500" 
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>

                                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20">
                                    <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        min="1"
                                        max={questions.length}
                                        placeholder="Batas"
                                        value={questionLimits[key] || ''}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value);
                                          setQuestionLimits((prev) => ({
                                            ...prev,
                                            [key]: isNaN(val) ? 0 : Math.min(val, questions.length)
                                          }));
                                        }}
                                        title="Batasi jumlah soal yang diujikan"
                                        className={`w-16 px-2 py-1.5 rounded-lg text-center border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500`}
                                      />
                                      
                                      {profileUsername === 'collector' && (
                                        <button
                                          onClick={(e) => downloadDatabase(key, questions, e)}
                                          className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-colors"
                                          title="Unduh bank soal"
                                        >
                                          <Download className="w-4 h-4" />
                                        </button>
                                      )}
                                      
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setMoveQuizModal({ quizKey: key, quizName: displayName });
                                        }}
                                        className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-colors"
                                        title="Pindah ke folder lain"
                                      >
                                        <FolderPlus className="w-4 h-4" />
                                      </button>
                                      
                                      {!globalDatabases.includes(key) ? (
                                        <button
                                          onClick={(e) => removeDatabase(key, e)}
                                          className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors"
                                          title="Hapus bank soal"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      ) : (profileUsername === 'admin' || profileUsername === 'collector') ? (
                                        <button
                                          onClick={(e) => removeGlobalDatabase(key, e)}
                                          className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors"
                                          title="Hapus kuis global (admin)"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      ) : null}
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
                  )}

                  {selectedDatabases.length > 0 && (
                    <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <button
                        onClick={() => setDashboardTab('new')}
                        className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-black bg-indigo-500 hover:bg-indigo-600 text-white shadow-2xl shadow-indigo-500/50 hover:shadow-indigo-500/70 border border-white/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
                      >
                        <span>Lanjutkan ke Pengaturan Kuis ({selectedDatabases.length} Terpilih)</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 🎯 TAB 3: BARU (QUIZ CONFIGURATION) */}
            {dashboardTab === 'new' && <SetupNewQuizTab theme={theme} selectedDatabases={selectedDatabases} setSelectedDatabases={setSelectedDatabases} setDashboardTab={setDashboardTab} quizMode={quizMode} setQuizMode={setQuizMode} shuffleQuestions={shuffleQuestions} setShuffleQuestions={setShuffleQuestions} shuffleOptions={shuffleOptions} setShuffleOptions={setShuffleOptions} startQuiz={startQuiz} globalDatabases={globalDatabases} removeDatabase={removeDatabase} keyboardNavEnabled={keyboardNavEnabled} setKeyboardNavEnabled={setKeyboardNavEnabled} isAdaptiveMode={isAdaptiveMode} setIsAdaptiveMode={setIsAdaptiveMode} />}

            {/* 👤 TAB 5: PROFIL */}
            {dashboardTab === 'profile' && <SetupProfileTab theme={theme} currentUser={currentUser} profileUsername={profileUsername} userXP={userXP} currentStreak={currentStreak} longestStreak={longestStreak} totalQuestionsAnswered={totalQuestionsAnswered} streakFreezeLeft={streakFreezeLeft} lastActiveDate={lastActiveDate} exportData={exportData} importData={importData} triggerToast={triggerToast} achievementFilter={achievementFilter} setAchievementFilter={setAchievementFilter} achievements={achievements} />}

            {/* Box 3: History & Leaderboard (Beranda) */}

            {/* Box: SRS Dashboard */}
            {dashboardTab === 'srs' && <SetupSRSTab theme={theme} srs={srs} triggerToast={triggerToast} srsAnswerRevealed={srsAnswerRevealed} setSrsAnswerRevealed={setSrsAnswerRevealed} srsPendingRating={srsPendingRating} setSrsPendingRating={setSrsPendingRating} />}

            {/* Box: Study Room Dashboard */}
            {dashboardTab === 'mabar' && (
              <MabarMain 
                currentUser={currentUser} 
                availableTopics={Object.keys(questionDatabase)} 
                questionDatabase={questionDatabase} 
                initialRoomCode={guestRoomCode} 
              />
            )}

            {dashboardTab === 'notes' && <SetupNotesTab theme={theme} studyRoom={studyRoom} triggerToast={triggerToast} setEditingNote={setEditingNote} setNoteRefQuestion={setNoteRefQuestion} setIsNoteModalOpen={setIsNoteModalOpen} setBankFilter={setBankFilter} setCurrentQuiz={setCurrentQuiz} setUserAnswers={setUserAnswers} setDoubtStatus={setDoubtStatus} setIsRevealed={setIsRevealed} setCurrentIndex={setCurrentIndex} setQuizSecondsLeft={setQuizSecondsLeft} setXpHistory={setXpHistory} setOpenReviewIndices={setOpenReviewIndices} setUnlockedHints={setUnlockedHints} setHasSubmittedLeaderboard={setHasSubmittedLeaderboard} setLastQuizScore={setLastQuizScore} setIsDailyChallenge={setIsDailyChallenge} setQuizTimerActive={setQuizTimerActive} setScreen={setScreen} setShowSidebar={setShowSidebar} bankFilter={bankFilter} startBookmarkPractice={startBookmarkPractice} userXP={userXP} activeQuizSessionIdRef={activeQuizSessionIdRef} hasRecordedLeaderboard={hasRecordedLeaderboard} />}

            <NoteEditorModal
              theme={theme}
              isOpen={isNoteModalOpen}
              editingNote={editingNote}
              noteRefQuestion={noteRefQuestion}
              onClose={() => setIsNoteModalOpen(false)}
              onCreateNote={studyRoom.createNote}
              onUpdateNote={studyRoom.updateNote}
              onSuccess={(msg) => triggerToast(msg, '📝')}
              onError={(msg) => triggerToast(msg, '❌')}
            />

            {/* === LAPORAN (ADMIN ONLY) === */}
            {dashboardTab === 'reports' && (
              <div className="lg:col-span-12 p-6 rounded-2xl transition-all duration-300 border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Laporan Pengguna</h2>
                    <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Tinjau laporan terkait soal dari pengguna</p>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  {adminReports.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-20 text-slate-400" />
                      <p className="text-sm font-bold text-slate-500">Belum ada laporan soal saat ini.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {adminReports.map((report) => (
                        <div key={report.id} className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                              {report.issue_type}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {new Date(report.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="mb-2">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bank Soal: {report.question_bank_name}</h4>
                            <p className={`text-sm font-bold line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                              {report.question_text}
                            </p>
                          </div>
                          {report.description && (
                            <div className="mt-3 p-3 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 text-xs text-slate-600 dark:text-slate-300">
                              <span className="font-bold">Keterangan:</span> {report.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Box 4: Analysis Dashboard */}
            {dashboardTab === 'analysis' && (
              <div className={`lg:col-span-12 p-6 rounded-2xl transition-all duration-300 border ${
                theme === 'dark'
                  ? 'bg-slate-900/45 border-white/[0.08] shadow-2xl backdrop-blur-md'
                  : 'bg-white/70 border-slate-200/60 shadow-sm backdrop-blur-md'
              }`}>
                <div className="flex items-center justify-between gap-4 mb-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-indigo-500">
                    📊 Analisis Performa Belajar
                  </h2>
                </div>
                
                <DashboardCharts quizHistory={quizHistory} theme={theme} />
              </div>
            )}
            </React.Suspense>
          </div>
        )}

        {/* === ACTIVE CBT SIMULATOR SCREEN === */}
        {screen === 'quiz' && currentQuiz.length > 0 && <QuizScreen theme={theme} currentQuiz={currentQuiz} currentIndex={currentIndex} userAnswers={userAnswers} doubtStatus={doubtStatus} isRevealed={isRevealed} quizSecondsLeft={quizSecondsLeft} keyboardNavEnabled={keyboardNavEnabled} isAdaptiveMode={isAdaptiveMode} currentDifficulty={currentDifficulty} aiPanelOpen={aiPanelOpen} aiLoading={aiLoading} aiExplanation={aiExplanation} aiFollowUp={aiFollowUp} aiMode={aiMode} mobileQuizNavOpen={mobileQuizNavOpen} studyRoom={studyRoom} currentUser={currentUser} triggerToast={triggerToast} copyQuestionToClipboard={copyQuestionToClipboard} setLightboxImage={setLightboxImage} selectAnswer={selectAnswer} handleAIRequest={handleAIRequest} navigateQuestion={navigateQuestion} checkAnswerNow={checkAnswerNow} toggleDoubt={toggleDoubt} handleNextQuestion={handleNextQuestion} openFinishModal={openFinishModal} unlockedHints={unlockedHints} setMobileQuizNavOpen={setMobileQuizNavOpen} setUserAnswers={setUserAnswers} setUnlockedHints={setUnlockedHints} setModalTitle={setModalTitle} setModalDesc={setModalDesc} setModalAction={setModalAction} setModalOpen={setModalOpen} setAiFollowUp={setAiFollowUp} setCurrentIndex={setCurrentIndex} setDoubtStatus={setDoubtStatus} exitQuiz={exitQuiz} toggleFullscreen={toggleFullscreen} isFullscreen={isFullscreen} answerNotes={answerNotes} openNotePopup={openNotePopup} selectedDatabases={selectedDatabases} userXP={userXP} currentStreak={currentStreak} />}

        {/* === RESULT & ANALYTICS SUMMARY SCREEN === */}
        {screen === 'result' && currentQuiz.length > 0 && <ResultScreen theme={theme} currentQuiz={currentQuiz} userAnswers={userAnswers} studyRoom={studyRoom} currentUser={currentUser} openNotePopup={openNotePopup} answerNotes={answerNotes} setScreen={setScreen} setDashboardTab={setDashboardTab} selectedDatabases={selectedDatabases} submitScoreToLeaderboard={submitScoreToLeaderboard} lastQuizScore={lastQuizScore} setLightboxImage={setLightboxImage} setReportModal={setReportModal} startQuiz={startQuiz} shareResult={shareResult} srs={srs} hasSubmittedLeaderboard={hasSubmittedLeaderboard} isLeaderboardLoading={isLeaderboardLoading} analytics={analytics} weaknessesList={weaknessesList} openReviewIndices={openReviewIndices} toggleReviewAccordion={toggleReviewAccordion} />}

      </div>

      {/* Floating XP Gain/Loss Indicator */}
      {floatingXP && (
        <div
          className={`fixed pointer-events-none z-50 font-mono font-extrabold text-sm sm:text-base animate-ping transition-all transform -translate-x-1/2 -translate-y-1/2 ${
            floatingXP.isBenar ? 'text-emerald-500 shadow-emerald-500/20' : 'text-rose-500 shadow-rose-500/20'
          }`}
          style={{ left: floatingXP.x, top: floatingXP.y }}
        >
          {floatingXP.text}
        </div>
      )}

      {/* Dynamic Toast alerts */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full px-4 animate-slide-up">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-full px-5 py-3 shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <span className="text-base flex-shrink-0">{toastMessage.icon}</span>
            <p className="flex-1 text-slate-100">{toastMessage.text}</p>
          </div>
        </div>
      )}

      {/* Confirmation Modal overlay */}
      <ConfirmModal
        isOpen={modalOpen}
        theme={theme}
        title={modalTitle}
        description={modalDesc}
        onConfirm={modalAction}
        onClose={() => setModalOpen(false)}
      />

      {/* Detail Riwayat Modal overlay */}
      {selectedHistoryDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl animate-pop-up overflow-hidden ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex-shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                  <span>🏆 Detail Evaluasi Kuis</span>
                  <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2 py-0.5 rounded-full capitalize">
                    {selectedHistoryDetail.mode === 'simulasi' ? 'Simulasi' : 'Sequential'}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  Dikerjakan pada {new Date(selectedHistoryDetail.date).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistoryDetail(null)}
                className={`p-1.5 rounded-lg border transition-all hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                  theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Score & Accuracies Box */}
              <div className={`grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl border ${
                theme === 'dark' ? 'bg-slate-950/30 border-slate-800/80' : 'bg-slate-50 border-slate-200/60'
              }`}>
                {/* Score Circle */}
                <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
                  <span className="text-3xl font-black text-indigo-500">{selectedHistoryDetail.score}</span>
                  <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest mt-1">Skor Akhir</span>
                </div>

                <div className="text-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <span className="block text-xl font-black text-emerald-500">✔ {selectedHistoryDetail.correct}</span>
                  <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Jawaban Benar</span>
                </div>

                <div className="text-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <span className="block text-xl font-black text-rose-500">✘ {selectedHistoryDetail.wrong}</span>
                  <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Jawaban Salah</span>
                </div>

                <div className="text-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <span className="block text-xl font-black text-slate-400">∅ {selectedHistoryDetail.empty}</span>
                  <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Tidak Dijawab</span>
                </div>

                <div className="col-span-2 sm:col-span-1 text-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <span className="block text-xl font-black text-indigo-500">{selectedHistoryDetail.total}</span>
                  <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Total Soal</span>
                </div>
              </div>

              {/* Roasting Feedback */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                theme === 'dark' ? 'bg-amber-500/5 border-amber-500/10' : 'bg-amber-500/5 border-amber-500/20'
              }`}>
                <span className="text-xl flex-shrink-0">💬</span>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Evaluasi Akademis:</h4>
                  <p className="text-xs italic font-semibold text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                    "{getFeedbackForScore(selectedHistoryDetail.score)}"
                  </p>
                </div>
              </div>

              {/* Question list section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    Review Soal & Pembahasan Lengkap
                  </h3>

                  {selectedHistoryDetail.questions && selectedHistoryDetail.questions.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const allOpen: Record<number, boolean> = {};
                          selectedHistoryDetail.questions?.forEach((_, i) => {
                            allOpen[i] = true;
                          });
                          setOpenHistoryReviewIndices(allOpen);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                          theme === 'dark' ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                        }`}
                      >
                        Buka Semua
                      </button>
                      <button
                        onClick={() => setOpenHistoryReviewIndices({})}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                          theme === 'dark' ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                        }`}
                      >
                        Tutup Semua
                      </button>
                    </div>
                  )}
                </div>

                {!selectedHistoryDetail.questions || selectedHistoryDetail.questions.length === 0 ? (
                  <div className="text-center p-8 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/20">
                    <HelpCircle className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Detail Kunci & Pembahasan Tidak Tersedia
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[480px] mx-auto leading-relaxed">
                      Catatan ini berasal dari sesi terdahulu sebelum pembaruan sistem. Riwayat di masa mendatang akan mencatat dan menyimpan soal-soal secara utuh agar bisa Anda pelajari kembali di sini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedHistoryDetail.questions.map((q, idx) => {
                      const userAns = selectedHistoryDetail.userAnswers ? selectedHistoryDetail.userAnswers[idx] : null;
                      const isCorrect = isUserAnswerCorrect(userAns, q);
                      const isOpen = !!openHistoryReviewIndices[idx];

                      let statusBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                          Tidak Dijawab
                        </span>
                      );

                      if (userAns !== null && userAns !== undefined) {
                        statusBadge = isCorrect ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Benar
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            Salah
                          </span>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border overflow-hidden transition-all ${
                            theme === 'dark' ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200/80 shadow-sm'
                          }`}
                        >
                          {/* Accordion Header */}
                          <div
                            onClick={() => {
                              setOpenHistoryReviewIndices((prev) => ({
                                ...prev,
                                [idx]: !prev[idx]
                              }));
                            }}
                            className={`flex items-center justify-between gap-4 p-4 cursor-pointer transition-colors ${
                              theme === 'dark' ? 'hover:bg-slate-800/15' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-bold text-slate-400 flex-shrink-0">
                                Soal {idx + 1}
                              </span>
                              {statusBadge}
                              <p className="text-xs font-semibold truncate text-slate-700 dark:text-slate-300">
                                {q.pertanyaan.replace(/<[^>]*>/g, '').slice(0, 80)}...
                              </p>
                            </div>

                            <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-indigo-500' : ''
                            }`} />
                          </div>

                          {/* Accordion Body */}
                          {isOpen && (
                            <div className="p-5 border-t border-slate-200/50 dark:border-slate-850/60 bg-slate-500/[0.01] space-y-4 animate-slide-down">
                              <div className="text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
                                {renderHtmlText(q.pertanyaan)}
                                {renderQuestionImage(q, setLightboxImage, theme)}
                              </div>

                              {/* Question options visual list OR Short Answer Review */}
                              {q.pilihan && q.pilihan.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2.5">
                                  {q.pilihan.map((opt, oIdx) => {
                                    const letters = ['A', 'B', 'C', 'D', 'E'];
                                    const isCorrectOption = oIdx === ['A', 'B', 'C', 'D', 'E'].indexOf(getCorrectLetterForQuestion(q));
                                    const isUserSelected = opt === userAns;

                                    let optClass = theme === 'dark' ? 'bg-slate-900/10 border-slate-800/50 text-slate-400' : 'bg-slate-50/50 border-slate-200/60 text-slate-500';
                                    let letterBadgeClass = theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500';

                                    if (isCorrectOption) {
                                      optClass = 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 font-bold';
                                      letterBadgeClass = 'bg-emerald-500 border-emerald-500 text-white';
                                    } else if (isUserSelected && !isCorrect) {
                                      optClass = 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-bold';
                                      letterBadgeClass = 'bg-rose-500 border-rose-500 text-white';
                                    }

                                    return (
                                      <div
                                        key={oIdx}
                                        className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${optClass}`}
                                      >
                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-black text-xs flex-shrink-0 ${letterBadgeClass}`}>
                                          {letters[oIdx]}
                                        </div>
                                        <div className="flex-1 mt-0.5 text-xs font-semibold leading-relaxed">
                                          {renderHtmlText(opt)}
                                        </div>
                                        {isCorrectOption && (
                                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded-full bg-emerald-500/5 flex-shrink-0">
                                            Kunci
                                          </span>
                                        )}
                                        {isUserSelected && (
                                          <span className={`text-[9px] font-black uppercase tracking-wider border px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                            isCorrect ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-rose-500 border-rose-500/20 bg-rose-500/5'
                                          }`}>
                                            Pilihan Anda
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className={`p-3 rounded-xl border flex flex-col gap-1 text-xs ${
                                    isCorrect 
                                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400'
                                  }`}>
                                    <span className="font-extrabold uppercase text-[10px] tracking-wider opacity-80">Jawaban Anda:</span>
                                    <span className="font-semibold">{userAns || <span className="italic">Tidak menjawab</span>}</span>
                                  </div>
                                  <div className="p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.02] flex flex-col gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                    <span className="font-extrabold uppercase text-[10px] tracking-wider opacity-80">Jawaban Benar:</span>
                                    <span className="font-bold">{q.jawaban_benar}</span>
                                  </div>
                                </div>
                              )}

                              {/* Explanation block */}
                              <div className="pt-3 border-t border-slate-200/40 dark:border-slate-850/50">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-500 mb-1.5 flex items-center gap-1">
                                  <span>💡 Pembahasan Lengkap:</span>
                                </h4>
                                <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                  {q.pembahasan ? renderHtmlText(q.pembahasan) : 'Tidak ada penjelasan khusus.'}
                                </p>
                              </div>

                              {/* Catatan yang sudah ada (inline) di riwayat */}
                              {answerNotes[generateQuestionFingerprint(q)] && (
                                <div
                                  className="mt-3 rounded-xl p-3 text-xs leading-relaxed cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const correctLetter = getCorrectLetterForQuestion(q);
                                    const correctOptionText = q.pilihan ? (q.pilihan[['A', 'B', 'C', 'D', 'E'].indexOf(correctLetter)] || q.jawaban_benar) : q.jawaban_benar;
                                    openNotePopup(
                                      q.pertanyaan,
                                      userAns !== null && userAns !== undefined ? `${userAns}` : '(Tidak Dijawab)',
                                      `${correctLetter}. ${correctOptionText}`,
                                      isCorrect
                                    );
                                  }}
                                  style={{
                                    backgroundColor: theme === 'dark' ? 'rgb(245 158 11 / 0.08)' : 'rgb(254 243 199)',
                                    border: `1px solid ${theme === 'dark' ? 'rgb(245 158 11 / 0.2)' : 'rgb(253 224 71 / 0.5)'}`,
                                    color: theme === 'dark' ? '#fcd34d' : '#92400e',
                                  }}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5 font-semibold">
                                      <StickyNote className="w-3.5 h-3.5" />
                                      Catatan Belajar:
                                    </div>
                                    <span className="text-[10px] opacity-75 underline">Edit</span>
                                  </div>
                                  <p className="whitespace-pre-wrap">{answerNotes[generateQuestionFingerprint(q)]}</p>
                                </div>
                              )}

                              {/* Question metadata (competencies, etc) */}
                              {q.metadata && (
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                                  {q.metadata.sub_kompetensi_klinis && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                      Topic: {q.metadata.sub_kompetensi_klinis}
                                    </span>
                                  )}
                                  {q.metadata.tingkat_kognitif && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                      Kognitif: {q.metadata.tingkat_kognitif}
                                    </span>
                                  )}
                                  {q.metadata.tingkat_kesulitan && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                      Kesulitan: {q.metadata.tingkat_kesulitan}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Action toolbar in History detail */}
                              {currentUser && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200/50 dark:border-slate-700 flex gap-2 justify-end mt-3 -mx-5 -mb-5 rounded-b-xl">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (studyRoom.isBookmarked(q)) {
                                        studyRoom.removeBookmark(generateQuestionFingerprint(q));
                                      } else {
                                        studyRoom.addBookmark(q, selectedHistoryDetail.files?.[0] || 'Kuis');
                                      }
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                      studyRoom.isBookmarked(q)
                                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    <Bookmark className={`w-3.5 h-3.5 ${studyRoom.isBookmarked(q) ? 'fill-current' : ''}`} />
                                    Bookmark Soal Ini
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const correctLetter = getCorrectLetterForQuestion(q);
                                      const correctOptionText = q.pilihan ? (q.pilihan[['A', 'B', 'C', 'D', 'E'].indexOf(correctLetter)] || q.jawaban_benar) : q.jawaban_benar;
                                      openNotePopup(
                                        q.pertanyaan,
                                        userAns !== null && userAns !== undefined ? `${userAns}` : '(Tidak Dijawab)',
                                        `${correctLetter}. ${correctOptionText}`,
                                        isCorrect
                                      );
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                      answerNotes[generateQuestionFingerprint(q)]
                                        ? 'border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    {answerNotes[generateQuestionFingerprint(q)] ? (
                                      <>
                                        <StickyNote className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                                        <span>Edit Catatan</span>
                                      </>
                                    ) : (
                                      <>
                                        <StickyNote className="w-3.5 h-3.5" />
                                        <span>Buat Catatan</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-end flex-shrink-0 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => setSelectedHistoryDetail(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/10 hover:scale-[1.02] active:scale-95 cursor-pointer transition-all"
              >
                Tutup Evaluasi
              </button>
            </div>
          </div>
        </div>
      )}

      <IosInstallModal isOpen={showIosInstallModal} theme={theme} onClose={() => setShowIosInstallModal(false)} />

      <LightboxModal imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />

      <PasteJsonModal
        theme={theme}
        isOpen={pasteModalOpen}
        fileName={pasteFileName}
        onFileNameChange={setPasteFileName}
        content={pasteContent}
        onContentChange={setPasteContent}
        error={pasteError}
        onClose={() => setPasteModalOpen(false)}
        onSubmit={handlePasteSubmit}
      />

      </div>
    )}

    <ReportQuestionModal
      theme={theme}
      isOpen={reportModal.isOpen}
      issueType={reportIssueType}
      description={reportDescription}
      onIssueTypeChange={setReportIssueType}
      onDescriptionChange={setReportDescription}
      onClose={() => setReportModal({ isOpen: false, questionIndex: null })}
      onSubmit={submitReport}
    />

    <AchievementPopup
      theme={theme}
      achievements={achievements.newlyUnlocked}
      onDismiss={() => achievements.dismissNew()}
    />

    <MoveQuizModal
      theme={theme}
      quizModal={moveQuizModal}
      folders={[...globalCustomFolders, ...customFolders]}
      onMove={handleMoveQuiz}
      onClose={() => setMoveQuizModal(null)}
    />

    <AnswerNotePopup
      theme={theme}
      data={notePopupOpen}
      noteInput={noteInput}
      onNoteInputChange={setNoteInput}
      isSaving={noteSaving}
      existingNote={notePopupOpen ? answerNotes[generateQuestionFingerprint({ pertanyaan: notePopupOpen.questionText })] : undefined}
      onClose={() => setNotePopupOpen(null)}
      onSave={saveAnswerNote}
      onDelete={deleteAnswerNote}
    />

    </div>
  );
}
