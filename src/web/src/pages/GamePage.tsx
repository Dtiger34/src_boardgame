import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useSocketStore } from '@/store/socket';
import { useGameStore } from '@/store/game';
import { GomokuBoard } from '@/components/game/GomokuBoard';
import { GamePanel } from '@/components/game/GamePanel';
import { ChatBox } from '@/components/game/ChatBox';

export function GamePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { tokens } = useAuthStore();
  const { connect, disconnect, socket } = useSocketStore();
  const { joinRoom } = useGameStore();
  const gameState = useGameStore((s) => s.gameState);

  useEffect(() => {
    if (!tokens) return;
    connect(tokens.accessToken);
    return () => disconnect();
  }, [tokens]);

  useEffect(() => {
    if (socket && roomId) joinRoom(roomId);
  }, [socket, roomId]);

  if (!roomId) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex gap-4 p-6">
      <div className="flex-1 flex items-center justify-center">
        {gameState?.gameType === 'gomoku' && <GomokuBoard roomId={roomId} />}
        {!gameState && (
          <div className="text-gray-400 text-center">
            <div className="text-4xl mb-3 animate-pulse">⏳</div>
            <p>Đang chờ đối thủ...</p>
          </div>
        )}
      </div>
      <div className="w-72 flex flex-col gap-4">
        <GamePanel roomId={roomId} />
        <ChatBox roomId={roomId} />
      </div>
    </div>
  );
}
