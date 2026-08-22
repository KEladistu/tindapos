import { create } from 'zustand';

export type Role = 'owner' | 'cashier';

interface SessionState {
  userId: string;
  userName: string;
  role: Role;
  setUser: (id: string, name: string, role?: Role) => void;
}

export const useSession = create<SessionState>((set) => ({
  userId: 'owner',
  userName: 'Owner',
  role: 'owner',
  setUser: (id, name, role = 'owner') => set({ userId: id, userName: name, role })
}));
