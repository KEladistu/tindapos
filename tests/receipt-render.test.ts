import { describe, it, expect } from 'vitest';
import { renderReceiptText } from '../src/engine/receipt-render';

describe('receipt-render', () => {
  it('includes provisional label, store name, totals', () => {
    const text = renderReceiptText({
      store: { name: 'Aling Nena', provisionalLabel: 'PROVISIONAL RECEIPT — NOT FOR BIR' },
      sale: { id: 'abc12345', ts: Date.now(), userId: 'u', paymentMethod: 'cash', status: 'complete', totalCentavos: 5000, tenderedCentavos: 10000, changeCentavos: 5000 },
      lines: [{ id: 'l1', saleId: 'abc12345', itemId: 'a', name: 'Coke', unitPriceCentavos: 2500, qty: 2, lineTotalCentavos: 5000 }],
      tenderedC: 10000,
      changeC: 5000
    });
    expect(text).toContain('PROVISIONAL RECEIPT');
    expect(text).toContain('Aling Nena');
    expect(text).toContain('TOTAL');
    expect(text).toContain('CASH');
    expect(text).toContain('CHANGE');
    expect(text).toContain('Coke');
  });
});
