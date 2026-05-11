import { GamePlayer } from '@boardgame/types';
import { EngineRegistry, GameEngine } from './registry';

// ── Types ────────────────────────────────────────────────────────────────────

type Role = 'villager' | 'werewolf' | 'alpha_werewolf' | 'seer' | 'doctor' | 'sheriff' | 'jester';
type Team = 'village' | 'werewolf' | 'neutral';
type Phase = 'night' | 'day_discussion' | 'day_vote';
type Action = 'kill' | 'protect' | 'investigate' | 'vote';

interface PlayerInfo {
  userId: string;
  role: Role;
  team: Team;
  isAlive: boolean;
}

interface NightActions {
  kill?: string;
  protect?: string;
  investigate?: string;
  investigateResult?: boolean; // true = is werewolf (sent privately to sheriff)
  sheriffTarget?: string;
}

export interface WerewolfState {
  phase: Phase;
  round: number;
  phaseEndsAt: number;
  // private player data — never sent raw to clients; scrubbed in getPublicState
  players: PlayerInfo[];
  alivePlayers: string[];
  deadPlayers: { userId: string; revealedRole: string }[];
  nightActions: NightActions;
  votes: Record<string, string | null>;
  lastKilled?: string;
  lastExecuted?: string;
}

interface Move {
  action: Action;
  targetId?: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_TEAMS: Record<Role, Team> = {
  villager: 'village',
  seer: 'village',
  doctor: 'village',
  sheriff: 'village',
  jester: 'neutral',
  werewolf: 'werewolf',
  alpha_werewolf: 'werewolf',
};

// Default role distribution based on player count (from docs)
function buildRoleList(playerCount: number): Role[] {
  if (playerCount < 2) throw new Error('Need at least 2 players');

  const roles: Role[] = [];

  if (playerCount >= 4) roles.push('seer');
  if (playerCount >= 8) roles.push('doctor');
  if (playerCount >= 10) {
    roles.push('sheriff');
    roles.push('alpha_werewolf');
  }

  const wolfCount = playerCount <= 3 ? 1 : playerCount <= 6 ? 1 : playerCount <= 9 ? 2 : playerCount <= 12 ? 3 : 4;
  for (let i = 0; i < wolfCount; i++) roles.push('werewolf');

  while (roles.length < playerCount) roles.push('villager');

  // Fisher-Yates shuffle
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  return roles;
}

export const PHASE_DURATION: Record<Phase, number> = {
  night: 60_000,
  day_discussion: 120_000,
  day_vote: 60_000,
};

function aliveWolves(state: WerewolfState): PlayerInfo[] {
  return state.players.filter((p) => p.isAlive && p.team === 'werewolf');
}

function aliveVillagers(state: WerewolfState): PlayerInfo[] {
  return state.players.filter((p) => p.isAlive && p.team === 'village');
}

function checkWinCondition(
  state: WerewolfState,
  players: GamePlayer[],
): { winner?: string; isDraw: boolean; reason: string } | null {
  const wolves = aliveWolves(state);
  const villagers = aliveVillagers(state);

  if (wolves.length === 0) {
    // Village wins — find any surviving villager as "winner" representative
    const rep = players.find((p) => state.players.find((i) => i.userId === p.userId && i.team === 'village' && i.isAlive));
    return { winner: rep?.userId, isDraw: false, reason: 'village_eliminated_wolves' };
  }

  if (wolves.length >= villagers.length) {
    const wolfRep = players.find((p) => state.players.find((i) => i.userId === p.userId && i.team === 'werewolf' && i.isAlive));
    return { winner: wolfRep?.userId, isDraw: false, reason: 'werewolves_outnumber_village' };
  }

  return null;
}

export function resolveNight(state: WerewolfState): WerewolfState {
  const next = structuredClone(state) as WerewolfState;
  const { kill, protect } = next.nightActions;

  next.lastKilled = undefined;

  if (kill && kill !== protect) {
    const victim = next.players.find((p) => p.userId === kill);
    if (victim && victim.isAlive) {
      victim.isAlive = false;
      next.alivePlayers = next.alivePlayers.filter((id) => id !== kill);
      next.deadPlayers.push({ userId: kill, revealedRole: victim.role });
      next.lastKilled = kill;
    }
  }

  next.nightActions = {};
  next.votes = {};
  next.phase = 'day_discussion';
  next.phaseEndsAt = Date.now() + PHASE_DURATION.day_discussion;
  next.round += 1;
  return next;
}

export function resolveVote(state: WerewolfState): WerewolfState {
  const next = structuredClone(state) as WerewolfState;
  const tally: Record<string, number> = {};

  for (const targetId of Object.values(next.votes)) {
    if (targetId) tally[targetId] = (tally[targetId] ?? 0) + 1;
  }

  let topTarget: string | undefined;
  let topCount = 0;
  let tied = false;

  for (const [id, count] of Object.entries(tally)) {
    if (count > topCount) { topTarget = id; topCount = count; tied = false; }
    else if (count === topCount) { tied = true; }
  }

  next.lastExecuted = undefined;

  if (topTarget && !tied) {
    const executed = next.players.find((p) => p.userId === topTarget);
    if (executed && executed.isAlive) {
      executed.isAlive = false;
      next.alivePlayers = next.alivePlayers.filter((id) => id !== topTarget);
      next.deadPlayers.push({ userId: topTarget, revealedRole: executed.role });
      next.lastExecuted = topTarget;
    }
  }

  next.votes = {};
  next.nightActions = {};
  next.phase = 'night';
  next.phaseEndsAt = Date.now() + PHASE_DURATION.night;
  return next;
}

// ── Engine ────────────────────────────────────────────────────────────────────

const WerewolfEngine: GameEngine = {
  getInitialState(): WerewolfState {
    // Placeholder — real assignment happens in startGame once player list is known.
    // getInitialState is called before players are added, so we return a skeleton.
    return {
      phase: 'night',
      round: 1,
      phaseEndsAt: Date.now() + PHASE_DURATION.night,
      players: [],
      alivePlayers: [],
      deadPlayers: [],
      nightActions: {},
      votes: {},
    };
  },

  validateAndApply(
    boardState: unknown,
    move: Record<string, unknown>,
    playerId: string,
  ): { newBoardState: unknown; isValid: boolean } {
    const state = structuredClone(boardState) as WerewolfState;
    const { action, targetId } = move as unknown as Move;

    const actor = state.players.find((p) => p.userId === playerId);
    if (!actor || !actor.isAlive) return { newBoardState: state, isValid: false };

    // ── Night actions ──────────────────────────────────────────────────────
    if (state.phase === 'night') {
      if (action === 'kill' && actor.team === 'werewolf' && targetId) {
        const target = state.players.find((p) => p.userId === targetId);
        if (!target || !target.isAlive || target.team === 'werewolf') {
          return { newBoardState: state, isValid: false };
        }
        state.nightActions.kill = targetId;

        // Auto-resolve night when all required night actions are submitted
        const wolves = aliveWolves(state);
        const needDoctor = state.players.some((p) => p.isAlive && p.role === 'doctor');
        const needSeer = state.players.some((p) => p.isAlive && p.role === 'seer');
        const needSheriff = state.players.some((p) => p.isAlive && p.role === 'sheriff');
        const allDone =
          state.nightActions.kill !== undefined &&
          (!needDoctor || state.nightActions.protect !== undefined) &&
          (!needSeer || state.nightActions.investigate !== undefined) &&
          (!needSheriff || state.nightActions.sheriffTarget !== undefined);

        if (allDone) return { newBoardState: resolveNight(state), isValid: true };
        return { newBoardState: state, isValid: true };
      }

      if (action === 'protect' && actor.role === 'doctor' && targetId) {
        state.nightActions.protect = targetId;
        const needSeer = state.players.some((p) => p.isAlive && p.role === 'seer');
        const needSheriff = state.players.some((p) => p.isAlive && p.role === 'sheriff');
        const allDone =
          state.nightActions.kill !== undefined &&
          state.nightActions.protect !== undefined &&
          (!needSeer || state.nightActions.investigate !== undefined) &&
          (!needSheriff || state.nightActions.sheriffTarget !== undefined);
        if (allDone) return { newBoardState: resolveNight(state), isValid: true };
        return { newBoardState: state, isValid: true };
      }

      if (action === 'investigate' && actor.role === 'seer' && targetId) {
        const target = state.players.find((p) => p.userId === targetId);
        if (!target || !target.isAlive) return { newBoardState: state, isValid: false };
        // alpha_werewolf appears as non-wolf to seer
        const isWolf = target.role === 'werewolf';
        state.nightActions.investigate = targetId;
        state.nightActions.investigateResult = isWolf;
        const needDoctor = state.players.some((p) => p.isAlive && p.role === 'doctor');
        const needSheriff = state.players.some((p) => p.isAlive && p.role === 'sheriff');
        const allDone =
          state.nightActions.kill !== undefined &&
          (!needDoctor || state.nightActions.protect !== undefined) &&
          state.nightActions.investigate !== undefined &&
          (!needSheriff || state.nightActions.sheriffTarget !== undefined);
        if (allDone) return { newBoardState: resolveNight(state), isValid: true };
        return { newBoardState: state, isValid: true };
      }

      // Sheriff investigates like seer but reliable
      if (action === 'investigate' && actor.role === 'sheriff' && targetId) {
        const target = state.players.find((p) => p.userId === targetId);
        if (!target || !target.isAlive) return { newBoardState: state, isValid: false };
        state.nightActions.sheriffTarget = targetId;
        const needDoctor = state.players.some((p) => p.isAlive && p.role === 'doctor');
        const needSeer = state.players.some((p) => p.isAlive && p.role === 'seer');
        const allDone =
          state.nightActions.kill !== undefined &&
          (!needDoctor || state.nightActions.protect !== undefined) &&
          (!needSeer || state.nightActions.investigate !== undefined) &&
          state.nightActions.sheriffTarget !== undefined;
        if (allDone) return { newBoardState: resolveNight(state), isValid: true };
        return { newBoardState: state, isValid: true };
      }

      return { newBoardState: state, isValid: false };
    }

    // ── Day vote ───────────────────────────────────────────────────────────
    if (state.phase === 'day_vote' && action === 'vote') {
      if (targetId !== undefined) {
        const target = targetId ? state.players.find((p) => p.userId === targetId) : null;
        if (targetId && (!target || !target.isAlive)) return { newBoardState: state, isValid: false };
      }
      state.votes[playerId] = targetId ?? null;

      // Auto-resolve when all alive players have voted
      const allVoted = state.alivePlayers.every((id) => id in state.votes);
      if (allVoted) return { newBoardState: resolveVote(state), isValid: true };
      return { newBoardState: state, isValid: true };
    }

    // day_discussion — no moves, players just chat
    return { newBoardState: state, isValid: false };
  },

  checkResult(
    boardState: unknown,
    players: GamePlayer[],
  ): { winner?: string; isDraw: boolean; reason: string } | null {
    return checkWinCondition(boardState as WerewolfState, players);
  },
};

// ── Helpers exported for socket handler (role assignment, public state) ────────

/** Assign roles and build full WerewolfState after players are confirmed. */
export function initWerewolfGame(playerIds: string[]): WerewolfState {
  const roles = buildRoleList(playerIds.length);
  const players: PlayerInfo[] = playerIds.map((userId, i) => ({
    userId,
    role: roles[i],
    team: ROLE_TEAMS[roles[i]],
    isAlive: true,
  }));
  return {
    phase: 'night',
    round: 1,
    phaseEndsAt: Date.now() + PHASE_DURATION.night,
    players,
    alivePlayers: playerIds.slice(),
    deadPlayers: [],
    nightActions: {},
    votes: {},
  };
}

/** Return board state safe to broadcast (strip nightActions internals). */
export function getPublicState(state: WerewolfState): Omit<WerewolfState, 'nightActions' | 'players'> & {
  nightActionsDone: Partial<Record<string, boolean>>;
} {
  const { nightActions, players, ...pub } = state;
  // Only reveal which roles have submitted their action (not the targets)
  return {
    ...pub,
    nightActionsDone: {
      werewolf: nightActions.kill !== undefined,
      doctor: nightActions.protect !== undefined,
      seer: nightActions.investigate !== undefined,
      sheriff: nightActions.sheriffTarget !== undefined,
    },
  };
}

/** Return private info visible only to one player. */
export function getPrivateInfo(state: WerewolfState, userId: string): {
  role: string;
  team: string;
  wolfTeam: string[];
  investigateResult?: boolean;
  investigateTarget?: string;
} | null {
  const me = state.players.find((p) => p.userId === userId);
  if (!me) return null;
  const wolfTeam = me.team === 'werewolf'
    ? state.players.filter((p) => p.team === 'werewolf').map((p) => p.userId)
    : [];
  const isSeer = me.role === 'seer';
  const isSheriff = me.role === 'sheriff';
  let investigateResult: boolean | undefined;
  let investigateTarget: string | undefined;
  if (isSeer && state.nightActions.investigate !== undefined) {
    investigateResult = state.nightActions.investigateResult;
    investigateTarget = state.nightActions.investigate;
  } else if (isSheriff && state.nightActions.sheriffTarget !== undefined) {
    const target = state.players.find((p) => p.userId === state.nightActions.sheriffTarget);
    investigateResult = target ? target.team === 'werewolf' : undefined;
    investigateTarget = state.nightActions.sheriffTarget;
  }
  return { role: me.role, team: me.team, wolfTeam, investigateResult, investigateTarget };
}

EngineRegistry.register('werewolf', WerewolfEngine);
