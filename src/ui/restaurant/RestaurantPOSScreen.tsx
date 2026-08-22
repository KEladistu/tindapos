import { useEffect, useMemo, useState } from 'react';
import { useCatalog } from '../../stores/catalog';
import { useT } from '../../i18n';
import { formatPHP } from '../../engine/money';
import { useRestaurant, type RestaurantLine } from '../../stores/restaurant';
import { useEditor } from '../../stores/editor';
import { EditorToolbar } from '../editor/EditorToolbar';
import { TileGrid } from '../pos/TileGrid';
import type { ItemRow, TableRow } from '../../db/schema';
import { ModifierModal } from './ModifierModal';
import type { ModifierGroup } from '../../profiles/restaurant/modifiers';
import { OrderPane } from './OrderPane';
import { TableMap } from './TableMap';
import { KitchenView } from './KitchenView';
import { RestaurantTender } from './RestaurantTender';
import { SplitBillModal } from './SplitBillModal';
import { Button } from '../common/Button';

function getModifierGroups(it: ItemRow): ModifierGroup[] {
  const mg = it.extras?.modifierGroups;
  return Array.isArray(mg) ? (mg as ModifierGroup[]) : [];
}

export function RestaurantPOSScreen() {
  const t = useT();
  const loadCat = useCatalog((s) => s.load);
  const items = useCatalog((s) => s.items);
  const categories = useCatalog((s) => s.categories);
  const editing = useEditor((s) => s.enabled);

  const {
    view, mode, currentOrderId, currentTableId, tables, orders, linesByOrder,
    hydrate, hydrated,
    setView, setMode, setCurrentTable, setCurrentOrder,
    createOrder, addLine, sendToKitchen, updateLineModifiers, updateLineNote
  } = useRestaurant();

  const [catId, setCatId] = useState<string | 'all'>('all');
  const [modItem, setModItem] = useState<ItemRow | null>(null);
  const [editingLine, setEditingLine] = useState<RestaurantLine | null>(null);
  const [tenderOpen, setTenderOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [perPersonBuckets, setPerPersonBuckets] = useState<{ personIndex: number; lines: RestaurantLine[]; totalC: number }[] | undefined>(undefined);
  const [evenShares, setEvenShares] = useState<number[] | undefined>(undefined);
  const [tableMapOpen, setTableMapOpen] = useState(false);

  useEffect(() => { void loadCat(); }, [loadCat]);
  useEffect(() => { if (!hydrated) void hydrate(); }, [hydrate, hydrated]);

  const filtered = useMemo(() => {
    const arr = catId === 'all' ? items : items.filter((i) => i.categoryId === catId);
    return [...arr].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [items, catId]);

  function ensureOrderThen(fn: (orderId: string) => void) {
    if (currentOrderId) return fn(currentOrderId);
    if (mode === 'dine-in') {
      if (!currentTableId) {
        setTableMapOpen(true);
        return;
      }
      void createOrder({ mode: 'dine-in', tableId: currentTableId }).then((o) => fn(o.id));
    } else {
      void createOrder({ mode: 'takeout' }).then((o) => fn(o.id));
    }
  }

  function onTileTap(it: ItemRow) {
    const groups = getModifierGroups(it);
    if (groups.length > 0) {
      setModItem(it);
    } else {
      ensureOrderThen((orderId) => {
        addLine(orderId, {
          itemId: it.id,
          name: it.name,
          basePriceCentavos: it.priceCentavos,
          unitPriceCentavos: it.priceCentavos,
          qty: 1,
          modifiers: []
        });
      });
    }
  }

  function onModifierConfirm(mods: Parameters<typeof addLine>[1]['modifiers'], note: string, unitPrice: number) {
    if (!modItem) return;
    ensureOrderThen((orderId) => {
      addLine(orderId, {
        itemId: modItem.id,
        name: modItem.name,
        basePriceCentavos: modItem.priceCentavos,
        unitPriceCentavos: unitPrice,
        qty: 1,
        modifiers: mods,
        note: note || undefined
      });
    });
    setModItem(null);
  }

  function onEditLine(line: RestaurantLine) {
    setEditingLine(line);
  }
  function saveLineEdit(mods: Parameters<typeof updateLineModifiers>[2], note: string, unitPrice: number) {
    if (!editingLine || !currentOrderId) return;
    updateLineModifiers(currentOrderId, editingLine.id, mods, unitPrice);
    updateLineNote(currentOrderId, editingLine.id, note);
    setEditingLine(null);
  }

  function onPickTable(tbl: TableRow) {
    setCurrentTable(tbl.id);
    // If there's already an open order at that table, resume it.
    const existing = orders.find((o) => o.tableId === tbl.id && (o.status === 'open' || o.status === 'sent' || o.status === 'served'));
    if (existing) setCurrentOrder(existing.id);
    else setCurrentOrder(null);
    setView('pos');
  }

  const currentLines = currentOrderId ? (linesByOrder[currentOrderId] ?? []) : [];

  // Header context label
  const contextLabel = (() => {
    if (mode === 'takeout') {
      const o = orders.find((o) => o.id === currentOrderId);
      return o ? `Q-${String(o.queueNumber ?? 0).padStart(3, '0')}` : t('restaurant.newTakeout');
    }
    const tbl = tables.find((t) => t.id === currentTableId);
    return tbl ? (tbl.name ?? tbl.id) : t('restaurant.pickTable');
  })();

  if (view === 'kitchen') {
    return (
      <div className="h-full flex flex-col">
        <TopBar
          view={view} setView={setView}
          mode={mode} setMode={setMode}
          contextLabel={contextLabel}
          onNewOrder={() => setView('pos')}
        />
        <div className="flex-1 min-h-0"><KitchenView /></div>
      </div>
    );
  }

  if (view === 'tables' || tableMapOpen) {
    return (
      <div className="h-full flex flex-col">
        <TopBar
          view={view === 'tables' ? 'tables' : 'pos'} setView={(v) => { setView(v); setTableMapOpen(false); }}
          mode={mode} setMode={setMode}
          contextLabel={contextLabel}
          onNewOrder={() => { setTableMapOpen(false); setView('pos'); }}
        />
        {editing && <EditorToolbar />}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <TableMap editing={editing} onPickTable={(tbl) => { onPickTable(tbl); setTableMapOpen(false); }} />
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="h-full flex flex-col">
        <TopBar
          view={view} setView={setView}
          mode={mode} setMode={setMode}
          contextLabel={contextLabel}
          onNewOrder={() => setCurrentOrder(null)}
        />
        <EditorToolbar />
        <div className="flex-1 min-h-0 overflow-hidden">
          <TileGrid editing />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <TopBar
        view={view} setView={setView}
        mode={mode} setMode={setMode}
        contextLabel={contextLabel}
        onNewOrder={() => setCurrentOrder(null)}
      />
      <div className="flex-1 min-h-0 grid grid-rows-[1fr] sm:grid-cols-[1fr_360px]">
        <div className="min-h-0 overflow-hidden flex flex-col">
          <div className="flex gap-2 overflow-x-auto p-2 bg-white border-b border-slate-200">
            <button
              onClick={() => setCatId('all')}
              className={`btn min-h-[40px] px-3 text-sm ${catId === 'all' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
            >{t('cat.all')}</button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCatId(c.id)}
                className={`btn min-h-[40px] px-3 text-sm whitespace-nowrap ${catId === c.id ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
              >{c.name}</button>
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
                  <div className="text-3xl">{it.icon ?? '🍽️'}</div>
                  <div className="text-xs font-medium text-slate-800 text-center leading-tight line-clamp-2">{it.name}</div>
                  <div className="text-sm font-bold text-amber-600">{formatPHP(it.priceCentavos)}</div>
                  {getModifierGroups(it).length > 0 && (
                    <div className="text-[10px] text-slate-400">{t('restaurant.hasOptions')}</div>
                  )}
                </button>
              ))}
              {filtered.length === 0 && <div className="col-span-full text-center text-slate-500 py-8">{t('pos.emptyCatalog')}</div>}
            </div>
          </div>
        </div>
        <div className="hidden sm:block min-h-0">
          <OrderPane
            onSend={() => currentOrderId && void sendToKitchen(currentOrderId)}
            onSplit={() => setSplitOpen(true)}
            onCheckout={() => { setPerPersonBuckets(undefined); setEvenShares(undefined); setTenderOpen(true); }}
            onEditLine={onEditLine}
          />
        </div>
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 flex items-center gap-2 shadow-lg">
          <div className="flex-1 text-sm">
            {t('pos.cart')} ({currentLines.length}) <span className="font-bold text-amber-600">{formatPHP(currentLines.reduce((s, l) => s + l.unitPriceCentavos * l.qty, 0))}</span>
          </div>
          <Button variant="secondary" disabled={currentLines.length === 0} onClick={() => currentOrderId && void sendToKitchen(currentOrderId)}>{t('restaurant.sendToKitchen')}</Button>
          <Button disabled={currentLines.length === 0} onClick={() => setTenderOpen(true)}>{t('pos.checkout')}</Button>
        </div>
      </div>

      {modItem && (
        <ModifierModal
          open={!!modItem}
          onClose={() => setModItem(null)}
          itemName={modItem.name}
          basePriceCentavos={modItem.priceCentavos}
          groups={getModifierGroups(modItem)}
          onConfirm={onModifierConfirm}
        />
      )}
      {editingLine && (
        <ModifierModal
          open={!!editingLine}
          onClose={() => setEditingLine(null)}
          itemName={editingLine.name}
          basePriceCentavos={editingLine.basePriceCentavos}
          groups={(() => {
            const it = items.find((i) => i.id === editingLine.itemId);
            return it ? getModifierGroups(it) : [];
          })()}
          initialMods={editingLine.modifiers}
          initialNote={editingLine.note}
          onConfirm={saveLineEdit}
        />
      )}
      <RestaurantTender
        open={tenderOpen}
        onClose={() => setTenderOpen(false)}
        perPersonBuckets={perPersonBuckets}
        evenShares={evenShares}
      />
      <SplitBillModal
        open={splitOpen}
        onClose={() => setSplitOpen(false)}
        lines={currentLines}
        onConfirmEven={(shares) => {
          setEvenShares(shares);
          setPerPersonBuckets(undefined);
          setSplitOpen(false);
          setTenderOpen(true);
        }}
        onConfirmByItem={(buckets) => {
          setPerPersonBuckets(buckets.filter((b) => b.lines.length > 0));
          setEvenShares(undefined);
          setSplitOpen(false);
          setTenderOpen(true);
        }}
      />
    </div>
  );
}

function TopBar({
  view, setView, mode, setMode, contextLabel, onNewOrder
}: {
  view: 'pos' | 'tables' | 'kitchen';
  setView: (v: 'pos' | 'tables' | 'kitchen') => void;
  mode: 'dine-in' | 'takeout';
  setMode: (m: 'dine-in' | 'takeout') => void;
  contextLabel: string;
  onNewOrder: () => void;
}) {
  const t = useT();
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="flex gap-1 px-2 pt-2">
        {(['pos', 'tables', 'kitchen'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium ${view === v ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {v === 'pos' ? t('header.pos') : v === 'tables' ? t('restaurant.tables') : t('restaurant.kitchen')}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-100">
        <div className="inline-flex rounded-lg overflow-hidden border border-slate-200">
          <button
            className={`px-3 min-h-[36px] text-sm ${mode === 'dine-in' ? 'bg-amber-500 text-white' : 'bg-white text-slate-700'}`}
            onClick={() => setMode('dine-in')}
          >{t('restaurant.dineIn')}</button>
          <button
            className={`px-3 min-h-[36px] text-sm ${mode === 'takeout' ? 'bg-amber-500 text-white' : 'bg-white text-slate-700'}`}
            onClick={() => setMode('takeout')}
          >{t('restaurant.takeout')}</button>
        </div>
        <div className="text-sm text-slate-600 truncate">{contextLabel}</div>
        <div className="ml-auto">
          <Button variant="secondary" onClick={onNewOrder}>{t('restaurant.newOrder')}</Button>
        </div>
      </div>
    </div>
  );
}
