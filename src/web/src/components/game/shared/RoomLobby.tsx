import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/game';
import { useAuthStore } from '@/store/auth';
import { useRoleLabel } from '@/components/game/werewolf/hooks/useRoleLabel';
import { RoleConfigPanel } from './RoleConfigPanel';

interface Props {
  roomId: string;
}

export function RoomLobby({ roomId }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const room = useGameStore((s) => s.room);
  const realtimeError = useGameStore((s) => s.realtimeError);
  const { markReady, startGame, leaveRoom, setCustomRoles } = useGameStore();
  const user = useAuthStore((s) => s.user);
  const { roleLabel } = useRoleLabel();

  function handleLeave() {
    leaveRoom(roomId);
    navigate('/lobby');
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">⏳</div>
          <p>{t('roomLobby.loading')}</p>
        </div>
      </div>
    );
  }

  const isHost = user?.id === room.createdBy;
  const me = room.players.find((p) => p.userId === user?.id);

  const customTotal = room.customRoles
    ? Object.values(room.customRoles).reduce((s, n) => s + n, 0)
    : 0;
  const rolesMatchPlayers = room.customRoles ? customTotal === room.players.length : true;
  const startDisabled =
    room.players.length < (room.gameType === 'werewolf' ? 4 : 2) ||
    (!!room.customRoles && !rolesMatchPlayers);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
      <div className="bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">{room.gameType.toUpperCase()}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {t('roomLobby.roomCode')}:{' '}
            <span className="font-mono text-yellow-400">{room.inviteCode}</span>
          </p>
        </div>
        {realtimeError && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {realtimeError}
          </p>
        )}

        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t('roomLobby.players')}
          </h2>
          <div className="space-y-2">
            {room.players.map((player) => (
              <div
                key={player.userId}
                className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
                    {player.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-white">{player.username}</p>
                    {player.userId === room.createdBy && (
                      <p className="text-xs text-yellow-400">{t('roomLobby.host')}</p>
                    )}
                  </div>
                </div>
                <div>
                  {player.userId === room.createdBy ? (
                    <span className="text-xs text-gray-500 italic">—</span>
                  ) : player.isReady ? (
                    <span className="text-xs bg-green-700 text-green-200 px-2 py-1 rounded-full">
                      {t('roomLobby.ready')}
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded-full">
                      {t('roomLobby.waiting')}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {room.players.length < room.maxPlayers && (
              <div className="flex items-center justify-center bg-gray-800 rounded-lg px-4 py-3 border-2 border-dashed border-gray-700">
                <p className="text-gray-500 text-sm">{t('roomLobby.waitingForPlayer')}</p>
              </div>
            )}
          </div>
        </div>

        {room.gameType === 'werewolf' && (
          <RoleConfigPanel
            playerCount={room.players.length}
            customRoles={room.customRoles}
            isHost={isHost}
            roleLabel={roleLabel}
            onSave={(roles) => setCustomRoles(roomId, roles)}
          />
        )}

        <div className="pt-2 space-y-3">
          {isHost ? (
            <>
              <button
                onClick={() => startGame(roomId)}
                disabled={startDisabled}
                className="w-full py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {t('roomLobby.start')}
              </button>
              {room.customRoles && !rolesMatchPlayers && (
                <p className="text-xs text-red-400 text-center">
                  {t('roomLobby.roleMismatch', {
                    total: customTotal,
                    players: room.players.length,
                  })}
                </p>
              )}
            </>
          ) : (
            <button
              onClick={() => markReady(roomId)}
              disabled={!!me?.isReady}
              className="w-full py-3 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {me?.isReady ? t('roomLobby.alreadyReady') : t('roomLobby.markReady')}
            </button>
          )}
          <button
            onClick={handleLeave}
            className="w-full py-3 rounded-xl font-semibold text-red-400 border border-red-800 hover:bg-red-900/30 transition"
          >
            {t('roomLobby.leave')}
          </button>
        </div>
      </div>
    </div>
  );
}
