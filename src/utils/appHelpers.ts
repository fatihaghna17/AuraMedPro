import { Question } from '../types';
import { getCorrectLetterForQuestion } from './quizUtils';

export const getLevelInfo = (xp: number) => {
  const getXPForLevel = (l: number) => 50 * (l - 1) * (l - 1) + 50 * (l - 1);
  const currentLevel = Math.min(500, Math.floor(0.5 + 0.5 * Math.sqrt(1 + xp / 12.5))) || 1;
  
  const prevXP = getXPForLevel(currentLevel);
  const nextXPVal = currentLevel < 500 ? getXPForLevel(currentLevel + 1) : null;
  
  const nextXP = nextXPVal !== null ? nextXPVal : 'MAX';
  const progress = nextXPVal !== null ? Math.max(0, Math.min(100, ((xp - prevXP) / (nextXPVal - prevXP)) * 100)) : 100;
  
  const getRankName = (lvl: number) => {
    if (lvl >= 500) return 'Kaisar Semesta Medika Purba Abadi (Supreme Primordial Emperor of Medicine)';
    if (lvl >= 450) return 'Dewa Agung Nirvana Medika (Grand Nirvana Medical God)';
    if (lvl >= 400) return 'Penguasa Langit Medis Sejati (True Sovereign of Celestial Healing)';
    if (lvl >= 350) return 'Mahadewa Pengembara Galaksi (Galactic Traversing Sage)';
    if (lvl >= 300) return 'Kultivator Nirwana Tingkat Puncak (Peak Nirvana Cultivator)';
    if (lvl >= 250) return 'Penyembuh Jiwa Nirwana (Nirvana Soul Healer)';
    if (lvl >= 200) return 'Kultivator Alam Mahasuci (Sacred Realm Grand Cultivator)';
    if (lvl >= 150) return 'Mahadewa Kedokteran Surgawi (Heavenly God of Medicine)';
    if (lvl >= 120) return 'Kultivator Transenden Surgawi (Transcendent Heavenly Sage)';
    if (lvl >= 100) return 'Kultivator Surgawi Abadi Sejati (Eternal True Heavenly Sage)';
    if (lvl >= 95) return 'Luhur Kultivator Surgawi (Heavenly Venerable Scholar - Divine Aura)';
    if (lvl >= 91) return 'Luhur Kultivator Surgawi (Heavenly Venerable Scholar)';
    if (lvl >= 81) return 'Kaisar Kultivator Surgawi (Heavenly Cultivator Emperor)';
    if (lvl >= 71) return 'Raja Kultivator Surgawi (Heavenly Cultivator King)';
    if (lvl >= 61) return 'Kultivator Surgawi Akhir (Late Heavenly Scholar)';
    if (lvl >= 51) return 'Kultivator Surgawi Menengah (Mid Heavenly Scholar)';
    if (lvl >= 41) return 'Kultivator Surgawi Awal (Early Heavenly Scholar)';
    if (lvl >= 31) return 'Mahasiswa Kultivator Kuasi-Surgawi (Quasi-Heavenly Student)';
    if (lvl >= 21) return 'Mahasiswa Kultivator Dunia Atas (Upper Realm Cultivator)';
    if (lvl >= 16) return 'Mahasiswa Kultivator Dunia Tengah (Middle Realm Scholar)';
    if (lvl >= 11) return 'Mahasiswa Kultivator Dunia Bawah (Underworld Student)';
    if (lvl >= 6) return 'Mahasiswa Kultivator Bumi (Earth Scholar)';
    return 'Mahasiswa Kultivator Fana (Mortal Student)';
  };

  return {
    level: currentLevel,
    rank: getRankName(currentLevel),
    nextXP,
    prevXP,
    progress
  };
};

