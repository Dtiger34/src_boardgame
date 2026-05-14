import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@boardgame/types';
import { GameService } from '../services/game.service';
import { WerewolfState } from '../engines/werewolf';

export function registerChatHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket,
) {
  const { userId, username } = socket.data as { userId: string; username: string };

  socket.on('chat:message', ({ roomId, content }) => {
    const sanitized = content.trim().slice(0, 500);
    if (!sanitized) return;
    io.to(`room:${roomId}`).emit('chat:message', {
      userId,
      username,
      content: sanitized,
      timestamp: Date.now(),
    });
  });

  socket.on('chat:wolf_message', async ({ roomId, content }) => {
    const sanitized = content.trim().slice(0, 500);
    if (!sanitized) return;
    const game = await GameService.getGame(roomId).catch(() => null);
    if (!game || game.gameType !== 'werewolf') return;
    const state = game.boardState as WerewolfState;
    if (state.phase !== 'night') return;
    const player = state.players.find((p) => p.userId === userId);
    if (!player || player.team !== 'werewolf') return;
    io.to(`wolf:${roomId}`).emit('chat:wolf_message', {
      userId,
      username,
      content: sanitized,
      timestamp: Date.now(),
    });
  });
}
