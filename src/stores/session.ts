import { create } from 'zustand';

interface SessionState {
  userId: string;
  userName: string;
  setUser: (id: string, name: string) => void;
}

export const useSession = create<SessionState>((set) => ({
  userId: 'owner',
  userName: 'Owner',
  setUser: (id, name) => set({ userId: id, userName: name })
}));
