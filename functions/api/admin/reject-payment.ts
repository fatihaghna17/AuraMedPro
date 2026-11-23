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
    const { paymentId, userId } = body;

    if (!paymentId && !userId) {
      return Response.json(
        { error: 'paymentId atau userId wajib dikirim' },
        { status: 400, headers: corsHeaders }
      );
    }

    let targetUserId = userId;
    if (!targetUserId && paymentId) {
      const row = await env.DB.prepare('SELECT user_id FROM payments WHERE id = ?')
        .bind(paymentId)
        .first<{ user_id: string }>();
      targetUserId = row?.user_id;
    }

    if (paymentId) {
      await env.DB.prepare("DELETE FROM payments WHERE id = ? AND status = 'pending'")
        .bind(paymentId)
        .run();
    }

    // Hapus juga duplikat transaksi pending dari user yang sama agar tidak menumpuk
    if (targetUserId) {
      await env.DB.prepare("DELETE FROM payments WHERE user_id = ? AND status = 'pending'")
        .bind(targetUserId)
        .run();
    }

    return Response.json(
      { success: true, message: 'Request berhasil dihapus!', userId: targetUserId },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return Response.json(
      { error: err.message || 'Gagal menghapus request' },
      { status: 500, headers: corsHeaders }
    );
  }
};
