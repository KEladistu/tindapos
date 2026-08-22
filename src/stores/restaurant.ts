import { create } from 'zustand';
import { db, type OrderRow, type TableRow, type SaleLineRow } from '../db/schema';
import type { SelectedMod } from '../profiles/restaurant/modifiers';

export type RestaurantView = 'pos' | 'tables' | 'kitchen';
export type RestaurantMode = 'dine-in' | 'takeout';

export interface RestaurantLine {
  id: string;              // local uid, becomes the SaleLineRow id on checkout
  orderId: string;
  itemId: string;
  name: string;
  unitPriceCentavos: number; // base + modifier deltas
  basePriceCentavos: number;
  qty: number;
  modifiers: SelectedMod[];
  note?: string;
  sent?: boolean;          // once sent to kitchen, don't allow silent edits
}

interface RestaurantState {
  view: RestaurantView;
  mode: RestaurantMode;
  currentTableId: string | null;
  currentOrderId: string | null;
  tables: TableRow[];
  orders: OrderRow[];
  linesByOrder: Record<string, RestaurantLine[]>;

  hydrated: boolean;
  hydrate: () => Promise<void>;

  setView: (v: RestaurantView) => void;
  setMode: (m: RestaurantMode) => void;
  setCurrentTable: (id: string | null) => void;
  setCurrentOrder: (id: string | null) => void;

  // Tables
  seedSampleTables: () => Promise<void>;
  upsertTable: (t: TableRow) => Promise<void>;
  removeTable: (id: string) => Promise<void>;
  setTableStatus: (id: string, status: TableRow['status']) => Promise<void>;

  // Orders
  createOrder: (opts: { mode: RestaurantMode; tableId?: string }) => Promise<OrderRow>;
  addLine: (orderId: string, line: Omit<RestaurantLine, 'id' | 'orderId'>) => void;
  setLineQty: (orderId: string, lineId: string, qty: number) => void;
  removeLine: (orderId: string, lineId: string) => void;
  updateLineNote: (orderId: string, lineId: string, note: string) => void;
  updateLineModifiers: (orderId: string, lineId: string, mods: SelectedMod[], unitPrice: number) => void;
  sendToKitchen: (orderId: string) => Promise<void>;
  markServed: (orderId: string) => Promise<void>;
  markPaid: (orderId: string, saleId: string) => Promise<void>;
  clearOrderLines: (orderId: string) => void;
}

function uid(prefix = '') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function nextQueueNumber(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const cutoff = startOfDay.getTime();
  const all = await db.orders.toArray();
  const todaysTakeouts = all.filter(
    (o) => o.mode === 'takeout' && (o.createdAt ?? 0) >= cutoff
  );
  const maxN = todaysTakeouts.reduce((m, o) => Math.max(m, o.queueNumber ?? 0), 0);
  return maxN + 1;
}

