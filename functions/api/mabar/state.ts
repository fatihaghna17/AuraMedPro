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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const roomCode = (url.searchParams.get('room') || url.searchParams.get('code') || '').trim().toUpperCase();
  const since = url.searchParams.get('since');

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!roomCode) {
    return new Response(JSON.stringify({ error: 'Parameter room (kode room) wajib disertakan' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Ambil data room (bisa via code, room_code, atau id)
    const room = await env.DB.prepare(`
      SELECT * FROM mabar_rooms
      WHERE code = ? OR room_code = ? OR id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(roomCode, roomCode, roomCode).first() as any;

    if (!room) {
      return new Response(JSON.stringify({ error: `Room ${roomCode} tidak ditemukan` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Ambil players dalam room
    const { results: players } = await env.DB.prepare(`
      SELECT * FROM mabar_room_players
      WHERE room_id = ?
      ORDER BY score DESC, joined_at ASC
    `).bind(room.id).all();

    // 3. Ambil questions jika kuis sedang berjalan / menunggu
    const { results: questions } = await env.DB.prepare(`
      SELECT * FROM mabar_room_questions
      WHERE room_id = ?
      ORDER BY question_index ASC
    `).bind(room.id).all();

    // 4. Ambil jawaban terbaru (sejak timestamp `since` klien jika ada)
    let answersQuery = 'SELECT * FROM mabar_answers WHERE room_id = ?';
    const answerBinds: any[] = [room.id];
    if (since) {
      answersQuery += ' AND answered_at > ?';
      answerBinds.push(since);
    }
    answersQuery += ' ORDER BY answered_at ASC LIMIT 100';

    const { results: recentAnswers } = await env.DB.prepare(answersQuery)
      .bind(...answerBinds)
      .all();

    const serverTime = new Date().toISOString();

    return new Response(
      JSON.stringify({
        data: {
          room,
          players: players || [],
          questions: questions || [],
          recent_answers: recentAnswers || [],
          server_time: serverTime,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
