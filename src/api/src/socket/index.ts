import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { ClientToServerEvents, ServerToClientEvents } from '@boardgame/types';
import { registerGameHandlers } from './game.handler';
import { registerChatHandlers } from './chat.handler';

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const { userId, username } = socket.handshake.auth as { userId?: string; username?: string };
    if (!userId || !username) return next(new Error('userId and username required'));
    socket.data.userId = userId;
    socket.data.username = username;
    next();
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.userId}`);
    registerGameHandlers(io, socket);
    registerChatHandlers(io, socket);
  });

  return io;
}
