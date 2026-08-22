import { useMemo, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { NumericPad } from '../common/NumericPad';
import { formatPHP, toCentavos } from '../../engine/money';
import { db } from '../../db/schema';
import { useT } from '../../i18n';
import { useSession } from '../../stores/session';
import { useRestaurant, toSaleLineRows, type RestaurantLine } from '../../stores/restaurant';
import { SeniorPWDToggle, type SeniorPWDState } from './SeniorPWDToggle';
import { computeSeniorPwdDiscount } from '../../engine/discounts';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional per-person buckets (from split-by-item). If provided, one sale per bucket. */
  perPersonBuckets?: { personIndex: number; lines: RestaurantLine[]; totalC: number }[];
  /** Optional even-split shares, informational only for receipt. */
  evenShares?: number[];
}

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function RestaurantTender({ open, onClose, perPersonBuckets, evenShares }: Props) {
  const t = useT();
  const orderId = useRestaurant((s) => s.currentOrderId);
  const orders = useRestaurant((s) => s.orders);
  const linesByOrder = useRestaurant((s) => s.linesByOrder);
  const markPaid = useRestaurant((s) => s.markPaid);
  const { userId } = useSession();

  const order = orders.find((o) => o.id === orderId);
  const allLines = orderId ? (linesByOrder[orderId] ?? []) : [];

  // For split-by-item, we tender each bucket in sequence.
  const [bucketIdx, setBucketIdx] = useState(0);
  const activeBucketLines = perPersonBuckets ? perPersonBuckets[bucketIdx]?.lines ?? [] : allLines;

  const grossC = useMemo(
    () => activeBucketLines.reduce((s, l) => s + l.unitPriceCentavos * l.qty, 0),
    [activeBucketLines]
  );

  const [senior, setSenior] = useState<SeniorPWDState>({
    enabled: false, type: 'senior', name: '', idNumber: ''
  });
  const seniorCalc = senior.enabled ? computeSeniorPwdDiscount(grossC) : null;
  const dueC = seniorCalc ? seniorCalc.netC : grossC;

  const [tendered, setTendered] = useState('');
  const [busy, setBusy] = useState(false);

  const tenderedC = useMemo(() => {
    const n = parseFloat(tendered || '0');
    return Number.isFinite(n) ? toCentavos(n) : 0;
  }, [tendered]);
  const changeC = Math.max(0, tenderedC - dueC);
  const enough = tenderedC >= dueC && dueC > 0;

  const seniorValid = !senior.enabled || (senior.name.trim() && senior.idNumber.trim());

  async function completeBucket() {
    if (!orderId || !order) return;
    const saleId = uid();
    const ts = Date.now();
    const saleTotal = dueC;
    const isLastBucket = !perPersonBuckets || bucketIdx >= perPersonBuckets.length - 1;

    await db.transaction('rw', db.sales, db.saleLines, db.discounts, async () => {
      await db.sales.put({
        id: saleId, ts, userId,
        paymentMethod: 'cash', status: 'complete',
        totalCentavos: saleTotal,
        tenderedCentavos: tenderedC,
        changeCentavos: changeC
      });
      const rows = toSaleLineRows(activeBucketLines, saleId, orderId);
      for (const r of rows) await db.saleLines.put(r);
      if (senior.enabled && seniorCalc) {
        await db.discounts.put({
          id: uid(),
          saleId,
          type: senior.type,
          amountCentavos: seniorCalc.discountC,
          name: senior.name.trim(),
          idNumber: senior.idNumber.trim(),
          vatExemptCentavos: seniorCalc.vatExemptC,
          netCentavos: seniorCalc.netC
        });
      }
    });

    if (isLastBucket) {
      await markPaid(orderId, saleId);
      setBusy(false);
      setTendered('');
      setBucketIdx(0);
      setSenior({ enabled: false, type: 'senior', name: '', idNumber: '' });
      onClose();
    } else {
      setBucketIdx((n) => n + 1);
      setTendered('');
      setSenior({ enabled: false, type: 'senior', name: '', idNumber: '' });
      setBusy(false);
    }
  }

  async function complete() {
    if (!enough || busy || !seniorValid) return;
    setBusy(true);
    await completeBucket();
  }

  const label = perPersonBuckets
    ? `${t('restaurant.person')} ${bucketIdx + 1} / ${perPersonBuckets.length}`
    : (evenShares ? t('restaurant.splitEvenly') : t('pos.checkout'));

  return (
    <Modal open={open} onClose={onClose} title={label}>
      <div className="space-y-3">
        {evenShares && !perPersonBuckets && (
          <div className="text-xs text-slate-500">
            {t('restaurant.evenShareNote')}: {evenShares.map((s) => formatPHP(s)).join(' / ')}
          </div>
        )}
        <div className="p-3 rounded-lg bg-slate-100 flex items-center">
          <div className="text-slate-600 text-sm">{t('pos.total')}</div>
          <div className="ml-auto text-2xl font-bold text-amber-600">{formatPHP(dueC)}</div>
        </div>
        <SeniorPWDToggle state={senior} onChange={setSenior} grossCentavos={grossC} />
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
          <Button variant="secondary" onClick={() => { setTendered(''); onClose(); }}>
            {t('pos.cancel')}
          </Button>
          <Button className="flex-1" disabled={!enough || busy || !seniorValid} onClick={complete}>
            {t('pos.completeSale')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
