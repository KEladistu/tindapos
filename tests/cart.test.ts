import { describe, it, expect } from 'vitest';
import { addItem, cartCount, cartTotal, removeItem, setQty } from '../src/engine/cart';

const A = { itemId: 'a', name: 'Coke', unitPriceC: 2500 };
const B = { itemId: 'b', name: 'Chippy', unitPriceC: 1200 };

describe('cart', () => {
  it('adds items and merges duplicates', () => {
    let lines = addItem([], A);
    lines = addItem(lines, A);
    lines = addItem(lines, B, 3);
    expect(lines).toHaveLength(2);
    expect(lines.find((l) => l.itemId === 'a')!.qty).toBe(2);
    expect(lines.find((l) => l.itemId === 'b')!.qty).toBe(3);
  });

  it('setQty updates and removes at 0', () => {
    let lines = addItem([], A, 2);
    lines = setQty(lines, 'a', 5);
    expect(lines[0].qty).toBe(5);
    lines = setQty(lines, 'a', 0);
    expect(lines).toHaveLength(0);
  });

  it('removeItem removes', () => {
    let lines = addItem(addItem([], A), B);
    lines = removeItem(lines, 'a');
    expect(lines).toHaveLength(1);
    expect(lines[0].itemId).toBe('b');
  });

  it('totals and count', () => {
    let lines = addItem([], A, 2); // 5000
    lines = addItem(lines, B, 3); // 3600
    expect(cartTotal(lines)).toBe(8600);
    expect(cartCount(lines)).toBe(5);
  });
});
