interface Env {
  DB: D1Database;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

// GET /api/study-groups/:id
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const groupId = params.id as string;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), { status: 500, headers: corsHeaders });
  }

  try {
    const group: any = await env.DB.prepare(`
      SELECT sg.id, sg.name, sg.description, sg.invite_code, sg.creator_id, sg.created_at, p.username as creator_name
      FROM study_groups sg
      LEFT JOIN profiles p ON sg.creator_id = p.id
      WHERE sg.id = ?
    `).bind(groupId).first();

    if (!group) {
      return new Response(JSON.stringify({ error: 'Grup tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }

    const { results: members } = await env.DB.prepare(`
      SELECT sgm.user_id, sgm.joined_at, p.username
      FROM study_group_members sgm
      LEFT JOIN profiles p ON sgm.user_id = p.id
      WHERE sgm.group_id = ?
      ORDER BY sgm.joined_at ASC
    `).bind(groupId).all();

    return new Response(JSON.stringify({ group, members: members || [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};
