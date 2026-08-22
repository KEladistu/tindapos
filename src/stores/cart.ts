import { create } from 'zustand';
import { addItem, cartCount, cartTotal, removeItem, setQty, type CartLine } from '../engine/cart';

interface CartState {
  lines: CartLine[];
  add: (line: Omit<CartLine, 'qty'>, qty?: number) => void;
  setQty: (itemId: string, qty: number) => void;
  remove: (itemId: string) => void;
  clear: () => void;
  totalC: () => number;
  count: () => number;
}

export const useCart = create<CartState>((set, get) => ({
  lines: [],
  add: (line, qty = 1) => set({ lines: addItem(get().lines, line, qty) }),
  setQty: (itemId, qty) => set({ lines: setQty(get().lines, itemId, qty) }),
  remove: (itemId) => set({ lines: removeItem(get().lines, itemId) }),
  clear: () => set({ lines: [] }),
  totalC: () => cartTotal(get().lines),
  count: () => cartCount(get().lines)
}));
