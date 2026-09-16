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
    const { user_id, angkatan, prodi } = body;

    if (!user_id || !angkatan) {
      return new Response(JSON.stringify({ error: 'user_id dan angkatan wajib diisi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ambil profil saat ini jika prodi tidak dikirim
    let effectiveProdi = prodi;
    if (!effectiveProdi) {
      const existing = await env.DB.prepare('SELECT prodi FROM profiles WHERE id = ?').bind(user_id).first() as any;
      effectiveProdi = existing?.prodi || 'kedokteran';
    }
    effectiveProdi = String(effectiveProdi).toLowerCase().trim();

    if (effectiveProdi === 'farmasi') {
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

    const trialEndsMap: Record<string, string> = {
      '23': '2026-09-14T05:00:00Z',
      '24': '2026-09-14T05:00:00Z',
      '25': '2026-09-17T05:00:00Z',
      '26': '2026-09-22T05:00:00Z',
    };
    const trialEndsAt = trialEndsMap[String(angkatan)] || '2026-09-14T05:00:00Z';

    await env.DB.prepare(`
      UPDATE profiles 
      SET angkatan = ?,
          prodi = coalesce(?, prodi, 'kedokteran'),
          trial_ends_at = CASE 
            WHEN subscription_status = 'trial' OR subscription_status IS NULL 
            THEN ? 
            ELSE trial_ends_at 
          END
      WHERE id = ?
    `).bind(angkatan, prodi || null, trialEndsAt, user_id).run();

    return new Response(JSON.stringify({ success: true, message: 'Angkatan & Prodi berhasil diupdate', prodi: effectiveProdi, angkatan }), {
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
