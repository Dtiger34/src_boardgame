import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/store/game';
import { useSocketStore } from '@/store/socket';
import { useAuthStore } from '@/store/auth';

export function GamePanel({ roomId }: { roomId: string }) {
  const { t } = useTranslation();
  const gameState = useGameStore((s) => s.gameState);
  const result = useGameStore((s) => s.result);
  const drawOfferedBy = useGameStore((s) => s.drawOfferedBy);
  const resign = useGameStore((s) => s.resign);
  const socket = useSocketStore((s) => s.socket);
  const user = useAuthStore((s) => s.user);

  if (!gameState) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-4">
      <h2 className="font-semibold text-lg capitalize">{gameState.gameType}</h2>

      <div className="flex flex-col gap-2 text-sm">
        {gameState.players.map((p) => (
          <div
            key={p.userId}
            className={`flex justify-between px-3 py-2 rounded-lg ${
              gameState.currentTurn === p.userId
                ? 'bg-amber-500/10 border border-amber-500/30'
                : 'bg-gray-800'
            }`}
          >
            <span>{p.username}{p.userId === user?.id && ` (${t('game.you')})`}</span>
            {gameState.currentTurn === p.userId && (
              <span className="text-amber-400 text-xs">{t('game.moving')}</span>
            )}
          </div>
        ))}
      </div>

      {result && (
        <div className="text-center p-3 rounded-lg bg-gray-800">
          {result.isDraw ? (
            <p className="text-yellow-400 font-semibold">{t('game.resultDraw')}</p>
          ) : result.winner === user?.id ? (
            <p className="text-green-400 font-semibold">{t('game.resultWin')}</p>
          ) : (
            <p className="text-red-400 font-semibold">{t('game.resultLose')}</p>
          )}
        </div>
      )}

      {drawOfferedBy && drawOfferedBy !== user?.id && (
        <div className="text-center p-3 rounded-lg bg-blue-900/30 border border-blue-500/30 text-sm">
          <p className="mb-2">{t('game.drawOffered')}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => socket?.emit('game:accept_draw', roomId)}
              className="px-3 py-1 bg-green-700 hover:bg-green-600 rounded text-xs"
            >
              {t('game.accept')}
            </button>
            <button
              onClick={() => socket?.emit('game:decline_draw', roomId)}
              className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-xs"
            >
              {t('game.decline')}
            </button>
          </div>
        </div>
      )}

      {gameState.status === 'in_progress' && !result && (
        <div className="flex gap-2">
          <button
            onClick={() => socket?.emit('game:offer_draw', roomId)}
            className="flex-1 py-2 text-xs border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
          >
            {t('game.offerDraw')}
          </button>
          <button
            onClick={() => resign(roomId)}
            className="flex-1 py-2 text-xs border border-red-800 hover:border-red-600 text-red-400 rounded-lg transition-colors"
          >
            {t('game.resign')}
          </button>
        </div>
      )}
    </div>
  );
}
