import { GamePlayer } from '@boardgame/types';
import { EngineRegistry, GameEngine } from './registry';

// ── Types ────────────────────────────────────────────────────────────────────

type Role =
  | 'villager'
  | 'werewolf'
  | 'seer'
  | 'doctor'
  | 'sheriff'
  | 'jester'
  | 'hunter'
  | 'witch'
  | 'cupid'
  | 'little_girl'
  | 'two_sisters'
  | 'three_brothers'
  | 'stuttering_judge'
  | 'rusty_knight'
  | 'devoted_servant'
  | 'wild_child'
  | 'idiot'
  | 'drunk'
  | 'wolf_cub'
  | 'dog_wolf'
  | 'big_bad_wolf'
  | 'wolf_father'
  | 'hidden_wolf'
  | 'wolf_sorcerer'
  | 'thief'
  | 'cursed'
  | 'avenger'
  | 'actor'
  | 'white_wolf'
  | 'angel'
  | 'elder';

type Team = 'village' | 'werewolf' | 'neutral' | 'third_party';
type Phase = 'night' | 'day_discussion' | 'day_vote';
type Action =
  | 'kill'
  | 'protect'
  | 'investigate'
  | 'vote'
  | 'witch_save'
  | 'witch_poison'
  | 'cupid_pair'
  | 'hunter_target'
  | 'wolf_father_convert'
  | 'wolf_sorcerer_disable'
  | 'white_wolf_kill'
  | 'thief_choose'
  | 'wild_child_model'
  | 'devoted_servant_follow'
  | 'actor_follow'
  | 'stuttering_judge_signal'
  | 'avenger_target';

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
  investigateResult?: boolean;
  sheriffTarget?: string;
  witchSave?: boolean;
  witchPoison?: string;
  hunterTarget?: string;
  wolfFatherConvert?: boolean;
  wolfSorcererTarget?: string;
  whiteWolfKill?: string;
  cupidPair?: [string, string];
  thiefChoice?: string;
  wildChildModel?: string;
  devotedServantFollow?: string;
  actorFollow?: string;
  secondKill?: string;
}

export interface WerewolfState {
  phase: Phase;
  round: number;
  phaseEndsAt: number;
  players: PlayerInfo[];
  alivePlayers: string[];
  deadPlayers: { userId: string; revealedRole: string }[];
  nightActions: NightActions;
  votes: Record<string, string | null>;
  lastKilled?: string;
  lastKilledExtra?: string;
  lastExecuted?: string;
  lastNoExecute?: boolean;
  roleCounts: Partial<Record<string, number>>;

  // Cupid
  lovers?: [string, string];

  // Witch
  witchSaveUsed: boolean;
  witchPoisonUsed: boolean;

  // Wolf cub — next night wolves may kill twice
  wolfCubNextDoubleKill: boolean;

  // Wolf father — one-time convert
  wolfFatherUsed: boolean;

  // Wolf sorcerer — disable ability (max 2 uses)
  wolfSorcererUses: number;
  disabledThisNight?: string;

  // Hidden wolf — appear as non-wolf to seer for N rounds
  hiddenWolfCamoRoundsLeft: number;

  // Elder — survives first bite; village loses abilities if lynched
  elderHits: number;
  elderPenaltyActive: boolean;

  // Wild child — model, converted flag
  wildChildModel?: string;
  wildChildConverted: boolean;

  // Devoted servant
  devotedServantFollows?: string;

  // Actor
  actorFollows?: string;
  actorActivated: boolean;

  // Idiot
  idiotRevealed: boolean;

  // Stuttering judge
  stutteringJudgeUsed: boolean;
  stutteringJudgeSignaledThisDay: boolean;
  secondVoteTriggered: boolean;

  // Rusty knight — dying wolf ID tracked for delayed kill
  rustyKnightWolfDying?: string;

  // Thief
  thiefCards?: [string, string];
  thiefDone: boolean;

