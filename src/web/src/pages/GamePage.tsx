import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSocketStore } from '@/store/socket';
import { useGameStore } from '@/store/game';
import { GomokuBoard } from '@/components/game/GomokuBoard';
import { GamePanel } from '@/components/game/GamePanel';
import { ChatBox } from '@/components/game/ChatBox';
import { RoomLobby } from '@/components/game/RoomLobby';
import { WerewolfGame } from '@/components/game/WerewolfGame';

export function GamePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const socket = useSocketStore((s) => s.socket);
  const { joinRoom } = useGameStore();
  const gameState = useGameStore((s) => s.gameState);

  useEffect(() => {
    if (socket && roomId) joinRoom(roomId);
  }, [socket, roomId]);

  if (!roomId) return null;

  if (!gameState) {
    return <RoomLobby roomId={roomId} />;
  }

  if (gameState.gameType === 'werewolf') {
    return <WerewolfGame roomId={roomId} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex gap-4 p-6">
      <div className="flex-1 flex items-center justify-center">
        {gameState.gameType === 'gomoku' && <GomokuBoard roomId={roomId} />}
      </div>
      <div className="w-72 flex flex-col gap-4">
        <GamePanel roomId={roomId} />
        <ChatBox roomId={roomId} />
      </div>
    </div>
  );
}
