import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/store/game';
import { useAuthStore } from '@/store/auth';
import clsx from 'clsx';

const SIZE = 15;

interface GomokuState {
  board: number[][];
}

export function GomokuBoard({ roomId }: { roomId: string }) {
  const { t } = useTranslation();
  const gameState = useGameStore((s) => s.gameState);
  const sendMove = useGameStore((s) => s.sendMove);
  const user = useAuthStore((s) => s.user);

  if (!gameState) return null;

  const board = (gameState.boardState as GomokuState).board;
  const isMyTurn = gameState.currentTurn === user?.id && gameState.status === 'in_progress';
  const myIndex = gameState.players.findIndex((p) => p.userId === user?.id);

  function handleClick(row: number, col: number) {
    if (!isMyTurn || board[row][col] !== 0) return;
    sendMove(roomId, { row, col });
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-gray-400">
        {isMyTurn ? `✅ ${t('game.yourTurn')}` : `⏳ ${t('game.opponentTurn')}`}
        <span className="ml-2">{myIndex === 0 ? '✖' : '⭕'}</span>
      </p>
      <div
        className="inline-grid bg-amber-100 border border-gray-400"
        style={{ gridTemplateColumns: `repeat(${SIZE}, 36px)` }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => handleClick(r, c)}
              className={clsx(
                'w-9 h-9 border border-gray-400/40 flex items-center justify-center',
                isMyTurn && cell === 0 && 'hover:bg-yellow-200/50 cursor-pointer',
              )}
            >
              {cell === 1 && <span className="text-xl font-black text-blue-600 leading-none select-none">✕</span>}
              {cell === 2 && <span className="text-xl font-black text-red-500 leading-none select-none">○</span>}
            </button>
          )),
        )}
      </div>
    </div>
  );
}
