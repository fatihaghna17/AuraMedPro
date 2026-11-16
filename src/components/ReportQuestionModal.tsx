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
            className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl liquid-glass-card text-slate-900 dark:text-white"
          >
            <div className="p-6">
              <h3 className="text-lg font-black flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
                <Flag className="w-5 h-5 text-rose-500" /> Laporkan Soal
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-700 dark:text-slate-300">
                    Jenis Masalah
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => onIssueTypeChange(e.target.value)}
                    className="w-full p-3 rounded-xl text-sm font-medium outline-none liquid-glass-input text-slate-900 dark:text-white"
                  >
                    <option value="Jawaban Salah" className="bg-white dark:bg-slate-900">Kunci Jawaban Salah</option>
                    <option value="Typo" className="bg-white dark:bg-slate-900">Ada Typo/Kesalahan Ketik</option>
                    <option value="Tidak Jelas" className="bg-white dark:bg-slate-900">Soal Tidak Jelas/Ambigu</option>
                    <option value="Tidak Pantas" className="bg-white dark:bg-slate-900">Konten Tidak Pantas</option>
                    <option value="Lainnya" className="bg-white dark:bg-slate-900">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-700 dark:text-slate-300">
                    Keterangan (Opsional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    placeholder="Jelaskan masalahnya..."
                    className="w-full p-3 rounded-xl text-sm resize-none h-24 outline-none liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-sm font-bold liquid-glass-subtle-interactive text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={onSubmit}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20 cursor-pointer"
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