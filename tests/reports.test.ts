import { describe, it, expect } from 'vitest';
import { computeDailyTotals, topItems, paymentBreakdown, salesToCSV } from '../src/engine/reports';
import type { SaleRow, SaleLineRow } from '../src/db/schema';

const sales: SaleRow[] = [
  { id: 's1', ts: 1, userId: 'u', paymentMethod: 'cash', status: 'complete', totalCentavos: 10000, tenderedCentavos: 10000, changeCentavos: 0 },
  { id: 's2', ts: 2, userId: 'u', paymentMethod: 'cash', status: 'complete', totalCentavos: 20000, tenderedCentavos: 25000, changeCentavos: 5000 },
  { id: 's3', ts: 3, userId: 'u', paymentMethod: 'utang', status: 'complete', totalCentavos: 5000, tenderedCentavos: 5000, changeCentavos: 0 },
  { id: 's4', ts: 4, userId: 'u', paymentMethod: 'cash', status: 'void', totalCentavos: 99999, tenderedCentavos: 0, changeCentavos: 0 }
];
const lines: SaleLineRow[] = [
  { id: 'l1', saleId: 's1', itemId: 'a', name: 'A', unitPriceCentavos: 5000, qty: 2, lineTotalCentavos: 10000 },
  { id: 'l2', saleId: 's2', itemId: 'b', name: 'B', unitPriceCentavos: 10000, qty: 2, lineTotalCentavos: 20000 },
  { id: 'l3', saleId: 's3', itemId: 'a', name: 'A', unitPriceCentavos: 5000, qty: 1, lineTotalCentavos: 5000 }
];

describe('reports', () => {
  it('daily totals excludes void', () => {
    const t = computeDailyTotals(sales);
    expect(t.gross).toBe(35000);
    expect(t.txCount).toBe(3);
    expect(t.cashInDrawer).toBe(30000);
  });
  it('cash in drawer sums correctly', () => {
    const t = computeDailyTotals(sales);
    // s1: 10000-0 = 10000. s2: 25000-5000 = 20000. total 30000
    expect(t.cashInDrawer).toBe(30000);
  });
  it('top items by qty and revenue', () => {
    const validIds = new Set(sales.filter((s) => s.status === 'complete').map((s) => s.id));
    const t = topItems(lines, validIds);
    expect(t.byQty[0].itemId).toBe('a'); // 3 qty
    expect(t.byRevenue[0].itemId).toBe('b'); // 20k
  });
  it('payment breakdown', () => {
    const p = paymentBreakdown(sales);
    const cash = p.find((x) => x.method === 'cash')!;
    expect(cash.total).toBe(30000);
  });
  it('csv includes header + rows', () => {
    const csv = salesToCSV(sales, lines);
    expect(csv.split('\n')[0]).toContain('saleId');
    expect(csv).toContain('s1');
  });
});
