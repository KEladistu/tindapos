import { describe, it, expect } from 'vitest';
import { computeSeniorPwdDiscount } from '../src/engine/discounts';
import { splitByItem, type SplitLine } from '../src/profiles/restaurant/modules/split';

describe('senior/PWD applied to multi-line restaurant order', () => {
  const lines: SplitLine[] = [
    { id: 'l1', name: 'Adobo',        lineTotalCentavos: 9500 },
    { id: 'l2', name: 'Rice',         lineTotalCentavos: 1500 },
    { id: 'l3', name: 'Sinigang',     lineTotalCentavos: 11000 },
    { id: 'l4', name: 'Rice',         lineTotalCentavos: 1500 },
    { id: 'l5', name: 'Coke 1.5L',    lineTotalCentavos: 9500 }
  ];

  it('applies to the whole-bill gross', () => {
    const gross = lines.reduce((a, l) => a + l.lineTotalCentavos, 0); // 33000c
    const r = computeSeniorPwdDiscount(gross);
    // VAT-exempt base = 33000 * 100 / 112 = round(29464.28..) = 29464
    expect(r.vatExemptC).toBe(29464);
    // 20% off = round(29464 * 0.20) = 5893
    expect(r.discountC).toBe(5893);
    expect(r.netC).toBe(29464 - 5893);
  });

  it("in split-by-item, discount is scoped to a single person's subset", () => {
    // Senior = person 0 (Adobo + Rice), person 1 = the rest
    const split = splitByItem(lines, 2, { l1: 0, l2: 0, l3: 1, l4: 1, l5: 1 });
    const seniorGross = split.perPerson[0].totalC; // 11000
    const otherGross = split.perPerson[1].totalC;  // 22000
    const senior = computeSeniorPwdDiscount(seniorGross);
    // vatExempt = 11000 * 100 / 112 = 9821 (round)
    expect(senior.vatExemptC).toBe(9821);
    // discount = round(9821 * 0.20) = 1964
    expect(senior.discountC).toBe(1964);
    // Other person pays their gross unmodified
    expect(otherGross).toBe(22000);
  });
});
