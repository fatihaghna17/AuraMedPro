import { hashPasswordPBKDF2, signJwt, createAuthCookie,
  checkSubscriptionStatus, generatePassword } from './_utils';

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
    const angkatan = body.angkatan;
    const prodi = (body.prodi || 'kedokteran').toLowerCase().trim();

    if (!username || !angkatan) {
      return new Response(JSON.stringify({ error: 'Username dan angkatan wajib diisi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['kedokteran', 'farmasi', 'kebidanan'].includes(prodi)) {
      return new Response(JSON.stringify({ error: 'Program studi tidak valid (harus kedokteran, farmasi, atau kebidanan)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (prodi === 'farmasi') {
      if (!['23', '24'].includes(String(angkatan))) {
        return new Response(JSON.stringify({ error: 'Angkatan untuk Farmasi harus 23 atau 24' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      if (!['24', '25', '26'].includes(String(angkatan))) {
        return new Response(JSON.stringify({ error: 'Angkatan tidak valid (harus 24, 25, atau 26)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Cek apakah username / nama panggilan sudah ada
    let finalUsername = username;
    const existing = await env.DB.prepare('SELECT id FROM profiles WHERE LOWER(username) = LOWER(?)')
      .bind(finalUsername)
      .first();

    if (existing) {
      // Ada nama yang sama: berikan angkatan untuk membedakannya
      finalUsername = `${username} (${angkatan})`;
      let checkAgain = await env.DB.prepare('SELECT id FROM profiles WHERE LOWER(username) = LOWER(?)')
        .bind(finalUsername)
        .first();
      let counter = 2;
      while (checkAgain) {
        finalUsername = `${username} (${angkatan}) ${counter}`;
        checkAgain = await env.DB.prepare('SELECT id FROM profiles WHERE LOWER(username) = LOWER(?)')
          .bind(finalUsername)
          .first();
        counter++;
      }
    }

    const cleanEmailUser = finalUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const email = (body.email || `${cleanEmailUser || 'user'}@ai.online`).trim();

    const userId = crypto.randomUUID();
    const password = generatePassword();
    const passwordHash = await hashPasswordPBKDF2(password);
    const now = new Date().toISOString();
    
    // Batas masa trial berbeda per angkatan (pukul 12.00 WIB / 05.00 UTC):
    // Angkatan 23 & 24: 14 September 2026
    // Angkatan 25: 17 September 2026
    // Angkatan 26: Diperpanjang sampai waktu belum ditentukan (null)
    const trialEndsMap: Record<string, string | null> = {
      '23': '2026-09-14T05:00:00Z',
      '24': '2026-09-14T05:00:00Z',
      '25': '2026-09-17T05:00:00Z',
      '26': null,
    };
    const trialEndsAt = String(angkatan) === '26' ? null : (trialEndsMap[String(angkatan)] || '2026-09-14T05:00:00Z');

    await env.DB.prepare(`
      INSERT INTO profiles (id, username, email, password_hash, is_guest, role, xp, streak, level, total_questions_answered, created_at, last_active, angkatan, prodi, subscription_status, trial_ends_at)
      VALUES (?, ?, ?, ?, 0, 'user', 0, 0, 1, 0, ?, ?, ?, ?, 'trial', ?)
    `).bind(userId, finalUsername, email, passwordHash, now, now, String(angkatan), prodi, trialEndsAt).run();

    const jwtSecret = env.AUTH_JWT_SECRET || 'auramedpro-jwt-secret-dev-2026-key-fixed-fallback';
    const jwt = await signJwt({ sub: userId, guest: false }, jwtSecret);

    const profileForCheck = {
      role: 'user',
      username: finalUsername,
      prodi: prodi,
      angkatan: String(angkatan),
      subscription_status: 'trial',
      trial_ends_at: trialEndsAt
    };
    const subStatus = checkSubscriptionStatus(profileForCheck);

    const userPayload = {
      id: userId,
      email,
      user_metadata: {
        username: finalUsername,
        is_guest: false,
        angkatan: String(angkatan),
        prodi,
        subscription_status: 'trial',
        trial_ends_at: trialEndsAt,
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
          generated_password: password,
          username: finalUsername,
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
