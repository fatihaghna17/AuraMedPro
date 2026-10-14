import { HistoryEntry } from '../types';
import { saveHistoryToIndexedDB } from './indexedDbStorage';

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
 * Versi hemat: buang payload soal dari entri lama untuk menghemat kuota localStorage.
 * PENTING: userAnswers TETAP DIPERTAHANKAN (ukurannya hanya ~300 byte) agar status benar/salah
 * dan jawaban yang dipilih user tidak hilang saat direview.
 */
export const slimEntry = (entry: HistoryEntry): HistoryEntry => ({
  ...entry,
  questions: undefined,
  userAnswers: entry.userAnswers
});

/**
 * Menyimpan riwayat dengan strategi bertingkat:
 *  1. Selalu backup data lengkap ke IndexedDB (kuota ratusan MB/GB di iOS Safari & Chrome)
 *  2. Update state React
 *  3. Coba simpan ke localStorage dengan degradasi halus (Semua -> 4 -> 3 -> 2 -> 1 -> 0 entri lengkap)
 * Return true jika berhasil disimpan ke localStorage / IndexedDB.
 */
export const saveHistoryToLocalStorage = (
  newHistory: HistoryEntry[],
  setQuizHistory: (h: HistoryEntry[]) => void
): boolean => {
  setQuizHistory(newHistory);

  // 1. Simpan data lengkap ke IndexedDB (garansi tidak kena QuotaExceeded 5MB di iOS Safari)
  saveHistoryToIndexedDB(newHistory).catch((err) => {
    console.warn('[Storage] Gagal menyimpan ke IndexedDB:', err);
  });

  // 2. Simpan ke localStorage untuk akses sinkron cepat saat boot
  const attempts: HistoryEntry[][] = [
    newHistory,
    newHistory.map((e, i) => (i < 4 ? e : slimEntry(e))),
    newHistory.map((e, i) => (i < 3 ? e : slimEntry(e))),
    newHistory.map((e, i) => (i < 2 ? e : slimEntry(e))),
    newHistory.map((e, i) => (i < 1 ? e : slimEntry(e))),
    newHistory.map(slimEntry)
  ];

  for (const attempt of attempts) {
    try {
      localStorage.setItem('cbtQuizHistory', JSON.stringify(attempt));
      return true;
    } catch { /* kuota penuh, coba strategi berikutnya */ }
  }

  let working = attempts[attempts.length - 1];
  while (working.length > 10) {
    working = working.slice(0, Math.max(10, Math.floor(working.length / 2)));
    try {
      localStorage.setItem('cbtQuizHistory', JSON.stringify(working));
      return true;
    } catch { /* pangkas lagi */ }
  }

  console.warn('[History] localStorage penuh, data tetap tersimpan aman di IndexedDB.');
  return true;
};

