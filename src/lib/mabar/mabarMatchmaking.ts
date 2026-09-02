import { supabase } from '../../supabaseClient';
import type { MabarGameMode, MabarRoom } from './mabarTypes';

export async function findOrCreateQuickMatch(
  userId: string,
  userName: string,
  mode: MabarGameMode,
  topic: string = 'General'
): Promise<MabarRoom> {
  
  // 1. Find waiting room with same mode (and topic if needed)
  const { data: rooms, error } = await supabase
    .from('mabar_rooms')
    .select('*')
    .eq('mode', mode)
    .eq('status', 'waiting')
    .neq('host_id', userId) // not my own room
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) throw error;

  if (rooms && rooms.length > 0) {
    const roomToJoin = rooms[0];
    
    // Check if full (simplified check)
    const { count } = await supabase
      .from('mabar_room_players')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomToJoin.id);

    if ((count || 0) < roomToJoin.max_players) {
      // Join this room
      const { import: joinLib } = await import('./mabarRoomManager').then(m => ({ import: m.joinRoom }));
      await joinLib(roomToJoin.code, userId, userName);
      return roomToJoin as MabarRoom;
    }
  }

  // 2. If no room found, create a new one
  const { import: createLib } = await import('./mabarRoomManager').then(m => ({ import: m.createRoom }));
  const newRoom = await createLib({
    hostId: userId,
    hostName: userName,
    mode: mode,
    topic: topic,
    totalQuestions: 10,
    timeLimitPerQuestion: 15,
    maxPlayers: 10 // 1v1
  });

  return newRoom;
}
