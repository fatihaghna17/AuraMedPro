interface ConfirmModalProps {
  isOpen: boolean;
  theme: 'light' | 'dark';
  title: string;
  description: string;
  onConfirm: (() => void) | null;
  onClose: () => void;
}

export default function ConfirmModal({ isOpen, title, description, onConfirm, onClose }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[90dvh] overflow-y-auto p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 rounded-t-[28px] sm:rounded-2xl liquid-glass-card animate-scale-in text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
          {title}
        </h3>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {description}
        </p>

        <div className="grid grid-cols-2 sm:flex gap-2.5 sm:justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold liquid-glass-subtle-interactive text-slate-700 dark:text-slate-300 cursor-pointer text-center justify-center"
          >
            Batal
          </button>
          <button
            onClick={() => {
              onClose();
              if (onConfirm) onConfirm();
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95 text-center justify-center"
          >
            Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}

