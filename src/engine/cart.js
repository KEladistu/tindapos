import { addC, mulC } from './money';
export function addItem(lines, line, qty = 1) {
    const existing = lines.find((l) => l.itemId === line.itemId);
    if (existing) {
        return lines.map((l) => (l.itemId === line.itemId ? { ...l, qty: l.qty + qty } : l));
    }
    return [...lines, { ...line, qty }];
}
export function setQty(lines, itemId, qty) {
    if (qty <= 0)
        return removeItem(lines, itemId);
    return lines.map((l) => (l.itemId === itemId ? { ...l, qty } : l));
}
export function removeItem(lines, itemId) {
    return lines.filter((l) => l.itemId !== itemId);
}
export function lineTotal(line) {
    return mulC(line.unitPriceC, line.qty);
}
export function cartTotal(lines) {
    return addC(...lines.map(lineTotal));
}
export function cartCount(lines) {
    return lines.reduce((a, l) => a + l.qty, 0);
}
