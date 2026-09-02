import { supabase } from '../../supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { MabarRealtimeEvent } from './mabarTypes';

export function joinRoomChannel(roomId: string, callbacks: {
  onPlayerJoined?: (data: any) => void;
  onPlayerLeft?: (data: any) => void;
  onPlayerKicked?: (data: any) => void;
  onGameStarting?: (data: any) => void;
  onQuestionStart?: (data: any) => void;
  onPlayerAnswered?: (data: any) => void;
  onQuestionEnd?: (data: any) => void;
  onGameFinished?: (data: any) => void;
  onRoomCancelled?: (data: any) => void;
  onHostTransferred?: (data: any) => void;
}): RealtimeChannel {
  
  const channel = supabase.channel(`mabar-room-${roomId}`, {
    config: { broadcast: { self: true } }
  });

  // Subscribe to all listed events
  const eventMapping: Record<string, ((data: any) => void) | undefined> = {
    'player_joined': callbacks.onPlayerJoined,
    'player_left': callbacks.onPlayerLeft,
    'player_kicked': callbacks.onPlayerKicked,
    'game_starting': callbacks.onGameStarting,
    'question_start': callbacks.onQuestionStart,
    'player_answered': callbacks.onPlayerAnswered,
    'question_end': callbacks.onQuestionEnd,
    'game_finished': callbacks.onGameFinished,
    'room_cancelled': callbacks.onRoomCancelled,
    'host_transferred': callbacks.onHostTransferred,
  };

  Object.entries(eventMapping).forEach(([event, callback]) => {
    if (callback) {
      channel.on('broadcast', { event }, (payload) => {
        callback(payload.payload);
      });
    }
  });

  channel.subscribe((status) => {
    if (status !== 'SUBSCRIBED') {
      console.warn('Realtime channel subscription status:', status);
    }
  });
  
  return channel;
}

export async function broadcastToRoom(channel: RealtimeChannel | null, event: string, payload: any): Promise<void> {
  if (!channel) return;
  await channel.send({
    type: 'broadcast',
    event: event,
    payload: payload,
  });
}

export function leaveRoomChannel(channel: RealtimeChannel | null): void {
  if (channel) {
    supabase.removeChannel(channel);
  }
}
