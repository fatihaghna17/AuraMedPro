// functions/api/radiology.ts
// Backend Cloudflare Pages Functions (D1 + R2) untuk fitur Latihan CBT Radiologi di Grup Belajar.
// - Auto-init & auto-migrasi tabel D1 (aman di lingkungan baru maupun database lama)
// - Offload gambar rontgen (binary multipart / base64 data URI) ke Cloudflare R2
// - Spillover questions_json berukuran besar (>= 350KB) ke Cloudflare R2 agar tidak terbentur batas ukuran row D1
// - Mendukung penuh GET (packets, packet, submissions, media), POST (upload_image, create/update packet, submit, grade), dan DELETE
import { extractAuthToken, verifyJwt } from './auth/_utils';

interface Env {
  DB: D1Database;
  QUESTIONS_BUCKET?: R2Bucket;
  AUTH_JWT_SECRET?: string;
}

interface AuthProfile {
  id: string;
  username: string;
  role: string | null;
  isAdmin: boolean;
}

const DEFAULT_JWT_SECRET = 'auramedpro-jwt-secret-dev-2026-key-fixed-fallback';
const R2_JSON_THRESHOLD_BYTES = 350_000;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB per citra rontgen

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

function jsonRes(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function sanitizeSegment(input: string, fallback = 'item'): string {
  const cleaned = String(input || '')
    .trim()
    .replace(/[^a-zA-Z0-9\-_]/g, '_')
    .slice(0, 80);
  return cleaned || fallback;
}

let schemaReady = false;

async function ensureRadiologyTables(db: D1Database): Promise<void> {
  if (schemaReady) return;
  try {
    await db.batch([
      db.prepare(`
        CREATE TABLE IF NOT EXISTS radiology_packets (
          id TEXT PRIMARY KEY,
          group_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          admin_id TEXT NOT NULL,
          admin_name TEXT,
          questions_json TEXT NOT NULL,
          r2_key TEXT,
          questions_count INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS radiology_submissions (
          id TEXT PRIMARY KEY,
          packet_id TEXT NOT NULL,
          group_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          username TEXT NOT NULL,
          answers_json TEXT NOT NULL,
          checklist_json TEXT,
          score REAL DEFAULT 0,
          feedback TEXT,
          status TEXT DEFAULT 'pending',
          graded_by TEXT,
          graded_at TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_radiology_packets_group ON radiology_packets(group_id)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_radiology_submissions_group ON radiology_submissions(group_id)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_radiology_submissions_packet ON radiology_submissions(packet_id)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_radiology_submissions_user ON radiology_submissions(user_id)`),
    ]);

    // Migrasi aman untuk tabel radiology_packets lama yang belum memiliki kolom r2_key / questions_count / updated_at
    const { results: cols } = await db.prepare(`PRAGMA table_info(radiology_packets)`).all();
    const colNames = new Set((cols || []).map((c: any) => String(c.name)));
    if (!colNames.has('r2_key')) {
      await db.prepare(`ALTER TABLE radiology_packets ADD COLUMN r2_key TEXT`).run();
    }
    if (!colNames.has('questions_count')) {
      await db.prepare(`ALTER TABLE radiology_packets ADD COLUMN questions_count INTEGER DEFAULT 0`).run();
    }
    if (!colNames.has('updated_at')) {
      await db.prepare(`ALTER TABLE radiology_packets ADD COLUMN updated_at TEXT`).run();
    }

    schemaReady = true;
  } catch (err) {
    console.warn('[radiology] Schema init warning:', err);
  }
}

async function getAuthProfile(request: Request, env: Env): Promise<AuthProfile | null> {
  try {
    const token = extractAuthToken(request);
    if (!token) return null;
    const payload = await verifyJwt(token, env.AUTH_JWT_SECRET || DEFAULT_JWT_SECRET);
    if (!payload?.sub) return null;

    const row = (await env.DB.prepare('SELECT id, username, role FROM profiles WHERE id = ?')
      .bind(payload.sub)
      .first()) as any;
    if (!row) return null;

    const username = String(row.username || '');
    const role = row.role ? String(row.role) : null;
    const uLow = username.toLowerCase();
    const isAdmin =
      username === 'admin' ||
      role === 'super_admin' ||
      role === 'admin' ||
      role === 'collector' ||
      uLow.startsWith('admin');

    return { id: String(row.id), username, role, isAdmin };
  } catch {
    return null;
  }
}

function extFromMime(contentType: string): string {
  const ct = contentType.toLowerCase();
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('png')) return 'png';
  if (ct.includes('gif')) return 'gif';
  return 'jpg';
}

