// src/hooks/mabar/useMabarRoom.ts
// Hook untuk sinkronisasi state room & players Mabar via Cloudflare D1

import { useState, useEffect, useCallback, useRef } from 'react';
import { cloudflareApi } from '../../services/cloudflareApi';
import { joinRoomChannel, leaveRoomChannel } from '../../lib/mabar/mabarRealtime';
import type { MabarRoom, MabarRoomPlayer } from '../../lib/mabar/mabarTypes';

export function useMabarRoom(roomId: string) {
  const [room, setRoom] = useState<MabarRoom | null>(null);
  const [players, setPlayers] = useState<MabarRoomPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchRoomData = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await cloudflareApi.mabarGetState(roomId);
      if (!isMountedRef.current) return;

      if (res.error) {
        setError(res.error);
        return;
      }

      if (res.data?.room) {
        setRoom(res.data.room as MabarRoom);
      }
      if (Array.isArray(res.data?.players)) {
        setPlayers(res.data.players as MabarRoomPlayer[]);
      }
      setError(null);
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || 'Gagal memuat data room');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [roomId]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!roomId) return;

    fetchRoomData();

    // 1. Listen via Web BroadcastChannel for local immediate signals
    const channel = joinRoomChannel(roomId, {
      onGameStarting: () => {
        setRoom((prev) => (prev ? { ...prev, status: 'in_progress' } : null));
        fetchRoomData();
      },
      onRoomCancelled: () => {
        setRoom((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
      },
      onPlayerJoined: () => {
        fetchRoomData();
      },
      onPlayerLeft: () => {
        fetchRoomData();
      },
    });

    // 2. Polling loop every 1.5 seconds to sync state with Cloudflare D1
    const pollInterval = setInterval(() => {
      fetchRoomData();
    }, 1500);

    return () => {
      isMountedRef.current = false;
      clearInterval(pollInterval);
      leaveRoomChannel(channel);
    };
  }, [roomId, fetchRoomData]);

  return { room, players, isLoading, error, refresh: fetchRoomData };
}
