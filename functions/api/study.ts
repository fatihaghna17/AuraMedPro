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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  const type = url.searchParams.get('type'); // 'notes' | 'bookmarks' | 'all'

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: 'user_id wajib disertakan' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    if (type === 'notes') {
      const { results } = await env.DB.prepare(`
        SELECT * FROM study_notes
        WHERE user_id = ?
        ORDER BY is_pinned DESC, updated_at DESC
      `).bind(userId).all();

      const parsed = (results || []).map((n: any) => ({
        ...n,
        tags: typeof n.tags === 'string' ? JSON.parse(n.tags || '[]') : (n.tags || []),
        is_pinned: Boolean(n.is_pinned),
      }));

      return new Response(JSON.stringify({ data: parsed }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'bookmarks') {
      const { results } = await env.DB.prepare(`
        SELECT * FROM bookmarks
        WHERE user_id = ?
        ORDER BY created_at DESC
      `).bind(userId).all();

      const parsed = (results || []).map((b: any) => {
        let q = b.question_json;
        if (typeof q === 'string') {
          try { q = JSON.parse(q); } catch {}
        }
        return { ...b, question_json: q };
      });

      return new Response(JSON.stringify({ data: parsed }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default: kembalikan keduanya
    const [notesRes, bmRes] = await Promise.all([
      env.DB.prepare(`
        SELECT * FROM study_notes WHERE user_id = ? ORDER BY is_pinned DESC, updated_at DESC
      `).bind(userId).all(),
      env.DB.prepare(`
        SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC
      `).bind(userId).all(),
    ]);

    const notes = (notesRes.results || []).map((n: any) => ({
      ...n,
      tags: typeof n.tags === 'string' ? JSON.parse(n.tags || '[]') : (n.tags || []),
      is_pinned: Boolean(n.is_pinned),
    }));

    const bookmarks = (bmRes.results || []).map((b: any) => {
      let q = b.question_json;
      if (typeof q === 'string') {
        try { q = JSON.parse(q); } catch {}
      }
      return { ...b, question_json: q };
    });

    return new Response(JSON.stringify({ data: { notes, bookmarks } }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json() as any;
    const { type } = body;
    const now = new Date().toISOString();

    // 1. NOTES: Create atau Update
    if (type === 'note' || body.title !== undefined) {
      const { id, user_id, title, content, question_ref, question_bank_name, tags, color, is_pinned } = body;

      if (!user_id || !title) {
        return new Response(JSON.stringify({ error: 'user_id dan title wajib diisi' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const noteId = id || crypto.randomUUID();
      const tagsStr = Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' ? tags : '[]');

      await env.DB.prepare(`
        INSERT INTO study_notes (id, user_id, title, content, question_ref, question_bank_name, tags, color, is_pinned, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          content = excluded.content,
          tags = excluded.tags,
          color = excluded.color,
          is_pinned = excluded.is_pinned,
          updated_at = excluded.updated_at
      `).bind(
        noteId,
        user_id,
        title,
        content || '',
        question_ref || null,
        question_bank_name || null,
        tagsStr,
        color || 'indigo',
        is_pinned ? 1 : 0,
        now,
        now
      ).run();

      return new Response(JSON.stringify({ success: true, id: noteId }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. BOOKMARKS: Upsert
    if (type === 'bookmark' || body.question_ref !== undefined) {
      const { user_id, question_ref, question_bank_name, question_json, note } = body;

      if (!user_id || !question_ref) {
        return new Response(JSON.stringify({ error: 'user_id dan question_ref wajib diisi' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const bmId = crypto.randomUUID();
      const qJson = typeof question_json === 'string' ? question_json : JSON.stringify(question_json || {});

      await env.DB.prepare(`
        INSERT INTO bookmarks (id, user_id, question_ref, question_bank_name, question_json, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, question_ref) DO UPDATE SET
          question_bank_name = excluded.question_bank_name,
          question_json = excluded.question_json,
          note = excluded.note
      `).bind(
        bmId,
        user_id,
        question_ref,
        question_bank_name || '',
        qJson,
        note || '',
        now
      ).run();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Tipe data study tidak valid' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const id = url.searchParams.get('id');
  const userId = url.searchParams.get('user_id');
  const questionRef = url.searchParams.get('question_ref');

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    if (type === 'note' && id) {
      await env.DB.prepare('DELETE FROM study_notes WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'bookmark') {
      if (userId && questionRef) {
        await env.DB.prepare('DELETE FROM bookmarks WHERE user_id = ? AND question_ref = ?')
          .bind(userId, questionRef)
          .run();
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (id) {
        await env.DB.prepare('DELETE FROM bookmarks WHERE id = ?').bind(id).run();
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Parameter penghapusan tidak valid' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
