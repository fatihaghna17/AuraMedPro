interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  try {
    const body = await request.json() as any;
    const { paymentId } = body;

    if (!paymentId) {
       return Response.json({ error: 'paymentId wajib dikirim' }, { status: 400 });
    }

    // Hapus transaksi pending dari database
    await env.DB.prepare("DELETE FROM payments WHERE id = ? AND status = 'pending'")
      .bind(paymentId)
      .run();

    return Response.json({ success: true, message: 'Request berhasil dihapus!' });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
