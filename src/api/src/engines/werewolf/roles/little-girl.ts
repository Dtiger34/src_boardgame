import type { WerewolfState } from '../types';

export function validateAction(
  state: WerewolfState,
  playerId: string,
  action: string,
): { newState: WerewolfState; isValid: boolean } | null {
  const actor = state.players.find((p) => p.userId === playerId);
  if (!actor || actor.role !== 'little_girl') return null;

  // Little girl can peek from round 2 onward during wolf phase
  if (action === 'little_girl_peek' && state.round >= 2) {
    state.nightActions.littleGirlPeeked = true;
    return { newState: state, isValid: true };
  }

  return null;
}

export function resolveNight(state: WerewolfState): WerewolfState {
  return state;
}

export function resolveVote(state: WerewolfState, _executedId: string | undefined): WerewolfState {
  return state;
}

export function isNightComplete(_state: WerewolfState): boolean {
  // Peek is optional — never blocks night completion
  return true;
}
