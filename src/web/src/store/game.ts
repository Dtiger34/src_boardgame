import { create } from 'zustand';
import { GameState, GameResult, GameRoom, WerewolfPrivateInfo } from '@boardgame/types';
import { useSocketStore } from './socket';

interface ChatMessage {
  userId: string;
  username: string;
  content: string;
  timestamp: number;
}

interface GameStore {
  room: GameRoom | null;
  gameState: GameState | null;
  result: GameResult | null;
  drawOfferedBy: string | null;
  messages: ChatMessage[];
  privateInfo: WerewolfPrivateInfo | null;
  addMessage: (msg: ChatMessage) => void;
  setRoom: (room: GameRoom) => void;
  setGameState: (state: GameState) => void;
  setResult: (result: GameResult) => void;
  setDrawOffer: (userId: string) => void;
  setPrivateInfo: (info: WerewolfPrivateInfo) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  markReady: (roomId: string) => void;
  startGame: (roomId: string) => void;
  sendMove: (roomId: string, moveData: Record<string, unknown>) => void;
  sendChat: (roomId: string, content: string) => void;
  resign: (roomId: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  room: null,
  gameState: null,
  result: null,
  drawOfferedBy: null,
  messages: [],
  privateInfo: null,
  setRoom: (room) => set({ room }),
  setGameState: (gameState) => set({ gameState }),
  setResult: (result) => set({ result }),
  setDrawOffer: (drawOfferedBy) => set({ drawOfferedBy }),
  setPrivateInfo: (privateInfo) => set({ privateInfo }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  joinRoom: (roomId) => {
    set({ room: null, gameState: null, result: null, drawOfferedBy: null, messages: [], privateInfo: null });
    useSocketStore.getState().socket?.emit('game:join', roomId);
  },
  leaveRoom: (roomId) => {
    useSocketStore.getState().socket?.emit('game:leave', roomId);
    set({ room: null, gameState: null, result: null, drawOfferedBy: null, messages: [], privateInfo: null });
  },
  markReady: (roomId) => {
    useSocketStore.getState().socket?.emit('game:ready', roomId);
  },
  startGame: (roomId) => {
    useSocketStore.getState().socket?.emit('game:start', roomId);
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
