import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '@boardgame/types';
import { GameService } from '../services/game.service';
import { UserService } from '../services/user.service';
import { logger } from '../logger';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerGameHandlers(io: IO, socket: Socket) {
  const { userId, username } = socket.data as { userId: string; username: string };

  socket.on('game:join', async (roomId) => {
    socket.join(`room:${roomId}`);

    // If room has 2 players and game not started, start it
    const room = await GameService.getRoom(roomId).catch(() => null);
    if (room && room.status === 'waiting') {
      try {
        const joined = await GameService.joinRoom(roomId, userId, username);
        if (joined.players.length === 2) {
          const game = await GameService.startGame(roomId);
          io.to(`room:${roomId}`).emit('game:state', game);
        }
      } catch {
        // already joined or full
        const game = await GameService.getGame(roomId);
        if (game) socket.emit('game:state', game);
      }
    } else {
      const game = await GameService.getGame(roomId);
      if (game) socket.emit('game:state', game);
    }

    io.to(`room:${roomId}`).emit('game:player_connected', userId);
  });

  socket.on('game:leave', (roomId) => {
    socket.leave(`room:${roomId}`);
    io.to(`room:${roomId}`).emit('game:player_disconnected', userId);
  });

  socket.on('game:move', async ({ roomId, moveData }) => {
    try {
      const { game, result } = await GameService.applyMove(roomId, userId, moveData);
      io.to(`room:${roomId}`).emit('game:state', game);
      if (result) {
        io.to(`room:${roomId}`).emit('game:result', result);
        // Update ratings
        for (const [uid, delta] of Object.entries(result.ratingChanges)) {
          UserService.updateRating(uid, delta).catch(() => {});
        }
      }
    } catch (err: any) {
      socket.emit('error', { code: err.code || 'MOVE_ERROR', message: err.message });
    }
  });

  socket.on('game:resign', async (roomId) => {
    try {
      const result = await GameService.resign(roomId, userId);
      io.to(`room:${roomId}`).emit('game:result', result);
      for (const [uid, delta] of Object.entries(result.ratingChanges)) {
        UserService.updateRating(uid, delta).catch(() => {});
      }
    } catch (err: any) {
      socket.emit('error', { code: 'RESIGN_ERROR', message: err.message });
    }
  });

  socket.on('game:offer_draw', (roomId) => {
    socket.to(`room:${roomId}`).emit('game:draw_offered', userId);
  });

  socket.on('game:accept_draw', async (roomId) => {
    const game = await GameService.getGame(roomId);
    if (!game) return;
    const result = {
      gameId: game.id,
      isDraw: true,
      reason: 'draw_agreement',
      ratingChanges: {} as Record<string, number>,
    };
    io.to(`room:${roomId}`).emit('game:result', result);
  });

  socket.on('game:decline_draw', (roomId) => {
    socket.to(`room:${roomId}`).emit('error', { code: 'DRAW_DECLINED', message: 'Draw offer declined' });
  });
}
