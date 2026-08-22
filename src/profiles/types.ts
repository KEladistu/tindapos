export type ModuleId =
  | 'utang'
  | 'tingi'
  | 'service-items'
  | 'lpg-cylinders'
  | 'lpg-delivery'
  | 'tables'
  | 'modifiers'
  | 'kitchen'
  | 'split-bill'
  | 'senior-pwd';

export type FieldType = 'text' | 'number' | 'select' | 'boolean' | 'money';

export interface FieldDef {
  key: string;
  label: { en: string; tl: string };
  type: FieldType;
  options?: string[];
  required?: boolean;
  default?: unknown;
}

export interface Category {
  id: string;
  name: { en: string; tl: string };
  order: number;
}

export interface SeedItem {
  name: string;
  categoryId: string;
  priceCentavos: number;
  stock?: number;
  icon?: string;
  extras?: Record<string, unknown>;
}

export interface ReceiptDef {
  widthMm: 58 | 80;
  header: string[];
  showVat: boolean;
  showLineNotes: boolean;
  footer: string[];
  provisionalLabel: string;
}

export interface LayoutDefaults {
  columns: 2 | 3 | 4;
  showPhotos: boolean;
}

export interface BusinessProfile {
  id: 'sari-sari' | 'lpg' | 'restaurant';
  name: { en: string; tl: string };
  itemSchema: FieldDef[];
  defaultCategories: Category[];
  seedCatalog: SeedItem[];
  modules: ModuleId[];
  receiptTemplate: ReceiptDef;
  layoutDefaults: LayoutDefaults;
}
