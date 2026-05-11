import { UUID, Timestamp } from './common';

export type GameStatus = 'waiting' | 'in_progress' | 'finished' | 'abandoned';
export type PlayerColor = 'white' | 'black' | string;

export interface GamePlayer {
  userId: UUID;
  username: string;
  color: PlayerColor;
  timeLeftMs: number;
  isConnected: boolean;
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
}

export interface GameResult {
  gameId: UUID;
  winner?: UUID;
  isDraw: boolean;
  reason: 'checkmate' | 'timeout' | 'resignation' | 'draw_agreement' | 'abandon' | string;
  ratingChanges: Record<UUID, number>;
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
}
