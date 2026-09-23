// ============================================================
// AuraMedPro Avatar Frame System (Bingkai Avatar Koleksi)
// ============================================================

export type AvatarFrameId =
  | 'default'
  | 'stethoscope_bronze'
  | 'stethoscope_gold'
  | 'quest_500_today'
  | 'ekg_neon'
  | 'sudden_death_master'
  | 'veteran_3000'
  | 'caduceus_mythic'
  | 'demon_king_100';

export interface AvatarFrame {
  id: AvatarFrameId;
  name: string;
  badge: string;
  description: string;
  requirementText: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  ringClass: string;
  glowClass: string;
  auraClass?: string;
  isUnlocked: (stats: {
    level: number;
    totalQuestions: number;
    suddenDeathBest: number;
    todayQuestions?: number;
    isAdmin?: boolean;
  }) => boolean;
}

export const AVATAR_FRAMES: AvatarFrame[] = [
  {
    id: 'default',
    name: 'Kandidat Dokter',
    badge: '🩺',
    description: 'Bingkai standar kebanggaan setiap mahasiswa kedokteran.',
    requirementText: 'Terbuka otomatis untuk semua pengguna',
    rarity: 'common',
    ringClass: 'p-[3px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-teal-500',
    glowClass: 'shadow-md shadow-indigo-500/20',
    isUnlocked: () => true
  },
  {
    id: 'stethoscope_bronze',
    name: 'Stetoskop Perunggu',
    badge: '🥉',
    description: 'Aura tembaga teruji untuk dokter muda yang mulai berproses.',
    requirementText: 'Capai Kultivator Level 10+',
    rarity: 'rare',
    ringClass: 'p-[3px] bg-gradient-to-tr from-amber-700 via-amber-600 to-orange-500 border border-amber-500/40',
    glowClass: 'shadow-lg shadow-amber-700/30 ring-2 ring-amber-600/30',
    isUnlocked: ({ level, isAdmin }) => Boolean(isAdmin || level >= 10)
  },
  {
    id: 'stethoscope_gold',
    name: 'Stetoskop Emas Murni',
    badge: '🥇',
    description: 'Kilau emas murni lambang dedikasi ratusan jam belajar CBT.',
    requirementText: 'Capai Kultivator Level 50+',
    rarity: 'epic',
    ringClass: 'p-[3.5px] bg-gradient-to-tr from-yellow-400 via-amber-300 to-yellow-500 border-2 border-yellow-200',
    glowClass: 'shadow-xl shadow-amber-500/40 ring-2 ring-amber-400/50 animate-pulse',
    isUnlocked: ({ level, isAdmin }) => Boolean(isAdmin || level >= 50)
  },
  {
    id: 'quest_500_today',
    name: 'Aura Maraton (500 Soal)',
    badge: '🔥',
    description: 'Aura violet elektrik membara, bukti kegigihan menuntaskan 500 soal dalam satu hari.',
    requirementText: 'Kerjakan 500 Soal Hari Ini (Quest Harian)',
    rarity: 'epic',
    ringClass: 'p-[3.5px] bg-gradient-to-tr from-purple-600 via-indigo-500 to-fuchsia-500 border-2 border-purple-300',
    glowClass: 'shadow-xl shadow-purple-500/50 ring-2 ring-indigo-400/50 animate-pulse',
    auraClass: 'aura-quest-row',
    isUnlocked: (stats) => Boolean(stats.isAdmin || (stats.todayQuestions !== undefined && stats.todayQuestions >= 500) || isQuest500Completed())
  },
  {
    id: 'ekg_neon',
    name: 'Gelombang EKG Neon',
    badge: '⚡',
    description: 'Glow hijau neon cyberpunk memancar seperti sinyal monitor ICU.',
    requirementText: 'Selesaikan minimal 1.000 Soal',
    rarity: 'legendary',
    ringClass: 'p-[3.5px] bg-gradient-to-tr from-emerald-400 via-teal-300 to-cyan-400 border border-emerald-300',
    glowClass: 'shadow-xl shadow-emerald-500/50 ring-2 ring-teal-400/60',
    isUnlocked: ({ totalQuestions, isAdmin }) => Boolean(isAdmin || totalQuestions >= 1000)
  },
  {
    id: 'sudden_death_master',
    name: 'Tengkorak Emas (Survivor)',
    badge: '💀',
    description: 'Glow bara api crimson membuktikan ketangguhan mental 1 nyawa.',
    requirementText: 'Capai Streak ≥ 20 di Mode Sudden Death',
    rarity: 'legendary',
    ringClass: 'p-[3.5px] bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 border-2 border-rose-300',
    glowClass: 'shadow-xl shadow-rose-600/60 ring-2 ring-rose-500/70 animate-pulse',
    auraClass: 'aura-suddendeath-row',
    isUnlocked: ({ suddenDeathBest, isAdmin }) => Boolean(isAdmin || suddenDeathBest >= 20)
  },
  {
    id: 'veteran_3000',
    name: 'Aura Veteran (3.000+ Soal)',
    badge: '⚡',
    description: 'Pancaran aura teal-cyan kosmik dari seorang legenda yang telah menuntaskan 3.000+ soal ujian.',
    requirementText: 'Selesaikan minimal 3.000 Soal',
    rarity: 'legendary',
    ringClass: 'p-[3.5px] bg-gradient-to-tr from-teal-400 via-cyan-400 to-blue-500 border-2 border-teal-200',
    glowClass: 'shadow-2xl shadow-teal-500/60 ring-4 ring-teal-400/40 animate-pulse',
    auraClass: 'aura-veteran-row',
    isUnlocked: ({ totalQuestions, isAdmin }) => Boolean(isAdmin || totalQuestions >= 3000)
  },
  {
    id: 'caduceus_mythic',
    name: 'Aura Sultan (Asklepios)',
    badge: '👑',
    description: 'Aura emas-ungu suci tertinggi lambang dewa kedokteran untuk kultivator Level 95+.',
    requirementText: 'Capai Kultivator Level 95+',
    rarity: 'mythic',
    ringClass: 'p-[4px] bg-gradient-to-tr from-yellow-300 via-purple-500 to-pink-500 border-2 border-yellow-100',
    glowClass: 'shadow-2xl shadow-yellow-500/60 ring-4 ring-yellow-400/40 animate-pulse',
    auraClass: 'aura-mythic-row',
    isUnlocked: ({ level, isAdmin }) => Boolean(isAdmin || level >= 95)
  },
  {
    id: 'demon_king_100',
    name: 'Raja Iblis (Demon Lord)',
    badge: '👹',
    description: 'Aura hitam pekat kehampaan dengan kobaran darah kemerahan kejam. Bukti dominasi mutlak 100 streak tanpa ampun di Mode Sudden Death.',
    requirementText: 'Capai Streak ≥ 100 di Mode Sudden Death',
    rarity: 'mythic',
    ringClass: 'p-[4px] bg-gradient-to-tr from-black via-zinc-950 to-red-600 border-2 border-red-500 shadow-2xl shadow-red-950',
    glowClass: 'shadow-[0_0_28px_rgba(220,38,38,0.9)] ring-2 ring-black ring-offset-2 ring-offset-red-600 animate-pulse',
    auraClass: 'aura-demon-king-row',
    isUnlocked: ({ suddenDeathBest, isAdmin }) => Boolean(isAdmin || suddenDeathBest >= 100)
  }
];

