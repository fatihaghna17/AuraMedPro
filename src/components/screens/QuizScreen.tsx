import React from 'react';
import { Bookmark, Check, CheckCircle2, Copy, Eye, Flame, Lock, Sparkles, XCircle, ChevronRight, Share2, MessageCircleQuestion } from 'lucide-react';
import QuizHeader from '../QuizHeader';
import MobileQuizNavDrawer from '../MobileQuizNavDrawer';
import KeyboardHintPanel from '../KeyboardHintPanel';
import MobileBottomActionBar from '../MobileBottomActionBar';
import { EXPLAIN_MODES } from '../../utils/aiExplain';
import { generateQuestionFingerprint } from '../../utils/srsAlgorithm';
import { getLevelInfo } from '../../utils/appHelpers';
import { getCorrectLetterForQuestion, renderHtmlText, getQuestionImage, renderQuestionImage, isUserAnswerCorrect, renderMarkdown } from '../../utils/quizUtils';
import { motion, AnimatePresence } from 'motion/react';

interface QuizScreenProps {
  theme: string;
  currentQuiz: any[];
  currentIndex: number;
  userAnswers: any[];
  doubtStatus: any[];
  isRevealed: boolean;
  quizSecondsLeft: number;
  keyboardNavEnabled: boolean;
  isAdaptiveMode: boolean;
  currentDifficulty: string;
  aiPanelOpen: boolean;
  aiLoading: boolean;
  aiExplanation: string;
  aiFollowUp: string;
  aiMode: string;
  mobileQuizNavOpen: boolean;
  studyRoom: any;
  currentUser: any;
  triggerToast: any;
  copyQuestionToClipboard: any;
  setLightboxImage: any;
  selectAnswer: any;
  handleAIRequest: any;
  navigateQuestion: any;
  checkAnswerNow: any;
  toggleDoubt: any;
  handleNextQuestion: any;
  openFinishModal: any;
  unlockedHints: any;
  setMobileQuizNavOpen: any;
  setUserAnswers: any;
  setUnlockedHints: any;
  setModalTitle: any;
  setModalDesc: any;
  setModalAction: any;
  setModalOpen: any;
  setAiFollowUp: any;
  setCurrentIndex: any;
  setDoubtStatus: any;
  exitQuiz: any;
  toggleFullscreen: any;
  isFullscreen: boolean;
  answerNotes: Record<string, any>;
  openNotePopup: any;

