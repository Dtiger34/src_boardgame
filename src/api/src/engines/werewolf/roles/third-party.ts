import type { WerewolfState } from '../types';
import { killPlayer } from '../helpers';

export function validateAction(
  state: WerewolfState,
  playerId: string,
  action: string,
  targetId?: string | null,
): { newState: WerewolfState; isValid: boolean } | null {
  const actor = state.players.find((p) => p.userId === playerId);
  if (!actor) return null;

  // Avenger chooses a faction on night 1
  if (
    action === 'avenger_choose' &&
    actor.role === 'avenger' &&
    actor.isAlive &&
    state.round === 1 &&
    (targetId === 'village' || targetId === 'werewolf')
  ) {
    actor.team = targetId as 'village' | 'werewolf';
    return { newState: state, isValid: true };
  }

  // Avenger: after dying, picks 1 player from the opposing faction to also die
  // Allowed even when dead (engine.ts whitelists avenger_target)
  if (action === 'avenger_target' && actor.role === 'avenger' && !actor.isAlive && targetId) {
    const target = state.players.find((p) => p.userId === targetId && p.isAlive);
    if (target && target.team !== actor.team) {
      killPlayer(state, targetId);
      return { newState: state, isValid: true };
    }
    return { newState: state, isValid: false };
  }

  return null;
}

export function resolveNight(state: WerewolfState): WerewolfState {
  return state;
}

/** Post-vote: angel wins if lynched day 1 (round === 2 after first night). */
export function resolveVote(state: WerewolfState, executedId: string | undefined): WerewolfState {
  if (!executedId) return state;
  const executed = state.players.find((p) => p.userId === executedId);
  if (!executed) return state;

  if (executed.role === 'angel' && state.round === 2) {
    state.specialWinner = { userId: executed.userId, reason: 'angel_lynched_day1' };
  }

  return state;
}

export function isNightComplete(state: WerewolfState): boolean {
  // Avenger must choose faction on round 1
  if (state.round === 1) {
    const avenger = state.players.find((p) => p.isAlive && p.role === 'avenger');
    if (avenger && avenger.team === 'third_party') return false; // hasn't chosen yet
  }
  return true;
}
