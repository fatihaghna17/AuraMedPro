interface ConfirmModalProps {
  isOpen: boolean;
  theme: 'light' | 'dark';
  title: string;
  description: string;
  onConfirm: (() => void) | null;
  onClose: () => void;
}

export default function ConfirmModal({ isOpen, theme, title, description, onConfirm, onClose }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl animate-pop-up ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <h3 className="text-base sm:text-lg font-extrabold">
          {title}
        </h3>
        <p className={`mt-2 text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          {description}
        </p>

        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-105 active:translate-y-0 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-150 text-slate-600'
            }`}
          >
            Batal
          </button>
          <button
            onClick={() => {
              onClose();
              if (onConfirm) onConfirm();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/10 transition-all duration-200 active:scale-105 active:translate-y-0 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer"
          >
            Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}
