import type { WerewolfState } from '../types';

export function validateAction(
  state: WerewolfState,
  playerId: string,
  action: string,
  targetId?: string | null,
  targetId2?: string | null,
): { newState: WerewolfState; isValid: boolean } | null {
  const actor = state.players.find((p) => p.userId === playerId);
  if (!actor || actor.role !== 'cupid') return null;

  if (action === 'cupid_pair' && state.round === 1 && !state.lovers && targetId && targetId2) {
    const pa = state.players.find((p) => p.userId === targetId);
    const pb = state.players.find((p) => p.userId === targetId2);
    if (!pa || !pb || !pa.isAlive || !pb.isAlive) return { newState: state, isValid: false };
    state.nightActions.cupidPair = [targetId, targetId2];
    return { newState: state, isValid: true };
  }

  return null;
}

export function resolveNight(state: WerewolfState): WerewolfState {
  const na = state.nightActions;
  if (state.round === 1 && na.cupidPair) {
    const [a, b] = na.cupidPair;
    const pa = state.players.find((p) => p.userId === a);
    const pb = state.players.find((p) => p.userId === b);
    if (pa && pb) {
      pa.team = 'third_party';
      pb.team = 'third_party';
      state.lovers = [a, b];
    }
  }
  return state;
}

export function resolveVote(state: WerewolfState, _executedId: string | undefined): WerewolfState {
  return state;
}

export function isNightComplete(state: WerewolfState): boolean {
  if (state.round !== 1) return true;
  const cupid = state.players.find((p) => p.isAlive && p.role === 'cupid');
  if (!cupid) return true;
  if (state.lovers) return true;
  return state.nightActions.cupidPair !== undefined;
}
