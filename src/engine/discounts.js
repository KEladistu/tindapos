/** Round half-up integer division of a * num / den. */
function mulDivRound(a, num, den) {
    return Math.round((a * num) / den);
}
export function computeSeniorPwdDiscount(grossCentavos, opts = {}) {
    const vatRate = opts.vatRate ?? 0.12;
    // vatExempt = gross / (1 + vatRate). Using integer math:
    //   gross * 100 / (100 + vatRate*100). For 12% -> gross * 100 / 112.
    const vatDen = Math.round((1 + vatRate) * 100); // e.g. 112
    const vatExemptC = mulDivRound(grossCentavos, 100, vatDen);
    const discountC = mulDivRound(vatExemptC, 20, 100);
    const netC = vatExemptC - discountC;
    return { vatExemptC, discountC, netC };
}
