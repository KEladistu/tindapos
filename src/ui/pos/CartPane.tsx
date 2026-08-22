import { useCart } from '../../stores/cart';
import { formatPHP } from '../../engine/money';
import { lineTotal } from '../../engine/cart';
import { useT } from '../../i18n';
import { Button } from '../common/Button';

interface Props { onCheckout: () => void; }

export function CartPane({ onCheckout }: Props) {
  const t = useT();
  const lines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const total = useCart((s) => s.totalC());

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center">
        <div className="font-semibold">{t('pos.cart')}</div>
        {lines.length > 0 && (
          <button onClick={clear} className="ml-auto text-sm text-slate-500 hover:text-red-600">
            {t('pos.clear')}
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {lines.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">{t('pos.empty')}</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {lines.map((l) => (
              <li key={l.itemId} className="p-3 flex items-center gap-2">
                <div className="text-2xl">{l.icon ?? '📦'}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{l.name}</div>
                  <div className="text-xs text-slate-500">{formatPHP(l.unitPriceC)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setQty(l.itemId, l.qty - 1)}
                    className="w-8 h-8 rounded bg-slate-100 font-bold"
                  >−</button>
                  <div className="w-8 text-center font-semibold">{l.qty}</div>
                  <button
                    onClick={() => setQty(l.itemId, l.qty + 1)}
                    className="w-8 h-8 rounded bg-slate-100 font-bold"
                  >+</button>
                </div>
                <div className="w-20 text-right text-sm font-bold">{formatPHP(lineTotal(l))}</div>
                <button
                  onClick={() => remove(l.itemId)}
                  className="text-slate-400 hover:text-red-600 text-lg"
                  aria-label={t('pos.remove')}
                >✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-4 border-t border-slate-200 space-y-3">
        <div className="flex items-center">
          <div className="text-slate-600">{t('pos.total')}</div>
          <div className="ml-auto text-2xl font-bold text-amber-600">{formatPHP(total)}</div>
        </div>
        <Button className="w-full" disabled={lines.length === 0} onClick={onCheckout}>
          {t('pos.checkout')}
        </Button>
      </div>
    </div>
  );
}
