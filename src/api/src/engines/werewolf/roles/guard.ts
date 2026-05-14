import type { WerewolfState } from '../types';
import { isAbilityDisabled } from '../helpers';

export function validateAction(
  state: WerewolfState,
  playerId: string,
  action: string,
  targetId?: string | null,
): { newState: WerewolfState; isValid: boolean } | null {
  const actor = state.players.find((p) => p.userId === playerId);
  if (!actor) return null;

  if (action === 'protect' && actor.role === 'guard' && targetId) {
    if (isAbilityDisabled(state, playerId)) return { newState: state, isValid: false };
    // Cannot protect the same person two consecutive nights
    if (targetId === state.previousProtect) return { newState: state, isValid: false };
    const target = state.players.find((p) => p.userId === targetId);
    if (!target || !target.isAlive) return { newState: state, isValid: false };
    state.nightActions.protect = targetId;
    return { newState: state, isValid: true };
  }

  return null;
}

export function resolveNight(state: WerewolfState): WerewolfState {
  // Persist protect target to enforce consecutive-night rule
  state.previousProtect = state.nightActions.protect;
  return state;
}

export function resolveVote(state: WerewolfState, _executedId: string | undefined): WerewolfState {
  return state;
}

export function isNightComplete(state: WerewolfState): boolean {
  const guard = state.players.find((p) => p.isAlive && p.role === 'guard');
  if (!guard) return true;
  if (isAbilityDisabled(state, guard.userId)) return true;
  return state.nightActions.protect !== undefined;
}
