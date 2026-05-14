import type { Role, Team, Phase } from './types';

export const ROLE_TEAMS: Record<Role, Team> = {
  villager: 'village',
  seer: 'village',
  guard: 'village',
  sheriff: 'village',
  hunter: 'village',
  witch: 'village',
  cupid: 'village',
  little_girl: 'village',
  two_sisters: 'village',
  three_brothers: 'village',
  stuttering_judge: 'village',
  rusty_knight: 'village',
  devoted_servant: 'village',
  wild_child: 'village',
  fool: 'village',
  drunk: 'village',
  suicidal: 'neutral',
  white_wolf: 'neutral',
  angel: 'neutral',
  elder: 'neutral',
  thief: 'third_party',
  cursed: 'third_party',
  avenger: 'third_party',
  impersonator: 'third_party',
  werewolf: 'werewolf',
  wolf_cub: 'werewolf',
  dog_wolf: 'werewolf',
  big_bad_wolf: 'werewolf',
  wolf_father: 'werewolf',
  hidden_wolf: 'werewolf',
  wolf_sorcerer: 'werewolf',
};

export const VILLAGE_ROLES_WITH_NIGHT_ACTION: Role[] = [
  'seer', 'guard', 'sheriff', 'hunter', 'witch', 'cupid',
  'devoted_servant', 'wild_child', 'impersonator',
];

export const PHASE_DURATION: Record<Phase, number> = {
  night: 60_000,
  day_discussion: 120_000,
  day_vote: 60_000,
};
