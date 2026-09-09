// src/lib/mabar/mabarRealtime.ts
// Realtime channel menggunakan standard Web BroadcastChannel API & Polling Bridge (bebas Supabase)

export interface RealtimeChannel {
  send: (payload: any) => Promise<void>;
  close?: () => void;
  on?: (type: string, filter: any, callback: (payload: any) => void) => RealtimeChannel;
  subscribe?: (callback?: (status: string) => void) => RealtimeChannel;
}

export function joinRoomChannel(
  roomId: string,
  callbacks: {
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
  }
): RealtimeChannel {
  const channelName = `mabar-room-${roomId}`;
  let bc: BroadcastChannel | null = null;

  const eventMapping: Record<string, ((data: any) => void) | undefined> = {
    player_joined: callbacks.onPlayerJoined,
    player_left: callbacks.onPlayerLeft,
    player_kicked: callbacks.onPlayerKicked,
    game_starting: callbacks.onGameStarting,
    question_start: callbacks.onQuestionStart,
    player_answered: callbacks.onPlayerAnswered,
    question_end: callbacks.onQuestionEnd,
    game_finished: callbacks.onGameFinished,
    room_cancelled: callbacks.onRoomCancelled,
    host_transferred: callbacks.onHostTransferred,
  };

  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      bc = new BroadcastChannel(channelName);
      bc.onmessage = (ev) => {
        const msg = ev.data;
        if (msg && msg.type === 'broadcast' && msg.event) {
          const handler = eventMapping[msg.event];
          if (handler) {
            handler(msg.payload);
          }
        }
      };
    } catch (e) {
      console.warn('[MabarRealtime] BroadcastChannel init error:', e);
    }
  }

  const channel: RealtimeChannel = {
    send: async (payload: any) => {
      if (bc) {
        try {
          bc.postMessage(payload);
        } catch (e) {
          console.warn('[MabarRealtime] BroadcastChannel postMessage error:', e);
        }
      }
    },
    close: () => {
      if (bc) {
        bc.close();
        bc = null;
      }
    },
    on: () => channel,
    subscribe: (cb) => {
      if (cb) cb('SUBSCRIBED');
      return channel;
    },
  };

  return channel;
}

export async function broadcastToRoom(
  channel: RealtimeChannel | null,
  event: string,
  payload: any
): Promise<void> {
  if (!channel) return;
  await channel.send({
    type: 'broadcast',
    event: event,
    payload: payload,
  });
}

export function leaveRoomChannel(channel: RealtimeChannel | null): void {
  if (channel && channel.close) {
    channel.close();
  }
}
