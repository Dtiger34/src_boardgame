import type { PlayerInfo, WerewolfState } from './types';
import { PHASE_DURATION, ROLE_TEAMS } from './constants';
import { buildRoleList, buildCustomRoleList } from './helpers';

export function initWerewolfGame(
  playerIds: string[],
  customRoles?: Record<string, number>,
): WerewolfState {
  const roles = customRoles ? buildCustomRoleList(customRoles) : buildRoleList(playerIds.length);
  const players: PlayerInfo[] = playerIds.map((userId, i) => ({
    userId,
    role: roles[i],
    team: ROLE_TEAMS[roles[i]],
    isAlive: true,
  }));
  const roleCounts: Partial<Record<string, number>> = {};
  for (const p of players) {
    roleCounts[p.role] = (roleCounts[p.role] ?? 0) + 1;
  }

  // Dog wolf starts as village; team chosen night 1 via dog_wolf_choose action
  for (const p of players) {
    if (p.role === 'dog_wolf') p.team = 'village';
  }

  const sisterIds = players.filter((p) => p.role === 'two_sisters').map((p) => p.userId);
  const brotherIds = players.filter((p) => p.role === 'three_brothers').map((p) => p.userId);

  const hasBigBadWolf = players.some((p) => p.role === 'big_bad_wolf');
  const hasSpecialWolves = players.some((p) =>
    ['wolf_cub', 'wild_child', 'dog_wolf'].includes(p.role),
  );

  const drunkPlayer = players.find((p) => p.role === 'drunk');

  return {
    phase: 'night',
    round: 1,
    phaseEndsAt: Date.now() + PHASE_DURATION.night,
    players,
    alivePlayers: playerIds.slice(),
    deadPlayers: [],
    nightActions: {},
    votes: {},
    roleCounts,
    witchSaveUsed: false,
    witchPoisonUsed: false,
    wolfCubNextDoubleKill: false,
    wolfFatherUsed: false,
    wolfSorcererUses: 0,
    hiddenWolfCamoRoundsLeft: 3,
    elderHits: 0,
    elderPenaltyActive: false,
    wildChildConverted: false,
    impersonatorActivated: false,
    foolRevealed: false,
    stutteringJudgeUsed: false,
    stutteringJudgeSignaledThisDay: false,
    secondVoteTriggered: false,
    thiefDone: false,
    cursedConverted: false,
    bigBadWolfKillsActive: hasBigBadWolf && hasSpecialWolves,
    sisterIds: sisterIds.length > 0 ? sisterIds : undefined,
    brotherIds: brotherIds.length > 0 ? brotherIds : undefined,
    drunkDisorientedRoundsLeft: drunkPlayer ? 2 : 0,
    eventLog: [],
  };
}

export function getPublicState(state: WerewolfState): Omit<
  WerewolfState,
  'nightActions' | 'players'
> & {
  nightActionsDone: Partial<Record<string, boolean>>;
} {
  const { nightActions, players, ...pub } = state;
  return {
    ...pub,
    nightActionsDone: {
      werewolf: nightActions.kill !== undefined,
      guard: nightActions.protect !== undefined,
      seer: nightActions.investigate !== undefined,
      sheriff: false,
      witch: nightActions.witchSave !== undefined || nightActions.witchPoison !== undefined,
      hunter: state.hunterTarget !== undefined,
      cupid: nightActions.cupidPair !== undefined,
      white_wolf: nightActions.whiteWolfKill !== undefined,
      wolf_sorcerer: nightActions.wolfSorcererTarget !== undefined,
    },
  };
}

export function getPrivateInfo(
  state: WerewolfState,
  userId: string,
): {
  role: string;
  team: string;
  wolfTeam: string[];
  lovers?: string[];
  investigateResult?: boolean;
  investigateTarget?: string;
  witchKillTarget?: string;
  witchSaveUsed: boolean;
  witchPoisonUsed: boolean;
  hunterTarget?: string;
  thiefCards?: [string, string];
  wildChildModel?: string;
  wolfVotes?: Record<string, string>;
  sisterIds?: string[];
  brotherIds?: string[];
} | null {
  const me = state.players.find((p) => p.userId === userId);
  if (!me) return null;

  const wolfTeam = me.team === 'werewolf'
    ? state.players.filter((p) => p.team === 'werewolf').map((p) => p.userId)
    : [];

  let investigateResult: boolean | undefined;
  let investigateTarget: string | undefined;

  if (me.role === 'seer' && state.nightActions.investigate !== undefined) {
    investigateResult = state.nightActions.investigateResult;
    investigateTarget = state.nightActions.investigate;
  }

  const witchKillTarget = me.role === 'witch' ? state.nightActions.kill : undefined;
  const lovers = state.lovers && state.lovers.includes(userId) ? [...state.lovers] : undefined;
  const wolfVotes = me.team === 'werewolf' ? (state.nightActions.wolfVotes ?? {}) : undefined;

  // Sisters know each other; brothers know each other
  const sisterIds = me.role === 'two_sisters' && state.sisterIds ? state.sisterIds : undefined;
  const brotherIds =
    me.role === 'three_brothers' && state.brotherIds ? state.brotherIds : undefined;

  return {
    role: me.role,
    team: me.team,
    wolfTeam,
    lovers,
    investigateResult,
    investigateTarget,
    witchKillTarget,
    witchSaveUsed: state.witchSaveUsed,
    witchPoisonUsed: state.witchPoisonUsed,
    hunterTarget: me.role === 'hunter' ? state.hunterTarget : undefined,
    thiefCards: me.role === 'thief' && !state.thiefDone ? state.thiefCards : undefined,
    wildChildModel: me.role === 'wild_child' ? state.wildChildModel : undefined,
    wolfVotes,
    sisterIds,
    brotherIds,
  };
}
