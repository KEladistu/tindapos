const phpFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
});
/** Convert a peso amount (possibly fractional) to centavos, rounding half-up.
 *  Uses string-based epsilon adjustment so 1.005 → 101 (not 100 from float error). */
export function toCentavos(pesos) {
    return Math.round((pesos * 100 * (1 + Number.EPSILON)));
}
/** Format centavos as e.g. "₱1,234.50". */
export function formatPHP(c) {
    return phpFormatter.format(c / 100);
}
/** Sum any number of centavo values. */
export function addC(...v) {
    let s = 0;
    for (const x of v)
        s += x;
    return s;
}
/** Multiply centavos by a quantity, rounding half-up. */
export function mulC(c, qty) {
    return Math.round(c * qty);
}
