// functions/api/flashcard3d.ts
// Cloud sync & publikasi global (admin) untuk fitur Flashcard 3D.
// Deck kecil disimpan langsung di D1; deck besar (>= 400KB, mis. banyak gambar) disimpan di R2.
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
  angkatan: string | null;
  prodi: string | null;
  isAdmin: boolean;
}

const DEFAULT_JWT_SECRET = 'auramedpro-jwt-secret-dev-2026-key-fixed-fallback';
const R2_THRESHOLD_BYTES = 400_000;

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

let schemaReady = false;

async function ensureTables(db: D1Database) {
  if (schemaReady) return;
  try {
    await db.batch([
      db.prepare(`
        CREATE TABLE IF NOT EXISTS flashcard3d_decks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          user_id TEXT NOT NULL,
          uploader_username TEXT,
          is_public INTEGER DEFAULT 0,
          angkatan TEXT DEFAULT 'all',
          prodi TEXT DEFAULT 'all',
          cards_count INTEGER DEFAULT 0,
          cards_json TEXT,
          r2_key TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `),
      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_fc3d_decks_public
        ON flashcard3d_decks(is_public, updated_at DESC)
      `),
      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_fc3d_decks_user
        ON flashcard3d_decks(user_id, updated_at DESC)
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS flashcard3d_progress (
          user_id TEXT NOT NULL,
          deck_id TEXT NOT NULL,
          progress_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (user_id, deck_id)
        )
      `),
    ]);
    schemaReady = true;
  } catch (err) {
    console.warn('[flashcard3d] Schema init warning:', err);
  }
}

async function getAuthProfile(request: Request, env: Env): Promise<AuthProfile | null> {
  const token = extractAuthToken(request);
  if (!token) return null;
  const payload = await verifyJwt(token, env.AUTH_JWT_SECRET || DEFAULT_JWT_SECRET);
  if (!payload?.sub) return null;

  const row = (await env.DB.prepare(
    'SELECT id, username, role, angkatan, prodi FROM profiles WHERE id = ?'
  )
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
    role === 'admin_angkatan' ||
    uLow.startsWith('admin') ||
    uLow.startsWith('collector');

  return {
    id: String(row.id),
    username,
    role,
    angkatan: row.angkatan ? String(row.angkatan) : null,
    prodi: row.prodi ? String(row.prodi) : null,
    isAdmin,
  };
}

function matchesTarget(target: string | null | undefined, userVal: string | null | undefined): boolean {
  if (!target || target === 'all' || !userVal || userVal === 'all') return true;
  const parts = target.split(',').map((s) => s.trim().toLowerCase());
  return parts.includes('all') || parts.includes(userVal.trim().toLowerCase());
}

async function hydrateDeckRow(row: any, bucket?: R2Bucket) {
  let cards: unknown[] = [];
  if (row.cards_json) {
    try {
      cards = JSON.parse(row.cards_json);
    } catch {
      cards = [];
    }
  } else if (row.r2_key && bucket) {
    try {
      const obj = await bucket.get(String(row.r2_key));
      if (obj) {
        const text = await obj.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) cards = parsed;
      }
    } catch (err) {
      console.warn('[flashcard3d] R2 read failed for', row.r2_key, err);
    }
  }

  return {
    id: String(row.id),
    title: String(row.title),
    cards,
    userId: String(row.user_id),
    uploaderUsername: row.uploader_username ? String(row.uploader_username) : undefined,
    isPublic: Boolean(row.is_public),
    angkatan: row.angkatan ? String(row.angkatan) : 'all',
    prodi: row.prodi ? String(row.prodi) : 'all',
    createdAt: Number(row.created_at) || Date.now(),
    updatedAt: Number(row.updated_at) || Date.now(),
    synced: true,
  };
}

export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: corsHeaders });

