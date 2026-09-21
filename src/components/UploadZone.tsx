import React, { RefObject } from 'react';
import { UploadCloud, FolderPlus, ClipboardList, Users } from 'lucide-react';

interface UploadZoneProps {
  theme: 'light' | 'dark';
  fileInputRef: RefObject<HTMLInputElement | null>;
  folderInputRef: RefObject<HTMLInputElement | null>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFolderUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasteClick: () => void;
  isSuperAdmin?: boolean;
  selectedAngkatan?: string;
  onSelectedAngkatanChange?: (angkatan: string) => void;
  selectedProdi?: string;
  onSelectedProdiChange?: (prodi: string) => void;
}

export default function UploadZone({
  theme, fileInputRef, folderInputRef, onFileUpload, onFolderUpload, onPasteClick,
  isSuperAdmin = false,
  selectedAngkatan = 'all',
  onSelectedAngkatanChange,
  selectedProdi = 'all',
  onSelectedProdiChange,
}: UploadZoneProps) {
  const dashedCard = (onClick: () => void, hoverColor: string) =>
    `p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.01] ${
      theme === 'dark'
        ? `bg-slate-950/40 border-slate-800 hover:${hoverColor}`
        : `bg-white/60 hover:bg-white/90 border-slate-200/80 hover:${hoverColor}`
    }`;

  const prodiOptions = [
    { id: 'all', label: '🌐 Seluruh Prodi' },
    { id: 'kedokteran', label: '🩺 Kedokteran' },
    { id: 'farmasi', label: '💊 Farmasi' },
    { id: 'kebidanan', label: '👶 Kebidanan' },
  ];

  const angkatanOptions = selectedProdi === 'farmasi' ? [
    { id: 'all', label: '🌐 Seluruh Angkatan', desc: 'Dapat diakses oleh semua angkatan Farmasi' },
    { id: '23', label: 'Angkatan 23', desc: 'Khusus untuk Angkatan 23' },
    { id: '24', label: 'Angkatan 24', desc: 'Khusus untuk Angkatan 24' },
    { id: '23,24', label: 'Angkatan 23 & 24', desc: 'Bisa diakses Angkatan 23 dan 24' },
  ] : [
    { id: 'all', label: '🌐 Seluruh Angkatan', desc: 'Dapat diakses oleh semua angkatan' },
    { id: '24', label: 'Angkatan 24', desc: 'Khusus untuk Angkatan 24' },
    { id: '25', label: 'Angkatan 25', desc: 'Khusus untuk Angkatan 25' },
    { id: '26', label: 'Angkatan 26', desc: 'Khusus untuk Angkatan 26' },
    { id: '24,25', label: 'Angkatan 24 & 25', desc: 'Bisa diakses Angkatan 24 dan 25' },
  ];

  const currentOption = angkatanOptions.find(o => o.id === selectedAngkatan) || angkatanOptions[0];

  return (
    <div className={`p-6 rounded-3xl border transition-all duration-300 space-y-5 ${
      theme === 'dark'
        ? 'bg-slate-900/40 border-white/[0.08] shadow-xl'
        : 'bg-white/80 backdrop-blur-xl border-white/80 shadow-sm'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Impor Soal Baru</h3>
          <p className="text-[11px] text-slate-450 mt-1">Impor berkas soal Anda untuk diujikan di platform CBT AuraMed.</p>
        </div>
      </div>

      {/* Target Distribusi Prodi & Angkatan Selector khusus Super Admin */}
      {isSuperAdmin && (
        <div className={`p-4 rounded-2xl border transition-all space-y-4 ${
          theme === 'dark' 
            ? 'bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/50 border-indigo-500/30' 
            : 'bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-slate-50 border-indigo-200'
        }`}>
          {/* Target Prodi */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                Prodi
              </div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                Target Distribusi Prodi
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {prodiOptions.map((opt) => {
                const isSelected = selectedProdi === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onSelectedProdiChange?.(opt.id);
                      if (opt.id === 'farmasi' && selectedAngkatan !== '23' && selectedAngkatan !== '24' && selectedAngkatan !== 'all') {
                        onSelectedAngkatanChange?.('all');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none active:scale-95 ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-500/50 scale-[1.02]'
                        : theme === 'dark'
                          ? 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                    Target Distribusi Angkatan
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 uppercase tracking-wider">
                    Super Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentOption.desc}
                </p>
              </div>
            </div>

            {/* Tombol Pilihan Angkatan */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {angkatanOptions.map((opt) => {
                const isSelected = selectedAngkatan === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelectedAngkatanChange?.(opt.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none active:scale-95 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/50 scale-[1.02]'
                        : theme === 'dark'
                          ? 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Upload Single File */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={dashedCard(() => {}, 'border-indigo-500/40')}
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
            <UploadCloud className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold">Pilih File Soal</h4>
          <p className="text-[10px] text-slate-400 mt-1.5">JSON, YAML, atau YML (Maks. 5MB)</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileUpload}
            accept=".json,.yaml,.yml"
            className="hidden"
          />
        </div>

        {/* Upload Folder Directory */}
        <div 
          onClick={() => folderInputRef.current?.click()}
          className={dashedCard(() => {}, 'border-teal-500/40')}
        >
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center mb-3">
            <FolderPlus className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold">Impor Folder Soal</h4>
          <p className="text-[10px] text-slate-400 mt-1.5">Unggah direktori folder berisi berkas kuis</p>
          <input
            type="file"
            ref={folderInputRef}
            onChange={onFolderUpload}
            {...{ directory: "", webkitdirectory: "" }}
            multiple
            className="hidden"
          />
        </div>

        {/* Paste JSON */}
        <div 
          onClick={onPasteClick}
          className={dashedCard(() => {}, 'border-amber-500/40')}
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
            <ClipboardList className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold">Tempel JSON</h4>
          <p className="text-[10px] text-slate-400 mt-1.5">Salin dan tempel kode soal mentah</p>
        </div>
      </div>
    </div>
  );
}
