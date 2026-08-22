import { create } from 'zustand';
import { db, type ItemRow, type CategoryRow } from '../db/schema';

interface CatalogState {
  items: ItemRow[];
  categories: CategoryRow[];
  load: () => Promise<void>;
  decrementStock: (itemId: string, qty: number) => Promise<void>;
}

export const useCatalog = create<CatalogState>((set, get) => ({
  items: [],
  categories: [],
  async load() {
    const [items, categories] = await Promise.all([
      db.items.where('archived').equals(0).toArray(),
      db.categories.orderBy('order').toArray()
    ]);
    set({ items, categories });
  },
  async decrementStock(itemId, qty) {
    const item = await db.items.get(itemId);
    if (!item) return;
    const newStock = Math.max(0, (item.stock ?? 0) - qty);
    await db.items.update(itemId, { stock: newStock });
    set({ items: get().items.map((i) => (i.id === itemId ? { ...i, stock: newStock } : i)) });
  }
}));
