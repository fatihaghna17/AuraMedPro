import React from 'react';
import { Bookmark, Eye, Play, Plus, StickyNote, Trash, Trash2 } from 'lucide-react';

interface SetupNotesTabProps {
  theme: string;
  studyRoom: any;
  triggerToast: any;
  setEditingNote: any;
  setNoteRefQuestion: any;
  setIsNoteModalOpen: any;
  setBankFilter: any;
  setCurrentQuiz: any;
  setUserAnswers: any;
  setDoubtStatus: any;
  setIsRevealed: any;
  setCurrentIndex: any;
  setQuizSecondsLeft: any;
  setXpHistory: any;
  setOpenReviewIndices: any;
  setUnlockedHints: any;
  setHasSubmittedLeaderboard: any;
  setLastQuizScore: any;
  setIsDailyChallenge: any;
  setQuizTimerActive: any;
  setScreen: any;
  setShowSidebar: any;

  bankFilter: string;
  startBookmarkPractice: any;
  userXP: number;
  activeQuizSessionIdRef: any;
  hasRecordedLeaderboard: any;

}

const NOTE_DOT_COLORS: Record<string, string> = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  purple: 'bg-purple-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  teal: 'bg-teal-500',
  slate: 'bg-slate-500',
};

export const SetupNotesTab: React.FC<SetupNotesTabProps> = ({
  theme, studyRoom, triggerToast, setEditingNote, setNoteRefQuestion,
  setIsNoteModalOpen, setBankFilter, setCurrentQuiz, setUserAnswers,
  setDoubtStatus, setIsRevealed, setCurrentIndex, setQuizSecondsLeft,
  setXpHistory, setOpenReviewIndices, setUnlockedHints, setHasSubmittedLeaderboard,
  setLastQuizScore, setIsDailyChallenge, setQuizTimerActive, setScreen,
  setShowSidebar, bankFilter, startBookmarkPractice, userXP, activeQuizSessionIdRef, hasRecordedLeaderboard
}) => {
  return (
    <>
      <div className="lg:col-span-12 p-4 sm:p-6 rounded-2xl liquid-glass-card min-h-[60vh] relative flex flex-col animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 mb-5 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <StickyNote className="w-5 h-5 text-indigo-500" /> Study Room
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kelola catatan klinis pribadi dan soal-soal yang Anda tandai.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingNote(null);
              setNoteRefQuestion(null);
              setIsNoteModalOpen(true);
            }}
            className="w-full sm:w-auto justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Buat Catatan
          </button>
        </div>

        {/* Sub-tabs inside notes */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 border-b border-slate-200/60 dark:border-white/10 pb-3.5">
          <div className="grid grid-cols-2 sm:flex items-center gap-1.5 p-1 rounded-xl liquid-glass-subtle w-full sm:w-auto lg:w-max tabular-nums">
            <button 
              onClick={() => setBankFilter('notes' as any)} 
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs text-center justify-center transition cursor-pointer ${
                bankFilter === 'notes' || bankFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Catatan ({studyRoom.notes.length})
            </button>
            <button 
              onClick={() => setBankFilter('bookmarks' as any)} 
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs text-center justify-center transition cursor-pointer ${
                bankFilter === 'bookmarks'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bookmark ({studyRoom.bookmarks.length})
            </button>
          </div>

          {bankFilter === 'bookmarks' && studyRoom.bookmarks.length > 0 && (
            <button
              onClick={startBookmarkPractice}
              className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold tabular-nums bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Latihan Bookmark ({studyRoom.bookmarks.length} Soal)
            </button>
          )}
        </div>

        {studyRoom.isLoading ? (
          (bankFilter === 'notes' || bankFilter === 'all') ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl liquid-glass-subtle relative overflow-hidden">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-28 h-4 rounded animate-pulse bg-slate-300/60 dark:bg-slate-700/60" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-full h-3 rounded animate-pulse bg-slate-200/60 dark:bg-slate-700/40" />
                    <div className="w-3/4 h-3 rounded animate-pulse bg-slate-200/40 dark:bg-slate-700/30" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl liquid-glass-subtle flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="w-full h-3.5 rounded animate-pulse bg-slate-300/60 dark:bg-slate-700/60" />
                    <div className="w-2/3 h-3 rounded animate-pulse bg-slate-200/50 dark:bg-slate-700/30" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (bankFilter === 'notes' || bankFilter === 'all') ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {studyRoom.notes.map((note: any) => (
              <div key={note.id} className="p-4 rounded-xl liquid-glass-subtle-interactive relative overflow-hidden">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${NOTE_DOT_COLORS[note.color || 'indigo'] || 'bg-indigo-500'}`} />
                    <h3 className="font-bold text-sm truncate text-slate-900 dark:text-slate-100">{note.title || 'Tanpa Judul'}</h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => studyRoom.updateNote(note.id!, { is_pinned: !note.is_pinned })} className={`p-2 lg:p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-white/10 transition cursor-pointer ${note.is_pinned ? 'text-amber-500' : 'text-slate-400'}`}>
                      <StickyNote className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { setEditingNote(note); setIsNoteModalOpen(true); }} className="p-2 lg:p-1.5 rounded-lg text-slate-400 hover:bg-white/60 dark:hover:bg-white/10 hover:text-indigo-500 transition cursor-pointer">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => {
                      let proceed = true;
                      try {
                        proceed = window.confirm('Hapus catatan?');
                      } catch {
                        proceed = true;
                      }
                      if (proceed) studyRoom.deleteNote(note.id!);
                    }} className="p-2 lg:p-1.5 rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                  {note.content}
                </p>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag: string) => (
                      <span key={tag} className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">#{tag}</span>
                    ))}
                  </div>
                )}
                {note.question_ref && (
                  <div className="mt-3 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 min-w-0">
                    <Bookmark className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="truncate">Terkait {note.question_bank_name || 'Soal'}</span>
                  </div>
                )}
              </div>
            ))}
            {studyRoom.notes.length === 0 && (
              <div className="col-span-full py-14 text-center text-slate-500 dark:text-slate-400">
                <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-25" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Belum ada catatan belajar</p>
                <p className="text-xs mt-1">Klik tombol &ldquo;Buat Catatan&rdquo; di kanan atas untuk mencatat poin klinis penting.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {studyRoom.bookmarks.map((b: any) => (
              <div key={b.id} className="p-3.5 sm:p-4 rounded-xl liquid-glass-subtle-interactive flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 truncate max-w-[210px] sm:max-w-none">
                      {b.question_bank_name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                      {new Date(b.created_at || '').toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 sm:truncate">
                    {String(b.question_json?.pertanyaan || '').replace(/<[^>]*>?/gm, '')}
                  </p>
                </div>
                        <div className="flex flex-shrink-0 gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => {
                              const q = b.question_json;
                              if (!q) return;
                              const pool = [q];
                              setCurrentQuiz(pool);
                              setUserAnswers([null]);
                              setDoubtStatus([false]);
                              setIsRevealed([false]);
                              setCurrentIndex(0);
                              setQuizSecondsLeft(60);
                              setXpHistory([userXP]);
                              setOpenReviewIndices({});
                              setUnlockedHints({});
                              setHasSubmittedLeaderboard(false);
                              setLastQuizScore(0);
                              setIsDailyChallenge(false);
                              activeQuizSessionIdRef.current = 'quiz_single_bm_' + Date.now();
                              hasRecordedLeaderboard.current = false;
                              setQuizTimerActive(true);
                              setScreen('quiz');
                              setShowSidebar(true);
                              triggerToast('Mulai latihan soal bookmark!', '🔖');
                            }}
                            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 max-lg-liquid-interactive transition cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Practice
                          </button>
                          <button 
                            onClick={() => studyRoom.removeBookmark(b.question_ref)}
                            className="p-2 sm:p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 max-lg-liquid-interactive transition cursor-pointer"
                            title="Hapus Bookmark"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {studyRoom.bookmarks.length === 0 && (
                      <div className="py-12 text-center text-slate-500">
                        <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Belum ada bookmark.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
    </>
  );
};
