import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '@boardgame/types';

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
}
