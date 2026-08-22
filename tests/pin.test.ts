import { describe, it, expect } from 'vitest';
import { hashPin, verifyPin, randomSalt } from '../src/engine/pin';

describe('pin', () => {
  it('reproduces the same hash for same input', async () => {
    const salt = randomSalt();
    const a = await hashPin('1234', salt);
    const b = await hashPin('1234', salt);
    expect(a).toBe(b);
  });
  it('verifies correct pin', async () => {
    const salt = randomSalt();
    const h = await hashPin('1234', salt);
    expect(await verifyPin('1234', h, salt)).toBe(true);
    expect(await verifyPin('0000', h, salt)).toBe(false);
  });
  it('salt uniqueness', () => {
    const s = new Set(Array.from({ length: 20 }, () => randomSalt()));
    expect(s.size).toBe(20);
  });
});
