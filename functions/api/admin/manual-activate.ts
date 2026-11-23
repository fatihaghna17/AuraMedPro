interface Env {
  DB: D1Database;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  try {
    const body = (await request.json()) as any;
    const { userId, days = 30 } = body;

    if (!userId) {
      return Response.json(
        { error: 'userId wajib dikirim' },
        { status: 400, headers: corsHeaders }
      );
    }

    const isLifetime = days === 'lifetime' || days === 'unlimited' || Number(days) >= 99999;
    let expiresAtStr: string | null = null;
    let status = 'active';

    if (isLifetime) {
      status = 'lifetime';
      expiresAtStr = null;
    } else {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(days));
      expiresAtStr = expiresAt.toISOString();
    }

    // 1. Update status subscription di profiles
    await env.DB.prepare(
      'UPDATE profiles SET subscription_status = ?, subscription_expires_at = ? WHERE id = ?'
    )
      .bind(status, expiresAtStr, userId)
      .run();

    // 2. Bersihkan seluruh request pending milik user ini agar tidak nyangkut di tab Permintaan Pending
    await env.DB.prepare("DELETE FROM payments WHERE user_id = ? AND status = 'pending'")
      .bind(userId)
      .run();

    // 3. Catat pembayaran di payments table
    const paymentId = 'pay_admin_' + crypto.randomUUID().slice(0, 8);
    await env.DB.prepare(`
      INSERT INTO payments (id, user_id, source, amount, status, created_at, paid_at, plan)
      VALUES (?, ?, 'manual_admin', 10000, 'paid', datetime('now'), datetime('now'), ?)
    `)
      .bind(paymentId, userId, isLifetime ? 'lifetime' : `${days}_days`)
      .run();

    return Response.json(
      {
        success: true,
        message: isLifetime
          ? 'Akun berhasil diaktifkan LIFETIME!'
          : `Akun berhasil diaktifkan selama ${days} hari!`,
        expiresAt: expiresAtStr,
        status: status,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return Response.json(
      { error: err.message || 'Gagal mengaktifkan akun' },
      { status: 500, headers: corsHeaders }
    );
  }
};
