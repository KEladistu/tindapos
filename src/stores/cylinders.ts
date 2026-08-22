import { create } from 'zustand';
import { db, type CylinderRow } from '../db/schema';
import { countBySku, type CylinderUpdate, type StockCounts } from '../profiles/lpg/modules/cylinders';

interface CylState {
  rows: CylinderRow[];
  load: () => Promise<void>;
  applyUpdates: (updates: CylinderUpdate[]) => Promise<void>;
  countsFor: (sku: string) => StockCounts;
  allSkus: () => string[];
}

export const useCylinders = create<CylState>((set, get) => ({
  rows: [],
  async load() {
    const rows = await db.cylinders.toArray();
    set({ rows });
  },
  async applyUpdates(updates) {
    await db.transaction('rw', db.cylinders, async () => {
      for (const u of updates) {
        await db.cylinders.update(u.id, u.changes);
      }
    });
    const rows = await db.cylinders.toArray();
    set({ rows });
  },
  countsFor(sku) {
    return countBySku(get().rows, sku);
  },
  allSkus() {
    return Array.from(new Set(get().rows.map((r) => r.sku))).sort();
  }
}));
