interface Env {
  DB: D1Database;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  try {
    const nowIso = new Date().toISOString();

    // 1. Bersihkan otomatis request pending yang sudah usang dari akun yang SUDAH aktif / lifetime / admin
    await env.DB.prepare(`
      DELETE FROM payments
      WHERE status = 'pending'
        AND user_id IN (
          SELECT id FROM profiles
          WHERE subscription_status = 'lifetime'
             OR (subscription_status = 'active' AND subscription_expires_at > ?)
             OR role IN ('admin', 'super_admin', 'collector')
             OR LOWER(username) IN ('admin', 'fatih17', 'jidan', 'faza', 'nao')
        )
    `)
      .bind(nowIso)
      .run()
      .catch(() => {});

    // 2. Ambil semua transaksi pending, dikelompokkan per user_id (ambil request terbaru per user agar tidak duplikat)
    const { results } = await env.DB.prepare(`
      SELECT 
        p.id,
        p.user_id,
        p.amount,
        p.status,
        MAX(p.created_at) as created_at,
        pr.username as name,
        pr.email,
        pr.angkatan,
        pr.prodi,
        pr.subscription_status,
        pr.subscription_expires_at
      FROM payments p
      JOIN profiles pr ON p.user_id = pr.id
      WHERE p.status = 'pending'
      GROUP BY p.user_id
      ORDER BY MAX(p.created_at) DESC
    `).all();

    return Response.json(results || [], { headers: corsHeaders });
  } catch (err: any) {
    return Response.json(
      { error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
};
