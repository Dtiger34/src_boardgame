import type { WerewolfState } from '../types';
import { killPlayer, addEvent, aliveWolves } from '../helpers';

// ── Validate + apply wolf-team night actions ──────────────────────────────────

export function validateAction(
  state: WerewolfState,
  playerId: string,
  action: string,
  targetId?: string | null,
): { newState: WerewolfState; isValid: boolean } | null {
  const actor = state.players.find((p) => p.userId === playerId);
  if (!actor) return null;

  // ── Regular wolf kill ──────────────────────────────────────────────────────
  if (action === 'kill' && actor.team === 'werewolf' && actor.role !== 'white_wolf' && targetId) {
    const target = state.players.find((p) => p.userId === targetId);
    if (!target || !target.isAlive || target.team === 'werewolf') {
      return { newState: state, isValid: false };
    }

    if (state.wolfCubNextDoubleKill && state.nightActions.kill !== undefined) {
      // Second kill phase (wolf cub double-kill)
      state.nightActions.wolfVotes ??= {};
      state.nightActions.wolfVotes[playerId] = targetId;
      const wolves2 = state.players.filter(
        (p) => p.isAlive && p.team === 'werewolf' && p.role !== 'white_wolf',
      );
      if (wolves2.every((w) => state.nightActions.wolfVotes![w.userId] !== undefined)) {
        const tally: Record<string, number> = {};
        for (const v of Object.values(state.nightActions.wolfVotes)) tally[v] = (tally[v] ?? 0) + 1;
        state.nightActions.secondKill = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
      }
    } else {
      // Primary kill
      state.nightActions.wolfVotes ??= {};
      state.nightActions.wolfVotes[playerId] = targetId;
      const wolves = state.players.filter(
        (p) => p.isAlive && p.team === 'werewolf' && p.role !== 'white_wolf',
      );
      if (wolves.every((w) => state.nightActions.wolfVotes![w.userId] !== undefined)) {
        const tally: Record<string, number> = {};
        for (const v of Object.values(state.nightActions.wolfVotes)) tally[v] = (tally[v] ?? 0) + 1;
        state.nightActions.kill = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
      }
    }
    return { newState: state, isValid: true };
  }

  // ── Wolf father convert ────────────────────────────────────────────────────
  if (action === 'wolf_father_convert' && actor.role === 'wolf_father' && !state.wolfFatherUsed) {
    state.nightActions.wolfFatherConvert = true;
    return { newState: state, isValid: true };
  }

  // ── White wolf kills another wolf every 2 nights ───────────────────────────
  if (
    action === 'white_wolf_kill' &&
    actor.role === 'white_wolf' &&
    state.round % 2 === 0 &&
    targetId
  ) {
    const target = state.players.find((p) => p.userId === targetId);
    if (!target || !target.isAlive || target.team !== 'werewolf' || target.userId === playerId) {
      return { newState: state, isValid: false };
    }
    state.nightActions.whiteWolfKill = targetId;
    return { newState: state, isValid: true };
  }

  // ── Wolf sorcerer disables a villager's ability for 1 night (max 2 uses) ──
  if (
    action === 'wolf_sorcerer_disable' &&
    actor.role === 'wolf_sorcerer' &&
    state.wolfSorcererUses < 2 &&
    targetId
  ) {
    const target = state.players.find((p) => p.userId === targetId);
    if (!target || !target.isAlive || target.team === 'werewolf') {
      return { newState: state, isValid: false };
    }
    state.nightActions.wolfSorcererTarget = targetId;
    return { newState: state, isValid: true };
  }

  // ── Big bad wolf extra kill (active while wolf_cub/wild_child/dog_wolf alive) ─
  if (
    action === 'big_bad_wolf_kill' &&
    actor.role === 'big_bad_wolf' &&
    state.bigBadWolfKillsActive &&
    targetId
  ) {
    const target = state.players.find((p) => p.userId === targetId);
    if (!target || !target.isAlive || target.team === 'werewolf') {
      return { newState: state, isValid: false };
    }
    state.nightActions.bigBadWolfKill = targetId;
    return { newState: state, isValid: true };
  }

  // ── Dog wolf: choose team on round 1 ─────────────────────────────────────
  if (
    action === 'dog_wolf_choose' &&
    actor.role === 'dog_wolf' &&
    state.round === 1 &&
    (targetId === 'village' || targetId === 'werewolf')
  ) {
    state.nightActions.dogWolfChoose = targetId as 'village' | 'werewolf';
    return { newState: state, isValid: true };
  }

  return null;
}

