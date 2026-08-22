import { create } from 'zustand';
import { db } from '../db/schema';
import { verifyPin } from '../engine/pin';

export type Role = 'owner' | 'cashier';

interface SessionState {
  userId: string;
  userName: string;
  role: Role;
  authenticated: boolean;
  requiresLogin: boolean;
  setUser: (id: string, name: string, role?: Role) => void;
  login: (userId: string, pin: string) => Promise<boolean>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

const SS_KEY = 'tindapos.session.userId';

export const useSession = create<SessionState>((set) => ({
  userId: 'owner',
  userName: 'Owner',
  role: 'owner',
  authenticated: true,
  requiresLogin: false,
  setUser: (id, name, role = 'owner') =>
    set({ userId: id, userName: name, role, authenticated: true }),
  async login(userId, pin) {
    const u = await db.users.get(userId);
    if (!u) return false;
    if (!u.pinHash || !u.pinSalt) {
      // Legacy: no PIN set. Allow login without.
      set({ userId: u.id, userName: u.name, role: u.role, authenticated: true });
      try { sessionStorage.setItem(SS_KEY, u.id); } catch {}
      return true;
    }
    const ok = await verifyPin(pin, u.pinHash, u.pinSalt);
    if (!ok) return false;
    set({ userId: u.id, userName: u.name, role: u.role, authenticated: true });
    try { sessionStorage.setItem(SS_KEY, u.id); } catch {}
    return true;
  },
  logout() {
    try { sessionStorage.removeItem(SS_KEY); } catch {}
    set({ authenticated: false });
  },
  async hydrate() {
    const users = await db.users.toArray();
    // Ensure default owner exists
    if (users.length === 0) {
      const owner = { id: 'owner', role: 'owner' as const, name: 'Owner' };
      await db.users.put(owner);
      set({ userId: 'owner', userName: 'Owner', role: 'owner', authenticated: true, requiresLogin: false });
      return;
    }
    const anyProtected = users.some((u) => u.pinHash);
    let restored: string | null = null;
    try { restored = sessionStorage.getItem(SS_KEY); } catch {}
    if (restored) {
      const u = users.find((x) => x.id === restored);
      if (u) {
        set({ userId: u.id, userName: u.name, role: u.role, authenticated: true, requiresLogin: anyProtected });
        return;
      }
    }
    if (!anyProtected) {
      const u = users[0];
      set({ userId: u.id, userName: u.name, role: u.role, authenticated: true, requiresLogin: false });
    } else {
      set({ authenticated: false, requiresLogin: true });
    }
  }
}));
