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
    const { results } = await env.DB.prepare(`
      SELECT * FROM srs_cards
      WHERE user_id = ?
      ORDER BY next_review_date ASC
    `).bind(userId).all();

    // Parse question_json jika tersimpan sebagai string JSON
    const parsed = (results || []).map((row: any) => {
      let q = row.question_json;
      if (typeof q === 'string') {
        try {
          q = JSON.parse(q);
        } catch {}
      }
      return { ...row, question_json: q };
    });

    return new Response(JSON.stringify({ data: parsed }), {
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
    const now = new Date().toISOString();

    // 1. Batch upsert kartu salah (dari addWrongAnswers)
    if (Array.isArray(body)) {
      const statements: D1PreparedStatement[] = [];
      for (const card of body) {
        const id = card.id || crypto.randomUUID();
        const qJson = typeof card.question_json === 'string' ? card.question_json : JSON.stringify(card.question_json);
        statements.push(
          env.DB.prepare(`
            INSERT INTO srs_cards (
              id, user_id, question_ref, question_bank_name, question_json,
              ease_factor, interval_days, repetitions, next_review_date,
              total_reviews, correct_reviews, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, question_ref) DO UPDATE SET
              question_bank_name = excluded.question_bank_name,
              question_json = excluded.question_json,
              updated_at = excluded.updated_at
          `).bind(
            id,
            card.user_id,
            card.question_ref,
            card.question_bank_name || null,
            qJson,
            card.ease_factor || 2.5,
            card.interval_days || 1,
            card.repetitions || 0,
            card.next_review_date || now,
            card.total_reviews || 0,
            card.correct_reviews || 0,
            card.created_at || now,
            now
          )
        );
      }

      if (statements.length > 0) {
        await env.DB.batch(statements);
      }

      return new Response(JSON.stringify({ success: true, count: statements.length }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Update rating kartu tunggal (dari submitRating)
    if (body.id) {
      const {
        id,
        ease_factor,
        interval_days,
        repetitions,
        next_review_date,
        total_reviews,
        correct_reviews,
      } = body;

      await env.DB.prepare(`
        UPDATE srs_cards
        SET ease_factor = coalesce(?, ease_factor),
            interval_days = coalesce(?, interval_days),
            repetitions = coalesce(?, repetitions),
            next_review_date = coalesce(?, next_review_date),
            total_reviews = coalesce(?, total_reviews),
            correct_reviews = coalesce(?, correct_reviews),
            updated_at = ?
        WHERE id = ?
      `).bind(
        ease_factor ?? null,
        interval_days ?? null,
        repetitions ?? null,
        next_review_date ?? null,
        total_reviews ?? null,
        correct_reviews ?? null,
        now,
        id
      ).run();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Format data SRS tidak valid' }), {
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
  const id = url.searchParams.get('id');

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!id) {
    return new Response(JSON.stringify({ error: 'id kartu wajib disertakan' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    await env.DB.prepare('DELETE FROM srs_cards WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), {
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
