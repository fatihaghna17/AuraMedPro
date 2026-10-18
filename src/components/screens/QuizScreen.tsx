import React, { useMemo, useRef, useState, useCallback } from 'react';
import { Bookmark, Check, CheckCircle2, Copy, Eye, EyeOff, Flame, Highlighter, Lock, Sparkles, Trash2, XCircle, ChevronRight, Share2, MessageCircleQuestion, ExternalLink } from 'lucide-react';
import QuizHeader from '../QuizHeader';
import MobileQuizNavDrawer from '../MobileQuizNavDrawer';
import KeyboardHintPanel from '../KeyboardHintPanel';
import MobileBottomActionBar from '../MobileBottomActionBar';
import { EXPLAIN_MODES } from '../../utils/aiExplain';
import { generateQuestionFingerprint } from '../../utils/srsAlgorithm';
import { getLevelInfo, getComboFlameStyle } from '../../utils/appHelpers';
import { getCorrectLetterForQuestion, renderHtmlText, renderHighlightedHtmlText, getQuestionImage, renderQuestionImage, isUserAnswerCorrect, renderMarkdown } from '../../utils/quizUtils';
import { formatQuestionForGemini, openGeminiTutor } from '../../utils/geminiTutor';
import StableImage from '../StableImage';
import { motion, AnimatePresence } from 'motion/react';
import { SOUND_PACKS, SoundPackId, getSavedSoundPack, setSavedSoundPack, playCorrectSound } from '../../utils/audioEffects';

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
  currentCombo?: number;
  finishQuiz?: any;
  quizMode?: string;
  quizTimerActive?: boolean;
  questionHighlights?: Record<number, string[]>;
  setQuestionHighlights?: React.Dispatch<React.SetStateAction<Record<number, string[]>>>;
  strikethroughOptions?: Record<number, number[]>;
  setStrikethroughOptions?: React.Dispatch<React.SetStateAction<Record<number, number[]>>>;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  theme, currentQuiz, currentIndex, userAnswers, doubtStatus, isRevealed,
  quizSecondsLeft, quizTimerActive = true, keyboardNavEnabled, isAdaptiveMode, currentDifficulty,
  aiPanelOpen, aiLoading, aiExplanation, aiFollowUp, aiMode, mobileQuizNavOpen,
  studyRoom, currentUser, triggerToast, copyQuestionToClipboard, setLightboxImage,
  selectAnswer, handleAIRequest, navigateQuestion, checkAnswerNow, toggleDoubt,
  handleNextQuestion, openFinishModal, unlockedHints, setMobileQuizNavOpen,
  setUserAnswers, setUnlockedHints, setModalTitle, setModalDesc, setModalAction,
  setModalOpen, setAiFollowUp, setCurrentIndex, setDoubtStatus, exitQuiz,
  toggleFullscreen, isFullscreen, answerNotes, openNotePopup, selectedDatabases, userXP, currentStreak, currentCombo = 0, finishQuiz,
  quizMode = 'utuh',
  questionHighlights = {},
  setQuestionHighlights,
  strikethroughOptions = {},
  setStrikethroughOptions
}) => {
  const [soundPack, setSoundPack] = useState<SoundPackId>(getSavedSoundPack());
  const [isHighlighterMode, setIsHighlighterMode] = useState<boolean>(false);
  const [vignetteFontSize, setVignetteFontSize] = useState<'normal' | 'large'>('normal');
  const questionTextRef = useRef<HTMLDivElement | null>(null);
  const comboFlame = getComboFlameStyle(currentCombo);

  const currentHighlights = questionHighlights[currentIndex] || [];
  const currentStrikethroughs = strikethroughOptions[currentIndex] || [];

  const addHighlightPhrase = useCallback((rawPhrase: string) => {
    if (!setQuestionHighlights) return;
    const cleaned = rawPhrase.replace(/\s+/g, ' ').trim();
    if (cleaned.length < 2 || cleaned.length > 220) return;

    setQuestionHighlights((prev) => {
      const existing = prev[currentIndex] || [];
      if (existing.some(h => h.toLowerCase() === cleaned.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        [currentIndex]: [...existing, cleaned]
      };
    });
  }, [currentIndex, setQuestionHighlights]);

  const removeHighlightPhrase = useCallback((phraseToRemove: string) => {
    if (!setQuestionHighlights) return;
    setQuestionHighlights((prev) => {
      const existing = prev[currentIndex] || [];
      const next = existing.filter(h => h.toLowerCase() !== phraseToRemove.trim().toLowerCase());
      return {
        ...prev,
        [currentIndex]: next
      };
    });
  }, [currentIndex, setQuestionHighlights]);

  const clearCurrentHighlights = useCallback(() => {
    if (!setQuestionHighlights) return;
    setQuestionHighlights((prev) => {
      const next = { ...prev };
      delete next[currentIndex];
      return next;
    });
    triggerToast('Stabilo pada soal ini dihapus', '🧹');
  }, [currentIndex, setQuestionHighlights, triggerToast]);

  const handleToggleOrApplyHighlighter = useCallback(() => {
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString().trim() : '';
    if (selectedText.length >= 2 && questionTextRef.current && sel?.anchorNode && questionTextRef.current.contains(sel.anchorNode)) {
      addHighlightPhrase(selectedText);
      sel?.removeAllRanges();
      triggerToast('Kata kunci klinis distabilo!', '🖍️');
      return;
    }

    setIsHighlighterMode((prev) => {
      const next = !prev;
      if (next) {
        triggerToast('Mode Stabilo Aktif: Blok kalimat atau ketuk kata pada soal!', '🖍️');
      }
      return next;
    });
  }, [addHighlightPhrase, triggerToast]);

  const handleVignetteSelectionEnd = useCallback(() => {
    if (!isHighlighterMode) return;
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString().trim() : '';
    if (selectedText.length >= 2 && questionTextRef.current && sel?.anchorNode && questionTextRef.current.contains(sel.anchorNode)) {
      addHighlightPhrase(selectedText);
      setTimeout(() => {
        try { window.getSelection()?.removeAllRanges(); } catch {}
      }, 40);
    }
  }, [isHighlighterMode, addHighlightPhrase]);

  const handleVignetteClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const markEl = target.closest('mark[data-highlight]');
    if (markEl) {
      const phrase = markEl.getAttribute('data-highlight') || markEl.textContent || '';
      if (phrase) {
        removeHighlightPhrase(phrase);
      }
      return;
    }

    if (!isHighlighterMode) return;
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length >= 2) return;

    // Detect single word tap when Highlighter Mode is ON (great for mobile/tablet)
    let textNode: Node | null = null;
    let offset = 0;
    const docAny = document as any;
    if (docAny.caretRangeFromPoint) {
      const range = docAny.caretRangeFromPoint(e.clientX, e.clientY);
      if (range) {
        textNode = range.startContainer;
        offset = range.startOffset;
      }
    } else if (docAny.caretPositionFromPoint) {
      const pos = docAny.caretPositionFromPoint(e.clientX, e.clientY);
      if (pos) {
        textNode = pos.offsetNode;
        offset = pos.offset;
      }
    }

    if (textNode && textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
      const content = textNode.textContent;
      let start = offset;
      let end = offset;
      const isWordChar = (ch: string) => /[a-zA-Z0-9\-\/\.%(),+]/.test(ch);
      while (start > 0 && isWordChar(content[start - 1])) start--;
      while (end < content.length && isWordChar(content[end])) end++;
      const word = content.slice(start, end).replace(/^[.,()]+|[.,()]+$/g, '').trim();
      if (word.length >= 2) {
        addHighlightPhrase(word);
      }
    }
  }, [isHighlighterMode, removeHighlightPhrase, addHighlightPhrase]);

  const toggleOptionStrikethrough = useCallback((optIndex: number, optValue: string) => {
    if (!setStrikethroughOptions || isRevealed[currentIndex]) return;
    setStrikethroughOptions((prev) => {
      const existing = prev[currentIndex] || [];
      const isCurrentlyStruck = existing.includes(optIndex);
      const nextList = isCurrentlyStruck
        ? existing.filter(idx => idx !== optIndex)
        : [...existing, optIndex];

      // Jika opsi yang baru dicoret sedang terpilih sebagai jawaban, batalkan pilihannya
      if (!isCurrentlyStruck && userAnswers[currentIndex] === optValue) {
        selectAnswer(null);
      }

      return {
        ...prev,
        [currentIndex]: nextList
      };
    });
  }, [currentIndex, isRevealed, setStrikethroughOptions, userAnswers, selectAnswer]);

  const handleCycleSoundPack = () => {
    const order: SoundPackId[] = ['medical', 'arcade', 'zen', 'mute'];
    const nextIdx = (order.indexOf(soundPack) + 1) % order.length;
    const nextPack = order[nextIdx];
    setSavedSoundPack(nextPack);
    setSoundPack(nextPack);
    if (nextPack !== 'mute') {
      playCorrectSound(nextPack);
    }
    const packInfo = SOUND_PACKS.find(p => p.id === nextPack);
    triggerToast(`Efek Suara: ${packInfo?.name}`, packInfo?.icon || '🔊');
  };

  return (
    <>
          <div className="relative min-h-screen pb-24">


            <QuizHeader
              theme={theme as 'light' | 'dark'}
              currentIndex={currentIndex}
              totalQuestions={currentQuiz.length}
              isAdaptiveMode={isAdaptiveMode}
              currentDifficulty={currentDifficulty}
              quizSecondsLeft={quizSecondsLeft}
              quizTimerActive={quizTimerActive}
              isFullscreen={isFullscreen}
              onExit={exitQuiz}
              onToggleFullscreen={toggleFullscreen}
              onOpenMobileNav={() => setMobileQuizNavOpen(true)}
            />

            {keyboardNavEnabled && <KeyboardHintPanel theme={theme} />}

            {/* Split View Content Layout - Memoized to prevent timer tick re-renders */}
            {useMemo(() => (
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Side: Active Question Card Panel */}
                <div className="lg:col-span-8 space-y-6 w-full max-w-[800px] mx-auto">
                  
                  {/* Main Question Card with Rounded-xl */}
                  <div className={`p-5 sm:p-6 rounded-xl border transition-colors duration-200 ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800 shadow-xs'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    
                    {/* Sub-kompetensi & Kesulitan tag */}
                    <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800 flex-wrap">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span className="truncate">
                          {currentQuiz[currentIndex].metadata?.sub_kompetensi_klinis || 'Sains Medis'}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        {quizMode === 'rmo' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            RMO (+4 / -1 / 0)
                          </span>
                        ) : quizMode === 'blok' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Ujian Blok
                          </span>
                        ) : quizMode === 'suddendeath' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                            Sudden Death (1 Nyawa)
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${
                            currentQuiz[currentIndex].metadata?.tingkat_kesulitan?.toLowerCase() === 'sukar' || currentQuiz[currentIndex].metadata?.tingkat_kesulitan?.toLowerCase() === 'sulit'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              : currentQuiz[currentIndex].metadata?.tingkat_kesulitan?.toLowerCase() === 'mudah'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
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
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {Boolean(isRevealed[currentIndex] && userAnswers[currentIndex] !== null && userAnswers[currentIndex] !== undefined && userAnswers[currentIndex] !== '') && (
                          <button
                            onClick={() => {
                              const prompt = formatQuestionForGemini(
                                currentQuiz[currentIndex],
                                currentIndex,
                                userAnswers[currentIndex],
                                isRevealed[currentIndex]
                              );
                              openGeminiTutor(prompt, triggerToast);
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border-indigo-800'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200'
                            }`}
                            title="Salin konteks soal & buka Gemini AI"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>Tanya Gemini</span>
                          </button>
                        )}
                        {/* Tombol Stabilo / Vignette Highlighter */}
                        <button
                          type="button"
                          onClick={handleToggleOrApplyHighlighter}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                            isHighlighterMode
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/50'
                              : currentHighlights.length > 0
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : theme === 'dark'
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                          title="Stabilo kata kunci klinis pada soal (blok teks atau aktifkan Mode Stabilo)"
                        >
                          <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                          <span>{isHighlighterMode ? 'Stabilo: ON' : 'Stabilo'}</span>
                          {currentHighlights.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-white">
                              {currentHighlights.length}
                            </span>
                          )}
                        </button>
                        {currentHighlights.length > 0 && (
                          <button
                            type="button"
                            onClick={clearCurrentHighlights}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border border-rose-500/25 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
                            title="Bersihkan stabilo pada soal ini"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        {/* Tombol Ukuran Teks Vignette (Aa) */}
                        <button
                          type="button"
                          onClick={() => setVignetteFontSize(prev => prev === 'normal' ? 'large' : 'normal')}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                            vignetteFontSize === 'large'
                              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/40'
                              : theme === 'dark'
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                          title={vignetteFontSize === 'large' ? 'Ukuran Teks: Besar (Klik untuk Normal)' : 'Perbesar Ukuran Teks Soal'}
                        >
                          <span>Aa</span>
                        </button>
                        <button
                          onClick={copyQuestionToClipboard}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                            theme === 'dark'
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                          title="Salin Soal & Opsi ke Clipboard"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Salin</span>
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
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                              studyRoom.isBookmarked(currentQuiz[currentIndex]) 
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' 
                                : theme === 'dark'
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                            title="Bookmark Soal"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${studyRoom.isBookmarked(currentQuiz[currentIndex]) ? 'fill-current' : ''}`} />
                            <span className="hidden sm:inline">Simpan</span>
                          </button>
                        )}
                        <button
                          onClick={handleCycleSoundPack}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                            soundPack === 'mute'
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              : theme === 'dark'
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                          title={`Efek Suara: ${SOUND_PACKS.find(p => p.id === soundPack)?.name} (Klik untuk ganti)`}
                        >
                          <span>{SOUND_PACKS.find(p => p.id === soundPack)?.icon || '🔊'}</span>
                          <span className="hidden md:inline">{SOUND_PACKS.find(p => p.id === soundPack)?.name.split(' ')[0] || 'Suara'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Highlighter Mode Helper Bar */}
                    {isHighlighterMode && (
                      <div className="mb-4 px-3.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-[11px] font-semibold text-amber-700 dark:text-amber-300 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <Highlighter className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>
                            <strong>Mode Stabilo Aktif:</strong> Blok kalimat atau ketuk kata penting pada soal untuk menstabilo. Klik stabilo untuk menghapus.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsHighlighterMode(false)}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 shrink-0 cursor-pointer"
                        >
                          Selesai
                        </button>
                      </div>
                    )}

                    {/* Sudden Death Tension Banner */}
                    {quizMode === 'suddendeath' && (
                      <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">💀</span>
                          <div>
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Mode Sudden Death (1 Nyawa)</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">1 kali salah = Langsung Gugur! Presisi klinis tanpa kompromi.</span>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${comboFlame.badgeClass}`} title={`Streak: ${currentCombo} Soal • ${comboFlame.tierName}`}>
                          <span className="text-xs font-bold">Streak:</span>
                          <span className={`text-sm font-bold flex items-center gap-1 ${comboFlame.textColor}`}>
                            {currentCombo}
                            <Flame className={`w-4 h-4 fill-current ${comboFlame.flameColor}`} />
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Question text block — memoized to avoid Safari repainting on timer tick */}
                    {useMemo(() => (
                      <div
                        ref={questionTextRef}
                        key={`qtext-${currentIndex}`}
                        onMouseUp={handleVignetteSelectionEnd}
                        onTouchEnd={handleVignetteSelectionEnd}
                        onClick={handleVignetteClick}
                        className={`${
                          vignetteFontSize === 'large'
                            ? 'text-base sm:text-lg leading-relaxed'
                            : 'text-sm sm:text-base leading-relaxed'
                        } font-medium text-slate-900 dark:text-slate-100 mb-6 animate-fade-in ${
                          isHighlighterMode ? 'cursor-text select-text rounded-lg ring-1 ring-amber-400/30 p-2 -mx-2 bg-amber-500/[0.02]' : ''
                        }`}
                      >
                        {renderHighlightedHtmlText(currentQuiz[currentIndex].pertanyaan, currentHighlights, true)}
                      </div>
                    ), [currentQuiz[currentIndex].pertanyaan, currentIndex, currentHighlights, isHighlighterMode, vignetteFontSize, handleVignetteSelectionEnd, handleVignetteClick])}

                    {/* Clinical Image — memoized; StableImage reserves space via aspect-ratio so iOS WebKit never collapses the layout (anti-flicker) */}
                    {useMemo(() => {
                      const imageUrl = getQuestionImage(currentQuiz[currentIndex]);
                      if (!imageUrl) return null;
                      return (
                        <div key={`img-${currentIndex}`} className="my-5 relative group max-w-2xl mx-auto overflow-hidden rounded-xl border border-slate-250 dark:border-slate-800 animate-scale-in">
                          <StableImage
                            src={imageUrl}
                            alt="Visual Klinis"
                            referrerPolicy="no-referrer"
                            className="w-full object-contain cursor-zoom-in quiz-img"
                            onClick={() => setLightboxImage(imageUrl)}
                          />
                          <div 
                            className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            onClick={() => setLightboxImage(imageUrl)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Perbesar Gambar
                          </div>
                        </div>
                      );
                    }, [currentQuiz[currentIndex], currentIndex])}

                    {/* Answer Options List (pilihan) OR Short Answer Input (isian) */}
                    {currentQuiz[currentIndex].pilihan && currentQuiz[currentIndex].pilihan.length > 0 ? (
                      <div key={`options-${currentIndex}`} className="space-y-3">
                        {currentQuiz[currentIndex].pilihan.map((opt: string, i: number) => {
                          const letters = ['A', 'B', 'C', 'D', 'E'];
                          const isSelected = userAnswers[currentIndex] === opt;
                          const isCorrect = i === ['A', 'B', 'C', 'D', 'E'].indexOf(getCorrectLetterForQuestion(currentQuiz[currentIndex]));
                          const revealed = isRevealed[currentIndex];
                          const isStruck = currentStrikethroughs.includes(i);

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
                          } else if (isStruck) {
                            tileClass = theme === 'dark'
                              ? 'bg-slate-950/40 border-slate-800/40 text-slate-500 opacity-55'
                              : 'bg-slate-100/60 border-slate-200/50 text-slate-400 opacity-60';
                            bubbleClass = theme === 'dark'
                              ? 'border-rose-500/30 bg-rose-950/30 text-rose-400 line-through'
                              : 'border-rose-300 bg-rose-50 text-rose-400 line-through';
                          } else if (isSelected) {
                            tileClass = 'bg-indigo-500/15 border-indigo-500 text-indigo-500 dark:text-indigo-400 ring-1 ring-indigo-500/20';
                            bubbleClass = 'bg-indigo-500 border-indigo-500 text-white shadow-sm';
                          }

                          return (
                            <div
                              key={i}
                              onContextMenu={(e) => {
                                if (!revealed) {
                                  e.preventDefault();
                                  toggleOptionStrikethrough(i, opt);
                                }
                              }}
                              style={{ animationDelay: `${i * 45}ms` }}
                              className={`w-full flex items-center gap-2 rounded-xl border transition-all duration-150 min-h-[48px] animate-fade-in-up pr-2.5 ${tileClass}`}
                            >
                              <button
                                type="button"
                                disabled={revealed}
                                onClick={() => {
                                  if (isStruck) {
                                    triggerToast('Opsi ini sedang dicoret. Klik ikon coret di kanan untuk membuka kembali.', '🚫');
                                    return;
                                  }
                                  selectAnswer(opt);
                                }}
                                className="flex-1 flex items-start gap-3.5 p-4 text-left text-xs sm:text-sm font-semibold cursor-pointer active:scale-[0.99]"
                              >
                                <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-extrabold text-xs flex-shrink-0 transition-all ${bubbleClass}`}>
                                  {letters[i]}
                                </div>
                                <div className={`flex-1 mt-0.5 text-xs sm:text-sm font-semibold leading-relaxed ${
                                  isStruck ? 'line-through decoration-2 decoration-rose-500/70' : ''
                                }`}>
                                  {renderHtmlText(opt)}
                                </div>
                              </button>

                              {/* Badge atau Tombol Coret Opsi (Eliminasi) */}
                              {!revealed ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleOptionStrikethrough(i, opt);
                                  }}
                                  title={isStruck ? 'Batal coret opsi ini' : 'Coret / eliminasi opsi ini (atau klik kanan)'}
                                  className={`p-2 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                                    isStruck
                                      ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500/25'
                                      : theme === 'dark'
                                        ? 'text-slate-500 hover:text-rose-400 hover:bg-slate-800/80'
                                        : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
                                  }`}
                                >
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">{isStruck ? 'Dicoret' : 'Coret'}</span>
                                </button>
                              ) : (
                                isStruck && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
                                    🚫 Dicoret
                                  </span>
                                )
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div key={`input-${currentIndex}`} className="space-y-4 animate-fade-in">
                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-905/20 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Jawaban Isian Singkat:
                          </label>
                          <input
                            id="short-answer-input"
                            type="text"
                            disabled={isRevealed[currentIndex]}
                            value={userAnswers[currentIndex] || ''}
                            onChange={(e) => {
                              const updated = [...userAnswers];
                              updated[currentIndex] = e.target.value;
                              setUserAnswers(updated);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                checkAnswerNow();
                              }
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

                    {/* Navigation Buttons inside card (Positioned directly under options, stays on top after check answer) */}
                    <div className="hidden lg:flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => navigateQuestion(-1)}
                        disabled={currentIndex === 0}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        ← Sebelumnya
                      </button>

                      <div className="flex items-center gap-2">
                        {quizMode !== 'rmo' && quizMode !== 'blok' && (
                          !isRevealed[currentIndex] ? (
                            <button
                              onClick={checkAnswerNow}
                              disabled={userAnswers[currentIndex] === null}
                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer ${
                                quizMode === 'suddendeath'
                                  ? 'bg-rose-600 hover:bg-rose-700'
                                  : 'bg-indigo-600 hover:bg-indigo-700'
                              }`}
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                              {quizMode === 'suddendeath' ? 'Kunci Jawaban' : 'Cek Jawaban'}
                            </button>
                          ) : (
                            <span className="text-[11px] font-semibold text-indigo-500 flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                              <Lock className="w-3 h-3" />
                              Terkunci
                            </span>
                          )
                        )}

                        <button
                          onClick={toggleDoubt}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                            doubtStatus[currentIndex]
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                              : theme === 'dark'
                              ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${doubtStatus[currentIndex] ? 'bg-amber-500' : 'bg-slate-400'}`} />
                          <span>Ragu-ragu</span>
                        </button>
                        
                        {quizMode === 'rmo' && (
                          <button
                            onClick={() => selectAnswer(null)}
                            disabled={userAnswers[currentIndex] === null || isRevealed[currentIndex]}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-rose-400'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-rose-600'
                            }`}
                            title="Kosongkan jawaban (menghindari -1 jika salah)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Jawaban</span>
                          </button>
                        )}
                      </div>

                      {(isAdaptiveMode && currentIndex === currentQuiz.length - 1 && currentQuiz.length < 30) ? (
                        <button
                          onClick={handleNextQuestion}
                          disabled={userAnswers[currentIndex] === null}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Selanjutnya →
                        </button>
                      ) : currentIndex < currentQuiz.length - 1 ? (
                        <button
                          onClick={handleNextQuestion}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                        >
                          Selanjutnya →
                        </button>
                      ) : (
                        <button
                          onClick={handleNextQuestion}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                        >
                          Selesai & Kirim
                        </button>
                      )}
                    </div>

                    {/* Question explanation/Pembahasan */}
                    {isRevealed[currentIndex] && (() => {
                      const isAnswerCorrect = isUserAnswerCorrect(userAnswers[currentIndex], currentQuiz[currentIndex]);
                      const correctLetter = getCorrectLetterForQuestion(currentQuiz[currentIndex]);
                      const correctOptionText = currentQuiz[currentIndex].pilihan[['A', 'B', 'C', 'D', 'E'].indexOf(correctLetter)] || currentQuiz[currentIndex].jawaban_benar;

                      return (
                        <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6 animate-slide-down">
                          <div className={`rounded-xl border overflow-hidden ${
                            isAnswerCorrect
                              ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                              : 'border-rose-500/30 bg-rose-500/[0.02]'
                          }`}>
                            <div className={`flex items-center gap-2 px-4 py-3 font-bold text-xs uppercase tracking-wider ${
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
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                {currentQuiz[currentIndex].pilihan && currentQuiz[currentIndex].pilihan.length > 0 ? (
                                  <span>Kunci Jawaban: {correctLetter}. {correctOptionText}</span>
                                ) : (
                                  <span>Kunci Jawaban: {currentQuiz[currentIndex].jawaban_benar}</span>
                                )}
                              </div>

                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                  Pembahasan Detail
                                </h4>
                                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                  {currentQuiz[currentIndex].pembahasan ? renderHtmlText(currentQuiz[currentIndex].pembahasan) : 'Tidak ada uraian penjelasan untuk soal ini.'}
                                </p>
                              </div>

                              {currentQuiz[currentIndex].eliminasi_opsi && Object.keys(currentQuiz[currentIndex].eliminasi_opsi!).length > 0 && (
                                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                    Analisis Opsi & Eliminasi Jawaban
                                  </h4>
                                  <div className="grid grid-cols-1 gap-2">
                                    {Object.entries(currentQuiz[currentIndex].eliminasi_opsi!)
                                      .sort(([a], [b]) => a.localeCompare(b))
                                      .map(([key, desc]) => {
                                        const isKunci = key.toUpperCase() === correctLetter.toUpperCase();
                                        const optIdx = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].indexOf(key.toUpperCase());
                                        const optText = optIdx !== -1 && currentQuiz[currentIndex].pilihan ? currentQuiz[currentIndex].pilihan[optIdx] : null;

                                        return (
                                          <div
                                            key={key}
                                            className={`flex items-start gap-3 p-3 rounded-lg border text-xs leading-relaxed transition-colors ${
                                              isKunci
                                                ? 'bg-emerald-500/5 border-emerald-500/30 text-slate-800 dark:text-slate-200'
                                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                                            }`}
                                          >
                                            <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5 ${
                                              isKunci
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                            }`}>
                                              {key}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                              {optText && (
                                                <div className="font-bold text-[11px] text-slate-800 dark:text-slate-200 mb-1 leading-snug">
                                                  {renderHtmlText(optText)}
                                                </div>
                                              )}
                                              <div className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                                                {renderHtmlText(desc)}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              )}

                              {/* Shortcut AI Tutor (Gemini) */}
                              {Boolean(isRevealed[currentIndex] && userAnswers[currentIndex] !== null && userAnswers[currentIndex] !== undefined && userAnswers[currentIndex] !== '') && (
                                <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                                  <div className={`p-4 rounded-xl border transition-colors ${
                                    theme === 'dark' 
                                      ? 'bg-slate-800/60 border-slate-700' 
                                      : 'bg-slate-50 border-slate-200'
                                  }`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div className="flex items-start gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                                          <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                              AI Tutor (Gemini Web Chat)
                                            </h4>
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                              Shortcut Bebas Kuota
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                            Otomatis salin soal, opsi & pembahasan ke clipboard, lalu buka Gemini untuk bedah kasus klinis.
                                          </p>
                                        </div>
                                      </div>

                                      <button
                                        onClick={() => {
                                          const prompt = formatQuestionForGemini(
                                            currentQuiz[currentIndex],
                                            currentIndex,
                                            userAnswers[currentIndex],
                                            isRevealed[currentIndex]
                                          );
                                          openGeminiTutor(prompt, triggerToast);
                                        }}
                                        className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-colors"
                                        title="Salin konteks soal & buka web Gemini"
                                      >
                                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                        <span>Tanya Gemini</span>
                                        <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Bottom Continue Button if user scrolled all the way through explanation */}
                              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                                <button
                                  onClick={handleNextQuestion}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                                >
                                  {currentIndex < currentQuiz.length - 1 ? 'Lanjut ke Soal Berikutnya →' : 'Selesai & Kirim'}
                                </button>
                              </div>

                            </div>
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                </div>

                {/* Right Side: Sticky Peta Soal Panel (Desktop only) */}
                <aside className="hidden lg:block lg:col-span-4 sticky top-20 w-full max-w-[320px] space-y-5">
                  
                  {/* Gamification Level stats */}
                  <div className={`p-5 rounded-xl border transition-colors duration-200 relative overflow-hidden ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800 shadow-xs'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase font-mono">
                          Level {getLevelInfo(userXP).level}
                        </span>
                        <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                          {getLevelInfo(userXP).rank}
                        </span>
                      </div>
                      
                      <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md border ${comboFlame.badgeClass}`} title={`Streak Jawaban: ${currentCombo} Soal • ${comboFlame.tierName}`}>
                        <Flame className={`w-3.5 h-3.5 fill-current ${comboFlame.flameColor}`} />
                        <span>Streak: <strong className={comboFlame.textColor}>{currentCombo}</strong></span>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                        style={{ width: `${getLevelInfo(userXP).progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
                      <span>XP: {userXP}</span>
                      <span>Target: {getLevelInfo(userXP).nextXP}</span>
                    </div>
                  </div>

                  {/* Question navigation grid sidebar */}
                  <div className={`p-5 rounded-xl border transition-colors duration-200 ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-xs' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center justify-between">
                      <span>Peta Soal</span>
                      <span className="text-[11px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md font-semibold normal-case tracking-normal">
                        {userAnswers.filter(a => a !== null).length} / {currentQuiz.length} Terjawab
                      </span>
                    </h3>

                    <div className="grid grid-cols-5 gap-2 max-h-[350px] overflow-y-auto pr-1">
                      {currentQuiz.map((_, idx) => {
                        const isAnswered = userAnswers[idx] !== null && userAnswers[idx] !== undefined && userAnswers[idx] !== '';
                        const isDoubt = doubtStatus[idx];
                        const isActive = idx === currentIndex;
                        const revealed = !!isRevealed[idx];
                        const isCorrect = isAnswered && isUserAnswerCorrect(userAnswers[idx], currentQuiz[idx]);
                        
                        const diff = currentQuiz[idx].metadata?.tingkat_kesulitan?.toLowerCase();
                        let diffBorder = 'border-l-[3px] border-l-amber-500';
                        if (diff === 'mudah') diffBorder = 'border-l-[3px] border-l-emerald-500';
                        if (diff === 'sukar' || diff === 'sulit') diffBorder = 'border-l-[3px] border-l-rose-500';

                        let btnClass = "";
                        if (isActive) {
                          if (isDoubt) {
                            btnClass = `bg-amber-500 border-amber-400 text-white font-bold ring-2 ring-amber-400/50 ${diffBorder}`;
                          } else if (revealed) {
                            if (isCorrect) {
                              btnClass = `bg-blue-600 border-blue-500 text-white font-bold ring-2 ring-blue-400/50 ${diffBorder}`;
                            } else {
                              btnClass = `bg-rose-600 border-rose-500 text-white font-bold ring-2 ring-rose-400/50 ${diffBorder}`;
                            }
                          } else if (isAnswered) {
                            btnClass = `bg-emerald-600 border-emerald-500 text-white font-bold ring-2 ring-emerald-400/50 ${diffBorder}`;
                          } else {
                            btnClass = `border-indigo-500 text-indigo-600 dark:text-indigo-400 border-2 font-bold ${diffBorder}`;
                          }
                        } else if (isDoubt) {
                          btnClass = `bg-amber-500 border-amber-500 text-white ${diffBorder}`;
                        } else if (revealed) {
                          if (isCorrect) {
                            btnClass = `bg-blue-600 border-blue-600 text-white ${diffBorder}`;
                          } else {
                            btnClass = `bg-rose-500 border-rose-500 text-white ${diffBorder}`;
                          }
                        } else if (isAnswered) {
                          btnClass = `bg-emerald-500 border-emerald-500 text-white ${diffBorder}`;
                        } else {
                          btnClass = theme === 'dark' 
                            ? `bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-r border-y border-slate-700 ${diffBorder}` 
                            : `bg-slate-50 hover:bg-slate-100 text-slate-600 border-r border-y border-slate-200 ${diffBorder}`;
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-9 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer ${btnClass}`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                        <span>Terjawab (Belum Cek)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                        <span>Benar (Sudah Cek)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                        <span>Salah (Sudah Cek)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                        <span>Ragu-ragu</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm border-2 border-indigo-500" />
                        <span>Sedang Aktif</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-sm ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`} />
                        <span>Belum Dijawab</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={openFinishModal}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                      >
                        Selesai Ujian
                      </button>
                    </div>
                  </div>

                </aside>

              </div>
            </div>
            ), [
              theme, currentQuiz, currentIndex, userAnswers, doubtStatus, isRevealed, 
              isAdaptiveMode, currentDifficulty, aiPanelOpen, aiLoading, aiExplanation, 
              aiFollowUp, aiMode, studyRoom, currentUser, selectedDatabases, unlockedHints, 
              userXP, currentStreak, currentCombo, questionHighlights, strikethroughOptions, isHighlighterMode, vignetteFontSize
            ])}

            <MobileQuizNavDrawer
              theme={theme}
              isOpen={mobileQuizNavOpen}
              currentQuiz={currentQuiz}
              userAnswers={userAnswers}
              doubtStatus={doubtStatus}
              isRevealed={isRevealed}
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
              hideCheckAnswer={quizMode === 'rmo' || quizMode === 'blok'}
              onDoubtToggle={() => setDoubtStatus(prev => { const u = [...prev]; u[currentIndex] = !u[currentIndex]; return u; })}
              onPrev={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              onNext={() => setCurrentIndex(prev => Math.min(currentQuiz.length - 1, prev + 1))}
              onCheck={() => checkAnswerNow({} as any)}
              onFinish={() => {
                if (openFinishModal) {
                  openFinishModal();
                } else if (finishQuiz) {
                  finishQuiz();
                }
              }}
              onOpenMap={() => setMobileQuizNavOpen(true)}
            />
          </div>
    </>
  );
};
