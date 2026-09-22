interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') || '').trim();

    if (!query) {
      // If empty query, return 20 latest registered users
      const { results } = await env.DB.prepare(`
        SELECT id, username, email, angkatan, prodi, subscription_status, subscription_expires_at, trial_ends_at, created_at
        FROM profiles
        ORDER BY created_at DESC
        LIMIT 20
      `).all();
      return Response.json(results);
    }

    const { results } = await env.DB.prepare(`
      SELECT id, username, email, angkatan, prodi, subscription_status, subscription_expires_at, trial_ends_at, created_at
      FROM profiles
      WHERE username LIKE ? OR email LIKE ?
      ORDER BY created_at DESC
      LIMIT 30
    `)
    .bind(`%${query}%`, `%${query}%`)
    .all();

    return Response.json(results);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
