import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@boardgame/types';
import { useGameStore } from './game';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketState {
  socket: GameSocket | null;
  connect: (token: string) => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connect: (token) => {
    if (get().socket?.connected) return;
    const url = import.meta.env.VITE_REALTIME_URL ?? 'http://localhost:4000';
    const socket: GameSocket = io(url, { auth: { token } });
    socket.on('game:state', (state) => useGameStore.getState().setGameState(state));
    socket.on('game:result', (result) => useGameStore.getState().setResult(result));
    socket.on('game:draw_offered', (userId) => useGameStore.getState().setDrawOffer(userId));
    socket.on('matchmaking:matched', (room) => {
      window.location.href = `/game/${room.id}`;
    });
    set({ socket });
  },
  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null });
  },
}));
