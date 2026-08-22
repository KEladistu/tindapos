import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCart } from '../../stores/cart';
import { formatPHP } from '../../engine/money';
import { lineTotal } from '../../engine/cart';
import { useT } from '../../i18n';
import { Button } from '../common/Button';
export function CartPane({ onCheckout }) {
    const t = useT();
    const lines = useCart((s) => s.lines);
    const setQty = useCart((s) => s.setQty);
    const remove = useCart((s) => s.remove);
    const clear = useCart((s) => s.clear);
    const total = useCart((s) => s.totalC());
    return (_jsxs("div", { className: "flex flex-col h-full bg-white border-l border-slate-200", children: [_jsxs("div", { className: "px-4 py-3 border-b border-slate-200 flex items-center", children: [_jsx("div", { className: "font-semibold", children: t('pos.cart') }), lines.length > 0 && (_jsx("button", { onClick: clear, className: "ml-auto text-sm text-slate-500 hover:text-red-600", children: t('pos.clear') }))] }), _jsx("div", { className: "flex-1 overflow-y-auto", children: lines.length === 0 ? (_jsx("div", { className: "p-4 text-center text-slate-500 text-sm", children: t('pos.empty') })) : (_jsx("ul", { className: "divide-y divide-slate-100", children: lines.map((l) => (_jsxs("li", { className: "p-3 flex items-center gap-2", children: [_jsx("div", { className: "text-2xl", children: l.icon ?? '📦' }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm font-medium truncate", children: l.name }), _jsx("div", { className: "text-xs text-slate-500", children: formatPHP(l.unitPriceC) })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => setQty(l.itemId, l.qty - 1), className: "w-8 h-8 rounded bg-slate-100 font-bold", children: "\u2212" }), _jsx("div", { className: "w-8 text-center font-semibold", children: l.qty }), _jsx("button", { onClick: () => setQty(l.itemId, l.qty + 1), className: "w-8 h-8 rounded bg-slate-100 font-bold", children: "+" })] }), _jsx("div", { className: "w-20 text-right text-sm font-bold", children: formatPHP(lineTotal(l)) }), _jsx("button", { onClick: () => remove(l.itemId), className: "text-slate-400 hover:text-red-600 text-lg", "aria-label": t('pos.remove'), children: "\u2715" })] }, l.itemId))) })) }), _jsxs("div", { className: "p-4 border-t border-slate-200 space-y-3", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "text-slate-600", children: t('pos.total') }), _jsx("div", { className: "ml-auto text-2xl font-bold text-amber-600", children: formatPHP(total) })] }), _jsx(Button, { className: "w-full", disabled: lines.length === 0, onClick: onCheckout, children: t('pos.checkout') })] })] }));
}