export const shuffleArray = <T,>(array: T[]): T[] => {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Opsi yang bergantung pada posisi/opsi lain (mis. "Semua benar") tidak boleh diacak
const NON_SHUFFLE_OPTION_PATTERN =
  /\b(semua|seluruh(?:nya)?)\b.*\b(benar|salah|jawaban|di atas|diatas|opsi|pilihan)\b|\b(tidak ada|bukan)\b.*\b(benar|salah|di atas|diatas)\b|\b(jawaban|opsi|pilihan)?\s*[a-e]\s*(dan|&|,|serta|atau)\s*[a-e]\b.*\b(benar|salah)\b|\ball of the above\b|\bnone of the above\b|\bboth\s+[a-e]\s+and\s+[a-e]\b/i;

export const shouldKeepOptionOrder = (q: Question): boolean =>
  !!q.pilihan?.some((opt) => NON_SHUFFLE_OPTION_PATTERN.test(String(opt ?? '')));

export const shuffleQuestionOptions = (q: Question): Question => {
  if (!q.pilihan || q.pilihan.length <= 1) return q;
  if (shouldKeepOptionOrder(q)) return q;

  let correctOptionText = '';
  const correctLetter = getCorrectLetterForQuestion(q);
  const correctIndex = ['A', 'B', 'C', 'D', 'E'].indexOf(correctLetter);

  if (correctIndex !== -1 && correctIndex < q.pilihan.length) {
    correctOptionText = q.pilihan[correctIndex];
  } else {
    correctOptionText = q.jawaban_benar;
  }

  const shuffledPilihan = shuffleArray([...q.pilihan]);
  const newCorrectIndex = shuffledPilihan.indexOf(correctOptionText);
  let newJawabanBenar = q.jawaban_benar;

  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  if (newCorrectIndex !== -1 && newCorrectIndex < letters.length) {
    const newCorrectLetter = letters[newCorrectIndex];

    if (/^[A-J]$/i.test(q.jawaban_benar?.trim() || '')) {
      newJawabanBenar = newCorrectLetter;
    }
  }

  let newEliminasiOpsi = q.eliminasi_opsi;
  if (q.eliminasi_opsi) {
    const updatedEliminasi: Record<string, string> = {};

    // Iterasikan opsi YANG SUDAH DIACAK agar urutan key eliminasi (A, B, C, dst.)
    // terdaftar persis berurutan sesuai posisi fisik opsi di layar dari atas ke bawah
    shuffledPilihan.forEach((newOpt, newIdx) => {
      const newLetter = letters[newIdx] || String.fromCharCode(65 + newIdx);
      const oldIdx = q.pilihan.indexOf(newOpt);
      if (oldIdx !== -1) {
        const oldLetter = letters[oldIdx] || String.fromCharCode(65 + oldIdx);
        const desc = q.eliminasi_opsi![oldLetter] || q.eliminasi_opsi![oldLetter.toLowerCase()];
        if (desc) {
          updatedEliminasi[newLetter] = desc;
        }
      }
    });
    newEliminasiOpsi = updatedEliminasi;
  }

  return {
    ...q,
    pilihan: shuffledPilihan,
    jawaban_benar: newJawabanBenar,
    eliminasi_opsi: newEliminasiOpsi
  };
};

export const formatNotifTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} jam lalu`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

// ============================================================
// Streak Fire Color Progression System (Api Berjenjang)
// ============================================================

export interface FlameStyle {
  tierName: string;
  colorHex: string;
  textColor: string;
  flameColor: string;
  bgColor: string;
  borderColor: string;
  glowClass: string;
  badgeClass: string;
  iconAnimClass: string;
}

export const getStreakFlameStyle = (streak: number): FlameStyle => {
  if (streak >= 100) {
    return {
      tierName: 'Api Purba Raja Iblis',
      colorHex: '#ef4444',
      textColor: 'text-rose-500 dark:text-rose-400 font-black',
      flameColor: 'text-red-500 fill-red-600',
      bgColor: 'bg-red-500/15',
      borderColor: 'border-red-500/40',
      glowClass: 'flame-glow-demon',
      badgeClass: 'bg-gradient-to-r from-red-950/40 via-red-900/30 to-purple-950/40 text-rose-300 border-red-500/40 shadow-sm shadow-red-500/30',
      iconAnimClass: 'animate-bounce',
    };
  }
  if (streak >= 60) {
    return {
      tierName: 'Api Emas Surya',
      colorHex: '#eab308',
      textColor: 'text-amber-500 dark:text-amber-300 font-extrabold',
      flameColor: 'text-yellow-400 fill-yellow-500',
      bgColor: 'bg-amber-400/15',
      borderColor: 'border-amber-400/35',
      glowClass: 'flame-glow-gold',
      badgeClass: 'bg-amber-400/15 text-amber-500 dark:text-amber-300 border-amber-400/30 shadow-sm shadow-amber-400/20',
      iconAnimClass: 'animate-pulse',
    };
  }
  if (streak >= 30) {
    return {
      tierName: 'Api Biru Terpanas',
      colorHex: '#06b6d4',
      textColor: 'text-cyan-600 dark:text-cyan-400 font-extrabold',
      flameColor: 'text-cyan-400 fill-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      glowClass: 'flame-glow-cyan',
      badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 shadow-sm shadow-cyan-500/20',
      iconAnimClass: 'animate-pulse',
    };
  }
  if (streak >= 14) {
    return {
      tierName: 'Api Ungu Mistis',
      colorHex: '#a855f7',
      textColor: 'text-purple-600 dark:text-purple-400 font-extrabold',
      flameColor: 'text-purple-500 fill-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/25',
      glowClass: 'flame-glow-purple',
      badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25 shadow-sm shadow-purple-500/20',
      iconAnimClass: 'animate-pulse',
    };
  }
  if (streak >= 7) {
    return {
      tierName: 'Api Merah Crimson',
      colorHex: '#f43f5e',
      textColor: 'text-rose-600 dark:text-rose-400 font-bold',
      flameColor: 'text-rose-500 fill-rose-500',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/25',
      glowClass: 'flame-glow-crimson',
      badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
      iconAnimClass: 'animate-pulse',
    };
  }
  if (streak >= 3) {
    return {
      tierName: 'Api Oranye Membara',
      colorHex: '#f97316',
      textColor: 'text-orange-600 dark:text-orange-400 font-bold',
      flameColor: 'text-orange-500 fill-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/25',
      glowClass: 'flame-glow-orange',
      badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25',
      iconAnimClass: '',
    };
  }
  if (streak >= 1) {
    return {
      tierName: 'Api Percikan Amber',
      colorHex: '#f59e0b',
      textColor: 'text-amber-600 dark:text-amber-400 font-bold',
      flameColor: 'text-amber-500 fill-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      glowClass: 'flame-glow-amber',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      iconAnimClass: '',
    };
  }
  return {
    tierName: 'Api Padam',
    colorHex: '#94a3b8',
    textColor: 'text-slate-400 dark:text-slate-500 font-normal',
    flameColor: 'text-slate-400 dark:text-slate-500',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
    glowClass: '',
    badgeClass: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20',
    iconAnimClass: '',
  };
};

export const getComboFlameStyle = (combo: number): FlameStyle => {
  if (combo >= 50) {
    return {
      tierName: 'Api Purba Raja Iblis',
      colorHex: '#ef4444',
      textColor: 'text-rose-500 dark:text-rose-400 font-black',
      flameColor: 'text-red-500 fill-red-600',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/50',
      glowClass: 'flame-glow-demon',
      badgeClass: 'bg-gradient-to-r from-red-950/40 via-red-900/30 to-purple-950/40 text-rose-300 border-red-500/40 shadow-sm shadow-red-500/30',
      iconAnimClass: 'animate-bounce',
    };
  }
  if (combo >= 30) {
    return {
      tierName: 'Api Emas Surya',
      colorHex: '#eab308',
      textColor: 'text-amber-500 dark:text-amber-300 font-extrabold',
      flameColor: 'text-yellow-400 fill-yellow-500',
      bgColor: 'bg-amber-400/20',
      borderColor: 'border-amber-400/40',
      glowClass: 'flame-glow-gold',
      badgeClass: 'bg-amber-400/15 text-amber-500 dark:text-amber-300 border-amber-400/30 shadow-sm shadow-amber-400/20',
      iconAnimClass: 'animate-bounce',
    };
  }
  if (combo >= 20) {
    return {
      tierName: 'Api Biru Terpanas',
      colorHex: '#06b6d4',
      textColor: 'text-cyan-600 dark:text-cyan-400 font-extrabold',
      flameColor: 'text-cyan-400 fill-cyan-400',
      bgColor: 'bg-cyan-500/15',
      borderColor: 'border-cyan-500/30',
      glowClass: 'flame-glow-cyan',
      badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 shadow-sm shadow-cyan-500/20',
      iconAnimClass: 'animate-bounce',
    };
  }
  if (combo >= 10) {
    return {
      tierName: 'Api Ungu Mistis',
      colorHex: '#a855f7',
      textColor: 'text-purple-600 dark:text-purple-400 font-extrabold',
      flameColor: 'text-purple-500 fill-purple-500',
      bgColor: 'bg-purple-500/15',
      borderColor: 'border-purple-500/30',
      glowClass: 'flame-glow-purple',
      badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25 shadow-sm shadow-purple-500/20',
      iconAnimClass: 'animate-bounce',
    };
  }
  if (combo >= 5) {
    return {
      tierName: 'Api Merah Crimson',
      colorHex: '#f43f5e',
      textColor: 'text-rose-600 dark:text-rose-400 font-bold',
      flameColor: 'text-rose-500 fill-rose-500',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/25',
      glowClass: 'flame-glow-crimson',
      badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
      iconAnimClass: 'animate-bounce',
    };
  }
  if (combo >= 3) {
    return {
      tierName: 'Api Oranye Membara',
      colorHex: '#f97316',
      textColor: 'text-orange-600 dark:text-orange-400 font-bold',
      flameColor: 'text-orange-500 fill-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/25',
      glowClass: 'flame-glow-orange',
      badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25',
      iconAnimClass: 'animate-bounce',
    };
  }
  if (combo >= 1) {
    return {
      tierName: 'Api Percikan Amber',
      colorHex: '#f59e0b',
      textColor: 'text-amber-600 dark:text-amber-400 font-bold',
      flameColor: 'text-amber-500 fill-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      glowClass: 'flame-glow-amber',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      iconAnimClass: 'animate-bounce',
    };
  }
  return {
    tierName: 'Api Padam',
    colorHex: '#94a3b8',
    textColor: 'text-slate-400 dark:text-slate-500 font-normal',
    flameColor: 'text-slate-400 dark:text-slate-500',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
    glowClass: '',
    badgeClass: 'bg-slate-500/10 text-slate-400 dark:text-slate-500 border-slate-500/20',
    iconAnimClass: '',
  };
};

