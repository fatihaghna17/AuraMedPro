import { supabase } from '../../supabaseClient';
import { generateRoomCode } from './mabarCodeGenerator';
import type { MabarRoom, MabarRoomPlayer, MabarGameMode, MabarSubMode } from './mabarTypes';

export async function createRoom(params: {
  hostId: string;
  hostName: string;
  hostAvatarUrl?: string;
  mode: MabarGameMode;
  subMode?: MabarSubMode;
  topic: string;
  totalQuestions: number;
  timeLimitPerQuestion: number;
  maxPlayers: number;
}): Promise<MabarRoom> {
  const code = await generateRoomCode();

  // Insert room
  const { data: room, error: roomError } = await supabase
    .from('mabar_rooms')
    .insert({
      code,
      host_id: params.hostId,
      mode: params.mode,
      sub_mode: params.subMode,
      topic: params.topic,
      total_questions: params.totalQuestions,
      time_limit_per_question: params.timeLimitPerQuestion,
      max_players: params.maxPlayers,
      status: 'waiting'
    })
    .select()
    .single();

  if (roomError) throw new Error(roomError.message);

  // Insert host as player
  const { error: playerError } = await supabase
    .from('mabar_room_players')
    .insert({
      room_id: room.id,
      user_id: params.hostId,
      display_name: params.hostName,
      avatar_url: params.hostAvatarUrl,
      is_ready: true
    });

  if (playerError) throw new Error(playerError.message);

  return room as MabarRoom;
}

export async function joinRoom(
  roomCode: string,
  userId: string,
  displayName: string,
  avatarUrl?: string
): Promise<{ room: MabarRoom; player: MabarRoomPlayer }> {
  const cleanCode = (roomCode || '').trim().toUpperCase();
  if (!cleanCode) throw new Error('Kode room tidak boleh kosong.');

  // Ambil semua room dengan kode ini, urutkan dari yang terbaru
  const { data: rooms, error: roomError } = await supabase
    .from('mabar_rooms')
    .select('*')
    .eq('code', cleanCode)
    .order('created_at', { ascending: false });

  if (roomError) {
    console.error('[Mabar joinRoom Error]', roomError);
    throw new Error('Gagal menghubungi server room: ' + roomError.message);
  }

  if (!rooms || rooms.length === 0) {
    throw new Error(`Room dengan kode "${cleanCode}" tidak ditemukan.`);
  }

  // Prioritaskan room yang statusnya masih 'waiting'
  const room = rooms.find(r => r.status === 'waiting') || rooms[0];

  if (room.status !== 'waiting') {
    if (room.status === 'in_progress') {
      throw new Error(`Room "${cleanCode}" sedang dalam pertandingan.`);
    }
    if (room.status === 'finished' || room.status === 'cancelled') {
      throw new Error(`Room "${cleanCode}" sudah selesai atau dibatalkan.`);
    }
    throw new Error(`Room "${cleanCode}" tidak dapat dimasuki (status: ${room.status}).`);
  }

  // Check players count
  const { count } = await supabase
    .from('mabar_room_players')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', room.id);

  if ((count || 0) >= room.max_players) {
    throw new Error('Room sudah penuh.');
  }

  // Insert or update player
  const { data: player, error: playerError } = await supabase
    .from('mabar_room_players')
    .upsert({
      room_id: room.id,
      user_id: userId,
      display_name: displayName || 'Player',
      avatar_url: avatarUrl || '',
      is_ready: true
    }, { onConflict: 'room_id,user_id' })
    .select()
    .maybeSingle();

  if (playerError) {
    console.error('[Mabar joinRoom player error]', playerError);
    throw new Error('Gagal mendaftar ke room: ' + playerError.message);
  }

  return { room: room as MabarRoom, player: (player || {}) as MabarRoomPlayer };
}

export async function getRoomByCode(code: string): Promise<MabarRoom | null> {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) return null;

  const { data: rooms, error } = await supabase
    .from('mabar_rooms')
    .select('*')
    .eq('code', cleanCode)
    .order('created_at', { ascending: false });
    
  if (error || !rooms || rooms.length === 0) return null;
  const room = rooms.find(r => r.status === 'waiting') || rooms[0];
  return room as MabarRoom;
}

export async function getRoomPlayers(roomId: string): Promise<MabarRoomPlayer[]> {
  const { data, error } = await supabase
    .from('mabar_room_players')
    .select('*')
    .eq('room_id', roomId)
    .order('score', { ascending: false });

  if (error) throw new Error(error.message);
  return data as MabarRoomPlayer[];
}

export async function leaveRoom(roomId: string, userId: string): Promise<void> {
  // Hapus player
  await supabase
    .from('mabar_room_players')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);

  // Check if host leaving
  const { data: room } = await supabase
    .from('mabar_rooms')
    .select('host_id')
    .eq('id', roomId)
    .single();

  if (room && room.host_id === userId) {
    const { data: remainingPlayers } = await supabase
      .from('mabar_room_players')
      .select('user_id')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true })
      .limit(1);

    if (remainingPlayers && remainingPlayers.length > 0) {
      // transfer host
      await supabase
        .from('mabar_rooms')
        .update({ host_id: remainingPlayers[0].user_id })
        .eq('id', roomId);
    } else {
      // no players left, cancel room
      await supabase
        .from('mabar_rooms')
        .update({ status: 'cancelled' })
        .eq('id', roomId);
    }
  }
}

export async function submitAnswerToServer(params: {
  roomId: string;
  userId: string;
  questionOrderIndex: number;
  selectedAnswer: string;
}): Promise<{ isCorrect: boolean, score: number, responseTimeMs: number }> {
  // Temporary client-side implementation until Edge Function is ready
  
  // 1. Get question start time & correct answer
  const { data: qData, error: qError } = await supabase
    .from('mabar_room_questions')
    .select('correct_answer, created_at')
    .eq('room_id', params.roomId)
    .eq('order_index', params.questionOrderIndex)
    .single();
    
  if (qError || !qData) throw new Error('Question not found');
  
  const isCorrect = params.selectedAnswer === qData.correct_answer;
  const now = new Date().getTime();
  const start = new Date(qData.created_at).getTime(); // Note: we need a better timestamp mechanism
  
  // mock responseTimeMs (we'll assume 2000ms if missing)
  const responseTimeMs = 2000; 

  // Check current streak
  const { data: pData } = await supabase
    .from('mabar_room_players')
    .select('streak, score, correct_count')
    .eq('room_id', params.roomId)
    .eq('user_id', params.userId)
    .single();

  const currentStreak = pData?.streak || 0;
  
  const { calculateScore } = await import('./mabarScoring');
  const score = calculateScore(responseTimeMs, 15000, currentStreak, isCorrect);
  
  const newStreak = isCorrect ? currentStreak + 1 : 0;
  const newScore = (pData?.score || 0) + score;
  const newCorrectCount = (pData?.correct_count || 0) + (isCorrect ? 1 : 0);

  // Insert answer
  await supabase
    .from('mabar_answers')
    .insert({
      room_id: params.roomId,
      user_id: params.userId,
      question_order_index: params.questionOrderIndex,
      selected_answer: params.selectedAnswer,
      is_correct: isCorrect,
      response_time_ms: responseTimeMs
    });

  // Update player score
  await supabase
    .from('mabar_room_players')
    .update({ 
      score: newScore,
      streak: newStreak,
      correct_count: newCorrectCount
    })
    .eq('room_id', params.roomId)
    .eq('user_id', params.userId);

  return { isCorrect, score, responseTimeMs };
}
