import { useEffect, useState } from 'react';
import { useRestaurant } from '../../stores/restaurant';
import { useT } from '../../i18n';

function mmss(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function KitchenView() {
  const t = useT();
  const orders = useRestaurant((s) => s.orders);
  const linesByOrder = useRestaurant((s) => s.linesByOrder);
  const tables = useRestaurant((s) => s.tables);
  const markServed = useRestaurant((s) => s.markServed);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const active = orders
    .filter((o) => o.status === 'sent')
    .sort((a, b) => (a.sentAt ?? 0) - (b.sentAt ?? 0));

  const newOrders = active.filter((o) => now - (o.sentAt ?? 0) < 5 * 60 * 1000);
  const inProgress = active.filter((o) => now - (o.sentAt ?? 0) >= 5 * 60 * 1000);

  function labelFor(o: typeof orders[number]) {
    if (o.mode === 'takeout') return `Q-${String(o.queueNumber ?? 0).padStart(3, '0')}`;
    const tbl = tables.find((t) => t.id === o.tableId);
    return tbl?.name ?? tbl?.id ?? '—';
  }

  function Card({ o }: { o: typeof orders[number] }) {
    const lines = linesByOrder[o.id] ?? [];
    const elapsed = now - (o.sentAt ?? now);
    return (
      <div className="bg-slate-900 text-white rounded-xl p-3 shadow-lg border border-slate-700">
        <div className="flex items-baseline">
          <div className="text-2xl font-bold">{labelFor(o)}</div>
          <div className="ml-auto text-lg font-mono tabular-nums text-amber-300">{mmss(elapsed)}</div>
        </div>
        <ul className="mt-2 space-y-1">
          {lines.map((l) => (
            <li key={l.id} className="text-sm">
              <div>
                <span className="font-bold text-amber-200">{l.qty}×</span> {l.name}
              </div>
              {l.modifiers.length > 0 && (
                <div className="text-xs text-slate-300 ml-4">
                  {l.modifiers.map((m) => m.optionName).join(', ')}
                </div>
              )}
              {l.note && <div className="text-xs italic text-amber-300 ml-4">“{l.note}”</div>}
            </li>
          ))}
        </ul>
        <button
          className="mt-3 w-full min-h-[44px] rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
          onClick={() => void markServed(o.id)}
        >
          {t('kitchen.markServed')}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-800 p-4">
      <div className="grid gap-4 sm:grid-cols-2 max-w-5xl mx-auto">
        <div>
          <div className="text-white text-lg font-bold mb-2">{t('kitchen.new')} ({newOrders.length})</div>
          <div className="space-y-3">
            {newOrders.map((o) => <Card key={o.id} o={o} />)}
            {newOrders.length === 0 && <div className="text-slate-400 text-sm">—</div>}
          </div>
        </div>
        <div>
          <div className="text-white text-lg font-bold mb-2">{t('kitchen.inProgress')} ({inProgress.length})</div>
          <div className="space-y-3">
            {inProgress.map((o) => <Card key={o.id} o={o} />)}
            {inProgress.length === 0 && <div className="text-slate-400 text-sm">—</div>}
          </div>
        </div>
      </div>
      {active.length === 0 && (
        <div className="text-center text-slate-300 py-16">{t('kitchen.empty')}</div>
      )}
    </div>
  );
}
