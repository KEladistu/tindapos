import type { SaleRow, SaleLineRow, DiscountRow } from '../db/schema';
import { formatPHP } from './money';

export interface StoreInfo {
  name: string;
  address?: string;
  contact?: string;
  tin?: string;
  footer?: string;
  vatEnabled?: boolean;
  provisionalLabel?: string;
}

export interface ReceiptData {
  store: StoreInfo;
  sale: SaleRow;
  lines: SaleLineRow[];
  discounts?: DiscountRow[];
  tenderedC?: number;
  changeC?: number;
  qNumber?: number;
  tableName?: string;
  cashierName?: string;
}

const W = 32;

function pad(left: string, right: string, w = W): string {
  const gap = Math.max(1, w - left.length - right.length);
  return left + ' '.repeat(gap) + right;
}

function center(s: string, w = W): string {
  const p = Math.max(0, Math.floor((w - s.length) / 2));
  return ' '.repeat(p) + s;
}

export function renderReceiptText(r: ReceiptData): string {
  const rows: string[] = [];
  const label = r.store.provisionalLabel ?? 'PROVISIONAL RECEIPT — NOT FOR BIR';
  rows.push(center(label));
  rows.push('');
  rows.push(center(r.store.name || 'Store'));
  if (r.store.address) rows.push(center(r.store.address));
  if (r.store.contact) rows.push(center(r.store.contact));
  if (r.store.tin) rows.push(center('TIN: ' + r.store.tin));
  rows.push('-'.repeat(W));
  rows.push(new Date(r.sale.ts).toLocaleString('en-PH'));
  rows.push('ID: ' + r.sale.id.slice(-8));
  if (r.cashierName) rows.push('Cashier: ' + r.cashierName);
  if (r.tableName) rows.push('Table: ' + r.tableName);
  if (r.qNumber != null) rows.push('Q#: ' + r.qNumber);
  rows.push('-'.repeat(W));
  for (const l of r.lines) {
    rows.push(l.name);
    rows.push(pad('  ' + l.qty + ' x ' + formatPHP(l.unitPriceCentavos), formatPHP(l.lineTotalCentavos)));
    if (l.notes) rows.push('  * ' + l.notes);
  }
  rows.push('-'.repeat(W));
  const subtotal = r.lines.reduce((a, l) => a + l.lineTotalCentavos, 0);
  const discTotal = (r.discounts ?? []).reduce((a, d) => a + d.amountCentavos, 0);
  rows.push(pad('SUBTOTAL', formatPHP(subtotal)));
  for (const d of (r.discounts ?? [])) {
    const label = d.type === 'senior' ? 'SENIOR' : d.type === 'pwd' ? 'PWD' : 'DISCOUNT';
    rows.push(pad(label + (d.idNumber ? ' ' + d.idNumber : ''), '-' + formatPHP(d.amountCentavos)));
    if (d.name) rows.push('  ' + d.name);
  }
  if (r.store.vatEnabled) {
    const net = subtotal - discTotal;
    const vatable = Math.round(net / 1.12);
    const vat = net - vatable;
    rows.push(pad('VATable', formatPHP(vatable)));
    rows.push(pad('VAT 12%', formatPHP(vat)));
  }
  rows.push(pad('TOTAL', formatPHP(r.sale.totalCentavos)));
  if (r.tenderedC != null) rows.push(pad('CASH', formatPHP(r.tenderedC)));
  if (r.changeC != null) rows.push(pad('CHANGE', formatPHP(r.changeC)));
  rows.push('-'.repeat(W));
  if (r.store.footer) {
    for (const line of r.store.footer.split('\n')) rows.push(center(line));
  }
  rows.push(center('Salamat po!'));
  rows.push('');
  return rows.join('\n');
}
