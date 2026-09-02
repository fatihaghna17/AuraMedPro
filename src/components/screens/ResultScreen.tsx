import React from 'react';
import { Activity, AlertCircle, Award, Bookmark, Brain, ChevronDown, FileText, Flag, Home, RefreshCw, RotateCcw, Share2, StickyNote } from 'lucide-react';
import { getCorrectLetterForQuestion, renderHtmlText, renderQuestionImage, isUserAnswerCorrect, getFeedbackForScore } from '../../utils/quizUtils';
import { generateQuestionFingerprint } from '../../utils/srsAlgorithm';


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

}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  theme, currentQuiz, userAnswers, studyRoom, currentUser, openNotePopup,
  answerNotes, setScreen, setDashboardTab, selectedDatabases,
  submitScoreToLeaderboard, lastQuizScore, setLightboxImage, setReportModal, startQuiz, shareResult, srs, hasSubmittedLeaderboard, isLeaderboardLoading, analytics, weaknessesList, openReviewIndices, toggleReviewAccordion
}) => {
  return (
    <>
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            
            {/* Main Score Ring card */}
            <div className={`p-8 rounded-2xl transition-all duration-300 border text-center relative overflow-hidden ${
              theme === 'dark'
                ? 'bg-slate-900/45 border-white/[0.08] shadow-2xl backdrop-blur-md'
                : 'bg-white/70 border-slate-200/60 shadow-sm backdrop-blur-md'
            }`}>
              
              {/* Radial Animated Circular meter */}
              <div className="relative w-44 h-44 mx-auto mb-6 flex items-center justify-between flex-col">
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
                    strokeDashoffset={439.6 - (Math.round((userAnswers.filter((a, i) => isUserAnswerCorrect(a, currentQuiz[i])).length / currentQuiz.length) * 100) / 100) * 439.6}
                    strokeLinecap="round"
                    className="transition-all duration-[1200ms] ease-out-sine"
                  />
                </svg>

                <div className="flex flex-col items-center justify-center h-full pt-1.5">
                  <span className="text-4xl font-extrabold tracking-tight text-indigo-500">
                    {Math.round((userAnswers.filter((a, i) => isUserAnswerCorrect(a, currentQuiz[i])).length / currentQuiz.length) * 100)}
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mt-1">
                    Dari 100 poin
                  </span>
                </div>
              </div>

              {/* Roasting Feedback header block */}
              {(() => {
                const total = currentQuiz.length;
                const correct = userAnswers.filter((a, i) => isUserAnswerCorrect(a, currentQuiz[i])).length;
                const score = Math.round((correct / total) * 100);
                const feedbackText = getFeedbackForScore(score);

                let titleText = "🔴 Zona Darurat Klinis";
                let badgeColor = "bg-rose-500/10 text-rose-500 border-rose-500/20";
                
                if (score >= 86) {
                  titleText = "🌟 Zona Dewa Akademis!";
                  badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                } else if (score >= 65) {
                  titleText = "🟢 Zona Aman & Lulus";
                  badgeColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                } else if (score >= 40) {
                  titleText = "🟠 Zona Kritis Remedial";
                  badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                }

                return (
                  <div className="space-y-4">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase border ${badgeColor}`}>
                      {titleText}
                    </span>

                    <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 max-w-xl mx-auto leading-relaxed">
                      &quot;{feedbackText}&quot;
                    </h2>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      (Anda menjawab benar <strong className="text-slate-700 dark:text-slate-200">{correct}</strong> dari total <strong className="text-slate-700 dark:text-slate-200">{total}</strong> soal tryout)
                    </p>
                  </div>
                );
              })()}

              <div className="grid grid-cols-3 gap-2 mt-8 max-w-md mx-auto">
                <div className={`p-3.5 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-100/50 border-slate-200/60'
                }`}>
                  <div className="text-xl font-extrabold text-emerald-500">
                    {userAnswers.filter((a, i) => isUserAnswerCorrect(a, currentQuiz[i])).length}
                  </div>
                  <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mt-1">
                    Benar
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-100/50 border-slate-200/60'
                }`}>
                  <div className="text-xl font-extrabold text-rose-500">
                    {userAnswers.filter((a, i) => a !== null && !isUserAnswerCorrect(a, currentQuiz[i])).length}
                  </div>
                  <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mt-1">
                    Salah
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-100/50 border-slate-200/60'
                }`}>
                  <div className="text-xl font-extrabold text-slate-400 dark:text-slate-500">
                    {userAnswers.filter((a) => a === null).length}
                  </div>
                  <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mt-1">
                    Kosong
                    </div>
                </div>
              </div>

              <div className="flex gap-2 justify-center mt-8">
                <button
                  onClick={() => setScreen('setup')}
                  className={`flex items-center gap-1.5 px-5 py-3 rounded-xl text-xs font-bold border transition-all duration-200 active:scale-105 active:translate-y-0 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-800 border-slate-700 text-slate-300'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Home className="w-4 h-4 text-indigo-500" />
                  Kembali ke Menu Utama
                </button>

                <button
                  onClick={() => startQuiz()}
                  className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-xs font-bold bg-indigo-500 text-white shadow-md shadow-indigo-500/10 transition-all duration-200 active:scale-105 active:translate-y-0 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer hover:bg-indigo-600"
                >
                  <RotateCcw className="w-4 h-4 fill-current" />
                  Mulai Ulang Tryout
                </button>

                <button
                  onClick={shareResult}
                  className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-xs font-bold bg-emerald-500 text-white shadow-md shadow-emerald-500/10 transition-all duration-200 active:scale-105 active:translate-y-0 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer hover:bg-emerald-600"
                >
                  <Share2 className="w-4 h-4 fill-current" />
                  Bagikan
                </button>


                {userAnswers.filter((a, i) => a !== null && !isUserAnswerCorrect(a, currentQuiz[i])).length > 0 && (
                  <button
                    onClick={() => {
                      setScreen('setup');
                      setDashboardTab('srs');
                      srs.startReview();
                    }}
                    className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-xs font-bold bg-rose-500 text-white shadow-md shadow-rose-500/10 transition-all duration-200 active:scale-105 active:translate-y-0 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer hover:bg-rose-600"
                  >
                    <Brain className="w-4 h-4" />
                    Review Salah di SRS
                  </button>
                )}
              </div>

            </div>

            {/* Leaderboard Submission Box */}
            {currentUser && selectedDatabases.length === 1 && (
              <div className={`p-6 rounded-2xl transition-all duration-300 border ${
                theme === 'dark'
                  ? 'bg-slate-900/45 border-white/[0.08] shadow-2xl backdrop-blur-md'
                  : 'bg-white/70 border-slate-200/60 shadow-sm backdrop-blur-md'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Award className="w-8 h-8 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider">🏆 LEADERBOARD FILE SOAL</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Apakah Anda ingin mempublikasikan skor Anda ({lastQuizScore}%) ke papan peringkat untuk file <strong>{selectedDatabases[0]}</strong>?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasSubmittedLeaderboard ? (
                      <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Skor Terkirim!
                      </span>
                    ) : (
                      <button
                        onClick={submitScoreToLeaderboard}
                        disabled={isLeaderboardLoading}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-all cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                      >
                        {isLeaderboardLoading ? (
                          <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Mengirim...</span>
                        ) : 'Kirim Skor'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Battle Report / Analytics dashboard */}
            {analytics.hasMetadata && (
              <div className={`p-6 rounded-2xl transition-all duration-300 border space-y-6 ${
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
                          <div key={name} className="flex items-center gap-4 text-xs font-semibold">
                            <span className="w-32 truncate" title={name}>{name}</span>
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-10 text-right font-extrabold">{pct}%</span>
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
                          <div key={name} className="flex items-center gap-4 text-xs font-semibold">
                            <span className="w-32 truncate">{name}</span>
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-10 text-right font-extrabold">{pct}%</span>
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
                          <div key={name} className="flex items-center gap-4 text-xs font-semibold">
                            <span className="w-32 truncate">{name}</span>
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-10 text-right font-extrabold">{pct}%</span>
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
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                Daftar Pembahasan & Kunci Jawaban Soal
              </h3>

              <div className="space-y-3">
                {currentQuiz.map((q, idx) => {
                  const userAnswer = userAnswers[idx];
                  const isCorrect = isUserAnswerCorrect(userAnswer, q);
                  const isOpen = !!openReviewIndices[idx];

                  let statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                      Kosong
                    </span>
                  );

                  if (userAnswer !== null) {
                    statusBadge = isCorrect ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Benar
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        Salah
                      </span>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border overflow-hidden transition-all ${
                        theme === 'dark' ? 'bg-slate-900/30 border-slate-850' : 'bg-white border-slate-200/60 shadow-sm'
                      }`}
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={() => toggleReviewAccordion(idx)}
                        className={`flex items-center justify-between gap-4 p-4 cursor-pointer transition-all ${
                          theme === 'dark' ? 'hover:bg-slate-800/15' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
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
                        <div className="p-5 border-t border-slate-200/50 dark:border-slate-850/60 bg-slate-500/[0.01] space-y-4 animate-slide-down">
                          <div className="text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
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
                              <div className="grid grid-cols-1 gap-1.5">
                                {Object.entries(q.eliminasi_opsi).map(([letter, rationale]) => {
                                  const matchesKey = letter === getCorrectLetterForQuestion(q);
                                  return (
                                    <div
                                      key={letter}
                                      className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${
                                        matchesKey
                                          ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-700 dark:text-slate-300 font-medium'
                                          : 'bg-slate-500/[0.01] border-slate-100 dark:border-slate-850 text-slate-500 dark:text-slate-400'
                                      }`}
                                    >
                                      <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0 ${
                                        matchesKey ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                      }`}>
                                        {letter}
                                      </span>
                                      <span>{renderHtmlText(rationale)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bookmark & Notes Actions */}
                      {isOpen && currentUser && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200/50 dark:border-slate-700 flex gap-2 justify-end">
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
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
    </>
  );
};
