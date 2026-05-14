import type { WerewolfState } from '../types';
import { killPlayer, addEvent } from '../helpers';

export function validateAction(
  state: WerewolfState,
  playerId: string,
  action: string,
  targetId?: string | null,
): { newState: WerewolfState; isValid: boolean } | null {
  const actor = state.players.find((p) => p.userId === playerId);
  if (!actor || actor.role !== 'hunter') return null;

  if (action === 'hunter_target') {
    if (targetId) {
      const target = state.players.find((p) => p.userId === targetId && p.isAlive);
      if (!target) return { newState: state, isValid: false };
    }
    state.hunterTarget = targetId ?? undefined;
    return { newState: state, isValid: true };
  }

  return null;
}

/** If hunter was killed by wolves this night, their chosen target also dies. */
export function resolveNight(state: WerewolfState): WerewolfState {
  if (!state.lastKilled || !state.hunterTarget) return state;
  const killed = state.players.find((p) => p.userId === state.lastKilled);
  if (killed?.role !== 'hunter') return state;
  const prey = state.players.find((p) => p.userId === state.hunterTarget && p.isAlive);
  if (prey) {
    killPlayer(state, prey.userId);
    addEvent(state, 'hunter_kills', prey.userId, killed.userId);
  }
  return state;
}

/**
 * When hunter is executed by vote, their chosen target also dies.
 * Called from vote.ts after execution.
 */
export function resolveVote(state: WerewolfState, executedId: string | undefined): WerewolfState {
  if (!executedId) return state;
  const executed = state.players.find((p) => p.userId === executedId);
  if (executed?.role !== 'hunter') return state;

  if (state.hunterTarget) {
    const hunterPrey = state.players.find((p) => p.userId === state.hunterTarget && p.isAlive);
    if (hunterPrey) {
      killPlayer(state, hunterPrey.userId);
      addEvent(state, 'hunter_kills', hunterPrey.userId, executedId);
    }
  }
  return state;
}

export function isNightComplete(_state: WerewolfState): boolean {
  return true;
}
