// Stub profile — full implementation lands in a later phase.
export const restaurantProfile = {
    id: 'restaurant',
    name: { en: 'Restaurant', tl: 'Restawran' },
    itemSchema: [],
    defaultCategories: [],
    seedCatalog: [],
    modules: ['tables', 'modifiers', 'kitchen', 'split-bill'],
    receiptTemplate: {
        widthMm: 80,
        header: ['Restaurant'],
        showVat: true,
        showLineNotes: true,
        footer: ['Salamat!'],
        provisionalLabel: 'PROVISIONAL RECEIPT — NOT FOR BIR'
    },
    layoutDefaults: { columns: 3, showPhotos: true }
};
