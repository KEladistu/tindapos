import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { db, type SaleRow, type SaleLineRow, type ItemRow, type ShiftRow } from '../../db/schema';
import { computeDailyTotals, isSameDay, paymentBreakdown, topItems, salesToCSV } from '../../engine/reports';
import { formatPHP } from '../../engine/money';
import { downloadBlob } from '../../utils/backup';
import { useSettings } from '../../stores/settings';
import { useSession } from '../../stores/session';

interface Props { open: boolean; onClose: () => void; }

type View = 'today' | 'xz' | 'top' | 'lowstock' | 'payments' | 'range';

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function ReportsScreen({ open, onClose }: Props) {
  const [view, setView] = useState<View>('today');
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [lines, setLines] = useState<SaleLineRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [lastShift, setLastShift] = useState<ShiftRow | null>(null);
  const threshold = useSettings((s) => s.lowStockThreshold);
  const setThreshold = useSettings((s) => s.setLowStockThreshold);
  const userId = useSession((s) => s.userId);
  const [rangeStart, setRangeStart] = useState(() => new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10));
  const [rangeEnd, setRangeEnd] = useState(() => new Date().toISOString().slice(0, 10));

  async function reload() {
    setSales(await db.sales.toArray());
    setLines(await db.saleLines.toArray());
    setItems(await db.items.toArray());
    const shifts = await db.shifts.orderBy('openedAt').reverse().limit(1).toArray();
    setLastShift(shifts[0] ?? null);
  }
  useEffect(() => { if (open) void reload(); }, [open]);

  const today = new Date();
  const todaySales = useMemo(() => sales.filter((s) => isSameDay(s.ts, today)), [sales, today]);
  const shiftStartTs = lastShift?.closedAt ?? 0;
  const shiftSales = useMemo(() => sales.filter((s) => s.ts >= shiftStartTs), [sales, shiftStartTs]);

  async function doZReading() {
    if (!confirm('End of day close? Snapshot saved and shift resets.')) return;
    const totals = computeDailyTotals(shiftSales);
    const shift: ShiftRow = {
      id: uid(), openedAt: shiftStartTs || Date.now(), closedAt: Date.now(),
      openingFloatCentavos: 0,
      salesTotalCentavos: totals.gross,
      cashTotalCentavos: totals.byMethod.cash?.total ?? 0,
      utangTotalCentavos: totals.byMethod.utang?.total ?? 0,
      gcashTotalCentavos: totals.byMethod.gcash?.total ?? 0,
      otherTotalCentavos: totals.byMethod.other?.total ?? 0,
      transactionCount: totals.txCount,
      userId
    };
    await db.shifts.put(shift);
    await reload();
    alert('Z-reading saved.');
  }

  const rangeStartMs = new Date(rangeStart + 'T00:00:00').getTime();
  const rangeEndMs = new Date(rangeEnd + 'T23:59:59').getTime();
  const rangeSales = useMemo(() =>
    sales.filter((s) => s.ts >= rangeStartMs && s.ts <= rangeEndMs), [sales, rangeStartMs, rangeEndMs]);
  const rangeSaleIds = useMemo(() => new Set(rangeSales.map((s) => s.id)), [rangeSales]);

  return (
    <Modal open={open} onClose={onClose} title="Reports">
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {(['today', 'xz', 'top', 'lowstock', 'payments', 'range'] as View[]).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-2 rounded text-sm whitespace-nowrap ${view === v ? 'bg-amber-500 text-white' : 'bg-slate-100'}`}>
            {v}
          </button>
        ))}
      </div>

      {view === 'today' && (() => {
        const t = computeDailyTotals(todaySales);
        return (
          <div className="space-y-2">
            <Row k="Gross sales" v={formatPHP(t.gross)} />
            <Row k="Transactions" v={String(t.txCount)} />
            <Row k="Average ticket" v={formatPHP(t.average)} />
            <Row k="Cash in drawer" v={formatPHP(t.cashInDrawer)} />
            <div className="mt-2 font-semibold text-sm">By method</div>
            {Object.entries(t.byMethod).map(([m, x]) => (
              <Row key={m} k={m} v={`${formatPHP(x.total)} (${x.count})`} />
            ))}
          </div>
        );
      })()}

      {view === 'xz' && (() => {
        const t = computeDailyTotals(shiftSales);
        return (
          <div className="space-y-2">
            <div className="text-xs text-slate-500">Shift start: {shiftStartTs ? new Date(shiftStartTs).toLocaleString() : 'start of data'}</div>
            <Row k="Sales" v={formatPHP(t.gross)} />
            <Row k="Transactions" v={String(t.txCount)} />
            <Row k="Cash" v={formatPHP(t.byMethod.cash?.total ?? 0)} />
            <Row k="Utang" v={formatPHP(t.byMethod.utang?.total ?? 0)} />
            <Row k="GCash" v={formatPHP(t.byMethod.gcash?.total ?? 0)} />
            <div className="flex gap-2 mt-3">
              <Button variant="secondary" onClick={() => window.print()}>Print X-reading</Button>
              <Button onClick={doZReading}>Z-reading (close)</Button>
            </div>
          </div>
        );
      })()}

      {view === 'top' && (() => {
        const validIds = new Set(sales.filter((s) => s.status === 'complete').map((s) => s.id));
        const t = topItems(lines, validIds, 10);
        return (
          <div className="space-y-3">
            <div>
              <div className="font-semibold text-sm mb-1">By quantity</div>
              <ul>{t.byQty.map((x) => <li key={x.itemId} className="flex text-sm py-1"><span className="flex-1 truncate">{x.name}</span><span>{x.qty}</span></li>)}</ul>
            </div>
            <div>
              <div className="font-semibold text-sm mb-1">By revenue</div>
              <ul>{t.byRevenue.map((x) => <li key={x.itemId} className="flex text-sm py-1"><span className="flex-1 truncate">{x.name}</span><span>{formatPHP(x.revenue)}</span></li>)}</ul>
            </div>
          </div>
        );
      })()}

      {view === 'lowstock' && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            Threshold:
            <input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-20 min-h-[36px] px-2 rounded border border-slate-200" />
          </label>
          <ul>
            {items.filter((i) => !i.archived && i.stock <= threshold).map((i) => (
              <li key={i.id} className="flex text-sm py-1">
                <span className="flex-1 truncate">{i.name}</span>
                <span className={i.stock <= 0 ? 'text-red-600 font-bold' : 'text-amber-600'}>{i.stock}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {view === 'payments' && (() => {
        const rows = paymentBreakdown(todaySales);
        return (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.method}>
                <div className="flex text-sm"><span className="flex-1">{r.method} ({r.count})</span><span>{formatPHP(r.total)}</span></div>
                <div className="h-2 bg-slate-100 rounded overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${(r.pct * 100).toFixed(1)}%` }} />
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {view === 'range' && (() => {
        const t = computeDailyTotals(rangeSales);
        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="flex-1 min-h-[36px] px-2 rounded border border-slate-200" />
              <input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="flex-1 min-h-[36px] px-2 rounded border border-slate-200" />
            </div>
            <Row k="Sales" v={formatPHP(t.gross)} />
            <Row k="Transactions" v={String(t.txCount)} />
            <Row k="Average" v={formatPHP(t.average)} />
            <Button variant="secondary" onClick={() => {
              const rangeLines = lines.filter((l) => rangeSaleIds.has(l.saleId));
              downloadBlob(new Blob([salesToCSV(rangeSales, rangeLines)], { type: 'text/csv' }), 'sales-range.csv');
            }}>Export CSV</Button>
          </div>
        );
      })()}
    </Modal>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex text-sm py-1 border-b border-slate-100 last:border-0"><span className="flex-1 text-slate-600">{k}</span><span className="font-semibold">{v}</span></div>;
}
