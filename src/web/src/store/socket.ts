import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@boardgame/types';
import { useGameStore } from './game';
import { useAuthStore } from './auth';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type SocketState = {
  socket: GameSocket | null;
  connect: () => void;
  disconnect: () => void;
};

let connecting = false;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connect: () => {
    if (get().socket?.connected || connecting) return;
    connecting = true;

    const { user } = useAuthStore.getState();
    const url = import.meta.env.VITE_REALTIME_URL ?? 'http://localhost:4000';
    const socket: GameSocket = io(url, {
      auth: { userId: user?.id, username: user?.username },
    });

    socket.on('connect', () => {
      connecting = false;
      set({ socket });
    });
    socket.on('connect_error', () => {
      connecting = false;
    });
    socket.on('game:room_update', (room) => useGameStore.getState().setRoom(room));
    socket.on('game:state', (state) => useGameStore.getState().setGameState(state));
    socket.on('game:result', (result) => useGameStore.getState().setResult(result));
    socket.on('game:draw_offered', (userId) => useGameStore.getState().setDrawOffer(userId));
    socket.on('chat:message', (msg) => useGameStore.getState().addMessage(msg));
    socket.on('chat:wolf_message', (msg) => useGameStore.getState().addWolfMessage(msg));
    socket.on('game:private_info', (info) => useGameStore.getState().setPrivateInfo(info));
    socket.on('error', (err) => {
      const message =
        typeof err?.message === 'string' && err.message.trim().length > 0
          ? err.message
          : 'Action failed';
      useGameStore.getState().setRealtimeError(message);
    });
  },
  disconnect: () => {
    connecting = false;
    get().socket?.disconnect();
    set({ socket: null });
  },
}));