// GET /api/flashcard3d — Ambil deck publik (sesuai prodi/angkatan user) + deck pribadi + progres user
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return jsonRes({ error: 'Database D1 belum terhubung' }, 500);
  await ensureTables(env.DB);

  try {
    const profile = await getAuthProfile(request, env);
    const url = new URL(request.url);
    const qAngkatan = url.searchParams.get('angkatan') || profile?.angkatan || null;
    const qProdi = url.searchParams.get('prodi') || profile?.prodi || null;

    let rows: any[] = [];
    if (profile) {
      const { results } = await env.DB.prepare(
        `SELECT * FROM flashcard3d_decks
         WHERE is_public = 1 OR user_id = ?
         ORDER BY updated_at DESC`
      )
        .bind(profile.id)
        .all();
      rows = results || [];
    } else {
      const { results } = await env.DB.prepare(
        `SELECT * FROM flashcard3d_decks
         WHERE is_public = 1
         ORDER BY updated_at DESC`
      ).all();
      rows = results || [];
    }

    // Filter deck publik sesuai prodi & angkatan user (admin & pemilik deck selalu melihat semua)
    const visibleRows = rows.filter((r) => {
      if (profile && (profile.isAdmin || String(r.user_id) === profile.id)) return true;
      return matchesTarget(r.angkatan, qAngkatan) && matchesTarget(r.prodi, qProdi);
    });

    const decks = await Promise.all(visibleRows.map((r) => hydrateDeckRow(r, env.QUESTIONS_BUCKET)));

    const progress: Record<string, Record<string, boolean>> = {};
    if (profile) {
      const { results: progRows } = await env.DB.prepare(
        'SELECT deck_id, progress_json FROM flashcard3d_progress WHERE user_id = ?'
      )
        .bind(profile.id)
        .all();
      for (const p of (progRows || []) as any[]) {
        try {
          progress[String(p.deck_id)] = JSON.parse(String(p.progress_json || '{}'));
        } catch {
          progress[String(p.deck_id)] = {};
        }
      }
    }

    return jsonRes({ decks, progress });
  } catch (err: any) {
    return jsonRes({ error: err?.message || 'Gagal memuat Flashcard 3D' }, 500);
  }
};

// POST /api/flashcard3d — Buat atau perbarui deck (admin bisa set isPublic = true)
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return jsonRes({ error: 'Database D1 belum terhubung' }, 500);
  await ensureTables(env.DB);

  const profile = await getAuthProfile(request, env);
  if (!profile) {
    return jsonRes({ error: 'Sesi login tidak ditemukan. Masuk terlebih dahulu untuk menyimpan ke cloud.' }, 401);
  }

  try {
    const body = (await request.json()) as any;
    const raw = body?.deck || body;
    const id = String(raw?.id || '').trim();
    const title = String(raw?.title || '').trim();
    const cards = Array.isArray(raw?.cards) ? raw.cards : [];

    if (!id || !title || cards.length === 0) {
      return jsonRes({ error: 'Deck wajib memiliki id, judul, dan minimal 1 kartu.' }, 400);
    }

    const existing = (await env.DB.prepare(
      'SELECT id, user_id, is_public, r2_key, created_at FROM flashcard3d_decks WHERE id = ?'
    )
      .bind(id)
      .first()) as any;

    if (existing) {
      const isOwner = String(existing.user_id) === profile.id;
      const canAdminEdit = profile.isAdmin && Boolean(existing.is_public);
      if (!isOwner && !canAdminEdit) {
        return jsonRes({ error: 'Anda tidak memiliki izin mengubah deck ini.' }, 403);
      }
    }

    const isPublic = profile.isAdmin ? (raw.isPublic ? 1 : 0) : 0;
    const angkatan = isPublic ? String(raw.angkatan || 'all').trim() || 'all' : 'all';
    const prodi = isPublic ? String(raw.prodi || 'all').trim() || 'all' : 'all';
    const now = Date.now();
    const createdAt = existing ? Number(existing.created_at) : Number(raw.createdAt) || now;

    const serializedCards = JSON.stringify(cards);
    const bytes = new TextEncoder().encode(serializedCards).byteLength;

    let cardsJsonForDb: string | null = serializedCards;
    let r2Key: string | null = null;

    if (bytes >= R2_THRESHOLD_BYTES) {
      if (!env.QUESTIONS_BUCKET) {
        return jsonRes(
          { error: 'Ukuran deck terlalu besar untuk database tanpa penyimpanan R2. Kurangi jumlah/ukuran gambar.' },
          413
        );
      }
      const safeId = id.replace(/[^a-zA-Z0-9\-_]/g, '_');
      r2Key = `flashcard3d/${safeId}.json`;
      await env.QUESTIONS_BUCKET.put(r2Key, serializedCards, {
        httpMetadata: { contentType: 'application/json' },
      });
      cardsJsonForDb = null;
    } else if (existing?.r2_key && env.QUESTIONS_BUCKET) {
      // Deck mengecil di bawah ambang R2: hapus file R2 lama
      await env.QUESTIONS_BUCKET.delete(String(existing.r2_key)).catch(() => {});
    }

    const ownerId = existing ? String(existing.user_id) : profile.id;

    await env.DB.prepare(
      `INSERT INTO flashcard3d_decks
        (id, title, user_id, uploader_username, is_public, angkatan, prodi, cards_count, cards_json, r2_key, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        is_public = excluded.is_public,
        angkatan = excluded.angkatan,
        prodi = excluded.prodi,
        cards_count = excluded.cards_count,
        cards_json = excluded.cards_json,
        r2_key = excluded.r2_key,
        updated_at = excluded.updated_at`
    )
      .bind(
        id,
        title,
        ownerId,
        profile.username,
        isPublic,
        angkatan,
        prodi,
        cards.length,
        cardsJsonForDb,
        r2Key,
        createdAt,
        now
      )
      .run();

    return jsonRes({
      deck: {
        id,
        title,
        cards,
        userId: ownerId,
        uploaderUsername: profile.username,
        isPublic: Boolean(isPublic),
        angkatan,
        prodi,
        createdAt,
        updatedAt: now,
        synced: true,
      },
    });
  } catch (err: any) {
    return jsonRes({ error: err?.message || 'Gagal menyimpan deck ke server.' }, 500);
  }
};

