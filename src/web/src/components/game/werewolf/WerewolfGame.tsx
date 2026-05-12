import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/store/game';
import { useAuthStore } from '@/store/auth';
import { ChatBox } from '@/components/game/shared/ChatBox';
import playerImg from '@/public/image/player.jpg';
import imgVillager        from '@/public/image/werewolf/villager.jpg';
import imgWerewolf        from '@/public/image/werewolf/werewolf.jpg';
import imgSeer            from '@/public/image/werewolf/seeder.jpg';
import imgDoctor          from '@/public/image/werewolf/guardian.jpg';
import imgSheriff         from '@/public/image/werewolf/sheriff.jpg';
import imgJester          from '@/public/image/werewolf/misanthropist.jpg';
import imgHunter          from '@/public/image/werewolf/hunter.jpg';
import imgWitch           from '@/public/image/werewolf/witch.jpg';
import imgCupid           from '@/public/image/werewolf/cupid.jpg';
import imgLittleGirl      from '@/public/image/werewolf/smallgirl.jpg';
import imgTwoSisters      from '@/public/image/werewolf/twosisters.jpg';
import imgThreeBrothers   from '@/public/image/werewolf/threebrothers.jpg';
import imgStutteringJudge from '@/public/image/werewolf/judge.jpg';
import imgRustyKnight     from '@/public/image/werewolf/knight.jpg';
import imgDevotedServant  from '@/public/image/werewolf/humble.jpg';
import imgWildChild       from '@/public/image/werewolf/wildchild.jpg';
import imgIdiot           from '@/public/image/werewolf/goofyyoungman.jpg';
import imgDrunk           from '@/public/image/werewolf/drunkard.jpg';
import imgWolfCub         from '@/public/image/werewolf/werewolfcub.jpg';
import imgDogWolf         from '@/public/image/werewolf/hybridwolf.jpg';
import imgBigBadWolf      from '@/public/image/werewolf/hulkingwerewolf.jpg';
import imgWolfFather      from '@/public/image/werewolf/werewolffigure.jpg';
import imgHiddenWolf      from '@/public/image/werewolf/wolfhides.jpg';
import imgWolfSorcerer    from '@/public/image/werewolf/werewolfsorcerer.jpg';
import imgThief           from '@/public/image/werewolf/thief.jpg';
import imgCursed          from '@/public/image/werewolf/tormentedvillager.jpg';
import imgAvenger         from '@/public/image/werewolf/vengeful.jpg';
import imgActor           from '@/public/image/werewolf/impostor.jpg';
import imgWhiteWolf       from '@/public/image/werewolf/whitewolf.jpg';
import imgAngel           from '@/public/image/werewolf/angelic.jpg';
import imgElder           from '@/public/image/werewolf/villageelder.jpg';

const ROLE_IMAGES: Record<string, string> = {
  villager:        imgVillager,
  werewolf:        imgWerewolf,
  seer:            imgSeer,
  doctor:          imgDoctor,
  sheriff:         imgSheriff,
  jester:          imgJester,
  hunter:          imgHunter,
  witch:           imgWitch,
  cupid:           imgCupid,
  little_girl:     imgLittleGirl,
  two_sisters:     imgTwoSisters,
  three_brothers:  imgThreeBrothers,
  stuttering_judge: imgStutteringJudge,
  rusty_knight:    imgRustyKnight,
  devoted_servant: imgDevotedServant,
  wild_child:      imgWildChild,
  idiot:           imgIdiot,
  drunk:           imgDrunk,
  wolf_cub:        imgWolfCub,
  dog_wolf:        imgDogWolf,
  big_bad_wolf:    imgBigBadWolf,
  wolf_father:     imgWolfFather,
  hidden_wolf:     imgHiddenWolf,
  wolf_sorcerer:   imgWolfSorcerer,
  thief:           imgThief,
  cursed:          imgCursed,
  avenger:         imgAvenger,
  actor:           imgActor,
  white_wolf:      imgWhiteWolf,
  angel:           imgAngel,
  elder:           imgElder,
};
import { WolfChatBox } from '@/components/game/werewolf/WolfChatBox';

