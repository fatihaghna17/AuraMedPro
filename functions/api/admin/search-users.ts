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
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') || '').trim();

    if (!query) {
      // If empty query, return 30 latest registered/active users
      const { results } = await env.DB.prepare(`
        SELECT id, username, email, angkatan, prodi, subscription_status, subscription_expires_at, trial_ends_at, created_at
        FROM profiles
        WHERE COALESCE(is_guest, 0) = 0
        ORDER BY COALESCE(last_active, created_at) DESC
        LIMIT 30
      `).all();
      return Response.json(results || [], { headers: corsHeaders });
    }

    const { results } = await env.DB.prepare(`
      SELECT id, username, email, angkatan, prodi, subscription_status, subscription_expires_at, trial_ends_at, created_at
      FROM profiles
      WHERE LOWER(username) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?)
      ORDER BY COALESCE(last_active, created_at) DESC
      LIMIT 40
    `)
      .bind(`%${query}%`, `%${query}%`)
      .all();

    return Response.json(results || [], { headers: corsHeaders });
  } catch (err: any) {
    return Response.json(
      { error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
};
