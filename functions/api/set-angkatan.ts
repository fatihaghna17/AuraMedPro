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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json() as any;
    const { user_id, angkatan } = body;

    if (!user_id || !angkatan) {
      return new Response(JSON.stringify({ error: 'user_id dan angkatan wajib diisi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validAngkatan = ['24', '25', '26'];
    if (!validAngkatan.includes(angkatan)) {
      return new Response(JSON.stringify({ error: 'Angkatan tidak valid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trialEndsMap: Record<string, string> = {
      '24': '2026-09-14T05:00:00Z',
      '25': '2026-09-17T05:00:00Z',
      '26': '2026-09-22T05:00:00Z',
    };
    const trialEndsAt = trialEndsMap[String(angkatan)] || '2026-09-14T05:00:00Z';

    await env.DB.prepare(`
      UPDATE profiles 
      SET angkatan = ?,
          trial_ends_at = CASE 
            WHEN subscription_status = 'trial' OR subscription_status IS NULL 
            THEN ? 
            ELSE trial_ends_at 
          END
      WHERE id = ?
    `).bind(angkatan, trialEndsAt, user_id).run();

    return new Response(JSON.stringify({ success: true, message: 'Angkatan berhasil diupdate' }), {
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
