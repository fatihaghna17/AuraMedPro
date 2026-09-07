import { Question } from '../types';

const CACHE_NAME = 'cbt-questions-cache-v1';
const memoryFallback = new Map<string, Question[]>();

/**
 * Mendapatkan data soal dari browser Cache API atau memory fallback
 */
export async function getCachedQuestions(r2Key: string): Promise<Question[] | null> {
  if (!r2Key) return null;

  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await caches.open(CACHE_NAME);
      const cacheKey = new Request(`https://cbt-cache.local/questions/${encodeURIComponent(r2Key)}`);
      const response = await cache.match(cacheKey);

      if (response) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    }
  } catch (err) {
    console.warn('[Cache] Gagal membaca dari Cache API, memeriksa fallback memori:', err);
  }

  // Fallback ke in-memory map jika Cache API tidak tersedia / error
  return memoryFallback.get(r2Key) || null;
}

/**
 * Menyimpan data soal ke browser Cache API dan memory fallback
 */
export async function setCachedQuestions(r2Key: string, questions: Question[]): Promise<void> {
  if (!r2Key || !Array.isArray(questions) || questions.length === 0) return;

  // Simpan ke in-memory fallback
  memoryFallback.set(r2Key, questions);

  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await caches.open(CACHE_NAME);
      const cacheKey = new Request(`https://cbt-cache.local/questions/${encodeURIComponent(r2Key)}`);
      const response = new Response(JSON.stringify(questions), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=604800' // 7 hari
        }
      });
      await cache.put(cacheKey, response);
    }
  } catch (err) {
    console.warn('[Cache] Gagal menyimpan ke Cache API:', err);
  }
}

/**
 * Menghapus cache soal
 */
export async function clearQuestionCache(): Promise<void> {
  memoryFallback.clear();
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      await caches.delete(CACHE_NAME);
    }
  } catch (err) {
    console.warn('[Cache] Gagal menghapus cache:', err);
  }
}

const LOCAL_BANKS_KEY = 'cbt_local_user_banks';

/**
 * Membaca bank soal kustom pengguna yang tersimpan di storage browser lokal
 */
export function getLocalUserBanks(): Record<string, Question[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_BANKS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (e) {
    console.warn('[LocalBanks] Gagal membaca bank soal lokal:', e);
    return {};
  }
}

/**
 * Menyimpan bank soal kustom pengguna ke storage browser lokal sebagai cadangan offline
 */
export function saveLocalUserBank(name: string, questions: Question[]): void {
  if (typeof window === 'undefined' || !name || !questions || questions.length === 0) return;
  try {
    const current = getLocalUserBanks();
    current[name] = questions;
    localStorage.setItem(LOCAL_BANKS_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('[LocalBanks] Gagal menyimpan bank soal lokal:', e);
  }
}

/**
 * Menghapus bank soal kustom pengguna dari storage browser lokal
 */
export function deleteLocalUserBank(name: string): void {
  if (typeof window === 'undefined' || !name) return;
  try {
    const current = getLocalUserBanks();
    if (name in current) {
      delete current[name];
      localStorage.setItem(LOCAL_BANKS_KEY, JSON.stringify(current));
    }
  } catch (e) {
    console.warn('[LocalBanks] Gagal menghapus bank soal lokal:', e);
  }
}

