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

export interface WerewolfPublicState {
  phase: 'night' | 'day_discussion' | 'day_vote';
  round: number;
  phaseEndsAt: number;
  alivePlayers: string[];
  deadPlayers: { userId: string; revealedRole: string }[];
  votes: Record<string, string | null>;
  lastKilled?: string;
  lastExecuted?: string;
  lastNoExecute?: boolean;
  nightActionsDone: Record<string, boolean>;
  roleCounts?: Partial<Record<string, number>>;
  eventLog: GameEvent[];
  wolfFatherUsed: boolean;
  wolfSorcererUses: number;
  bigBadWolfKillsActive: boolean;
  stutteringJudgeUsed: boolean;
}
