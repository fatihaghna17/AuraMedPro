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
