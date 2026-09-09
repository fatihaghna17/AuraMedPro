import { hashPasswordPBKDF2, signJwt, createAuthCookie } from './_utils';

interface Env {
  DB: D1Database;
  AUTH_JWT_SECRET?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json() as any;
    const username = (body.username || '').trim();
    const password = body.password || '';
    const email = (body.email || `${username.toLowerCase()}@ai.online`).trim();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username dan password wajib diisi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (password.length < 3) {
      return new Response(JSON.stringify({ error: 'Password minimal 3 karakter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cek username unik
    const existing = await env.DB.prepare('SELECT id FROM profiles WHERE username = ?')
      .bind(username)
      .first();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Username sudah digunakan' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = crypto.randomUUID();
    const passwordHash = await hashPasswordPBKDF2(password);
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO profiles (id, username, email, password_hash, is_guest, role, xp, streak, level, total_questions_answered, created_at, last_active)
      VALUES (?, ?, ?, ?, 0, 'user', 0, 0, 1, 0, ?, ?)
    `).bind(userId, username, email, passwordHash, now, now).run();

    const jwtSecret = env.AUTH_JWT_SECRET || 'auramedpro-jwt-secret-dev-2026-key-fixed-fallback';
    const jwt = await signJwt({ sub: userId, guest: false }, jwtSecret);

    const userPayload = {
      id: userId,
      email,
      user_metadata: {
        username,
        is_guest: false,
      },
      is_anonymous: false,
    };

    const cookieHeader = createAuthCookie(jwt);

    const headers = new Headers({
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Set-Cookie': cookieHeader,
    });

    return new Response(
      JSON.stringify({
        data: {
          user: userPayload,
          session: {
            user: userPayload,
            access_token: jwt,
          },
        },
      }),
      { status: 201, headers }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Gagal mendaftar' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
