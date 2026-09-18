interface Env {
  DB: D1Database;
  QUESTIONS_BUCKET?: R2Bucket;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const angkatan = url.searchParams.get('angkatan');
  const prodi = url.searchParams.get('prodi');
  // meta=1: mode ringan untuk polling notifikasi — tanpa kolom questions_json
  // (payload jauh lebih kecil) + cache edge 2 menit agar storm polling terserap
  const metaOnly = url.searchParams.get('meta') === '1';

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

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
        p.username as uploader_username`;
    let query = `
      SELECT
        ${columns}
      FROM question_banks qb
      LEFT JOIN profiles p ON qb.user_id = p.id
    `;
    const binds: any[] = [];
    const whereClauses: string[] = [];

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
    if (metaOnly) {
      // Respons meta aman di-cache: handler tidak membaca cookie/credentials
      headers['Cache-Control'] = 'public, max-age=120';
    }
    const response = new Response(JSON.stringify({ data: results || [] }), {
      status: 200,
      headers
    });

    if (metaOnly && cache) {
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

  try {
    const body = await request.json() as any;
    const { name, user_id, r2_key, r2_url, questions_json, angkatan = 'all', prodi = 'all' } = body;

    if (!name || !user_id) {
      return new Response(JSON.stringify({ error: 'Name dan user_id wajib diisi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const id = body.id || crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO question_banks (id, name, user_id, r2_key, r2_url, questions_json, created_at, angkatan, prodi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        user_id = excluded.user_id,
        r2_key = coalesce(excluded.r2_key, question_banks.r2_key),
        r2_url = coalesce(excluded.r2_url, question_banks.r2_url),
        questions_json = coalesce(excluded.questions_json, question_banks.questions_json),
        angkatan = coalesce(excluded.angkatan, question_banks.angkatan),
        prodi = coalesce(excluded.prodi, question_banks.prodi)
    `).bind(
      id,
      name,
      user_id,
      r2_key || null,
      r2_url || null,
      questions_json && typeof questions_json === 'object' ? JSON.stringify(questions_json) : (questions_json || null),
      now,
      angkatan,
      prodi
    ).run();

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

  try {
    // Cari dulu r2_key sebelum hapus row jika ada
    const row = await env.DB.prepare('SELECT r2_key FROM question_banks WHERE name = ?').bind(name).first() as any;
    if (row?.r2_key && env.QUESTIONS_BUCKET) {
      try {
        await env.QUESTIONS_BUCKET.delete(row.r2_key);
      } catch (e) {
        console.warn('Gagal menghapus file dari R2:', e);
      }
    }

    await env.DB.prepare('DELETE FROM question_banks WHERE name = ?').bind(name).run();

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

