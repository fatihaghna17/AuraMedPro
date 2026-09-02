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
              <div className={`lg:col-span-12 p-6 rounded-2xl transition-all duration-300 border ${
                theme === 'dark'
                  ? 'bg-slate-900/45 border-white/[0.08] shadow-2xl backdrop-blur-md'
                  : 'bg-white/70 border-slate-200/60 shadow-sm backdrop-blur-md'
              } min-h-[60vh] relative flex flex-col`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-black flex items-center gap-2"><StickyNote className="w-6 h-6 text-indigo-500" /> Study Room</h2>
                    <p className="text-sm text-slate-500 mt-1">Kelola catatan dan soal yang Anda tandai.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingNote(null);
                      setNoteRefQuestion(null);
                      setIsNoteModalOpen(true);
                    }}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/20"
                  >
                    <Plus className="w-4 h-4" /> Buat Catatan
                  </button>
                </div>

                {/* Sub-tabs inside notes */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setBankFilter('notes' as any)} 
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer ${bankFilter === 'notes' || bankFilter === 'all' ? 'bg-slate-100 dark:bg-slate-800 text-indigo-500' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                    >
                      Catatan ({studyRoom.notes.length})
                    </button>
                    <button 
                      onClick={() => setBankFilter('bookmarks' as any)} 
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer ${bankFilter === 'bookmarks' ? 'bg-slate-100 dark:bg-slate-800 text-amber-500' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                    >
                      Bookmark ({studyRoom.bookmarks.length})
                    </button>
                  </div>

                  {bankFilter === 'bookmarks' && studyRoom.bookmarks.length > 0 && (
                    <button
                      onClick={startBookmarkPractice}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Practice ({studyRoom.bookmarks.length} Soal)
                    </button>
                  )}
                </div>

                {studyRoom.isLoading ? (
                  (bankFilter === 'notes' || bankFilter === 'all') ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={`p-4 rounded-xl border relative overflow-hidden ${
                          theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
                        }`}>
                          <div className={`absolute top-0 left-0 bottom-0 w-1 animate-pulse rounded-full ${
                            theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'
                          }`} />
                          <div className="flex items-start justify-between gap-2 mb-2 pl-2">
                            <div className={`w-28 h-4 rounded animate-pulse ${
                              theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-200'
                            }`} />
                            <div className="flex items-center gap-1">
                              <div className={`w-5 h-5 rounded-md animate-pulse ${
                                theme === 'dark' ? 'bg-slate-700/40' : 'bg-slate-100'
                              }`} />
                              <div className={`w-5 h-5 rounded-md animate-pulse ${
                                theme === 'dark' ? 'bg-slate-700/40' : 'bg-slate-100'
                              }`} />
                              <div className={`w-5 h-5 rounded-md animate-pulse ${
                                theme === 'dark' ? 'bg-slate-700/40' : 'bg-slate-100'
                              }`} />
                            </div>
                          </div>
                          <div className="pl-2 space-y-1.5">
                            <div className={`w-full h-3 rounded animate-pulse ${
                              theme === 'dark' ? 'bg-slate-700/40' : 'bg-slate-100'
                            }`} />
                            <div className={`w-3/4 h-3 rounded animate-pulse ${
                              theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-50'
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-4 justify-between ${
                          theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-16 h-4 rounded-full animate-pulse ${
                                theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200'
                              }`} />
                              <div className={`w-20 h-3 rounded animate-pulse ${
                                theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'
                              }`} />
                            </div>
                            <div className={`w-full h-3.5 rounded animate-pulse ${
                              theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-200'
                              }`} />
                            <div className={`w-2/3 h-3 rounded animate-pulse ${
                              theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'
                              }`} />
                          </div>
                          <div className="flex flex-shrink-0 gap-2">
                            <div className={`w-20 h-8 rounded-lg animate-pulse ${
                              theme === 'dark' ? 'bg-slate-700/40' : 'bg-slate-200'
                            }`} />
                            <div className={`w-8 h-8 rounded-lg animate-pulse ${
                              theme === 'dark' ? 'bg-slate-700/40' : 'bg-slate-200'
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (bankFilter === 'notes' || bankFilter === 'all') ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {studyRoom.notes.map(note => (
                      <div key={note.id} className={`p-4 rounded-xl border relative overflow-hidden transition-all hover:shadow-md ${
                        theme === 'dark' ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}>
                        <div className={`absolute top-0 left-0 bottom-0 w-1 bg-${note.color}-500`} />
                        <div className="flex items-start justify-between gap-2 mb-2 pl-2">
                          <h3 className="font-bold text-sm truncate">{note.title || 'Tanpa Judul'}</h3>
                          <div className="flex items-center gap-1">
                            <button onClick={() => studyRoom.updateNote(note.id!, { is_pinned: !note.is_pinned })} className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition ${note.is_pinned ? 'text-amber-500' : 'text-slate-400'}`}>
                              <StickyNote className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { setEditingNote(note); setIsNoteModalOpen(true); }} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-500 transition">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { if(window.confirm('Hapus catatan?')) studyRoom.deleteNote(note.id!); }} className="p-1.5 rounded-md text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 pl-2 mb-3">
                          {note.content}
                        </p>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pl-2">
                            {note.tags.map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">#{tag}</span>
                            ))}
                          </div>
                        )}
                        {note.question_ref && (
                          <div className="mt-3 pl-2 text-[10px] text-slate-400 flex items-center gap-1">
                            <Bookmark className="w-3 h-3" /> Terkait {note.question_bank_name || 'Soal'}
                          </div>
                        )}
                      </div>
                    ))}
                    {studyRoom.notes.length === 0 && (
                      <div className="col-span-full py-12 text-center text-slate-500">
                        <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Belum ada catatan.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studyRoom.bookmarks.map(b => (
                      <div key={b.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-4 justify-between transition-all ${
                        theme === 'dark' ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-white'
                      }`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              {b.question_bank_name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(b.created_at || '').toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                            {String(b.question_json?.pertanyaan || '').replace(/<[^>]*>?/gm, '')}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 gap-2">
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
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Practice
                          </button>
                          <button 
                            onClick={() => studyRoom.removeBookmark(b.question_ref)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition cursor-pointer"
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