// ── Resolve night effects for wolf-team roles ─────────────────────────────────

export function resolveNight(state: WerewolfState): WerewolfState {
  const na = state.nightActions;

  // ── Dog wolf team choice ───────────────────────────────────────────────────
  if (na.dogWolfChoose) {
    const dogWolf = state.players.find((p) => p.role === 'dog_wolf');
    if (dogWolf) {
      dogWolf.team = na.dogWolfChoose;
    }
  }

  // ── Wolf sorcerer disable ─────────────────────────────────────────────────
  if (na.wolfSorcererTarget && state.wolfSorcererUses < 2) {
    state.disabledThisNight = na.wolfSorcererTarget;
    state.wolfSorcererUses += 1;
  }

  // ── White wolf kills a wolf ───────────────────────────────────────────────
  if (state.round % 2 === 0 && na.whiteWolfKill) {
    const target = state.players.find(
      (p) =>
        p.userId === na.whiteWolfKill &&
        p.isAlive &&
        p.team === 'werewolf' &&
        p.role !== 'white_wolf',
    );
    if (target) {
      killPlayer(state, target.userId);
      addEvent(state, 'white_wolf_kills', target.userId);
    }
  }

  // ── Wolf father: convert bitten victim to wolf ────────────────────────────
  // (applied during main kill resolution in night.ts)

  // ── Second wolf kill (wolf cub double kill) ───────────────────────────────
  if (state.wolfCubNextDoubleKill && na.secondKill) {
    state.wolfCubNextDoubleKill = false;
    const victim2 = state.players.find(
      (p) => p.userId === na.secondKill && p.isAlive && p.team !== 'werewolf',
    );
    if (victim2) {
      killPlayer(state, victim2.userId);
      state.lastKilledExtra = state.lastKilledExtra ?? victim2.userId;
      addEvent(state, 'killed_by_wolves', victim2.userId);
    }
  }

  // ── Big bad wolf extra kill ───────────────────────────────────────────────
  if (state.bigBadWolfKillsActive && na.bigBadWolfKill) {
    const bbwTarget = state.players.find(
      (p) => p.userId === na.bigBadWolfKill && p.isAlive && p.team !== 'werewolf',
    );
    if (bbwTarget) {
      killPlayer(state, bbwTarget.userId);
      state.lastKilledExtra = state.lastKilledExtra ?? bbwTarget.userId;
      addEvent(state, 'killed_by_wolves', bbwTarget.userId);
    }
  }

  return state;
}

// ── isNightComplete checks for wolves ─────────────────────────────────────────

export function isNightComplete(state: WerewolfState): boolean {
  const wolves = aliveWolves(state);
  if (wolves.length > 0 && state.nightActions.kill === undefined) return false;
  if (state.wolfCubNextDoubleKill && state.nightActions.secondKill === undefined) return false;

  const alive = (role: string): boolean => state.players.some((p) => p.isAlive && p.role === role);

  if (state.round === 1 && alive('dog_wolf') && state.nightActions.dogWolfChoose === undefined)
    return false;

  if (
    state.bigBadWolfKillsActive &&
    alive('big_bad_wolf') &&
    state.nightActions.bigBadWolfKill === undefined
  )
    return false;

  if (
    state.round % 2 === 0 &&
    alive('white_wolf') &&
    state.nightActions.whiteWolfKill === undefined
  )
    return false;

  return true;
}

// ── resolveVote hook — no post-vote logic for wolves ─────────────────────────

export function resolveVote(state: WerewolfState, _executedId: string | undefined): WerewolfState {
  return state;
}
