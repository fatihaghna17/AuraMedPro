import { RadiologyPacket, RadiologyQuestion, RadiologySubmission } from '../types/radiology';
import { radiologyDb } from '../utils/radiologyDbStorage';

const API_BASE = '/api/radiology';

export interface PacketsSyncResult {
  packets: RadiologyPacket[];
  fromCloud: boolean;
  unsyncedCount: number;
  error?: string;
}

export interface SavePacketResult {
  packet: RadiologyPacket;
  synced: boolean;
  error?: string;
}

export interface SubmissionsSyncResult {
  submissions: RadiologySubmission[];
  fromCloud: boolean;
  error?: string;
}

export interface SubmitAnswerResult {
  submission: RadiologySubmission;
  synced: boolean;
  error?: string;
}

export interface GradeSubmissionResult {
  success: boolean;
  submission?: RadiologySubmission;
  error?: string;
}

export interface ParsedRadiologyPacketPreview {
  title: string;
  description: string;
  questions: RadiologyQuestion[];
  stats: {
    total: number;
    thoraxCount: number;
    abdomenCount: number;
    imageCount: number;
    base64Count: number;
  };
}

/**
 * Resolve username tampilan secara konsisten dari objek AuthUser maupun profileUsername.
 */
export function getUserDisplayName(currentUser: any, profileUsername?: string | null, fallback = 'Peserta'): string {
  const candidates = [
    profileUsername,
    currentUser?.user_metadata?.username,
    currentUser?.profile?.username,
    currentUser?.username,
  ];
  for (const c of candidates) {
    if (typeof c === 'string') {
      const trimmed = c.trim();
      if (trimmed && trimmed.toLowerCase() !== 'user') return trimmed;
    }
  }
  return fallback;
}

/**
 * Ekstrak semua URL gambar dari sebuah soal radiologi secara aman.
 */
export function getQuestionImages(q: RadiologyQuestion | null | undefined): string[] {
  if (!q) return [];
  const anyQ = q as any;
  const raw: string[] = [];
  if (Array.isArray(anyQ.image_urls) && anyQ.image_urls.length > 0) {
    for (const u of anyQ.image_urls) {
      if (typeof u === 'string' && u.trim()) raw.push(u.trim());
    }
  } else if (typeof anyQ.image_url === 'string' && anyQ.image_url.trim()) {
    raw.push(anyQ.image_url.trim());
  } else if (Array.isArray(anyQ.images) && anyQ.images.length > 0) {
    for (const u of anyQ.images) {
      if (typeof u === 'string' && u.trim()) raw.push(u.trim());
    }
  }
  return Array.from(new Set(raw));
}

/**
 * Parse teks/file JSON soal radiologi secara fleksibel (termasuk membuang markdown code fence ```json ... ```).
 */
