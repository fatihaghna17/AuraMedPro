import { signJwt, createAuthCookie } from './_utils';

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
    let customUsername = '';
    try {
      const body = await request.json() as any;
      if (body?.username) customUsername = String(body.username).trim();
    } catch {
      // Body kosong diperbolehkan untuk guest
    }

    const guestId = crypto.randomUUID();
    const hex = crypto.randomUUID().replace(/-/g, '').slice(0, 6);
    const username = customUsername || `tamu-${hex}`;
    const email = `${username}@ai.online`;
    const now = new Date().toISOString();

    // Buat profil guest di D1
    await env.DB.prepare(`
      INSERT INTO profiles (id, username, role, xp, streak, level, total_questions_answered, is_guest, email, last_active, created_at)
      VALUES (?, ?, 'user', 0, 0, 1, 0, 1, ?, ?, ?)
    `).bind(guestId, username, email, now, now).run();

    const jwtSecret = env.AUTH_JWT_SECRET || 'auramedpro-jwt-secret-dev-2026-key-fixed-fallback';
    const jwt = await signJwt({ sub: guestId, guest: true }, jwtSecret);

    const userPayload = {
      id: guestId,
      email,
      user_metadata: {
        username,
        is_guest: true,
      },
      is_anonymous: true,
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
      { status: 200, headers }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Gagal membuat akun guest' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
