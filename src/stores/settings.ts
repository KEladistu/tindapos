import { create } from 'zustand';
import { db } from '../db/schema';

export type Lang = 'en' | 'tl';
export type ProfileId = 'sari-sari' | 'lpg' | 'restaurant';

interface SettingsState {
  hydrated: boolean;
  language: Lang;
  storeName: string;
  profileId: ProfileId | null;
  hydrate: () => Promise<void>;
  setLanguage: (lang: Lang) => void;
  setStore: (storeName: string, profileId: ProfileId) => Promise<void>;
}

async function persist(key: string, value: unknown) {
  await db.settings.put({ key, value });
}
async function load<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return (row?.value as T) ?? fallback;
}

export const useSettings = create<SettingsState>((set, get) => ({
  hydrated: false,
  language: 'en',
  storeName: '',
  profileId: null,
  async hydrate() {
    const [language, storeName, profileId] = await Promise.all([
      load<Lang>('language', 'en'),
      load<string>('storeName', ''),
      load<ProfileId | null>('profileId', null)
    ]);
    set({ hydrated: true, language, storeName, profileId });
  },
  setLanguage(lang) {
    set({ language: lang });
    void persist('language', lang);
  },
  async setStore(storeName, profileId) {
    await persist('storeName', storeName);
    await persist('profileId', profileId);
    set({ storeName, profileId });
    // notify catalog store if it wants to reload
    void get();
  }
}));