export function parseRadiologyPacketJson(rawInput: string, fallbackTitle?: string): ParsedRadiologyPacketPreview {
  let cleaned = (rawInput || '').trim();
  if (!cleaned) {
    throw new Error('Isi JSON masih kosong. Pilih file .json atau tempel kode JSON soal terlebih dahulu.');
  }

  // Buang markdown codeblock jika user menyalin langsung dari ChatGPT/Gemini
  const fenceMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Format JSON tidak valid. Periksa tanda kurung kurawal, kutip ganda, atau koma.');
  }

  let rawList: any[] = [];
  let title = fallbackTitle?.trim() || 'Paket Latihan CBT Radiologi';
  let description = 'Latihan interpretasi foto rontgen dengan rubrik checklist standar Skills Lab.';

  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (typeof parsed.judul === 'string' && parsed.judul.trim()) title = parsed.judul.trim();
    else if (typeof parsed.title === 'string' && parsed.title.trim()) title = parsed.title.trim();

    if (typeof parsed.deskripsi === 'string' && parsed.deskripsi.trim()) description = parsed.deskripsi.trim();
    else if (typeof parsed.description === 'string' && parsed.description.trim()) description = parsed.description.trim();

    if (Array.isArray(parsed.daftar_soal)) rawList = parsed.daftar_soal;
    else if (Array.isArray(parsed.questions)) rawList = parsed.questions;
    else if (Array.isArray(parsed.soal)) rawList = parsed.soal;
  }

  if (!Array.isArray(rawList) || rawList.length === 0) {
    throw new Error('JSON tidak memiliki daftar soal (`daftar_soal` atau `questions`).');
  }

  const nowTs = Date.now();
  let thoraxCount = 0;
  let abdomenCount = 0;
  let imageCount = 0;
  let base64Count = 0;

  const questions: RadiologyQuestion[] = rawList.map((q: any, idx: number) => {
    const regionRaw = String(q?.region || q?.regio || 'thorax').toLowerCase().trim();
    const region: 'thorax' | 'abdomen' = regionRaw.includes('abdom') || regionRaw.includes('bno') ? 'abdomen' : 'thorax';
    if (region === 'thorax') thoraxCount += 1;
    else abdomenCount += 1;

    const collectedImages: string[] = [];
    if (Array.isArray(q?.image_urls)) {
      q.image_urls.forEach((u: any) => {
        if (typeof u === 'string' && u.trim()) collectedImages.push(u.trim());
      });
    }
    if (Array.isArray(q?.images)) {
      q.images.forEach((u: any) => {
        if (typeof u === 'string' && u.trim()) collectedImages.push(u.trim());
      });
    }
    const singleImg = q?.image_url || q?.gambar_url || q?.gambar || q?.image;
    if (typeof singleImg === 'string' && singleImg.trim() && !collectedImages.includes(singleImg.trim())) {
      collectedImages.unshift(singleImg.trim());
    }

    const uniqueImages = Array.from(new Set(collectedImages));
    imageCount += uniqueImages.length;
    base64Count += uniqueImages.filter((u) => u.startsWith('data:image/')).length;

    const kunci = q?.kunci_interpretasi && typeof q.kunci_interpretasi === 'object' ? q.kunci_interpretasi : {};

    return {
      id: typeof q?.id === 'string' && q.id.trim() ? q.id.trim() : `q-${idx + 1}-${nowTs}`,
      nomor: Number(q?.nomor) || idx + 1,
      region,
      metadata: q?.metadata && typeof q.metadata === 'object' ? q.metadata : undefined,
      identitas_pasien: q?.identitas_pasien && typeof q.identitas_pasien === 'object' ? q.identitas_pasien : undefined,
      vignette: String(q?.vignette || q?.skenario || q?.kasus || '').trim(),
      image_url: uniqueImages[0] || '',
      image_urls: uniqueImages.length > 0 ? uniqueImages : undefined,
      pertanyaan: String(
        q?.pertanyaan || 'Lakukan pembacaan dan interpretasi sistematis foto radiologi di atas!'
      ).trim(),
      kunci_interpretasi: {
        data_demografi: kunci.data_demografi || undefined,
        kualitas_foto: kunci.kualitas_foto || kunci.syarat_layak_baca || undefined,
        syarat_layak_baca: kunci.syarat_layak_baca || undefined,
        interpretasi: kunci.interpretasi || kunci.sistematika_organ || undefined,
        sistematika_organ: kunci.sistematika_organ || undefined,
        abnormalitas: kunci.abnormalitas || undefined,
        kesimpulan: kunci.kesimpulan || undefined,
      },
    };
  });

  return {
    title,
    description,
    questions,
    stats: {
      total: questions.length,
      thoraxCount,
      abdomenCount,
      imageCount,
      base64Count,
    },
  };
}

// Auto-migrate & bersihkan key legacy localStorage agar kuota 5MB browser tetap lega
if (typeof window !== 'undefined' && window.localStorage) {
  setTimeout(() => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('auramed_rad_packets_') || k.startsWith('auramed_rad_submissions_'))) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        const val = localStorage.getItem(k);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              if (k.startsWith('auramed_rad_packets_')) {
                parsed.forEach((p) => radiologyDb.savePacket({ ...p, synced: false }));
              } else {
                parsed.forEach((s) => radiologyDb.saveSubmission({ ...s, synced: false }));
              }
            }
          } catch {}
        }
        localStorage.removeItem(k);
      }
    } catch (e) {
      console.warn('[Radiology] Gagal membersihkan localStorage legacy:', e);
    }
  }, 50);
}

