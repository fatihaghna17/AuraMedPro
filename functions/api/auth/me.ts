import {
  extractAuthToken,
  verifyJwt,
  signJwt,
  shouldRefreshJwt,
  createAuthCookie,
} from './_utils';

interface Env {
  DB: D1Database;
  AUTH_JWT_SECRET?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const token = extractAuthToken(request);
  if (!token) {
    return new Response(JSON.stringify({ data: { user: null, session: null } }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const jwtSecret = env.AUTH_JWT_SECRET || 'auramedpro-jwt-secret-dev-2026-key-fixed-fallback';
  const payload = await verifyJwt(token, jwtSecret);

  if (!payload || !payload.sub) {
    return new Response(JSON.stringify({ data: { user: null, session: null } }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const profile = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?')
      .bind(payload.sub)
      .first() as any;

    if (!profile) {
      return new Response(JSON.stringify({ data: { user: null, session: null } }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isGuest = Boolean(profile.is_guest || payload.guest);
    const userPayload = {
      id: profile.id,
      email: profile.email || `${profile.username}@ai.online`,
      user_metadata: {
        username: profile.username,
        is_guest: isGuest,
      },
      is_anonymous: isGuest,
      profile: {
        id: profile.id,
        username: profile.username,
        role: profile.role || 'user',
        xp: profile.xp || 0,
        streak: profile.streak || 0,
        level: profile.level || 1,
        total_questions_answered: profile.total_questions_answered || 0,
        active_session_id: profile.active_session_id || null,
        last_active: profile.last_active,
      },
    };

    const headers = new Headers({
      ...corsHeaders,
      'Content-Type': 'application/json',
    });

    // Rolling refresh jika tersisa < 15 hari
    if (shouldRefreshJwt(payload)) {
      const refreshedToken = await signJwt({ sub: payload.sub, guest: isGuest }, jwtSecret);
      headers.set('Set-Cookie', createAuthCookie(refreshedToken));
    }

    return new Response(
      JSON.stringify({
        data: {
          user: userPayload,
          session: {
            user: userPayload,
            access_token: token,
          },
        },
      }),
      { status: 200, headers }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
