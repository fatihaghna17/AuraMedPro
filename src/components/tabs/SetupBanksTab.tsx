import React from 'react';
import { BookOpen, Check, ChevronRight, Download, FolderPlus, Plus, RotateCcw, Trash, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import SearchFilterHeader from '../SearchFilterHeader';
import FormatGuide from '../FormatGuide';
import UploadZone from '../UploadZone';

interface SetupBanksTabProps {
  theme: string;
  bankFilter: string;
  setBankFilter: any;
  searchQuery: string;
  setSearchQuery: any;
  globalDatabases: string[];
  selectedDatabases: string[];
  setSelectedDatabases: any;
  setDashboardTab: any;
  removeDatabase: any;
  showSwipeHint: boolean;
  setShowSwipeHint: any;
  questionDatabase: any;
  handleFileUpload: any;
  handleFolderUpload: any;
  handleCreateFolder: any;
  handleMoveQuiz: any;
  handleResetPersonal: any;
  customFolders: string[];
  quizFolderMap: Record<string, string>;
  isUploaderModalOpen: boolean;
  setIsUploaderModalOpen: any;
  uploaderMap: Record<string, string>;

  filteredDatabases: any;
  quizHistory: any[];
  questionLimits: any;
  setQuestionLimits: any;
  profileUsername: string;
  downloadDatabase: any;
  setMoveQuizModal: any;
  removeGlobalDatabase: any;

  fileInputRef: any;
  folderInputRef: any;
  setPasteModalOpen: any;
  folderScrollRef: any;


}

export const SetupBanksTab: React.FC<SetupBanksTabProps> = ({
  theme, bankFilter, setBankFilter, searchQuery, setSearchQuery,
  globalDatabases, selectedDatabases, setSelectedDatabases,
  setDashboardTab, removeDatabase, showSwipeHint, setShowSwipeHint,
  questionDatabase, handleFileUpload, handleFolderUpload,
  handleCreateFolder, handleMoveQuiz, handleResetPersonal,
  customFolders, quizFolderMap, isUploaderModalOpen, setIsUploaderModalOpen,
  uploaderMap, filteredDatabases, quizHistory, questionLimits, setQuestionLimits, profileUsername, downloadDatabase, setMoveQuizModal, removeGlobalDatabase, fileInputRef, folderInputRef, setPasteModalOpen, folderScrollRef
}) => {
  return (
    <div className="space-y-6">
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
    </div>
  );
};
