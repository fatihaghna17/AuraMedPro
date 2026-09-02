import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import type { MabarRoomPlayer } from '../../lib/mabar/mabarTypes';
import { leaveRoom } from '../../lib/mabar/mabarRoomManager';

export function useMabarPlayer(roomId: string, userId: string) {
  const [player, setPlayer] = useState<MabarRoomPlayer | null>(null);

  useEffect(() => {
    if (!roomId || !userId) return;

    const fetchPlayer = async () => {
      const { data } = await supabase
        .from('mabar_room_players')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .maybeSingle();
      if (data) setPlayer(data as MabarRoomPlayer);
    };

    fetchPlayer();

    // Subscribe to own player changes
    const playerSub = supabase.channel(`public:mabar_room_players:room_id=eq.${roomId}:user_id=eq.${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mabar_room_players', filter: `room_id=eq.${roomId}` }, (payload) => {
        if (payload.new.user_id === userId) {
          setPlayer(payload.new as MabarRoomPlayer);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(playerSub);
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
