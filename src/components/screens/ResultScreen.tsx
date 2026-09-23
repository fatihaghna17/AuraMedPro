import React, { useState } from 'react';
import { Activity, AlertCircle, Award, Bookmark, Brain, ChevronDown, FileText, Flag, Home, RefreshCw, RotateCcw, Share2, StickyNote, Camera, Sparkles } from 'lucide-react';
import { getCorrectLetterForQuestion, renderHtmlText, renderQuestionImage, isUserAnswerCorrect, getFeedbackForScore } from '../../utils/quizUtils';
import { generateQuestionFingerprint } from '../../utils/srsAlgorithm';
import { StoryCardModal } from '../StoryCardModal';
import { getSavedAvatarFrame } from '../../utils/avatarFrames';
import { getLevelInfo } from '../../utils/appHelpers';
import { formatQuestionForGemini, openGeminiTutor } from '../../utils/geminiTutor';

interface ResultScreenProps {
  theme: string;
  currentQuiz: any[];
  userAnswers: any[];
  studyRoom: any;
  currentUser: any;
  openNotePopup: any;
  answerNotes: Record<string, any>;
  setScreen: any;
  setDashboardTab: any;
  selectedDatabases: string[];
  submitScoreToLeaderboard: any;
  lastQuizScore: number;
  lastQuizXPGained?: number;
  setLightboxImage: any;

