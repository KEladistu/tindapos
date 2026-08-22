import { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { db, type CustomerRow } from '../../db/schema';
import { formatPHP, toCentavos } from '../../engine/money';

interface Props { open: boolean; onClose: () => void; }

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function UtangList({ open, onClose }: Props) {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  async function reload() { setCustomers(await db.customers.toArray()); }
  useEffect(() => { if (open) void reload(); }, [open]);

  async function recordPayment(c: CustomerRow) {
    const raw = prompt(`Payment amount for ${c.name} (₱)`);
    if (!raw) return;
    const cents = toCentavos(parseFloat(raw));
    if (!cents || cents <= 0) return;
    await db.utangEntries.put({
      id: uid(), customerId: c.id, saleId: '', amountCentavos: cents, ts: Date.now(), kind: 'payment'
    });
    await db.customers.put({ ...c, balanceCentavos: Math.max(0, c.balanceCentavos - cents) });
    await reload();
  }

  return (
    <Modal open={open} onClose={onClose} title="Utang (Customer Ledger)">
      {customers.length === 0 ? (
        <div className="text-slate-500 text-sm">No customers yet.</div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {customers.map((c) => (
            <li key={c.id} className="py-3 flex items-center gap-2">
              <div className="flex-1">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-slate-500">{c.phone ?? ''}</div>
              </div>
              <div className={`font-bold ${c.balanceCentavos > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {formatPHP(c.balanceCentavos)}
              </div>
              <Button variant="secondary" onClick={() => recordPayment(c)}>Pay</Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
