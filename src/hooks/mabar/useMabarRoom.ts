import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import type { MabarRoom, MabarRoomPlayer } from '../../lib/mabar/mabarTypes';

export function useMabarRoom(roomId: string) {
  const [room, setRoom] = useState<MabarRoom | null>(null);
  const [players, setPlayers] = useState<MabarRoomPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoomData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [roomRes, playersRes] = await Promise.all([
        supabase.from('mabar_rooms').select('*').eq('id', roomId).single(),
        supabase.from('mabar_room_players').select('*').eq('room_id', roomId).order('score', { ascending: false })
      ]);

      if (roomRes.error) throw roomRes.error;
      setRoom(roomRes.data as MabarRoom);
      
      if (playersRes.error) throw playersRes.error;
      setPlayers(playersRes.data as MabarRoomPlayer[]);
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data room');
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    
    fetchRoomData();

    // 1. Subscribe to Broadcast channel mabar-room-${roomId} for instant game_starting / room updates
    const broadcastChannel = supabase.channel(`mabar-room-${roomId}`, {
      config: { broadcast: { self: true } }
    })
      .on('broadcast', { event: 'game_starting' }, () => {
        setRoom(prev => prev ? { ...prev, status: 'in_progress' } : null);
        fetchRoomData();
      })
      .on('broadcast', { event: 'room_cancelled' }, () => {
        setRoom(prev => prev ? { ...prev, status: 'cancelled' } : null);
      })
      .on('broadcast', { event: 'player_joined' }, () => {
        fetchRoomData();
      })
      .on('broadcast', { event: 'player_left' }, () => {
        fetchRoomData();
      })
      .subscribe();

    // 2. Subscribe to postgres_changes for room updates
    const roomSub = supabase.channel(`db-mabar-rooms-${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mabar_rooms', filter: `id=eq.${roomId}` }, (payload) => {
        if (payload.new) {
          setRoom(payload.new as MabarRoom);
        }
      })
      .subscribe();

    // 3. Subscribe to postgres_changes for player updates
    const playerSub = supabase.channel(`db-mabar-players-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mabar_room_players', filter: `room_id=eq.${roomId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPlayers(prev => {
            const exists = prev.some(p => p.id === payload.new.id || p.user_id === payload.new.user_id);
            if (exists) return prev.map(p => (p.id === payload.new.id || p.user_id === payload.new.user_id) ? (payload.new as MabarRoomPlayer) : p);
            return [...prev, payload.new as MabarRoomPlayer].sort((a, b) => b.score - a.score);
          });
        } else if (payload.eventType === 'UPDATE') {
          setPlayers(prev => prev.map(p => (p.id === payload.new.id || p.user_id === payload.new.user_id) ? (payload.new as MabarRoomPlayer) : p).sort((a, b) => b.score - a.score));
        } else if (payload.eventType === 'DELETE') {
          setPlayers(prev => prev.filter(p => p.id !== payload.old.id && p.user_id !== payload.old.user_id));
        }
      })
      .subscribe();

    // 4. Polling fallback every 1.5 seconds while room is in 'waiting' status
    const pollInterval = setInterval(() => {
      fetchRoomData();
    }, 1500);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(roomSub);
      supabase.removeChannel(playerSub);
    };
  }, [roomId, fetchRoomData]);

  return { room, players, isLoading, error, refresh: fetchRoomData };
}
