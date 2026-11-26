import { ClipboardList, AlertCircle, X } from 'lucide-react';

interface PasteJsonModalProps {
  theme: 'light' | 'dark';
  isOpen: boolean;
  fileName: string;
  onFileNameChange: (val: string) => void;
  content: string;
  onContentChange: (val: string) => void;
  error: string | null;
  onClose: () => void;
  onSubmit: () => void;
  isSuperAdmin?: boolean;
  selectedAngkatan?: string;
  onSelectedAngkatanChange?: (angkatan: string) => void;
  selectedProdi?: string;
  onSelectedProdiChange?: (prodi: string) => void;
}

export default function PasteJsonModal({
  theme, isOpen, fileName, onFileNameChange, content, onContentChange, error, onClose, onSubmit,
  isSuperAdmin = false,
  selectedAngkatan = 'all',
  onSelectedAngkatanChange,
  selectedProdi = 'all',
  onSelectedProdiChange,
}: PasteJsonModalProps) {
  if (!isOpen) return null;

  const prodiOptions = [
    { id: 'all', label: '🌐 Seluruh Prodi' },
    { id: 'kedokteran', label: '🩺 Kedokteran' },
    { id: 'farmasi', label: '💊 Farmasi' },
    { id: 'kebidanan', label: '👶 Kebidanan' },
  ];

  const angkatanOptions = selectedProdi === 'farmasi' ? [
    { id: 'all', label: '🌐 Seluruh Angkatan' },
    { id: '23', label: 'Angkatan 23' },
    { id: '24', label: 'Angkatan 24' },
    { id: '23,24', label: '23 & 24' },
  ] : [
    { id: 'all', label: '🌐 Seluruh Angkatan' },
    { id: '24', label: 'Angkatan 24' },
    { id: '25', label: 'Angkatan 25' },
    { id: '26', label: 'Angkatan 26' },
    { id: '24,25', label: '24 & 25' },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl max-h-[90dvh] overflow-y-auto rounded-t-[28px] sm:rounded-2xl shadow-2xl p-4 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 liquid-glass-card text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-500 shrink-0" />
            <span>Tempel Kode JSON / YAML</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-xl liquid-glass-subtle-interactive text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Target Distribusi Prodi & Angkatan Selector khusus Super Admin */}
          {isSuperAdmin && (
            <div className="p-3.5 rounded-xl space-y-3 liquid-glass-subtle">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Target Distribusi Prodi</label>
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
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'liquid-glass-subtle-interactive text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-2.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Target Distribusi Angkatan</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {angkatanOptions.map((opt) => {
                    const isSelected = selectedAngkatan === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onSelectedAngkatanChange?.(opt.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer tabular-nums ${
                          isSelected
                            ? 'bg-amber-500 text-white shadow-sm'
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

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Nama File Kuis <span className="text-rose-500">*</span></label>
            <input 
              type="text"
              value={fileName}
              onChange={(e) => onFileNameChange(e.target.value)}
              placeholder="Misal: bank_soal_kardiologi"
              className="w-full p-3 text-sm rounded-xl outline-none transition-all liquid-glass-input text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Kode Soal Mentah <span className="text-rose-500">*</span></label>
            <textarea 
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder={'[\n  {\n    "pertanyaan": "...",\n    "pilihan": [...],\n    "jawaban_benar": "..."\n  }\n]'}
              rows={8}
              className="w-full p-3 text-xs font-mono rounded-xl outline-none transition-all custom-scrollbar liquid-glass-input text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-[11px] font-medium break-words">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end mt-5 sm:mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold transition-colors liquid-glass-subtle-interactive text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={onSubmit}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-colors cursor-pointer"
          >
            Simpan Kuis
          </button>
        </div>
      </div>
    </div>
  );
}
