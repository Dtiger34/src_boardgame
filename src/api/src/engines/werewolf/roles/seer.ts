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

  if (action === 'investigate' && actor.role === 'seer' && targetId) {
    if (isAbilityDisabled(state, playerId)) return { newState: state, isValid: false };
    const target = state.players.find((p) => p.userId === targetId);
    if (!target || !target.isAlive) return { newState: state, isValid: false };
    const isHiddenWolf = target.role === 'hidden_wolf' && state.hiddenWolfCamoRoundsLeft > 0;
    state.nightActions.investigate = targetId;
    state.nightActions.investigateResult = target.team === 'werewolf' && !isHiddenWolf;
    return { newState: state, isValid: true };
  }

  return null;
}

export function resolveNight(state: WerewolfState): WerewolfState {
  const na = state.nightActions;
  if (na.investigate) {
    const target = state.players.find((p) => p.userId === na.investigate);
    if (target) {
      const isHiddenWolf = target.role === 'hidden_wolf' && state.hiddenWolfCamoRoundsLeft > 0;
      state.nightActions.investigateResult = target.team === 'werewolf' && !isHiddenWolf;
      if (state.hiddenWolfCamoRoundsLeft > 0) state.hiddenWolfCamoRoundsLeft -= 1;
    }
  }
  return state;
}

export function resolveVote(state: WerewolfState, _executedId: string | undefined): WerewolfState {
  return state;
}

export function isNightComplete(state: WerewolfState): boolean {
  const seer = state.players.find((p) => p.isAlive && p.role === 'seer');
  if (!seer) return true;
  if (isAbilityDisabled(state, seer.userId)) return true;
  return state.nightActions.investigate !== undefined;
}
