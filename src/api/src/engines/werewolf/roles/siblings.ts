import type { WerewolfState } from '../types';

// Two sisters and Three brothers: night 1 only — they wake to recognise each other.
// No active action to validate; just completeness checks.

export function validateAction(
  _state: WerewolfState,
  _playerId: string,
  _action: string,
): { newState: WerewolfState; isValid: boolean } | null {
  return null;
}

export function resolveNight(state: WerewolfState): WerewolfState {
  return state;
}

export function resolveVote(state: WerewolfState, _executedId: string | undefined): WerewolfState {
  return state;
}

export function isNightComplete(_state: WerewolfState): boolean {
  // Siblings have no blocking action — they are passive night-1 reveals
  return true;
}