interface WerewolfPublicState {
  phase: 'night' | 'day_discussion' | 'day_vote';
  round: number;
  phaseEndsAt: number;
  alivePlayers: string[];
  deadPlayers: { userId: string; revealedRole: string }[];
  votes: Record<string, string | null>;
  lastKilled?: string;
  lastExecuted?: string;
  lastNoExecute?: boolean;
  nightActionsDone: Record<string, boolean>;
  roleCounts?: Partial<Record<string, number>>;
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

const ROLE_CARD_STYLES: Record<string, string> = {
  // Village
  villager:         'bg-green-950  border-green-800',
  seer:             'bg-purple-950 border-purple-700',
  doctor:           'bg-blue-950   border-blue-700',
  sheriff:          'bg-yellow-950 border-yellow-700',
  hunter:           'bg-lime-950   border-lime-700',
  witch:            'bg-teal-950   border-teal-700',
  cupid:            'bg-pink-950   border-pink-600',
  little_girl:      'bg-rose-950   border-rose-700',
  two_sisters:      'bg-green-950  border-green-700',
  three_brothers:   'bg-green-950  border-green-700',
  stuttering_judge: 'bg-amber-950  border-amber-700',
  rusty_knight:     'bg-slate-950  border-slate-600',
  devoted_servant:  'bg-green-950  border-green-600',
  wild_child:       'bg-emerald-950 border-emerald-700',
  idiot:            'bg-green-950  border-green-500',
  drunk:            'bg-green-950  border-green-500',
  // Werewolf
  werewolf:         'bg-red-950    border-red-800',
  wolf_cub:         'bg-red-950    border-red-700',
  dog_wolf:         'bg-orange-950 border-orange-700',
  big_bad_wolf:     'bg-red-950    border-red-500',
  wolf_father:      'bg-red-950    border-red-400',
  hidden_wolf:      'bg-red-950    border-red-900',
  wolf_sorcerer:    'bg-fuchsia-950 border-fuchsia-700',
  // Third party
  thief:            'bg-gray-900   border-gray-600',
  cursed:           'bg-violet-950 border-violet-700',
  avenger:          'bg-gray-950   border-gray-500',
  actor:            'bg-gray-950   border-gray-400',
  // Neutral
  jester:           'bg-pink-950   border-pink-700',
  white_wolf:       'bg-zinc-900   border-zinc-500',
  angel:            'bg-sky-950    border-sky-600',
  elder:            'bg-brown-950  border-yellow-800',
};

const ROLE_ICONS: Record<string, string> = {
  // Village
  villager:         '🏘',
  seer:             '🔮',
  doctor:           '💊',
  sheriff:          '🔰',
  hunter:           '🏹',
  witch:            '🧙',
  cupid:            '💘',
  little_girl:      '👧',
  two_sisters:      '👭',
  three_brothers:   '👬',
  stuttering_judge: '⚖️',
  rusty_knight:     '🗡️',
  devoted_servant:  '🫡',
  wild_child:       '🌿',
  idiot:            '🤪',
  drunk:            '🍺',
  // Werewolf
  werewolf:         '🐺',
  wolf_cub:         '🐶',
  dog_wolf:         '🐕',
  big_bad_wolf:     '😈',
  wolf_father:      '🦴',
  hidden_wolf:      '🥷',
  wolf_sorcerer:    '🔮',
  // Third party
  thief:            '🦝',
  cursed:           '💀',
  avenger:          '⚔️',
  actor:            '🎭',
  // Neutral
  jester:           '🃏',
  white_wolf:       '🤍',
  angel:            '😇',
  elder:            '🧓',
};

export function WerewolfGame({ roomId }: Props) {
  const { t } = useTranslation();
  const gameState = useGameStore((s) => s.gameState);
  const privateInfo = useGameStore((s) => s.privateInfo);
  const { sendMove, skipPhase, leaveRoom, playAgain } = useGameStore();
  const result = useGameStore((s) => s.result);
  const user = useAuthStore((s) => s.user);

  const [hasActed, setHasActed] = useState(false);

  const boardState = gameState?.boardState as WerewolfPublicState | undefined;
  const phase = boardState?.phase;

  useEffect(() => {
    setHasActed(false);
  }, [phase]);

  const countdown = useCountdown(boardState?.phaseEndsAt ?? Date.now());

  const doAction = useCallback((action: string, targetId?: string) => {
    sendMove(roomId, { action, targetId: targetId ?? null });
    setHasActed(true);
  }, [roomId, sendMove]);

  if (!gameState || !boardState || !user) return null;

  if (result) {
    const villageWon = result.reason === 'village_eliminated_wolves';
    const myTeam = privateInfo?.team ?? 'village';
    const iWon = villageWon ? myTeam === 'village' : myTeam === 'werewolf';
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="bg-gray-900 rounded-2xl p-10 flex flex-col items-center gap-6 max-w-sm w-full text-center shadow-2xl">
          <div className="text-5xl">{villageWon ? '🏘' : '🐺'}</div>
          <div className="text-2xl font-bold text-white">
            {villageWon ? t('werewolf.resultVillageWin') : t('werewolf.resultWolfWin')}
          </div>
          <div className={`text-lg font-semibold ${iWon ? 'text-green-400' : 'text-red-400'}`}>
            {iWon ? t('werewolf.resultYouWin') : t('werewolf.resultYouLose')}
          </div>
          <div className="text-sm text-gray-400">
            {villageWon ? t('werewolf.resultReasonVillage') : t('werewolf.resultReasonWolf')}
          </div>
          <button
            onClick={() => playAgain()}
            className="mt-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-white transition"
          >
            {t('werewolf.playAgain')}
          </button>
        </div>
      </div>
    );
  }

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

