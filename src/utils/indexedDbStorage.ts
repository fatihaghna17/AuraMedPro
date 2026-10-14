import { HistoryEntry } from '../types';

const DB_NAME = 'auramedpro_cbt_db';
const DB_VERSION = 1;
const STORE_NAME = 'quiz_history';

/**
 * Buka koneksi IndexedDB dengan aman.
 * IndexedDB memiliki kuota penyimpanan ratusan MB hingga gigabyte di iOS Safari & Android,
 * jauh melampaui limit 5MB localStorage yang sering menyebabkan data pembahasan terpotong.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB tidak didukung pada browser ini'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Gagal membuka IndexedDB'));
  });
}

/**
 * Menyimpan seluruh entri riwayat kuis lengkap (soal + pembahasan + jawaban user) ke IndexedDB
 */
export async function saveHistoryToIndexedDB(history: HistoryEntry[]): Promise<void> {
  if (!history || !Array.isArray(history) || history.length === 0) return;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const entry of history) {
      if (entry && entry.id) {
        store.put(entry);
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Gagal menyimpan riwayat ke IndexedDB:', err);
  }
}

/**
 * Mengambil seluruh riwayat kuis dari IndexedDB (diurutkan terbaru ke terlama)
 */
export async function getAllHistoryFromIndexedDB(): Promise<HistoryEntry[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        const results = (request.result || []) as HistoryEntry[];
        results.sort((a, b) => (b.id || 0) - (a.id || 0));
        resolve(results);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Gagal membaca riwayat dari IndexedDB:', err);
    return [];
  }
}

/**
 * Mengambil satu entri riwayat kuis lengkap berdasarkan ID dari IndexedDB
 */
export async function getHistoryEntryFromIndexedDB(id: number): Promise<HistoryEntry | null> {
  if (!id) return null;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result || null);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Gagal mencari entri ID di IndexedDB:', err);
    return null;
  }
}

/**
 * Menghapus satu entri riwayat dari IndexedDB
 */
export async function deleteHistoryItemFromIndexedDB(id: number): Promise<void> {
  if (!id) return;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Gagal menghapus entri dari IndexedDB:', err);
  }
}

/**
 * Menghapus seluruh riwayat dari IndexedDB
 */
export async function clearHistoryFromIndexedDB(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Gagal mengosongkan riwayat di IndexedDB:', err);
  }
}
