import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/store/game';
import { useAuthStore } from '@/store/auth';
import { ChatBox } from '@/components/game/shared/ChatBox';
import type { WerewolfPublicState } from './types';
import { useCountdown } from './hooks/useCountdown';
import { useRoleLabel } from './hooks/useRoleLabel';
import { PhaseBanner } from './components/PhaseBanner';
import { PlayerGrid } from './components/PlayerGrid';
import { RoleCard } from './components/RoleCard';
import { ActionPanel } from './components/ActionPanel';
import { RolesInRoom } from './components/RolesInRoom';
import { ResultScreen } from './components/ResultScreen';
import { WolfChatWrapper } from './components/WolfChatWrapper';

interface Props {
  roomId: string;
}

export function WerewolfGame({ roomId }: Props) {
  const { t } = useTranslation();
  const gameState = useGameStore((s) => s.gameState);
  const privateInfo = useGameStore((s) => s.privateInfo);
  const { sendMove, skipPhase, leaveRoom, playAgain } = useGameStore();
  const result = useGameStore((s) => s.result);
  const user = useAuthStore((s) => s.user);

  const [hasActed, setHasActed] = useState(false);
  const [cardRevealed, setCardRevealed] = useState(false);

  const boardState = gameState?.boardState as WerewolfPublicState | undefined;
  const phase = boardState?.phase;

  useEffect(() => {
    setHasActed(false);
  }, [phase]);

  const countdown = useCountdown(boardState?.phaseEndsAt ?? Date.now());
  const { roleLabel, roleDesc } = useRoleLabel();

  const doAction = useCallback(
    (action: string, targetId?: string) => {
      sendMove(roomId, { action, targetId: targetId ?? null });
      setHasActed(true);
    },
    [roomId, sendMove],
  );

  const doWitchAction = useCallback(
    (action: string, targetId?: string) => {
      sendMove(roomId, { action, targetId: targetId ?? null });
    },
    [roomId, sendMove],
  );

  const doHunterAction = useCallback(
    (action: string, targetId?: string) => {
      sendMove(roomId, { action, targetId: targetId ?? null });
    },
    [roomId, sendMove],
  );

  const doCupidAction = useCallback(
    (targetId: string, targetId2: string) => {
      sendMove(roomId, { action: 'cupid_pair', targetId, targetId2 });
      setHasActed(true);
    },
    [roomId, sendMove],
  );

  if (!gameState || !boardState || !user) return null;

  const players = gameState.players;
  const aliveSet = new Set(boardState.alivePlayers);
  const myRole = privateInfo?.role ?? '';
  const myTeam = privateInfo?.team ?? '';
  const wolfTeamIds = privateInfo?.wolfTeam ?? [];

  function getUsername(userId: string) {
    return players.find((p) => p.userId === userId)?.username ?? userId;
  }

  if (result) {
    const villageWon = result.reason === 'village_eliminated_wolves';
    const myTeamFinal = privateInfo?.team ?? 'village';
    const iWon = villageWon ? myTeamFinal === 'village' : myTeamFinal === 'werewolf';

    return (
      <ResultScreen
        villageWon={villageWon}
        iWon={iWon}
        allPlayers={gameState.players}
        deadList={boardState.deadPlayers}
        survivorIds={new Set(boardState.alivePlayers)}
        eventLog={boardState.eventLog ?? []}
        myUserId={user.id}
        myRole={privateInfo?.role}
        allRoles={result.allRoles}
        roleLabel={roleLabel}
        onPlayAgain={() => playAgain()}
      />
    );
  }

  const aliveNonWolves = boardState.alivePlayers.filter((id) => !wolfTeamIds.includes(id));
  const aliveAll = boardState.alivePlayers;

  const tally: Record<string, number> = {};
  for (const targetId of Object.values(boardState.votes)) {
    if (targetId) tally[targetId] = (tally[targetId] ?? 0) + 1;
  }
  const myVote = boardState.votes[user.id];

  const wolfVotes = privateInfo?.wolfVotes ?? {};
  const wolfKillTally: Record<string, number> = {};
  for (const targetId of Object.values(wolfVotes)) {
    wolfKillTally[targetId] = (wolfKillTally[targetId] ?? 0) + 1;
  }
  const myWolfVote = wolfVotes[user.id];

  const isAlive = aliveSet.has(user.id);
  const isHost = (gameState.createdBy ?? players[0]?.userId) === user.id;
  const isWolf = myTeam === 'werewolf';
  const isSeer = myRole === 'seer';
  const isGuard = myRole === 'guard';
  const isSheriff = myRole === 'sheriff';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Left panel */}
      <div className="flex-1 flex flex-col p-6 gap-4">
        <PhaseBanner
          phase={phase!}
          round={boardState.round}
          countdown={countdown}
          isHost={isHost}
          roomId={roomId}
          onSkipPhase={skipPhase}
        />

        {/* Last round summary */}
        {(boardState.lastKilled ||
          boardState.lastExecuted ||
          boardState.lastNoExecute ||
          (!boardState.lastKilled && boardState.round > 1)) && (
          <div className="bg-gray-900 rounded-xl p-4 text-sm space-y-1">
            {boardState.lastKilled ? (
              <p className="text-red-400">
                {t('werewolf.killed', { name: getUsername(boardState.lastKilled) })}
              </p>
            ) : boardState.round > 1 && !boardState.lastExecuted && !boardState.lastNoExecute ? (
              <p className="text-green-400">{t('werewolf.noKill')}</p>
            ) : null}
            {boardState.lastExecuted && (
              <p className="text-orange-400">
                {t('werewolf.executed', { name: getUsername(boardState.lastExecuted) })}
              </p>
            )}
            {boardState.lastNoExecute && <p className="text-blue-400">{t('werewolf.noExecute')}</p>}
          </div>
        )}

        <RolesInRoom roleCounts={boardState.roleCounts} roleLabel={roleLabel} />

        <PlayerGrid
          players={players}
          aliveSet={aliveSet}
          deadPlayers={boardState.deadPlayers}
          votes={boardState.votes}
          phase={phase!}
          myUserId={user.id}
          playersLabel={t('roomLobby.players')}
        />
      </div>

      {/* Right panel */}
      <div className="w-80 flex flex-col gap-4 p-6">
        {privateInfo && (
          <RoleCard
            myRole={myRole}
            cardRevealed={cardRevealed}
            onCardReveal={setCardRevealed}
            roleLabel={roleLabel}
            roleDesc={roleDesc}
            wolfTeamIds={wolfTeamIds}
            getUsername={getUsername}
            investigateResult={privateInfo.investigateResult}
            investigateTarget={privateInfo.investigateTarget}
            isSeer={isSeer}
            isSheriff={isSheriff}
            sisterIds={privateInfo.sisterIds}
            brotherIds={privateInfo.brotherIds}
            round={boardState.round}
          />
        )}

        <ActionPanel
          phase={phase!}
          isAlive={isAlive}
          isWolf={isWolf}
          isGuard={isGuard}
          isSeer={isSeer}
          myRole={myRole}
          myTeam={myTeam}
          witchSaveUsed={privateInfo?.witchSaveUsed}
          witchPoisonUsed={privateInfo?.witchPoisonUsed}
          witchKillTarget={privateInfo?.witchKillTarget}
          hasActed={hasActed}
          aliveNonWolves={aliveNonWolves}
          aliveAll={aliveAll}
          wolfTeamIds={wolfTeamIds}
          myUserId={user.id}
          myVote={myVote}
          tally={tally}
          myWolfVote={myWolfVote}
          wolfKillTally={wolfKillTally}
          alivePlayers={boardState.alivePlayers}
          countdown={countdown}
          getUsername={getUsername}
          doAction={doAction}
          doWitchAction={doWitchAction}
          hunterTarget={privateInfo?.hunterTarget}
          doHunterAction={doHunterAction}
          doCupidAction={doCupidAction}
          nightActionsDone={boardState.nightActionsDone}
          wolfFatherUsed={boardState.wolfFatherUsed}
          wolfSorcererUses={boardState.wolfSorcererUses}
          bigBadWolfKillsActive={boardState.bigBadWolfKillsActive}
          stutteringJudgeUsed={boardState.stutteringJudgeUsed}
          thiefCards={privateInfo?.thiefCards}
          round={boardState.round}
        />

        <WolfChatWrapper roomId={roomId} phase={phase!} isWolf={isWolf} />
        <ChatBox roomId={roomId} />
      </div>
    </div>
  );
}
