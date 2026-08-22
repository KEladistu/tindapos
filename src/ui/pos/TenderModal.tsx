import { useMemo, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { NumericPad } from '../common/NumericPad';
import { useCart } from '../../stores/cart';
import { useCatalog } from '../../stores/catalog';
import { useSession } from '../../stores/session';
import { formatPHP, toCentavos } from '../../engine/money';
import { db } from '../../db/schema';
import { useT } from '../../i18n';

interface Props { open: boolean; onClose: () => void; }

const QUICK = [20, 50, 100, 500, 1000];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function TenderModal({ open, onClose }: Props) {
  const t = useT();
  const lines = useCart((s) => s.lines);
  const total = useCart((s) => s.totalC());
  const clear = useCart((s) => s.clear);
  const decrement = useCatalog((s) => s.decrementStock);
  const { userId } = useSession();
  const [tendered, setTendered] = useState('');
  const [busy, setBusy] = useState(false);

  const tenderedC = useMemo(() => {
    const n = parseFloat(tendered || '0');
    return Number.isFinite(n) ? toCentavos(n) : 0;
  }, [tendered]);
  const changeC = Math.max(0, tenderedC - total);
  const enough = tenderedC >= total && total > 0;

  async function complete() {
    if (!enough || busy) return;
    setBusy(true);
    const saleId = uid();
    const ts = Date.now();
    await db.transaction('rw', db.sales, db.saleLines, db.items, async () => {
      await db.sales.put({
        id: saleId,
        ts,
        userId,
        paymentMethod: 'cash',
        status: 'complete',
        totalCentavos: total,
        tenderedCentavos: tenderedC,
        changeCentavos: changeC
      });
      for (const l of lines) {
        await db.saleLines.put({
          id: uid(),
          saleId,
          itemId: l.itemId,
          name: l.name,
          unitPriceCentavos: l.unitPriceC,
          qty: l.qty,
          lineTotalCentavos: l.unitPriceC * l.qty
        });
      }
    });
    for (const l of lines) {
      await decrement(l.itemId, l.qty);
    }
    clear();
    setTendered('');
    setBusy(false);
    onClose();
  }

  function addQuick(n: number) {
    const current = parseFloat(tendered || '0') || 0;
    setTendered(String(current + n));
  }

  return (
    <Modal open={open} onClose={onClose} title={t('pos.checkout')}>
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-slate-100 flex items-center">
          <div className="text-slate-600">{t('pos.total')}</div>
          <div className="ml-auto text-2xl font-bold text-amber-600">{formatPHP(total)}</div>
        </div>
        <div>
          <div className="text-sm text-slate-600 mb-1">{t('pos.cashTendered')}</div>
          <div className="text-3xl font-bold text-right p-3 bg-white border-2 border-slate-200 rounded-lg min-h-[64px]">
            {formatPHP(tenderedC)}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => addQuick(q)}
              className="btn-secondary text-sm px-1 min-h-[44px]"
            >
              +₱{q}
            </button>
          ))}
        </div>
        <NumericPad value={tendered} onChange={setTendered} />
        <div className="p-3 rounded-lg bg-emerald-50 flex items-center">
          <div className="text-emerald-700">{t('pos.change')}</div>
          <div className="ml-auto text-xl font-bold text-emerald-700">{formatPHP(changeC)}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setTendered(''); onClose(); }}>
            {t('pos.cancel')}
          </Button>
          <Button className="flex-1" disabled={!enough || busy} onClick={complete}>
            {t('pos.completeSale')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