  selectedDatabases: string[];
  userXP: number;
  currentStreak: number;

}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  theme, currentQuiz, currentIndex, userAnswers, doubtStatus, isRevealed,
  quizSecondsLeft, keyboardNavEnabled, isAdaptiveMode, currentDifficulty,
  aiPanelOpen, aiLoading, aiExplanation, aiFollowUp, aiMode, mobileQuizNavOpen,
  studyRoom, currentUser, triggerToast, copyQuestionToClipboard, setLightboxImage,
  selectAnswer, handleAIRequest, navigateQuestion, checkAnswerNow, toggleDoubt,
  handleNextQuestion, openFinishModal, unlockedHints, setMobileQuizNavOpen,
  setUserAnswers, setUnlockedHints, setModalTitle, setModalDesc, setModalAction,
  setModalOpen, setAiFollowUp, setCurrentIndex, setDoubtStatus, exitQuiz,
  toggleFullscreen, isFullscreen, answerNotes, openNotePopup, selectedDatabases, userXP, currentStreak, finishQuiz
}) => {
  return (
    <>
          <div className="relative min-h-screen pb-24">


            <QuizHeader
              theme={theme}
              currentIndex={currentIndex}
              totalQuestions={currentQuiz.length}
              isAdaptiveMode={isAdaptiveMode}
              currentDifficulty={currentDifficulty}
              quizSecondsLeft={quizSecondsLeft}
              isFullscreen={isFullscreen}
              onExit={exitQuiz}
              onToggleFullscreen={toggleFullscreen}
              onOpenMobileNav={() => setMobileQuizNavOpen(true)}
            />

            {keyboardNavEnabled && <KeyboardHintPanel theme={theme} />}

            {/* Split View Content Layout */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Active Question Card Panel */}
                <div className="lg:col-span-8 space-y-6 w-full max-w-[800px] mx-auto">
                  
                  {/* Main Question Card with Rounded-2xl */}
                  <div className={`p-6 rounded-2xl border transition-colors duration-200 quiz-card ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800 shadow-2xl'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    
                    {/* Sub-kompetensi & Kesulitan tag */}
                    <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span>🏷️</span>
                        <span className="truncate">
                          {currentQuiz[currentIndex].metadata?.sub_kompetensi_klinis || 'Sains Medis'}
                        </span>
                        <span>•</span>
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-extrabold ${
                          currentQuiz[currentIndex].metadata?.tingkat_kesulitan?.toLowerCase() === 'sukar' || currentQuiz[currentIndex].metadata?.tingkat_kesulitan?.toLowerCase() === 'sulit'
                            ? 'bg-rose-500/20 text-rose-400'
                            : currentQuiz[currentIndex].metadata?.tingkat_kesulitan?.toLowerCase() === 'mudah'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            currentQuiz[currentIndex].metadata?.tingkat_kesulitan?.toLowerCase() === 'sukar' || currentQuiz[currentIndex].metadata?.tingkat_kesulitan?.toLowerCase() === 'sulit'
                              ? 'bg-rose-500'
                              : currentQuiz[currentIndex].metadata?.tingkat_kesulitan?.toLowerCase() === 'mudah'
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`} />
                          {currentQuiz[currentIndex].metadata?.tingkat_kesulitan || 'Sedang'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={copyQuestionToClipboard}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer ${
                            theme === 'dark'
                              ? 'bg-slate-800/80 hover:bg-slate-850 text-slate-300 border-slate-700/50'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-655 border-slate-200'
                          }`}
                          title="Salin Soal & Opsi ke Clipboard"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Salin Soal</span>
                        </button>
                        {currentUser && (
                          <button
                            onClick={() => {
                              const q = currentQuiz[currentIndex];
                              if (studyRoom.isBookmarked(q)) {
                                studyRoom.removeBookmark(generateQuestionFingerprint(q));
                              } else {
                                studyRoom.addBookmark(q, selectedDatabases[0] || 'Kuis');
                              }
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer ${
                              studyRoom.isBookmarked(currentQuiz[currentIndex]) 
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700/50' 
                                : theme === 'dark'
                                  ? 'bg-slate-800/80 hover:bg-slate-850 text-slate-300 border-slate-700/50'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-655 border-slate-200'
                            }`}
                            title="Bookmark Soal"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${studyRoom.isBookmarked(currentQuiz[currentIndex]) ? 'fill-current' : ''}`} />
                            <span className="hidden sm:inline">Bookmark</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Question text block */}
                    <div className="text-sm sm:text-base font-semibold leading-relaxed text-slate-800 dark:text-slate-100 mb-6">
                      {renderHtmlText(currentQuiz[currentIndex].pertanyaan)}
                    </div>

                    {/* Clinical Image with max-height 200px, object-fit cover, tap for fullscreen */}
                    {(() => {
                      const imageUrl = getQuestionImage(currentQuiz[currentIndex]);
                      if (!imageUrl) return null;
                      return (
                        <div className="my-5 relative group max-w-2xl mx-auto overflow-hidden rounded-xl border border-slate-250 dark:border-slate-800">
                          <img 
                            src={imageUrl} 
                            alt="Visual Klinis" 
                            referrerPolicy="no-referrer"
                            className="w-full h-[200px] object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-102"
                            onClick={() => setLightboxImage(imageUrl)}
                          />
                          <div 
                            className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer backdrop-blur-sm transition-all"
                            onClick={() => setLightboxImage(imageUrl)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Perbesar Gambar
                          </div>
                        </div>
                      );
                    })()}

                    {/* Answer Options List (pilihan) OR Short Answer Input (isian) */}
                    {currentQuiz[currentIndex].pilihan && currentQuiz[currentIndex].pilihan.length > 0 ? (
                      <div className="space-y-3">
                        {currentQuiz[currentIndex].pilihan.map((opt, i) => {
                          const letters = ['A', 'B', 'C', 'D', 'E'];
                          const isSelected = userAnswers[currentIndex] === opt;
                          const isCorrect = i === ['A', 'B', 'C', 'D', 'E'].indexOf(getCorrectLetterForQuestion(currentQuiz[currentIndex]));
                          const revealed = isRevealed[currentIndex];

                          let tileClass = theme === 'dark'
                            ? 'bg-slate-900/30 border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/50 text-slate-350'
                            : 'bg-white border-slate-250/60 hover:border-indigo-500/30 hover:bg-slate-50/50 text-slate-655';

                          let bubbleClass = theme === 'dark'
                            ? 'border-slate-800 bg-slate-950 text-slate-500'
                            : 'border-slate-200 bg-slate-50 text-slate-400';

                          if (revealed) {
                            if (isCorrect) {
                              tileClass = 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/5';
                              bubbleClass = 'bg-emerald-500 border-emerald-500 text-white';
                            } else if (isSelected) {
                              tileClass = 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm shadow-rose-500/5 animate-shake';
                              bubbleClass = 'bg-rose-500 border-rose-500 text-white';
                            } else {
                              tileClass = 'opacity-50 cursor-default ' + (theme === 'dark' ? 'bg-slate-900/10 border-slate-850' : 'bg-slate-50/30 border-slate-100');
                            }
                          } else if (isSelected) {
                            tileClass = 'bg-indigo-500/15 border-indigo-500 text-indigo-500 dark:text-indigo-400 ring-1 ring-indigo-500/20';
                            bubbleClass = 'bg-indigo-500 border-indigo-500 text-white shadow-sm';
                          }

                          return (
                            <button
                              key={i}
                              disabled={revealed}
                              onClick={() => selectAnswer(opt)}
                              className={`w-full flex items-start gap-3.5 p-4 rounded-xl border text-left text-xs sm:text-sm font-semibold cursor-pointer transition-all duration-150 min-h-[48px] active:scale-[0.98] hover:translate-x-1 ${tileClass}`}
                            >
                              <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-extrabold text-xs flex-shrink-0 transition-all ${bubbleClass}`}>
                                {letters[i]}
                              </div>
                              <div className="flex-1 mt-0.5 text-xs sm:text-sm font-semibold leading-relaxed">
                                {renderHtmlText(opt)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-905/20 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Jawaban Isian Singkat:
                          </label>
                          <input
                            type="text"
                            disabled={isRevealed[currentIndex]}
                            value={userAnswers[currentIndex] || ''}
                            onChange={(e) => {
                              const updated = [...userAnswers];
                              updated[currentIndex] = e.target.value;
                              setUserAnswers(updated);
                            }}
                            placeholder="Ketik jawaban Anda disini..."
                            className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold outline-none transition-all duration-200 ${
                              isRevealed[currentIndex]
                                ? theme === 'dark'
                                  ? 'bg-slate-900 border-slate-805 text-slate-400 cursor-not-allowed'
                                  : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                                : theme === 'dark'
                                ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                                : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                            }`}
                          />
                        </div>

                        {/* Hints Section */}
                        {currentQuiz[currentIndex].hints && currentQuiz[currentIndex].hints.length > 0 && currentQuiz[currentIndex].featureFlags?.showHints !== false && (
                          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/10 border-slate-800/60' : 'bg-slate-50 border-slate-200/60'}`}>
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-350">
                                  Bantuan Petunjuk ({unlockedHints[currentIndex] || 0}/{currentQuiz[currentIndex].hints.length})
                                </span>
                              </div>
                              
                              {!isRevealed[currentIndex] && (unlockedHints[currentIndex] || 0) < currentQuiz[currentIndex].hints.length && (
                                <button
                                  onClick={() => {
                                    const currentUnlocked = unlockedHints[currentIndex] || 0;
                                    const maxAllowed = currentQuiz[currentIndex].featureFlags?.maxHintsAllowed || 3;
                                    
                                    if (currentUnlocked >= maxAllowed) {
                                      triggerToast(`Batas maksimal petunjuk terpakai (${maxAllowed})!`, '⚠️');
                                      return;
                                    }
                                    
                                    const penaltyRate = currentQuiz[currentIndex].featureFlags?.hintPenalty !== undefined 
                                      ? currentQuiz[currentIndex].featureFlags.hintPenalty 
                                      : 0.25;
                                    
                                    const confirmUnlock = () => {
                                      setUnlockedHints((prev) => ({
                                        ...prev,
                                        [currentIndex]: currentUnlocked + 1
                                      }));
                                      triggerToast('Petunjuk baru terbuka!', '💡');
                                    };
                                    
                                    if (penaltyRate > 0) {
                                      setModalTitle('Buka Petunjuk?');
                                      setModalDesc(`Membuka petunjuk akan mengurangi skor XP sebesar ${penaltyRate * 100}% untuk soal ini jika dijawab benar. Apakah Anda yakin?`);
                                      setModalAction(() => () => confirmUnlock());
                                      setModalOpen(true);
                                    } else {
                                      confirmUnlock();
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-colors cursor-pointer"
                                >
                                  💡 Tampilkan Petunjuk
                                </button>
                              )}
                            </div>

                            {(unlockedHints[currentIndex] || 0) > 0 ? (
                              <div className="space-y-1.5">
                                {currentQuiz[currentIndex].hints!.slice(0, unlockedHints[currentIndex] || 0).map((hint: string, hIdx: number) => (
                                  <div 
                                    key={hIdx}
                                    className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 bg-amber-500/[0.02] border border-amber-500/10 rounded-lg p-2.5"
                                  >
                                    <span className="font-extrabold text-amber-500">#{hIdx + 1}:</span>
                                    <span>{hint}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-2 text-xs text-slate-400 dark:text-slate-500 italic">
                                Belum ada petunjuk yang dibuka. Gunakan tombol petunjuk jika Anda kesulitan!
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Question explanation/Pembahasan */}
                    {isRevealed[currentIndex] && (() => {
                      const isAnswerCorrect = isUserAnswerCorrect(userAnswers[currentIndex], currentQuiz[currentIndex]);
                      const correctLetter = getCorrectLetterForQuestion(currentQuiz[currentIndex]);
                      const correctOptionText = currentQuiz[currentIndex].pilihan[['A', 'B', 'C', 'D', 'E'].indexOf(correctLetter)] || currentQuiz[currentIndex].jawaban_benar;

                      return (
                        <div className="mt-6 border-t border-slate-200/50 dark:border-slate-800/50 pt-6 animate-slide-down">
                          <div className={`rounded-xl border overflow-hidden ${
                            isAnswerCorrect
                              ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                              : 'border-rose-500/30 bg-rose-500/[0.02]'
                          }`}>
                            <div className={`flex items-center gap-2 px-4 py-3 font-extrabold text-xs uppercase tracking-wider ${
                              isAnswerCorrect
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-b border-emerald-500/10'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-b border-rose-500/10'
                            }`}>
                              {isAnswerCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-500" />
                              )}
                              <span>
                                {isAnswerCorrect ? 'Jawaban Benar!' : 'Jawaban Salah'}
                              </span>
                            </div>

                            <div className="p-5 space-y-4">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                {currentQuiz[currentIndex].pilihan && currentQuiz[currentIndex].pilihan.length > 0 ? (
                                  <span>Kunci Jawaban: {correctLetter}. {correctOptionText}</span>
                                ) : (
                                  <span>Kunci Jawaban: {currentQuiz[currentIndex].jawaban_benar}</span>
                                )}
                              </div>

                              <div>
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                  💡 Pembahasan Detail:
                                </h4>
                                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                  {currentQuiz[currentIndex].pembahasan ? renderHtmlText(currentQuiz[currentIndex].pembahasan) : 'Tidak ada uraian penjelasan untuk soal ini.'}
                                </p>
                              </div>

                              {currentQuiz[currentIndex].eliminasi_opsi && Object.keys(currentQuiz[currentIndex].eliminasi_opsi!).length > 0 && (
                                <div className="border-t border-slate-200/40 dark:border-slate-800/40 pt-4">
                                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                    🔍 Eliminasi Opsi & Rationale:
                                  </h4>
                                  <div className="grid grid-cols-1 gap-2">
                                    {Object.entries(currentQuiz[currentIndex].eliminasi_opsi!).map(([key, desc]) => {
                                      const isKunci = key === correctLetter;
                                      return (
                                        <div
                                          key={key}
                                          className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs leading-relaxed ${
                                            isKunci
                                              ? 'bg-emerald-500/5 border-emerald-500/25 text-slate-700 dark:text-slate-300'
                                              : 'bg-slate-500/[0.02] border-slate-200/50 dark:border-slate-800/80 text-slate-500 dark:text-slate-400'
                                          }`}
                                        >
                                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                                            isKunci
                                              ? 'bg-emerald-500 text-white'
                                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                          }`}>
                                            {key}
                                          </span>
                                          <span>{renderHtmlText(desc)}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* AI Tutor Panel */}
                              <div className="mt-4 pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
                                <button
                                  onClick={() => !aiPanelOpen && handleAIRequest('explain')}
                                  disabled={aiLoading}
                                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    aiPanelOpen
                                      ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                      : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer'
                                  }`}
                                >
                                  <Sparkles className="w-4 h-4" />
                                  AI Tutor (Gemini)
                                </button>

                                {aiPanelOpen && (
                                  <div className={`mt-3 p-4 rounded-xl border ${
                                    theme === 'dark' ? 'bg-slate-900/50 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-200/50'
                                  }`}>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                      {EXPLAIN_MODES.map((m) => (
                                        <button
                                          key={m.mode}
                                          onClick={() => handleAIRequest(m.mode)}
                                          disabled={aiLoading}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                            aiMode === m.mode
                                              ? 'bg-indigo-500 text-white shadow-sm'
                                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                                          } disabled:opacity-50`}
                                        >
                                          <span>{m.icon}</span>
                                          {m.label}
                                        </button>
                                      ))}
                                    </div>

                                    {aiLoading ? (
                                      <div className="space-y-2 animate-pulse">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                                      </div>
                                    ) : aiExplanation ? (
                                      <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                        {renderMarkdown(aiExplanation)}
                                      </div>
                                    ) : null}

                                    {aiMode === 'clarify' && (
                                      <div className="mt-4 flex gap-2">
                                        <input
                                          type="text"
                                          placeholder="Tanyakan bagian yang belum jelas..."
                                          value={aiFollowUp}
                                          onChange={(e) => setAiFollowUp(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && aiFollowUp.trim()) {
                                              handleAIRequest('clarify');
                                            }
                                          }}
                                          className={`flex-1 px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                            theme === 'dark'
                                              ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                                              : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                                          }`}
                                        />
                                        <button
                                          onClick={() => aiFollowUp.trim() && handleAIRequest('clarify')}
                                          disabled={!aiFollowUp.trim() || aiLoading}
                                          className="px-3 py-2 rounded-lg bg-indigo-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                                        >
                                          Kirim
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Navigation Buttons inside card */}
                    <div className="hidden lg:flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
                      <button
                        onClick={() => navigateQuestion(-1)}
                        disabled={currentIndex === 0}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 active:scale-105 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-white'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        ← Sebelumnya
                      </button>

                      <div className="flex items-center gap-2">
                        {!isRevealed[currentIndex] ? (
                          <button
                            onClick={checkAnswerNow}
                            disabled={userAnswers[currentIndex] === null}
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/10 transition-all duration-200 active:scale-105 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            Cek Jawaban
                          </button>
                        ) : (
                          <span className="text-[11px] font-extrabold text-indigo-500 flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/10">
                            <Lock className="w-3 h-3" />
                            Terkunci
                          </span>
                        )}

                        <button
                          onClick={toggleDoubt}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 active:scale-105 cursor-pointer ${
                            doubtStatus[currentIndex]
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 font-extrabold shadow-sm'
                              : theme === 'dark'
                              ? 'bg-slate-850 hover:bg-slate-850 border-slate-700 text-slate-400'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${doubtStatus[currentIndex] ? 'bg-amber-500 shadow-sm shadow-amber-500' : 'bg-slate-400'}`} />
                          <span>Ragu-ragu</span>
                        </button>
                      </div>

                      {(isAdaptiveMode && currentIndex === currentQuiz.length - 1 && currentQuiz.length < 30) ? (
                        <button
                          onClick={handleNextQuestion}
                          disabled={userAnswers[currentIndex] === null}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 text-white shadow-md shadow-indigo-500/10 transition-all duration-200 active:scale-105 cursor-pointer hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Selanjutnya →
                        </button>
                      ) : currentIndex < currentQuiz.length - 1 ? (
                        <button
                          onClick={handleNextQuestion}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 text-white shadow-md shadow-indigo-500/10 transition-all duration-200 active:scale-105 cursor-pointer hover:bg-indigo-600"
                        >
                          Selanjutnya →
                        </button>
                      ) : (
                        <button
                          onClick={handleNextQuestion}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/10 transition-all duration-200 active:scale-105 cursor-pointer"
                        >
                          🏁 Selesai & Kirim
                        </button>
                      )}
                    </div>

                  </div>
                </div>

                {/* Right Side: Sticky Peta Soal Panel (Desktop only) */}
                <aside className="hidden lg:block lg:col-span-4 sticky top-24 w-full max-w-[320px] space-y-6">
                  
                  {/* Gamification Level stats */}
                  <div className={`p-5 rounded-2xl border transition-colors duration-200 relative overflow-hidden quiz-card ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800 shadow-2xl'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-emerald-400 to-amber-400" />
                    
                    <div className="flex items-center justify-between mb-3 mt-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-extrabold tracking-widest text-indigo-500 uppercase font-mono">
                          Level {getLevelInfo(userXP).level}
                        </span>
                        <span className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                          {getLevelInfo(userXP).rank}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/10 px-2 py-0.5 rounded-full">
                        <Flame className="w-3.5 h-3.5 animate-bounce text-amber-500" />
                        <span>Streak: <strong className="text-amber-500">{currentStreak}</strong></span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500" 
                        style={{ width: `${getLevelInfo(userXP).progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500 mt-1.5">
                      <span>XP: {userXP}</span>
                      <span>Target: {getLevelInfo(userXP).nextXP}</span>
                    </div>
                  </div>

                  {/* Question navigation grid sidebar */}
                  <div className={`p-5 rounded-2xl border transition-colors duration-200 quiz-card ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-4 flex items-center justify-between">
                      <span>Peta Soal</span>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-bold">
                        {userAnswers.filter(a => a !== null).length} / {currentQuiz.length} Terjawab
                      </span>
                    </h3>

                    <div className="grid grid-cols-5 gap-2 max-h-[350px] overflow-y-auto pr-1">
                      {currentQuiz.map((_, idx) => {
                        const isAnswered = userAnswers[idx] !== null;
                        const isDoubt = doubtStatus[idx];
                        const isActive = idx === currentIndex;
                        
                        const diff = currentQuiz[idx].metadata?.tingkat_kesulitan?.toLowerCase();
                        let diffBorder = 'border-l-[3px] border-l-amber-500';
                        if (diff === 'mudah') diffBorder = 'border-l-[3px] border-l-emerald-500';
                        if (diff === 'sukar' || diff === 'sulit') diffBorder = 'border-l-[3px] border-l-rose-500';

                        let btnClass = "";
                        if (isActive) {
                          btnClass = `border-indigo-500 text-indigo-500 border-2 font-black shadow-sm ring-1 ring-indigo-500/20 ${diffBorder}`;
                        } else if (isDoubt) {
                          btnClass = `bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/10 ${diffBorder}`;
                        } else if (isAnswered) {
                          btnClass = `bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/10 ${diffBorder}`;
                        } else {
                          btnClass = theme === 'dark' 
                            ? `bg-slate-800/40 hover:bg-slate-800 text-slate-400 border-r border-y border-slate-850 ${diffBorder}` 
                            : `bg-slate-100 hover:bg-slate-200 text-slate-655 border-r border-y border-slate-200/60 ${diffBorder}`;
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-10 rounded-xl border text-xs font-bold transition-all hover:scale-[1.08] active:scale-95 flex items-center justify-center cursor-pointer ${btnClass}`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] font-bold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Terjawab</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span>Ragu-ragu</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <span>Aktif</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${theme === 'dark' ? 'bg-slate-850' : 'bg-slate-200'}`} />
                        <span>Belum Dijawab</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                      <button
                        onClick={openFinishModal}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-md shadow-rose-500/15 transition-all duration-200 active:scale-95 cursor-pointer"
                      >
                        🏁 Selesai Ujian
                      </button>
                    </div>
                  </div>

                </aside>

              </div>
            </div>

            <MobileQuizNavDrawer
              theme={theme}
              isOpen={mobileQuizNavOpen}
              currentQuiz={currentQuiz}
              userAnswers={userAnswers}
              doubtStatus={doubtStatus}
              currentIndex={currentIndex}
              onNavigate={(idx) => { setCurrentIndex(idx); setMobileQuizNavOpen(false); }}
              onClose={() => setMobileQuizNavOpen(false)}
            />

            <MobileBottomActionBar
              theme={theme}
              currentIndex={currentIndex}
              totalQuestions={currentQuiz.length}
              isDoubt={doubtStatus[currentIndex]}
              isRevealed={isRevealed[currentIndex]}
              hasAnswer={userAnswers[currentIndex] !== null}
              onDoubtToggle={() => setDoubtStatus(prev => { const u = [...prev]; u[currentIndex] = !u[currentIndex]; return u; })}
              onPrev={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              onNext={() => setCurrentIndex(prev => Math.min(currentQuiz.length - 1, prev + 1))}
              onCheck={() => checkAnswerNow({} as any)}
              onFinish={() => finishQuiz()}
            />
          </div>
    </>
  );
};
