import { RadiologyPacket, RadiologySubmission } from '../types/radiology';
import { DEFAULT_SAMPLE_RADIOLOGY_PACKET } from '../data/sampleRadiology';
import { radiologyDb } from '../utils/radiologyDbStorage';

const API_BASE = '/api/radiology';

function getLocalPacketsKey(groupId: string): string {
  return `auramed_rad_packets_${groupId}`;
}

function getLocalSubmissionsKey(groupId: string): string {
  return `auramed_rad_submissions_${groupId}`;
}

export const radiologyApi = {
  /**
   * Mengambil semua paket latihan CBT Radiologi untuk grup tertentu.
   * Urutan sumber:
   * 1. Server Cloudflare Pages API (/api/radiology)
   * 2. IndexedDB (kuota gigabyte)
   * 3. LocalStorage (fallback legacy)
   * 4. Sample packet default
   */
  async getPackets(groupId: string): Promise<RadiologyPacket[]> {
    // 1. Coba fetch dari server
    try {
      const res = await fetch(`${API_BASE}?action=packets&group_id=${encodeURIComponent(groupId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          // Sinkronkan ke IndexedDB lokal untuk offline
          for (const p of json.data) {
            await radiologyDb.savePacket(p);
          }
          return json.data;
        }
      }
    } catch {
      // Offline / server fallback
    }

    // 2. Ambil dari IndexedDB (kapasitas besar)
    try {
      const dbPackets = await radiologyDb.getPackets(groupId);
      if (dbPackets && dbPackets.length > 0) {
        return dbPackets;
      }
    } catch (err) {
      console.warn('[Radiology API] Gagal membaca IndexedDB:', err);
    }

    // 3. Fallback Local Storage legacy
    const key = getLocalPacketsKey(groupId);
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const list: RadiologyPacket[] = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          // Migrasikan ke IndexedDB
          for (const p of list) {
            await radiologyDb.savePacket(p);
          }
          return list;
        }
      } catch {}
    }

    // 4. Jika belum ada paket sama sekali di grup ini, inisialisasi dengan paket contoh default
    const initialPacket: RadiologyPacket = {
      ...DEFAULT_SAMPLE_RADIOLOGY_PACKET,
      group_id: groupId,
      id: `packet-${groupId}-sample-1`
    };
    await radiologyDb.savePacket(initialPacket);
    try {
      localStorage.setItem(key, JSON.stringify([initialPacket]));
    } catch {}

    return [initialPacket];
  },

  /**
   * Menyimpan / menambah paket soal radiologi baru.
   * Disimpan ke IndexedDB untuk mencegah QuotaExceededError (5MB limit localStorage).
   */
  async savePacket(packet: RadiologyPacket): Promise<boolean> {
    // 1. Simpan ke IndexedDB (kapasitas puluhan GB, aman untuk base64 / gambar besar)
    await radiologyDb.savePacket(packet);

    // 2. Coba kirim ke server backend
    try {
      await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_packet', packet })
      });
    } catch (err) {
      console.log('[Radiology API] Server sync gagal, tersimpan aman di IndexedDB:', err);
    }

    // 3. Cadangkan ke LocalStorage jika masih cukup (abaikan error quota jika penuh)
    try {
      const key = getLocalPacketsKey(packet.group_id);
      const raw = localStorage.getItem(key);
      let packets: RadiologyPacket[] = raw ? JSON.parse(raw) : [];
      const existingIndex = packets.findIndex(p => p.id === packet.id);
      if (existingIndex >= 0) {
        packets[existingIndex] = packet;
      } else {
        packets.unshift(packet);
      }
      localStorage.setItem(key, JSON.stringify(packets));
    } catch (quotaErr) {
      // LocalStorage kuota penuh (~5MB) — abaikan dengan aman karena sudah tersimpan di IndexedDB
      console.warn('[Radiology API] LocalStorage quota penuh, data aman tersimpan di IndexedDB.');
    }

    return true;
  },

  /**
   * Menghapus paket soal
   */
  async deletePacket(packetId: string, groupId: string): Promise<boolean> {
    // Hapus dari IndexedDB
    await radiologyDb.deletePacket(packetId);

    // Hapus dari server
    try {
      await fetch(`${API_BASE}?action=delete_packet&id=${encodeURIComponent(packetId)}&group_id=${encodeURIComponent(groupId)}`, {
        method: 'DELETE'
      });
    } catch {}

    // Hapus dari localStorage jika ada
    try {
      const key = getLocalPacketsKey(groupId);
      const raw = localStorage.getItem(key);
      if (raw) {
        const packets = (JSON.parse(raw) as RadiologyPacket[]).filter(p => p.id !== packetId);
        localStorage.setItem(key, JSON.stringify(packets));
      }
    } catch {}

    return true;
  },

  /**
   * Mengambil semua pengumpulan jawaban (submissions) di suatu grup
   */
  async getSubmissions(groupId: string, packetId?: string): Promise<RadiologySubmission[]> {
    // 1. Coba fetch dari server
    try {
      const qs = packetId
        ? `?action=submissions&group_id=${encodeURIComponent(groupId)}&packet_id=${encodeURIComponent(packetId)}`
        : `?action=submissions&group_id=${encodeURIComponent(groupId)}`;
      const res = await fetch(`${API_BASE}${qs}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          for (const s of json.data) {
            await radiologyDb.saveSubmission(s);
          }
          return json.data;
        }
      }
    } catch {}

    // 2. Ambil dari IndexedDB
    try {
      const dbSubs = await radiologyDb.getSubmissions(groupId, packetId);
      if (dbSubs && dbSubs.length > 0) {
        return dbSubs;
      }
    } catch (err) {
      console.warn('[Radiology API] Gagal membaca submissions dari IndexedDB:', err);
    }

    // 3. Fallback ke localStorage
    const key = getLocalSubmissionsKey(groupId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
      const list: RadiologySubmission[] = JSON.parse(raw);
      if (packetId) {
        return list.filter(s => s.packet_id === packetId);
      }
      return list;
    } catch {
      return [];
    }
  },

  /**
   * Mengambil hasil pengerjaan spesifik dari seorang peserta
   */
  async getUserSubmission(packetId: string, userId: string, groupId: string): Promise<RadiologySubmission | null> {
    const list = await this.getSubmissions(groupId, packetId);
    return list.find(s => s.user_id === userId) || null;
  },

  /**
   * Peserta mengumpulkan jawaban essay (status otomatis 'pending', pembahasan belum bisa dibuka)
   */
  async submitAnswers(
    packetId: string,
    groupId: string,
    userId: string,
    username: string,
    answers: Record<string, string>
  ): Promise<RadiologySubmission> {
    const newSubmission: RadiologySubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      packet_id: packetId,
      group_id: groupId,
      user_id: userId,
      username: username || 'Peserta Ujian',
      answers,
      checklist: {
        thorax: {},
        abdomen: {}
      },
      score: 0,
      feedback: '',
      status: 'pending', // Menunggu koreksi manual admin
      created_at: new Date().toISOString()
    };

    // 1. Simpan ke IndexedDB
    await radiologyDb.saveSubmission(newSubmission);

    // 2. Sync ke server backend
    try {
      await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit_answer', submission: newSubmission })
      });
    } catch {}

    // 3. Simpan ke LocalStorage jika muat
    try {
      const key = getLocalSubmissionsKey(groupId);
      const current = await this.getSubmissions(groupId);
      const filtered = current.filter(s => !(s.packet_id === packetId && s.user_id === userId));
      filtered.unshift(newSubmission);
      localStorage.setItem(key, JSON.stringify(filtered));
    } catch (e) {
      console.warn('[Radiology API] LocalStorage penuh, submission tersimpan di IndexedDB.');
    }

    return newSubmission;
  },

  /**
   * Admin mengoreksi dan memberikan checklist & feedback
   * Setelah ini dikirim, status berubah ke 'graded' dan pembahasan terbuka bagi peserta
   */
  async gradeSubmission(
    submissionId: string,
    groupId: string,
    checklist: { 
      thorax: Record<string, boolean>; 
      abdomen: Record<string, boolean>;
      by_question?: Record<string, any>;
    },
    score: number,
    feedback: string,
    graderId: string,
    graderName?: string
  ): Promise<boolean> {
    const gradedAt = new Date().toISOString();

    // 1. Ambil submission yang ada
    const list = await this.getSubmissions(groupId);
    const target = list.find(s => s.id === submissionId);
    if (target) {
      target.checklist = checklist as any;
      target.score = score;
      target.feedback = feedback;
      target.status = 'graded';
      target.graded_by = graderName || graderId;
      target.graded_at = gradedAt;

      // Simpan ke IndexedDB
      await radiologyDb.saveSubmission(target);

      // Simpan ke localStorage jika muat
      try {
        const key = getLocalSubmissionsKey(groupId);
        localStorage.setItem(key, JSON.stringify(list));
      } catch (e) {
        console.warn('[Radiology API] LocalStorage penuh saat grading, tersimpan di IndexedDB.');
      }
    }

    // 2. Sync ke server backend
    try {
      await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grade_submission',
          submission_id: submissionId,
          group_id: groupId,
          checklist,
          score,
          feedback,
          grader_id: graderId,
          grader_name: graderName,
          graded_at: gradedAt
        })
      });
    } catch {}

    return true;
  }
};
