import Dexie from 'dexie';
export class TindaDB extends Dexie {
    settings;
    users;
    categories;
    items;
    photos;
    customers;
    utangEntries;
    sales;
    saleLines;
    discounts;
    cylinders;
    deliveries;
    diningTables;
    orders;
    auditLog;
    constructor() {
        super('tindapos');
        this.version(1).stores({
            settings: 'key',
            users: 'id, role',
            categories: 'id, order',
            items: 'id, categoryId, archived, [categoryId+order]',
            photos: 'id',
            customers: 'id, name, balanceCentavos',
            utangEntries: 'id, customerId, saleId, ts',
            sales: 'id, ts, userId, paymentMethod, status',
            saleLines: 'id, saleId, itemId',
            discounts: 'id, saleId, type',
            cylinders: 'id, sku, state',
            deliveries: 'id, saleId, status, riderId',
            diningTables: 'id, mapX, mapY, status',
            orders: 'id, tableId, status',
            auditLog: '++id, ts, kind'
        });
    }
}
export const db = new TindaDB();
