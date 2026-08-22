import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useSettings, type AccentColor } from '../../stores/settings';
import { UsersSettings } from '../users/UsersSettings';
import { exportJSON, importJSON, exportSalesCSV, hardReset, downloadBlob, exportSelfHostZip } from '../../utils/backup';
import { bluetoothPrinter } from '../../engine/printers/bluetooth';
import { browserPrinter } from '../../engine/printers/browser';

interface Props { open: boolean; onClose: () => void; }

const TABS = ['store', 'tax', 'appearance', 'users', 'printer', 'data'] as const;
type Tab = typeof TABS[number];

const ACCENTS: AccentColor[] = ['amber', 'emerald', 'sky', 'rose', 'violet'];
const ACCENT_HEX: Record<AccentColor, string> = {
  amber: '#f59e0b', emerald: '#10b981', sky: '#0ea5e9', rose: '#f43f5e', violet: '#8b5cf6'
};

export function SettingsScreen({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('store');
  const s = useSettings();
  const [importing, setImporting] = useState(false);

  async function onImport(file: File) {
    if (!confirm('This will REPLACE all local data. Continue?')) return;
    setImporting(true);
    try {
      const res = await importJSON(file);
      alert(`Restored ${res.restored} rows (skipped ${res.skipped} tables). Reloading.`);
      location.reload();
    } catch (e) {
      alert('Import failed: ' + (e as Error).message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 rounded text-sm whitespace-nowrap ${tab === t ? 'bg-amber-500 text-white' : 'bg-slate-100'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'store' && (
        <div className="space-y-3">
          <label className="block">
            <div className="text-sm mb-1">Store name</div>
            <input value={s.storeName} onChange={(e) => s.setStoreName(e.target.value)}
              className="w-full min-h-[40px] px-3 rounded border border-slate-200" />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Address</div>
            <input value={s.storeInfo.address} onChange={(e) => s.setStoreInfo({ address: e.target.value })}
              className="w-full min-h-[40px] px-3 rounded border border-slate-200" />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Contact</div>
            <input value={s.storeInfo.contact} onChange={(e) => s.setStoreInfo({ contact: e.target.value })}
              className="w-full min-h-[40px] px-3 rounded border border-slate-200" />
          </label>
          <label className="block">
            <div className="text-sm mb-1">TIN</div>
            <input value={s.storeInfo.tin} onChange={(e) => s.setStoreInfo({ tin: e.target.value })}
              className="w-full min-h-[40px] px-3 rounded border border-slate-200" />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Receipt footer</div>
            <textarea value={s.storeInfo.footer} onChange={(e) => s.setStoreInfo({ footer: e.target.value })}
              rows={3} className="w-full px-3 py-2 rounded border border-slate-200" />
          </label>
        </div>
      )}

      {tab === 'tax' && (
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={s.vatEnabled} onChange={(e) => s.setVatEnabled(e.target.checked)} />
            <span>VAT-registered (12%)</span>
          </label>
          <p className="text-sm text-slate-600">
            {s.vatEnabled
              ? 'Prices treated as VAT-inclusive; receipt shows a VAT breakdown.'
              : 'Non-VAT store: no VAT breakdown on receipts.'}
          </p>
        </div>
      )}

      {tab === 'appearance' && (
        <div className="space-y-4">
          <div className="text-sm">Accent color</div>
          <div className="flex gap-3">
            {ACCENTS.map((c) => (
              <button key={c} onClick={() => s.setAccent(c)}
                className={`w-10 h-10 rounded-full border-4 ${s.accent === c ? 'border-slate-900' : 'border-transparent'}`}
                style={{ backgroundColor: ACCENT_HEX[c] }} aria-label={c} />
            ))}
          </div>
          <div className="text-sm">Language</div>
          <div className="flex gap-2">
            <button onClick={() => s.setLanguage('en')} className={`px-4 py-2 rounded ${s.language === 'en' ? 'bg-amber-500 text-white' : 'bg-slate-100'}`}>English</button>
            <button onClick={() => s.setLanguage('tl')} className={`px-4 py-2 rounded ${s.language === 'tl' ? 'bg-amber-500 text-white' : 'bg-slate-100'}`}>Tagalog</button>
          </div>
        </div>
      )}

      {tab === 'users' && <UsersSettings />}

      {tab === 'printer' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Bluetooth printer support requires Chromium (Android/desktop Chrome/Edge).
          </p>
          <Button
            disabled={!bluetoothPrinter.available()}
            onClick={async () => {
              try {
                await bluetoothPrinter.print({
                  store: { name: s.storeName, provisionalLabel: 'TEST PRINT' },
                  sale: { id: 'test', ts: Date.now(), userId: 'test', paymentMethod: 'cash', status: 'complete', totalCentavos: 0, tenderedCentavos: 0, changeCentavos: 0 },
                  lines: []
                });
              } catch (e) { alert('BT print failed: ' + (e as Error).message); }
            }}
          >
            Pair & test print (BT)
          </Button>
          <Button variant="secondary" onClick={() => browserPrinter.print({
            store: { name: s.storeName, provisionalLabel: 'TEST PRINT' },
            sale: { id: 'test', ts: Date.now(), userId: 'test', paymentMethod: 'cash', status: 'complete', totalCentavos: 0, tenderedCentavos: 0, changeCentavos: 0 },
            lines: []
          })}>Test browser print</Button>
        </div>
      )}

      {tab === 'data' && (
        <div className="space-y-3">
          <Button onClick={async () => {
            const blob = await exportJSON();
            downloadBlob(blob, `tindapos-backup-${new Date().toISOString().slice(0, 10)}.json`);
            await s.setLastBackupTs(Date.now());
          }}>Export JSON backup</Button>
          <label className="block btn-secondary text-center cursor-pointer">
            {importing ? 'Importing…' : 'Import JSON backup'}
            <input type="file" accept="application/json" hidden
              onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
          </label>
          <Button variant="secondary" onClick={async () => {
            const blob = await exportSalesCSV();
            downloadBlob(blob, `sales-${new Date().toISOString().slice(0, 10)}.csv`);
          }}>Export sales CSV</Button>
          <Button variant="secondary" onClick={async () => {
            const blob = await exportSelfHostZip();
            downloadBlob(blob, 'tindapos-selfhost.zip');
          }}>Export self-host zip</Button>
          <Button className="!bg-red-600" onClick={async () => {
            if (!confirm('WIPE ALL DATA?')) return;
            if (!confirm('Really wipe? This cannot be undone.')) return;
            await hardReset();
          }}>Hard reset</Button>
        </div>
      )}
    </Modal>
  );
}
