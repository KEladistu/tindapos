import { describe, it, expect } from 'vitest';
import { splitEvenly, splitByItem, type SplitLine } from '../src/profiles/restaurant/modules/split';

describe('restaurant split.evenly', () => {
  it('splits ₱100 by 4 -> [2500,2500,2500,2500]', () => {
    expect(splitEvenly(10000, 4)).toEqual([2500, 2500, 2500, 2500]);
  });
  it('handles centavo remainder', () => {
    // ₱10.03 among 3 people -> [335, 334, 334] -> sums to 1003
    const s = splitEvenly(1003, 3);
    expect(s).toEqual([335, 334, 334]);
    expect(s.reduce((a, b) => a + b, 0)).toBe(1003);
  });
  it('splits 1c among 3', () => {
    const s = splitEvenly(1, 3);
    expect(s).toEqual([1, 0, 0]);
    expect(s.reduce((a, b) => a + b, 0)).toBe(1);
  });
  it('throws on 0 people', () => {
    expect(() => splitEvenly(100, 0)).toThrow();
  });
});

describe('restaurant split.byItem', () => {
  const lines: SplitLine[] = [
    { id: 'l1', name: 'Adobo', lineTotalCentavos: 9500 },
    { id: 'l2', name: 'Rice',  lineTotalCentavos: 1500 },
    { id: 'l3', name: 'Coke',  lineTotalCentavos: 9500 }
  ];
  it('assigns lines per-person', () => {
    const r = splitByItem(lines, 2, { l1: 0, l2: 0, l3: 1 });
    expect(r.perPerson[0].totalC).toBe(11000);
    expect(r.perPerson[1].totalC).toBe(9500);
    expect(r.perPerson[0].lines.map((l) => l.id)).toEqual(['l1', 'l2']);
  });
  it('unassigned lines default to person 0', () => {
    const r = splitByItem(lines, 2, {});
    expect(r.perPerson[0].totalC).toBe(9500 + 1500 + 9500);
    expect(r.perPerson[1].totalC).toBe(0);
  });
  it('supports up to 4 tabs', () => {
    const r = splitByItem(lines, 4, { l1: 0, l2: 1, l3: 3 });
    expect(r.perPerson).toHaveLength(4);
    expect(r.perPerson[2].totalC).toBe(0);
    expect(r.perPerson[3].totalC).toBe(9500);
  });
});
