// src/lib/mabar/mabarMatchmaking.ts
// Quick match logic via Cloudflare D1

import { cloudflareApi } from '../../services/cloudflareApi';
import { createRoom } from './mabarRoomManager';
import type { MabarGameMode, MabarRoom } from './mabarTypes';

export async function findOrCreateQuickMatch(
  userId: string,
  userName: string,
  mode: MabarGameMode,
  topic: string = 'General'
): Promise<MabarRoom> {
  // 1. Coba cari room yang sedang waiting via server D1
  try {
    const res = await cloudflareApi.mabarAction({
      action: 'quick_match',
      userId,
      userName,
      mode,
    });

    if (res.data?.room) {
      return res.data.room as MabarRoom;
    }
  } catch (e) {
    console.warn('[findOrCreateQuickMatch] Quick match check failed, creating new room:', e);
  }

  // 2. Jika tidak ada room yang cocok, buat room baru
  const newRoom = await createRoom({
    hostId: userId,
    hostName: userName,
    mode: mode,
    topic: topic,
    totalQuestions: 10,
    timeLimitPerQuestion: 15,
    maxPlayers: 10,
  });

  return newRoom;
}
