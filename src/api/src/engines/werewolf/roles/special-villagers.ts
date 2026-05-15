import type { WerewolfState, Role } from '../types';
import { ROLE_TEAMS } from '../constants';
import { addEvent } from '../helpers';

export function validateAction(
  state: WerewolfState,
  playerId: string,
  action: string,
  targetId?: string | null,
): { newState: WerewolfState; isValid: boolean } | null {
  const actor = state.players.find((p) => p.userId === playerId);
  if (!actor) return null;

  // ── Wild child: pick role model night 1 ──────────────────────────────────
  if (
    action === 'wild_child_model' &&
    actor.role === 'wild_child' &&
    state.round === 1 &&
    !state.wildChildModel &&
    targetId
  ) {
    const target = state.players.find((p) => p.userId === targetId);
    if (!target || !target.isAlive) return { newState: state, isValid: false };
    state.nightActions.wildChildModel = targetId;
    return { newState: state, isValid: true };
  }

  // ── Actor: follow a player night 1 ───────────────────────────────────────
  if (
    action === 'impersonator_follow' &&
    actor.role === 'impersonator' &&
    state.round === 1 &&
    !state.impersonatorFollows &&
    targetId
  ) {
    const target = state.players.find((p) => p.userId === targetId);
    if (!target || !target.isAlive) return { newState: state, isValid: false };
    state.nightActions.impersonatorFollow = targetId;
    return { newState: state, isValid: true };
  }

  // ── Stuttering judge: signal second vote during day_discussion ───────────
  if (
    action === 'stuttering_judge_signal' &&
    actor.role === 'stuttering_judge' &&
    !state.stutteringJudgeUsed
  ) {
    state.stutteringJudgeUsed = true;
    state.stutteringJudgeSignaledThisDay = true;
    return { newState: state, isValid: true };
  }

  // ── Thief: choose one of two revealed cards night 1 ──────────────────────
  if (action === 'thief_choose' && actor.role === 'thief' && !state.thiefDone && targetId) {
    state.nightActions.thiefChoice = targetId;
    return { newState: state, isValid: true };
  }

  return null;
}

export function resolveNight(state: WerewolfState): WerewolfState {
  const na = state.nightActions;

  if (state.round === 1) {
    if (na.wildChildModel) state.wildChildModel = na.wildChildModel;
    if (na.impersonatorFollow) state.impersonatorFollows = na.impersonatorFollow;
  }

  // Thief chooses a role
  if (na.thiefChoice && !state.thiefDone && state.thiefCards) {
    const chosen = na.thiefChoice as Role;
    if (state.thiefCards.includes(chosen)) {
      const thief = state.players.find((p) => p.role === 'thief');
      if (thief) {
        thief.role = chosen;
        thief.team = ROLE_TEAMS[chosen];
        state.thiefDone = true;
      }
    }
  }

  // Drunk: decrement disorientation counter each night
  if (state.drunkDisorientedRoundsLeft > 0) state.drunkDisorientedRoundsLeft -= 1;

  return state;
}

/**
 * Check if fool (idiot) intercepts the execution.
 * Returns true if execution was prevented — caller must skip killPlayer.
 */
export function handleFoolExecution(state: WerewolfState, executedId: string): boolean {
  const executed = state.players.find((p) => p.userId === executedId);
  if (executed?.role === 'fool' && !state.foolRevealed) {
    state.foolRevealed = true;
    state.lastNoExecute = true;
    addEvent(state, 'fool_revealed', executed.userId);
    return true;
  }
  return false;
}

/** Post-vote hooks: suicidal win, impersonator inherit. */
export function resolveVote(state: WerewolfState, executedId: string | undefined): WerewolfState {
  if (!executedId) return state;

  const executed = state.players.find((p) => p.userId === executedId);
  if (!executed) return state;

  // Jester wins if lynched
  if (executed.role === 'suicidal') {
    state.specialWinner = { userId: executed.userId, reason: 'suicidal_lynched' };
  }

  // Actor inherits role when followed target executed
  if (state.impersonatorFollows === executedId && !state.impersonatorActivated) {
    const actorPlayer = state.players.find((p) => p.role === 'impersonator');
    if (actorPlayer && actorPlayer.isAlive) {
      actorPlayer.role = executed.role;
      actorPlayer.team = executed.team;
      state.impersonatorActivated = true;
    }
  }

  return state;
}

export function isNightComplete(state: WerewolfState): boolean {
  if (state.round !== 1) return true;

  const alive = (role: string): boolean => state.players.some((p) => p.isAlive && p.role === role);

  if (
    alive('wild_child') &&
    !state.wildChildModel &&
    state.nightActions.wildChildModel === undefined
  )
    return false;
  if (
    alive('impersonator') &&
    !state.impersonatorFollows &&
    state.nightActions.impersonatorFollow === undefined
  )
    return false;

  return true;
}

// ── Idiot reveal is handled inline in vote.ts (it prevents the kill) ─────────
// ── Rusty knight wolf-delayed-death tracked in helpers/night.ts ───────────────
