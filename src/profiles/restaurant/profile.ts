import type { BusinessProfile } from '../types';
import { restaurantSeed } from './seed';

export const restaurantProfile: BusinessProfile = {
  id: 'restaurant',
  name: { en: 'Restaurant / Carinderia', tl: 'Karinderya' },
  itemSchema: [
    { key: 'name', label: { en: 'Name', tl: 'Pangalan' }, type: 'text', required: true },
    { key: 'priceCentavos', label: { en: 'Price', tl: 'Presyo' }, type: 'money', required: true },
    { key: 'icon', label: { en: 'Icon', tl: 'Icon' }, type: 'text' }
    // extras.modifierGroups: ModifierGroup[] (attached per item, edited via editor mode)
  ],
  defaultCategories: [
    { id: 'ulam',        name: { en: 'Ulam',              tl: 'Ulam' },              order: 1 },
    { id: 'merienda',    name: { en: 'Merienda / Sabaw',  tl: 'Merienda / Sabaw' },  order: 2 },
    { id: 'kanin',       name: { en: 'Kanin at Extra',    tl: 'Kanin at Extra' },    order: 3 },
    { id: 'inumin',      name: { en: 'Inumin',            tl: 'Inumin' },            order: 4 },
    { id: 'panghimagas', name: { en: 'Panghimagas',       tl: 'Panghimagas' },       order: 5 }
  ],
  seedCatalog: restaurantSeed,
  modules: ['tables', 'modifiers', 'kitchen', 'split-bill', 'senior-pwd'],
  receiptTemplate: {
    widthMm: 58,
    header: ['Karinderya'],
    showVat: true,
    showLineNotes: true,
    footer: ['Salamat po!'],
    provisionalLabel: 'PROVISIONAL RECEIPT — NOT FOR BIR'
  },
  layoutDefaults: {
    columns: 3,
    showPhotos: false
  }
};
