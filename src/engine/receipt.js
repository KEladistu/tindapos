import { cartTotal, lineTotal } from './cart';
import { formatPHP } from './money';
/** Very simple text-render of a receipt — actual printer output is a later phase. */
export function renderReceiptText(input) {
    const { lines, tenderedC, changeC, ts, def, storeName } = input;
    const rows = [];
    rows.push(storeName);
    rows.push(...def.header);
    rows.push(new Date(ts).toLocaleString('en-PH'));
    rows.push('-'.repeat(32));
    for (const l of lines) {
        rows.push(`${l.qty} x ${l.name}`);
        rows.push(`    ${formatPHP(lineTotal(l))}`);
    }
    rows.push('-'.repeat(32));
    rows.push(`TOTAL     ${formatPHP(cartTotal(lines))}`);
    rows.push(`CASH      ${formatPHP(tenderedC)}`);
    rows.push(`CHANGE    ${formatPHP(changeC)}`);
    rows.push('-'.repeat(32));
    rows.push(def.provisionalLabel);
    rows.push(...def.footer);
    return rows.join('\n');
}
