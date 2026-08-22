import type { Centavos } from './money';

/**
 * Senior Citizen / PWD discount per Philippine BIR rules.
 *
 * Republic Act No. 9994 (Expanded Senior Citizens Act) and RA 10754 (PWD),
 * together with BIR RR 7-2010 / RR 5-2017, provide:
 *
 *   1. The qualified person is EXEMPT from the 12% VAT on their share of the sale.
 *   2. On top of the VAT exemption, they receive a 20% discount on the
 *      net (VAT-exempt) selling price.
 *
 * Given a gross amount that INCLUDES the 12% VAT for the qualified person's share:
 *
 *   vatExempt = gross / 1.12          (strip out the VAT)
 *   discount  = vatExempt * 0.20      (20% senior/PWD discount)
 *   net       = vatExempt - discount  (what the customer actually pays)
 *
 * All arithmetic here is performed in integer centavos: we multiply first,
 * divide last, and round half-up to avoid float drift.
 *
 * Example: gross ₱112.00 (11200c) ->
 *   vatExempt = 11200 * 100 / 112 = 10000c (₱100.00)
 *   discount  = 10000 * 20 / 100  =  2000c (₱ 20.00)
 *   net       = 10000 - 2000      =  8000c (₱ 80.00)
 */

export interface SeniorPwdResult {
  vatExemptC: Centavos;
  discountC: Centavos;
  netC: Centavos;
}

export interface SeniorPwdOptions {
  /** VAT rate as a decimal (default 0.12 for the Philippines). */
  vatRate?: number;
}

/** Round half-up integer division of a * num / den. */
function mulDivRound(a: number, num: number, den: number): number {
  return Math.round((a * num) / den);
}

export function computeSeniorPwdDiscount(
  grossCentavos: Centavos,
  opts: SeniorPwdOptions = {}
): SeniorPwdResult {
  const vatRate = opts.vatRate ?? 0.12;
  // vatExempt = gross / (1 + vatRate). Using integer math:
  //   gross * 100 / (100 + vatRate*100). For 12% -> gross * 100 / 112.
  const vatDen = Math.round((1 + vatRate) * 100); // e.g. 112
  const vatExemptC = mulDivRound(grossCentavos, 100, vatDen);
  const discountC = mulDivRound(vatExemptC, 20, 100);
  const netC = vatExemptC - discountC;
  return { vatExemptC, discountC, netC };
}
