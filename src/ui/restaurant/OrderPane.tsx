import { formatPHP } from '../../engine/money';
import { useT } from '../../i18n';
import { Button } from '../common/Button';
import { useRestaurant, type RestaurantLine } from '../../stores/restaurant';

interface Props {
  onSend: () => void;
  onSplit: () => void;
  onCheckout: () => void;
  onEditLine: (line: RestaurantLine) => void;
}

export function OrderPane({ onSend, onSplit, onCheckout, onEditLine }: Props) {
  const t = useT();
  const orderId = useRestaurant((s) => s.currentOrderId);
  const orders = useRestaurant((s) => s.orders);
  const linesByOrder = useRestaurant((s) => s.linesByOrder);
  const setLineQty = useRestaurant((s) => s.setLineQty);
  const removeLine = useRestaurant((s) => s.removeLine);
  const tables = useRestaurant((s) => s.tables);

  if (!orderId) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-slate-500 text-sm text-center">
        {t('restaurant.pickTableOrStart')}
      </div>
    );
  }
  const order = orders.find((o) => o.id === orderId);
  const lines = linesByOrder[orderId] ?? [];
  const table = tables.find((tb) => tb.id === order?.tableId);
  const total = lines.reduce((s, l) => s + l.unitPriceCentavos * l.qty, 0);

  const label = order?.mode === 'takeout'
    ? `Q-${String(order.queueNumber ?? 0).padStart(3, '0')}`
    : (table?.name ?? table?.id ?? '—');

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200">
      <div className="p-3 border-b border-slate-200 flex items-center">
        <div>
          <div className="text-xs text-slate-500 uppercase">{t('restaurant.currentOrder')}</div>
          <div className="font-bold text-slate-800">{label}</div>
        </div>
        <div className="ml-auto text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 uppercase">
          {order?.status}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {lines.length === 0 && (
          <div className="text-slate-400 text-sm p-4 text-center">{t('pos.empty')}</div>
        )}
        {lines.map((l) => (
          <div key={l.id} className="border border-slate-200 rounded-lg p-2">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div className="font-medium text-sm text-slate-800">{l.name}</div>
                {l.modifiers.length > 0 && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    {l.modifiers.map((m) => m.optionName).join(', ')}
                  </div>
                )}
                {l.note && <div className="text-xs italic text-amber-700 mt-0.5">“{l.note}”</div>}
                {l.sent && <div className="text-[10px] uppercase text-emerald-600 font-bold mt-0.5">sent</div>}
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-amber-600">{formatPHP(l.unitPriceCentavos * l.qty)}</div>
                <div className="text-xs text-slate-500">{formatPHP(l.unitPriceCentavos)} × {l.qty}</div>
              </div>
            </div>
            <div className="flex gap-1 mt-2">
              <button
                className="min-h-[32px] px-2 rounded bg-slate-100 text-slate-700 text-sm"
                onClick={() => setLineQty(orderId, l.id, l.qty - 1)}
              >−</button>
              <div className="min-h-[32px] px-3 flex items-center text-sm">{l.qty}</div>
              <button
                className="min-h-[32px] px-2 rounded bg-slate-100 text-slate-700 text-sm"
                onClick={() => setLineQty(orderId, l.id, l.qty + 1)}
              >+</button>
              <button
                className="min-h-[32px] px-2 rounded bg-slate-100 text-slate-700 text-xs"
                onClick={() => onEditLine(l)}
              >{t('restaurant.edit')}</button>
              <button
                className="min-h-[32px] px-2 rounded bg-red-50 text-red-600 text-xs ml-auto"
                onClick={() => removeLine(orderId, l.id)}
              >{t('pos.remove')}</button>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-slate-200 space-y-2">
        <div className="flex items-center">
          <div className="text-slate-600 text-sm">{t('pos.total')}</div>
          <div className="ml-auto text-xl font-bold text-amber-600">{formatPHP(total)}</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="secondary" disabled={lines.length === 0} onClick={onSend}>
            {t('restaurant.sendToKitchen')}
          </Button>
          <Button variant="secondary" disabled={lines.length === 0} onClick={onSplit}>
            {t('restaurant.split')}
          </Button>
          <Button disabled={lines.length === 0} onClick={onCheckout}>
            {t('pos.checkout')}
          </Button>
        </div>
      </div>
    </div>
  );
}
