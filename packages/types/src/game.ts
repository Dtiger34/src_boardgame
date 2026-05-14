import { UUID, Timestamp } from './common';

export type WerewolfPrivateInfo = {
  role: string;
  team: string;
  wolfTeam: string[];
  investigateResult?: boolean;
  investigateTarget?: string;
  wolfVotes?: Record<string, string>;
  sisterIds?: string[];
  brotherIds?: string[];
  lovers?: string[];
  witchKillTarget?: string;
  witchSaveUsed?: boolean;
  witchPoisonUsed?: boolean;
  hunterTarget?: string;
  thiefCards?: [string, string];
  wildChildModel?: string;
};

export type GameCatalogEntry = {
  gameType: string;
  name: string;
  description: string;
  rules: string;
  minPlayers: number;
  maxPlayers: number;
  isActive: boolean;
};

export type GameStatus = 'waiting' | 'in_progress' | 'finished' | 'abandoned';
export type PlayerColor = 'white' | 'black' | string;

export interface GamePlayer {
  userId: UUID;
  username: string;
  color: PlayerColor;
  timeLeftMs: number;
  isConnected: boolean;
  isReady?: boolean;
}

export interface GameMove {
  playerId: UUID;
  moveData: Record<string, unknown>;
  timestamp: Timestamp;
  moveIndex: number;
}

export interface GameState {
  id: UUID;
  gameType: string;
  status: GameStatus;
  players: GamePlayer[];
  boardState: unknown;
  moves: GameMove[];
  currentTurn: UUID;
  winner?: UUID;
  drawOfferedBy?: UUID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  timeControlMs?: number;
  createdBy?: UUID;
}

export interface GameResult {
  gameId: UUID;
  winner?: UUID;
  isDraw: boolean;
  reason: 'checkmate' | 'timeout' | 'resignation' | 'draw_agreement' | 'abandon' | string;
  ratingChanges: Record<UUID, number>;
  allRoles?: Record<UUID, string>;
}

export interface GameRoom {
  id: UUID;
  gameType: string;
  isPrivate: boolean;
  inviteCode?: string;
  maxPlayers: number;
  timeControlMs?: number;
  createdBy: UUID;
  players: GamePlayer[];
  status: GameStatus;
  customRoles?: Record<string, number>;
}
