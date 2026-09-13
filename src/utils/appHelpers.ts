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

export const shuffleQuestionOptions = (q: Question): Question => {
  if (!q.pilihan || q.pilihan.length <= 1) return q;

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
