import { motion, AnimatePresence } from 'motion/react';
import { FileText, Folder } from 'lucide-react';

interface MoveQuizModalProps {
  theme: 'light' | 'dark';
  quizModal: { quizKey: string; quizName: string } | null;
  folders: string[];
  onMove: (quizKey: string, targetFolder: string) => void;
  onClose: () => void;
}

export default function MoveQuizModal({ theme, quizModal, folders, onMove, onClose }: MoveQuizModalProps) {
  const uniqueFolders = [...new Set(folders)];

  return (
    <AnimatePresence>
      {quizModal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] rounded-t-3xl shadow-2xl overflow-hidden liquid-glass-card border-b-0"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>
          
            {/* Header */}
            <div className="px-5 pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Pindah: {quizModal.quizName}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Pilih folder tujuan</p>
            </div>
          
            {/* Folder list */}
            <div className="overflow-y-auto max-h-[50vh] p-3 space-y-1.5">
              {/* Root option */}
              <button
                onClick={() => {
                  onMove(quizModal.quizKey, 'root');
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all cursor-pointer liquid-glass-subtle-interactive text-slate-700 dark:text-slate-200"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span>File Lepas (Root)</span>
              </button>
            
              {/* Custom folders */}
              {uniqueFolders.map((folder) => (
                <button
                  key={folder}
                  onClick={() => {
                    onMove(quizModal.quizKey, folder);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all cursor-pointer liquid-glass-subtle-interactive text-slate-700 dark:text-slate-200"
                >
                  <Folder className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span>{folder}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
