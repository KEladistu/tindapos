import type { BusinessProfile } from '../types';
import { lpgSeed } from './seed';

export const LPG_BRANDS = ['Gasul', 'Solane', 'Regasco', 'Island Gas'] as const;
export const LPG_SIZES = [2.7, 11, 22, 50] as const;

export type LPGBrand = typeof LPG_BRANDS[number];
export type LPGSize = typeof LPG_SIZES[number];

/** Canonical sku e.g. "gasul-11" */
export function skuFor(brand: string, sizeKg: number): string {
  return `${brand.toLowerCase().replace(/\s+/g, '')}-${sizeKg}`;
}

export const lpgProfile: BusinessProfile = {
  id: 'lpg',
  name: { en: 'LPG / Gas', tl: 'LPG / Gas' },
  itemSchema: [
    { key: 'name', label: { en: 'Name', tl: 'Pangalan' }, type: 'text', required: true },
    { key: 'priceCentavos', label: { en: 'Price', tl: 'Presyo' }, type: 'money', required: true },
    {
      key: 'brand',
      label: { en: 'Brand', tl: 'Brand' },
      type: 'select',
      options: [...LPG_BRANDS]
    },
    {
      key: 'sizeKg',
      label: { en: 'Size (kg)', tl: 'Sukat (kg)' },
      type: 'select',
      options: LPG_SIZES.map(String)
    },
    {
      key: 'kind',
      label: { en: 'Kind', tl: 'Uri' },
      type: 'select',
      options: ['refill', 'new', 'accessory']
    }
  ],
  defaultCategories: [
    { id: 'refill', name: { en: 'Refill', tl: 'Refill' }, order: 1 },
    { id: 'new-tank', name: { en: 'New Tank', tl: 'Bagong Tangke' }, order: 2 },
    { id: 'accessories', name: { en: 'Accessories', tl: 'Accessories' }, order: 3 }
  ],
  seedCatalog: lpgSeed,
  modules: ['lpg-cylinders', 'lpg-delivery'],
  receiptTemplate: {
    widthMm: 58,
    header: ['LPG Dealer'],
    showVat: true,
    showLineNotes: true,
    footer: ['Ingat sa apoy!'],
    provisionalLabel: 'PROVISIONAL RECEIPT — NOT FOR BIR'
  },
  layoutDefaults: {
    columns: 3,
    showPhotos: false
  }
};