  startQuiz: any;
  shareResult: any;
  srs: any;
  hasSubmittedLeaderboard: boolean;
  isLeaderboardLoading: boolean;
  analytics: any;
  weaknessesList: any[];
  openReviewIndices: Record<number, boolean>;
  toggleReviewAccordion: any;
  setReportModal: any;
  quizMode?: string;
  profileUsername?: string;
  userXP?: number;
  currentStreak?: number;
  totalQuestionsAnswered?: number;
  userAngkatan?: string | null;
  triggerToast?: any;
  suddenDeathStreak?: number;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  theme, currentQuiz, userAnswers, studyRoom, currentUser, openNotePopup,
  answerNotes, setScreen, setDashboardTab, selectedDatabases,
  submitScoreToLeaderboard, lastQuizScore, lastQuizXPGained = 0, setLightboxImage, setReportModal, startQuiz, shareResult, srs, hasSubmittedLeaderboard, isLeaderboardLoading, analytics, weaknessesList, openReviewIndices, toggleReviewAccordion,
  quizMode = 'utuh',
  profileUsername = 'user',
  userXP = 0,
  currentStreak = 0,
  totalQuestionsAnswered = 0,
  userAngkatan = null,
  triggerToast,
  suddenDeathStreak = 0
}) => {
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const total = currentQuiz.length;
  const correct = userAnswers.filter((a, i) => isUserAnswerCorrect(a, currentQuiz[i])).length;
  const empty = userAnswers.filter((a) => a === null || a === undefined || a === '').length;
  const wrong = total - correct - empty;

  let ringPercentage = 0;
  let displayScore: string | number = lastQuizScore;
  let scoreSublabel = "Dari 100 poin";

  if (quizMode === 'suddendeath') {
    const streakAchieved = suddenDeathStreak || correct;
    ringPercentage = Math.min(100, Math.round((streakAchieved / 20) * 100));
    displayScore = `${streakAchieved} 🔥`;
    scoreSublabel = "Streak Benar (1 Nyawa)";
  } else if (quizMode === 'rmo') {
    const maxScore = total * 4;
    ringPercentage = maxScore > 0 ? Math.max(0, Math.min(100, Math.round((lastQuizScore / maxScore) * 100))) : 0;
    displayScore = lastQuizScore > 0 ? `+${lastQuizScore}` : lastQuizScore;
    scoreSublabel = `Maks. ${maxScore} Poin (RMO)`;
  } else if (quizMode === 'blok') {
    ringPercentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    displayScore = `${lastQuizScore}`;
    scoreSublabel = `Dari ${total} Soal (Ujian Blok)`;
  } else {
    ringPercentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    displayScore = ringPercentage;
    scoreSublabel = "Dari 100 poin";
  }

  return (
    <>
      <div className="w-full max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-fade-in px-3.5 sm:px-6 pb-28 pt-2 min-w-0 overflow-x-hidden">
        
        {/* Main Score Ring card */}
        <div className={`w-full max-w-full min-w-0 overflow-hidden p-4 sm:p-8 rounded-3xl transition-all duration-300 border text-center relative ${
          theme === 'dark'
            ? 'bg-slate-900/45 border-white/[0.08] shadow-2xl backdrop-blur-md'
            : 'bg-white/70 border-slate-200/60 shadow-sm backdrop-blur-md'
        }`}>
              
              {/* Radial Animated Circular meter */}
              <div className="relative w-44 h-44 mx-auto mb-6 flex items-center justify-between flex-col animate-pop-in">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="70" 
                    fill="none" 
                    stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} 
                    strokeWidth="8"
                  />
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="70" 
                    fill="none" 
                    stroke="rgb(99, 102, 241)" 
                    strokeWidth="8"
                    strokeDasharray="439.6"
                    strokeDashoffset={439.6 - (ringPercentage / 100) * 439.6}
                    strokeLinecap="round"
                    className="transition-all duration-[1200ms] ease-out-sine"
                  />
                </svg>

                <div className="flex flex-col items-center justify-center h-full pt-1.5">
                  <span className="text-4xl font-extrabold tracking-tight text-indigo-500">
                    {displayScore}
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mt-1">
                    {scoreSublabel}
                  </span>
                </div>
              </div>

              {/* Roasting Feedback header block */}
              {(() => {
                const evalPercentage = total > 0 ? Math.round((correct / total) * 100) : 0;
                const feedbackText = getFeedbackForScore(evalPercentage);

                let titleText = "🔴 Zona Darurat Klinis";
                let badgeColor = "bg-rose-500/10 text-rose-500 border-rose-500/20";
                
                if (evalPercentage >= 86) {
                  titleText = "🌟 Zona Dewa Akademis!";
                  badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                } else if (evalPercentage >= 65) {
                  titleText = "🟢 Zona Aman & Lulus";
                  badgeColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                } else if (evalPercentage >= 40) {
                  titleText = "🟠 Zona Kritis Remedial";
                  badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                }

                return (
                  <div className="space-y-4 animate-fade-in-up animation-delay-100">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase border ${badgeColor}`}>
                      {titleText}
                    </span>

                    <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 max-w-xl mx-auto leading-relaxed">
                      &quot;{feedbackText}&quot;
                    </h2>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      {quizMode === 'rmo' ? (
                        <span>Simulasi RMO: Skor <strong className="text-amber-500">{lastQuizScore}</strong> (Benar <strong className="text-emerald-500">{correct}</strong> [+4], Salah <strong className="text-rose-500">{wrong}</strong> [-1], Kosong <strong className="text-slate-400">{empty}</strong> [0])</span>
                      ) : quizMode === 'blok' ? (
                        <span>Simulasi Ujian Blok: <strong className="text-emerald-500">{correct}</strong> benar dari total <strong className="text-slate-700 dark:text-slate-200">{total}</strong> butir soal</span>
                      ) : (
                        <span>(Anda menjawab benar <strong className="text-slate-700 dark:text-slate-200">{correct}</strong> dari total <strong className="text-slate-700 dark:text-slate-200">{total}</strong> soal tryout)</span>
                      )}
                    </p>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mt-6 sm:mt-8 w-full max-w-lg mx-auto min-w-0">
                <div className={`p-2.5 sm:p-3.5 rounded-xl border min-w-0 text-center animate-fade-in-up animation-delay-150 ${
                  theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-100/50 border-slate-200/60'
                }`}>
                  <div className="text-lg sm:text-xl font-extrabold text-emerald-500">
                    {correct}
                  </div>
                  <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mt-0.5 sm:mt-1 truncate">
                    {quizMode === 'rmo' ? `Benar (+${correct * 4})` : 'Benar'}
                  </div>
                </div>

                <div className={`p-2.5 sm:p-3.5 rounded-xl border min-w-0 text-center animate-fade-in-up animation-delay-200 ${
                  theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-100/50 border-slate-200/60'
                }`}>
                  <div className="text-lg sm:text-xl font-extrabold text-rose-500">
                    {wrong}
                  </div>
                  <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mt-0.5 sm:mt-1 truncate">
                    {quizMode === 'rmo' ? `Salah (-${wrong})` : 'Salah'}
                  </div>
                </div>

                <div className={`p-2.5 sm:p-3.5 rounded-xl border min-w-0 text-center animate-fade-in-up animation-delay-250 ${
                  theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-100/50 border-slate-200/60'
                }`}>
                  <div className="text-lg sm:text-xl font-extrabold text-slate-400 dark:text-slate-500">
                    {empty}
                  </div>
                  <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mt-0.5 sm:mt-1 truncate">
                    Kosong (0)
                  </div>
                </div>

                <div className={`p-2.5 sm:p-3.5 rounded-xl border min-w-0 text-center animate-fade-in-up animation-delay-300 ${
                  theme === 'dark' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200/80'
                }`}>
                  <div className="text-lg sm:text-xl font-extrabold text-amber-500">
                    +{lastQuizXPGained || 0}
                  </div>
                  <div className="text-[9px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1 truncate">
                    {quizMode === 'rmo' ? 'XP (×20)' : quizMode === 'blok' ? 'XP (×10)' : 'XP Masuk'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2.5 justify-center mt-6 sm:mt-8 w-full max-w-xl mx-auto min-w-0 animate-fade-in-up animation-delay-350">
                <button
                  onClick={() => setIsStoryModalOpen(true)}
                  className="sm:col-span-2 lg:flex-initial w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 rounded-2xl text-xs font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 text-white shadow-xl shadow-purple-500/25 transition-all duration-200 active:scale-98 cursor-pointer hover:opacity-95 min-w-0"
                >
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">Bagikan Hasil & Rapor (Story 9:16)</span>
                </button>

                <button
                  onClick={() => startQuiz()}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold bg-indigo-500 text-white shadow-md shadow-indigo-500/10 transition-all duration-200 active:scale-98 cursor-pointer hover:bg-indigo-600 min-w-0"
                >
                  <RotateCcw className="w-4 h-4 fill-current shrink-0" />
                  <span>Mulai Ulang Tryout</span>
                </button>

                <button
                  onClick={() => setScreen('setup')}
                  className={`w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold border transition-all duration-200 active:scale-98 cursor-pointer min-w-0 ${
                    theme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Home className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Kembali ke Menu Utama</span>
                </button>

                {userAnswers.filter((a, i) => a !== null && !isUserAnswerCorrect(a, currentQuiz[i])).length > 0 && (
                  <button
                    onClick={() => {
                      setScreen('setup');
                      setDashboardTab('srs');
                      srs.startReview();
                    }}
                    className="sm:col-span-2 lg:flex-initial w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold bg-rose-500 text-white shadow-md shadow-rose-500/10 transition-all duration-200 active:scale-98 cursor-pointer hover:bg-rose-600 min-w-0"
                  >
                    <Brain className="w-4 h-4 shrink-0" />
                    <span>Review Salah di SRS</span>
                  </button>
                )}
              </div>

            </div>

            {/* Leaderboard Submission Box */}
            {currentUser && selectedDatabases.length === 1 && (
              <div className={`p-4 sm:p-6 rounded-3xl transition-all duration-300 border w-full max-w-full min-w-0 overflow-hidden animate-fade-in-up animation-delay-400 ${
                theme === 'dark'
                  ? 'bg-slate-900/45 border-white/[0.08] shadow-2xl backdrop-blur-md'
                  : 'bg-white/70 border-slate-200/60 shadow-sm backdrop-blur-md'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Award className="w-8 h-8 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider">🏆 LEADERBOARD FILE SOAL</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
                        Apakah Anda ingin mempublikasikan skor Anda ({lastQuizScore}%) ke papan peringkat untuk file <strong className="break-all">{selectedDatabases[0]}</strong>?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    {hasSubmittedLeaderboard ? (
                      <span className="w-full sm:w-auto text-center px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Skor Terkirim!
                      </span>
                    ) : (
                      <button
                        onClick={submitScoreToLeaderboard}
                        disabled={isLeaderboardLoading}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-all cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        {isLeaderboardLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Mengirim...</span>
                          </>
                        ) : 'Kirim Skor'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Battle Report / Analytics dashboard */}
            {analytics.hasMetadata && (
              <div className={`p-4 sm:p-6 rounded-3xl transition-all duration-300 border space-y-6 w-full max-w-full min-w-0 overflow-hidden animate-fade-in-up animation-delay-450 ${
                theme === 'dark'
                  ? 'bg-slate-900/45 border-white/[0.08] shadow-2xl backdrop-blur-md'
                  : 'bg-white/70 border-slate-200/60 shadow-sm backdrop-blur-md'
              }`}>
                <div className="flex items-center gap-2 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-500">
                    BATTLE REPORT & METADATA PERFORMA
                  </h3>
                </div>

                {/* Sub-competencies progress list */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                      ⚔️ Analisis Sub-Kompetensi
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.competencies).map(([name, data]: [string, any]) => {
                        const pct = Math.round((data.correct / data.total) * 100);
                        const progressColor = pct >= 80 
                          ? 'bg-emerald-500' 
                          : pct >= 65 
                          ? 'bg-indigo-500' 
                          : 'bg-rose-500';

                        return (
                          <div key={name} className="flex items-center gap-2.5 sm:gap-4 text-xs font-semibold">
                            <span className="w-24 sm:w-36 truncate text-[11px] sm:text-xs shrink-0" title={name}>{name}</span>
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-9 sm:w-10 text-right font-extrabold text-[11px] sm:text-xs shrink-0">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cognitives list */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                      🧠 Analisis Kemampuan Kognitif
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.cognitives).map(([name, data]: [string, any]) => {
                        const pct = Math.round((data.correct / data.total) * 100);
                        const progressColor = pct >= 80 
                          ? 'bg-emerald-500' 
                          : pct >= 65 
                          ? 'bg-indigo-500' 
                          : 'bg-rose-500';

                        return (
                          <div key={name} className="flex items-center gap-2.5 sm:gap-4 text-xs font-semibold">
                            <span className="w-24 sm:w-36 truncate text-[11px] sm:text-xs shrink-0">{name}</span>
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-9 sm:w-10 text-right font-extrabold text-[11px] sm:text-xs shrink-0">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Difficulties progress list */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                      🛡️ Performa Tingkat Kesulitan
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.difficulties).map(([name, data]: [string, any]) => {
                        const pct = Math.round((data.correct / data.total) * 100);
                        const progressColor = pct >= 80 
                          ? 'bg-emerald-500' 
                          : pct >= 65 
                          ? 'bg-indigo-500' 
                          : 'bg-rose-500';

                        return (
                          <div key={name} className="flex items-center gap-2.5 sm:gap-4 text-xs font-semibold">
                            <span className="w-24 sm:w-36 truncate text-[11px] sm:text-xs shrink-0">{name}</span>
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-9 sm:w-10 text-right font-extrabold text-[11px] sm:text-xs shrink-0">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Quest log: remedial lists */}
                <div className="border-t border-slate-200/40 dark:border-slate-800/40 pt-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-500 mb-3 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    📜 Quest Log: Misi Remedial Khusus
                  </h4>
                  
                  {weaknessesList.length > 0 ? (
                    <div className="space-y-3">
                      {weaknessesList.map((w) => (
                        <div
                          key={w.name}
                          className="flex items-start gap-3 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.02]"
                        >
                          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-rose-500 text-white font-extrabold text-[10px] mt-0.5 flex-shrink-0">
                            !
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-extrabold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                              Misi Remedial: {w.name}
                            </h5>
                            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                              Akurasi diagnosis Anda pada topik ini hanya <strong>{w.percentage}%</strong> ({w.correct} dari {w.total} benar). Kami merekomendasikan membaca ulang jurnal dan panduan literatur referensi klinis terkait.
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02]">
                      <div className="w-6 h-6 rounded-xl flex items-center justify-center bg-emerald-500 text-white font-extrabold text-xs flex-shrink-0">
                        🏆
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                          Misi Selesai Tanpa Cela!
                        </h5>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          Tidak ditemukan kelemahan mayor dengan akurasi di bawah 70% pada sesi tryout ini. Pertahankan ketajaman klinis diagnosis Anda!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Accordion Review Section per question */}
            <div className="space-y-4 w-full max-w-full min-w-0 animate-fade-in-up animation-delay-500">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                Daftar Pembahasan & Kunci Jawaban Soal
              </h3>

              <div className="space-y-3 w-full max-w-full min-w-0">
                {currentQuiz.map((q, idx) => {
                  const userAnswer = userAnswers[idx];
                  const isCorrect = isUserAnswerCorrect(userAnswer, q);
                  const isOpen = !!openReviewIndices[idx];

                  let statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                      Kosong
                    </span>
                  );

                  if (userAnswer !== null) {
                    statusBadge = isCorrect ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                        Benar
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
                        Salah
                      </span>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      style={{ animationDelay: `${Math.min(idx * 35, 350)}ms` }}
                      className={`rounded-xl border overflow-hidden transition-all w-full max-w-full min-w-0 animate-fade-in-up ${
                        theme === 'dark' ? 'bg-slate-900/30 border-slate-850' : 'bg-white border-slate-200/60 shadow-sm'
                      }`}
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={() => toggleReviewAccordion(idx)}
                        className={`flex items-center justify-between gap-2.5 sm:gap-4 p-3 sm:p-4 cursor-pointer transition-all ${
                          theme === 'dark' ? 'hover:bg-slate-800/15' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
                          <span className="text-xs font-extrabold text-slate-400 flex-shrink-0">
                            Soal {idx + 1}
                          </span>
                          {statusBadge}
                          <p className="text-xs font-semibold truncate text-slate-700 dark:text-slate-300">
                            {q.pertanyaan.replace(/<[^>]*>/g, '').slice(0, 80)}...
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Tombol Catatan */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const correctLetter = getCorrectLetterForQuestion(q);
                              const correctOptionText = q.pilihan ? (q.pilihan[['A', 'B', 'C', 'D', 'E'].indexOf(correctLetter)] || q.jawaban_benar) : q.jawaban_benar;
                              openNotePopup(
                                q.pertanyaan,
                                userAnswer !== null ? `${userAnswer}` : '(Tidak Dijawab)',
                                `${correctLetter}. ${correctOptionText}`,
                                isCorrect
                              );
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer hover:scale-[1.05]"
                            title={answerNotes[generateQuestionFingerprint(q)] ? 'Lihat/Edit Catatan' : 'Tambah Catatan'}
                            style={{
                              backgroundColor: answerNotes[generateQuestionFingerprint(q)]
                                ? (theme === 'dark' ? 'rgb(245 158 11 / 0.15)' : 'rgb(245 158 11 / 0.1)')
                                : (isCorrect
                                  ? (theme === 'dark' ? 'rgb(51 65 85 / 0.5)' : 'rgb(241 245 249)')
                                  : 'rgb(245 158 11 / 0.15)'),
                              color: answerNotes[generateQuestionFingerprint(q)]
                                ? '#f59e0b'
                                : (isCorrect
                                  ? (theme === 'dark' ? '#94a3b8' : '#64748b')
                                  : '#f59e0b'),
                            }}
                          >
                            <StickyNote className="w-3.5 h-3.5" />
                            {answerNotes[generateQuestionFingerprint(q)] && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            )}
                          </button>

                          <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-indigo-500' : ''
                          }`} />
                        </div>
                      </div>

                      {/* Accordion Body */}
                      {isOpen && (
                        <div className="p-3.5 sm:p-5 border-t border-slate-200/50 dark:border-slate-850/60 bg-slate-500/[0.01] space-y-4 animate-slide-down w-full max-w-full min-w-0 overflow-hidden">
                          <div className="text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-100 break-words">
                            {renderHtmlText(q.pertanyaan)}
                            {renderQuestionImage(q, setLightboxImage, theme)}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const correctLetter = getCorrectLetterForQuestion(q);
                              const correctOptionText = q.pilihan ? (q.pilihan[['A', 'B', 'C', 'D', 'E'].indexOf(correctLetter)] || q.jawaban_benar) : q.jawaban_benar;

                              return userAnswer === null ? (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                  — Tidak Dijawab
                                </span>
                              ) : isCorrect ? (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  ✔ Pilihan Anda: {userAnswer}
                                </span>
                              ) : (
                                <>
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                    ✘ Pilihan Anda: {userAnswer}
                                  </span>
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    ✔ Kunci: {correctLetter}. {correctOptionText}
                                  </span>
                                </>
                              );
                            })()}
                          </div>

                          {/* Catatan yang sudah ada (inline) */}
                          {answerNotes[generateQuestionFingerprint(q)] && (
                            <div
                              className="mt-3 rounded-xl p-3 text-xs leading-relaxed cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                const correctLetter = getCorrectLetterForQuestion(q);
                                const correctOptionText = q.pilihan ? (q.pilihan[['A', 'B', 'C', 'D', 'E'].indexOf(correctLetter)] || q.jawaban_benar) : q.jawaban_benar;
                                openNotePopup(
                                  q.pertanyaan,
                                  userAnswer !== null ? `${userAnswer}` : '(Tidak Dijawab)',
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

                          <div className="pt-3 border-t border-slate-200/40 dark:border-slate-850/50">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-500 mb-1.5">
                              💡 Pembahasan:
                            </h4>
                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                              {q.pembahasan ? renderHtmlText(q.pembahasan) : 'Tidak ada uraian penjelasan.'}
                            </p>
                          </div>

                          {q.eliminasi_opsi && Object.keys(q.eliminasi_opsi).length > 0 && (
                            <div className="pt-2">
                              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                🔍 Analisis Pilihan Jawaban:
                              </h4>
                              <div className="grid grid-cols-1 gap-2">
                                {Object.entries(q.eliminasi_opsi)
                                  .sort(([a], [b]) => a.localeCompare(b))
                                  .map(([letter, rationale]) => {
                                    const matchesKey = letter.toUpperCase() === getCorrectLetterForQuestion(q).toUpperCase();
                                    const optIdx = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].indexOf(letter.toUpperCase());
                                    const optText = optIdx !== -1 && q.pilihan ? q.pilihan[optIdx] : null;

                                    return (
                                      <div
                                        key={letter}
                                        className={`flex items-start gap-3 p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                                          matchesKey
                                            ? 'bg-emerald-500/5 border-emerald-500/30 text-slate-800 dark:text-slate-200 ring-1 ring-emerald-500/10'
                                            : 'bg-slate-500/[0.01] border-slate-200/60 dark:border-slate-800/80 text-slate-600 dark:text-slate-400'
                                        }`}
                                      >
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] flex-shrink-0 mt-0.5 shadow-sm ${
                                          matchesKey ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                        }`}>
                                          {letter}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          {optText && (
                                            <div className="font-bold text-[11px] text-slate-800 dark:text-slate-200 mb-0.5 leading-snug">
                                              {renderHtmlText(optText)}
                                            </div>
                                          )}
                                          <div className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                                            {renderHtmlText(rationale)}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bookmark & Notes Actions */}
                      {isOpen && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200/50 dark:border-slate-700 flex flex-wrap gap-2 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const prompt = formatQuestionForGemini(q, idx, userAnswer, true);
                              openGeminiTutor(prompt, triggerToast);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-indigo-300 dark:border-indigo-700/60 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer"
                            title="Salin soal & pembahasan ke Gemini AI"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            Tanya Gemini
                          </button>

                          {currentUser && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (studyRoom.isBookmarked(q)) {
                                    studyRoom.removeBookmark(generateQuestionFingerprint(q));
                                  } else {
                                    studyRoom.addBookmark(q, selectedDatabases[0] || 'Kuis');
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
                                    userAnswer !== null ? `${userAnswer}` : '(Tidak Dijawab)',
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReportModal({ isOpen: true, questionIndex: idx });
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                              >
                                <Flag className="w-3.5 h-3.5" />
                                Laporkan
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Story Card 9:16 Generator Modal */}
          {isStoryModalOpen && (
            <StoryCardModal
              isOpen={isStoryModalOpen}
              onClose={() => setIsStoryModalOpen(false)}
              username={profileUsername}
              userLevel={getLevelInfo(userXP).level}
              userRankTitle={getLevelInfo(userXP).rank}
              userXP={userXP}
              currentStreak={currentStreak}
              totalQuestionsAnswered={totalQuestionsAnswered}
              angkatan={userAngkatan}
              frameId={getSavedAvatarFrame()}
              quizResult={{
                score: lastQuizScore,
                correct,
                total,
                quizMode,
                suddenDeathStreak: suddenDeathStreak || correct
              }}
              theme={theme}
              triggerToast={triggerToast}
            />
          )}
    </>
  );
};
