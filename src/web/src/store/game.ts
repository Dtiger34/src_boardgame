import { create } from 'zustand';
import { GameState, GameResult } from '@boardgame/types';
import { useSocketStore } from './socket';

interface ChatMessage {
  userId: string;
  username: string;
  content: string;
  timestamp: number;
}

interface GameStore {
  gameState: GameState | null;
  result: GameResult | null;
  drawOfferedBy: string | null;
  messages: ChatMessage[];
  setGameState: (state: GameState) => void;
  setResult: (result: GameResult) => void;
  setDrawOffer: (userId: string) => void;
  joinRoom: (roomId: string) => void;
  sendMove: (roomId: string, moveData: Record<string, unknown>) => void;
  sendChat: (roomId: string, content: string) => void;
  resign: (roomId: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  result: null,
  drawOfferedBy: null,
  messages: [],
  setGameState: (gameState) => set({ gameState }),
  setResult: (result) => set({ result }),
  setDrawOffer: (drawOfferedBy) => set({ drawOfferedBy }),
  joinRoom: (roomId) => {
    const socket = useSocketStore.getState().socket;
    socket?.emit('game:join', roomId);
    socket?.on('chat:message', (msg) => {
      set((s) => ({ messages: [...s.messages, msg] }));
    });
  },
  sendMove: (roomId, moveData) => {
    useSocketStore.getState().socket?.emit('game:move', { roomId, moveData });
  },
  sendChat: (roomId, content) => {
    useSocketStore.getState().socket?.emit('chat:message', { roomId, content });
  },
  resign: (roomId) => {
    useSocketStore.getState().socket?.emit('game:resign', roomId);
  },
}));
