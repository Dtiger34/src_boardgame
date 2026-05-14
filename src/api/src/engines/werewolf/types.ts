// ── Types ────────────────────────────────────────────────────────────────────

export type Role =
  | 'villager'
  | 'werewolf'
  | 'seer'
  | 'guard'
  | 'sheriff'
  | 'suicidal'
  | 'hunter'
  | 'witch'
  | 'cupid'
  | 'little_girl'
  | 'two_sisters'
  | 'three_brothers'
  | 'stuttering_judge'
  | 'rusty_knight'
  | 'devoted_servant'
  | 'wild_child'
  | 'fool'
  | 'drunk'
  | 'wolf_cub'
  | 'dog_wolf'
  | 'big_bad_wolf'
  | 'wolf_father'
  | 'hidden_wolf'
  | 'wolf_sorcerer'
  | 'thief'
  | 'cursed'
  | 'avenger'
  | 'impersonator'
  | 'white_wolf'
  | 'angel'
  | 'elder';

export type Team = 'village' | 'werewolf' | 'neutral' | 'third_party';
export type Phase = 'night' | 'day_discussion' | 'day_vote';
export type Action =
  | 'kill'
  | 'protect'
  | 'investigate'
  | 'vote'
  | 'witch_save'
  | 'witch_poison'
  | 'cupid_pair'
  | 'hunter_target'
  | 'wolf_father_convert'
  | 'wolf_sorcerer_disable'
  | 'white_wolf_kill'
  | 'thief_choose'
  | 'wild_child_model'
  | 'devoted_servant_follow'
  | 'impersonator_follow'
  | 'stuttering_judge_signal'
  | 'avenger_target'
  | 'dog_wolf_choose'
  | 'little_girl_peek'
  | 'big_bad_wolf_kill'
  | 'witch_skip'
  | 'sheriff_pass'
  | 'avenger_choose';

export interface PlayerInfo {
  userId: string;
  role: Role;
  team: Team;
  isAlive: boolean;
}

export interface NightActions {
  wolfVotes?: Record<string, string>;
  kill?: string;
  protect?: string;
  investigate?: string;
  investigateResult?: boolean;
  sheriffTarget?: string;
  witchSave?: string;
  witchPoison?: string;
  witchSkipped?: boolean;
  wolfFatherConvert?: boolean;
  wolfSorcererTarget?: string;
  whiteWolfKill?: string;
  cupidPair?: [string, string];
  thiefChoice?: string;
  wildChildModel?: string;
  devotedServantFollow?: string;
  impersonatorFollow?: string;
  secondKill?: string;
  bigBadWolfKill?: string;
  dogWolfChoose?: 'village' | 'werewolf';
  littleGirlPeeked?: boolean;
}

export interface WerewolfState {
  phase: Phase;
  round: number;
  phaseEndsAt: number;
  players: PlayerInfo[];
  alivePlayers: string[];
  deadPlayers: { userId: string; revealedRole: string }[];
  nightActions: NightActions;
  votes: Record<string, string | null>;
  lastKilled?: string;
  lastKilledExtra?: string;
  lastExecuted?: string;
  lastNoExecute?: boolean;
  roleCounts: Partial<Record<string, number>>;

  // Cupid
  lovers?: [string, string];

  // Witch
  witchSaveUsed: boolean;
  witchPoisonUsed: boolean;

  // Wolf cub — next night wolves may kill twice
  wolfCubNextDoubleKill: boolean;

  // Wolf father — one-time convert
  wolfFatherUsed: boolean;

  // Wolf sorcerer — disable ability (max 2 uses)
  wolfSorcererUses: number;
  disabledThisNight?: string;

  // Hidden wolf — appear as non-wolf to seer for N rounds
  hiddenWolfCamoRoundsLeft: number;

  // Elder — survives first bite; village loses abilities if lynched
  elderHits: number;
  elderPenaltyActive: boolean;

  // Wild child — model, converted flag
  wildChildModel?: string;
  wildChildConverted: boolean;

  // Devoted servant
  devotedServantFollows?: string;

  // Actor
  impersonatorFollows?: string;
  impersonatorActivated: boolean;

  // Idiot
  foolRevealed: boolean;

  // Stuttering judge
  stutteringJudgeUsed: boolean;
  stutteringJudgeSignaledThisDay: boolean;
  secondVoteTriggered: boolean;

  // Guard — track previous protect to prevent consecutive same-target
  previousProtect?: string;

  // Hunter — persisted across phase boundaries so lynched hunter can pull target
  hunterTarget?: string;

  // Big Bad Wolf — extra kill active until wolf_cub/wild_child/dog_wolf dies
  bigBadWolfKillsActive: boolean;

  // Two sisters / Three brothers — grouped for night-1 reveal
  sisterIds?: string[];
  brotherIds?: string[];

  // Drunk — disoriented for first N rounds
  drunkDisorientedRoundsLeft: number;

  // Rusty knight — dying wolf ID tracked for delayed kill
  rustyKnightWolfDying?: string;

  // Thief
  thiefCards?: [string, string];
  thiefDone: boolean;

  // Cursed
  cursedConverted: boolean;

  // Angel / Jester win flags
  specialWinner?: { userId: string; reason: string };

  eventLog: GameEvent[];
}

export type GameEventType =
  | 'killed_by_wolves'
  | 'killed_by_witch'
  | 'executed'
  | 'protected'
  | 'no_execute'
  | 'lover_died'
  | 'wolf_father_converted'
  | 'cursed_converted'
  | 'rusty_knight_wolf_dies'
  | 'white_wolf_kills'
  | 'fool_revealed'
  | 'hunter_kills'
  | 'wild_child_converted';

export interface GameEvent {
  round: number;
  type: GameEventType;
  userId: string;
  extra?: string;
}

export interface Move {
  action: Action;
  targetId?: string | null;
  targetId2?: string | null;
}
