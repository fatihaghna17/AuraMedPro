import { ClipboardList, AlertCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl p-6 ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-amber-500" />
          Tempel Kode JSON / YAML
        </h3>
        
        <div className="space-y-4">
          {/* Target Distribusi Prodi & Angkatan Selector khusus Super Admin */}
          {isSuperAdmin && (
            <div className={`p-3 rounded-xl border space-y-3 ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Target Distribusi Prodi</label>
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
                            : theme === 'dark'
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-2.5">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Target Distribusi Angkatan</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {angkatanOptions.map((opt) => {
                    const isSelected = selectedAngkatan === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onSelectedAngkatanChange?.(opt.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-white shadow-sm'
                            : theme === 'dark'
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
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
            <label className="block text-xs font-bold text-slate-500 mb-1">Nama File Kuis <span className="text-rose-500">*</span></label>
            <input 
              type="text"
              value={fileName}
              onChange={(e) => onFileNameChange(e.target.value)}
              placeholder="Misal: bank_soal_kardiologi"
              className={`w-full p-3 text-sm rounded-xl outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                theme === 'dark'
                  ? 'bg-slate-950/50 border border-slate-800 text-slate-200 focus:bg-slate-900'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Kode Soal Mentah <span className="text-rose-500">*</span></label>
            <textarea 
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder={'[\n  {\n    "pertanyaan": "...",\n    "pilihan": [...],\n    "jawaban_benar": "..."\n  }\n]'}
              rows={10}
              className={`w-full p-3 text-xs font-mono rounded-xl outline-none focus:ring-2 focus:ring-amber-500/50 transition-all custom-scrollbar ${
                theme === 'dark'
                  ? 'bg-slate-950/50 border border-slate-800 text-slate-300 focus:bg-slate-900'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white'
              }`}
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-[11px] font-medium">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Batal
          </button>
          <button
            onClick={onSubmit}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-colors"
          >
            Simpan Kuis
          </button>
        </div>
      </div>
    </div>
  );
}
