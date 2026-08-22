import { useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { browserPrinter } from '../../engine/printers/browser';
import { bluetoothPrinter } from '../../engine/printers/bluetooth';
import { shareImagePrinter, shareTextPrinter } from '../../engine/printers/share';
import { renderReceiptText, type ReceiptData } from '../../engine/receipt-render';

interface Props { open: boolean; onClose: () => void; data: ReceiptData | null; }

export function ReceiptModal({ open, onClose, data }: Props) {
  const text = useMemo(() => data ? renderReceiptText(data) : '', [data]);
  const outputs = [browserPrinter, bluetoothPrinter, shareImagePrinter, shareTextPrinter];

  return (
    <Modal open={open} onClose={onClose} title="Receipt">
      {data && (
        <>
          <pre className="bg-slate-50 p-3 rounded font-mono text-xs whitespace-pre overflow-x-auto max-h-[50vh]">
            {text}
          </pre>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {outputs.map((o) => (
              <Button key={o.name} variant="secondary" disabled={!o.available()}
                onClick={() => o.print(data).catch((e) => alert(o.name + ' failed: ' + e.message))}>
                {o.name}
              </Button>
            ))}
          </div>
          <Button className="w-full mt-2" onClick={onClose}>Done</Button>
        </>
      )}
    </Modal>
  );
}
