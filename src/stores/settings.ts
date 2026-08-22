import { create } from 'zustand';
import { db } from '../db/schema';

export type Lang = 'en' | 'tl';
export type ProfileId = 'sari-sari' | 'lpg' | 'restaurant';
export type AccentColor = 'amber' | 'emerald' | 'sky' | 'rose' | 'violet';

interface StoreInfo {
  address: string;
  contact: string;
  tin: string;
  footer: string;
  logoPhotoId?: string;
}

interface SettingsState {
  hydrated: boolean;
  language: Lang;
  storeName: string;
  profileId: ProfileId | null;
  accent: AccentColor;
  vatEnabled: boolean;
  storeInfo: StoreInfo;
  lastBackupTs: number;
  btDeviceId: string;
  lowStockThreshold: number;
  hydrate: () => Promise<void>;
  setLanguage: (lang: Lang) => void;
  setAccent: (c: AccentColor) => void;
  setVatEnabled: (v: boolean) => void;
  setStoreInfo: (info: Partial<StoreInfo>) => Promise<void>;
  setStoreName: (name: string) => Promise<void>;
  setLastBackupTs: (ts: number) => Promise<void>;
  setBtDeviceId: (id: string) => Promise<void>;
  setLowStockThreshold: (n: number) => Promise<void>;
  setStore: (storeName: string, profileId: ProfileId) => Promise<void>;
}

async function persist(key: string, value: unknown) {
  await db.settings.put({ key, value });
}
async function load<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return (row?.value as T) ?? fallback;
}

const ACCENT_HEX: Record<AccentColor, string> = {
  amber: '#f59e0b',
  emerald: '#10b981',
  sky: '#0ea5e9',
  rose: '#f43f5e',
  violet: '#8b5cf6'
};

export function applyAccent(c: AccentColor) {
  document.documentElement.style.setProperty('--accent', ACCENT_HEX[c]);
  document.documentElement.dataset.accent = c;
}

export const useSettings = create<SettingsState>((set, get) => ({
  hydrated: false,
  language: 'en',
  storeName: '',
  profileId: null,
  accent: 'amber',
  vatEnabled: false,
  storeInfo: { address: '', contact: '', tin: '', footer: '' },
  lastBackupTs: 0,
  btDeviceId: '',
  lowStockThreshold: 3,
  async hydrate() {
    const [language, storeName, profileId, accent, vatEnabled, storeInfo, lastBackupTs, btDeviceId, lowStockThreshold] = await Promise.all([
      load<Lang>('language', 'en'),
      load<string>('storeName', ''),
      load<ProfileId | null>('profileId', null),
      load<AccentColor>('accent', 'amber'),
      load<boolean>('vatEnabled', false),
      load<StoreInfo>('storeInfo', { address: '', contact: '', tin: '', footer: '' }),
      load<number>('lastBackupTs', 0),
      load<string>('btDeviceId', ''),
      load<number>('lowStockThreshold', 3)
    ]);
    set({ hydrated: true, language, storeName, profileId, accent, vatEnabled, storeInfo, lastBackupTs, btDeviceId, lowStockThreshold });
    try { applyAccent(accent); } catch {}
  },
  setLanguage(lang) {
    set({ language: lang });
    void persist('language', lang);
  },
  setAccent(c) {
    set({ accent: c });
    try { applyAccent(c); } catch {}
    void persist('accent', c);
  },
  setVatEnabled(v) {
    set({ vatEnabled: v });
    void persist('vatEnabled', v);
  },
  async setStoreInfo(info) {
    const merged = { ...get().storeInfo, ...info };
    set({ storeInfo: merged });
    await persist('storeInfo', merged);
  },
  async setStoreName(name) {
    set({ storeName: name });
    await persist('storeName', name);
  },
  async setLastBackupTs(ts) {
    set({ lastBackupTs: ts });
    await persist('lastBackupTs', ts);
  },
  async setBtDeviceId(id) {
    set({ btDeviceId: id });
    await persist('btDeviceId', id);
  },
  async setLowStockThreshold(n) {
    set({ lowStockThreshold: n });
    await persist('lowStockThreshold', n);
  },
  async setStore(storeName, profileId) {
    await persist('storeName', storeName);
    await persist('profileId', profileId);
    set({ storeName, profileId });
    void get();
  }
}));
