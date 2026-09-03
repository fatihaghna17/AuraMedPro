import React, { useState, useEffect } from 'react';
import MabarLobby from './MabarLobby';
import MabarCreateRoom from './MabarCreateRoom';
import MabarWaitingRoom from './MabarWaitingRoom';
import MabarGameHost from './MabarGameHost';
import MabarGamePlayer from './MabarGamePlayer';
import MabarPodium from './MabarPodium';
import MabarPlayerStats from './MabarPlayerStats';
import MabarMatchHistory from './MabarMatchHistory';
import { createRoom, joinRoom } from '../../lib/mabar/mabarRoomManager';
import { useMabarRoom } from '../../hooks/mabar/useMabarRoom';

import { supabase } from '../../supabaseClient';
import type { MabarGameMode, MabarSubMode, MabarRoomPlayer } from '../../lib/mabar/mabarTypes';

interface MabarMainProps {
  currentUser: any;
  availableTopics: string[];
  questionDatabase?: any;
  initialRoomCode?: string;
}

export default function MabarMain({ currentUser, availableTopics, questionDatabase, initialRoomCode }: MabarMainProps) {
  const [view, setView] = useState<'lobby' | 'create' | 'join' | 'waiting' | 'host' | 'player' | 'podium' | 'history' | 'stats'>('lobby');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [podiumPlayers, setPodiumPlayers] = useState<MabarRoomPlayer[]>([]);
  const hasAutoJoinedRef = React.useRef(false);

  // If we have an active room, fetch it
  const { room, players } = useMabarRoom(activeRoomId || '');

  const handleJoinSubmit = React.useCallback(async (code: string) => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) return;

    try {
      let user = currentUser;
      if (!user || !user.id) {
        // Fallback: cek session langsung dari Supabase
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          user = sessionData.session.user;
        } else {
          alert('Sesi belum siap. Mohon tunggu sebentar lalu coba lagi.');
          return;
        }
      }

      const displayName = user.user_metadata?.username || user.email?.split('@')[0] || 'Player';
      const { room: joinedRoom } = await joinRoom(
        cleanCode, 
        user.id, 
        displayName
      );
      setActiveRoomId(joinedRoom.id);
      setIsHost(false);
      setView('waiting');
    } catch (error) {
      console.error('[Mabar handleJoinSubmit]', error);
      alert(error instanceof Error ? error.message : 'Gagal gabung room');
    }
  }, [currentUser]);

  useEffect(() => {
    if (initialRoomCode && !hasAutoJoinedRef.current) {
      hasAutoJoinedRef.current = true;
      handleJoinSubmit(initialRoomCode);
    }
  }, [initialRoomCode, handleJoinSubmit]);

  const handleCreateSubmit = async (params: {
    mode: MabarGameMode;
    subMode?: MabarSubMode;
    topic: string;
    totalQuestions: number;
    timeLimitPerQuestion: number;
    maxPlayers: number;
  }) => {
    try {
      let user = currentUser;
      if (!user || !user.id) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          user = sessionData.session.user;
        } else {
          alert('Sesi belum siap. Mohon login terlebih dahulu.');
          return;
        }
      }

      const newRoom = await createRoom({
        hostId: user.id,
        hostName: user.user_metadata?.username || user.email?.split('@')[0] || 'Host',
        hostAvatarUrl: '',
        ...params
      });
      
      // Setup Questions from Bank
      if (questionDatabase && questionDatabase[params.topic]) {
        // Create array of original indices
        let indices = Array.from({ length: questionDatabase[params.topic].length }, (_, i) => i);
        // Shuffle indices
        indices.sort(() => Math.random() - 0.5);
        // Slice
        indices = indices.slice(0, params.totalQuestions);
        
        // Map to DB insert format
        const roomQuestions = indices.map((originalIdx, idx) => {
          const q = questionDatabase[params.topic][originalIdx];
          return {
            room_id: newRoom.id,
            question_id: originalIdx.toString(), // Save original index as question_id
            order_index: idx,
            correct_answer: q.jawaban_benar || q.correctAnswer || ''
          };
        });
        
        if (roomQuestions.length > 0) {
           await supabase.from('mabar_room_questions').insert(roomQuestions);
        }
      }

      setActiveRoomId(newRoom.id);
      setIsHost(true);
      setView('waiting');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal membuat room');
    }
  };

  const startGame = async () => {
    if (room) {
      await supabase.from('mabar_rooms').update({ status: 'in_progress', started_at: new Date().toISOString() }).eq('id', room.id);
      setView('host');
    }
  };

  const handleGameEnd = (result: any) => {
    setPodiumPlayers(players.slice(0, 3));
    setView('podium');
  };

  // When room status changes to in_progress, players move to game view automatically
  useEffect(() => {
    if (room && room.status === 'in_progress' && view === 'waiting') {
      setView(isHost ? 'host' : 'player');
    }
  }, [room, view, isHost]);

  return (
    <div className="w-full min-h-[80vh]">
      
      {view === 'lobby' && (
        <MabarLobby 
          onJoin={handleJoinSubmit}
          onNavigate={(v) => {
            if (v === 'join') {
              const code = prompt("Masukkan kode room:");
              if (code) handleJoinSubmit(code);
            } else {
              setView(v);
            }
          }} 
          
        />
      )}

      {view === 'create' && (
        <MabarCreateRoom 
          onCancel={() => setView('lobby')} 
          onSubmit={handleCreateSubmit} 
          availableTopics={availableTopics}
          questionDatabase={questionDatabase} 
        />
      )}

      {view === 'waiting' && room && (
        <MabarWaitingRoom 
          room={room} 
          players={players} 
          currentUserId={currentUser.id}
          isHost={isHost}
          onStartGame={startGame}
          onLeaveRoom={() => {
            setActiveRoomId(null);
            setView('lobby');
          }}
        />
      )}

      {view === 'host' && room && isHost && (
        <MabarGameHost 
          room={room}
          scores={players}
          questionDatabase={questionDatabase}
          onFinishGame={() => setView('podium')}
        />
      )}

      {view === 'player' && room && !isHost && (
        <MabarGamePlayer 
          roomId={room.id}
          userId={currentUser.id}
          mode={room.mode}
          totalQuestions={room.total_questions}
          timeLimit={room.time_limit_per_question}
          players={players}
          onGameEnd={handleGameEnd}
        />
      )}

      {view === 'podium' && (
        <MabarPodium 
          topPlayers={podiumPlayers.length > 0 ? podiumPlayers : players} 
          onBackToLobby={() => {
            setActiveRoomId(null);
            setView('lobby');
          }}
        />
      )}

      {view === 'stats' && (
        <MabarPlayerStats userId={currentUser.id} onBack={() => setView('lobby')} />
      )}

      {view === 'history' && (
        <MabarMatchHistory userId={currentUser.id} onBack={() => setView('lobby')} />
      )}
    </div>
  );
}
