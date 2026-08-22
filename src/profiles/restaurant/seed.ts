import type { SeedItem } from '../types';
import { ADD_ONS, RICE_SIZE, SISIG_STYLE, type ModifierGroup } from './modifiers';

function withMods(groups: ModifierGroup[]): Record<string, unknown> {
  return { modifierGroups: groups };
}

export const restaurantSeed: SeedItem[] = [
  // Ulam
  { name: 'Adobo',              categoryId: 'ulam',    priceCentavos:  9500, stock: 20, icon: '🍗', extras: withMods([ADD_ONS]) },
  { name: 'Sinigang na Baboy',  categoryId: 'ulam',    priceCentavos: 11000, stock: 15, icon: '🍲', extras: withMods([ADD_ONS]) },
  { name: 'Sisig',              categoryId: 'ulam',    priceCentavos: 13000, stock: 15, icon: '🥘', extras: withMods([SISIG_STYLE, ADD_ONS]) },
  { name: 'Bistek',             categoryId: 'ulam',    priceCentavos: 10000, stock: 15, icon: '🥩', extras: withMods([ADD_ONS]) },
  { name: 'Kare-Kare',          categoryId: 'ulam',    priceCentavos: 14000, stock: 10, icon: '🥜', extras: withMods([ADD_ONS]) },
  { name: 'Ginataang Manok',    categoryId: 'ulam',    priceCentavos: 11000, stock: 12, icon: '🥥', extras: withMods([ADD_ONS]) },
  { name: 'Tinola',             categoryId: 'ulam',    priceCentavos:  9500, stock: 12, icon: '🍜', extras: withMods([ADD_ONS]) },
  { name: 'Menudo',             categoryId: 'ulam',    priceCentavos:  9000, stock: 12, icon: '🍲', extras: withMods([ADD_ONS]) },

  // Merienda / Sabaw
  { name: 'Lugaw',              categoryId: 'merienda', priceCentavos: 3500, stock: 20, icon: '🥣' },
  { name: 'Arroz Caldo',        categoryId: 'merienda', priceCentavos: 5500, stock: 15, icon: '🍚' },
  { name: 'Palabok',            categoryId: 'merienda', priceCentavos: 6500, stock: 15, icon: '🍝' },

  // Kanin at Extra
  { name: 'Plain Rice',         categoryId: 'kanin',   priceCentavos: 1500, stock: 50, icon: '🍚', extras: withMods([RICE_SIZE]) },
  { name: 'Garlic Rice',        categoryId: 'kanin',   priceCentavos: 2500, stock: 30, icon: '🍚', extras: withMods([RICE_SIZE]) },
  { name: 'Egg',                categoryId: 'kanin',   priceCentavos: 1500, stock: 40, icon: '🥚' },

  // Inumin
  { name: "Sago't Gulaman",     categoryId: 'inumin',  priceCentavos: 2500, stock: 20, icon: '🥤' },
  { name: 'Coke 1.5L',          categoryId: 'inumin',  priceCentavos: 9500, stock: 10, icon: '🥤' },
  { name: 'Bottled Water',      categoryId: 'inumin',  priceCentavos: 2000, stock: 30, icon: '💧' },

  // Panghimagas
  { name: 'Halo-Halo',          categoryId: 'panghimagas', priceCentavos: 7500, stock: 12, icon: '🍧' },
  { name: 'Leche Flan slice',   categoryId: 'panghimagas', priceCentavos: 4500, stock: 15, icon: '🍮' }
];

export const restaurantSampleTables = () => [
  { id: 'tbl-1', name: 'T1', mapX: 0, mapY: 0, status: 'available' as const },
  { id: 'tbl-2', name: 'T2', mapX: 1, mapY: 0, status: 'available' as const },
  { id: 'tbl-3', name: 'T3', mapX: 2, mapY: 0, status: 'available' as const },
  { id: 'tbl-4', name: 'T4', mapX: 0, mapY: 1, status: 'available' as const },
  { id: 'tbl-5', name: 'T5', mapX: 1, mapY: 1, status: 'available' as const },
  { id: 'tbl-6', name: 'T6', mapX: 2, mapY: 1, status: 'available' as const }
];
