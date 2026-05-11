import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '@boardgame/types';
import { GameService } from '../services/game.service';
import { UserService } from '../services/user.service';
import { schedulePhase, clearPhaseTimer } from './werewolf-phase';
import { WerewolfState } from '../engines/werewolf';
import { logger } from '../logger';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerGameHandlers(io: IO, socket: Socket) {
  const { userId, username } = socket.data as { userId: string; username: string };

  async function handleLeaveRoom(roomId: string) {
    socket.leave(`room:${roomId}`);
    await GameService.leaveRoom(roomId, userId);

    const remaining = await io.in(`room:${roomId}`).fetchSockets();
    if (remaining.length === 0) {
      clearPhaseTimer(roomId);
      return;
    }

    io.to(`room:${roomId}`).emit('game:player_disconnected', userId);
  }

  socket.on('game:join', async (roomId) => {
    socket.join(`room:${roomId}`);
    socket.join(`user:${userId}`);
    socket.data.roomId = roomId;

    const room = await GameService.getRoom(roomId).catch(() => null);
    if (!room) return;

    if (room.status === 'in_progress') {
      const game = await GameService.getGame(roomId);
      if (game) {
        if (game.gameType === 'werewolf') {
          socket.emit('game:state', GameService.scrubGameState(game));
          const info = GameService.getWerewolfPrivateInfo(game, userId);
          if (info) socket.emit('game:private_info', info);
        } else {
          socket.emit('game:state', game);
        }
      }
      io.to(`room:${roomId}`).emit('game:player_connected', userId);
      return;
    }

    // status === 'waiting': join player if not already in
    try {
      const joined = await GameService.joinRoom(roomId, userId, username);
      io.to(`room:${roomId}`).emit('game:room_update', joined);
    } catch {
      io.to(`room:${roomId}`).emit('game:room_update', room);
    }
  });

  socket.on('game:ready', async (roomId) => {
    const room = await GameService.setPlayerReady(roomId, userId).catch(() => null);
    if (room) io.to(`room:${roomId}`).emit('game:room_update', room);
  });

  socket.on('game:start', async (roomId) => {
    const room = await GameService.getRoom(roomId).catch(() => null);
    if (!room) return;
    if (room.createdBy !== userId) {
      socket.emit('error', { code: 'FORBIDDEN', message: 'Only host can start the game' });
      return;
    }
    const minPlayers = room.gameType === 'werewolf' ? 4 : 2;
    if (room.players.length < minPlayers) {
      socket.emit('error', { code: 'NOT_ENOUGH_PLAYERS', message: `Need at least ${minPlayers} players` });
      return;
    }
    try {
      const game = await GameService.startGame(roomId);

      if (game.gameType === 'werewolf') {
        const publicGame = GameService.scrubGameState(game);
        io.to(`room:${roomId}`).emit('game:state', publicGame);
        for (const player of game.players) {
          io.to(`user:${player.userId}`).emit('game:state', publicGame);
          const info = GameService.getWerewolfPrivateInfo(game, player.userId);
          if (info) io.to(`user:${player.userId}`).emit('game:private_info', info);
        }
        const state = game.boardState as WerewolfState;
        schedulePhase(io, roomId, state.phaseEndsAt - Date.now());
      } else {
        io.to(`room:${roomId}`).emit('game:state', game);
        for (const player of game.players) {
          io.to(`user:${player.userId}`).emit('game:state', game);
        }
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message: string };
      socket.emit('error', { code: e.code || 'START_ERROR', message: e.message });
    }
  });

  socket.on('game:leave', async (roomId) => {
    socket.data.roomId = undefined;
    await handleLeaveRoom(roomId);
  });

  socket.on('disconnect', async () => {
    const roomId = socket.data.roomId as string | undefined;
    if (roomId) await handleLeaveRoom(roomId);
  });

  socket.on('game:move', async ({ roomId, moveData }) => {
    try {
      const gameBefore = await GameService.getGame(roomId);
      const phaseBefore = gameBefore?.gameType === 'werewolf'
        ? (gameBefore.boardState as WerewolfState).phase
        : null;

      const { game, result } = await GameService.applyMove(roomId, userId, moveData);

      if (game.gameType === 'werewolf') {
        const publicGame = GameService.scrubGameState(game);
        io.to(`room:${roomId}`).emit('game:state', publicGame);
        for (const player of game.players) {
          const info = GameService.getWerewolfPrivateInfo(game, player.userId);
          if (info) io.to(`user:${player.userId}`).emit('game:private_info', info);
        }

        const phaseAfter = (game.boardState as WerewolfState).phase;
        if (result) {
          clearPhaseTimer(roomId);
          io.to(`room:${roomId}`).emit('game:result', result);
        } else if (phaseBefore !== phaseAfter) {
          // Phase changed due to all-done auto-resolve; reschedule timer
          const state = game.boardState as WerewolfState;
          schedulePhase(io, roomId, state.phaseEndsAt - Date.now());
        }
      } else {
        io.to(`room:${roomId}`).emit('game:state', game);
        if (result) {
          io.to(`room:${roomId}`).emit('game:result', result);
          for (const [uid, delta] of Object.entries(result.ratingChanges)) {
            UserService.updateRating(uid, delta).catch(() => {});
          }
        }
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message: string };
      socket.emit('error', { code: e.code || 'MOVE_ERROR', message: e.message });
    }
  });

  socket.on('game:resign', async (roomId) => {
    try {
      const result = await GameService.resign(roomId, userId);
      io.to(`room:${roomId}`).emit('game:result', result);
      for (const [uid, delta] of Object.entries(result.ratingChanges)) {
        UserService.updateRating(uid, delta).catch(() => {});
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message: string };
      socket.emit('error', { code: 'RESIGN_ERROR', message: e.message });
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
