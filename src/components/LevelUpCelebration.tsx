import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { getLevelInfo } from '../utils/appHelpers';

interface LevelUpCelebrationProps {
  show: boolean;
  newLevel: number;
  theme: 'dark' | 'light';
  onDismiss: () => void;
}

const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({ show, newLevel, theme, onDismiss }) => {
  const { rank } = getLevelInfo(
    // Reverse-engineer approximate XP from level for rank lookup
    // getXPForLevel(l) = 50*(l-1)^2 + 50*(l-1)
    50 * (newLevel - 1) * (newLevel - 1) + 50 * (newLevel - 1)
  );

  const fireConfetti = useCallback(() => {
    // Grand celebration burst
    const colors = ['#818CF8', '#A78BFA', '#6366F1', '#10b981', '#FCD34D', '#ec4899', '#3b82f6'];

    // Center burst
    confetti({
      particleCount: 200,
      spread: 120,
      startVelocity: 45,
      origin: { y: 0.5 },
      colors,
      scalar: 1.2,
    });

    // Side cannons
    setTimeout(() => {
      confetti({ particleCount: 100, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 100, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors });
    }, 300);

    // Stars rain
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 360,
        startVelocity: 20,
        ticks: 100,
        origin: { x: 0.5, y: 0.2 },
        colors,
        shapes: ['star'],
        scalar: 1.5,
      });
    }, 600);

    // Extra fireworks
    setTimeout(() => {
      const end = Date.now() + 2500;
      const interval = setInterval(() => {
        if (Date.now() > end) return clearInterval(interval);
        confetti({
          particleCount: 30,
          startVelocity: 25,
          spread: 360,
          ticks: 50,
          origin: { x: Math.random(), y: Math.random() * 0.4 },
          colors,
        });
      }, 200);
    }, 900);
  }, []);

  useEffect(() => {
    if (show) {
      fireConfetti();
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, fireConfetti, onDismiss]);

  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onDismiss}
          style={{ cursor: 'pointer' }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: isDark
                ? 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.15) 0%, rgba(11, 17, 32, 0.92) 70%)'
                : 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.1) 0%, rgba(248, 250, 252, 0.92) 70%)',
            }}
          />

          {/* Content */}
          <div className="relative flex flex-col items-center gap-3 px-6 py-8 max-w-sm w-full mx-4">

            {/* Glowing ring behind level badge */}
            <motion.div
              className="absolute rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.5, 1.2],
                opacity: [0, 0.6, 0.3],
              }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{
                width: 200,
                height: 200,
                top: '10%',
                background: isDark
                  ? 'radial-gradient(circle, rgba(129, 140, 248, 0.4) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />

            {/* Crown / star icon */}
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: [0, 1.3, 1], rotate: [0, 10, 0] }}
              transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
              className="text-5xl"
            >
              👑
            </motion.div>

            {/* NAIK LEVEL text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className={`text-sm font-bold tracking-[0.3em] uppercase ${
                isDark ? 'text-indigo-300' : 'text-indigo-600'
              }`}
            >
              Naik Level!
            </motion.div>

            {/* Level number */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.7, type: 'spring', stiffness: 200, damping: 15 }}
              className="relative"
            >
              <div
                className={`text-8xl font-black tabular-nums leading-none ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
                style={{
                  textShadow: isDark
                    ? '0 0 40px rgba(129, 140, 248, 0.5), 0 0 80px rgba(129, 140, 248, 0.2)'
                    : '0 0 40px rgba(99, 102, 241, 0.3)',
                }}
              >
                {newLevel}
              </div>
            </motion.div>

            {/* Rank name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className={`text-center text-base font-semibold px-4 py-2 rounded-2xl ${
                isDark
                  ? 'bg-indigo-500/15 text-indigo-200 border border-indigo-500/20'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}
            >
              {rank}
            </motion.div>

            {/* Motivational text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className={`text-center text-sm mt-1 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {newLevel >= 100
                ? 'Pencapaian luar biasa! Kamu sudah menjadi legenda! 🌟'
                : newLevel >= 50
                ? 'Kekuatanmu semakin dahsyat! Terus melangkah! 💪'
                : 'Terus berlatih, kekuatanmu bertambah! 🔥'}
            </motion.p>

            {/* Tap to dismiss hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.3, 0.6] }}
              transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
              className={`text-xs mt-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
            >
              Ketuk untuk melanjutkan
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelUpCelebration;
