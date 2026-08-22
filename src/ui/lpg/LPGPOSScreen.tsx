import { useEffect, useMemo, useState } from 'react';
import { useCatalog } from '../../stores/catalog';
import { useCart } from '../../stores/cart';
import { useCylinders } from '../../stores/cylinders';
import { useT } from '../../i18n';
import { formatPHP } from '../../engine/money';
import { CartPane } from '../pos/CartPane';
import { TenderModal } from '../pos/TenderModal';
import { TileGrid } from '../pos/TileGrid';
import { useEditor } from '../../stores/editor';
import { EditorToolbar } from '../editor/EditorToolbar';
import { CylinderStockPanel } from './CylinderStockPanel';
import { SwapModal } from './SwapModal';
import { DeliveryQueue } from './DeliveryQueue';
import type { ItemRow } from '../../db/schema';
import { Button } from '../common/Button';
import { db } from '../../db/schema';
import { returnEmpty } from '../../profiles/lpg/modules/cylinders';
import { useSession } from '../../stores/session';

type Tab = 'pos' | 'deliveries';

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function ReturnEmptyPanel() {
  const t = useT();
  const rows = useCylinders((s) => s.rows);
  const applyUpdates = useCylinders((s) => s.applyUpdates);
  const { userId } = useSession();
  const loans = rows.filter((r) => r.state === 'on-loan');
  async function doReturn(id: string) {
    const tx = returnEmpty({ cylinderId: id, rows });
    const saleId = uid();
    const ts = Date.now();
    const refund = -(tx.extraCentavos ?? 0);
    await db.transaction('rw', db.sales, db.saleLines, async () => {
      await db.sales.put({
        id: saleId, ts, userId,
        paymentMethod: 'cash', status: 'complete',
        totalCentavos: -refund, tenderedCentavos: 0, changeCentavos: 0
      });
      await db.saleLines.put({
        id: uid(), saleId, itemId: 'return-empty',
        name: t('lpg.returnEmpty'),
        unitPriceCentavos: -refund, qty: 1, lineTotalCentavos: -refund,
        extras: tx.saleLineExtras
      });
    });
    await applyUpdates(tx.updates);
  }
  if (loans.length === 0) return null;
  return (
    <div className="p-3 border-t border-slate-200 space-y-2">
      <div className="font-semibold text-slate-800 text-sm">{t('lpg.returnEmpty')}</div>
      {loans.slice(0, 8).map((c) => (
        <div key={c.id} className="flex items-center gap-2 text-sm">
          <div className="flex-1 truncate">
            <div className="font-mono text-xs">{c.sku}</div>
            <div className="text-xs text-slate-500 truncate">{c.customerId ?? '—'}</div>
          </div>
          <div className="text-xs text-slate-600">{formatPHP(c.depositCentavos ?? 0)}</div>
          <Button variant="secondary" className="min-h-[36px] px-2 text-xs" onClick={() => doReturn(c.id)}>
            ↩
          </Button>
        </div>
      ))}
    </div>
  );
}

