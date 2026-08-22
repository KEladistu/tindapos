import type { SaleRow, SaleLineRow } from '../db/schema';

export interface DailyTotals {
  gross: number;
  txCount: number;
  average: number;
  byMethod: Record<string, { total: number; count: number }>;
  cashInDrawer: number;
}

export function computeDailyTotals(sales: SaleRow[]): DailyTotals {
  const active = sales.filter((s) => s.status === 'complete');
  const gross = active.reduce((a, s) => a + s.totalCentavos, 0);
  const txCount = active.length;
  const average = txCount ? Math.round(gross / txCount) : 0;
  const byMethod: Record<string, { total: number; count: number }> = {};
  let cashInDrawer = 0;
  for (const s of active) {
    const b = (byMethod[s.paymentMethod] ??= { total: 0, count: 0 });
    b.total += s.totalCentavos;
    b.count += 1;
    if (s.paymentMethod === 'cash') {
      cashInDrawer += s.tenderedCentavos - s.changeCentavos;
    }
  }
  return { gross, txCount, average, byMethod, cashInDrawer };
}

export interface ItemAgg {
  itemId: string;
  name: string;
  qty: number;
  revenue: number;
}

export function topItems(lines: SaleLineRow[], validSaleIds: Set<string>, limit = 10): {
  byQty: ItemAgg[];
  byRevenue: ItemAgg[];
} {
  const map = new Map<string, ItemAgg>();
  for (const l of lines) {
    if (!validSaleIds.has(l.saleId)) continue;
    const cur = map.get(l.itemId) ?? { itemId: l.itemId, name: l.name, qty: 0, revenue: 0 };
    cur.qty += l.qty;
    cur.revenue += l.lineTotalCentavos;
    map.set(l.itemId, cur);
  }
  const all = Array.from(map.values());
  const byQty = [...all].sort((a, b) => b.qty - a.qty).slice(0, limit);
  const byRevenue = [...all].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
  return { byQty, byRevenue };
}

export function isSameDay(ts: number, day: Date): boolean {
  const d = new Date(ts);
  return d.getFullYear() === day.getFullYear()
    && d.getMonth() === day.getMonth()
    && d.getDate() === day.getDate();
}

export function inRange(ts: number, startMs: number, endMs: number): boolean {
  return ts >= startMs && ts <= endMs;
}

export function paymentBreakdown(sales: SaleRow[]): Array<{ method: string; total: number; count: number; pct: number }> {
  const t = computeDailyTotals(sales);
  const total = t.gross || 1;
  return Object.entries(t.byMethod).map(([method, v]) => ({
    method,
    total: v.total,
    count: v.count,
    pct: v.total / total
  })).sort((a, b) => b.total - a.total);
}

export function csvEscape(v: unknown): string {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function salesToCSV(sales: SaleRow[], lines: SaleLineRow[]): string {
  const linesBySale = new Map<string, SaleLineRow[]>();
  for (const l of lines) {
    const arr = linesBySale.get(l.saleId) ?? [];
    arr.push(l);
    linesBySale.set(l.saleId, arr);
  }
  const rows: string[] = [];
  rows.push(['saleId', 'ts', 'iso', 'userId', 'method', 'status', 'total', 'itemId', 'name', 'qty', 'unitPrice', 'lineTotal'].join(','));
  for (const s of sales) {
    const ls = linesBySale.get(s.id) ?? [];
    if (ls.length === 0) {
      rows.push([s.id, s.ts, new Date(s.ts).toISOString(), s.userId, s.paymentMethod, s.status, s.totalCentavos, '', '', '', '', ''].map(csvEscape).join(','));
    }
    for (const l of ls) {
      rows.push([s.id, s.ts, new Date(s.ts).toISOString(), s.userId, s.paymentMethod, s.status, s.totalCentavos, l.itemId, l.name, l.qty, l.unitPriceCentavos, l.lineTotalCentavos].map(csvEscape).join(','));
    }
  }
  return rows.join('\n');
}
