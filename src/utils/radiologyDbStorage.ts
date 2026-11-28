import { RadiologyPacket, RadiologySubmission } from '../types/radiology';

const DB_NAME = 'auramedpro_radiology_db';
const DB_VERSION = 1;
const STORE_PACKETS = 'radiology_packets';
const STORE_SUBMISSIONS = 'radiology_submissions';

/**
 * Buka koneksi IndexedDB untuk cache lokal CBT Radiologi.
 * Digunakan sebagai cache cepat & penyimpanan cadangan saat offline (cloud D1/R2 adalah sumber utama).
 */
function openRadiologyDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB tidak didukung pada browser ini'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PACKETS)) {
        const pStore = db.createObjectStore(STORE_PACKETS, { keyPath: 'id' });
        pStore.createIndex('group_id', 'group_id', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_SUBMISSIONS)) {
        const sStore = db.createObjectStore(STORE_SUBMISSIONS, { keyPath: 'id' });
        sStore.createIndex('group_id', 'group_id', { unique: false });
        sStore.createIndex('packet_id', 'packet_id', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Gagal membuka IndexedDB Radiologi'));
  });
}

export const radiologyDb = {
  /**
   * Simpan paket soal ke cache IndexedDB
   */
  async savePacket(packet: RadiologyPacket): Promise<void> {
    try {
      const db = await openRadiologyDB();
      const tx = db.transaction(STORE_PACKETS, 'readwrite');
      tx.objectStore(STORE_PACKETS).put(packet);
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
      console.warn('[Radiology IndexedDB] Gagal menyimpan paket:', err);
    }
  },

  /**
   * Ambil semua paket soal di suatu grup dari IndexedDB
   */
  async getPackets(groupId: string): Promise<RadiologyPacket[]> {
    try {
      const db = await openRadiologyDB();
      const tx = db.transaction(STORE_PACKETS, 'readonly');
      const store = tx.objectStore(STORE_PACKETS);
      const index = store.index('group_id');
      const req = index.getAll(groupId);

      return new Promise((resolve, reject) => {
        req.onsuccess = () => {
          db.close();
          const list = (req.result || []) as RadiologyPacket[];
          list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          resolve(list);
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      });
    } catch (err) {
      console.warn('[Radiology IndexedDB] Gagal membaca paket:', err);
      return [];
    }
  },

  /**
   * Hapus paket soal dari IndexedDB
   */
  async deletePacket(packetId: string): Promise<void> {
    try {
      const db = await openRadiologyDB();
      const tx = db.transaction(STORE_PACKETS, 'readwrite');
      tx.objectStore(STORE_PACKETS).delete(packetId);
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
      console.warn('[Radiology IndexedDB] Gagal menghapus paket:', err);
    }
  },

  /**
   * Simpan submission (jawaban / penilaian) ke IndexedDB
   */
  async saveSubmission(submission: RadiologySubmission): Promise<void> {
    try {
      const db = await openRadiologyDB();
      const tx = db.transaction(STORE_SUBMISSIONS, 'readwrite');
      tx.objectStore(STORE_SUBMISSIONS).put(submission);
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
      console.warn('[Radiology IndexedDB] Gagal menyimpan submission:', err);
    }
  },

  /**
   * Ambil semua submissions untuk grup / paket tertentu dari IndexedDB
   */
  async getSubmissions(groupId: string, packetId?: string): Promise<RadiologySubmission[]> {
    try {
      const db = await openRadiologyDB();
      const tx = db.transaction(STORE_SUBMISSIONS, 'readonly');
      const store = tx.objectStore(STORE_SUBMISSIONS);
      const index = store.index('group_id');
      const req = index.getAll(groupId);

      return new Promise((resolve, reject) => {
        req.onsuccess = () => {
          db.close();
          let list = (req.result || []) as RadiologySubmission[];
          if (packetId) {
            list = list.filter((s) => s.packet_id === packetId);
          }
          list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          resolve(list);
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      });
    } catch (err) {
      console.warn('[Radiology IndexedDB] Gagal membaca submission:', err);
      return [];
    }
  },

  /**
   * Hapus satu submission dari IndexedDB
   */
  async deleteSubmission(submissionId: string): Promise<void> {
    try {
      const db = await openRadiologyDB();
      const tx = db.transaction(STORE_SUBMISSIONS, 'readwrite');
      tx.objectStore(STORE_SUBMISSIONS).delete(submissionId);
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
      console.warn('[Radiology IndexedDB] Gagal menghapus submission:', err);
    }
  },

  /**
   * Hapus seluruh submission milik paket tertentu dari IndexedDB
   */
  async deleteSubmissionsByPacket(packetId: string): Promise<void> {
    try {
      const db = await openRadiologyDB();
      const tx = db.transaction(STORE_SUBMISSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SUBMISSIONS);
      const index = store.index('packet_id');
      const req = index.getAllKeys(packetId);
      req.onsuccess = () => {
        const keys = req.result || [];
        for (const k of keys) {
          store.delete(k);
        }
      };
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
      console.warn('[Radiology IndexedDB] Gagal membersihkan submission paket:', err);
    }
  },
};
