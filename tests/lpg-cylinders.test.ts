import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { refillSwap, newTank, returnEmpty, countBySku } from '../src/profiles/lpg/modules/cylinders';
import type { CylinderRow } from '../src/db/schema';
import { db } from '../src/db/schema';

function mkRow(id: string, sku: string, state: CylinderRow['state'], extra: Partial<CylinderRow> = {}): CylinderRow {
  return { id, sku, state, createdAt: 0, updatedAt: 0, ...extra };
}

const SKU = 'gasul-11';

function baseRows(): CylinderRow[] {
  return [
    mkRow('a', SKU, 'full'),
    mkRow('b', SKU, 'full'),
    mkRow('c', SKU, 'empty'),
    mkRow('d', 'solane-11', 'full')
  ];
}

describe('lpg cylinders — refill swap', () => {
  it('turns one full → empty for this sku', () => {
    const rows = baseRows();
    const tx = refillSwap({ sku: SKU, rows });
    expect(tx.updates).toHaveLength(1);
    expect(tx.updates[0].changes.state).toBe('empty');
    expect(tx.oversell).toBe(false);
  });

  it('rejects when no full stock without override', () => {
    const rows: CylinderRow[] = [mkRow('c', SKU, 'empty')];
    expect(() => refillSwap({ sku: SKU, rows })).toThrow(/NO_FULL_STOCK/);
  });

  it('allows oversell with override and flags it', () => {
    const rows: CylinderRow[] = [mkRow('c', SKU, 'empty')];
    const tx = refillSwap({ sku: SKU, rows, override: true });
    expect(tx.oversell).toBe(true);
    expect(tx.updates).toHaveLength(0);
    expect(tx.saleLineExtras.action).toBe('refill-swap');
  });
});

describe('lpg cylinders — new tank', () => {
  it('deposit mode marks cylinder on-loan and requires customerId', () => {
    const rows = baseRows();
    expect(() => newTank({ sku: SKU, rows, mode: 'deposit' })).toThrow(/CUSTOMER_REQUIRED/);
    const tx = newTank({ sku: SKU, rows, mode: 'deposit', customerId: 'cust1', depositCentavos: 350000 });
    expect(tx.updates[0].changes.state).toBe('on-loan');
    expect(tx.updates[0].changes.customerId).toBe('cust1');
    expect(tx.updates[0].changes.depositCentavos).toBe(350000);
  });

  it('sold-outright does not record customer as loan holder', () => {
    const rows = baseRows();
    const tx = newTank({ sku: SKU, rows, mode: 'sold' });
    expect(tx.saleLineExtras.action).toBe('new-tank-sold');
  });

  it('rejects new-tank when no full stock unless override', () => {
    const rows: CylinderRow[] = [mkRow('c', SKU, 'empty')];
    expect(() => newTank({ sku: SKU, rows, mode: 'sold' })).toThrow(/NO_FULL_STOCK/);
    const tx = newTank({ sku: SKU, rows, mode: 'sold', override: true });
    expect(tx.oversell).toBe(true);
  });
});

describe('lpg cylinders — return empty', () => {
  it('turns on-loan → empty and refunds deposit', () => {
    const rows: CylinderRow[] = [mkRow('x', SKU, 'on-loan', { customerId: 'c1', depositCentavos: 350000 })];
    const tx = returnEmpty({ cylinderId: 'x', rows });
    expect(tx.updates[0].changes.state).toBe('empty');
    expect(tx.updates[0].changes.customerId).toBeUndefined();
    expect(tx.extraCentavos).toBe(-350000);
  });

  it('rejects when cylinder is not on loan', () => {
    const rows: CylinderRow[] = [mkRow('x', SKU, 'full')];
    expect(() => returnEmpty({ cylinderId: 'x', rows })).toThrow(/NOT_ON_LOAN/);
  });

  it('rejects when cylinder missing', () => {
    expect(() => returnEmpty({ cylinderId: 'nope', rows: [] })).toThrow(/NOT_FOUND/);
  });
});

describe('countBySku', () => {
  it('counts states for a sku', () => {
    const rows: CylinderRow[] = [
      mkRow('a', SKU, 'full'),
      mkRow('b', SKU, 'full'),
      mkRow('c', SKU, 'empty'),
      mkRow('d', SKU, 'on-loan'),
      mkRow('e', 'solane-11', 'full')
    ];
    expect(countBySku(rows, SKU)).toEqual({ full: 2, empty: 1, onLoan: 1 });
  });
});

describe('oversell audit log', () => {
  beforeEach(async () => {
    await db.auditLog.clear();
  });
  it('caller writes lpg.oversell entry when override used', async () => {
    const rows: CylinderRow[] = [mkRow('c', SKU, 'empty')];
    const tx = refillSwap({ sku: SKU, rows, override: true });
    if (tx.oversell) {
      await db.auditLog.add({ ts: Date.now(), kind: 'lpg.oversell', payload: { sku: SKU } });
    }
    const entries = await db.auditLog.where('kind').equals('lpg.oversell').toArray();
    expect(entries).toHaveLength(1);
  });
});
