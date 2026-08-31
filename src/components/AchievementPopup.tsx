import { motion, AnimatePresence } from 'motion/react';
import { getRarityColor, getRarityBg } from '../utils/achievements';

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  rarity: string;
  xpReward: number;
}

interface AchievementPopupProps {
  theme: 'light' | 'dark';
  achievements: Achievement[];
  onDismiss: () => void;
}

export default function AchievementPopup({ theme, achievements, onDismiss }: AchievementPopupProps) {
  return (
    <div className="fixed top-20 right-4 z-[200] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {achievements.map((ach: Achievement, index: number) => {
          return (
            <motion.div
              key={`${ach.id}-${index}`}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl flex items-center gap-4 w-72 md:w-80 ${getRarityBg(ach.rarity, theme === 'dark')} bg-white dark:bg-slate-900/95 backdrop-blur-md`}
              onClick={onDismiss}
            >
              <div className="text-4xl">{ach.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-500 mb-0.5 flex items-center gap-1">
                  <span>ACHIEVEMENT UNLOCKED</span>
                </div>
                <h4 className={`text-sm font-black truncate ${getRarityColor(ach.rarity, theme === 'dark')}`}>{ach.title}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{ach.description}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  +{ach.xpReward} XP
                </div>
              </div>
              {ach.rarity === 'legendary' && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
