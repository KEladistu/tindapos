import { db, type DeliveryRow, type DeliveryStatus } from '../../../db/schema';

function uid(prefix = 'dlv') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export interface CreateDeliveryInput {
  saleId: string;
  customerName: string;
  phone: string;
  address: string;
  riderId?: string;
  itemsSummary: string;
  totalCentavos: number;
}

export async function createDelivery(input: CreateDeliveryInput): Promise<DeliveryRow> {
  const now = Date.now();
  const row: DeliveryRow = {
    id: uid(),
    saleId: input.saleId,
    status: 'pending',
    riderId: input.riderId,
    customerName: input.customerName,
    phone: input.phone,
    address: input.address,
    itemsSummary: input.itemsSummary,
    totalCentavos: input.totalCentavos,
    createdAt: now,
    updatedAt: now
  };
  await db.deliveries.put(row);
  await db.auditLog.add({ ts: now, kind: 'delivery.create', payload: { id: row.id, saleId: row.saleId } });
  return row;
}

export async function setDeliveryStatus(id: string, status: DeliveryStatus): Promise<void> {
  await db.deliveries.update(id, { status, updatedAt: Date.now() });
  await db.auditLog.add({ ts: Date.now(), kind: 'delivery.status', payload: { id, status } });
}

export async function listDeliveries(): Promise<DeliveryRow[]> {
  return db.deliveries.orderBy('id').reverse().toArray();
}

export const DEFAULT_RIDERS = ['Rider 1', 'Rider 2', 'Rider 3'];
