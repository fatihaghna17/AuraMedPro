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

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(days));

    // 1. Update status subscription di profiles
    await env.DB.prepare(
      "UPDATE profiles SET subscription_status = 'active', subscription_expires_at = ? WHERE id = ?"
    )
    .bind(expiresAt.toISOString(), userId)
    .run();

    // 2. Catat pembayaran di payments table
    const paymentId = 'pay_admin_' + crypto.randomUUID().slice(0, 8);
    await env.DB.prepare(`
      INSERT INTO payments (id, user_id, source, amount, status, created_at, paid_at, plan)
      VALUES (?, ?, 'manual_admin', 10000, 'paid', datetime('now'), datetime('now'), ?)
    `)
    .bind(paymentId, userId, `${days}_days`)
    .run();

    return Response.json({ 
      success: true, 
      message: `Akun berhasil diaktifkan selama ${days} hari!`,
      expiresAt: expiresAt.toISOString()
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
