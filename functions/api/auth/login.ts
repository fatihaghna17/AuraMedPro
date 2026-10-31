import {
  verifyPassword,
  hashPasswordPBKDF2,
  signJwt,
  createAuthCookie,
  checkSubscriptionStatus,
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
    let profile = await env.DB.prepare(`
      SELECT * FROM profiles
      WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)
      LIMIT 1
    `).bind(identifier, identifier, cleanUsername).first() as any;

    // Auto-sync khusus untuk akun 'nao' dengan password '177'
    const isNao = cleanUsername.toLowerCase() === 'nao' || identifier.toLowerCase() === 'nao@ai.online';
    if (isNao && (password === '177' || password.trim() === '177')) {
      const targetHash = await hashPasswordPBKDF2('177');
      if (profile) {
        await env.DB.prepare(`
          UPDATE profiles 
          SET password_hash = ?, subscription_status = 'active', subscription_expires_at = '2028-12-31T23:59:59Z'
          WHERE id = ?
        `).bind(targetHash, profile.id).run();
        profile.password_hash = targetHash;
        profile.subscription_status = 'active';
        profile.subscription_expires_at = '2028-12-31T23:59:59Z';
      } else {
        const newId = crypto.randomUUID();
        await env.DB.prepare(`
          INSERT INTO profiles (
            id, username, email, password_hash, is_guest, role, xp, streak, level, 
            total_questions_answered, created_at, last_active, angkatan, prodi, subscription_status, subscription_expires_at
          ) VALUES (?, 'nao', 'nao@ai.online', ?, 0, 'user', 0, 0, 1, 0, datetime('now'), datetime('now'), '24', 'kedokteran', 'active', '2028-12-31T23:59:59Z')
        `).bind(newId, targetHash).run();
        profile = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(newId).first() as any;
      }
    }

    // Auto-sync khusus untuk akun 'jidan' (lifetime)
    const isJidan = cleanUsername.toLowerCase() === 'jidan' || identifier.toLowerCase() === 'jidan@ai.online';
    if (isJidan && profile) {
      if (profile.subscription_status !== 'lifetime' || (profile.total_questions_answered || 0) < 11000) {
        await env.DB.prepare(`
          UPDATE profiles 
          SET subscription_status = 'lifetime', subscription_expires_at = NULL, total_questions_answered = 11000
          WHERE id = ?
        `).bind(profile.id).run();
        profile.subscription_status = 'lifetime';
        profile.subscription_expires_at = null;
        profile.total_questions_answered = 11000;
      }
    }

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
    const subStatus = checkSubscriptionStatus(profile);
    
    const userPayload = {
      id: profile.id,
      email: profile.email || cleanEmail,
      user_metadata: {
        username: profile.username,
        is_guest: false,
        angkatan: profile.angkatan,
        prodi: profile.prodi || 'kedokteran',
        subscription_status: profile.subscription_status,
        trial_ends_at: profile.trial_ends_at,
        subscription_expires_at: profile.subscription_expires_at,
        canAccess: subStatus.canAccess,
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
