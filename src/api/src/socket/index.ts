import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { ClientToServerEvents, ServerToClientEvents } from '@boardgame/types';
import { registerGameHandlers } from './game.handler';
import { registerChatHandlers } from './chat.handler';
import { startMatchmakingWorker } from './matchmaking.worker';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string; username: string };
      socket.data.userId = payload.sub;
      socket.data.username = payload.username;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.userId}`);
    registerGameHandlers(io, socket);
    registerChatHandlers(io, socket);
  });

  startMatchmakingWorker(io);
  return io;
}
