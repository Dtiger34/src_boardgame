import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type AuthUser = {
  id: string;
  username: string;
  displayName: string | null;
};

type AuthState = {
  user: AuthUser | null;
  setDisplayName: (name: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  setDisplayName: (name) => {
    const trimmed = name.trim();
    const existing = get().user;
    const id = existing?.id ?? uuidv4();
    set({ user: { id, username: trimmed, displayName: trimmed } });
  },
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
