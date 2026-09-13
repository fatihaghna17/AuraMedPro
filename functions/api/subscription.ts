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
  const userId = url.searchParams.get('user_id');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'user_id wajib diisi' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const profile = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?')
      .bind(userId)
      .first<any>();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profil tidak ditemukan' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    let status = 'expired';
    let canAccess = false;
    const trialEndsMap: Record<string, string> = {
      '24': '2026-09-14T05:00:00Z',
      '25': '2026-09-17T05:00:00Z',
      '26': '2026-09-22T05:00:00Z',
    };
    let trialEndsAt = profile.trial_ends_at || trialEndsMap[String(profile.angkatan)] || '2026-09-14T05:00:00Z';
    let subscriptionExpiresAt = profile.subscription_expires_at;

    if (profile.role === 'admin' || profile.role === 'super_admin' || profile.role === 'collector') {
      status = 'active';
      canAccess = true;
    } else if (profile.subscription_status === 'active' && profile.subscription_expires_at) {
      if (new Date(profile.subscription_expires_at) > now) {
        status = 'active';
        canAccess = true;
      }
    } else if (profile.subscription_status === 'trial' || !profile.subscription_status) {
      if (profile.trial_ends_at && new Date(profile.trial_ends_at) > now) {
        status = 'trial';
      } else {
        status = 'trial_extended';
      }
      canAccess = true;
    }

    const payload = {
      status,
      canAccess,
      trialEndsAt,
      subscriptionExpiresAt
    };

    return new Response(JSON.stringify({
      data: payload,
      ...payload
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
