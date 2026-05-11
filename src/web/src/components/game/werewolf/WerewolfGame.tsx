import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/store/game';
import { useAuthStore } from '@/store/auth';
import { ChatBox } from '@/components/game/shared/ChatBox';

interface WerewolfPublicState {
  phase: 'night' | 'day_discussion' | 'day_vote';
  round: number;
  phaseEndsAt: number;
  alivePlayers: string[];
  deadPlayers: { userId: string; revealedRole: string }[];
  votes: Record<string, string | null>;
  lastKilled?: string;
  lastExecuted?: string;
  nightActionsDone: Record<string, boolean>;
}

interface Props {
  roomId: string;
}

function useCountdown(phaseEndsAt: number) {
  const [secs, setSecs] = useState(() => Math.max(0, Math.round((phaseEndsAt - Date.now()) / 1000)));
  useEffect(() => {
    const update = () => setSecs(Math.max(0, Math.round((phaseEndsAt - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [phaseEndsAt]);
  return secs;
}

const ROLE_ICONS: Record<string, string> = {
  villager: '🏘',
  werewolf: '🐺',
  alpha_werewolf: '👑',
  seer: '🔮',
  doctor: '💊',
  sheriff: '🔰',
  jester: '🃏',
};

export function WerewolfGame({ roomId }: Props) {
  const { t } = useTranslation();
  const gameState = useGameStore((s) => s.gameState);
  const privateInfo = useGameStore((s) => s.privateInfo);
  const { sendMove, skipPhase } = useGameStore();
  const user = useAuthStore((s) => s.user);

  const [hasActed, setHasActed] = useState(false);

  const boardState = gameState?.boardState as WerewolfPublicState | undefined;
  const phase = boardState?.phase;

  // Reset hasActed when phase changes
  useEffect(() => {
    setHasActed(false);
  }, [phase]);

  const countdown = useCountdown(boardState?.phaseEndsAt ?? Date.now());

  const doAction = useCallback((action: string, targetId?: string) => {
    sendMove(roomId, { action, targetId: targetId ?? null });
    setHasActed(true);
  }, [roomId, sendMove]);

  if (!gameState || !boardState || !user) return null;

  const players = gameState.players;
  const aliveSet = new Set(boardState.alivePlayers);
  const myRole = privateInfo?.role ?? '';
  const myTeam = privateInfo?.team ?? '';
  const wolfTeamIds = privateInfo?.wolfTeam ?? [];

  function getUsername(userId: string) {
    return players.find((p) => p.userId === userId)?.username ?? userId;
  }

  const phaseLabel =
    phase === 'night' ? t('werewolf.night')
      : phase === 'day_discussion' ? t('werewolf.dayDiscussion')
        : t('werewolf.dayVote');

  // Night action targets
  const aliveNonWolves = boardState.alivePlayers.filter((id) => {
    const p = players.find((pl) => pl.userId === id);
    return p && !wolfTeamIds.includes(id);
  });
  const aliveAll = boardState.alivePlayers;

  // Vote tally
  const tally: Record<string, number> = {};
  for (const targetId of Object.values(boardState.votes)) {
    if (targetId) tally[targetId] = (tally[targetId] ?? 0) + 1;
  }
  const myVote = boardState.votes[user.id];

  const roleDesc: Record<string, string> = {
    villager: t('werewolf.descVillager'),
    werewolf: t('werewolf.descWerewolf'),
    alpha_werewolf: t('werewolf.descAlphaWerewolf'),
    seer: t('werewolf.descSeer'),
    doctor: t('werewolf.descDoctor'),
    sheriff: t('werewolf.descSheriff'),
    jester: t('werewolf.descJester'),
  };

  const roleLabel: Record<string, string> = {
    villager: t('werewolf.roleVillager'),
    werewolf: t('werewolf.roleWerewolf'),
    alpha_werewolf: t('werewolf.roleAlphaWerewolf'),
    seer: t('werewolf.roleSeer'),
    doctor: t('werewolf.roleDoctor'),
    sheriff: t('werewolf.roleSheriff'),
    jester: t('werewolf.roleJester'),
  };

  const isAlive = aliveSet.has(user.id);
  const isHost = gameState.players[0]?.userId === user.id;
  const isWolf = myTeam === 'werewolf';
  const isSeer = myRole === 'seer';
  const isDoctor = myRole === 'doctor';
  const isSheriff = myRole === 'sheriff';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Left panel */}
      <div className="flex-1 flex flex-col p-6 gap-4">
        {/* Phase banner */}
        <div className="bg-gray-900 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-white">
              {phase === 'night' ? '🌙' : phase === 'day_discussion' ? '☀️' : '⚖️'} {phaseLabel}
            </div>
            <div className="text-gray-400 text-sm mt-1">
              {t('werewolf.round', { n: boardState.round })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-mono font-bold text-yellow-400">
              {countdown}s
            </div>
            {isHost && (
              <button
                onClick={() => skipPhase(roomId)}
                className="px-3 py-1.5 text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition"
                title={t('werewolf.skipPhase')}
              >
                ⏭ {t('werewolf.skipPhase')}
              </button>
            )}
          </div>
        </div>

        {/* Last round summary */}
        {(boardState.lastKilled || boardState.lastExecuted || (!boardState.lastKilled && boardState.round > 1)) && (
          <div className="bg-gray-900 rounded-xl p-4 text-sm space-y-1">
            {boardState.lastKilled
              ? <p className="text-red-400">{t('werewolf.killed', { name: getUsername(boardState.lastKilled) })}</p>
              : boardState.round > 1 && !boardState.lastExecuted
                ? <p className="text-green-400">{t('werewolf.noKill')}</p>
                : null}
            {boardState.lastExecuted && (
              <p className="text-orange-400">{t('werewolf.executed', { name: getUsername(boardState.lastExecuted) })}</p>
            )}
          </div>
        )}

        {/* Night actions submitted status (visible to all) */}
        {phase === 'night' && (
          <div className="bg-gray-900 rounded-xl p-4 text-sm">
            <p className="text-gray-400 font-semibold mb-2">{t('werewolf.actionsSubmitted')}</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(boardState.nightActionsDone).map(([role, done]) => (
                <span
                  key={role}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${done ? 'bg-green-800 text-green-200' : 'bg-gray-700 text-gray-400'}`}
                >
                  {ROLE_ICONS[role] ?? ''} {role}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Player list */}
        <div className="bg-gray-900 rounded-2xl p-5 flex-1">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t('roomLobby.players')}
          </h2>
          <div className="space-y-2">
            {players.map((player) => {
              const alive = aliveSet.has(player.userId);
              const deadInfo = boardState.deadPlayers.find((d) => d.userId === player.userId);
              const voteCount = tally[player.userId] ?? 0;
              const hasVotedFor = boardState.votes[user.id] === player.userId;
              return (
                <div
                  key={player.userId}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 ${alive ? 'bg-gray-800' : 'bg-gray-850 opacity-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${alive ? 'bg-indigo-600' : 'bg-gray-600'}`}>
                      {player.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className={`font-medium ${alive ? 'text-white' : 'text-gray-500'}`}>
                        {player.username}
                        {player.userId === user.id && <span className="text-xs text-indigo-400 ml-1">(you)</span>}
                      </p>
                      {deadInfo && (
                        <p className="text-xs text-gray-500">
                          {t('werewolf.dead')} — {ROLE_ICONS[deadInfo.revealedRole] ?? ''} {roleLabel[deadInfo.revealedRole] ?? deadInfo.revealedRole}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {phase === 'day_vote' && alive && voteCount > 0 && (
                      <span className="text-xs bg-orange-900 text-orange-200 px-2 py-0.5 rounded-full">
                        {t('werewolf.tally', { count: voteCount })}
                      </span>
                    )}
                    {phase === 'day_vote' && hasVotedFor && (
                      <span className="text-xs text-yellow-400">✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-80 flex flex-col gap-4 p-6">
        {/* Role card */}
        {privateInfo && (
          <div className="bg-gray-900 rounded-2xl p-5">
            <div className="text-center mb-3">
              <div className="text-4xl mb-1">{ROLE_ICONS[myRole] ?? '❓'}</div>
              <div className="text-lg font-bold text-white">{roleLabel[myRole] ?? myRole}</div>
              <div className="text-sm text-gray-400 mt-1">{roleDesc[myRole] ?? ''}</div>
            </div>
            {wolfTeamIds.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400 font-semibold">{t('werewolf.yourPack')}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {wolfTeamIds.map((wid) => (
                    <span key={wid} className="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded-full">
                      {getUsername(wid)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* Investigate result banner */}
            {(isSeer || isSheriff) && privateInfo.investigateResult !== undefined && privateInfo.investigateTarget && (
              <div className={`mt-3 pt-3 border-t border-gray-700 rounded-lg p-2 text-sm text-center font-semibold ${privateInfo.investigateResult ? 'text-red-300 bg-red-950' : 'text-green-300 bg-green-950'}`}>
                {getUsername(privateInfo.investigateTarget)}: {privateInfo.investigateResult
                  ? t('werewolf.investigateResultWolf')
                  : t('werewolf.investigateResultSafe')}
              </div>
            )}
          </div>
        )}

        {/* Action panel */}
        <div className="bg-gray-900 rounded-2xl p-5 flex-1">
          {phase === 'night' && isAlive && (
            <>
              {isWolf && !hasActed && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">{t('werewolf.pickToKill')}</p>
                  <div className="space-y-2">
                    {aliveNonWolves.map((id) => (
                      <button
                        key={id}
                        onClick={() => doAction('kill', id)}
                        className="w-full text-left px-3 py-2 bg-red-900 hover:bg-red-800 rounded-lg text-sm text-red-100 transition"
                      >
                        🎯 {getUsername(id)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {isDoctor && !hasActed && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">{t('werewolf.pickToProtect')}</p>
                  <div className="space-y-2">
                    {aliveAll.map((id) => (
                      <button
                        key={id}
                        onClick={() => doAction('protect', id)}
                        className="w-full text-left px-3 py-2 bg-blue-900 hover:bg-blue-800 rounded-lg text-sm text-blue-100 transition"
                      >
                        🛡 {getUsername(id)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {(isSeer || isSheriff) && !hasActed && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">{t('werewolf.pickToInvestigate')}</p>
                  <div className="space-y-2">
                    {aliveAll.filter((id) => id !== user.id).map((id) => (
                      <button
                        key={id}
                        onClick={() => doAction('investigate', id)}
                        className="w-full text-left px-3 py-2 bg-purple-900 hover:bg-purple-800 rounded-lg text-sm text-purple-100 transition"
                      >
                        🔍 {getUsername(id)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!isWolf && !isDoctor && !isSeer && !isSheriff && (
                <p className="text-gray-500 text-sm text-center">{t('werewolf.waitingNight')}</p>
              )}
              {hasActed && (
                <p className="text-green-400 text-sm text-center">{t('werewolf.alreadyActed')}</p>
              )}
            </>
          )}

          {phase === 'day_discussion' && (
            <p className="text-gray-400 text-sm text-center">
              {t('werewolf.waitingDiscussion', { s: countdown })}
            </p>
          )}

          {phase === 'day_vote' && isAlive && (
            <div>
              {myVote !== undefined ? (
                <p className="text-yellow-400 text-sm mb-3">
                  {t('werewolf.votedFor', { name: myVote ? getUsername(myVote) : t('werewolf.skipVote') })}
                </p>
              ) : (
                <p className="text-sm text-gray-400 mb-3">{t('werewolf.voteTitle')}</p>
              )}
              <div className="space-y-2">
                {boardState.alivePlayers.filter((id) => id !== user.id).map((id) => (
                  <button
                    key={id}
                    onClick={() => doAction('vote', id)}
                    disabled={myVote !== undefined}
                    className="w-full text-left px-3 py-2 bg-orange-900 hover:bg-orange-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm text-orange-100 transition"
                  >
                    ⚖️ {getUsername(id)}
                    {tally[id] ? <span className="ml-2 text-xs text-orange-300">({tally[id]})</span> : null}
                  </button>
                ))}
                <button
                  onClick={() => doAction('vote')}
                  disabled={myVote !== undefined}
                  className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm text-gray-300 transition"
                >
                  {t('werewolf.skipVote')}
                </button>
              </div>
            </div>
          )}

          {!isAlive && (
            <p className="text-gray-500 text-sm text-center">
              ☠ {t('werewolf.dead')}
            </p>
          )}
        </div>

        {/* Chat */}
        <ChatBox roomId={roomId} />
      </div>
    </div>
  );
}
