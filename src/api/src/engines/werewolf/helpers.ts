import type { Role, PlayerInfo, WerewolfState, GameEventType } from './types';
import { ROLE_TEAMS } from './constants';

export function buildRoleList(playerCount: number): Role[] {
  if (playerCount < 2) throw new Error('Need at least 2 players');
  const roles: Role[] = [];

  if (playerCount >= 4) roles.push('seer');
  if (playerCount >= 7) roles.push('witch');
  if (playerCount >= 8) roles.push('guard');
  if (playerCount >= 9) roles.push('hunter');
  if (playerCount >= 10) {
    roles.push('sheriff');
  }
  if (playerCount >= 12) roles.push('cupid');

  const wolfCount =
    playerCount <= 3 ? 1 : playerCount <= 6 ? 1 : playerCount <= 9 ? 2 : playerCount <= 12 ? 3 : 4;
  for (let i = 0; i < wolfCount; i++) roles.push('werewolf');

  while (roles.length < playerCount) roles.push('villager');

  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  return roles;
}

export function buildCustomRoleList(customRoles: Record<string, number>): Role[] {
  const roles: Role[] = [];
  for (const [role, count] of Object.entries(customRoles)) {
    for (let i = 0; i < count; i++) roles.push(role as Role);
  }
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  return roles;
}

export function aliveWolves(state: WerewolfState): PlayerInfo[] {
  return state.players.filter((p) => p.isAlive && p.team === 'werewolf');
}

export function aliveVillagers(state: WerewolfState): PlayerInfo[] {
  return state.players.filter((p) => p.isAlive && p.team === 'village');
}

export function addEvent(
  state: WerewolfState,
  type: GameEventType,
  userId: string,
  extra?: string,
): void {
  (state.eventLog ??= []).push({ round: state.round, type, userId, extra });
}

export function killPlayer(state: WerewolfState, userId: string): void {
  const p = state.players.find((pl) => pl.userId === userId);
  if (!p || !p.isAlive) return;
  p.isAlive = false;
  state.alivePlayers = state.alivePlayers.filter((id) => id !== userId);
  state.deadPlayers.push({ userId, revealedRole: p.role });

  // Lover dies → other lover dies too
  if (state.lovers) {
    const [a, b] = state.lovers;
    if (userId === a) killPlayer(state, b);
    else if (userId === b) killPlayer(state, a);
  }

  // Wild child: model dies → convert to wolf
  if (state.wildChildModel === userId && !state.wildChildConverted) {
    state.wildChildConverted = true;
    const wc = state.players.find((pl) => pl.isAlive && pl.role === 'wild_child');
    if (wc) wc.team = 'werewolf';
  }

  // Big bad wolf loses extra kill when wolf_cub / wild_child / dog_wolf dies
  const specialWolfRoles: string[] = ['wolf_cub', 'wild_child', 'dog_wolf'];
  if (specialWolfRoles.includes(p.role)) {
    state.bigBadWolfKillsActive = false;
  }
}

export function isAbilityDisabled(state: WerewolfState, userId: string): boolean {
  return state.elderPenaltyActive || state.disabledThisNight === userId;
}
