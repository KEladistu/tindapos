import { sariSariSeed } from './seed';
export const sariSariProfile = {
    id: 'sari-sari',
    name: { en: 'Sari-Sari Store', tl: 'Sari-Sari' },
    itemSchema: [
        { key: 'name', label: { en: 'Name', tl: 'Pangalan' }, type: 'text', required: true },
        { key: 'priceCentavos', label: { en: 'Price', tl: 'Presyo' }, type: 'money', required: true },
        { key: 'stock', label: { en: 'Stock', tl: 'Stock' }, type: 'number', default: 0 },
        { key: 'icon', label: { en: 'Icon', tl: 'Icon' }, type: 'text' }
    ],
    defaultCategories: [
        { id: 'snacks', name: { en: 'Snacks', tl: 'Meryenda' }, order: 1 },
        { id: 'beverages', name: { en: 'Beverages', tl: 'Inumin' }, order: 2 },
        { id: 'toiletries', name: { en: 'Toiletries', tl: 'Panligo' }, order: 3 },
        { id: 'canned', name: { en: 'Canned', tl: 'De Lata' }, order: 4 },
        { id: 'noodles', name: { en: 'Noodles', tl: 'Pancit' }, order: 5 }
    ],
    seedCatalog: sariSariSeed,
    modules: ['utang', 'tingi', 'senior-pwd'],
    receiptTemplate: {
        widthMm: 58,
        header: ['Sari-Sari Store', 'Salamat sa pagbili!'],
        showVat: false,
        showLineNotes: false,
        footer: ['Ingat po sa pag-uwi.'],
        provisionalLabel: 'PROVISIONAL RECEIPT — NOT FOR BIR'
    },
    layoutDefaults: {
        columns: 3,
        showPhotos: true
    }
};