// PUT /api/flashcard3d — Simpan progres hafalan per user per deck
export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return jsonRes({ error: 'Database D1 belum terhubung' }, 500);
  await ensureTables(env.DB);

  const profile = await getAuthProfile(request, env);
  if (!profile) return jsonRes({ error: 'Unauthorized' }, 401);

  try {
    const body = (await request.json()) as any;
    const deckId = String(body?.deckId || '').trim();
    const progress = body?.progress && typeof body.progress === 'object' ? body.progress : {};

    if (!deckId) return jsonRes({ error: 'deckId wajib diisi' }, 400);

    await env.DB.prepare(
      `INSERT INTO flashcard3d_progress (user_id, deck_id, progress_json, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, deck_id) DO UPDATE SET
         progress_json = excluded.progress_json,
         updated_at = excluded.updated_at`
    )
      .bind(profile.id, deckId, JSON.stringify(progress), Date.now())
      .run();

    return jsonRes({ success: true });
  } catch (err: any) {
    return jsonRes({ error: err?.message || 'Gagal menyimpan progres' }, 500);
  }
};

// DELETE /api/flashcard3d?id=<deckId> — Hapus deck (pemilik atau admin untuk deck publik)
export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return jsonRes({ error: 'Database D1 belum terhubung' }, 500);
  await ensureTables(env.DB);

  const profile = await getAuthProfile(request, env);
  if (!profile) return jsonRes({ error: 'Unauthorized' }, 401);

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id')?.trim();
    if (!id) return jsonRes({ error: 'id deck wajib disertakan' }, 400);

    const existing = (await env.DB.prepare(
      'SELECT id, user_id, is_public, r2_key FROM flashcard3d_decks WHERE id = ?'
    )
      .bind(id)
      .first()) as any;

    if (!existing) return jsonRes({ success: true });

    const isOwner = String(existing.user_id) === profile.id;
    const canAdminDelete = profile.isAdmin && Boolean(existing.is_public);
    if (!isOwner && !canAdminDelete) {
      return jsonRes({ error: 'Anda tidak memiliki izin menghapus deck ini.' }, 403);
    }

    if (existing.r2_key && env.QUESTIONS_BUCKET) {
      await env.QUESTIONS_BUCKET.delete(String(existing.r2_key)).catch(() => {});
    }

    await env.DB.batch([
      env.DB.prepare('DELETE FROM flashcard3d_decks WHERE id = ?').bind(id),
      env.DB.prepare('DELETE FROM flashcard3d_progress WHERE deck_id = ?').bind(id),
    ]);

    return jsonRes({ success: true });
  } catch (err: any) {
    return jsonRes({ error: err?.message || 'Gagal menghapus deck' }, 500);
  }
};
