import { describe, it, expect } from 'vitest';
import { computeSeniorPwdDiscount } from '../src/engine/discounts';

describe('senior/PWD discount', () => {
  it('₱112 gross -> ₱100 vatExempt, ₱20 discount, ₱80 net', () => {
    const r = computeSeniorPwdDiscount(11200);
    expect(r.vatExemptC).toBe(10000);
    expect(r.discountC).toBe(2000);
    expect(r.netC).toBe(8000);
  });

  it('accepts custom vat rate', () => {
    // 0% VAT: gross == vatExempt
    const r = computeSeniorPwdDiscount(10000, { vatRate: 0 });
    expect(r.vatExemptC).toBe(10000);
    expect(r.discountC).toBe(2000);
    expect(r.netC).toBe(8000);
  });

  it('handles zero', () => {
    const r = computeSeniorPwdDiscount(0);
    expect(r.vatExemptC).toBe(0);
    expect(r.discountC).toBe(0);
    expect(r.netC).toBe(0);
  });
});
