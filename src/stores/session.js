import { create } from 'zustand';
export const useSession = create((set) => ({
    userId: 'owner',
    userName: 'Owner',
    setUser: (id, name) => set({ userId: id, userName: name })
}));
