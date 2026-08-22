import type { CylinderRow } from '../../../db/schema';

/** Per-SKU counts. */
export interface StockCounts { full: number; empty: number; onLoan: number; }

export function countBySku(rows: CylinderRow[], sku: string): StockCounts {
  const r = rows.filter((c) => c.sku === sku);
  return {
    full: r.filter((c) => c.state === 'full').length,
    empty: r.filter((c) => c.state === 'empty').length,
    onLoan: r.filter((c) => c.state === 'on-loan').length
  };
}

export interface CylinderUpdate {
  id: string;
  changes: Partial<CylinderRow>;
}

export interface TxResult {
  updates: CylinderUpdate[];
  saleLineExtras: Record<string, unknown>;
  /** Optional adjustment to sale total. Negative = refund. Positive = extra owed (deposit). */
  extraCentavos?: number;
  oversell?: boolean;
}

/**
 * Refill swap. Customer brings empty, gets one of our full.
 * Net: full -1, empty +1. We take an owned "full" and swap it into "empty".
 */
export function refillSwap(opts: {
  sku: string;
  rows: CylinderRow[];
  override?: boolean;
  now?: number;
}): TxResult {
  const { sku, rows, override = false } = opts;
  const now = opts.now ?? Date.now();
  const counts = countBySku(rows, sku);
  const oversell = counts.full <= 0;
  if (oversell && !override) {
    throw new Error('NO_FULL_STOCK');
  }
  const updates: CylinderUpdate[] = [];
  if (!oversell) {
    const full = rows.find((c) => c.sku === sku && c.state === 'full')!;
    updates.push({ id: full.id, changes: { state: 'empty', updatedAt: now } });
  }
  return {
    updates,
    saleLineExtras: { sku, action: 'refill-swap', cylinderId: updates[0]?.id, oversell },
    oversell
  };
}

/**
 * New-tank purchase.
 * - mode 'deposit': loan a cylinder to customer. Full -1, on-loan +1. Records depositCentavos/customerId.
 * - mode 'sold': outright sale. Full -1. No inventory retained.
 */
export function newTank(opts: {
  sku: string;
  rows: CylinderRow[];
  mode: 'deposit' | 'sold';
  customerId?: string;
  depositCentavos?: number;
  override?: boolean;
  now?: number;
}): TxResult {
  const { sku, rows, mode, customerId, depositCentavos, override = false } = opts;
  const now = opts.now ?? Date.now();
  const counts = countBySku(rows, sku);
  const oversell = counts.full <= 0;
  if (oversell && !override) {
    throw new Error('NO_FULL_STOCK');
  }
  if (mode === 'deposit' && !customerId) {
    throw new Error('CUSTOMER_REQUIRED_FOR_DEPOSIT');
  }

  const updates: CylinderUpdate[] = [];
  let cylinderId: string | undefined;
  if (!oversell) {
    const full = rows.find((c) => c.sku === sku && c.state === 'full')!;
    cylinderId = full.id;
    if (mode === 'deposit') {
      updates.push({
        id: full.id,
        changes: {
          state: 'on-loan',
          customerId,
          depositCentavos,
          updatedAt: now
        }
      });
    } else {
      // sold outright — remove from our inventory. We just delete via marker.
      updates.push({ id: full.id, changes: { state: 'empty', updatedAt: now } });
      // Actually for outright sale, cylinder leaves our books. Represent with a sentinel change:
      updates[updates.length - 1].changes = { state: 'on-loan', customerId: '__sold__', updatedAt: now, depositCentavos: 0 };
      // Callers may prefer db.cylinders.delete — but keeping a paper trail is safer.
    }
  }

  return {
    updates,
    saleLineExtras: { sku, action: mode === 'deposit' ? 'new-tank-deposit' : 'new-tank-sold', cylinderId, oversell },
    oversell
  };
}

/**
 * Return of an on-loan cylinder → refund deposit.
 * on-loan -1, empty +1. Sale is negative.
 */
export function returnEmpty(opts: {
  cylinderId: string;
  rows: CylinderRow[];
  now?: number;
}): TxResult {
  const { cylinderId, rows } = opts;
  const now = opts.now ?? Date.now();
  const cyl = rows.find((c) => c.id === cylinderId);
  if (!cyl) throw new Error('CYLINDER_NOT_FOUND');
  if (cyl.state !== 'on-loan') throw new Error('CYLINDER_NOT_ON_LOAN');
  const refund = cyl.depositCentavos ?? 0;
  return {
    updates: [{
      id: cyl.id,
      changes: {
        state: 'empty',
        customerId: undefined,
        depositCentavos: undefined,
        updatedAt: now
      }
    }],
    saleLineExtras: { sku: cyl.sku, action: 'return-empty', cylinderId: cyl.id, refundCentavos: refund },
    extraCentavos: -refund
  };
}
