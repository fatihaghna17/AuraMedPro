import React, { useState, useEffect, useRef } from 'react';
import { Layers, Folder, FolderPlus, Plus, Trash2, X, Check, ArrowRight } from 'lucide-react';

export interface ParentFolderModalProps {
  isOpen: boolean;
  theme: 'light' | 'dark';
  mode: 'create' | 'assign' | 'manage';
  allKanbanFolders: string[]; // List of existing column folders (e.g. 'Digestif', 'Kardiorespi')
  parentFolders: string[];
  folderParentMap: Record<string, string>;
  targetFolder?: string | null; // If mode is 'assign', which folder is being assigned
  onClose: () => void;
  onCreateParentFolder: (name: string, assignedFolders: string[]) => void;
  onDeleteParentFolder: (name: string) => void;
  onAssignFolder: (folderPath: string, parentName: string | null) => void;
}

export default function ParentFolderModal({
  isOpen,
  theme,
  mode: initialMode,
  allKanbanFolders,
  parentFolders,
  folderParentMap,
  targetFolder,
  onClose,
  onCreateParentFolder,
  onDeleteParentFolder,
  onAssignFolder,
}: ParentFolderModalProps) {
  const [currentMode, setCurrentMode] = useState<'create' | 'assign' | 'manage'>(initialMode);
  const [parentName, setParentName] = useState('');
  const [selectedChildFolders, setSelectedChildFolders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentMode(initialMode);
      setParentName('');
      setError(null);
      if (initialMode === 'assign' && targetFolder) {
        // no-op
      } else {
        setSelectedChildFolders([]);
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialMode, targetFolder]);

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = parentName.trim();
    if (!clean) {
      setError('Nama folder besar tidak boleh kosong');
      return;
    }
    if (parentFolders.some(p => p.toLowerCase() === clean.toLowerCase())) {
      setError(`Folder besar "${clean}" sudah ada.`);
      return;
    }
    onCreateParentFolder(clean, selectedChildFolders);
    onClose();
  };

  const toggleFolderSelection = (folder: string) => {
    setSelectedChildFolders(prev => 
      prev.includes(folder) ? prev.filter(f => f !== folder) : [...prev, folder]
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl animate-pop-up transition-all ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">
                {currentMode === 'create' && 'Buat Folder Besar'}
                {currentMode === 'assign' && `Atur Folder Besar: ${targetFolder}`}
                {currentMode === 'manage' && 'Kelola Folder Besar'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentMode === 'create' && 'Kelompokkan beberapa folder bank soal ke dalam wadah besar'}
                {currentMode === 'assign' && 'Pindahkan folder ini ke dalam kategori folder besar'}
                {currentMode === 'manage' && 'Daftar semua folder besar yang telah Anda buat'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on Mode */}
        {currentMode === 'create' && (
          <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Nama Folder Besar
              </label>
              <input
                ref={inputRef}
                type="text"
                value={parentName}
                onChange={(e) => {
                  setParentName(e.target.value);
                  setError(null);
                }}
                placeholder="Contoh: UKMPPD 2026, Stase Klinis, Semester 5..."
                className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
              {error && <p className="text-xs text-rose-500 font-bold mt-1.5">{error}</p>}
            </div>

            {/* Folder selection checklist */}
            {allKanbanFolders.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Pilih Folder yang Ingin Dimasukkan ({selectedChildFolders.length})
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                  {allKanbanFolders.map((folder) => {
                    const isSelected = selectedChildFolders.includes(folder);
                    const currentParent = folderParentMap[folder];
                    return (
                      <div
                        key={folder}
                        onClick={() => toggleFolderSelection(folder)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Folder className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{folder}</span>
                          {currentParent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400 font-normal">
                              di: {currentParent}
                            </span>
                          )}
                        </div>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'border-slate-400 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              {parentFolders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentMode('manage')}
                  className="text-xs font-bold text-amber-500 hover:underline"
                >
                  Kelola Folder Besar ({parentFolders.length})
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Buat Folder Besar
                </button>
              </div>
            </div>
          </form>
        )}

        {currentMode === 'assign' && targetFolder && (
          <div className="mt-5 space-y-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2 font-bold">
              <Folder className="w-4 h-4 flex-shrink-0" />
              <span>Pilih Folder Besar untuk folder <strong>"{targetFolder}"</strong>:</span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2">
              {/* Option: No parent */}
              <div
                onClick={() => {
                  onAssignFolder(targetFolder, null);
                  onClose();
                }}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  !folderParentMap[targetFolder]
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 font-extrabold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-semibold'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📦</span>
                  <div className="text-xs">
                    <div>Tanpa Folder Besar (Mandiri)</div>
                    <div className="text-[10px] opacity-70">Tampilkan di level atas Kanban</div>
                  </div>
                </div>
                {!folderParentMap[targetFolder] && <Check className="w-4 h-4" />}
              </div>

              {/* List of parent folders */}
              {parentFolders.map((pName) => {
                const isCurrent = folderParentMap[targetFolder] === pName;
                const childCount = Object.values(folderParentMap).filter(v => v === pName).length;
                return (
                  <div
                    key={pName}
                    onClick={() => {
                      onAssignFolder(targetFolder, pName);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isCurrent
                        ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">🗂️</span>
                      <div className="text-xs">
                        <div>{pName}</div>
                        <div className="text-[10px] opacity-70">{childCount} folder di dalamnya</div>
                      </div>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-amber-500" />}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentMode('create')}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> + Buat Folder Besar Baru
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {currentMode === 'manage' && (
          <div className="mt-5 space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2">
              {parentFolders.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Belum ada Folder Besar. Buat satu sekarang!
                </div>
              ) : (
                parentFolders.map((pName) => {
                  const count = Object.values(folderParentMap).filter(v => v === pName).length;
                  return (
                    <div
                      key={pName}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🗂️</span>
                        <div>
                          <div className="text-xs font-bold">{pName}</div>
                          <div className="text-[10px] text-slate-400">{count} folder di dalamnya</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Hapus folder besar "${pName}"? Folder di dalamnya tidak akan terhapus, hanya dikembalikan ke daftar umum.`)) {
                            onDeleteParentFolder(pName);
                          }
                        }}
                        className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Hapus Folder Besar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentMode('create')}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> + Buat Folder Besar Baru
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
