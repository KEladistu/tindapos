import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { NumericPad } from '../common/NumericPad';
import { useCart } from '../../stores/cart';
import { useCatalog } from '../../stores/catalog';
import { useSession } from '../../stores/session';
import { useSettings } from '../../stores/settings';
import { formatPHP, toCentavos } from '../../engine/money';
import { db, type CustomerRow, type SaleRow, type SaleLineRow } from '../../db/schema';
import { useT } from '../../i18n';
import { ReceiptModal } from './ReceiptModal';
import type { ReceiptData } from '../../engine/receipt-render';

interface Props { open: boolean; onClose: () => void; }

const QUICK = [20, 50, 100, 500, 1000];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type PayMethod = 'cash' | 'utang' | 'gcash';

export function TenderModal({ open, onClose }: Props) {
  const t = useT();
  const lines = useCart((s) => s.lines);
  const total = useCart((s) => s.totalC());
  const clear = useCart((s) => s.clear);
  const decrement = useCatalog((s) => s.decrementStock);
  const { userId, userName } = useSession();
  const storeName = useSettings((s) => s.storeName);
  const storeInfo = useSettings((s) => s.storeInfo);
  const vatEnabled = useSettings((s) => s.vatEnabled);
  const [tendered, setTendered] = useState('');
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<PayMethod>('cash');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [newCustName, setNewCustName] = useState('');

  useEffect(() => { void db.customers.toArray().then(setCustomers); }, [open]);

  const tenderedC = useMemo(() => {
    const n = parseFloat(tendered || '0');
    return Number.isFinite(n) ? toCentavos(n) : 0;
  }, [tendered]);
  const changeC = Math.max(0, tenderedC - total);
  const enough = method === 'cash' ? tenderedC >= total && total > 0 : total > 0;

  async function complete() {
    if (!enough || busy) return;
    if (method === 'utang' && !customerId && !newCustName.trim()) { alert('Pick or create a customer'); return; }
    setBusy(true);
    const saleId = uid();
    const ts = Date.now();
    let custId = customerId;
    if (method === 'utang' && !custId && newCustName.trim()) {
      custId = uid();
      await db.customers.put({ id: custId, name: newCustName.trim(), balanceCentavos: 0 });
    }
    const paymentMethod: SaleRow['paymentMethod'] = method === 'utang' ? 'utang' : method === 'gcash' ? 'gcash' : 'cash';
    const saleLines: SaleLineRow[] = [];
    await db.transaction('rw', db.sales, db.saleLines, db.items, db.customers, db.utangEntries, async () => {
      await db.sales.put({
        id: saleId, ts, userId,
        paymentMethod, status: 'complete',
        totalCentavos: total,
        tenderedCentavos: method === 'cash' ? tenderedC : total,
        changeCentavos: method === 'cash' ? changeC : 0
      });
      for (const l of lines) {
        const sl: SaleLineRow = {
          id: uid(), saleId, itemId: l.itemId, name: l.name,
          unitPriceCentavos: l.unitPriceC, qty: l.qty,
          lineTotalCentavos: l.unitPriceC * l.qty
        };
        saleLines.push(sl);
        await db.saleLines.put(sl);
      }
      if (method === 'utang' && custId) {
        await db.utangEntries.put({
          id: uid(), customerId: custId, saleId, amountCentavos: total, ts, kind: 'charge'
        });
        const cust = await db.customers.get(custId);
        if (cust) await db.customers.put({ ...cust, balanceCentavos: cust.balanceCentavos + total });
      }
    });
    for (const l of lines) await decrement(l.itemId, l.qty);

    const sale = await db.sales.get(saleId);
    if (sale) {
      setReceipt({
        store: { name: storeName, address: storeInfo.address, contact: storeInfo.contact, tin: storeInfo.tin, footer: storeInfo.footer, vatEnabled, provisionalLabel: 'PROVISIONAL RECEIPT — NOT FOR BIR' },
        sale, lines: saleLines,
        tenderedC: method === 'cash' ? tenderedC : undefined,
        changeC: method === 'cash' ? changeC : undefined,
        cashierName: userName
      });
    }
    clear();
    setTendered('');
    setBusy(false);
  }

  function addQuick(n: number) {
    const current = parseFloat(tendered || '0') || 0;
    setTendered(String(current + n));
  }

  return (
    <>
      <Modal open={open && !receipt} onClose={onClose} title={t('pos.checkout')}>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-slate-100 flex items-center">
            <div className="text-slate-600">{t('pos.total')}</div>
            <div className="ml-auto text-2xl font-bold text-amber-600">{formatPHP(total)}</div>
          </div>
          <div className="flex gap-2">
            {(['cash', 'utang', 'gcash'] as PayMethod[]).map((m) => (
              <button key={m} onClick={() => setMethod(m)}
                className={`flex-1 py-2 rounded ${method === m ? 'bg-amber-500 text-white' : 'bg-slate-100'}`}>{m}</button>
            ))}
          </div>
          {method === 'cash' && (
            <>
              <div>
                <div className="text-sm text-slate-600 mb-1">{t('pos.cashTendered')}</div>
                <div className="text-3xl font-bold text-right p-3 bg-white border-2 border-slate-200 rounded-lg min-h-[64px]">
                  {formatPHP(tenderedC)}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {QUICK.map((q) => (
                  <button key={q} onClick={() => addQuick(q)} className="btn-secondary text-sm px-1 min-h-[44px]">+₱{q}</button>
                ))}
              </div>
              <NumericPad value={tendered} onChange={setTendered} />
              <div className="p-3 rounded-lg bg-emerald-50 flex items-center">
                <div className="text-emerald-700">{t('pos.change')}</div>
                <div className="ml-auto text-xl font-bold text-emerald-700">{formatPHP(changeC)}</div>
              </div>
            </>
          )}
          {method === 'utang' && (
            <div className="space-y-2">
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                className="w-full min-h-[40px] px-3 rounded border border-slate-200">
                <option value="">— New customer —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({formatPHP(c.balanceCentavos)})</option>)}
              </select>
              {!customerId && (
                <input placeholder="New customer name" value={newCustName} onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded border border-slate-200" />
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setTendered(''); onClose(); }}>{t('pos.cancel')}</Button>
            <Button className="flex-1" disabled={!enough || busy} onClick={complete}>{t('pos.completeSale')}</Button>
          </div>
        </div>
      </Modal>
      <ReceiptModal open={!!receipt} data={receipt} onClose={() => { setReceipt(null); onClose(); }} />
    </>
  );
}
