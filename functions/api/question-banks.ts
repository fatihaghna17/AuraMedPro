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

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    let query = `
      SELECT 
        qb.id, 
        qb.name, 
        qb.user_id, 
        qb.r2_key, 
        qb.r2_url,
        CASE WHEN qb.questions_json = 'null' THEN NULL ELSE qb.questions_json END as questions_json,
        qb.created_at,
        qb.angkatan,
        p.username as uploader_username
      FROM question_banks qb
      LEFT JOIN profiles p ON qb.user_id = p.id
    `;
    const binds: any[] = [];

    if (angkatan && angkatan !== 'all') {
      query += ` WHERE (
        qb.angkatan = 'all' 
        OR qb.angkatan = ? 
        OR instr(',' || coalesce(qb.angkatan, '') || ',', ',' || ? || ',') > 0
      )`;
      binds.push(angkatan, angkatan);
    }

    query += ` ORDER BY qb.name ASC`;

    const { results } = await env.DB.prepare(query).bind(...binds).all();

    return new Response(JSON.stringify({ data: results || [] }), {
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
    const { name, user_id, r2_key, r2_url, questions_json, angkatan = 'all' } = body;

    if (!name || !user_id) {
      return new Response(JSON.stringify({ error: 'Name dan user_id wajib diisi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const id = body.id || crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO question_banks (id, name, user_id, r2_key, r2_url, questions_json, created_at, angkatan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        user_id = excluded.user_id,
        r2_key = coalesce(excluded.r2_key, question_banks.r2_key),
        r2_url = coalesce(excluded.r2_url, question_banks.r2_url),
        questions_json = coalesce(excluded.questions_json, question_banks.questions_json),
        angkatan = coalesce(excluded.angkatan, question_banks.angkatan)
    `).bind(
      id,
      name,
      user_id,
      r2_key || null,
      r2_url || null,
      questions_json && typeof questions_json === 'object' ? JSON.stringify(questions_json) : (questions_json || null),
      now,
      angkatan
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
    const { name, angkatan } = body;

    if (!name || !angkatan) {
      return new Response(JSON.stringify({ error: 'Name dan angkatan wajib diisi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    await env.DB.prepare('UPDATE question_banks SET angkatan = ? WHERE name = ?')
      .bind(angkatan, name)
      .run();

    return new Response(JSON.stringify({ success: true, name, angkatan }), {
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

