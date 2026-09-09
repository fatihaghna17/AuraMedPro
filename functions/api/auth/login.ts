import {
  verifyPassword,
  hashPasswordPBKDF2,
  signJwt,
  createAuthCookie,
} from './_utils';

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
    const identifier = (body.identifier || body.email || body.username || '').trim();
    const password = body.password || '';

    if (!identifier || !password) {
      return new Response(JSON.stringify({ error: 'Username/email dan password wajib diisi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Support identifier berupa username atau email
    const cleanUsername = identifier.includes('@') ? identifier.split('@')[0] : identifier;
    const cleanEmail = identifier.includes('@') ? identifier : `${identifier.toLowerCase()}@ai.online`;

    // Cari user di profiles (bisa via username atau email)
    const profile = await env.DB.prepare(`
      SELECT * FROM profiles
      WHERE username = ? OR email = ? OR username = ?
      LIMIT 1
    `).bind(identifier, identifier, cleanUsername).first() as any;

    if (!profile || !profile.password_hash) {
      return new Response(JSON.stringify({ error: 'Username atau password salah' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { valid, shouldRehash } = await verifyPassword(password, profile.password_hash);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Username atau password salah' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upgrade hash bcrypt lama ke PBKDF2 secara transparan jika diperlukan
    if (shouldRehash) {
      try {
        const newPbkdf2Hash = await hashPasswordPBKDF2(password);
        await env.DB.prepare('UPDATE profiles SET password_hash = ? WHERE id = ?')
          .bind(newPbkdf2Hash, profile.id)
          .run();
        console.log(`[Auth] Password hash for user ${profile.id} upgraded to PBKDF2.`);
      } catch (rehashErr) {
        console.warn('[Auth] Gagal re-hash PBKDF2:', rehashErr);
      }
    }

    // Buat JWT Token
    const jwtSecret = env.AUTH_JWT_SECRET || 'auramedpro-jwt-secret-dev-2026-key-fixed-fallback';
    const jwt = await signJwt({ sub: profile.id, guest: false }, jwtSecret);

    // Format objek user kompatibel dengan format Supabase auth
    const userPayload = {
      id: profile.id,
      email: profile.email || cleanEmail,
      user_metadata: {
        username: profile.username,
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
      { status: 200, headers }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Terjadi kesalahan login' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
