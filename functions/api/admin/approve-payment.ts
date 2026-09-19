interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  try {
    const body = await request.json() as any;
    const { paymentId, userId } = body;

    if (!paymentId || !userId) {
       return Response.json({ error: 'paymentId dan userId wajib dikirim' }, { status: 400 });
    }

    // 1. Ubah status payment jadi paid
    await env.DB.prepare("UPDATE payments SET status = 'paid', paid_at = datetime('now') WHERE id = ?")
      .bind(paymentId)
      .run();

    // 2. Aktifkan langganan user (tambah 1 bulan)
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setDate(oneMonthFromNow.getDate() + 30);

    await env.DB.prepare(
      "UPDATE profiles SET subscription_status = 'active', subscription_expires_at = ? WHERE id = ?"
    )
    .bind(oneMonthFromNow.toISOString(), userId)
    .run();

    return Response.json({ success: true, message: 'Berhasil disetujui!' });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
