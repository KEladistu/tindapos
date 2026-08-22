import { create } from 'zustand';
import { addItem, cartCount, cartTotal, removeItem, setQty } from '../engine/cart';
export const useCart = create((set, get) => ({
    lines: [],
    add: (line, qty = 1) => set({ lines: addItem(get().lines, line, qty) }),
    setQty: (itemId, qty) => set({ lines: setQty(get().lines, itemId, qty) }),
    remove: (itemId) => set({ lines: removeItem(get().lines, itemId) }),
    clear: () => set({ lines: [] }),
    totalC: () => cartTotal(get().lines),
    count: () => cartCount(get().lines)
}));
