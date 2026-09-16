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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'global';
  const filter = url.searchParams.get('filter') || 'all';
  const fileName = url.searchParams.get('file_name');
  const angkatan = url.searchParams.get('angkatan');
  const prodi = url.searchParams.get('prodi');

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    if (type === 'global') {
      if (filter === 'all') {
        let query = `
          SELECT id, username, total_questions_answered, level, angkatan, prodi
          FROM profiles
          WHERE total_questions_answered > 0
        `;
        const binds: any[] = [];
        
        if (angkatan && angkatan !== 'all') {
          query += ` AND angkatan = ?`;
          binds.push(angkatan);
        }

        if (prodi && prodi !== 'all') {
          if (prodi === 'kedokteran') {
            query += ` AND (prodi = ? OR prodi IS NULL OR prodi = '')`;
            binds.push(prodi);
          } else {
            query += ` AND prodi = ?`;
            binds.push(prodi);
          }
        }
        
        query += ` ORDER BY total_questions_answered DESC LIMIT 1000`;
        
        const { results } = await env.DB.prepare(query).bind(...binds).all();
        return new Response(JSON.stringify({ data: results || [] }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        // Time filter WIB (UTC+7)
        const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
        const nowWib = new Date(Date.now() + WIB_OFFSET_MS);
        const y = nowWib.getUTCFullYear();
        const m = nowWib.getUTCMonth();
        const d = nowWib.getUTCDate();
        const day = nowWib.getUTCDay();

        let cutoffMs: number;
        if (filter === '1') {
          cutoffMs = Date.UTC(y, m, d, 0, 0, 0);
        } else if (filter === '7') {
          const diffToMon = day === 0 ? 6 : day - 1;
          cutoffMs = Date.UTC(y, m, d - diffToMon, 0, 0, 0);
        } else {
          cutoffMs = Date.UTC(y, m, 1, 0, 0, 0);
        }
        const cutoffIso = new Date(cutoffMs - WIB_OFFSET_MS).toISOString();

        let query = `
          SELECT 
            p.id, 
            p.username, 
            p.level, 
            p.angkatan,
            p.prodi,
            SUM(qhl.correct_count) as total_questions_answered
          FROM quiz_history_logs qhl
          JOIN profiles p ON qhl.user_id = p.id
          WHERE qhl.created_at >= ?
        `;
        const binds: any[] = [cutoffIso];

        if (angkatan && angkatan !== 'all') {
          query += ` AND p.angkatan = ?`;
          binds.push(angkatan);
        }

        if (prodi && prodi !== 'all') {
          if (prodi === 'kedokteran') {
            query += ` AND (p.prodi = ? OR p.prodi IS NULL OR p.prodi = '')`;
            binds.push(prodi);
          } else {
            query += ` AND p.prodi = ?`;
            binds.push(prodi);
          }
        }

        query += `
          GROUP BY p.id, p.username, p.level, p.angkatan, p.prodi
          ORDER BY total_questions_answered DESC
          LIMIT 1000
        `;

        const { results } = await env.DB.prepare(query).bind(...binds).all();

        return new Response(JSON.stringify({ data: results || [] }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (type === 'file') {
      if (!fileName) {
        return new Response(JSON.stringify({ error: 'file_name wajib diisi untuk type file' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let query = `
        SELECT 
          l.id,
          l.user_id,
          p.username,
          l.score,
          l.questions_count,
          l.time_spent,
          l.created_at,
          p.level,
          p.angkatan,
          p.prodi,
          p.total_questions_answered
        FROM leaderboard l
        JOIN profiles p ON l.user_id = p.id
        WHERE l.file_name = ?
      `;
      const binds: any[] = [fileName];

      if (filter !== 'all') {
        const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
        const nowWib = new Date(Date.now() + WIB_OFFSET_MS);
        const y = nowWib.getUTCFullYear();
        const m = nowWib.getUTCMonth();
        const d = nowWib.getUTCDate();
        const day = nowWib.getUTCDay();

        let cutoffMs: number;
        if (filter === '1') {
          cutoffMs = Date.UTC(y, m, d, 0, 0, 0);
        } else if (filter === '7') {
          const diffToMon = day === 0 ? 6 : day - 1;
          cutoffMs = Date.UTC(y, m, d - diffToMon, 0, 0, 0);
        } else {
          cutoffMs = Date.UTC(y, m, 1, 0, 0, 0);
        }
        const cutoffIso = new Date(cutoffMs - WIB_OFFSET_MS).toISOString();
        query += ' AND l.created_at >= ?';
        binds.push(cutoffIso);
      }

      if (angkatan && angkatan !== 'all') {
        query += ' AND p.angkatan = ?';
        binds.push(angkatan);
      }

      if (prodi && prodi !== 'all') {
        if (prodi === 'kedokteran') {
          query += ` AND (p.prodi = ? OR p.prodi IS NULL OR p.prodi = '')`;
          binds.push(prodi);
        } else {
          query += ` AND p.prodi = ?`;
          binds.push(prodi);
        }
      }

      query += ' ORDER BY l.score DESC, l.questions_count DESC LIMIT 1000';

      const { results } = await env.DB.prepare(query).bind(...binds).all();

      return new Response(JSON.stringify({ data: results || [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid type parameter' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json() as any;
    const { user_id, file_name, score, correct_count, total_count, time_spent } = body;

    if (!user_id || !file_name) {
      return new Response(JSON.stringify({ error: 'user_id dan file_name wajib diisi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const logId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 1. Simpan ke riwayat kuis
    await env.DB.prepare(`
      INSERT INTO quiz_history_logs (id, user_id, file_name, score, correct_count, total_count, time_spent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      logId,
      user_id,
      file_name,
      score || 0,
      correct_count || 0,
      total_count || 0,
      time_spent || 0,
      now
    ).run();

    // 2. Update atau Insert ke leaderboard per-file
    const existing = await env.DB.prepare(`
      SELECT score, questions_count FROM leaderboard WHERE user_id = ? AND file_name = ?
    `).bind(user_id, file_name).first() as any;

    if (existing) {
      if ((score || 0) > existing.score || (total_count || 0) > existing.questions_count) {
        await env.DB.prepare(`
          UPDATE leaderboard 
          SET score = ?, questions_count = ?, created_at = ?
          WHERE user_id = ? AND file_name = ?
        `).bind(
          Math.max(score || 0, existing.score),
          Math.max(total_count || 0, existing.questions_count),
          now,
          user_id,
          file_name
        ).run();
      }
    } else {
      const leaderId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO leaderboard (id, user_id, file_name, score, questions_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(leaderId, user_id, file_name, score || 0, total_count || 0, now).run();
    }

    // 3. Tambahkan total_questions_answered di profiles
    if (correct_count > 0) {
      await env.DB.prepare(`
        UPDATE profiles
        SET total_questions_answered = total_questions_answered + ?
        WHERE id = ?
      `).bind(correct_count, user_id).run();
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
