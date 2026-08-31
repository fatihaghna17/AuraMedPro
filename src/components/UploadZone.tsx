import React, { RefObject } from 'react';
import { UploadCloud, FolderPlus, ClipboardList } from 'lucide-react';

interface UploadZoneProps {
  theme: 'light' | 'dark';
  fileInputRef: RefObject<HTMLInputElement | null>;
  folderInputRef: RefObject<HTMLInputElement | null>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFolderUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasteClick: () => void;
}

export default function UploadZone({
  theme, fileInputRef, folderInputRef, onFileUpload, onFolderUpload, onPasteClick,
}: UploadZoneProps) {
  const dashedCard = (onClick: () => void, hoverColor: string) =>
    `p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.01] ${
      theme === 'dark'
        ? `bg-slate-950/40 border-slate-800 hover:${hoverColor}`
        : `bg-slate-50 border-slate-200 hover:${hoverColor}`
    }`;

  return (
    <div className={`p-6 rounded-3xl border transition-all duration-300 space-y-5 ${
      theme === 'dark'
        ? 'bg-slate-900/40 border-white/[0.08] shadow-xl'
        : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Impor Soal Baru</h3>
        <p className="text-[11px] text-slate-450 mt-1">Impor berkas soal Anda untuk diujikan di platform CBT AuraMed.</p>
      </div>

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
