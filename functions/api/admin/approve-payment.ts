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
    const { paymentId, userId, days = 30 } = body;

    if (!paymentId && !userId) {
      return Response.json(
        { error: 'paymentId atau userId wajib dikirim' },
        { status: 400, headers: corsHeaders }
      );
    }

    let targetUserId = userId;
    if (!targetUserId && paymentId) {
      const paymentRow = await env.DB.prepare('SELECT user_id FROM payments WHERE id = ?')
        .bind(paymentId)
        .first<{ user_id: string }>();
      targetUserId = paymentRow?.user_id;
    }

    if (!targetUserId) {
      return Response.json(
        { error: 'User tidak ditemukan untuk transaksi ini' },
        { status: 404, headers: corsHeaders }
      );
    }

    // 1. Ubah status payment yang disetujui menjadi paid
    if (paymentId) {
      await env.DB.prepare("UPDATE payments SET status = 'paid', paid_at = datetime('now') WHERE id = ?")
        .bind(paymentId)
        .run();
    }

    // 2. Bersihkan sisa request pending duplikat milik user yang sama agar tidak menumpuk di dashboard admin
    await env.DB.prepare("DELETE FROM payments WHERE user_id = ? AND status = 'pending'")
      .bind(targetUserId)
      .run();

    // 3. Aktifkan langganan user (tambah durasi, default 30 hari)
    const isLifetime = days === 'lifetime' || days === 'unlimited' || Number(days) >= 99999;
    let expiresAtStr: string | null = null;
    let status = 'active';

    if (isLifetime) {
      status = 'lifetime';
      expiresAtStr = null;
    } else {
      const durationDays = Number(days) > 0 ? Number(days) : 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);
      expiresAtStr = expiresAt.toISOString();
    }

    await env.DB.prepare(
      'UPDATE profiles SET subscription_status = ?, subscription_expires_at = ? WHERE id = ?'
    )
      .bind(status, expiresAtStr, targetUserId)
      .run();

    return Response.json(
      {
        success: true,
        message: 'Berhasil disetujui dan akun telah diaktifkan!',
        userId: targetUserId,
        status,
        expiresAt: expiresAtStr,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return Response.json(
      { error: err.message || 'Gagal menyetujui pembayaran' },
      { status: 500, headers: corsHeaders }
    );
  }
};
