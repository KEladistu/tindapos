import { addC, mulC, type Centavos } from './money';

export interface CartLine {
  itemId: string;
  name: string;
  unitPriceC: Centavos;
  qty: number;
  icon?: string;
}

export function addItem(lines: CartLine[], line: Omit<CartLine, 'qty'>, qty = 1): CartLine[] {
  const existing = lines.find((l) => l.itemId === line.itemId);
  if (existing) {
    return lines.map((l) => (l.itemId === line.itemId ? { ...l, qty: l.qty + qty } : l));
  }
  return [...lines, { ...line, qty }];
}

export function setQty(lines: CartLine[], itemId: string, qty: number): CartLine[] {
  if (qty <= 0) return removeItem(lines, itemId);
  return lines.map((l) => (l.itemId === itemId ? { ...l, qty } : l));
}

export function removeItem(lines: CartLine[], itemId: string): CartLine[] {
  return lines.filter((l) => l.itemId !== itemId);
}

export function lineTotal(line: CartLine): Centavos {
  return mulC(line.unitPriceC, line.qty);
}

export function cartTotal(lines: CartLine[]): Centavos {
  return addC(...lines.map(lineTotal));
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((a, l) => a + l.qty, 0);
}
