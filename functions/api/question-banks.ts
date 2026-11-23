interface Env {
  DB: D1Database;
  QUESTIONS_BUCKET?: R2Bucket;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

let schemaMigrated = false;

async function ensureQuestionBanksSchema(db: D1Database) {
  if (schemaMigrated) return;
  try {
    const row = (await db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='question_banks'")
      .first()) as any;
    const ddl = String(row?.sql || '');
    if (ddl && /name\s+TEXT\s+UNIQUE/i.test(ddl) && !/UNIQUE\s*\(\s*user_id\s*,\s*name\s*\)/i.test(ddl)) {
      await db.batch([
        db.prepare(`
          CREATE TABLE IF NOT EXISTS question_banks_v2 (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            user_id TEXT NOT NULL,
            r2_key TEXT,
            r2_url TEXT,
            questions_json TEXT,
            angkatan TEXT DEFAULT 'all',
            prodi TEXT DEFAULT 'all',
            study_group_id TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            UNIQUE(user_id, name)
          )
        `),
        db.prepare(`
          INSERT OR IGNORE INTO question_banks_v2 (id, name, user_id, r2_key, r2_url, questions_json, angkatan, prodi, study_group_id, created_at)
          SELECT id, name, user_id, r2_key, r2_url, questions_json, angkatan, prodi, study_group_id, created_at FROM question_banks
        `),
        db.prepare(`DROP TABLE question_banks`),
        db.prepare(`ALTER TABLE question_banks_v2 RENAME TO question_banks`),
        db.prepare(`CREATE INDEX IF NOT EXISTS idx_question_banks_user ON question_banks(user_id)`),
        db.prepare(`CREATE INDEX IF NOT EXISTS idx_question_banks_name ON question_banks(name)`),
        db.prepare(`CREATE INDEX IF NOT EXISTS idx_question_banks_prodi ON question_banks(prodi)`),
      ]);
    }
    schemaMigrated = true;
  } catch (err) {
    console.warn('[question-banks] Schema migration warning:', err);
  }
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const angkatan = url.searchParams.get('angkatan');
  const prodi = url.searchParams.get('prodi');
  const study_group_id = url.searchParams.get('study_group_id');
  // meta=1: mode ringan untuk polling notifikasi — tanpa kolom questions_json
  // (payload jauh lebih kecil) + cache edge 2 menit agar storm polling terserap
  const metaOnly = url.searchParams.get('meta') === '1';

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  await ensureQuestionBanksSchema(env.DB);

  const cache = typeof caches !== 'undefined' ? caches.default : null;
  if (metaOnly && cache) {
    const hit = await cache.match(request);
    if (hit) return hit;
  }

  try {
    const columns = metaOnly
      ? `qb.id,
        qb.name,
        qb.user_id,
        qb.r2_key,
        qb.r2_url,
        qb.created_at,
        qb.angkatan,
        qb.prodi,
        qb.study_group_id,
        p.username as uploader_username`
      : `qb.id,
        qb.name,
        qb.user_id,
        qb.r2_key,
        qb.r2_url,
        CASE WHEN qb.questions_json = 'null' THEN NULL ELSE qb.questions_json END as questions_json,
        qb.created_at,
        qb.angkatan,
        qb.prodi,
        qb.study_group_id,
        p.username as uploader_username`;
    let query = `
      SELECT
        ${columns}
      FROM question_banks qb
      LEFT JOIN profiles p ON qb.user_id = p.id
    `;
    const binds: any[] = [];
    const whereClauses: string[] = [];

    if (study_group_id) {
      whereClauses.push(`qb.study_group_id = ?`);
      binds.push(study_group_id);
    } else {
      whereClauses.push(`qb.study_group_id IS NULL`);
    }

    if (angkatan && angkatan !== 'all') {
      whereClauses.push(`(
        qb.angkatan = 'all' 
        OR qb.angkatan = ? 
        OR instr(',' || coalesce(qb.angkatan, '') || ',', ',' || ? || ',') > 0
      )`);
      binds.push(angkatan, angkatan);
    }

    if (prodi && prodi !== 'all') {
      whereClauses.push(`(
        qb.prodi IS NULL
        OR qb.prodi = 'all'
        OR qb.prodi = ?
        OR instr(',' || coalesce(qb.prodi, '') || ',', ',' || ? || ',') > 0
      )`);
      binds.push(prodi, prodi);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ` + whereClauses.join(' AND ');
    }

    query += ` ORDER BY qb.name ASC`;

    const { results } = await env.DB.prepare(query).bind(...binds).all();

    const headers: Record<string, string> = { ...corsHeaders, 'Content-Type': 'application/json' };
    if (metaOnly && !study_group_id) {
      // Respons meta aman di-cache: handler tidak membaca cookie/credentials
      headers['Cache-Control'] = 'public, max-age=120';
    } else {
      // Cegah iOS Safari menyajikan cache lama saat membuka daftar bank soal di iPad/HP
      headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
    }
    const response = new Response(JSON.stringify({ data: results || [] }), {
      status: 200,
      headers
    });

    if (metaOnly && cache && !study_group_id) {
      context.waitUntil(cache.put(request, response.clone()));
    }
    return response;
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  await ensureQuestionBanksSchema(env.DB);

  try {
    const body = await request.json() as any;
    const { name, user_id, r2_key, r2_url, questions_json, angkatan = 'all', prodi = 'all', study_group_id } = body;

    if (!name || !user_id) {
      return new Response(JSON.stringify({ error: 'Name dan user_id wajib diisi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const id = body.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const serializedQuestions =
      questions_json && typeof questions_json === 'object'
        ? JSON.stringify(questions_json)
        : (questions_json || null);

    try {
      await env.DB.prepare(`
        INSERT INTO question_banks (id, name, user_id, r2_key, r2_url, questions_json, created_at, angkatan, prodi, study_group_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, name) DO UPDATE SET
          r2_key = coalesce(excluded.r2_key, question_banks.r2_key),
          r2_url = coalesce(excluded.r2_url, question_banks.r2_url),
          questions_json = coalesce(excluded.questions_json, question_banks.questions_json),
          angkatan = coalesce(excluded.angkatan, question_banks.angkatan),
          prodi = coalesce(excluded.prodi, question_banks.prodi),
          study_group_id = coalesce(excluded.study_group_id, question_banks.study_group_id)
      `).bind(
        id,
        name,
        user_id,
        r2_key || null,
        r2_url || null,
        serializedQuestions,
        now,
        angkatan,
        prodi,
        study_group_id || null
      ).run();
    } catch {
      // Fallback jika tabel masih menggunakan constraint lama: jangan pernah timpa user_id milik pengguna lain
      const existing = (await env.DB.prepare('SELECT id, user_id FROM question_banks WHERE name = ?')
        .bind(name)
        .first()) as any;
      if (existing && existing.user_id === user_id) {
        await env.DB.prepare(`
          UPDATE question_banks
          SET r2_key = coalesce(?, r2_key),
              r2_url = coalesce(?, r2_url),
              questions_json = coalesce(?, questions_json),
              angkatan = coalesce(?, angkatan),
              prodi = coalesce(?, prodi),
              study_group_id = coalesce(?, study_group_id)
          WHERE id = ?
        `)
          .bind(
            r2_key || null,
            r2_url || null,
            serializedQuestions,
            angkatan,
            prodi,
            study_group_id || null,
            existing.id
          )
          .run();
      } else {
        const safeName = existing ? `${name.replace(/\.json$/i, '')} (${user_id.slice(0, 6)}).json` : name;
        await env.DB.prepare(`
          INSERT INTO question_banks (id, name, user_id, r2_key, r2_url, questions_json, created_at, angkatan, prodi, study_group_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
          .bind(
            id,
            safeName,
            user_id,
            r2_key || null,
            r2_url || null,
            serializedQuestions,
            now,
            angkatan,
            prodi,
            study_group_id || null
          )
          .run();
      }
    }

    return new Response(JSON.stringify({ success: true, name }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const name = url.searchParams.get('name');
  const userId = url.searchParams.get('user_id');

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!name) {
    return new Response(JSON.stringify({ error: 'Parameter name wajib diisi' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  await ensureQuestionBanksSchema(env.DB);

  try {
    let isAdminRequester = false;
    if (userId) {
      const prof = (await env.DB.prepare('SELECT username, role FROM profiles WHERE id = ?')
        .bind(userId)
        .first()) as any;
      if (
        userId === '47c2368d-792a-4c69-9386-4b7d2139ddc3' ||
        prof?.username === 'admin' ||
        prof?.role === 'super_admin' ||
        prof?.role === 'admin' ||
        prof?.role === 'admin_angkatan' ||
        (prof?.username && String(prof.username).toLowerCase().startsWith('admin'))
      ) {
        isAdminRequester = true;
      }
    }

    const row = (userId && !isAdminRequester
      ? await env.DB.prepare('SELECT id, r2_key FROM question_banks WHERE name = ? AND user_id = ?')
          .bind(name, userId)
          .first()
      : await env.DB.prepare('SELECT id, r2_key FROM question_banks WHERE name = ?')
          .bind(name)
          .first()) as any;

    if (row?.id) {
      await env.DB.prepare('DELETE FROM question_banks WHERE id = ?').bind(row.id).run();
    } else if (!userId || isAdminRequester) {
      await env.DB.prepare('DELETE FROM question_banks WHERE name = ?').bind(name).run();
    }

    if (row?.r2_key && env.QUESTIONS_BUCKET) {
      try {
        // Hanya hapus objek R2 jika tidak ada baris lain yang masih memakai r2_key tersebut
        const stillUsed = (await env.DB.prepare('SELECT COUNT(*) as cnt FROM question_banks WHERE r2_key = ?')
          .bind(row.r2_key)
          .first()) as any;
        if (!stillUsed || Number(stillUsed.cnt) === 0) {
          await env.QUESTIONS_BUCKET.delete(row.r2_key);
        }
      } catch (e) {
        console.warn('Gagal menghapus file dari R2:', e);
      }
    }

    return new Response(JSON.stringify({ success: true, deleted: name }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = (await request.json()) as any;
    const { name, angkatan, prodi } = body;

    if (!name || (angkatan === undefined && prodi === undefined)) {
      return new Response(JSON.stringify({ error: 'Name dan angkatan/prodi wajib diisi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (angkatan !== undefined && prodi !== undefined) {
      await env.DB.prepare('UPDATE question_banks SET angkatan = ?, prodi = ? WHERE name = ?')
        .bind(angkatan, prodi, name)
        .run();
    } else if (angkatan !== undefined) {
      await env.DB.prepare('UPDATE question_banks SET angkatan = ? WHERE name = ?')
        .bind(angkatan, name)
        .run();
    } else if (prodi !== undefined) {
      await env.DB.prepare('UPDATE question_banks SET prodi = ? WHERE name = ?')
        .bind(prodi, name)
        .run();
    }

    return new Response(JSON.stringify({ success: true, name, angkatan, prodi }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