export const useRestaurant = create<RestaurantState>((set, get) => ({
  view: 'pos',
  mode: 'dine-in',
  currentTableId: null,
  currentOrderId: null,
  tables: [],
  orders: [],
  linesByOrder: {},
  hydrated: false,

  async hydrate() {
    const [tables, orders] = await Promise.all([
      db.diningTables.toArray(),
      db.orders.toArray()
    ]);
    // Load lines only for open/sent/served orders — paid ones are historical.
    const openIsh = orders.filter((o) => o.status === 'open' || o.status === 'sent' || o.status === 'served');
    const linesByOrder: Record<string, RestaurantLine[]> = {};
    for (const o of openIsh) {
      // Not yet materialized in DB — order lines live only in memory until sale/checkout.
      linesByOrder[o.id] = linesByOrder[o.id] ?? [];
    }
    set({ tables, orders, linesByOrder, hydrated: true });
  },

  setView: (view) => set({ view }),
  setMode: (mode) => set({ mode, currentTableId: null, currentOrderId: null }),
  setCurrentTable: (id) => set({ currentTableId: id }),
  setCurrentOrder: (id) => set({ currentOrderId: id }),

  async seedSampleTables() {
    const rows: TableRow[] = [
      { id: 'tbl-1', name: 'T1', mapX: 0, mapY: 0, status: 'available' },
      { id: 'tbl-2', name: 'T2', mapX: 1, mapY: 0, status: 'available' },
      { id: 'tbl-3', name: 'T3', mapX: 2, mapY: 0, status: 'available' },
      { id: 'tbl-4', name: 'T4', mapX: 0, mapY: 1, status: 'available' },
      { id: 'tbl-5', name: 'T5', mapX: 1, mapY: 1, status: 'available' },
      { id: 'tbl-6', name: 'T6', mapX: 2, mapY: 1, status: 'available' }
    ];
    await db.diningTables.bulkPut(rows);
    set({ tables: rows });
  },

  async upsertTable(t) {
    await db.diningTables.put(t);
    const others = get().tables.filter((x) => x.id !== t.id);
    set({ tables: [...others, t] });
  },

  async removeTable(id) {
    await db.diningTables.delete(id);
    set({ tables: get().tables.filter((t) => t.id !== id) });
  },

  async setTableStatus(id, status) {
    const t = get().tables.find((x) => x.id === id);
    if (!t) return;
    const next = { ...t, status };
    await db.diningTables.put(next);
    set({ tables: get().tables.map((x) => (x.id === id ? next : x)) });
  },

  async createOrder({ mode, tableId }) {
    const now = Date.now();
    const id = uid('ord_');
    const order: OrderRow = {
      id,
      tableId: tableId ?? '',
      status: 'open',
      mode,
      createdAt: now,
      updatedAt: now,
      queueNumber: mode === 'takeout' ? await nextQueueNumber() : undefined
    };
    await db.orders.put(order);
    set({
      orders: [...get().orders, order],
      linesByOrder: { ...get().linesByOrder, [id]: [] },
      currentOrderId: id
    });
    if (mode === 'dine-in' && tableId) {
      await get().setTableStatus(tableId, 'occupied');
    }
    return order;
  },

  addLine(orderId, line) {
    const lineId = uid('ln_');
    const cur = get().linesByOrder[orderId] ?? [];
    const next: RestaurantLine = { ...line, id: lineId, orderId };
    set({ linesByOrder: { ...get().linesByOrder, [orderId]: [...cur, next] } });
  },

  setLineQty(orderId, lineId, qty) {
    const cur = get().linesByOrder[orderId] ?? [];
    const next = qty <= 0
      ? cur.filter((l) => l.id !== lineId)
      : cur.map((l) => (l.id === lineId ? { ...l, qty } : l));
    set({ linesByOrder: { ...get().linesByOrder, [orderId]: next } });
  },

  removeLine(orderId, lineId) {
    const cur = get().linesByOrder[orderId] ?? [];
    set({ linesByOrder: { ...get().linesByOrder, [orderId]: cur.filter((l) => l.id !== lineId) } });
  },

  updateLineNote(orderId, lineId, note) {
    const cur = get().linesByOrder[orderId] ?? [];
    set({ linesByOrder: { ...get().linesByOrder, [orderId]: cur.map((l) => (l.id === lineId ? { ...l, note } : l)) } });
  },

  updateLineModifiers(orderId, lineId, mods, unitPrice) {
    const cur = get().linesByOrder[orderId] ?? [];
    set({
      linesByOrder: {
        ...get().linesByOrder,
        [orderId]: cur.map((l) =>
          l.id === lineId ? { ...l, modifiers: mods, unitPriceCentavos: unitPrice } : l
        )
      }
    });
  },

  async sendToKitchen(orderId) {
    const now = Date.now();
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return;
    const next: OrderRow = { ...order, status: 'sent', updatedAt: now, sentAt: order.sentAt ?? now };
    await db.orders.put(next);
    const cur = get().linesByOrder[orderId] ?? [];
    const marked = cur.map((l) => ({ ...l, sent: true }));
    set({
      orders: get().orders.map((o) => (o.id === orderId ? next : o)),
      linesByOrder: { ...get().linesByOrder, [orderId]: marked }
    });
  },

  async markServed(orderId) {
    const now = Date.now();
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return;
    const next: OrderRow = { ...order, status: 'served', updatedAt: now };
    await db.orders.put(next);
    set({ orders: get().orders.map((o) => (o.id === orderId ? next : o)) });
  },

  async markPaid(orderId, saleId) {
    const now = Date.now();
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return;
    const next: OrderRow = { ...order, status: 'paid', updatedAt: now, saleId };
    await db.orders.put(next);
    // Release table
    if (order.tableId) {
      await get().setTableStatus(order.tableId, 'available');
    }
    const linesByOrder = { ...get().linesByOrder };
    delete linesByOrder[orderId];
    set({
      orders: get().orders.map((o) => (o.id === orderId ? next : o)),
      linesByOrder,
      currentOrderId: get().currentOrderId === orderId ? null : get().currentOrderId,
      currentTableId: get().currentTableId === order.tableId ? null : get().currentTableId
    });
  },

  clearOrderLines(orderId) {
    const linesByOrder = { ...get().linesByOrder };
    delete linesByOrder[orderId];
    set({ linesByOrder });
  }
}));

/** Utility used by the checkout path to serialize in-memory lines into saleLines. */
export function toSaleLineRows(
  lines: RestaurantLine[],
  saleId: string,
  orderId: string
): SaleLineRow[] {
  return lines.map((l) => ({
    id: l.id,
    saleId,
    itemId: l.itemId,
    name: l.name,
    unitPriceCentavos: l.unitPriceCentavos,
    qty: l.qty,
    lineTotalCentavos: l.unitPriceCentavos * l.qty,
    notes: l.note,
    orderId,
    extras: l.modifiers.length ? { modifiers: l.modifiers } : undefined
  }));
}