  const aliveNonWolves = boardState.alivePlayers.filter((id) => !wolfTeamIds.includes(id));
  const aliveAll = boardState.alivePlayers;

  const tally: Record<string, number> = {};
  for (const targetId of Object.values(boardState.votes)) {
    if (targetId) tally[targetId] = (tally[targetId] ?? 0) + 1;
  }
  const myVote = boardState.votes[user.id];

  const roleDesc: Record<string, string> = {
    villager:         t('werewolf.descVillager'),
    werewolf:         t('werewolf.descWerewolf'),
    seer:             t('werewolf.descSeer'),
    doctor:           t('werewolf.descDoctor'),
    sheriff:          t('werewolf.descSheriff'),
    jester:           t('werewolf.descJester'),
    hunter:           t('werewolf.descHunter'),
    witch:            t('werewolf.descWitch'),
    cupid:            t('werewolf.descCupid'),
    little_girl:      t('werewolf.descLittleGirl'),
    two_sisters:      t('werewolf.descTwoSisters'),
    three_brothers:   t('werewolf.descThreeBrothers'),
    stuttering_judge: t('werewolf.descStutteringJudge'),
    rusty_knight:     t('werewolf.descRustyKnight'),
    devoted_servant:  t('werewolf.descDevotedServant'),
    wild_child:       t('werewolf.descWildChild'),
    idiot:            t('werewolf.descIdiot'),
    drunk:            t('werewolf.descDrunk'),
    wolf_cub:         t('werewolf.descWolfCub'),
    dog_wolf:         t('werewolf.descDogWolf'),
    big_bad_wolf:     t('werewolf.descBigBadWolf'),
    wolf_father:      t('werewolf.descWolfFather'),
    hidden_wolf:      t('werewolf.descHiddenWolf'),
    wolf_sorcerer:    t('werewolf.descWolfSorcerer'),
    thief:            t('werewolf.descThief'),
    cursed:           t('werewolf.descCursed'),
    avenger:          t('werewolf.descAvenger'),
    actor:            t('werewolf.descActor'),
    white_wolf:       t('werewolf.descWhiteWolf'),
    angel:            t('werewolf.descAngel'),
    elder:            t('werewolf.descElder'),
  };

  const roleLabel: Record<string, string> = {
    villager:         t('werewolf.roleVillager'),
    werewolf:         t('werewolf.roleWerewolf'),
    seer:             t('werewolf.roleSeer'),
    doctor:           t('werewolf.roleDoctor'),
    sheriff:          t('werewolf.roleSheriff'),
    jester:           t('werewolf.roleJester'),
    hunter:           t('werewolf.roleHunter'),
    witch:            t('werewolf.roleWitch'),
    cupid:            t('werewolf.roleCupid'),
    little_girl:      t('werewolf.roleLittleGirl'),
    two_sisters:      t('werewolf.roleTwoSisters'),
    three_brothers:   t('werewolf.roleThreeBrothers'),
    stuttering_judge: t('werewolf.roleStutteringJudge'),
    rusty_knight:     t('werewolf.roleRustyKnight'),
    devoted_servant:  t('werewolf.roleDevotedServant'),
    wild_child:       t('werewolf.roleWildChild'),
    idiot:            t('werewolf.roleIdiot'),
    drunk:            t('werewolf.roleDrunk'),
    wolf_cub:         t('werewolf.roleWolfCub'),
    dog_wolf:         t('werewolf.roleDogWolf'),
    big_bad_wolf:     t('werewolf.roleBigBadWolf'),
    wolf_father:      t('werewolf.roleWolfFather'),
    hidden_wolf:      t('werewolf.roleHiddenWolf'),
    wolf_sorcerer:    t('werewolf.roleWolfSorcerer'),
    thief:            t('werewolf.roleThief'),
    cursed:           t('werewolf.roleCursed'),
    avenger:          t('werewolf.roleAvenger'),
    actor:            t('werewolf.roleActor'),
    white_wolf:       t('werewolf.roleWhiteWolf'),
    angel:            t('werewolf.roleAngel'),
    elder:            t('werewolf.roleElder'),
  };

