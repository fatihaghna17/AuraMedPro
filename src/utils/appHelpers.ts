import { Question } from '../types';
import { getCorrectLetterForQuestion } from './quizUtils';

export const getLevelInfo = (xp: number) => {
  const getXPForLevel = (l: number) => 50 * (l - 1) * (l - 1) + 50 * (l - 1);
  const currentLevel = Math.min(100, Math.floor(0.5 + 0.5 * Math.sqrt(1 + xp / 12.5))) || 1;
  
  const prevXP = getXPForLevel(currentLevel);
  const nextXPVal = currentLevel < 100 ? getXPForLevel(currentLevel + 1) : null;
  
  const nextXP = nextXPVal !== null ? nextXPVal : 'MAX';
  const progress = nextXPVal !== null ? Math.max(0, Math.min(100, ((xp - prevXP) / (nextXPVal - prevXP)) * 100)) : 100;
  
  const getRankName = (lvl: number) => {
    if (lvl >= 100) return 'Kultivator Surgawi Abadi Sejati (Eternal True Heavenly Sage)';
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

  if (newCorrectIndex !== -1) {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const newCorrectLetter = letters[newCorrectIndex];

    if (/^[A-E]$/i.test(q.jawaban_benar.trim())) {
      newJawabanBenar = newCorrectLetter;
    }
  }

  let newEliminasiOpsi = q.eliminasi_opsi;
  if (q.eliminasi_opsi) {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const updatedEliminasi: Record<string, string> = {};

    q.pilihan.forEach((oldOpt, oldIdx) => {
      const oldLetter = letters[oldIdx];
      const desc = q.eliminasi_opsi![oldLetter] || q.eliminasi_opsi![oldLetter.toLowerCase()];
      if (desc) {
        const newIdx = shuffledPilihan.indexOf(oldOpt);
        if (newIdx !== -1) {
          const newLetter = letters[newIdx];
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
