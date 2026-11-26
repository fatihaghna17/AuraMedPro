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
  fileInputRef, folderInputRef, onFileUpload, onFolderUpload, onPasteClick,
  isSuperAdmin = false,
  selectedAngkatan = 'all',
  onSelectedAngkatanChange,
  selectedProdi = 'all',
  onSelectedProdiChange,
}: UploadZoneProps) {
  const dashedCard =
    "p-3.5 sm:p-5 rounded-xl liquid-glass-subtle-interactive flex flex-row sm:flex-col items-center justify-start sm:justify-center text-left sm:text-center gap-3.5 sm:gap-0 cursor-pointer group";

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
    <div className="p-4 sm:p-6 rounded-2xl liquid-glass-card space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Impor Bank Soal Baru</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Unggah berkas JSON/YAML atau tempel kode soal secara langsung.</p>
        </div>
      </div>

      {/* Target Distribusi Prodi & Angkatan Selector khusus Super Admin */}
      {isSuperAdmin && (
        <div className="p-3.5 sm:p-4 rounded-xl liquid-glass-subtle space-y-4">
          {/* Target Prodi */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                Prodi
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/25'
                        : 'liquid-glass-subtle-interactive text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-200/50 dark:border-white/10 pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Target Distribusi Angkatan
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 uppercase tracking-wider">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                        : 'liquid-glass-subtle-interactive text-slate-700 dark:text-slate-300'
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
        {/* Upload Single File */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={dashedCard}
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mb-0 sm:mb-3 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Pilih File Soal</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">JSON, YAML, atau YML (Maks. 5MB)</p>
          </div>
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
          className={dashedCard}
        >
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/25 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mb-0 sm:mb-3 group-hover:scale-105 transition-transform">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Impor Folder Soal</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">Unggah direktori folder berisi berkas kuis</p>
          </div>
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
          className={dashedCard}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mb-0 sm:mb-3 group-hover:scale-105 transition-transform">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Tempel JSON</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">Salin dan tempel kode soal mentah</p>
          </div>
        </div>
      </div>
    </div>
  );
}

