import { RadiologyPacket, RadiologySubmission } from '../types/radiology';
import { DEFAULT_SAMPLE_RADIOLOGY_PACKET } from '../data/sampleRadiology';

const API_BASE = '/api/radiology';

function getLocalPacketsKey(groupId: string): string {
  return `auramed_rad_packets_${groupId}`;
}

function getLocalSubmissionsKey(groupId: string): string {
  return `auramed_rad_submissions_${groupId}`;
}

export const radiologyApi = {
  /**
   * Mengambil semua paket latihan CBT Radiologi untuk grup tertentu
   */
  async getPackets(groupId: string): Promise<RadiologyPacket[]> {
    try {
      const res = await fetch(`${API_BASE}?action=packets&group_id=${encodeURIComponent(groupId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch {
      // fallback ke storage lokal
    }

    // Fallback Local Storage
    const key = getLocalPacketsKey(groupId);
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }

    // Jika belum ada paket sama sekali di grup ini, inisialisasi dengan paket contoh default
    const initialPacket: RadiologyPacket = {
      ...DEFAULT_SAMPLE_RADIOLOGY_PACKET,
      group_id: groupId,
      id: `packet-${groupId}-sample-1`
    };
    localStorage.setItem(key, JSON.stringify([initialPacket]));
    return [initialPacket];
  },

  /**
   * Menyimpan / menambah paket soal radiologi baru
   */
  async savePacket(packet: RadiologyPacket): Promise<boolean> {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_packet', packet })
      });
      if (res.ok) return true;
    } catch {}

    // Simpan ke Local Storage
    const key = getLocalPacketsKey(packet.group_id);
    const packets = await this.getPackets(packet.group_id);
    const existingIndex = packets.findIndex(p => p.id === packet.id);
    if (existingIndex >= 0) {
      packets[existingIndex] = packet;
    } else {
      packets.unshift(packet);
    }
    localStorage.setItem(key, JSON.stringify(packets));
    return true;
  },

  /**
   * Menghapus paket soal
   */
  async deletePacket(packetId: string, groupId: string): Promise<boolean> {
    try {
      await fetch(`${API_BASE}?action=delete_packet&id=${encodeURIComponent(packetId)}&group_id=${encodeURIComponent(groupId)}`, {
        method: 'DELETE'
      });
    } catch {}

    const key = getLocalPacketsKey(groupId);
    const packets = (await this.getPackets(groupId)).filter(p => p.id !== packetId);
    localStorage.setItem(key, JSON.stringify(packets));
    return true;
  },

  /**
   * Mengambil semua pengumpulan jawaban (submissions) di suatu grup
   */
  async getSubmissions(groupId: string, packetId?: string): Promise<RadiologySubmission[]> {
    try {
      const qs = packetId
        ? `?action=submissions&group_id=${encodeURIComponent(groupId)}&packet_id=${encodeURIComponent(packetId)}`
        : `?action=submissions&group_id=${encodeURIComponent(groupId)}`;
      const res = await fetch(`${API_BASE}${qs}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) return json.data;
      }
    } catch {}

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

    try {
      await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit_answer', submission: newSubmission })
      });
    } catch {}

    // Simpan ke local storage
    const key = getLocalSubmissionsKey(groupId);
    const current = await this.getSubmissions(groupId);
    // Hapus submission lama user untuk paket ini jika ada (update submission)
    const filtered = current.filter(s => !(s.packet_id === packetId && s.user_id === userId));
    filtered.unshift(newSubmission);
    localStorage.setItem(key, JSON.stringify(filtered));

    return newSubmission;
  },

  /**
   * Admin mengoreksi dan memberikan checklist & feedback
   * Setelah ini dikirim, status berubah ke 'graded' dan pembahasan terbuka bagi peserta
   */
  async gradeSubmission(
    submissionId: string,
    groupId: string,
    checklist: { thorax: Record<string, boolean>; abdomen: Record<string, boolean> },
    score: number,
    feedback: string,
    graderId: string,
    graderName?: string
  ): Promise<boolean> {
    const gradedAt = new Date().toISOString();

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

    // Simpan ke local storage
    const key = getLocalSubmissionsKey(groupId);
    const list = await this.getSubmissions(groupId);
    const target = list.find(s => s.id === submissionId);
    if (target) {
      target.checklist = checklist;
      target.score = score;
      target.feedback = feedback;
      target.status = 'graded';
      target.graded_by = graderName || graderId;
      target.graded_at = gradedAt;
      localStorage.setItem(key, JSON.stringify(list));
      return true;
    }
    return false;
  }
};
