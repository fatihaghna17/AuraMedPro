import { HistoryEntry } from '../types';

/**
 * Parse JSON dari localStorage dengan aman.
 * Jika data korup (mis. penulisan multi-MB terputus saat halaman crash di iOS/Safari),
 * nilai asli DIKARANTINA ke key `<key>__corrupted_backup` (bisa diselamatkan manual),
 * key yang korup dihapus, lalu dipakai nilai default — sehingga aplikasi TETAP BISA BOOT.
 */
export function safeLocalStorageParse<T>(
  key: string,
  fallback: T,
  validate?: (v: any) => boolean
): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    if (validate && !validate(parsed)) {
      console.warn(`[Storage] Isi "${key}" tidak valid — diabaikan, pakai default.`);
      return fallback;
    }
    return parsed as T;
  } catch (e) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        localStorage.setItem(`${key}__corrupted_backup`, raw);
        localStorage.removeItem(key);
      }
    } catch { /* abaikan */ }
    console.warn(`[Storage] Data "${key}" korup & dikarantina ke "${key}__corrupted_backup".`, e);
    return fallback;
  }
}

export const loadHistoryFromLocalStorage = (): HistoryEntry[] => {
  try {
    const saved = localStorage.getItem('cbtQuizHistory');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
      console.warn('[History] cbtQuizHistory bukan array — diabaikan.');
    }
  } catch (e) {
    // Data korup → karantina agar aplikasi tetap bisa boot
    try {
      const raw = localStorage.getItem('cbtQuizHistory');
      if (raw) {
        localStorage.setItem('cbtQuizHistory__corrupted_backup', raw);
        localStorage.removeItem('cbtQuizHistory');
      }
    } catch { /* abaikan */ }
    console.warn('[History] Data riwayat korup & dikarantina ke cbtQuizHistory__corrupted_backup:', e);
  }
  return [];
};

/**
 * Versi hemat: buang payload berat (soal & jawaban) dari entri lama.
 * Ringkasan skor tetap utuh — hanya detail review soal yang dilepas.
 */
const slimEntry = (entry: HistoryEntry): HistoryEntry => ({
  ...entry,
  questions: undefined,
  userAnswers: undefined
});

/**
 * Menyimpan riwayat dengan strategi bertingkat agar tidak pernah gagal senyap:
 *  1. Coba simpan utuh
 *  2. Kalau kuota penuh → buang payload soal/jawaban entri lama (5 terbaru tetap utuh), coba lagi
 *  3. Kalau masih gagal → semua entri jadi ringkasan, coba lagi
 *  4. Kalau masih gagal → pangkas jumlah entri lama bertahap (minimal 10 terbaru)
 * Return true jika berhasil disimpan, false jika benar-benar gagal (untuk notifikasi UI).
 */
export const saveHistoryToLocalStorage = (
  newHistory: HistoryEntry[],
  setQuizHistory: (h: HistoryEntry[]) => void
): boolean => {
  setQuizHistory(newHistory);

  const attempts: HistoryEntry[][] = [
    newHistory,
    newHistory.map((e, i) => (i < 5 ? e : slimEntry(e))),
    newHistory.map(slimEntry)
  ];

  for (const attempt of attempts) {
    try {
      localStorage.setItem('cbtQuizHistory', JSON.stringify(attempt));
      return true;
    } catch { /* lanjut ke strategi berikutnya */ }
  }

  let working = attempts[2];
  while (working.length > 10) {
    working = working.slice(0, Math.max(10, Math.floor(working.length / 2)));
    try {
      localStorage.setItem('cbtQuizHistory', JSON.stringify(working));
      return true;
    } catch { /* pangkas lagi */ }
  }

  console.warn('[History] localStorage penuh — riwayat gagal disimpan.');
  return false;
};