async function parseJsonSafe(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Format data URL gambar tidak valid');
  }
  const mime = match[1];
  const binary = atob(match[2].replace(/\s+/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Kompres foto rontgen di browser (maks 1600px, kualitas 0.86) agar tajam untuk diagnostik
 * sekaligus hemat bandwidth dan cepat diunggah ke Cloudflare R2.
 */
export async function compressRadiologyImage(
  source: File | Blob | string,
  maxDim = 1600,
  quality = 0.86
): Promise<Blob> {
  const originalBlob = typeof source === 'string' ? dataUrlToBlob(source) : source;

  // Jika sudah ringan (< 180KB) dan bukan file mentah super besar, tetap cek dimensi via Image bila tersedia
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return originalBlob;
  }

  const objectUrl = URL.createObjectURL(originalBlob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Gagal membaca gambar'));
      el.src = objectUrl;
    });

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return originalBlob;

    // Jika ukuran file sudah <= 220KB dan dimensi <= maxDim, pakai langsung tanpa re-encode
    if (originalBlob.size <= 220_000 && w <= maxDim && h <= maxDim) {
      return originalBlob;
    }

    const scale = Math.min(1, maxDim / Math.max(w, h));
    const targetW = Math.max(1, Math.round(w * scale));
    const targetH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return originalBlob;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const toBlob = (mime: string, q: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), mime, q));

    // Coba WebP dulu, fallback ke JPEG (dukungan Safari lama)
    let compressed = await toBlob('image/webp', quality);
    if (!compressed || compressed.type !== 'image/webp') {
      compressed = await toBlob('image/jpeg', quality);
    }

    if (compressed && compressed.size < originalBlob.size) {
      return compressed;
    }
    return originalBlob;
  } catch {
    return originalBlob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Upload 1 file/blob gambar rontgen langsung ke Cloudflare R2 via /api/radiology (multipart).
 */
export async function uploadRadiologyImageToCloud(
  fileOrBlob: File | Blob,
  groupId: string,
  packetId: string
): Promise<string> {
  const compressed = await compressRadiologyImage(fileOrBlob);
  const ext = compressed.type.includes('webp')
    ? 'webp'
    : compressed.type.includes('png')
    ? 'png'
    : 'jpg';

  const formData = new FormData();
  formData.append('file', compressed, `xray.${ext}`);
  formData.append('group_id', groupId);
  formData.append('packet_id', packetId);

  const res = await fetch(API_BASE, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const body = await parseJsonSafe(res);
  if (!res.ok || !body?.url) {
    throw new Error(body?.error || `Gagal mengunggah gambar ke cloud (${res.status})`);
  }
  return String(body.url);
}

/**
 * Scan semua gambar base64 (data:image/...) dalam paket soal dan unggah satu per satu ke R2
 * sebelum menyimpan JSON paket agar file soal besar (belasan MB) tetap mulus dan cepat.
 */
async function offloadPacketBase64Images(
  packet: RadiologyPacket,
  onProgress?: (msg: string) => void
): Promise<RadiologyPacket> {
  const uniqueDataUrls: string[] = [];
  const seen = new Set<string>();

  for (const q of packet.questions || []) {
    const imgs = getQuestionImages(q);
    for (const u of imgs) {
      if (u.startsWith('data:image/') && !seen.has(u)) {
        seen.add(u);
        uniqueDataUrls.push(u);
      }
    }
  }

  if (uniqueDataUrls.length === 0) return packet;

  const urlMap = new Map<string, string>();
  for (let i = 0; i < uniqueDataUrls.length; i++) {
    onProgress?.(`Mengunggah foto rontgen ${i + 1} dari ${uniqueDataUrls.length} ke cloud...`);
    const dataUrl = uniqueDataUrls[i];
    const blob = dataUrlToBlob(dataUrl);
    const cloudUrl = await uploadRadiologyImageToCloud(blob, packet.group_id, packet.id);
    urlMap.set(dataUrl, cloudUrl);
  }

  const updatedQuestions: RadiologyQuestion[] = (packet.questions || []).map((q) => {
    const imgs = getQuestionImages(q).map((u) => urlMap.get(u) || u);
    return {
      ...q,
      image_url: imgs[0] || '',
      image_urls: imgs.length > 0 ? imgs : undefined,
    };
  });

  return {
    ...packet,
    questions: updatedQuestions,
  };
}

function isLegacyAutoSampleId(packetId: string, groupId: string): boolean {
  return packetId === `packet-${groupId}-sample-1`;
}

export const radiologyApi = {
  /**
   * Ambil semua paket soal CBT Radiologi untuk grup tertentu (cloud-first).
   * - Jika cloud berhasil: sinkronkan cache lokal, hapus cache yang sudah dihapus di perangkat lain,
   *   dan pertahankan paket lokal yang belum tersinkron agar user dapat mengunggahnya ke cloud.
   * - Jika offline/gagal koneksi: tampilkan cache IndexedDB dengan penanda fromCloud = false.
   */
  async getPackets(groupId: string): Promise<PacketsSyncResult> {
    const localPackets = await radiologyDb.getPackets(groupId);

    try {
      const res = await fetch(`${API_BASE}?action=packets&group_id=${encodeURIComponent(groupId)}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await parseJsonSafe(res);

      if (!res.ok) {
        throw new Error(json?.error || `Server mengembalikan status ${res.status}`);
      }

      const cloudPackets: RadiologyPacket[] = (Array.isArray(json?.data) ? json.data : []).map((p: any) => ({
        ...p,
        synced: true,
      }));
      const cloudIds = new Set(cloudPackets.map((p) => p.id));

      // Perbarui cache IndexedDB dengan data cloud terbaru
      for (const cp of cloudPackets) {
        await radiologyDb.savePacket(cp);
      }

      // Rekonsiliasi paket lokal di IndexedDB
      const unsyncedLocal: RadiologyPacket[] = [];
      for (const lp of localPackets) {
        if (cloudIds.has(lp.id)) continue;

        if (lp.synced === true) {
          // Paket ini sebelumnya tersinkron namun sekarang tidak ada di cloud -> berarti sudah dihapus di perangkat lain
          await radiologyDb.deletePacket(lp.id);
          await radiologyDb.deleteSubmissionsByPacket(lp.id);
        } else if (isLegacyAutoSampleId(lp.id, groupId)) {
          // Bersihkan sampel otomatis lokal lama agar tidak muncul sebagai "belum sinkron" yang membingungkan
          await radiologyDb.deletePacket(lp.id);
        } else {
          // Paket buatan user yang sempat tersimpan lokal (sebelum perbaikan atau saat offline) -> tampilkan agar bisa disinkronkan!
          unsyncedLocal.push({ ...lp, synced: false });
        }
      }

      const merged = [...cloudPackets, ...unsyncedLocal].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );

      return {
        packets: merged,
        fromCloud: true,
        unsyncedCount: unsyncedLocal.length,
      };
    } catch (err: any) {
      const filteredLocal = localPackets
        .filter((lp) => !isLegacyAutoSampleId(lp.id, groupId))
        .map((lp) => ({ ...lp, synced: lp.synced === true }));

      return {
        packets: filteredLocal,
        fromCloud: false,
        unsyncedCount: filteredLocal.filter((p) => !p.synced).length,
        error: err?.message || 'Tidak dapat terhubung ke server cloud.',
      };
    }
  },

  /**
   * Simpan atau perbarui paket soal ke Cloudflare D1/R2 (dengan pre-upload gambar ke R2).
   * Tidak lagi menyembunyikan error server: selalu mengembalikan status `synced` dan `error`.
   */
  async savePacket(
    packet: RadiologyPacket,
    opts?: { onProgress?: (msg: string) => void }
  ): Promise<SavePacketResult> {
    try {
      const preparedPacket = await offloadPacketBase64Images(packet, opts?.onProgress);

      opts?.onProgress?.('Menyimpan paket soal ke server cloud...');
      const res = await fetch(API_BASE, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_packet', packet: preparedPacket }),
      });

      const body = await parseJsonSafe(res);
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || `Server menolak penyimpanan paket (HTTP ${res.status})`);
      }

      const canonicalPacket: RadiologyPacket = {
        ...(body.packet || preparedPacket),
        synced: true,
      };

      await radiologyDb.savePacket(canonicalPacket);
      return { packet: canonicalPacket, synced: true };
    } catch (err: any) {
      // Tetap simpan salinan lokal dengan penanda synced = false agar pekerjaan user tidak hilang
      const localFallback: RadiologyPacket = {
        ...packet,
        synced: false,
      };
      await radiologyDb.savePacket(localFallback);
      return {
        packet: localFallback,
        synced: false,
        error: err?.message || 'Gagal mengunggah paket soal ke server cloud.',
      };
    }
  },

  /**
   * Sinkronkan semua paket lokal (belum tersinkron / legacy lokal) di grup ke Cloudflare D1/R2.
   */
  async syncLocalPackets(
    groupId: string,
    opts?: { onProgress?: (msg: string) => void }
  ): Promise<{ syncedCount: number; failedCount: number; lastError?: string }> {
    const localPackets = await radiologyDb.getPackets(groupId);
    const pending = localPackets.filter((p) => p.synced !== true && !isLegacyAutoSampleId(p.id, groupId));

    let syncedCount = 0;
    let failedCount = 0;
    let lastError: string | undefined;

    for (let i = 0; i < pending.length; i++) {
      const pkt = pending[i];
      opts?.onProgress?.(`Menyinkronkan "${pkt.title}" (${i + 1}/${pending.length})...`);
      const res = await this.savePacket(pkt, {
        onProgress: (subMsg) => opts?.onProgress?.(`[${i + 1}/${pending.length}] ${subMsg}`),
      });
      if (res.synced) {
        syncedCount += 1;
      } else {
        failedCount += 1;
        lastError = res.error;
      }
    }

    return { syncedCount, failedCount, lastError };
  },

  /**
   * Hapus paket soal dari cloud (D1 + R2) dan cache IndexedDB.
   */
  async deletePacket(
    packetId: string,
    groupId: string,
    isSynced = true
  ): Promise<{ success: boolean; error?: string }> {
    if (isSynced) {
      try {
        const res = await fetch(
          `${API_BASE}?action=delete_packet&id=${encodeURIComponent(packetId)}&group_id=${encodeURIComponent(groupId)}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        );
        const body = await parseJsonSafe(res);
        if (!res.ok) {
          return {
            success: false,
            error: body?.error || `Gagal menghapus paket di server (HTTP ${res.status})`,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Tidak dapat terhubung ke server untuk menghapus paket.',
        };
      }
    }

    await radiologyDb.deletePacket(packetId);
    await radiologyDb.deleteSubmissionsByPacket(packetId);
    return { success: true };
  },

  /**
   * Ambil semua pengumpulan jawaban (submissions) untuk grup / paket tertentu (cloud-first).
   */
  async getSubmissions(groupId: string, packetId?: string): Promise<SubmissionsSyncResult> {
    const localSubs = await radiologyDb.getSubmissions(groupId, packetId);

    try {
      const qs = packetId
        ? `?action=submissions&group_id=${encodeURIComponent(groupId)}&packet_id=${encodeURIComponent(packetId)}`
        : `?action=submissions&group_id=${encodeURIComponent(groupId)}`;

      const res = await fetch(`${API_BASE}${qs}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await parseJsonSafe(res);
      if (!res.ok) {
        throw new Error(json?.error || `Gagal memuat pengumpulan (HTTP ${res.status})`);
      }

      const cloudSubs: RadiologySubmission[] = (Array.isArray(json?.data) ? json.data : []).map((s: any) => ({
        ...s,
        synced: true,
      }));
      const cloudIds = new Set(cloudSubs.map((s) => s.id));

      for (const cs of cloudSubs) {
        await radiologyDb.saveSubmission(cs);
      }

      // Bersihkan submission cache lama yang sudah dihapus di cloud, tapi pertahankan yang unsynced
      const unsyncedLocal: RadiologySubmission[] = [];
      for (const ls of localSubs) {
        if (cloudIds.has(ls.id)) continue;
        if (ls.synced === true) {
          await radiologyDb.deleteSubmission(ls.id);
        } else {
          // Cek apakah user + packet sudah ada di cloud dengan ID berbeda
          const dupInCloud = cloudSubs.some((cs) => cs.packet_id === ls.packet_id && cs.user_id === ls.user_id);
          if (dupInCloud) {
            await radiologyDb.deleteSubmission(ls.id);
          } else {
            unsyncedLocal.push({ ...ls, synced: false });
          }
        }
      }

      const merged = [...cloudSubs, ...unsyncedLocal].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );

      return { submissions: merged, fromCloud: true };
    } catch (err: any) {
      return {
        submissions: localSubs,
        fromCloud: false,
        error: err?.message || 'Offline: menampilkan data lokal.',
      };
    }
  },

  /**
   * Ambil hasil pengerjaan spesifik dari seorang peserta pada suatu paket.
   */
  async getUserSubmission(packetId: string, userId: string, groupId: string): Promise<RadiologySubmission | null> {
    const { submissions } = await this.getSubmissions(groupId, packetId);
    return submissions.find((s) => s.user_id === userId) || null;
  },

  /**
   * Peserta mengumpulkan jawaban essay ke cloud (status 'pending', menunggu koreksi admin).
   */
  async submitAnswers(
    packetId: string,
    groupId: string,
    userId: string,
    username: string,
    answers: Record<string, string>
  ): Promise<SubmitAnswerResult> {
    const draftSubmission: RadiologySubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      packet_id: packetId,
      group_id: groupId,
      user_id: userId,
      username: username || 'Peserta',
      answers,
      checklist: {
        thorax: {},
        abdomen: {},
      },
      score: 0,
      feedback: '',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit_answer', submission: draftSubmission }),
      });

      const body = await parseJsonSafe(res);
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || `Gagal mengirim jawaban ke server (HTTP ${res.status})`);
      }

      const canonical: RadiologySubmission = {
        ...(body.submission || draftSubmission),
        synced: true,
      };
      await radiologyDb.saveSubmission(canonical);
      return { submission: canonical, synced: true };
    } catch (err: any) {
      return {
        submission: { ...draftSubmission, synced: false },
        synced: false,
        error: err?.message || 'Gagal mengirim jawaban ke server. Periksa koneksi internet Anda lalu coba lagi.',
      };
    }
  },

  /**
   * Admin menyimpan penilaian checklist & feedback ke cloud (status berubah ke 'graded').
   */
  async gradeSubmission(
    submissionId: string,
    groupId: string,
    checklist: {
      thorax: Record<string, boolean>;
      abdomen: Record<string, boolean>;
      by_question?: Record<string, { thorax: Record<string, boolean>; abdomen: Record<string, boolean> }>;
    },
    score: number,
    feedback: string,
    graderId: string,
    graderName?: string
  ): Promise<GradeSubmissionResult> {
    const gradedAt = new Date().toISOString();

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        credentials: 'include',
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
          graded_at: gradedAt,
        }),
      });

      const body = await parseJsonSafe(res);
      if (!res.ok || !body?.success) {
        return {
          success: false,
          error: body?.error || `Gagal menyimpan penilaian di server (HTTP ${res.status})`,
        };
      }

      if (body.submission) {
        await radiologyDb.saveSubmission({ ...body.submission, synced: true });
      }
      return { success: true, submission: body.submission };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Koneksi gagal saat menyimpan penilaian. Coba lagi.',
      };
    }
  },

  /**
   * Hapus / reset satu submission peserta (misal untuk mengulang ujian).
   */
  async deleteSubmission(submissionId: string, groupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(
        `${API_BASE}?action=delete_submission&id=${encodeURIComponent(submissionId)}&group_id=${encodeURIComponent(groupId)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      const body = await parseJsonSafe(res);
      if (!res.ok) {
        return {
          success: false,
          error: body?.error || `Gagal mereset pengumpulan (HTTP ${res.status})`,
        };
      }
      await radiologyDb.deleteSubmission(submissionId);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Tidak dapat terhubung ke server.',
      };
    }
  },
};
