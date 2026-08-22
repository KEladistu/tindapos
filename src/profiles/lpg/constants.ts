export const LPG_BRANDS = ['Gasul', 'Solane', 'Regasco', 'Island Gas'] as const;
export const LPG_SIZES = [2.7, 11, 22, 50] as const;

export type LPGBrand = typeof LPG_BRANDS[number];
export type LPGSize = typeof LPG_SIZES[number];

/** Canonical sku e.g. "gasul-11" */
export function skuFor(brand: string, sizeKg: number): string {
  return `${brand.toLowerCase().replace(/\s+/g, '')}-${sizeKg}`;
}