function decodeBase64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/\s+/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeDataUrlImage(dataUrl: string): { bytes: Uint8Array; contentType: string; ext: string } | null {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,(.+)$/i);
  if (!match) return null;
  const rawMime = match[1].toLowerCase();
  const contentType = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime;
  const bytes = decodeBase64ToBytes(match[2]);
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new Error('Ukuran gambar melebihi batas maksimum 15 MB.');
  }
  return { bytes, contentType, ext: extFromMime(contentType) };
}

async function shortSha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const arr = new Uint8Array(digest);
  let hex = '';
  for (let i = 0; i < 8; i++) {
    hex += arr[i].toString(16).padStart(2, '0');
  }
  return hex;
}

async function uploadImageBytesToR2(
  bucket: R2Bucket,
  groupId: string,
  packetId: string,
  bytes: Uint8Array,
  contentType: string,
  ext: string
): Promise<{ key: string; url: string }> {
  const safeGroup = sanitizeSegment(groupId, 'group');
  const safePacket = sanitizeSegment(packetId, 'packet');
  const hashHex = await shortSha256Hex(bytes);
  const key = `radiology/images/${safeGroup}/${safePacket}/${hashHex}.${ext}`;

  await bucket.put(key, bytes, {
    httpMetadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });

  return {
    key,
    url: `/api/radiology?action=media&key=${encodeURIComponent(key)}`,
  };
}

async function offloadQuestionImages(
  questions: any[],
  groupId: string,
  packetId: string,
  bucket?: R2Bucket
): Promise<any[]> {
  if (!bucket || !Array.isArray(questions)) return questions;

  const cache = new Map<string, string>();

  const convertUrl = async (val: unknown): Promise<string> => {
    if (typeof val !== 'string') return '';
    const trimmed = val.trim();
    if (!trimmed.startsWith('data:image/')) return trimmed;
    const cached = cache.get(trimmed);
    if (cached) return cached;

    const decoded = decodeDataUrlImage(trimmed);
    if (!decoded) return trimmed;
    const uploaded = await uploadImageBytesToR2(
      bucket,
      groupId,
      packetId,
      decoded.bytes,
      decoded.contentType,
      decoded.ext
    );
    cache.set(trimmed, uploaded.url);
    return uploaded.url;
  };

  const out: any[] = [];
  for (const rawQ of questions) {
    if (!rawQ || typeof rawQ !== 'object') continue;
    const q = { ...rawQ };

    if (Array.isArray(q.image_urls) && q.image_urls.length > 0) {
      const converted: string[] = [];
      for (const u of q.image_urls) {
        const res = await convertUrl(u);
        if (res) converted.push(res);
      }
      q.image_urls = converted;
      if (converted.length > 0) {
        q.image_url = converted[0];
      }
    } else if (typeof q.image_url === 'string' && q.image_url.trim()) {
      q.image_url = await convertUrl(q.image_url);
      q.image_urls = [q.image_url];
    }

    if (Array.isArray(q.images) && q.images.length > 0) {
      const converted: string[] = [];
      for (const u of q.images) {
        const res = await convertUrl(u);
        if (res) converted.push(res);
      }
      if (!q.image_urls || q.image_urls.length === 0) {
        q.image_urls = converted;
        q.image_url = converted[0] || '';
      }
      delete q.images;
    }

    out.push(q);
  }
  return out;
}

