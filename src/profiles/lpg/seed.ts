import type { SeedItem } from '../types';
import type { CylinderRow } from '../../db/schema';
import { LPG_BRANDS, LPG_SIZES, skuFor } from './constants';

const REFILL_PRICES: Record<number, number> = {
  2.7: 25000,
  11: 85000,
  22: 165000,
  50: 360000
};
const NEW_TANK_PRICES: Record<number, number> = {
  2.7: 120000,
  11: 350000,
  22: 650000,
  50: 1350000
};

function refillItems(): SeedItem[] {
  const out: SeedItem[] = [];
  for (const brand of LPG_BRANDS) {
    for (const size of LPG_SIZES) {
      out.push({
        name: `${brand} ${size}kg Refill`,
        categoryId: 'refill',
        priceCentavos: REFILL_PRICES[size],
        icon: '🔥',
        extras: { brand, sizeKg: size, kind: 'refill', sku: skuFor(brand, size) }
      });
    }
  }
  return out;
}

function newTankItems(): SeedItem[] {
  const out: SeedItem[] = [];
  for (const brand of LPG_BRANDS) {
    for (const size of LPG_SIZES) {
      out.push({
        name: `${brand} ${size}kg New Tank`,
        categoryId: 'new-tank',
        priceCentavos: NEW_TANK_PRICES[size],
        icon: '🛢️',
        extras: { brand, sizeKg: size, kind: 'new', sku: skuFor(brand, size) }
      });
    }
  }
  return out;
}

const accessoryItems: SeedItem[] = [
  { name: 'LPG Regulator', categoryId: 'accessories', priceCentavos: 35000, stock: 10, icon: '🔧', extras: { kind: 'accessory' } },
  { name: 'Gas Hose 1m', categoryId: 'accessories', priceCentavos: 18000, stock: 10, icon: '🧵', extras: { kind: 'accessory' } },
  { name: 'Single-burner Stove', categoryId: 'accessories', priceCentavos: 65000, stock: 5, icon: '🍳', extras: { kind: 'accessory' } },
  { name: 'Double-burner Stove', categoryId: 'accessories', priceCentavos: 135000, stock: 5, icon: '🍳', extras: { kind: 'accessory' } }
];

export const lpgSeed: SeedItem[] = [
  ...refillItems(),
  ...newTankItems(),
  ...accessoryItems
];

/** Roughly 20 physical cylinders: mix of brands/sizes, mostly full + some empty. */
export function seedCylinders(): CylinderRow[] {
  const now = Date.now();
  const spec: Array<{ brand: string; size: number; full: number; empty: number }> = [
    { brand: 'Gasul',      size: 11, full: 3, empty: 1 },
    { brand: 'Gasul',      size: 22, full: 1, empty: 0 },
    { brand: 'Solane',     size: 11, full: 3, empty: 1 },
    { brand: 'Solane',     size: 2.7, full: 2, empty: 0 },
    { brand: 'Regasco',    size: 11, full: 2, empty: 1 },
    { brand: 'Regasco',    size: 50, full: 1, empty: 0 },
    { brand: 'Island Gas', size: 11, full: 2, empty: 1 },
    { brand: 'Island Gas', size: 22, full: 1, empty: 1 }
  ];
  const rows: CylinderRow[] = [];
  let n = 0;
  for (const s of spec) {
    const sku = skuFor(s.brand, s.size);
    for (let i = 0; i < s.full; i++) {
      rows.push({ id: `cyl-${sku}-f-${n++}`, sku, state: 'full', createdAt: now, updatedAt: now });
    }
    for (let i = 0; i < s.empty; i++) {
      rows.push({ id: `cyl-${sku}-e-${n++}`, sku, state: 'empty', createdAt: now, updatedAt: now });
    }
  }
  return rows;
}
