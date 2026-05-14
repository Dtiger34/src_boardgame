import type { WerewolfState } from './types';
import { PHASE_DURATION } from './constants';
import { addEvent, killPlayer } from './helpers';
import { HunterRole, SpecialVillagersRole, ThirdPartyRole, SheriffRole } from './roles/index';

export function resolveVote(state: WerewolfState): WerewolfState {
  const next = structuredClone(state) as WerewolfState;
  const tally: Record<string, number> = {};

  for (const [voterId, targetId] of Object.entries(next.votes)) {
    if (!targetId) continue;
    // Sheriff vote counts double
    const voter = next.players.find((p) => p.userId === voterId);
    const weight = voter?.role === 'sheriff' ? 2 : 1;
    tally[targetId] = (tally[targetId] ?? 0) + weight;
  }

  let topTarget: string | undefined;
  let topCount = 0;
  let tied = false;

  for (const [id, count] of Object.entries(tally)) {
    if (count > topCount) {
      topTarget = id;
      topCount = count;
      tied = false;
    } else if (count === topCount) {
      tied = true;
    }
  }

  next.lastExecuted = undefined;
  next.lastNoExecute = false;

  // Rusty knight wolf dies today (delayed from last night)
  if (next.rustyKnightWolfDying) {
    killPlayer(next, next.rustyKnightWolfDying);
    addEvent(next, 'rusty_knight_wolf_dies', next.rustyKnightWolfDying);
    next.rustyKnightWolfDying = undefined;
  }

  if (topTarget && !tied) {
    const executed = next.players.find((p) => p.userId === topTarget);
    if (executed && executed.isAlive) {
      // Fool intercepts execution: survives, reveals card, loses vote forever
      const foolIntercepted = SpecialVillagersRole.handleFoolExecution(next, topTarget);
      if (!foolIntercepted) {
        if (executed.role === 'elder') next.elderPenaltyActive = true;

        // Hunter: pulls persistent target with them when lynched
        HunterRole.resolveVote(next, topTarget);

        killPlayer(next, topTarget);
        next.lastExecuted = topTarget;
        addEvent(next, 'executed', topTarget);

        // Sheriff passes badge if needed
        SheriffRole.resolveVote(next, topTarget);

        // Suicidal win, impersonator inherit, devoted servant ability loss
        SpecialVillagersRole.resolveVote(next, topTarget);
        ThirdPartyRole.resolveVote(next, topTarget);
      }
    }
  } else {
    next.lastNoExecute = true;
    addEvent(next, 'no_execute', '');
  }

  next.votes = {};
  next.nightActions = {};
  next.phase = 'night';
  next.phaseEndsAt = Date.now() + PHASE_DURATION.night;
  return next;
}
