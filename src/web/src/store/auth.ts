import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthUser {
  id: string;
  username: string;
  rating: number;
}

interface AuthState {
  tokens: AuthTokens | null;
  user: AuthUser | null;
  setAuth: (tokens: AuthTokens) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      tokens: null,
      user: null,
      setAuth: (tokens) => {
        const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]));
        set({ tokens, user: { id: payload.sub, username: payload.username, rating: 1200 } });
      },
      logout: () => set({ tokens: null, user: null }),
    }),
    { name: 'boardgame-auth' },
  ),
);
