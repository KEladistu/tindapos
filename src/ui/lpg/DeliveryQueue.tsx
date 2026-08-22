import { useEffect, useState } from 'react';
import { db, type DeliveryRow } from '../../db/schema';
import { setDeliveryStatus } from '../../profiles/lpg/modules/delivery';
import { useT } from '../../i18n';
import { formatPHP } from '../../engine/money';
import { Button } from '../common/Button';

function isToday(ts: number): boolean {
  const d = new Date(ts);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function Card({ d, onChange }: { d: DeliveryRow; onChange: () => void }) {
  const t = useT();
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{d.customerName}</div>
          <div className="text-xs text-slate-500 truncate">{d.address}</div>
        </div>
        <div className="text-right font-bold text-amber-600">{formatPHP(d.totalCentavos)}</div>
      </div>
      <div className="text-sm text-slate-700">{d.itemsSummary}</div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <a href={`tel:${d.phone}`} className="text-amber-600 underline">{d.phone}</a>
        {d.riderId && <span className="px-2 py-0.5 bg-slate-100 rounded">{d.riderId}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {d.status === 'pending' && (
          <Button className="flex-1 min-h-[40px]" onClick={async () => { await setDeliveryStatus(d.id, 'out'); onChange(); }}>
            {t('lpg.markOutForDelivery')}
          </Button>
        )}
        {d.status === 'out' && (
          <Button className="flex-1 min-h-[40px]" onClick={async () => { await setDeliveryStatus(d.id, 'delivered'); onChange(); }}>
            {t('lpg.markDelivered')}
          </Button>
        )}
        {(d.status === 'pending' || d.status === 'out') && (
          <Button variant="secondary" className="min-h-[40px]" onClick={async () => { await setDeliveryStatus(d.id, 'cancelled'); onChange(); }}>
            {t('lpg.cancelDelivery')}
          </Button>
        )}
      </div>
    </div>
  );
}

export function DeliveryQueue() {
  const t = useT();
  const [rows, setRows] = useState<DeliveryRow[]>([]);
  const [showDelivered, setShowDelivered] = useState(false);

  async function load() {
    const r = await db.deliveries.toArray();
    r.sort((a, b) => b.createdAt - a.createdAt);
    setRows(r);
  }

  useEffect(() => { void load(); }, []);

  const pending = rows.filter((r) => r.status === 'pending');
  const out = rows.filter((r) => r.status === 'out');
  const delivered = rows.filter((r) => r.status === 'delivered' && isToday(r.updatedAt));

  return (
    <div className="h-full overflow-y-auto p-3 max-w-3xl mx-auto space-y-6">
      <section>
        <h2 className="font-bold text-slate-800 mb-2">{t('lpg.pending')} ({pending.length})</h2>
        <div className="space-y-2">
          {pending.length === 0 && <div className="text-sm text-slate-500">—</div>}
          {pending.map((d) => <Card key={d.id} d={d} onChange={load} />)}
        </div>
      </section>
      <section>
        <h2 className="font-bold text-slate-800 mb-2">{t('lpg.outForDelivery')} ({out.length})</h2>
        <div className="space-y-2">
          {out.length === 0 && <div className="text-sm text-slate-500">—</div>}
          {out.map((d) => <Card key={d.id} d={d} onChange={load} />)}
        </div>
      </section>
      <section>
        <button
          onClick={() => setShowDelivered((v) => !v)}
          className="font-bold text-slate-800 mb-2 flex items-center gap-2"
        >
          <span>{showDelivered ? '▼' : '▶'}</span>
          {t('lpg.delivered')} ({delivered.length})
        </button>
        {showDelivered && (
          <div className="space-y-2">
            {delivered.length === 0 && <div className="text-sm text-slate-500">—</div>}
            {delivered.map((d) => <Card key={d.id} d={d} onChange={load} />)}
          </div>
        )}
      </section>
    </div>
  );
}
