interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  try {
    // Ambil semua transaksi yang belum dibayar
    const { results } = await env.DB.prepare(`
      SELECT p.id, p.user_id, p.amount, p.status, p.created_at, pr.username as name, pr.email, pr.angkatan, pr.prodi 
      FROM payments p
      JOIN profiles pr ON p.user_id = pr.id
      WHERE p.status = 'pending'
      ORDER BY p.created_at DESC
    `).all();

    return Response.json(results);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
