interface Env {
  DB: D1Database;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const username = url.searchParams.get('username');

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    if (id) {
      const profile = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(id).first();
      return new Response(JSON.stringify({ data: profile || null }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (username) {
      const profile = await env.DB.prepare('SELECT * FROM profiles WHERE username = ?').bind(username).first();
      return new Response(JSON.stringify({ data: profile || null }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Default: list profiles
    const { results } = await env.DB.prepare('SELECT * FROM profiles ORDER BY xp DESC LIMIT 100').all();
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
    const { id, username, role, xp, streak, level, total_questions_answered, last_active } = body;

    if (!id || !username) {
      return new Response(JSON.stringify({ error: 'ID dan username wajib diisi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO profiles (id, username, role, xp, streak, level, total_questions_answered, last_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username = coalesce(excluded.username, profiles.username),
        role = coalesce(excluded.role, profiles.role),
        xp = coalesce(excluded.xp, profiles.xp),
        streak = coalesce(excluded.streak, profiles.streak),
        level = coalesce(excluded.level, profiles.level),
        total_questions_answered = coalesce(excluded.total_questions_answered, profiles.total_questions_answered),
        last_active = excluded.last_active
    `).bind(
      id,
      username,
      role || 'user',
      xp !== undefined ? xp : 0,
      streak !== undefined ? streak : 0,
      level !== undefined ? level : 1,
      total_questions_answered !== undefined ? total_questions_answered : 0,
      last_active || now,
      now
    ).run();

    const saved = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(id).first();

    return new Response(JSON.stringify({ data: saved }), {
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
