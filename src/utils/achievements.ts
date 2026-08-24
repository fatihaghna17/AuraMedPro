// src/utils/achievements.ts
export interface AchievementStats {
  totalQuizzes: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  xp: number;
  perfectScores: number;
  dailyChallengesCompleted: number;
  uniqueBanksAttempted: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (stats: AchievementStats) => boolean;
  category: 'quiz' | 'streak' | 'mastery' | 'social';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  isUnlocked?: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_quiz', title: 'Langkah Pertama', description: 'Selesaikan kuis pertama', icon: '🎯', condition: s => s.totalQuizzes >= 1, category: 'quiz', rarity: 'common', xpReward: 50 },
  { id: 'quizzes_10', title: 'Pemanasan', description: 'Selesaikan 10 kuis', icon: '🏃', condition: s => s.totalQuizzes >= 10, category: 'quiz', rarity: 'common', xpReward: 100 },
  { id: 'perfect_first', title: 'Sempurna!', description: 'Skor 100% pertama kali', icon: '💯', condition: s => s.perfectScores >= 1, category: 'quiz', rarity: 'rare', xpReward: 200 },
  { id: 'perfect_5', title: 'Tak Tertandingi', description: 'Skor 100% sebanyak 5 kali', icon: '👑', condition: s => s.perfectScores >= 5, category: 'quiz', rarity: 'epic', xpReward: 500 },
  { id: 'questions_100', title: 'Ratusan Soal', description: 'Jawab 100 soal total', icon: '📝', condition: s => s.totalQuestionsAnswered >= 100, category: 'quiz', rarity: 'common', xpReward: 150 },
  { id: 'questions_1000', title: 'Sarjana Soal', description: 'Jawab 1000 soal total', icon: '🎓', condition: s => s.totalQuestionsAnswered >= 1000, category: 'quiz', rarity: 'epic', xpReward: 800 },
  { id: 'questions_5000', title: 'Legenda UKMPPD', description: 'Jawab 5000 soal total', icon: '🏅', condition: s => s.totalQuestionsAnswered >= 5000, category: 'quiz', rarity: 'legendary', xpReward: 2000 },
  { id: 'streak_3', title: 'Konsisten 3 Hari', description: 'Streak 3 hari berturut', icon: '🔥', condition: s => s.currentStreak >= 3, category: 'streak', rarity: 'common', xpReward: 75 },
  { id: 'streak_7', title: 'Semangat Mingguan', description: 'Streak 7 hari berturut', icon: '🌟', condition: s => s.currentStreak >= 7, category: 'streak', rarity: 'rare', xpReward: 200 },
  { id: 'streak_30', title: 'Master Bulanan', description: 'Streak 30 hari berturut', icon: '⚡', condition: s => s.currentStreak >= 30, category: 'streak', rarity: 'epic', xpReward: 1000 },
  { id: 'streak_100', title: 'Kultivator Sejati', description: 'Streak 100 hari berturut', icon: '🐉', condition: s => s.currentStreak >= 100, category: 'streak', rarity: 'legendary', xpReward: 5000 },
  { id: 'level_10', title: 'Calon Asisten', description: 'Capai Level 10', icon: '📖', condition: s => s.level >= 10, category: 'mastery', rarity: 'common', xpReward: 100 },
  { id: 'level_50', title: 'Dokter Muda', description: 'Capai Level 50', icon: '🩺', condition: s => s.level >= 50, category: 'mastery', rarity: 'epic', xpReward: 2000 },
  { id: 'level_100', title: 'Spesialis Ultimate', description: 'Capai Level 100', icon: '🏆', condition: s => s.level >= 100, category: 'mastery', rarity: 'legendary', xpReward: 10000 },
];

export function checkNewAchievements(stats: AchievementStats, alreadyUnlocked: string[]): Achievement[] {
  return ACHIEVEMENTS.filter(a => !alreadyUnlocked.includes(a.id) && a.condition(stats));
}

export function getRarityColor(rarity: string, isDark: boolean): string {
  switch (rarity) {
    case 'common': return isDark ? 'text-slate-300' : 'text-slate-600';
    case 'rare': return 'text-blue-500';
    case 'epic': return 'text-purple-500';
    case 'legendary': return 'text-amber-500';
    default: return 'text-slate-500';
  }
}

export function getRarityBg(rarity: string, isDark: boolean): string {
  switch (rarity) {
    case 'common': return isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-200';
    case 'rare': return 'bg-blue-500/10 border-blue-500/30';
    case 'epic': return 'bg-purple-500/10 border-purple-500/30';
    case 'legendary': return 'bg-amber-500/10 border-amber-500/30';
    default: return '';
  }
}
