import React, { useState, useEffect } from 'react';
import MabarLobby from './MabarLobby';
import MabarCreateRoom from './MabarCreateRoom';
import MabarWaitingRoom from './MabarWaitingRoom';
import MabarGameHost from './MabarGameHost';
import MabarGamePlayer from './MabarGamePlayer';
import MabarPodium from './MabarPodium';
import { createRoom, joinRoom } from '../../lib/mabar/mabarRoomManager';
import { useMabarRoom } from '../../hooks/mabar/useMabarRoom';
import type { MabarGameMode, MabarSubMode, MabarRoomPlayer } from '../../lib/mabar/mabarTypes';

interface MabarMainProps {
  currentUser: any;
  availableTopics: string[];
}

export default function MabarMain({ currentUser, availableTopics }: MabarMainProps) {
  const [view, setView] = useState<'lobby' | 'create' | 'join' | 'waiting' | 'host' | 'player' | 'podium' | 'history' | 'stats'>('lobby');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [podiumPlayers, setPodiumPlayers] = useState<MabarRoomPlayer[]>([]);

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

  const startGame = () => {
    // Should call API to start game and broadcast to players
    setView('host');
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
          onNavigate={(v) => {
            if (v === 'join') {
              const code = prompt("Masukkan kode room:");
              if (code) handleJoinSubmit(code);
            } else {
              setView(v);
            }
          }} 
          onQuickMatch={() => alert('Quick match belum tersedia')} 
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
          roomId={room.code} 
          questionIndex={room.current_question_index}
          totalQuestions={room.total_questions}
          timeRemaining={room.time_limit_per_question}
          isQuestionActive={true}
          scores={players}
          onNextQuestion={() => {}}
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
