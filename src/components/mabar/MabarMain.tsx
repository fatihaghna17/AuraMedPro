import React, { useState, useEffect } from 'react';
import MabarLobby from './MabarLobby';
import MabarCreateRoom from './MabarCreateRoom';
import MabarWaitingRoom from './MabarWaitingRoom';
import MabarGameHost from './MabarGameHost';
import MabarGamePlayer from './MabarGamePlayer';
import MabarPodium from './MabarPodium';
import { createRoom, joinRoom } from '../../lib/mabar/mabarRoomManager';
import { useMabarRoom } from '../../hooks/mabar/useMabarRoom';
import { useMabarMatchmaking } from '../../hooks/mabar/useMabarMatchmaking';
import { supabase } from '../../supabaseClient';
import type { MabarGameMode, MabarSubMode, MabarRoomPlayer } from '../../lib/mabar/mabarTypes';

interface MabarMainProps {
  currentUser: any;
  availableTopics: string[];
  globalDatabases?: any;
}

export default function MabarMain({ currentUser, availableTopics, globalDatabases }: MabarMainProps) {
  const [view, setView] = useState<'lobby' | 'create' | 'join' | 'waiting' | 'host' | 'player' | 'podium' | 'history' | 'stats'>('lobby');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [podiumPlayers, setPodiumPlayers] = useState<MabarRoomPlayer[]>([]);
  const { isSearching, matchedRoom, startSearch, cancelSearch } = useMabarMatchmaking();

  useEffect(() => {
    if (matchedRoom) {
      setActiveRoomId(matchedRoom.id);
      setIsHost(matchedRoom.host_id === currentUser.id);
      setView('waiting');
    }
  }, [matchedRoom, currentUser.id]);

  // If we have an active room, fetch it
  const { room, players } = useMabarRoom(activeRoomId || '');

  const handleCreateSubmit = async (params: {
    mode: MabarGameMode;
    subMode?: MabarSubMode;
    topic: string;
    totalQuestions: number;
    timeLimitPerQuestion: number;
    maxPlayers: number;
  }) => {
    try {
      const newRoom = await createRoom({
        hostId: currentUser.id,
        hostName: currentUser.user_metadata?.username || 'Host',
        hostAvatarUrl: '',
        ...params
      });
      
      // Setup Questions from Bank
      if (globalDatabases && globalDatabases[params.topic]) {
        let bankQuestions = [...globalDatabases[params.topic]];
        // Shuffle
        bankQuestions.sort(() => Math.random() - 0.5);
        // Slice
        bankQuestions = bankQuestions.slice(0, params.totalQuestions);
        
        // Map to DB insert format
        const roomQuestions = bankQuestions.map((q, idx) => ({
          room_id: newRoom.id,
          question_id: q.id || `temp-${idx}`,
          order_index: idx,
          correct_answer: q.correctAnswer || (q.options?.find((o:any)=>o.isCorrect)?.text) || ''
        }));
        
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

  const handleJoinSubmit = async (code: string) => {
    try {
      const { room: joinedRoom } = await joinRoom(
        code, 
        currentUser.id, 
        currentUser.user_metadata?.username || 'Player'
      );
      setActiveRoomId(joinedRoom.id);
      setIsHost(false);
      setView('waiting');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal gabung room');
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
      {isSearching && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
          <h2 className="text-3xl font-bold mb-4 animate-pulse">Mencari Lawan...</h2>
          <button onClick={cancelSearch} className="px-6 py-2 bg-red-500 rounded-full font-bold hover:bg-red-600">Batal</button>
        </div>
      )}
      {view === 'lobby' && (
        <MabarLobby 
          onNavigate={(v) => {
            if (v === 'join') {
              const code = prompt("Masukkan kode room:");
              if (code) handleJoinSubmit(code);
            } else {
              setView(v);
            }
          }} 
          onQuickMatch={() => startSearch(currentUser.id, currentUser.user_metadata?.username || 'Player', 'cerdas_cermat')} 
        />
      )}

      {view === 'create' && (
        <MabarCreateRoom 
          onCancel={() => setView('lobby')} 
          onSubmit={handleCreateSubmit} 
          availableTopics={availableTopics} 
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
          globalDatabases={globalDatabases}
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
    </div>
  );
}
