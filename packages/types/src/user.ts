import { UUID, Timestamp } from './common';

export interface User {
  id: UUID;
  username: string;
  email: string;
  avatarUrl?: string;
  rating: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserProfile extends User {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDraw: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
