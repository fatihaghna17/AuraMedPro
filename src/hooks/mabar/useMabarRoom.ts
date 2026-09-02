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

    // Subscribe to room changes (status updates, etc)
    const roomSub = supabase.channel(`public:mabar_rooms:id=eq.${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mabar_rooms', filter: `id=eq.${roomId}` }, (payload) => {
        setRoom(payload.new as MabarRoom);
      })
      .subscribe();

    // Subscribe to player changes (join, leave, score updates)
    const playerSub = supabase.channel(`public:mabar_room_players:room_id=eq.${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mabar_room_players', filter: `room_id=eq.${roomId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPlayers(prev => [...prev, payload.new as MabarRoomPlayer].sort((a, b) => b.score - a.score));
        } else if (payload.eventType === 'UPDATE') {
          setPlayers(prev => prev.map(p => p.id === payload.new.id ? (payload.new as MabarRoomPlayer) : p).sort((a, b) => b.score - a.score));
        } else if (payload.eventType === 'DELETE') {
          setPlayers(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomSub);
      supabase.removeChannel(playerSub);
    };
  }, [roomId, fetchRoomData]);

  return { room, players, isLoading, error, refresh: fetchRoomData };
}
