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
  photoBlobId?: string;
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
  notes?: string;
  extras?: Record<string, unknown>;
  orderId?: string;
}
export interface DiscountRow {
  id: string;
  saleId: string;
  type: 'senior'|'pwd'|'manual';
  amountCentavos: number;
  name?: string;
  idNumber?: string;
  vatExemptCentavos?: number;
  netCentavos?: number;
}
export interface CylinderRow {
  id: string;
  sku: string;
  state: 'full'|'empty'|'on-loan';
  customerId?: string;
  depositCentavos?: number;
  createdAt: number;
  updatedAt: number;
}
export type DeliveryStatus = 'pending' | 'out' | 'delivered' | 'cancelled';
export interface DeliveryRow {
  id: string;
  saleId: string;
  status: DeliveryStatus;
  riderId?: string;
  customerName: string;
  phone: string;
  address: string;
  itemsSummary: string;
  totalCentavos: number;
  createdAt: number;
  updatedAt: number;
}
export interface TableRow {
  id: string;
  mapX: number;
  mapY: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | string;
  name?: string;
}
export interface OrderRow {
  id: string;
  tableId: string;
  status: 'open' | 'sent' | 'served' | 'paid' | 'void' | string;
  mode?: 'dine-in' | 'takeout';
  queueNumber?: number;
  createdAt?: number;
  updatedAt?: number;
  sentAt?: number;
  saleId?: string;
}
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
    this.version(2).stores({
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
    // Phase 4: add orderId index on saleLines, mode/queueNumber on orders.
    // All new fields are additive; existing rows remain valid.
    this.version(3).stores({
      settings: 'key',
      users: 'id, role',
      categories: 'id, order',
      items: 'id, categoryId, archived, [categoryId+order]',
      photos: 'id',
      customers: 'id, name, balanceCentavos',
      utangEntries: 'id, customerId, saleId, ts',
      sales: 'id, ts, userId, paymentMethod, status',
      saleLines: 'id, saleId, itemId, orderId',
      discounts: 'id, saleId, type',
      cylinders: 'id, sku, state',
      deliveries: 'id, saleId, status, riderId',
      diningTables: 'id, mapX, mapY, status',
      orders: 'id, tableId, status, mode, queueNumber',
      auditLog: '++id, ts, kind'
    });
  }
}

export const db = new TindaDB();
