import React, { useMemo } from 'react';
import {
  BookOpen, Check, ChevronRight, Download, FolderPlus, Plus, RotateCcw,
  Trash2, UploadCloud, ClipboardList, Folder, Sparkles, MoreVertical,
  ArrowRight, Layers, HelpCircle, CheckCircle2, FileText, Activity, Zap
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import SearchFilterHeader from '../SearchFilterHeader';
import FormatGuide from '../FormatGuide';

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
  isCollector?: boolean;
  onOpenDownloadAll?: () => void;
}

export const SetupBanksTab: React.FC<SetupBanksTabProps> = ({
  theme, bankFilter, setBankFilter, searchQuery, setSearchQuery,
  globalDatabases, selectedDatabases, setSelectedDatabases,
  setDashboardTab, removeDatabase, showSwipeHint, setShowSwipeHint,
  questionDatabase, handleFileUpload, handleFolderUpload,
  handleCreateFolder, handleMoveQuiz, handleResetPersonal,
  customFolders, quizFolderMap, isUploaderModalOpen, setIsUploaderModalOpen,
  uploaderMap, filteredDatabases, quizHistory, questionLimits, setQuestionLimits,
  profileUsername, downloadDatabase, setMoveQuizModal, removeGlobalDatabase,
  fileInputRef, folderInputRef, setPasteModalOpen, folderScrollRef,
  isCollector, onOpenDownloadAll
}) => {
  const collectorActive = isCollector ?? (profileUsername === 'collector');

  // Metrik Ringkas
  const totalBanks = Object.keys(questionDatabase || {}).length;
  const totalQuestions = useMemo(() => {
    return Object.values(questionDatabase || {}).reduce((acc: number, val: any) => acc + (val?.length || 0), 0);
  }, [questionDatabase]);

  const selectedQuestionsCount = useMemo(() => {
    return selectedDatabases.reduce((sum: number, key: string) => {
      return sum + (questionDatabase?.[key]?.length || 0);
    }, 0);
  }, [selectedDatabases, questionDatabase]);

  const totalFolders = useMemo(() => {
    const foldersCount = Object.keys(filteredDatabases?.folders || {}).length;
    return foldersCount + (customFolders?.length || 0);
  }, [filteredDatabases, customFolders]);

  const selectionPercent = totalBanks > 0 ? Math.round((selectedDatabases.length / totalBanks) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Hidden File and Folder Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json,.yaml,.yml"
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderUpload}
        {...{ directory: "", webkitdirectory: "" }}
        multiple
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* 1. TOP METRICS ROW (4 Cards Inspired by Reference Image) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Bank Soal */}
        <div
          className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden animate-fade-in-up animation-delay-75 ${
            theme === 'dark'
              ? 'bg-slate-900/50 border-white/[0.08] shadow-xl backdrop-blur-xl'
              : 'bg-white/85 border-slate-200/80 shadow-sm backdrop-blur-xl'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <MoreVertical className="w-4 h-4 text-slate-400 opacity-60" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalBanks}
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              Total Bank Tersedia
            </p>
          </div>
        </div>

        {/* Card 2: Total Butir Soal */}
        <div
          className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden animate-fade-in-up animation-delay-150 ${
            theme === 'dark'
              ? 'bg-slate-900/50 border-white/[0.08] shadow-xl backdrop-blur-xl'
              : 'bg-white/85 border-slate-200/80 shadow-sm backdrop-blur-xl'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-500 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <MoreVertical className="w-4 h-4 text-slate-400 opacity-60" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalQuestions.toLocaleString()}
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              Total Soal Tersimpan
            </p>
          </div>
        </div>

        {/* Card 3: Bank Terpilih */}
        <div
          className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden animate-fade-in-up animation-delay-200 ${
            theme === 'dark'
              ? 'bg-slate-900/50 border-white/[0.08] shadow-xl backdrop-blur-xl'
              : 'bg-white/85 border-slate-200/80 shadow-sm backdrop-blur-xl'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <MoreVertical className="w-4 h-4 text-slate-400 opacity-60" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-500 tracking-tight flex items-center gap-2">
              <span>{selectedDatabases.length}</span>
              {selectedDatabases.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/25 font-bold">
                  {selectedQuestionsCount} Soal
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              Bank Terpilih Siap Uji
            </p>
          </div>
        </div>

        {/* Card 4: Folder Kategori */}
        <div
          className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden animate-fade-in-up animation-delay-250 ${
            theme === 'dark'
              ? 'bg-slate-900/50 border-white/[0.08] shadow-xl backdrop-blur-xl'
              : 'bg-white/85 border-slate-200/80 shadow-sm backdrop-blur-xl'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center font-bold">
              <Folder className="w-5 h-5" />
            </div>
            <MoreVertical className="w-4 h-4 text-slate-400 opacity-60" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalFolders}
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              Folder & Modul Kategori
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN BENTO GRID (Left 8 Columns & Right 4 Columns) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================================= */}
        {/* LEFT COLUMN: Quick Imports + ENLARGED PROMPT CARD + Bank Soal List */}
        {/* ======================================================================= */}
        <div className="lg:col-span-8 space-y-6 animate-fade-in-up animation-delay-300">
          {/* Sub-Grid: 2 Quick Action Cards + ENLARGED Prompt Column */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* 2 Stacked Quick Action Cards (Left 4 cols) */}
            <div className="md:col-span-4 flex flex-col gap-4">
              {/* Card 1: Upload File Soal */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 p-5 rounded-3xl border text-left transition-all duration-300 hover:scale-[1.02] cursor-pointer group flex flex-col justify-between ${
                  theme === 'dark'
                    ? 'bg-slate-900/50 hover:bg-slate-850/60 border-white/[0.08] hover:border-indigo-500/40 shadow-xl backdrop-blur-xl'
                    : 'bg-white/85 hover:bg-slate-50 border-slate-200/80 hover:border-indigo-300 shadow-sm backdrop-blur-xl'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    CBT Soal
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                    Unggah File Soal
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Format JSON, YAML, atau YML (Maks 5MB)
                  </p>
                </div>
              </button>

              {/* Card 2: Tempel JSON */}
              <button
                type="button"
                onClick={() => setPasteModalOpen(true)}
                className={`flex-1 p-5 rounded-3xl border text-left transition-all duration-300 hover:scale-[1.02] cursor-pointer group flex flex-col justify-between ${
                  theme === 'dark'
                    ? 'bg-slate-900/50 hover:bg-slate-850/60 border-white/[0.08] hover:border-amber-500/40 shadow-xl backdrop-blur-xl'
                    : 'bg-white/85 hover:bg-slate-50 border-slate-200/80 hover:border-amber-300 shadow-sm backdrop-blur-xl'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Instan
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                    Tempel Kode JSON
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Salin & tempel struktur soal mentah langsung
                  </p>
                </div>
              </button>
            </div>

            {/* ENLARGED PROMPT CARD (Right 8 cols) - User Requested: diperbesar agar lebih jelas */}
            <div className="md:col-span-8 flex flex-col">
              <FormatGuide theme={theme} />
            </div>
          </div>

          {/* Wide Card: Koleksi Bank Soal & Folder Kategori */}
          <div
            className={`p-6 sm:p-7 rounded-3xl border transition-all duration-300 space-y-5 ${
              theme === 'dark'
                ? 'bg-slate-900/50 border-white/[0.08] shadow-2xl backdrop-blur-xl'
                : 'bg-white/85 border-slate-200/80 shadow-md backdrop-blur-xl'
            }`}
          >
            {/* Collector Banner if active */}
            {collectorActive && onOpenDownloadAll && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">Akun Collector Aktif</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {totalBanks} Bank Soal • {totalQuestions} Soal
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Anda memiliki izin pemantauan untuk mengunduh seluruh soal dari database pusat.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onOpenDownloadAll}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Unduh Semua Soal
                </button>
              </div>
            )}

            {/* Integrated Search & Filter Header */}
            <SearchFilterHeader
              theme={theme as any}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              bankFilter={bankFilter}
              onFilterChange={setBankFilter}
            />

            {/* Action Bar: Pilih Soal, Buat Folder, Reset, Batal Semua */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Folder & Bank Soal
                </span>
                <button
                  onClick={handleCreateFolder}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl transition-all border border-indigo-500/20 cursor-pointer"
                  title="Buat folder baru untuk mengelompokkan kuis"
                >
                  <Plus className="w-3.5 h-3.5" /> Buat Folder
                </button>
                {(Object.keys(quizFolderMap).length > 0 || customFolders.length > 0) && (
                  <button
                    onClick={handleResetPersonal}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20 cursor-pointer"
                    title="Hapus folder susunan sendiri dan kembali ke susunan Admin"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Personal
                  </button>
                )}
              </div>

              {selectedDatabases.length > 0 && (
                <button
                  onClick={() => setSelectedDatabases([])}
                  className="text-xs font-black text-rose-500 hover:underline bg-transparent cursor-pointer"
                >
                  Batal Pilih Semua ({selectedDatabases.length})
                </button>
              )}
            </div>

            {/* Database Folders & Items */}
            {totalBanks === 0 ? (
              <div className="text-center p-12">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Tidak ada bank soal tersedia</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Unggah berkas soal JSON/YAML terlebih dahulu atau gunakan bank soal bawaan.
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Arrow Kiri — desktop only */}
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

                {/* Arrow Kanan — desktop only */}
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
                    if (showSwipeHint && folderScrollRef.current) {
                      if (folderScrollRef.current.scrollLeft > 20) setShowSwipeHint(false);
                    }
                  }}
                  className="flex gap-6 overflow-x-auto pb-4 items-start snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
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
                            <span className="font-extrabold text-xs uppercase tracking-wider truncate text-amber-500">
                              {folderPath}
                            </span>
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
                                  setSelectedDatabases((prev: string[]) =>
                                    prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
                                  );
                                }}
                                className={`relative group flex flex-col p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                                  isSelected
                                    ? theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/30' : 'bg-indigo-50/90 border-indigo-500/40 ring-1 ring-indigo-500/30'
                                    : theme === 'dark' ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-4 gap-3 relative z-10">
                                  <h4 className={`font-bold text-sm leading-snug flex-1 pr-2 break-words ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {displayName}
                                  </h4>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {collectorActive && (
                                      <button
                                        onClick={(e) => downloadDatabase(key, questions, e)}
                                        className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-colors cursor-pointer"
                                        title="Unduh bank soal ini (.json)"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                                      isSelected
                                        ? 'bg-amber-400 border-amber-400 text-slate-900'
                                        : theme === 'dark' ? 'border-slate-600 bg-slate-900/50' : 'border-slate-300 bg-slate-50'
                                    }`}>
                                      {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={4} />}
                                    </div>
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

                                {/* Action overlay on hover */}
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
                                        setQuestionLimits((prev: any) => ({
                                          ...prev,
                                          [key]: isNaN(val) ? 0 : Math.min(val, questions.length)
                                        }));
                                      }}
                                      title="Batasi jumlah soal yang diujikan"
                                      className={`w-16 px-2 py-1.5 rounded-lg text-center border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500`}
                                    />

                                    {collectorActive && (
                                      <button
                                        onClick={(e) => downloadDatabase(key, questions, e)}
                                        className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-colors cursor-pointer"
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
                                    ) : (profileUsername === 'admin' || collectorActive) ? (
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
                  {filteredDatabases.rootItems.length > 0 && (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const quizKey = e.dataTransfer.getData('quizKey');
                        if (quizKey) handleMoveQuiz(quizKey, 'root');
                      }}
                      className={`w-80 sm:w-88 flex-shrink-0 flex flex-col gap-4 rounded-[24px] p-5 border snap-start ${
                        theme === 'dark' ? 'bg-slate-900/40 border-white/[0.08]' : 'bg-slate-50/50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 px-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-800/50 dark:bg-slate-950/50 flex items-center justify-center flex-shrink-0 text-sm">
                            📁
                          </div>
                          <span className="font-extrabold text-xs uppercase tracking-wider truncate text-slate-400">
                            LAINNYA
                          </span>
                        </div>
                        <span className="px-2.5 py-1 bg-slate-500/10 text-slate-500 rounded-full text-[10px] font-black whitespace-nowrap border border-slate-500/20">
                          {filteredDatabases.rootItems.reduce((acc: number, f: any) => acc + (f.questions?.length || 0), 0)} soal
                        </span>
                      </div>

                      <div className="flex flex-col gap-3">
                        {filteredDatabases.rootItems.map(({ key, displayName, questions }: any) => {
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
                                setSelectedDatabases((prev: string[]) =>
                                  prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
                                );
                              }}
                              className={`relative group flex flex-col p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                                isSelected
                                  ? theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/30' : 'bg-indigo-50/90 border-indigo-500/40 ring-1 ring-indigo-500/30'
                                  : theme === 'dark' ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-4 gap-3 relative z-10">
                                <h4 className={`font-bold text-sm leading-snug flex-1 pr-2 break-words ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                  {displayName}
                                </h4>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {collectorActive && (
                                    <button
                                      onClick={(e) => downloadDatabase(key, questions, e)}
                                      className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-colors cursor-pointer"
                                      title="Unduh bank soal ini (.json)"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                                    isSelected
                                      ? 'bg-amber-400 border-amber-400 text-slate-900'
                                      : theme === 'dark' ? 'border-slate-600 bg-slate-900/50' : 'border-slate-300 bg-slate-50'
                                  }`}>
                                    {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={4} />}
                                  </div>
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
                                      setQuestionLimits((prev: any) => ({
                                        ...prev,
                                        [key]: isNaN(val) ? 0 : Math.min(val, questions.length)
                                      }));
                                    }}
                                    title="Batasi jumlah soal yang diujikan"
                                    className={`w-16 px-2 py-1.5 rounded-lg text-center border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500`}
                                  />

                                  {collectorActive && (
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
                                  ) : (profileUsername === 'admin' || collectorActive) ? (
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
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: Formation Status + To-Do List / Actions + Tips/Meeting */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 space-y-6 animate-fade-in-up animation-delay-350">
          {/* Card 1: Status Kuis Terpilih (Inspired by "Formation status" in reference) */}
          <div
            className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
              theme === 'dark'
                ? 'bg-slate-950/80 border-white/[0.08] shadow-2xl text-white backdrop-blur-xl'
                : 'bg-slate-900 border-slate-800 shadow-xl text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black tracking-tight text-white">
                  Status Seleksi Kuis
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedDatabases.length > 0 ? 'Kuis Siap Diujikan' : 'Belum Ada Bank Terpilih'}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                selectedDatabases.length > 0
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {selectedDatabases.length > 0 ? 'Siap' : 'Menunggu'}
              </span>
            </div>

            {/* Selection Progress Bar */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Kelengkapan Seleksi</span>
                <span>{selectionPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 via-indigo-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(selectionPercent, selectedDatabases.length > 0 ? 15 : 0)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>{selectedDatabases.length} dari {totalBanks} Bank</span>
                <span className="text-amber-400 font-bold">{selectedQuestionsCount} Soal Aktif</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              disabled={selectedDatabases.length === 0}
              onClick={() => setDashboardTab('new')}
              className={`w-full py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                selectedDatabases.length > 0
                  ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              <span>Lanjutkan ke Pengaturan Kuis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Manajemen & Aksi Cepat (Inspired by "Your to-Do list" in reference) */}
          <div
            className={`p-6 rounded-3xl border transition-all duration-300 space-y-4 ${
              theme === 'dark'
                ? 'bg-slate-900/50 border-white/[0.08] shadow-2xl backdrop-blur-xl'
                : 'bg-white/85 border-slate-200/80 shadow-md backdrop-blur-xl'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Aksi & Manajemen Bank
              </h3>
              <span className="text-[10px] font-bold text-slate-400">Pintasan</span>
            </div>

            <div className="space-y-2.5">
              {/* Action 1: Upload Folder */}
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all hover:scale-[1.01] cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-950/50 hover:bg-slate-850/60 border-slate-800/80 text-slate-200'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-500 flex items-center justify-center shrink-0">
                    <FolderPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black">Unggah Folder Lengkap</div>
                    <div className="text-[10px] text-slate-450">Impor seluruh direktori berkas soal</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Action 2: Buat Folder */}
              <button
                type="button"
                onClick={handleCreateFolder}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all hover:scale-[1.01] cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-950/50 hover:bg-slate-850/60 border-slate-800/80 text-slate-200'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black">Buat Folder Modul Baru</div>
                    <div className="text-[10px] text-slate-450">Kelompokkan soal ke modul khusus</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Action 3: Reset Folder Personal */}
              {(Object.keys(quizFolderMap).length > 0 || customFolders.length > 0) && (
                <button
                  type="button"
                  onClick={handleResetPersonal}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all hover:scale-[1.01] cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-slate-950/50 hover:bg-rose-950/30 border-slate-800/80 text-rose-400'
                      : 'bg-rose-50/50 hover:bg-rose-100/50 border-rose-200 text-rose-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black">Reset Susunan Folder</div>
                      <div className="text-[10px] text-slate-450">Kembalikan ke struktur bawaan admin</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {/* Action 4: Unduh Semua (Collector / Admin) */}
              {collectorActive && onOpenDownloadAll && (
                <button
                  type="button"
                  onClick={onOpenDownloadAll}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all hover:scale-[1.01] cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-slate-950/50 hover:bg-emerald-950/30 border-slate-800/80 text-emerald-400'
                      : 'bg-emerald-50/50 hover:bg-emerald-100/50 border-emerald-200 text-emerald-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black">Unduh Semua Database</div>
                      <div className="text-[10px] text-slate-450">Backup seluruh arsip kuis sekaligus</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Tips & Info Belajar (Inspired by "Board meeting" in reference) */}
          <div
            className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
              theme === 'dark'
                ? 'bg-slate-950/80 border-white/[0.08] shadow-2xl text-white backdrop-blur-xl'
                : 'bg-slate-900 border-slate-800 shadow-xl text-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Tips CBT & Efisiensi Belajar
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Gunakan <strong>Speedrun UB Tutor</strong> untuk menyaring ratusan slide materi kuliah menjadi kuis berkualitas tinggi dalam sekejap.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>AuraMed Pro CBT Engine</span>
              <span className="text-amber-400">Versi 2.0 Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Continue Button when scrolled */}
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
  );
};
