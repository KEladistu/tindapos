import Dexie, { type Table } from 'dexie';

export interface SettingRow { key: string; value: unknown; }
export interface UserRow { id: string; role: 'owner'|'cashier'; name: string; pin?: string; }
export interface CategoryRow { id: string; name: string; order: number; }
export interface ItemRow {
  id: string;
  categoryId: string;
  name: string;
  priceCentavos: number;
  stock: number;
  icon?: string;
  order: number;
  archived: 0|1;
  extras?: Record<string, unknown>;
}
export interface PhotoRow { id: string; blob: Blob; }
export interface CustomerRow { id: string; name: string; balanceCentavos: number; phone?: string; }
export interface UtangEntryRow {
  id: string;
  customerId: string;
  saleId: string;
  amountCentavos: number;
  ts: number;
  kind: 'charge'|'payment';
}
export interface SaleRow {
  id: string;
  ts: number;
  userId: string;
  paymentMethod: 'cash'|'utang'|'gcash'|'other';
  status: 'complete'|'void';
  totalCentavos: number;
  tenderedCentavos: number;
  changeCentavos: number;
}
export interface SaleLineRow {
  id: string;
  saleId: string;
  itemId: string;
  name: string;
  unitPriceCentavos: number;
  qty: number;
  lineTotalCentavos: number;
}
export interface DiscountRow {
  id: string;
  saleId: string;
  type: 'senior'|'pwd'|'manual';
  amountCentavos: number;
}
export interface CylinderRow { id: string; sku: string; state: 'full'|'empty'|'out'; }
export interface DeliveryRow { id: string; saleId: string; status: string; riderId?: string; }
export interface TableRow { id: string; mapX: number; mapY: number; status: string; }
export interface OrderRow { id: string; tableId: string; status: string; }
export interface AuditLogRow { id?: number; ts: number; kind: string; payload?: unknown; }

export class TindaDB extends Dexie {
  settings!: Table<SettingRow, string>;
  users!: Table<UserRow, string>;
  categories!: Table<CategoryRow, string>;
  items!: Table<ItemRow, string>;
  photos!: Table<PhotoRow, string>;
  customers!: Table<CustomerRow, string>;
  utangEntries!: Table<UtangEntryRow, string>;
  sales!: Table<SaleRow, string>;
  saleLines!: Table<SaleLineRow, string>;
  discounts!: Table<DiscountRow, string>;
  cylinders!: Table<CylinderRow, string>;
  deliveries!: Table<DeliveryRow, string>;
  diningTables!: Table<TableRow, string>;
  orders!: Table<OrderRow, string>;
  auditLog!: Table<AuditLogRow, number>;

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