export function LPGPOSScreen() {
  const t = useT();
  const [tab, setTab] = useState<Tab>('pos');
  const loadCat = useCatalog((s) => s.load);
  const loadCyl = useCylinders((s) => s.load);
  const items = useCatalog((s) => s.items);
  const categories = useCatalog((s) => s.categories);
  const add = useCart((s) => s.add);
  const count = useCart((s) => s.count());
  const total = useCart((s) => s.totalC());
  const editing = useEditor((s) => s.enabled);
  const undo = useEditor((s) => s.undo);

  const [tenderOpen, setTenderOpen] = useState(false);
  const [swap, setSwap] = useState<{ item: ItemRow; kind: 'refill' | 'new' } | null>(null);
  const [catId, setCatId] = useState<string | 'all'>('all');

  useEffect(() => { void loadCat(); void loadCyl(); }, [loadCat, loadCyl]);

  useEffect(() => {
    if (!editing) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        void undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editing, undo]);

  const filtered = useMemo(() => {
    const arr = catId === 'all' ? items : items.filter((i) => i.categoryId === catId);
    return [...arr].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [items, catId]);

  function onTileTap(it: ItemRow) {
    const kind = (it.extras?.kind as string | undefined) ?? 'accessory';
    if (kind === 'refill') setSwap({ item: it, kind: 'refill' });
    else if (kind === 'new') setSwap({ item: it, kind: 'new' });
    else add({ itemId: it.id, name: it.name, unitPriceC: it.priceCentavos, icon: it.icon });
  }

  if (tab === 'deliveries') {
    return (
      <div className="h-full flex flex-col">
        <TabBar tab={tab} setTab={setTab} />
        <div className="flex-1 min-h-0"><DeliveryQueue /></div>
      </div>
    );
  }

  // Editor mode reuses the sari-sari TileGrid (categorized editing works out of the box).
  if (editing) {
    return (
      <div className="h-full flex flex-col">
        <TabBar tab={tab} setTab={setTab} />
        <EditorToolbar />
        <div className="flex-1 min-h-0 overflow-hidden">
          <TileGrid editing />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <TabBar tab={tab} setTab={setTab} />
      <div className="flex-1 min-h-0 grid grid-rows-[1fr] sm:grid-cols-[1fr_360px_240px]">
        <div className="min-h-0 overflow-hidden flex flex-col">
          <div className="flex gap-2 overflow-x-auto p-2 bg-white border-b border-slate-200">
            <button
              onClick={() => setCatId('all')}
              className={`btn min-h-[40px] px-3 text-sm ${catId === 'all' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              {t('cat.all')}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCatId(c.id)}
                className={`btn min-h-[40px] px-3 text-sm whitespace-nowrap ${catId === c.id ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filtered.map((it) => (
                <button
                  key={it.id}
                  onClick={() => onTileTap(it)}
                  className="bg-white rounded-xl border-2 border-slate-200 p-2 min-h-[96px] flex flex-col items-center justify-center gap-1 hover:border-amber-400 active:bg-amber-50"
                >
                  <div className="text-3xl">{it.icon ?? '📦'}</div>
                  <div className="text-xs font-medium text-slate-800 text-center leading-tight line-clamp-2">{it.name}</div>
                  <div className="text-sm font-bold text-amber-600">{formatPHP(it.priceCentavos)}</div>
                </button>
              ))}
              {filtered.length === 0 && <div className="col-span-full text-center text-slate-500 py-8">{t('pos.emptyCatalog')}</div>}
            </div>
          </div>
        </div>
        <div className="hidden sm:block min-h-0">
          <CartPane onCheckout={() => setTenderOpen(true)} />
        </div>
        <aside className="hidden sm:flex flex-col min-h-0 border-l border-slate-200 bg-slate-50 overflow-y-auto">
          <CylinderStockPanel />
          <ReturnEmptyPanel />
        </aside>
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 flex items-center gap-3 shadow-lg">
          <div className="flex-1 text-sm">
            {t('pos.cart')} ({count}) <span className="font-bold text-amber-600">{formatPHP(total)}</span>
          </div>
          <Button disabled={count === 0} onClick={() => setTenderOpen(true)}>{t('pos.checkout')}</Button>
        </div>
      </div>
      <TenderModal open={tenderOpen} onClose={() => setTenderOpen(false)} />
      <SwapModal
        open={!!swap}
        onClose={() => setSwap(null)}
        item={swap?.item ?? null}
        kind={swap?.kind ?? 'refill'}
      />
    </div>
  );
}

function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const t = useT();
  return (
    <div className="flex gap-1 px-2 pt-2 bg-white border-b border-slate-200">
      <button
        onClick={() => setTab('pos')}
        className={`px-4 py-2 rounded-t-lg text-sm font-medium ${tab === 'pos' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
      >
        {t('header.pos')}
      </button>
      <button
        onClick={() => setTab('deliveries')}
        className={`px-4 py-2 rounded-t-lg text-sm font-medium ${tab === 'deliveries' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
      >
        {t('header.deliveries')}
      </button>
    </div>
  );
}