async function hydratePacketRow(row: any, bucket?: R2Bucket) {
  let questions: any[] = [];

  if (row.r2_key && bucket) {
    try {
      const obj = await bucket.get(String(row.r2_key));
      if (obj) {
        const parsed = JSON.parse(await obj.text());
        if (Array.isArray(parsed)) questions = parsed;
      }
    } catch (err) {
      console.warn('[radiology] R2 packet read failed for', row.r2_key, err);
    }
  }

  if (questions.length === 0 && row.questions_json) {
    try {
      const parsed = typeof row.questions_json === 'string' ? JSON.parse(row.questions_json) : row.questions_json;
      if (Array.isArray(parsed)) questions = parsed;
    } catch {
      questions = [];
    }
  }

  return {
    id: String(row.id),
    group_id: String(row.group_id),
    title: String(row.title || 'Paket Latihan CBT Radiologi'),
    description: String(row.description || ''),
    admin_id: String(row.admin_id || ''),
    admin_name: String(row.admin_name || 'Admin'),
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: row.updated_at ? String(row.updated_at) : String(row.created_at || new Date().toISOString()),
    r2_key: row.r2_key ? String(row.r2_key) : null,
    synced: true,
    questions,
  };
}

function hydrateSubmissionRow(row: any) {
  let answers: Record<string, string> = {};
  let checklist: any = { thorax: {}, abdomen: {} };

  try {
    answers = typeof row.answers_json === 'string' ? JSON.parse(row.answers_json) : (row.answers_json || {});
  } catch {
    answers = {};
  }
  try {
    checklist = typeof row.checklist_json === 'string' ? JSON.parse(row.checklist_json) : (row.checklist_json || { thorax: {}, abdomen: {} });
  } catch {
    checklist = { thorax: {}, abdomen: {} };
  }

  return {
    id: String(row.id),
    packet_id: String(row.packet_id),
    group_id: String(row.group_id),
    user_id: String(row.user_id),
    username: String(row.username || 'Peserta'),
    answers,
    checklist,
    score: Number(row.score || 0),
    feedback: String(row.feedback || ''),
    status: row.status === 'graded' ? 'graded' : 'pending',
    graded_by: row.graded_by ? String(row.graded_by) : undefined,
    graded_at: row.graded_at ? String(row.graded_at) : undefined,
    created_at: String(row.created_at || new Date().toISOString()),
    synced: true,
  };
}

