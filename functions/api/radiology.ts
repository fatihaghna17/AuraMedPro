interface Env {
  DB: D1Database;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

// GET /api/radiology?action=packets&group_id=xxx
// GET /api/radiology?action=submissions&group_id=xxx&packet_id=yyy
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const groupId = url.searchParams.get('group_id');

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  if (!groupId) {
    return new Response(JSON.stringify({ error: 'group_id dibutuhkan' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    if (action === 'packets') {
      const { results } = await env.DB.prepare(`
        SELECT id, group_id, title, description, admin_id, admin_name, questions_json, created_at
        FROM radiology_packets
        WHERE group_id = ?
        ORDER BY created_at DESC
      `).bind(groupId).all();

      const packets = (results || []).map((row: any) => ({
        ...row,
        questions: typeof row.questions_json === 'string' ? JSON.parse(row.questions_json) : row.questions_json
      }));

      return new Response(JSON.stringify({ data: packets }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'submissions') {
      const packetId = url.searchParams.get('packet_id');
      let query = `
        SELECT id, packet_id, group_id, user_id, username, answers_json, checklist_json, score, feedback, status, graded_by, graded_at, created_at
        FROM radiology_submissions
        WHERE group_id = ?
      `;
      const binds: any[] = [groupId];

      if (packetId) {
        query += ` AND packet_id = ?`;
        binds.push(packetId);
      }
      query += ` ORDER BY created_at DESC`;

      const { results } = await env.DB.prepare(query).bind(...binds).all();

      const submissions = (results || []).map((row: any) => ({
        ...row,
        answers: typeof row.answers_json === 'string' ? JSON.parse(row.answers_json) : row.answers_json,
        checklist: typeof row.checklist_json === 'string' ? JSON.parse(row.checklist_json) : (row.checklist_json || { thorax: {}, abdomen: {} })
      }));

      return new Response(JSON.stringify({ data: submissions }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Aksi tidak valid' }), {
      status: 400,
      headers: corsHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

// POST /api/radiology
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  try {
    const body = (await request.json()) as any;
    const { action } = body;

    // 1. Create packet
    if (action === 'create_packet') {
      const { packet } = body;
      if (!packet || !packet.id || !packet.group_id) {
        return new Response(JSON.stringify({ error: 'Data paket tidak valid' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      await env.DB.prepare(`
        INSERT INTO radiology_packets (id, group_id, title, description, admin_id, admin_name, questions_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          questions_json = excluded.questions_json,
          admin_id = excluded.admin_id,
          admin_name = excluded.admin_name
      `).bind(
        packet.id,
        packet.group_id,
        packet.title,
        packet.description || '',
        packet.admin_id,
        packet.admin_name || 'Admin',
        JSON.stringify(packet.questions || []),
        packet.created_at || new Date().toISOString()
      ).run();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Submit student essay answer
    if (action === 'submit_answer') {
      const { submission } = body;
      if (!submission || !submission.id || !submission.packet_id) {
        return new Response(JSON.stringify({ error: 'Data submission tidak lengkap' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      await env.DB.prepare(`
        INSERT INTO radiology_submissions (id, packet_id, group_id, user_id, username, answers_json, checklist_json, score, feedback, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          answers_json = excluded.answers_json,
          status = 'pending',
          created_at = excluded.created_at
      `).bind(
        submission.id,
        submission.packet_id,
        submission.group_id,
        submission.user_id,
        submission.username,
        JSON.stringify(submission.answers || {}),
        JSON.stringify(submission.checklist || { thorax: {}, abdomen: {} }),
        0,
        '',
        'pending',
        submission.created_at || new Date().toISOString()
      ).run();

      return new Response(JSON.stringify({ success: true, submission_id: submission.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Admin grade submission
    if (action === 'grade_submission') {
      const { submission_id, checklist, score, feedback, grader_id, grader_name, graded_at } = body;
      if (!submission_id) {
        return new Response(JSON.stringify({ error: 'submission_id dibutuhkan' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      await env.DB.prepare(`
        UPDATE radiology_submissions
        SET checklist_json = ?, score = ?, feedback = ?, status = 'graded', graded_by = ?, graded_at = ?
        WHERE id = ?
      `).bind(
        JSON.stringify(checklist || { thorax: {}, abdomen: {} }),
        score || 0,
        feedback || '',
        grader_name || grader_id || 'Admin',
        graded_at || new Date().toISOString(),
        submission_id
      ).run();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Action tidak dikenal' }), {
      status: 400,
      headers: corsHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};
