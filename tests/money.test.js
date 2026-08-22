import { describe, it, expect } from 'vitest';
import { addC, formatPHP, mulC, toCentavos } from '../src/engine/money';
describe('money', () => {
    it('toCentavos rounds half-up', () => {
        expect(toCentavos(1)).toBe(100);
        expect(toCentavos(1.005)).toBe(101);
        expect(toCentavos(0.1 + 0.2)).toBe(30);
    });
    it('addC sums integer centavos exactly', () => {
        expect(addC(100, 200, 300)).toBe(600);
        expect(addC()).toBe(0);
    });
    it('mulC multiplies and rounds', () => {
        expect(mulC(1500, 3)).toBe(4500);
        expect(mulC(333, 3)).toBe(999);
        expect(mulC(100, 2.5)).toBe(250);
    });
    it('formatPHP renders PHP currency', () => {
        const s = formatPHP(123450);
        expect(s).toMatch(/1,234\.50/);
        expect(s).toMatch(/₱|PHP/);
    });
});