async function deleteR2Prefix(bucket: R2Bucket, prefix: string): Promise<void> {
  try {
    let cursor: string | undefined;
    for (let page = 0; page < 10; page++) {
      const listed = await bucket.list({ prefix, cursor, limit: 100 });
      if (listed.objects.length > 0) {
        await Promise.all(listed.objects.map((obj) => bucket.delete(obj.key).catch(() => {})));
      }
      if (!listed.truncated || !listed.cursor) break;
      cursor = listed.cursor;
    }
  } catch (err) {
    console.warn('[radiology] Cleanup R2 prefix failed:', prefix, err);
  }
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

// GET /api/radiology?action=media&key=radiology/images/...
// GET /api/radiology?action=packets&group_id=xxx
// GET /api/radiology?action=packet&id=yyy&group_id=xxx
// GET /api/radiology?action=submissions&group_id=xxx[&packet_id=yyy]
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  // 1. Proxy citra rontgen dari R2 (same-origin, zero CORS issue, cache immutable)
  if (action === 'media') {
    const key = url.searchParams.get('key') || '';
    if (!key.startsWith('radiology/images/') || key.includes('..')) {
      return jsonRes({ error: 'Key media tidak valid' }, 400);
    }
    if (!env.QUESTIONS_BUCKET) {
      return jsonRes({ error: 'Penyimpanan R2 belum terhubung' }, 500);
    }
    try {
      const object = await env.QUESTIONS_BUCKET.get(key);
      if (!object) {
        return jsonRes({ error: 'Gambar tidak ditemukan' }, 404);
      }

      const etag = object.httpEtag;
      const ifNoneMatch = request.headers.get('If-None-Match');
      if (etag && ifNoneMatch && ifNoneMatch === etag) {
        return new Response(null, {
          status: 304,
          headers: {
            'Access-Control-Allow-Origin': '*',
            ETag: etag,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }

      const headers = new Headers();
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Content-Type', object.httpMetadata?.contentType || 'image/webp');
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      if (etag) headers.set('ETag', etag);

      return new Response(object.body, { status: 200, headers });
    } catch (err: any) {
      return jsonRes({ error: err?.message || 'Gagal memuat gambar' }, 500);
    }
  }

  if (!env.DB) {
    return jsonRes({ error: 'Database D1 belum terhubung' }, 500);
  }

  await ensureRadiologyTables(env.DB);

  const groupId = url.searchParams.get('group_id');
  if (!groupId) {
    return jsonRes({ error: 'group_id dibutuhkan' }, 400);
  }

  try {
    if (action === 'packets') {
      const { results } = await env.DB.prepare(`
        SELECT id, group_id, title, description, admin_id, admin_name, questions_json, r2_key, questions_count, created_at, updated_at
        FROM radiology_packets
        WHERE group_id = ?
        ORDER BY created_at DESC
      `)
        .bind(groupId)
        .all();

      const packets = await Promise.all((results || []).map((row: any) => hydratePacketRow(row, env.QUESTIONS_BUCKET)));
      return jsonRes({ data: packets });
    }

    if (action === 'packet') {
      const id = url.searchParams.get('id');
      if (!id) return jsonRes({ error: 'id paket dibutuhkan' }, 400);

      const row = await env.DB.prepare(`
        SELECT id, group_id, title, description, admin_id, admin_name, questions_json, r2_key, questions_count, created_at, updated_at
        FROM radiology_packets
        WHERE id = ? AND group_id = ?
      `)
        .bind(id, groupId)
        .first();

      if (!row) return jsonRes({ error: 'Paket tidak ditemukan' }, 404);
      const packet = await hydratePacketRow(row, env.QUESTIONS_BUCKET);
      return jsonRes({ data: packet });
    }

    if (action === 'submissions') {
      const packetId = url.searchParams.get('packet_id');
      let query = `
        SELECT id, packet_id, group_id, user_id, username, answers_json, checklist_json, score, feedback, status, graded_by, graded_at, created_at
        FROM radiology_submissions
        WHERE group_id = ?
      `;
      const binds: any[] = [groupId];

      if (packetId) {
        query += ` AND packet_id = ?`;
        binds.push(packetId);
      }
      query += ` ORDER BY created_at DESC`;

      const { results } = await env.DB.prepare(query).bind(...binds).all();
      const submissions = (results || []).map((row: any) => hydrateSubmissionRow(row));
      return jsonRes({ data: submissions });
    }

    return jsonRes({ error: 'Aksi tidak valid' }, 400);
  } catch (err: any) {
    return jsonRes({ error: err?.message || 'Gagal memuat data radiologi' }, 500);
  }
};

// POST /api/radiology
// - multipart/form-data: upload gambar rontgen ke R2 (fields: file, group_id, packet_id)
// - JSON action: 'upload_image' | 'create_packet' | 'update_packet' | 'submit_answer' | 'grade_submission'
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const contentType = request.headers.get('Content-Type') || '';

  // 0. Multipart direct binary image upload ke R2
  if (contentType.includes('multipart/form-data')) {
    if (!env.QUESTIONS_BUCKET) {
      return jsonRes({ error: 'Penyimpanan Cloudflare R2 belum terhubung' }, 500);
    }
    try {
      const formData = await request.formData();
      const file = formData.get('file');
      const groupId = String(formData.get('group_id') || 'group');
      const packetId = String(formData.get('packet_id') || `pkt-${Date.now()}`);

      if (!file || typeof file === 'string') {
        return jsonRes({ error: 'File gambar wajib disertakan' }, 400);
      }

      const mime = (file.type || 'image/jpeg').toLowerCase();
      if (!mime.startsWith('image/')) {
        return jsonRes({ error: 'Hanya file gambar (JPG, PNG, WebP, GIF) yang diperbolehkan' }, 400);
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return jsonRes({ error: 'Ukuran gambar melebihi batas maksimum 15 MB' }, 413);
      }

      const bytes = new Uint8Array(await file.arrayBuffer());
      const uploaded = await uploadImageBytesToR2(
        env.QUESTIONS_BUCKET,
        groupId,
        packetId,
        bytes,
        mime === 'image/jpg' ? 'image/jpeg' : mime,
        extFromMime(mime)
      );

      return jsonRes({ success: true, key: uploaded.key, url: uploaded.url });
    } catch (err: any) {
      return jsonRes({ error: err?.message || 'Gagal mengunggah gambar ke R2' }, 500);
    }
  }

  if (!env.DB) {
    return jsonRes({ error: 'Database D1 belum terhubung' }, 500);
  }

  await ensureRadiologyTables(env.DB);

  try {
    const body = (await request.json()) as any;
    const { action } = body || {};
    const authProfile = await getAuthProfile(request, env);

    // 1. Upload image via JSON data_url
    if (action === 'upload_image') {
      if (!env.QUESTIONS_BUCKET) {
        return jsonRes({ error: 'Penyimpanan Cloudflare R2 belum terhubung' }, 500);
      }
      const { data_url, group_id, packet_id } = body;
      if (!data_url || typeof data_url !== 'string') {
        return jsonRes({ error: 'data_url gambar wajib diisi' }, 400);
      }
      const decoded = decodeDataUrlImage(data_url);
      if (!decoded) {
        return jsonRes({ error: 'Format gambar base64 tidak valid (gunakan JPG/PNG/WebP/GIF)' }, 400);
      }
      const uploaded = await uploadImageBytesToR2(
        env.QUESTIONS_BUCKET,
        String(group_id || 'group'),
        String(packet_id || `pkt-${Date.now()}`),
        decoded.bytes,
        decoded.contentType,
        decoded.ext
      );
      return jsonRes({ success: true, key: uploaded.key, url: uploaded.url });
    }

    // 2. Create or update packet (otomatis offload gambar base64 & payload besar ke R2)
    if (action === 'create_packet' || action === 'update_packet') {
      const { packet } = body;
      if (!packet || !packet.id || !packet.group_id) {
        return jsonRes({ error: 'Data paket tidak valid (id dan group_id wajib diisi)' }, 400);
      }
      if (!Array.isArray(packet.questions) || packet.questions.length === 0) {
        return jsonRes({ error: 'Paket wajib memiliki minimal 1 soal radiologi' }, 400);
      }

      const packetId = String(packet.id).trim();
      const groupId = String(packet.group_id).trim();
      const title = String(packet.title || 'Paket Latihan CBT Radiologi').trim();
      const description = String(packet.description || '').trim();
      const adminId = String(packet.admin_id || authProfile?.id || 'admin').trim();
      const adminName = String(packet.admin_name || authProfile?.username || 'Admin Korektor').trim();

      const existing = (await env.DB.prepare(
        'SELECT id, group_id, r2_key, created_at FROM radiology_packets WHERE id = ?'
      )
        .bind(packetId)
        .first()) as any;

      if (existing && String(existing.group_id) !== groupId) {
        return jsonRes({ error: 'Paket ini milik grup belajar lain' }, 403);
      }

      // Offload semua gambar data:image/... ke R2 agar JSON ringan dan cepat dimuat di semua perangkat
      const processedQuestions = await offloadQuestionImages(
        packet.questions,
        groupId,
        packetId,
        env.QUESTIONS_BUCKET
      );

      const serializedQuestions = JSON.stringify(processedQuestions);
      const byteLength = new TextEncoder().encode(serializedQuestions).byteLength;

      let questionsJsonForDb = serializedQuestions;
      let r2Key: string | null = null;

      if (byteLength >= R2_JSON_THRESHOLD_BYTES) {
        if (!env.QUESTIONS_BUCKET) {
          return jsonRes(
            { error: 'Ukuran paket soal terlalu besar untuk D1 tanpa R2. Kurangi ukuran gambar di file JSON.' },
            413
          );
        }
        const safeId = sanitizeSegment(packetId, 'packet');
        r2Key = `radiology/packets/${safeId}.json`;
        await env.QUESTIONS_BUCKET.put(r2Key, serializedQuestions, {
          httpMetadata: { contentType: 'application/json' },
        });
        // Simpan '[]' alih-alih NULL untuk tetap kompatibel dengan constraint NOT NULL di skema lama
        questionsJsonForDb = '[]';
      } else if (existing?.r2_key && env.QUESTIONS_BUCKET) {
        await env.QUESTIONS_BUCKET.delete(String(existing.r2_key)).catch(() => {});
      }

      const now = new Date().toISOString();
      const createdAt = existing?.created_at ? String(existing.created_at) : String(packet.created_at || now);

      await env.DB.prepare(`
        INSERT INTO radiology_packets
          (id, group_id, title, description, admin_id, admin_name, questions_json, r2_key, questions_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          admin_id = excluded.admin_id,
          admin_name = excluded.admin_name,
          questions_json = excluded.questions_json,
          r2_key = excluded.r2_key,
          questions_count = excluded.questions_count,
          updated_at = excluded.updated_at
      `)
        .bind(
          packetId,
          groupId,
          title,
          description,
          adminId,
          adminName,
          questionsJsonForDb,
          r2Key,
          processedQuestions.length,
          createdAt,
          now
        )
        .run();

      const savedPacket = {
        id: packetId,
        group_id: groupId,
        title,
        description,
        admin_id: adminId,
        admin_name: adminName,
        created_at: createdAt,
        updated_at: now,
        r2_key: r2Key,
        synced: true,
        questions: processedQuestions,
      };

      return jsonRes({ success: true, packet: savedPacket });
    }

    // 3. Submit student essay answer (hindari duplikat per packet_id + user_id)
    if (action === 'submit_answer') {
      const { submission } = body;
      if (!submission || !submission.packet_id || !submission.group_id) {
        return jsonRes({ error: 'Data submission tidak lengkap' }, 400);
      }

      const userId = String(authProfile?.id || submission.user_id || '').trim();
      if (!userId) {
        return jsonRes({ error: 'user_id dibutuhkan untuk mengumpulkan jawaban' }, 400);
      }
      const username = String(
        (authProfile?.username && authProfile.username !== 'user' ? authProfile.username : null) ||
          submission.username ||
          'Peserta'
      ).trim();

      const packetId = String(submission.packet_id).trim();
      const groupId = String(submission.group_id).trim();
      const now = String(submission.created_at || new Date().toISOString());
      const answersObj = submission.answers && typeof submission.answers === 'object' ? submission.answers : {};

      const existing = (await env.DB.prepare(
        'SELECT id, status FROM radiology_submissions WHERE packet_id = ? AND user_id = ? LIMIT 1'
      )
        .bind(packetId, userId)
        .first()) as any;

      if (existing && existing.status === 'graded') {
        return jsonRes(
          { error: 'Jawaban Anda sudah selesai dinilai oleh korektor sehingga tidak dapat dikirim ulang.' },
          409
        );
      }

      const finalId = existing?.id ? String(existing.id) : String(submission.id || `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

      await env.DB.prepare(`
        INSERT INTO radiology_submissions
          (id, packet_id, group_id, user_id, username, answers_json, checklist_json, score, feedback, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          username = excluded.username,
          answers_json = excluded.answers_json,
          status = 'pending',
          created_at = excluded.created_at
      `)
        .bind(
          finalId,
          packetId,
          groupId,
          userId,
          username,
          JSON.stringify(answersObj),
          JSON.stringify(submission.checklist || { thorax: {}, abdomen: {} }),
          0,
          '',
          'pending',
          now
        )
        .run();

      const savedSub = {
        id: finalId,
        packet_id: packetId,
        group_id: groupId,
        user_id: userId,
        username,
        answers: answersObj,
        checklist: submission.checklist || { thorax: {}, abdomen: {} },
        score: 0,
        feedback: '',
        status: 'pending' as const,
        created_at: now,
        synced: true,
      };

      return jsonRes({ success: true, submission_id: finalId, submission: savedSub });
    }

    // 4. Admin grade submission
    if (action === 'grade_submission') {
      const { submission_id, checklist, score, feedback, grader_id, grader_name, graded_at } = body;
      if (!submission_id) {
        return jsonRes({ error: 'submission_id dibutuhkan' }, 400);
      }

      const finalGrader = String(
        grader_name ||
          (authProfile?.username && authProfile.username !== 'user' ? authProfile.username : null) ||
          grader_id ||
          'Admin Korektor'
      ).trim();
      const finalGradedAt = String(graded_at || new Date().toISOString());
      const finalChecklist = checklist || { thorax: {}, abdomen: {} };
      const finalScore = Number(score || 0);
      const finalFeedback = String(feedback || '');

      const result = await env.DB.prepare(`
        UPDATE radiology_submissions
        SET checklist_json = ?, score = ?, feedback = ?, status = 'graded', graded_by = ?, graded_at = ?
        WHERE id = ?
      `)
        .bind(
          JSON.stringify(finalChecklist),
          finalScore,
          finalFeedback,
          finalGrader,
          finalGradedAt,
          String(submission_id)
        )
        .run();

      if (result.meta && result.meta.changes === 0) {
        return jsonRes({ error: 'Lembar jawaban tidak ditemukan di server' }, 404);
      }

      const updatedRow = await env.DB.prepare(
        `SELECT id, packet_id, group_id, user_id, username, answers_json, checklist_json, score, feedback, status, graded_by, graded_at, created_at
         FROM radiology_submissions WHERE id = ?`
      )
        .bind(String(submission_id))
        .first();

      return jsonRes({
        success: true,
        submission: updatedRow ? hydrateSubmissionRow(updatedRow) : undefined,
      });
    }

    return jsonRes({ error: 'Action tidak dikenal' }, 400);
  } catch (err: any) {
    return jsonRes({ error: err?.message || 'Terjadi kesalahan pada server radiologi' }, 500);
  }
};

// DELETE /api/radiology?action=delete_packet&id=xxx&group_id=yyy
// DELETE /api/radiology?action=delete_submission&id=xxx&group_id=yyy
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return jsonRes({ error: 'Database D1 belum terhubung' }, 500);
  }

  await ensureRadiologyTables(env.DB);

  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'delete_packet';
    const id = url.searchParams.get('id')?.trim();
    const groupId = url.searchParams.get('group_id')?.trim();

    if (!id || !groupId) {
      return jsonRes({ error: 'Parameter id dan group_id wajib diisi' }, 400);
    }

    if (action === 'delete_packet') {
      const existing = (await env.DB.prepare(
        'SELECT id, group_id, r2_key FROM radiology_packets WHERE id = ? AND group_id = ?'
      )
        .bind(id, groupId)
        .first()) as any;

      if (existing && env.QUESTIONS_BUCKET) {
        if (existing.r2_key) {
          await env.QUESTIONS_BUCKET.delete(String(existing.r2_key)).catch(() => {});
        }
        const safeGroup = sanitizeSegment(groupId, 'group');
        const safePacket = sanitizeSegment(id, 'packet');
        await deleteR2Prefix(env.QUESTIONS_BUCKET, `radiology/images/${safeGroup}/${safePacket}/`);
      }

      await env.DB.batch([
        env.DB.prepare('DELETE FROM radiology_packets WHERE id = ? AND group_id = ?').bind(id, groupId),
        env.DB.prepare('DELETE FROM radiology_submissions WHERE packet_id = ? AND group_id = ?').bind(id, groupId),
      ]);

      return jsonRes({ success: true });
    }

    if (action === 'delete_submission') {
      await env.DB.prepare('DELETE FROM radiology_submissions WHERE id = ? AND group_id = ?')
        .bind(id, groupId)
        .run();
      return jsonRes({ success: true });
    }

    return jsonRes({ error: 'Aksi DELETE tidak valid' }, 400);
  } catch (err: any) {
    return jsonRes({ error: err?.message || 'Gagal menghapus data radiologi' }, 500);
  }
};
