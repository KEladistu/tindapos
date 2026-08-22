import { create } from 'zustand';
import { db, type ItemRow, type CategoryRow } from '../db/schema';

/** An inverse operation that undoes a prior mutation. */
export interface UndoOp {
  label: string;
  apply: () => Promise<void>;
  inverse: () => Promise<void>;
}

interface CatalogState {
  items: ItemRow[];
  categories: CategoryRow[];
  load: () => Promise<void>;
  decrementStock: (itemId: string, qty: number) => Promise<void>;

  // Item mutations — every returns the inverse op (for undo stack).
  renameItem: (id: string, name: string) => Promise<UndoOp | null>;
  repriceItem: (id: string, cents: number) => Promise<UndoOp | null>;
  reorderItems: (categoryId: string, orderedIds: string[]) => Promise<UndoOp | null>;
  moveItem: (id: string, toCategoryId: string) => Promise<UndoOp | null>;
  setItemPhoto: (id: string, photoBlobId: string | undefined) => Promise<UndoOp | null>;
  setItemIcon: (id: string, icon: string | undefined) => Promise<UndoOp | null>;
  createItem: (partial: Partial<ItemRow> & { name: string; priceCentavos: number; categoryId: string }) => Promise<UndoOp | null>;
  deleteItem: (id: string) => Promise<UndoOp | null>;

