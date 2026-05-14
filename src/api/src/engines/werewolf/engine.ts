import type { GamePlayer } from '@boardgame/types';
import { EngineRegistry, type GameEngine } from '../registry';
import type { WerewolfState, Move } from './types';
import { PHASE_DURATION } from './constants';
import { killPlayer } from './helpers';
import { isNightComplete, resolveNight } from './night';
import { resolveVote } from './vote';
import { checkWinCondition } from './win-condition';
import { initWerewolfGame } from './init';
import {
  WolvesRole,
  SeerRole,
  GuardRole,
  WitchRole,
  HunterRole,
  CupidRole,
  SheriffRole,
  SpecialVillagersRole,
  ThirdPartyRole,
} from './roles/index';

// Ordered list of role validateAction handlers.
// Each returns null if it does not handle the action, or { newState, isValid }.
type RoleHandler = {
  validateAction(
    state: WerewolfState,
    playerId: string,
    action: string,
    targetId?: string | null,
    targetId2?: string | null,
  ): { newState: WerewolfState; isValid: boolean } | null;
};

const ROLE_HANDLERS: RoleHandler[] = [
  {
    validateAction: (s, pid, action, t1, t2) => WolvesRole.validateAction(s, pid, action, t1),
  },
  {
    validateAction: (s, pid, action, t1) => SeerRole.validateAction(s, pid, action, t1),
  },
  {
    validateAction: (s, pid, action, t1) => GuardRole.validateAction(s, pid, action, t1),
  },
  {
    validateAction: (s, pid, action, t1) => WitchRole.validateAction(s, pid, action, t1),
  },
  {
    validateAction: (s, pid, action, t1) => HunterRole.validateAction(s, pid, action, t1),
  },
  {
    validateAction: (s, pid, action, t1, t2) => CupidRole.validateAction(s, pid, action, t1, t2),
  },
  {
    validateAction: (s, pid, action, t1) => SheriffRole.validateAction(s, pid, action, t1),
  },
  {
    validateAction: (s, pid, action, t1) => SpecialVillagersRole.validateAction(s, pid, action, t1),
  },
  {
    validateAction: (s, pid, action, t1) => ThirdPartyRole.validateAction(s, pid, action, t1),
  },
];

const WerewolfEngine: GameEngine = {
  getInitialState(): WerewolfState {
    return initWerewolfGame([]);
  },

  validateAndApply(
    boardState: unknown,
    move: Record<string, unknown>,
    playerId: string,
  ): { newBoardState: unknown; isValid: boolean } {
    const state = structuredClone(boardState) as WerewolfState;
    const { action, targetId, targetId2 } = move as unknown as Move;

    const actor = state.players.find((p) => p.userId === playerId);
    // Dead avenger and dead sheriff can still act after dying
    const allowedDeadActions: string[] = ['avenger_target', 'sheriff_pass', 'avenger_choose'];
    const isAllowedDeadAction = actor && !actor.isAlive && allowedDeadActions.includes(action);

    if (!actor || (!actor.isAlive && !isAllowedDeadAction))
      return { newBoardState: state, isValid: false };

    // ── Night actions ──────────────────────────────────────────────────────
    if (state.phase === 'night') {
      for (const handler of ROLE_HANDLERS) {
        const result = handler.validateAction(state, playerId, action, targetId, targetId2);
        if (result !== null) {
          return { newBoardState: result.newState, isValid: result.isValid };
        }
      }
      return { newBoardState: state, isValid: false };
    }

    // ── Day discussion ─────────────────────────────────────────────────────
    if (state.phase === 'day_discussion') {
      // Stuttering judge signals second vote
      if (
        action === 'stuttering_judge_signal' &&
        actor.role === 'stuttering_judge' &&
        !state.stutteringJudgeUsed
      ) {
        state.stutteringJudgeUsed = true;
        state.stutteringJudgeSignaledThisDay = true;
        // Do NOT advance phase here — discussion continues until the timer expires.
        // The flag causes two vote rounds after discussion ends.
        return { newBoardState: state, isValid: true };
      }

      // Avenger picks target after death
      if (action === 'avenger_target' && actor.role === 'avenger' && !actor.isAlive && targetId) {
        const result = ThirdPartyRole.validateAction(state, playerId, action, targetId);
        if (result !== null) return { newBoardState: result.newState, isValid: result.isValid };
      }

      // Sheriff passes badge when dying (allowed while dead)
      if (action === 'sheriff_pass' && actor.role === 'sheriff' && targetId) {
        const result = SheriffRole.validateAction(state, playerId, action, targetId);
        if (result !== null) return { newBoardState: result.newState, isValid: result.isValid };
      }
    }

    // ── Day vote ───────────────────────────────────────────────────────────
    if (state.phase === 'day_vote' && action === 'vote') {
      // Idiot has no vote after revealed
      if (actor.role === 'fool' && state.foolRevealed) {
        return { newBoardState: state, isValid: false };
      }
      if (targetId !== undefined) {
        const target = targetId ? state.players.find((p) => p.userId === targetId) : null;
        if (targetId && (!target || !target.isAlive))
          return { newBoardState: state, isValid: false };
      }
      // Drunk: vote misdirected for first N rounds
      let effectiveVote = targetId ?? null;
      if (actor.role === 'drunk' && state.drunkDisorientedRoundsLeft > 0 && effectiveVote) {
        const candidates = state.alivePlayers.filter((id) => id !== playerId);
        if (candidates.length > 0) {
          effectiveVote = candidates[Math.floor(Math.random() * candidates.length)];
        }
      }
      state.votes[playerId] = effectiveVote;

      const allVoted = state.alivePlayers
        .filter((id) => {
          const p = state.players.find((pl) => pl.userId === id);
          return !(p?.role === 'fool' && state.foolRevealed);
        })
        .every((id) => id in state.votes);

      if (allVoted) {
        const resolved = resolveVote(state);
        // Stuttering judge second vote
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

export default WerewolfEngine;

EngineRegistry.register('werewolf', WerewolfEngine);

// Re-export for tests / external use
export {
  isNightComplete,
  resolveNight,
  resolveVote,
  checkWinCondition,
  initWerewolfGame,
  killPlayer,
};
