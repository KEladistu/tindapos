import { create } from 'zustand';
import { db } from '../db/schema';
async function persist(key, value) {
    await db.settings.put({ key, value });
}
async function load(key, fallback) {
    const row = await db.settings.get(key);
    return row?.value ?? fallback;
}
export const useSettings = create((set, get) => ({
    hydrated: false,
    language: 'en',
    storeName: '',
    profileId: null,
    async hydrate() {
        const [language, storeName, profileId] = await Promise.all([
            load('language', 'en'),
            load('storeName', ''),
            load('profileId', null)
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
