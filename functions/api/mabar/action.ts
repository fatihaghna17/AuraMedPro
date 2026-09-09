interface Env {
  DB: D1Database;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
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
    const { action } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Parameter action wajib diisi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();

    // 1. ACTION: CREATE ROOM
    if (action === 'create') {
      const {
        code,
        hostId,
        hostName,
        hostAvatarUrl,
        mode,
        subMode,
        topic,
        totalQuestions,
        timeLimitPerQuestion,
        maxPlayers,
        questions,
      } = body;

      const roomId = crypto.randomUUID();
      const cleanCode = (code || '').trim().toUpperCase();

      const statements: D1PreparedStatement[] = [
        env.DB.prepare(`
          INSERT INTO mabar_rooms (
            id, code, room_code, host_id, title, mode, sub_mode, topic,
            total_questions, time_limit_per_question, max_players, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'waiting', ?)
        `).bind(
          roomId,
          cleanCode,
          cleanCode,
          hostId,
          topic || 'Kuis Mabar',
          mode || 'kahoot',
          subMode || 'classic_1v1',
          topic || 'Umum',
          totalQuestions || 10,
          timeLimitPerQuestion || 30,
          maxPlayers || 8,
          now
        ),
        env.DB.prepare(`
          INSERT INTO mabar_room_players (
            id, room_id, user_id, username, display_name, avatar_url, is_ready, joined_at
          ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
        `).bind(
          crypto.randomUUID(),
          roomId,
          hostId,
          hostName,
          hostName,
          hostAvatarUrl || null,
          now
        ),
      ];

      // Masukkan soal-soal room jika ada
      if (Array.isArray(questions) && questions.length > 0) {
        questions.forEach((q: any, idx: number) => {
          statements.push(
            env.DB.prepare(`
              INSERT INTO mabar_room_questions (id, room_id, question_index, question_data, created_at)
              VALUES (?, ?, ?, ?, ?)
            `).bind(
              crypto.randomUUID(),
              roomId,
              idx,
              typeof q === 'string' ? q : JSON.stringify(q),
              now
            )
          );
        });
      }

      await env.DB.batch(statements);

      const createdRoom = await env.DB.prepare('SELECT * FROM mabar_rooms WHERE id = ?')
        .bind(roomId)
        .first();

      return new Response(JSON.stringify({ data: { room: createdRoom } }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. ACTION: JOIN ROOM
    if (action === 'join') {
      const { roomCode, userId, displayName, avatarUrl } = body;
      const cleanCode = (roomCode || '').trim().toUpperCase();

      const room = await env.DB.prepare(`
        SELECT * FROM mabar_rooms WHERE code = ? OR room_code = ? ORDER BY created_at DESC LIMIT 1
      `).bind(cleanCode, cleanCode).first() as any;

      if (!room) {
        return new Response(JSON.stringify({ error: `Room "${cleanCode}" tidak ditemukan` }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (room.status !== 'waiting') {
        return new Response(JSON.stringify({ error: `Room sedang dalam status "${room.status}"` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Cek apakah player sudah di dalam room
      const existingPlayer = await env.DB.prepare(`
        SELECT * FROM mabar_room_players WHERE room_id = ? AND user_id = ?
      `).bind(room.id, userId).first();

      if (existingPlayer) {
        return new Response(JSON.stringify({ data: { room, player: existingPlayer } }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Cek batas player
      const countRes = await env.DB.prepare(`
        SELECT count(*) as total FROM mabar_room_players WHERE room_id = ?
      `).bind(room.id).first() as any;

      if (countRes && countRes.total >= room.max_players) {
        return new Response(JSON.stringify({ error: 'Room sudah penuh' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const playerId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO mabar_room_players (id, room_id, user_id, username, display_name, avatar_url, is_ready, score, streak, joined_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?)
      `).bind(playerId, room.id, userId, displayName, displayName, avatarUrl || null, now).run();

      const newPlayer = await env.DB.prepare('SELECT * FROM mabar_room_players WHERE id = ?')
        .bind(playerId)
        .first();

      return new Response(JSON.stringify({ data: { room, player: newPlayer } }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. ACTION: READY / UNREADY
    if (action === 'ready') {
      const { roomId, userId, isReady } = body;
      await env.DB.prepare(`
        UPDATE mabar_room_players SET is_ready = ? WHERE room_id = ? AND user_id = ?
      `).bind(isReady ? 1 : 0, roomId, userId).run();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. ACTION: START GAME
    if (action === 'start') {
      const { roomId } = body;
      await env.DB.prepare(`
        UPDATE mabar_rooms SET status = 'in_progress', started_at = ?, current_question_index = 0 WHERE id = ?
      `).bind(now, roomId).run();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. ACTION: SUBMIT ANSWER
    if (action === 'answer') {
      const { roomId, userId, questionOrderIndex, selectedAnswer, isCorrect, scoreGained, responseTimeMs } = body;

      const answerId = crypto.randomUUID();
      const statements: D1PreparedStatement[] = [
        env.DB.prepare(`
          INSERT INTO mabar_answers (id, room_id, user_id, question_order_index, selected_answer, is_correct, response_time_ms, answered_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(room_id, user_id, question_order_index) DO UPDATE SET
            selected_answer = excluded.selected_answer,
            is_correct = excluded.is_correct,
            response_time_ms = excluded.response_time_ms,
            answered_at = excluded.answered_at
        `).bind(
          answerId,
          roomId,
          userId,
          questionOrderIndex,
          selectedAnswer,
          isCorrect ? 1 : 0,
          responseTimeMs || 0,
          now
        ),
        env.DB.prepare(`
          UPDATE mabar_room_players
          SET score = score + ?,
              streak = CASE WHEN ? = 1 THEN streak + 1 ELSE 0 END,
              correct_count = correct_count + CASE WHEN ? = 1 THEN 1 ELSE 0 END
          WHERE room_id = ? AND user_id = ?
        `).bind(
          scoreGained || 0,
          isCorrect ? 1 : 0,
          isCorrect ? 1 : 0,
          roomId,
          userId
        ),
      ];

      await env.DB.batch(statements);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. ACTION: NEXT QUESTION
    if (action === 'next') {
      const { roomId, nextIndex } = body;
      await env.DB.prepare(`
        UPDATE mabar_rooms SET current_question_index = ? WHERE id = ?
      `).bind(nextIndex, roomId).run();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 7. ACTION: FINISH GAME
    if (action === 'finish') {
      const { roomId, finalScores } = body;
      const statements: D1PreparedStatement[] = [
        env.DB.prepare(`
          UPDATE mabar_rooms SET status = 'finished', finished_at = ? WHERE id = ?
        `).bind(now, roomId),
      ];

      if (Array.isArray(finalScores)) {
        finalScores.forEach((p: any, rank: number) => {
          statements.push(
            env.DB.prepare(`
              INSERT INTO mabar_match_history (id, room_id, user_id, rank, score, mode, played_at)
              VALUES (?, ?, ?, ?, ?, 'mabar', ?)
            `).bind(
              crypto.randomUUID(),
              roomId,
              p.user_id,
              rank + 1,
              p.score || 0,
              now
            )
          );

          statements.push(
            env.DB.prepare(`
              INSERT INTO mabar_player_stats (user_id, matches_played, matches_won, total_score, updated_at)
              VALUES (?, 1, CASE WHEN ? = 0 THEN 1 ELSE 0 END, ?, ?)
              ON CONFLICT(user_id) DO UPDATE SET
                matches_played = mabar_player_stats.matches_played + 1,
                matches_won = mabar_player_stats.matches_won + CASE WHEN ? = 0 THEN 1 ELSE 0 END,
                total_score = mabar_player_stats.total_score + excluded.total_score,
                updated_at = excluded.updated_at
            `).bind(
              p.user_id,
              rank,
              p.score || 0,
              now,
              rank
            )
          );
        });
      }

      await env.DB.batch(statements);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 8. ACTION: LEAVE ROOM
    if (action === 'leave') {
      const { roomId, userId } = body;
      await env.DB.prepare(`
        DELETE FROM mabar_room_players WHERE room_id = ? AND user_id = ?
      `).bind(roomId, userId).run();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Aksi "${action}" tidak dikenali` }), {
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
