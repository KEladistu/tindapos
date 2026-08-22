import type { Centavos } from '../../../engine/money';

/**
 * Utang (store credit) module — Phase 1 stub.
 *
 * The interface below is the shape the future checkout will call. For now
 * these functions are stubs; wiring will land alongside the customer picker
 * and the utang ledger UI in a later phase.
 */

export interface UtangChargeInput {
  customerId: string;
  saleId: string;
  amountCentavos: Centavos;
  ts: number;
}

export interface UtangPaymentInput {
  customerId: string;
  amountCentavos: Centavos;
  ts: number;
}

export interface UtangModule {
  charge(input: UtangChargeInput): Promise<void>;
  pay(input: UtangPaymentInput): Promise<void>;
  balance(customerId: string): Promise<Centavos>;
}

export const utangModule: UtangModule = {
  async charge() {
    throw new Error('utang.charge: not implemented in Phase 1');
  },
  async pay() {
    throw new Error('utang.pay: not implemented in Phase 1');
  },
  async balance() {
    return 0;
  }
};
