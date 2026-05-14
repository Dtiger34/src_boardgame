import type { WerewolfState } from './types';
import { PHASE_DURATION } from './constants';
import { aliveWolves, addEvent, killPlayer, isAbilityDisabled } from './helpers';
import {
  WolvesRole,
  SeerRole,
  GuardRole,
  WitchRole,
  HunterRole,
  CupidRole,
  SiblingsRole,
  SpecialVillagersRole,
  ThirdPartyRole,
} from './roles/index';

export function isNightComplete(state: WerewolfState): boolean {
  if (state.phase !== 'night') return false;

  if (!WolvesRole.isNightComplete(state)) return false;
  if (!SeerRole.isNightComplete(state)) return false;
  if (!GuardRole.isNightComplete(state)) return false;
  if (!WitchRole.isNightComplete(state)) return false;
  if (!HunterRole.isNightComplete(state)) return false;
  if (!CupidRole.isNightComplete(state)) return false;
  if (!SiblingsRole.isNightComplete(state)) return false;
  if (!SpecialVillagersRole.isNightComplete(state)) return false;
  if (!ThirdPartyRole.isNightComplete(state)) return false;

  return true;
}

export function resolveNight(state: WerewolfState): WerewolfState {
  const next = structuredClone(state) as WerewolfState;
  const na = next.nightActions;

  next.lastKilled = undefined;
  next.lastKilledExtra = undefined;
  next.lastNoExecute = false;
  next.disabledThisNight = undefined;
  next.rustyKnightWolfDying = undefined;

  // ── Round 1 first-night setups ────────────────────────────────────────────
  // Cupid pairs (sets lovers, may convert teams to third_party)
  CupidRole.resolveNight(next);

  // Special villager night-1 setups (wild child model, devoted servant, actor, thief)
  SpecialVillagersRole.resolveNight(next);

  // Dog wolf team choice
  WolvesRole.resolveNight(next);

  // Angel: wins if bitten first night
  if (next.round === 1) {
    const angelPlayer = next.players.find((p) => p.role === 'angel');
    if (angelPlayer && na.kill === angelPlayer.userId) {
      next.specialWinner = { userId: angelPlayer.userId, reason: 'angel_bitten_night1' };
    }
  }

  // ── Wolf sorcerer disable + white wolf kill (via WolvesRole) ──────────────
  // (already done inside WolvesRole.resolveNight above)

  // ── Seer investigate result ───────────────────────────────────────────────
  SeerRole.resolveNight(next);

  // ── Witch poison ─────────────────────────────────────────────────────────
  WitchRole.resolveNight(next);

  // ── Main wolf kill ────────────────────────────────────────────────────────
  const killTarget = na.kill;
  const protect = na.protect;

  if (killTarget) {
    const isProtected =
      killTarget === protect &&
      !isAbilityDisabled(next, next.players.find((p) => p.role === 'guard')?.userId ?? '');
    const isWitchSaved = !!na.witchSave && na.witchSave === killTarget && !next.witchSaveUsed;

    if (isWitchSaved) next.witchSaveUsed = true;

    // Wolf father: convert instead of kill (once)
    if (na.wolfFatherConvert && !next.wolfFatherUsed) {
      next.wolfFatherUsed = true;
      const victim = next.players.find((p) => p.userId === killTarget && p.isAlive);
      if (victim) {
        victim.team = 'werewolf';
        if (victim.role === 'cursed') next.cursedConverted = true;
        addEvent(next, 'wolf_father_converted', victim.userId);
      }
    } else if (!isProtected && !isWitchSaved) {
      const victim = next.players.find((p) => p.userId === killTarget && p.isAlive);
      if (victim) {
        // Cursed → becomes wolf instead of dying
        if (victim.role === 'cursed' && !next.cursedConverted) {
          next.cursedConverted = true;
          victim.team = 'werewolf';
          addEvent(next, 'cursed_converted', victim.userId);
        } else {
          // Elder needs 2 hits
          if (victim.role === 'elder') {
            if (next.elderHits === 0) {
              next.elderHits = 1;
            } else {
              killPlayer(next, killTarget);
              next.lastKilled = killTarget;
              addEvent(next, 'killed_by_wolves', killTarget);
            }
          } else {
            // Rusty knight: biting wolf gets delayed death
            const bitingWolf = aliveWolves(next).find((w) => w.isAlive);
            if (victim.role === 'rusty_knight' && bitingWolf) {
              next.rustyKnightWolfDying = bitingWolf.userId;
            }
            killPlayer(next, killTarget);
            next.lastKilled = killTarget;
            addEvent(next, 'killed_by_wolves', killTarget);

            if (victim.role === 'wolf_cub') {
              next.wolfCubNextDoubleKill = true;
            }
          }
        }
      }
    } else if (isProtected) {
      addEvent(next, 'protected', killTarget);
    }
  }

  // ── Hunter killed by wolves → pulls target ────────────────────────────────
  HunterRole.resolveNight(next);

  // ── Third-party night hooks ───────────────────────────────────────────────
  ThirdPartyRole.resolveNight(next);

  // ── Guard: persist protect target to enforce consecutive-night rule ────────
  GuardRole.resolveNight(next);

  // ── Wolf cub double kill + big bad wolf extra kill ─────────────────────────
  // (done inside WolvesRole.resolveNight, which ran above — but it needs to run
  //  AFTER the main kill so secondKill is resolved after wolfCubNextDoubleKill
  //  flag is potentially set this same night. We call the wolf secondary kills here.)
  const wna = next.nightActions;

  // Second wolf kill (wolf cub double kill)
  if (state.wolfCubNextDoubleKill && wna.secondKill) {
    next.wolfCubNextDoubleKill = false;
    const victim2 = next.players.find(
      (p) => p.userId === wna.secondKill && p.isAlive && p.team !== 'werewolf',
    );
    if (victim2) {
      killPlayer(next, victim2.userId);
      next.lastKilledExtra = next.lastKilledExtra ?? victim2.userId;
      addEvent(next, 'killed_by_wolves', victim2.userId);
    }
  }

  // Big bad wolf extra kill
  if (next.bigBadWolfKillsActive && wna.bigBadWolfKill) {
    const bbwTarget = next.players.find(
      (p) => p.userId === wna.bigBadWolfKill && p.isAlive && p.team !== 'werewolf',
    );
    if (bbwTarget) {
      killPlayer(next, bbwTarget.userId);
      next.lastKilledExtra = next.lastKilledExtra ?? bbwTarget.userId;
      addEvent(next, 'killed_by_wolves', bbwTarget.userId);
    }
  }

  next.nightActions = {};
  next.votes = {};
  next.phase = 'day_discussion';
  next.phaseEndsAt = Date.now() + PHASE_DURATION.day_discussion;
  next.round += 1;
  next.stutteringJudgeSignaledThisDay = false;
  next.secondVoteTriggered = false;
  return next;
}
