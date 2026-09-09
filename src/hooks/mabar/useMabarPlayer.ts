// src/hooks/mabar/useMabarPlayer.ts
// Hook untuk status pemain mabar via Cloudflare D1

import { useState, useEffect } from 'react';
import { cloudflareApi } from '../../services/cloudflareApi';
import type { MabarRoomPlayer } from '../../lib/mabar/mabarTypes';
import { leaveRoom } from '../../lib/mabar/mabarRoomManager';

export function useMabarPlayer(roomId: string, userId: string) {
  const [player, setPlayer] = useState<MabarRoomPlayer | null>(null);

  useEffect(() => {
    if (!roomId || !userId) return;

    let isMounted = true;

    const fetchPlayer = async () => {
      try {
        const res = await cloudflareApi.mabarGetState(roomId);
        if (!isMounted) return;
        const players = res.data?.players || [];
        const found = players.find((p: any) => p.user_id === userId);
        if (found) setPlayer(found as MabarRoomPlayer);
      } catch (e) {
        console.error('[useMabarPlayer] Fetch error:', e);
      }
    };

    fetchPlayer();

    // Polling player status every 2 seconds
    const interval = setInterval(fetchPlayer, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId, userId]);

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom(roomId, userId);
    } catch (e) {
      console.error('Failed to leave room', e);
    }
  };

  return { player, leaveRoom: handleLeaveRoom };
}
