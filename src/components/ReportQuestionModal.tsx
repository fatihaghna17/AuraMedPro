import { motion, AnimatePresence } from 'motion/react';
import { Flag } from 'lucide-react';

interface ReportQuestionModalProps {
  theme: 'light' | 'dark';
  isOpen: boolean;
  issueType: string;
  description: string;
  onIssueTypeChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function ReportQuestionModal({
  theme, isOpen, issueType, description, onIssueTypeChange, onDescriptionChange, onClose, onSubmit,
}: ReportQuestionModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`relative w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl ${
              theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="p-6">
              <h3 className={`text-lg font-black flex items-center gap-2 mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                <Flag className="w-5 h-5 text-rose-500" /> Laporkan Soal
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-xs font-bold mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Jenis Masalah
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => onIssueTypeChange(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-sm font-medium ${
                      theme === 'dark' 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="Jawaban Salah">Kunci Jawaban Salah</option>
                    <option value="Typo">Ada Typo/Kesalahan Ketik</option>
                    <option value="Tidak Jelas">Soal Tidak Jelas/Ambigu</option>
                    <option value="Tidak Pantas">Konten Tidak Pantas</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Keterangan (Opsional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    placeholder="Jelaskan masalahnya..."
                    className={`w-full p-3 rounded-xl border text-sm resize-none h-24 ${
                      theme === 'dark' 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={onClose}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${
                    theme === 'dark'
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Batal
                </button>
                <button
                  onClick={onSubmit}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20"
                >
                  Kirim Laporan
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}