  // Category mutations
  renameCategory: (id: string, name: string) => Promise<UndoOp | null>;
  reorderCategories: (orderedIds: string[]) => Promise<UndoOp | null>;
  createCategory: (name: string) => Promise<UndoOp | null>;
  deleteCategory: (id: string) => Promise<UndoOp | null>;
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

async function audit(kind: string, payload: unknown) {
  try {
    await db.auditLog.add({ ts: Date.now(), kind, payload });
  } catch {
    // best-effort
  }
}

export const useCatalog = create<CatalogState>((set, get) => ({
  items: [],
  categories: [],

  async load() {
    const [items, categories] = await Promise.all([
      db.items.where('archived').equals(0).toArray(),
      db.categories.orderBy('order').toArray()
    ]);
    // Ensure items sorted by order for stable rendering.
    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    set({ items, categories });
  },

  async decrementStock(itemId, qty) {
    const item = await db.items.get(itemId);
    if (!item) return;
    const newStock = Math.max(0, (item.stock ?? 0) - qty);
    await db.items.update(itemId, { stock: newStock });
    set({ items: get().items.map((i) => (i.id === itemId ? { ...i, stock: newStock } : i)) });
  },

  async renameItem(id, name) {
    const prev = get().items.find((i) => i.id === id);
    if (!prev) return null;
    const oldName = prev.name;
    await db.items.update(id, { name });
    set({ items: get().items.map((i) => (i.id === id ? { ...i, name } : i)) });
    await audit('item.rename', { id, from: oldName, to: name });
    return {
      label: 'Rename item',
      apply: async () => { await get().renameItem(id, name); },
      inverse: async () => { await get().renameItem(id, oldName); }
    };
  },

  async repriceItem(id, cents) {
    const prev = get().items.find((i) => i.id === id);
    if (!prev) return null;
    const oldC = prev.priceCentavos;
    await db.items.update(id, { priceCentavos: cents });
    set({ items: get().items.map((i) => (i.id === id ? { ...i, priceCentavos: cents } : i)) });
    await audit('item.reprice', { id, from: oldC, to: cents });
    return {
      label: 'Reprice item',
      apply: async () => { await get().repriceItem(id, cents); },
      inverse: async () => { await get().repriceItem(id, oldC); }
    };
  },

  async reorderItems(categoryId, orderedIds) {
    const before = get().items
      .filter((i) => i.categoryId === categoryId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((i) => i.id);
    await db.transaction('rw', db.items, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.items.update(orderedIds[i], { order: i });
      }
    });
    set({
      items: get().items.map((i) => {
        if (i.categoryId !== categoryId) return i;
        const idx = orderedIds.indexOf(i.id);
        return idx === -1 ? i : { ...i, order: idx };
      })
    });
    await audit('item.reorder', { categoryId, from: before, to: orderedIds });
    return {
      label: 'Reorder items',
      apply: async () => { await get().reorderItems(categoryId, orderedIds); },
      inverse: async () => { await get().reorderItems(categoryId, before); }
    };
  },

  async moveItem(id, toCategoryId) {
    const prev = get().items.find((i) => i.id === id);
    if (!prev) return null;
    const fromCategoryId = prev.categoryId;
    if (fromCategoryId === toCategoryId) return null;
    // Place at end of target
    const targetOrders = get().items.filter((i) => i.categoryId === toCategoryId).map((i) => i.order ?? 0);
    const newOrder = targetOrders.length ? Math.max(...targetOrders) + 1 : 0;
    const oldOrder = prev.order;
    await db.items.update(id, { categoryId: toCategoryId, order: newOrder });
    set({
      items: get().items.map((i) => (i.id === id ? { ...i, categoryId: toCategoryId, order: newOrder } : i))
    });
    await audit('item.recategorize', { id, from: fromCategoryId, to: toCategoryId });
    return {
      label: 'Move item',
      apply: async () => { await get().moveItem(id, toCategoryId); },
      inverse: async () => {
        await db.items.update(id, { categoryId: fromCategoryId, order: oldOrder });
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, categoryId: fromCategoryId, order: oldOrder } : i))
        });
        await audit('item.recategorize', { id, from: toCategoryId, to: fromCategoryId });
      }
    };
  },

  async setItemPhoto(id, photoBlobId) {
    const prev = get().items.find((i) => i.id === id);
    if (!prev) return null;
    const oldPhoto = prev.photoBlobId;
    await db.items.update(id, { photoBlobId });
    set({ items: get().items.map((i) => (i.id === id ? { ...i, photoBlobId } : i)) });
    await audit('item.setPhoto', { id, from: oldPhoto, to: photoBlobId });
    return {
      label: 'Set photo',
      apply: async () => { await get().setItemPhoto(id, photoBlobId); },
      inverse: async () => { await get().setItemPhoto(id, oldPhoto); }
    };
  },

  async setItemIcon(id, icon) {
    const prev = get().items.find((i) => i.id === id);
    if (!prev) return null;
    const oldIcon = prev.icon;
    await db.items.update(id, { icon });
    set({ items: get().items.map((i) => (i.id === id ? { ...i, icon } : i)) });
    await audit('item.setIcon', { id, from: oldIcon, to: icon });
    return {
      label: 'Set icon',
      apply: async () => { await get().setItemIcon(id, icon); },
      inverse: async () => { await get().setItemIcon(id, oldIcon); }
    };
  },

  async createItem(partial) {
    const id = partial.id ?? uid('it');
    const catItems = get().items.filter((i) => i.categoryId === partial.categoryId);
    const order = catItems.length ? Math.max(...catItems.map((i) => i.order ?? 0)) + 1 : 0;
    const row: ItemRow = {
      id,
      categoryId: partial.categoryId,
      name: partial.name,
      priceCentavos: partial.priceCentavos,
      stock: partial.stock ?? 0,
      icon: partial.icon,
      photoBlobId: partial.photoBlobId,
      order,
      archived: 0,
      extras: partial.extras
    };
    await db.items.put(row);
    set({ items: [...get().items, row] });
    await audit('item.create', { id, name: row.name });
    return {
      label: 'Create item',
      apply: async () => {
        await db.items.put(row);
        set({ items: [...get().items.filter((i) => i.id !== id), row] });
      },
      inverse: async () => { await get().deleteItem(id); }
    };
  },

  async deleteItem(id) {
    const prev = get().items.find((i) => i.id === id);
    if (!prev) return null;
    await db.items.delete(id);
    set({ items: get().items.filter((i) => i.id !== id) });
    await audit('item.delete', { id });
    return {
      label: 'Delete item',
      apply: async () => { await get().deleteItem(id); },
      inverse: async () => {
        await db.items.put(prev);
        set({ items: [...get().items, prev] });
      }
    };
  },

  async renameCategory(id, name) {
    const prev = get().categories.find((c) => c.id === id);
    if (!prev) return null;
    const oldName = prev.name;
    await db.categories.update(id, { name });
    set({ categories: get().categories.map((c) => (c.id === id ? { ...c, name } : c)) });
    await audit('category.rename', { id, from: oldName, to: name });
    return {
      label: 'Rename category',
      apply: async () => { await get().renameCategory(id, name); },
      inverse: async () => { await get().renameCategory(id, oldName); }
    };
  },

  async reorderCategories(orderedIds) {
    const before = get().categories.sort((a, b) => a.order - b.order).map((c) => c.id);
    await db.transaction('rw', db.categories, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.categories.update(orderedIds[i], { order: i });
      }
    });
    set({
      categories: get().categories.map((c) => {
        const idx = orderedIds.indexOf(c.id);
        return idx === -1 ? c : { ...c, order: idx };
      })
    });
    await audit('category.reorder', { from: before, to: orderedIds });
    return {
      label: 'Reorder categories',
      apply: async () => { await get().reorderCategories(orderedIds); },
      inverse: async () => { await get().reorderCategories(before); }
    };
  },

  async createCategory(name) {
    const id = uid('cat');
    const cats = get().categories;
    const order = cats.length ? Math.max(...cats.map((c) => c.order)) + 1 : 0;
    const row: CategoryRow = { id, name, order };
    await db.categories.put(row);
    set({ categories: [...cats, row] });
    await audit('category.create', { id, name });
    return {
      label: 'Create category',
      apply: async () => {
        await db.categories.put(row);
        set({ categories: [...get().categories.filter((c) => c.id !== id), row] });
      },
      inverse: async () => { await get().deleteCategory(id); }
    };
  },

  async deleteCategory(id) {
    const prev = get().categories.find((c) => c.id === id);
    if (!prev) return null;
    const hasItems = get().items.some((i) => i.categoryId === id);
    if (hasItems) throw new Error('CATEGORY_NOT_EMPTY');
    await db.categories.delete(id);
    set({ categories: get().categories.filter((c) => c.id !== id) });
    await audit('category.delete', { id });
    return {
      label: 'Delete category',
      apply: async () => { await get().deleteCategory(id); },
      inverse: async () => {
        await db.categories.put(prev);
        set({ categories: [...get().categories, prev] });
      }
    };
  }
}));
