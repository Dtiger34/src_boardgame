import type { WerewolfState } from '../types';
import { killPlayer, addEvent } from '../helpers';

export function validateAction(
  state: WerewolfState,
  playerId: string,
  action: string,
  targetId?: string | null,
): { newState: WerewolfState; isValid: boolean } | null {
  const actor = state.players.find((p) => p.userId === playerId);
  if (!actor || actor.role !== 'witch') return null;

  if (action === 'witch_save' && !state.witchSaveUsed) {
    if (targetId) {
      const target = state.players.find((p) => p.userId === targetId && p.isAlive);
      if (!target) return { newState: state, isValid: false };
    }
    state.nightActions.witchSave = targetId ?? undefined;
    return { newState: state, isValid: true };
  }

  if (action === 'witch_poison' && !state.witchPoisonUsed) {
    if (targetId) {
      const target = state.players.find((p) => p.userId === targetId && p.isAlive);
      if (!target) return { newState: state, isValid: false };
    }
    state.nightActions.witchPoison = targetId ?? undefined;
    return { newState: state, isValid: true };
  }

  return null;
}

export function resolveNight(state: WerewolfState): WerewolfState {
  const na = state.nightActions;

  // Witch poison (applied before main wolf kill so order is: poison → wolf kill)
  if (na.witchPoison && !state.witchPoisonUsed) {
    state.witchPoisonUsed = true;
    const target = state.players.find((p) => p.userId === na.witchPoison && p.isAlive);
    if (target) {
      killPlayer(state, target.userId);
      state.lastKilledExtra = target.userId;
      addEvent(state, 'killed_by_witch', target.userId);
    }
  }

  return state;
}

export function resolveVote(state: WerewolfState, _executedId: string | undefined): WerewolfState {
  return state;
}

export function isNightComplete(_state: WerewolfState): boolean {
  return true;
}