  const isAlive = aliveSet.has(user.id);
  const isHost = (gameState.createdBy ?? players[0]?.userId) === user.id;
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
              >
                ⏭ {t('werewolf.skipPhase')}
              </button>
            )}
          </div>
        </div>

        {/* Last round summary */}
        {(boardState.lastKilled || boardState.lastExecuted || boardState.lastNoExecute || (!boardState.lastKilled && boardState.round > 1)) && (
          <div className="bg-gray-900 rounded-xl p-4 text-sm space-y-1">
            {boardState.lastKilled
              ? <p className="text-red-400">{t('werewolf.killed', { name: getUsername(boardState.lastKilled) })}</p>
              : boardState.round > 1 && !boardState.lastExecuted && !boardState.lastNoExecute
                ? <p className="text-green-400">{t('werewolf.noKill')}</p>
                : null}
            {boardState.lastExecuted && (
              <p className="text-orange-400">{t('werewolf.executed', { name: getUsername(boardState.lastExecuted) })}</p>
            )}
            {boardState.lastNoExecute && (
              <p className="text-blue-400">{t('werewolf.noExecute')}</p>
            )}
          </div>
        )}


        {/* Roles in room */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {t('werewolf.rolesInGame')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(boardState.roleCounts ?? {}).map(([role, count]) => (
              <div
                key={role}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${ROLE_CARD_STYLES[role] ?? 'bg-gray-800 border-gray-700 text-gray-300'}`}
              >
                <span className="text-base leading-none">{ROLE_ICONS[role] ?? '❓'}</span>
                <span className="text-white">{roleLabel[role] ?? role}</span>
                {(count ?? 0) > 1 && <span className="text-gray-400">×{count}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Player cards */}
        <div className="bg-gray-900 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t('roomLobby.players')}
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {players.map((player) => {
              const alive = aliveSet.has(player.userId);
              const deadInfo = boardState.deadPlayers.find((d) => d.userId === player.userId);
              const voteCount = tally[player.userId] ?? 0;
              const hasVotedFor = boardState.votes[user.id] === player.userId;
              const isMe = player.userId === user.id;
              const cardRole = deadInfo?.revealedRole ?? (isMe ? myRole : undefined);
              const cardImg = (cardRole && ROLE_IMAGES[cardRole]) ?? playerImg;
              return (
                <div key={player.userId} className="flex flex-col gap-1">
                  <div
                    className={`relative rounded-xl overflow-hidden border transition
                      ${alive ? 'border-gray-700' : 'border-gray-700 opacity-40 grayscale'}
                      ${hasVotedFor ? 'ring-2 ring-orange-400' : ''}
                    `}
                  >
                    <img
                      src={cardImg}
                      alt={player.username}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    {/* Vote badge */}
                    {phase === 'day_vote' && alive && voteCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 text-xs bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">
                        {voteCount}
                      </span>
                    )}
                    {/* Dead role icon */}
                    {deadInfo && (
                      <span className="absolute top-1.5 left-1.5 text-lg leading-none drop-shadow">
                        {ROLE_ICONS[deadInfo.revealedRole] ?? '☠'}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-medium truncate text-center ${alive ? 'text-white' : 'text-gray-500'}`}>
                    {player.username}{isMe && <span className="text-indigo-400"> ★</span>}
                  </p>
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
              {ROLE_IMAGES[myRole] ? (
                <img
                  src={ROLE_IMAGES[myRole]}
                  alt={myRole}
                  className="w-24 h-32 object-cover rounded-xl mx-auto mb-2 border border-gray-700"
                />
              ) : (
                <div className="text-4xl mb-1">{ROLE_ICONS[myRole] ?? '❓'}</div>
              )}
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
                    onClick={() => doAction('vote', myVote === id ? undefined : id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${myVote === id ? 'bg-orange-600 text-white ring-2 ring-orange-400' : 'bg-orange-900 hover:bg-orange-800 text-orange-100'}`}
                  >
                    ⚖️ {getUsername(id)}
                    {tally[id] ? <span className="ml-2 text-xs text-orange-300">({tally[id]})</span> : null}
                  </button>
                ))}
                <button
                  onClick={() => doAction('vote')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${myVote === null ? 'bg-gray-500 text-white ring-2 ring-gray-400' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
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
        {phase === 'night' && isWolf && <WolfChatBox roomId={roomId} />}
        <ChatBox roomId={roomId} />
      </div>
    </div>
  );
}
