import { GameState, GameMove, GameResult, GameRoom, WerewolfPrivateInfo } from './game';
import { UUID } from './common';

// Client -> Server events
export interface ClientToServerEvents {
  'game:join': (roomId: UUID) => void;
  'game:leave': (roomId: UUID) => void;
  'game:ready': (roomId: UUID) => void;
  'game:start': (roomId: UUID) => void;
  'game:move': (payload: { roomId: UUID; moveData: Record<string, unknown> }) => void;
  'game:resign': (roomId: UUID) => void;
  'game:offer_draw': (roomId: UUID) => void;
  'game:accept_draw': (roomId: UUID) => void;
  'game:decline_draw': (roomId: UUID) => void;
  'chat:message': (payload: { roomId: UUID; content: string }) => void;
  'matchmaking:join': (gameType: string) => void;
  'matchmaking:leave': () => void;
}

// Server -> Client events
export interface ServerToClientEvents {
  'game:state': (state: GameState) => void;
  'game:move': (move: GameMove) => void;
  'game:result': (result: GameResult) => void;
  'game:player_connected': (userId: UUID) => void;
  'game:player_disconnected': (userId: UUID) => void;
  'game:room_update': (room: GameRoom) => void;
  'game:draw_offered': (byUserId: UUID) => void;
  'game:timer_update': (timers: Record<UUID, number>) => void;
  'matchmaking:matched': (room: GameRoom) => void;
  'matchmaking:queue_position': (position: number) => void;
  'chat:message': (payload: { userId: UUID; username: string; content: string; timestamp: number }) => void;
  'error': (payload: { code: string; message: string }) => void;
  'game:private_info': (info: WerewolfPrivateInfo) => void;
}

// Inter-service message queue events
export interface ServiceEvents {
  'game.created': { gameId: UUID; gameType: string; playerIds: UUID[] };
  'game.finished': { gameId: UUID; result: GameResult };
  'user.rating_updated': { userId: UUID; newRating: number; delta: number };
  'matchmaking.matched': { playerIds: UUID[]; gameType: string; roomId: UUID };
}