  // Cursed
  cursedConverted: boolean;

  // Angel / Jester win flags
  specialWinner?: { userId: string; reason: string };
}

interface Move {
  action: Action;
  targetId?: string | null;
  targetId2?: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_TEAMS: Record<Role, Team> = {
  villager: 'village',
  seer: 'village',
  doctor: 'village',
  sheriff: 'village',
  hunter: 'village',
  witch: 'village',
  cupid: 'village',
  little_girl: 'village',
  two_sisters: 'village',
  three_brothers: 'village',
  stuttering_judge: 'village',
  rusty_knight: 'village',
  devoted_servant: 'village',
  wild_child: 'village',
  idiot: 'village',
  drunk: 'village',
  jester: 'neutral',
  white_wolf: 'neutral',
  angel: 'neutral',
  elder: 'neutral',
  thief: 'third_party',
  cursed: 'third_party',
  avenger: 'third_party',
  actor: 'third_party',
  werewolf: 'werewolf',
  wolf_cub: 'werewolf',
  dog_wolf: 'werewolf',
  big_bad_wolf: 'werewolf',
  wolf_father: 'werewolf',
  hidden_wolf: 'werewolf',
  wolf_sorcerer: 'werewolf',
};

const VILLAGE_ROLES_WITH_NIGHT_ACTION: Role[] = [
  'seer', 'doctor', 'sheriff', 'hunter', 'witch', 'cupid',
  'devoted_servant', 'wild_child', 'actor',
];

function buildRoleList(playerCount: number): Role[] {
  if (playerCount < 2) throw new Error('Need at least 2 players');
  const roles: Role[] = [];

  if (playerCount >= 4) roles.push('seer');
  if (playerCount >= 7) roles.push('witch');
  if (playerCount >= 8) roles.push('doctor');
  if (playerCount >= 9) roles.push('hunter');
  if (playerCount >= 10) {
    roles.push('sheriff');
  }
  if (playerCount >= 12) roles.push('cupid');

  const wolfCount = playerCount <= 3 ? 1 : playerCount <= 6 ? 1 : playerCount <= 9 ? 2 : playerCount <= 12 ? 3 : 4;
  for (let i = 0; i < wolfCount; i++) roles.push('werewolf');

  while (roles.length < playerCount) roles.push('villager');

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

function killPlayer(state: WerewolfState, userId: string): void {
  const p = state.players.find((pl) => pl.userId === userId);
  if (!p || !p.isAlive) return;
  p.isAlive = false;
  state.alivePlayers = state.alivePlayers.filter((id) => id !== userId);
  state.deadPlayers.push({ userId, revealedRole: p.role });

  // Lover dies → other lover dies too
  if (state.lovers) {
    const [a, b] = state.lovers;
    if (userId === a) killPlayer(state, b);
    else if (userId === b) killPlayer(state, a);
  }

  // Wild child: model dies → convert to wolf
  if (state.wildChildModel === userId && !state.wildChildConverted) {
    state.wildChildConverted = true;
    const wc = state.players.find((pl) => pl.isAlive && pl.role === 'wild_child');
    if (wc) wc.team = 'werewolf';
  }
}

function checkWinCondition(
  state: WerewolfState,
  players: GamePlayer[],
): { winner?: string; isDraw: boolean; reason: string } | null {
  // Special winner (jester, angel, white wolf)
  if (state.specialWinner) {
    return { winner: state.specialWinner.userId, isDraw: false, reason: state.specialWinner.reason };
  }

  const wolves = aliveWolves(state);
  const villagers = aliveVillagers(state);

  if (wolves.length === 0) {
    const rep = players.find((p) =>
      state.players.find((i) => i.userId === p.userId && i.team === 'village' && i.isAlive),
    );
    return { winner: rep?.userId, isDraw: false, reason: 'village_eliminated_wolves' };
  }

  if (wolves.length >= villagers.length) {
    const wolfRep = players.find((p) =>
      state.players.find((i) => i.userId === p.userId && i.team === 'werewolf' && i.isAlive),
    );
    return { winner: wolfRep?.userId, isDraw: false, reason: 'werewolves_outnumber_village' };
  }

  // White wolf: only one player alive and it's white wolf
  const aliveAll = state.players.filter((p) => p.isAlive);
  if (aliveAll.length === 1 && aliveAll[0].role === 'white_wolf') {
    return { winner: aliveAll[0].userId, isDraw: false, reason: 'white_wolf_last_standing' };
  }

  // Lovers third_party: only the two lovers remain
  if (state.lovers) {
    const [a, b] = state.lovers;
    const pa = state.players.find((p) => p.userId === a);
    const pb = state.players.find((p) => p.userId === b);
    if (pa?.isAlive && pb?.isAlive && aliveAll.length === 2) {
      return { winner: a, isDraw: false, reason: 'lovers_last_standing' };
    }
  }

  return null;
}

function isAbilityDisabled(state: WerewolfState, userId: string): boolean {
  return state.elderPenaltyActive || state.disabledThisNight === userId;
}

export function isNightComplete(state: WerewolfState): boolean {
  if (state.phase !== 'night') return false;

  const alive = (role: Role) => state.players.some((p) => p.isAlive && p.role === role);
  const wolves = aliveWolves(state);

  // Wolves must kill (unless no target available)
  if (wolves.length > 0 && state.nightActions.kill === undefined) return false;

  // Second kill if wolf cub double-kill triggered
  if (state.wolfCubNextDoubleKill && state.nightActions.secondKill === undefined) return false;

  if (alive('doctor') && !isAbilityDisabled(state, state.players.find((p) => p.role === 'doctor')!.userId)
    && state.nightActions.protect === undefined) return false;

  if (alive('seer') && !isAbilityDisabled(state, state.players.find((p) => p.role === 'seer')!.userId)
    && state.nightActions.investigate === undefined) return false;

  if (alive('sheriff') && state.nightActions.sheriffTarget === undefined) return false;

  if (alive('witch')) {
    const needWitch = (!state.witchSaveUsed || !state.witchPoisonUsed);
    if (needWitch && state.nightActions.witchSave === undefined && state.nightActions.witchPoison === undefined) return false;
  }

  if (alive('hunter') && state.nightActions.hunterTarget === undefined) return false;

  // Cupid only on round 1
  if (state.round === 1 && alive('cupid') && !state.lovers && state.nightActions.cupidPair === undefined) return false;

  // Wild child only on round 1
  if (state.round === 1 && alive('wild_child') && !state.wildChildModel && state.nightActions.wildChildModel === undefined) return false;

  // Devoted servant only on round 1
  if (state.round === 1 && alive('devoted_servant') && !state.devotedServantFollows
    && state.nightActions.devotedServantFollow === undefined) return false;

  // Actor only on round 1
  if (state.round === 1 && alive('actor') && !state.actorFollows && state.nightActions.actorFollow === undefined) return false;

  // Wolf sorcerer — optional disable (skip allowed once used)
  // White wolf every 2 rounds
  if (state.round % 2 === 0 && alive('white_wolf') && state.nightActions.whiteWolfKill === undefined) return false;

  return true;
}

export function resolveNight(state: WerewolfState): WerewolfState {
  const next = structuredClone(state) as WerewolfState;
  const na = next.nightActions;

  next.lastKilled = undefined;
  next.lastKilledExtra = undefined;
  next.lastNoExecute = false;
  next.disabledThisNight = undefined;
  next.rustyKnightWolfDying = undefined;

  // ── Round 1 first-night setups ────────────────────────────────────────────
  if (next.round === 1) {
    if (na.cupidPair) {
      const [a, b] = na.cupidPair;
      const pa = next.players.find((p) => p.userId === a);
      const pb = next.players.find((p) => p.userId === b);
      if (pa && pb && pa.team !== pb.team) {
        pa.team = 'third_party';
        pb.team = 'third_party';
      }
      next.lovers = [a, b];
    }
    if (na.wildChildModel) next.wildChildModel = na.wildChildModel;
    if (na.devotedServantFollow) next.devotedServantFollows = na.devotedServantFollow;
    if (na.actorFollow) next.actorFollows = na.actorFollow;

    // Angel: wins if bitten first night
    const angelPlayer = next.players.find((p) => p.role === 'angel');
    if (angelPlayer && na.kill === angelPlayer.userId) {
      next.specialWinner = { userId: angelPlayer.userId, reason: 'angel_bitten_night1' };
    }
  }

  // ── Wolf sorcerer disable ─────────────────────────────────────────────────
  if (na.wolfSorcererTarget && next.wolfSorcererUses < 2) {
    next.disabledThisNight = na.wolfSorcererTarget;
    next.wolfSorcererUses += 1;
  }

  // ── White wolf kills a wolf ───────────────────────────────────────────────
  if (next.round % 2 === 0 && na.whiteWolfKill) {
    const target = next.players.find((p) => p.userId === na.whiteWolfKill && p.isAlive && p.team === 'werewolf' && p.role !== 'white_wolf');
    if (target) killPlayer(next, target.userId);
  }

  // ── Witch poison ─────────────────────────────────────────────────────────
  if (na.witchPoison && !next.witchPoisonUsed) {
    next.witchPoisonUsed = true;
    const target = next.players.find((p) => p.userId === na.witchPoison && p.isAlive);
    if (target) {
      killPlayer(next, target.userId);
      next.lastKilledExtra = target.userId;
    }
  }

  // ── Main wolf kill ────────────────────────────────────────────────────────
  const killTarget = na.kill;
  const protect = na.protect;

  if (killTarget) {
    const isProtected = killTarget === protect && !isAbilityDisabled(next, next.players.find((p) => p.role === 'doctor')?.userId ?? '');
    const isWitchSaved = na.witchSave === true && !next.witchSaveUsed;

    if (isWitchSaved) next.witchSaveUsed = true;

    // Wolf father: convert instead of kill (once)
    if (na.wolfFatherConvert && !next.wolfFatherUsed) {
      next.wolfFatherUsed = true;
      const victim = next.players.find((p) => p.userId === killTarget && p.isAlive);
      if (victim) {
        victim.team = 'werewolf';
        // Cursed converts too
        if (victim.role === 'cursed') next.cursedConverted = true;
      }
    } else if (!isProtected && !isWitchSaved) {
      const victim = next.players.find((p) => p.userId === killTarget && p.isAlive);
      if (victim) {
        // Cursed → becomes wolf instead of dying
        if (victim.role === 'cursed' && !next.cursedConverted) {
          next.cursedConverted = true;
          victim.team = 'werewolf';
        } else {
          // Elder needs 2 hits
          if (victim.role === 'elder') {
            if (next.elderHits === 0) {
              next.elderHits = 1;
            } else {
              killPlayer(next, killTarget);
              next.lastKilled = killTarget;
            }
          } else {
            // Rusty knight: biting wolf gets delayed death
            const bitingWolf = aliveWolves(next).find((w) => w.isAlive);
            if (victim.role === 'rusty_knight' && bitingWolf) {
              next.rustyKnightWolfDying = bitingWolf.userId;
            }
            killPlayer(next, killTarget);
            next.lastKilled = killTarget;

            // Wolf cub died → flag double kill next night
            if (victim.role === 'wolf_cub') {
              next.wolfCubNextDoubleKill = true;
            }
          }
        }
      }
    }
  }

  // ── Second wolf kill (wolf cub double kill) ───────────────────────────────
  if (state.wolfCubNextDoubleKill && na.secondKill) {
    next.wolfCubNextDoubleKill = false;
    const victim2 = next.players.find((p) => p.userId === na.secondKill && p.isAlive && p.team !== 'werewolf');
    if (victim2) {
      killPlayer(next, victim2.userId);
      next.lastKilledExtra = next.lastKilledExtra ?? victim2.userId;
    }
  }

  // ── Rusty knight: wolf dies next morning ─────────────────────────────────
  // Handled in resolveVote / day start; stored in rustyKnightWolfDying

  // ── Seer investigate result ───────────────────────────────────────────────
  if (na.investigate) {
    const target = next.players.find((p) => p.userId === na.investigate);
    if (target) {
      // Hidden wolf appears safe for hiddenWolfCamoRoundsLeft rounds
      const isHiddenWolf = target.role === 'hidden_wolf' && next.hiddenWolfCamoRoundsLeft > 0;
      next.nightActions.investigateResult = target.team === 'werewolf' && !isHiddenWolf;
      if (next.hiddenWolfCamoRoundsLeft > 0) next.hiddenWolfCamoRoundsLeft -= 1;
    }
  }

  // ── Thief chooses role ────────────────────────────────────────────────────
  if (na.thiefChoice && !next.thiefDone && next.thiefCards) {
    const chosen = na.thiefChoice as Role;
    if (next.thiefCards.includes(chosen)) {
      const thief = next.players.find((p) => p.role === 'thief');
      if (thief) {
        thief.role = chosen;
        thief.team = ROLE_TEAMS[chosen];
        next.thiefDone = true;
      }
    }
  }

  next.nightActions = {};
  next.votes = {};
  next.phase = 'day_discussion';
  next.phaseEndsAt = Date.now() + PHASE_DURATION.day_discussion;
  next.round += 1;
  next.stutteringJudgeSignaledThisDay = false;
  next.secondVoteTriggered = false;
  return next;
}

export function resolveVote(state: WerewolfState): WerewolfState {
  const next = structuredClone(state) as WerewolfState;
  const tally: Record<string, number> = {};

  for (const [voterId, targetId] of Object.entries(next.votes)) {
    if (!targetId) continue;
    // Sheriff vote counts double
    const voter = next.players.find((p) => p.userId === voterId);
    const weight = voter?.role === 'sheriff' ? 2 : 1;
    tally[targetId] = (tally[targetId] ?? 0) + weight;
  }

  let topTarget: string | undefined;
  let topCount = 0;
  let tied = false;

  for (const [id, count] of Object.entries(tally)) {
    if (count > topCount) { topTarget = id; topCount = count; tied = false; }
    else if (count === topCount) { tied = true; }
  }

  next.lastExecuted = undefined;
  next.lastNoExecute = false;

  // Rusty knight wolf dies today
  if (next.rustyKnightWolfDying) {
    killPlayer(next, next.rustyKnightWolfDying);
    next.rustyKnightWolfDying = undefined;
  }

  if (topTarget && !tied) {
    const executed = next.players.find((p) => p.userId === topTarget);
    if (executed && executed.isAlive) {
      // Idiot: revealed, not killed, loses vote permanently
      if (executed.role === 'idiot' && !next.idiotRevealed) {
        next.idiotRevealed = true;
        next.lastNoExecute = true;
      } else {
        // Elder lynched: all village lose abilities
        if (executed.role === 'elder') {
          next.elderPenaltyActive = true;
        }
        // Jester wins if lynched
        if (executed.role === 'jester') {
          next.specialWinner = { userId: executed.userId, reason: 'jester_lynched' };
        }
        // Angel wins if lynched day 1
        if (executed.role === 'angel' && next.round === 2) {
          next.specialWinner = { userId: executed.userId, reason: 'angel_lynched_day1' };
        }
        // Hunter: pulls target with them
        if (executed.role === 'hunter') {
          const hunterTarget = next.nightActions.hunterTarget;
          if (hunterTarget) killPlayer(next, hunterTarget);
        }
        // Avenger: picks someone on opposing team to die
        if (executed.role === 'avenger') {
          // Resolved by player action (avenger_target); stored for next
        }
        killPlayer(next, topTarget);
        next.lastExecuted = topTarget;

        // Actor: activates if followed person was just killed
        if (next.actorFollows === topTarget && !next.actorActivated) {
          const actorPlayer = next.players.find((p) => p.role === 'actor');
          const inherited = executed;
          if (actorPlayer && actorPlayer.isAlive) {
            actorPlayer.role = inherited.role;
            actorPlayer.team = inherited.team;
            next.actorActivated = true;
          }
        }
        // Devoted servant: loses ability if followed person dies
        if (next.devotedServantFollows === topTarget) {
          next.devotedServantFollows = undefined;
        }
      }
    }
  } else {
    next.lastNoExecute = true;
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
    return {
      phase: 'night',
      round: 1,
      phaseEndsAt: Date.now() + PHASE_DURATION.night,
      players: [],
      alivePlayers: [],
      deadPlayers: [],
      nightActions: {},
      votes: {},
      roleCounts: {},
      witchSaveUsed: false,
      witchPoisonUsed: false,
      wolfCubNextDoubleKill: false,
      wolfFatherUsed: false,
      wolfSorcererUses: 0,
      hiddenWolfCamoRoundsLeft: 3,
      elderHits: 0,
      elderPenaltyActive: false,
      wildChildConverted: false,
      actorActivated: false,
      idiotRevealed: false,
      stutteringJudgeUsed: false,
      stutteringJudgeSignaledThisDay: false,
      secondVoteTriggered: false,
      thiefDone: false,
      cursedConverted: false,
    };
  },

  validateAndApply(
    boardState: unknown,
    move: Record<string, unknown>,
    playerId: string,
  ): { newBoardState: unknown; isValid: boolean } {
    const state = structuredClone(boardState) as WerewolfState;
    const { action, targetId, targetId2 } = move as unknown as Move;

    const actor = state.players.find((p) => p.userId === playerId);
    if (!actor || !actor.isAlive) return { newBoardState: state, isValid: false };

    // ── Night actions ──────────────────────────────────────────────────────
    if (state.phase === 'night') {
      const disabled = isAbilityDisabled(state, playerId);

      if (action === 'kill' && actor.team === 'werewolf' && actor.role !== 'white_wolf' && targetId) {
        const target = state.players.find((p) => p.userId === targetId);
        if (!target || !target.isAlive || target.team === 'werewolf') {
          return { newBoardState: state, isValid: false };
        }
        if (state.wolfCubNextDoubleKill && state.nightActions.kill !== undefined) {
          // Second wolf kill
          state.nightActions.secondKill = targetId;
        } else {
          state.nightActions.kill = targetId;
        }
      } else if (action === 'wolf_father_convert' && actor.role === 'wolf_father' && !state.wolfFatherUsed) {
        state.nightActions.wolfFatherConvert = true;

      } else if (action === 'white_wolf_kill' && actor.role === 'white_wolf' && state.round % 2 === 0 && targetId) {
        const target = state.players.find((p) => p.userId === targetId);
        if (!target || !target.isAlive || target.team !== 'werewolf' || target.userId === playerId) {
          return { newBoardState: state, isValid: false };
        }
        state.nightActions.whiteWolfKill = targetId;

      } else if (action === 'wolf_sorcerer_disable' && actor.role === 'wolf_sorcerer' && state.wolfSorcererUses < 2 && targetId) {
        const target = state.players.find((p) => p.userId === targetId);
        if (!target || !target.isAlive || target.team === 'werewolf') {
          return { newBoardState: state, isValid: false };
        }
        state.nightActions.wolfSorcererTarget = targetId;

      } else if (action === 'protect' && actor.role === 'doctor' && !disabled && targetId) {
        state.nightActions.protect = targetId;

      } else if (action === 'investigate' && actor.role === 'seer' && !disabled && targetId) {
        const target = state.players.find((p) => p.userId === targetId);
        if (!target || !target.isAlive) return { newBoardState: state, isValid: false };
        const isHiddenWolf = target.role === 'hidden_wolf' && state.hiddenWolfCamoRoundsLeft > 0;
        state.nightActions.investigate = targetId;
        state.nightActions.investigateResult = target.team === 'werewolf' && !isHiddenWolf;

      } else if (action === 'investigate' && actor.role === 'sheriff' && targetId) {
        const target = state.players.find((p) => p.userId === targetId);
        if (!target || !target.isAlive) return { newBoardState: state, isValid: false };
        state.nightActions.sheriffTarget = targetId;

      } else if (action === 'witch_save' && actor.role === 'witch' && !state.witchSaveUsed) {
        state.nightActions.witchSave = true;

      } else if (action === 'witch_poison' && actor.role === 'witch' && !state.witchPoisonUsed && targetId) {
        const target = state.players.find((p) => p.userId === targetId);
        if (!target || !target.isAlive) return { newBoardState: state, isValid: false };
        state.nightActions.witchPoison = targetId;

      } else if (action === 'hunter_target' && actor.role === 'hunter' && targetId) {
        state.nightActions.hunterTarget = targetId;

      } else if (action === 'cupid_pair' && actor.role === 'cupid' && state.round === 1 && !state.lovers && targetId && targetId2) {
        state.nightActions.cupidPair = [targetId, targetId2];

      } else if (action === 'wild_child_model' && actor.role === 'wild_child' && state.round === 1 && !state.wildChildModel && targetId) {
        state.nightActions.wildChildModel = targetId;

      } else if (action === 'devoted_servant_follow' && actor.role === 'devoted_servant' && state.round === 1 && !state.devotedServantFollows && targetId) {
        state.nightActions.devotedServantFollow = targetId;

      } else if (action === 'actor_follow' && actor.role === 'actor' && state.round === 1 && !state.actorFollows && targetId) {
        state.nightActions.actorFollow = targetId;

      } else if (action === 'thief_choose' && actor.role === 'thief' && !state.thiefDone && targetId) {
        state.nightActions.thiefChoice = targetId;

      } else {
        return { newBoardState: state, isValid: false };
      }

      return { newBoardState: state, isValid: true };
    }

    // ── Day actions ────────────────────────────────────────────────────────
    if (state.phase === 'day_discussion') {
      // Stuttering judge signals second vote
      if (action === 'stuttering_judge_signal' && actor.role === 'stuttering_judge' && !state.stutteringJudgeUsed) {
        state.stutteringJudgeUsed = true;
        state.stutteringJudgeSignaledThisDay = true;
        state.phase = 'day_vote';
        state.phaseEndsAt = Date.now() + PHASE_DURATION.day_vote;
        return { newBoardState: state, isValid: true };
      }
      // Avenger picks target after death (called during discussion before next night)
      if (action === 'avenger_target' && actor.role === 'avenger' && !actor.isAlive && targetId) {
        // Avenger executes target immediately
        const target = state.players.find((p) => p.userId === targetId && p.isAlive);
        if (target && target.team !== actor.team) {
          killPlayer(state, targetId);
          return { newBoardState: state, isValid: true };
        }
        return { newBoardState: state, isValid: false };
      }
    }

    // ── Day vote ───────────────────────────────────────────────────────────
    if (state.phase === 'day_vote' && action === 'vote') {
      // Idiot has no vote after revealed
      if (actor.role === 'idiot' && state.idiotRevealed) {
        return { newBoardState: state, isValid: false };
      }
      if (targetId !== undefined) {
        const target = targetId ? state.players.find((p) => p.userId === targetId) : null;
        if (targetId && (!target || !target.isAlive)) return { newBoardState: state, isValid: false };
      }
      state.votes[playerId] = targetId ?? null;

      const allVoted = state.alivePlayers
        .filter((id) => {
          const p = state.players.find((pl) => pl.userId === id);
          return !(p?.role === 'idiot' && state.idiotRevealed);
        })
        .every((id) => id in state.votes);

      if (allVoted) {
        const resolved = resolveVote(state);
        // If stuttering judge already signaled a second vote and this was it, no extra
        if (state.stutteringJudgeSignaledThisDay && !state.secondVoteTriggered) {
          const extraState = structuredClone(resolved) as WerewolfState;
          extraState.secondVoteTriggered = true;
          extraState.phase = 'day_vote';
          extraState.phaseEndsAt = Date.now() + PHASE_DURATION.day_vote;
          return { newBoardState: extraState, isValid: true };
        }
        return { newBoardState: resolved, isValid: true };
      }
      return { newBoardState: state, isValid: true };
    }

    return { newBoardState: state, isValid: false };
  },

  checkResult(
    boardState: unknown,
    players: GamePlayer[],
  ): { winner?: string; isDraw: boolean; reason: string } | null {
    return checkWinCondition(boardState as WerewolfState, players);
  },
};

// ── Exported helpers ──────────────────────────────────────────────────────────

export function initWerewolfGame(playerIds: string[]): WerewolfState {
  const roles = buildRoleList(playerIds.length);
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

  // Dog wolf: chooses team at start (default to villager; client sends preference)
  // For now assign village; can be overridden by first-night action
  for (const p of players) {
    if (p.role === 'dog_wolf') p.team = 'village';
  }

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
    actorActivated: false,
    idiotRevealed: false,
    stutteringJudgeUsed: false,
    stutteringJudgeSignaledThisDay: false,
    secondVoteTriggered: false,
    thiefDone: false,
    cursedConverted: false,
  };
}

export function getPublicState(state: WerewolfState): Omit<WerewolfState, 'nightActions' | 'players'> & {
  nightActionsDone: Partial<Record<string, boolean>>;
} {
  const { nightActions, players, ...pub } = state;
  return {
    ...pub,
    nightActionsDone: {
      werewolf: nightActions.kill !== undefined,
      doctor: nightActions.protect !== undefined,
      seer: nightActions.investigate !== undefined,
      sheriff: nightActions.sheriffTarget !== undefined,
      witch: nightActions.witchSave !== undefined || nightActions.witchPoison !== undefined,
      hunter: nightActions.hunterTarget !== undefined,
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
  thiefCards?: [string, string];
  wildChildModel?: string;
} | null {
  const me = state.players.find((p) => p.userId === userId);
  if (!me) return null;

  const wolfTeam =
    me.team === 'werewolf'
      ? state.players.filter((p) => p.team === 'werewolf').map((p) => p.userId)
      : [];

  let investigateResult: boolean | undefined;
  let investigateTarget: string | undefined;

  if (me.role === 'seer' && state.nightActions.investigate !== undefined) {
    investigateResult = state.nightActions.investigateResult;
    investigateTarget = state.nightActions.investigate;
  } else if (me.role === 'sheriff' && state.nightActions.sheriffTarget !== undefined) {
    const target = state.players.find((p) => p.userId === state.nightActions.sheriffTarget);
    investigateResult = target ? target.team === 'werewolf' : undefined;
    investigateTarget = state.nightActions.sheriffTarget;
  }

  // Witch sees who was killed tonight
  const witchKillTarget = me.role === 'witch' ? state.nightActions.kill : undefined;

  // Lovers know each other
  const lovers = state.lovers && state.lovers.includes(userId) ? [...state.lovers] : undefined;

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
    thiefCards: me.role === 'thief' && !state.thiefDone ? state.thiefCards : undefined,
    wildChildModel: me.role === 'wild_child' ? state.wildChildModel : undefined,
  };
}

export { ROLE_TEAMS };
export type { Role, Team };

EngineRegistry.register('werewolf', WerewolfEngine);
