import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Sparkles, CheckCircle2, ShieldCheck, X, BookOpen, Clock, Zap } from 'lucide-react';

interface LifetimeCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  theme: 'light' | 'dark';
}

export const LifetimeCelebrationModal: React.FC<LifetimeCelebrationModalProps> = ({
  isOpen,
  onClose,
  username = 'Jidan',
  theme,
}) => {
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!isOpen) return;

    // Confetti cannon dari dua sisi
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#f59e0b', '#fbbf24', '#14b8a6', '#6366f1', '#ec4899']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#f59e0b', '#fbbf24', '#14b8a6', '#6366f1', '#ec4899']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Ledakan confetti tengah
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#10b981', '#6366f1']
    });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl overflow-hidden backdrop-blur-2xl ${
            isDark
              ? 'bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-amber-950/30 border-amber-500/40 text-white shadow-amber-500/10'
              : 'bg-gradient-to-b from-white/95 via-white/90 to-amber-50/40 border-amber-300 text-slate-900 shadow-amber-500/15'
          }`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-full transition-all cursor-pointer border ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 border-white/10 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
            }`}
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Crown & Icon Header */}
          <div className="text-center mb-5">
            <div className="relative inline-block mx-auto mb-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-amber-500/30 animate-bounce">
                👑
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AuraMedPro Lifetime Member</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Selamat, <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent capitalize">{username}</span>! 🎉
            </h2>

            <p className={`text-xs sm:text-sm mt-3 font-semibold leading-relaxed max-w-md mx-auto ${
              isDark ? 'text-slate-200' : 'text-slate-700'
            }`}>
              Selamat akun anda sudah <span className="font-black text-amber-500">Lifetime</span> karena menjadi <span className="font-black text-teal-400">orang pertama yang menyelesaikan 11.000 soal</span>! 🌟
            </p>
          </div>

          {/* Reward Feature Highlights */}
          <div className={`rounded-2xl p-4 sm:p-5 mb-6 border relative overflow-hidden backdrop-blur-md space-y-3 ${
            isDark
              ? 'bg-white/[0.04] border-white/10'
              : 'bg-white/80 border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider">Akses Selamanya Aktif</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Permanen
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Bebas Batas Waktu / Trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Semua Bank Soal & Pembahasan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Simulasi CBT & Spaced Repetition</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Grup Belajar & AI Analisis</span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 rounded-full font-black text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 shadow-lg shadow-amber-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-slate-950" />
            <span>Mulai Belajar & Nikmati Akses Lifetime 🚀</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
