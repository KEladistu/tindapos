// Stub profile — full implementation lands in a later phase.
export const lpgProfile = {
    id: 'lpg',
    name: { en: 'LPG Dealer', tl: 'LPG Dealer' },
    itemSchema: [],
    defaultCategories: [],
    seedCatalog: [],
    modules: ['lpg-cylinders', 'lpg-delivery'],
    receiptTemplate: {
        widthMm: 58,
        header: ['LPG Dealer'],
        showVat: true,
        showLineNotes: true,
        footer: [],
        provisionalLabel: 'PROVISIONAL RECEIPT — NOT FOR BIR'
    },
    layoutDefaults: { columns: 2, showPhotos: true }
};
