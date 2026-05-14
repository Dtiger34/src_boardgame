import type { WerewolfState } from '../types';

export function validateAction(
  state: WerewolfState,
  playerId: string,
  action: string,
  targetId?: string | null,
): { newState: WerewolfState; isValid: boolean } | null {
  const actor = state.players.find((p) => p.userId === playerId);
  if (!actor) return null;

  // Sheriff passes badge on death — allowed even when not alive
  if (action === 'sheriff_pass' && actor.role === 'sheriff' && targetId) {
    const target = state.players.find((p) => p.userId === targetId && p.isAlive);
    if (!target) return { newState: state, isValid: false };
    actor.role = 'villager';
    target.role = 'sheriff';
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
  return true;
}
