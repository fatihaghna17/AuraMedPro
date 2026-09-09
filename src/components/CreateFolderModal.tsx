import React, { useState, useEffect, useRef } from 'react';
import { FolderPlus, Globe, User, X, AlertCircle } from 'lucide-react';

interface CreateFolderModalProps {
  isOpen: boolean;
  theme: 'light' | 'dark';
  isAdmin: boolean;
  globalFolders: string[];
  personalFolders: string[];
  onClose: () => void;
  onCreateFolder: (name: string, isGlobal: boolean) => void | Promise<void>;
}

export default function CreateFolderModal({
  isOpen,
  theme,
  isAdmin,
  globalFolders,
  personalFolders,
  onClose,
  onCreateFolder,
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setIsGlobal(isAdmin);
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, isAdmin]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = folderName.trim();
    if (!clean) {
      setError('Nama folder tidak boleh kosong');
      return;
    }

    if (isGlobal) {
      if (globalFolders.some((f) => f.toLowerCase() === clean.toLowerCase())) {
        setError(`Folder global "${clean}" sudah ada.`);
        return;
      }
    } else {
      if (personalFolders.some((f) => f.toLowerCase() === clean.toLowerCase())) {
        setError(`Folder personal "${clean}" sudah ada.`);
        return;
      }
    }

    onCreateFolder(clean, isGlobal);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl animate-pop-up ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold">Buat Folder Baru</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelompokkan bank soal agar lebih rapi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Folder
            </label>
            <input
              ref={inputRef}
              type="text"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Contoh: UKMPPD 2026, Parasitologi..."
              maxLength={50}
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                error
                  ? 'border-rose-500 bg-rose-50/10 focus:border-rose-500'
                  : theme === 'dark'
                  ? 'bg-slate-800/70 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
              }`}
            />
            {error && (
              <p className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-rose-500 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Scope Selector */}
          {isAdmin ? (
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Tipe Visibilitas
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsGlobal(true)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isGlobal
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                      : theme === 'dark'
                      ? 'border-slate-800 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Global</span>
                  </div>
                  <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-400 line-clamp-2">
                    Terlihat untuk semua pengguna
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsGlobal(false)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    !isGlobal
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                      : theme === 'dark'
                      ? 'border-slate-800 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <User className="w-3.5 h-3.5" />
                    <span>Personal</span>
                  </div>
                  <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-400 line-clamp-2">
                    Hanya untuk akun Anda
                  </p>
                </button>
              </div>
            </div>
          ) : (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
              theme === 'dark' ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-100 text-slate-600'
            }`}>
              <User className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>Folder personal ini hanya akan tersimpan untuk Anda.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!folderName.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-purple-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Buat Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
