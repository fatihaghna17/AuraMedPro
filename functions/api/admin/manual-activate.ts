interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  try {
    const body = await request.json() as any;
    const { userId, days = 30 } = body;

    if (!userId) {
      return Response.json({ error: 'userId wajib dikirim' }, { status: 400 });
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
      "UPDATE profiles SET subscription_status = ?, subscription_expires_at = ? WHERE id = ?"
    )
    .bind(status, expiresAtStr, userId)
    .run();

    // 2. Catat pembayaran di payments table
    const paymentId = 'pay_admin_' + crypto.randomUUID().slice(0, 8);
    await env.DB.prepare(`
      INSERT INTO payments (id, user_id, source, amount, status, created_at, paid_at, plan)
      VALUES (?, ?, 'manual_admin', 10000, 'paid', datetime('now'), datetime('now'), ?)
    `)
    .bind(paymentId, userId, isLifetime ? 'lifetime' : `${days}_days`)
    .run();

    return Response.json({ 
      success: true, 
      message: isLifetime ? 'Akun berhasil diaktifkan LIFETIME!' : `Akun berhasil diaktifkan selama ${days} hari!`,
      expiresAt: expiresAtStr,
      status: status
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
