import { useMemo, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { NumericPad } from '../common/NumericPad';
import { useT } from '../../i18n';
import type { ItemRow } from '../../db/schema';
import { db } from '../../db/schema';
import { formatPHP, toCentavos } from '../../engine/money';
import { useCylinders } from '../../stores/cylinders';
import { refillSwap, newTank, type TxResult } from '../../profiles/lpg/modules/cylinders';
import { useSession } from '../../stores/session';
import { DeliveryCaptureFields, type DeliveryFields } from './DeliveryCaptureFields';
import { createDelivery, DEFAULT_RIDERS } from '../../profiles/lpg/modules/delivery';

interface Props {
  open: boolean;
  onClose: () => void;
  item: ItemRow | null;
  /** 'refill' or 'new' — derived from item.extras.kind */
  kind: 'refill' | 'new';
}

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function SwapModal({ open, onClose, item, kind }: Props) {
  const t = useT();
  const cylinders = useCylinders();
  const applyUpdates = useCylinders((s) => s.applyUpdates);
  const { userId } = useSession();

  const sku = (item?.extras?.sku as string | undefined) ?? '';
  const counts = sku ? cylinders.countsFor(sku) : { full: 0, empty: 0, onLoan: 0 };

  const [mode, setMode] = useState<'deposit' | 'sold'>('deposit');
  const [tendered, setTendered] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [override, setOverride] = useState(false);
  const [busy, setBusy] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryFields>({
    forDelivery: false, customerName: '', phone: '', address: '', riderId: DEFAULT_RIDERS[0]
  });

  const total = item?.priceCentavos ?? 0;
  const tenderedC = useMemo(() => {
    const n = parseFloat(tendered || '0');
    return Number.isFinite(n) ? toCentavos(n) : 0;
  }, [tendered]);
  const changeC = Math.max(0, tenderedC - total);
  const enough = tenderedC >= total && total > 0;

  const noStock = counts.full <= 0;
  const requiresCustomer = kind === 'new' && mode === 'deposit';
  const canConfirm =
    !!item &&
    (!noStock || override) &&
    enough &&
    (!requiresCustomer || (customerName.trim().length > 0)) &&
    (!delivery.forDelivery || (delivery.customerName.trim() && delivery.phone.trim() && delivery.address.trim()));

  function reset() {
    setMode('deposit');
    setTendered('');
    setCustomerName('');
    setPhone('');
    setOverride(false);
    setDelivery({ forDelivery: false, customerName: '', phone: '', address: '', riderId: DEFAULT_RIDERS[0] });
  }

  async function confirm() {
    if (!item || !canConfirm || busy) return;
    setBusy(true);
    try {
      // Ensure customer row exists if we're capturing one.
      let custId: string | undefined;
      const effectiveName = requiresCustomer ? customerName.trim() : (delivery.forDelivery ? delivery.customerName.trim() : '');
      const effectivePhone = requiresCustomer ? phone.trim() : (delivery.forDelivery ? delivery.phone.trim() : '');
      if (effectiveName) {
        custId = `cust_${uid()}`;
        await db.customers.put({ id: custId, name: effectiveName, phone: effectivePhone, balanceCentavos: 0 });
      }

      let tx: TxResult;
      if (kind === 'refill') {
        tx = refillSwap({ sku, rows: cylinders.rows, override });
      } else {
        tx = newTank({
          sku,
          rows: cylinders.rows,
          mode,
          customerId: custId,
          depositCentavos: mode === 'deposit' ? item.priceCentavos : 0,
          override
        });
      }

      const saleId = uid();
      const ts = Date.now();
      await db.transaction('rw', db.sales, db.saleLines, db.auditLog, async () => {
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
        await db.saleLines.put({
          id: uid(),
          saleId,
          itemId: item.id,
          name: item.name,
          unitPriceCentavos: item.priceCentavos,
          qty: 1,
          lineTotalCentavos: item.priceCentavos,
          extras: tx.saleLineExtras
        });
        if (tx.oversell) {
          await db.auditLog.add({ ts, kind: 'lpg.oversell', payload: { sku, action: tx.saleLineExtras.action } });
        }
      });

      await applyUpdates(tx.updates);

      if (delivery.forDelivery) {
        await createDelivery({
          saleId,
          customerName: delivery.customerName.trim(),
          phone: delivery.phone.trim(),
          address: delivery.address.trim(),
          riderId: delivery.riderId,
          itemsSummary: `${item.name} x1`,
          totalCentavos: total
        });
      }

      reset();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  if (!item) return null;

  const title = kind === 'refill' ? `${t('lpg.refill')} — ${item.name}` : `${t('lpg.newTank')} — ${item.name}`;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />{t('lpg.full')} <b>{counts.full}</b></span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />{t('lpg.empty')} <b>{counts.empty}</b></span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />{t('lpg.onLoan')} <b>{counts.onLoan}</b></span>
        </div>

        {noStock && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm">
            <div className="font-semibold text-rose-700 mb-1">{t('lpg.noStock')}</div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
              <span>{t('lpg.recordAnyway')}</span>
            </label>
          </div>
        )}

        {kind === 'new' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode('deposit')}
              className={`p-3 rounded-xl border-2 min-h-[64px] font-medium ${mode === 'deposit' ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`}
            >
              {t('lpg.mode.deposit')}
            </button>
            <button
              onClick={() => setMode('sold')}
              className={`p-3 rounded-xl border-2 min-h-[64px] font-medium ${mode === 'sold' ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`}
            >
              {t('lpg.mode.sold')}
            </button>
          </div>
        )}

        {requiresCustomer && (
          <div className="space-y-2">
            <input
              className="w-full min-h-[44px] px-3 rounded-lg border-2 border-slate-200"
              placeholder={t('lpg.customerName') + ' *'}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <input
              className="w-full min-h-[44px] px-3 rounded-lg border-2 border-slate-200"
              placeholder={t('lpg.phone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        )}

        <DeliveryCaptureFields value={delivery} onChange={setDelivery} />

        <div className="p-3 rounded-lg bg-slate-100 flex items-center">
          <div className="text-slate-600">{t('pos.total')}</div>
          <div className="ml-auto text-2xl font-bold text-amber-600">{formatPHP(total)}</div>
        </div>

        <div>
          <div className="text-sm text-slate-600 mb-1">{t('pos.cashTendered')}</div>
          <div className="text-2xl font-bold text-right p-3 bg-white border-2 border-slate-200 rounded-lg min-h-[56px]">
            {formatPHP(tenderedC)}
          </div>
        </div>
        <NumericPad value={tendered} onChange={setTendered} />
        <div className="p-3 rounded-lg bg-emerald-50 flex items-center">
          <div className="text-emerald-700">{t('pos.change')}</div>
          <div className="ml-auto text-xl font-bold text-emerald-700">{formatPHP(changeC)}</div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { reset(); onClose(); }}>{t('pos.cancel')}</Button>
          <Button className="flex-1" disabled={!canConfirm || busy} onClick={confirm}>{t('pos.completeSale')}</Button>
        </div>
      </div>
    </Modal>
  );
}
