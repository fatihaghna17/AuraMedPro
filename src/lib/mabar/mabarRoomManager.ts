// src/lib/mabar/mabarRoomManager.ts
// Manajemen Room Mabar via Cloudflare D1 Pages Functions (/api/mabar)

import { cloudflareApi } from '../../services/cloudflareApi';
import { generateRoomCode } from './mabarCodeGenerator';
import { calculateScore } from './mabarScoring';
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
  questions?: any[];
}): Promise<MabarRoom> {
  const code = await generateRoomCode();

  const res = await cloudflareApi.mabarAction({
    action: 'create',
    code,
    hostId: params.hostId,
    hostName: params.hostName,
    hostAvatarUrl: params.hostAvatarUrl,
    mode: params.mode,
    subMode: params.subMode,
    topic: params.topic,
    totalQuestions: params.totalQuestions,
    timeLimitPerQuestion: params.timeLimitPerQuestion,
    maxPlayers: params.maxPlayers,
    questions: params.questions,
  });

  if (res.error || !res.data?.room) {
    throw new Error(res.error || 'Gagal membuat room');
  }

  return res.data.room as MabarRoom;
}

export async function joinRoom(
  roomCode: string,
  userId: string,
  displayName: string,
  avatarUrl?: string
): Promise<{ room: MabarRoom; player: MabarRoomPlayer }> {
  const cleanCode = (roomCode || '').trim().toUpperCase();
  if (!cleanCode) throw new Error('Kode room tidak boleh kosong.');

  const res = await cloudflareApi.mabarAction({
    action: 'join',
    roomCode: cleanCode,
    userId,
    displayName: displayName || 'Player',
    avatarUrl: avatarUrl || '',
  });

  if (res.error || !res.data?.room) {
    throw new Error(res.error || `Gagal bergabung ke room "${cleanCode}"`);
  }

  return {
    room: res.data.room as MabarRoom,
    player: (res.data.player || {}) as MabarRoomPlayer,
  };
}

export async function getRoomByCode(code: string): Promise<MabarRoom | null> {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) return null;

  const res = await cloudflareApi.mabarGetState(cleanCode);
  return (res.data?.room as MabarRoom) || null;
}

export async function getRoomPlayers(roomId: string): Promise<MabarRoomPlayer[]> {
  const res = await cloudflareApi.mabarGetState(roomId);
  return (res.data?.players as MabarRoomPlayer[]) || [];
}

export async function leaveRoom(roomId: string, userId: string): Promise<void> {
  await cloudflareApi.mabarAction({
    action: 'leave',
    roomId,
    userId,
  });
}

export async function submitAnswerToServer(params: {
  roomId: string;
  userId: string;
  questionOrderIndex: number;
  selectedAnswer: string;
  responseTimeMs?: number;
}): Promise<{ isCorrect: boolean; score: number; responseTimeMs: number }> {
  const stateRes = await cloudflareApi.mabarGetState(params.roomId);
  const roomData = stateRes.data;
  const qList = roomData?.questions || [];
  const q =
    qList.find(
      (item: any) =>
        item.order_index === params.questionOrderIndex ||
        item.question_index === params.questionOrderIndex
    ) || qList[params.questionOrderIndex];

  const correctAnswer =
    q?.correct_answer || q?.data?.correct_answer || q?.data?.jawaban_benar || '';
  const isCorrect =
    String(params.selectedAnswer).trim().toLowerCase() ===
    String(correctAnswer).trim().toLowerCase();

  const me = (roomData?.players || []).find((p: any) => p.user_id === params.userId);
  const currentStreak = me?.streak || 0;
  const timeLimitMs = (roomData?.room?.time_limit_per_question || 15) * 1000;
  const responseTimeMs = params.responseTimeMs || 2000;

  const scoreGained = calculateScore(responseTimeMs, timeLimitMs, currentStreak, isCorrect);

  await cloudflareApi.mabarAction({
    action: 'answer',
    roomId: params.roomId,
    userId: params.userId,
    questionOrderIndex: params.questionOrderIndex,
    selectedAnswer: params.selectedAnswer,
    isCorrect,
    scoreGained,
    responseTimeMs,
  });

  return { isCorrect, score: scoreGained, responseTimeMs };
}
