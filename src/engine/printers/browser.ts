import type { ReceiptData } from '../receipt-render';
import { renderReceiptText } from '../receipt-render';

export interface ReceiptOutput {
  name: string;
  available(): boolean | Promise<boolean>;
  print(r: ReceiptData): Promise<void>;
}

export const browserPrinter: ReceiptOutput = {
  name: 'Browser Print',
  available() { return typeof window !== 'undefined'; },
  async print(r) {
    const text = renderReceiptText(r);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Receipt</title>
      <style>
        @page { size: 58mm auto; margin: 2mm; }
        body { font-family: monospace; font-size: 10pt; white-space: pre; margin: 0; }
      </style>
    </head><body></body></html>`);
    doc.close();
    doc.body.textContent = text;
    await new Promise((r) => setTimeout(r, 100));
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    setTimeout(() => { document.body.removeChild(iframe); }, 1000);
  }
};