const FRAME_STORAGE_KEY = 'auramedpro_avatar_frame';
const SUDDEN_DEATH_BEST_KEY = 'auramedpro_suddendeath_best';

export function getSavedAvatarFrame(): AvatarFrameId {
  try {
    const saved = localStorage.getItem(FRAME_STORAGE_KEY);
    if (saved && AVATAR_FRAMES.some(f => f.id === saved)) {
      return saved as AvatarFrameId;
    }
  } catch (e) {
    // Ignore error
  }
  return 'default';
}

export function setSavedAvatarFrame(id: AvatarFrameId): void {
  try {
    localStorage.setItem(FRAME_STORAGE_KEY, id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auramedpro_frame_changed', { detail: id }));
    }
  } catch (e) {
    // Ignore error
  }
}

export function getSuddenDeathBestStreak(): number {
  try {
    const saved = localStorage.getItem(SUDDEN_DEATH_BEST_KEY);
    if (saved) {
      return parseInt(saved, 10) || 0;
    }
  } catch (e) {
    // Ignore error
  }
  return 0;
}

export function saveSuddenDeathStreak(streak: number): boolean {
  try {
    const currentBest = getSuddenDeathBestStreak();
    if (streak > currentBest) {
      localStorage.setItem(SUDDEN_DEATH_BEST_KEY, streak.toString());
      return true; // New record!
    }
  } catch (e) {
    // Ignore error
  }
  return false;
}

// ============================================================
// Daily 500 Questions Quest Tracking (Asia/Jakarta Timezone)
// ============================================================

export function getJakartaDateString(dateInput?: string | Date): string {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

export function getTodayQuestionsAnswered(quizHistory?: any[]): number {
  try {
    const today = getJakartaDateString();
    const key = `auramedpro_daily_q_${today}`;
    const rawVal = localStorage.getItem(key);
    const localCount = rawVal ? parseInt(rawVal, 10) || 0 : 0;

    let historyCount = 0;
    if (quizHistory && Array.isArray(quizHistory)) {
      historyCount = quizHistory.filter(h => {
        if (!h.date) return false;
        return getJakartaDateString(h.date) === today;
      }).reduce((acc, h) => acc + (Number(h.total) || Number(h.questions_count) || 0), 0);
    }

    const totalToday = Math.max(localCount, historyCount);
    if (totalToday >= 500) {
      localStorage.setItem('auramedpro_quest_500_completed', 'true');
    }
    return totalToday;
  } catch (e) {
    return 0;
  }
}

export function incrementTodayQuestionsAnswered(amount: number = 1): number {
  try {
    const today = getJakartaDateString();
    const key = `auramedpro_daily_q_${today}`;
    const current = getTodayQuestionsAnswered();
    const nextCount = current + amount;
    localStorage.setItem(key, nextCount.toString());

    if (nextCount >= 500) {
      localStorage.setItem('auramedpro_quest_500_completed', 'true');
    }
    return nextCount;
  } catch (e) {
    return 0;
  }
}

export function isQuest500Completed(): boolean {
  try {
    if (localStorage.getItem('auramedpro_quest_500_completed') === 'true') {
      return true;
    }
    return getTodayQuestionsAnswered() >= 500;
  } catch (e) {
    return false;
  }
}
