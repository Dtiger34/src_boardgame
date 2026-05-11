import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '@boardgame/types';
import { MatchmakingService } from '../services/matchmaking.service';
import { GameService } from '../services/game.service';
import { logger } from '../logger';

const GAME_TYPES = (process.env.GAME_TYPES || 'gomoku').split(',');

export function startMatchmakingWorker(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  setInterval(async () => {
    for (const gameType of GAME_TYPES) {
      try {
        const match = await MatchmakingService.findMatch(gameType);
        if (!match) continue;

        const [a, b] = match;
        const room = await GameService.createRoom({
          gameType,
          isPrivate: false,
          createdBy: a.userId,
          username: a.username,
        });
        await GameService.joinRoom(room.id, b.userId, b.username);

        logger.info(`Matched ${a.username} vs ${b.username} in ${gameType}, room ${room.id}`);

        io.to(`user:${a.userId}`).emit('matchmaking:matched', room);
        io.to(`user:${b.userId}`).emit('matchmaking:matched', room);
      } catch (err) {
        logger.error('Matchmaking worker error', err);
      }
    }
  }, 2000);
}
