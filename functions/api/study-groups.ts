interface Env {
  DB: D1Database;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

// GET /api/study-groups?user_id=123
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), { status: 500, headers: corsHeaders });
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: 'user_id dibutuhkan' }), { status: 400, headers: corsHeaders });
  }

  try {
    // Get groups the user is a member of
    const query = `
      SELECT sg.id, sg.name, sg.description, sg.invite_code, sg.creator_id, sg.created_at, p.username as creator_name
      FROM study_groups sg
      JOIN study_group_members sgm ON sg.id = sgm.group_id
      LEFT JOIN profiles p ON sg.creator_id = p.id
      WHERE sgm.user_id = ?
      ORDER BY sg.created_at DESC
    `;
    const { results } = await env.DB.prepare(query).bind(userId).all();

    return new Response(JSON.stringify({ data: results || [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};

// POST /api/study-groups
// Body: { action: 'create', name, description, user_id }
// OR { action: 'join', invite_code, user_id }
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), { status: 500, headers: corsHeaders });
  }

  try {
    const body = await request.json() as any;
    const { action, user_id } = body;

    if (!action || !user_id) {
      return new Response(JSON.stringify({ error: 'action dan user_id dibutuhkan' }), { status: 400, headers: corsHeaders });
    }

    if (action === 'create') {
      const { name, description } = body;
      if (!name) return new Response(JSON.stringify({ error: 'name dibutuhkan' }), { status: 400, headers: corsHeaders });

      const id = crypto.randomUUID();
      // Generate a simple 6-character alphanumeric invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const now = new Date().toISOString();

      // Create group
      await env.DB.prepare(`
        INSERT INTO study_groups (id, name, description, invite_code, creator_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(id, name, description || null, inviteCode, user_id, now).run();

      // Add creator as member
      await env.DB.prepare(`
        INSERT INTO study_group_members (group_id, user_id, joined_at)
        VALUES (?, ?, ?)
      `).bind(id, user_id, now).run();

      return new Response(JSON.stringify({ success: true, id, invite_code: inviteCode }), { status: 200, headers: corsHeaders });
    } 
    else if (action === 'join') {
      const { invite_code } = body;
      if (!invite_code) return new Response(JSON.stringify({ error: 'invite_code dibutuhkan' }), { status: 400, headers: corsHeaders });

      // Find group
      const group: any = await env.DB.prepare(`SELECT id, name FROM study_groups WHERE invite_code = ?`).bind(invite_code).first();
      if (!group) {
        return new Response(JSON.stringify({ error: 'Kode undangan tidak valid' }), { status: 404, headers: corsHeaders });
      }

      // Check if already member
      const member: any = await env.DB.prepare(`SELECT * FROM study_group_members WHERE group_id = ? AND user_id = ?`).bind(group.id, user_id).first();
      if (member) {
        return new Response(JSON.stringify({ success: true, message: 'Sudah menjadi anggota', group_id: group.id, name: group.name }), { status: 200, headers: corsHeaders });
      }

      const now = new Date().toISOString();
      await env.DB.prepare(`
        INSERT INTO study_group_members (group_id, user_id, joined_at)
        VALUES (?, ?, ?)
      `).bind(group.id, user_id, now).run();

      return new Response(JSON.stringify({ success: true, group_id: group.id, name: group.name }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'action tidak valid' }), { status: 400, headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};
