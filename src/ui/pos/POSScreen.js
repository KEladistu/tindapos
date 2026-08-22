import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { TileGrid } from './TileGrid';
import { CartPane } from './CartPane';
import { TenderModal } from './TenderModal';
import { useCatalog } from '../../stores/catalog';
import { useCart } from '../../stores/cart';
import { useT } from '../../i18n';
import { formatPHP } from '../../engine/money';
export function POSScreen() {
    const t = useT();
    const load = useCatalog((s) => s.load);
    const count = useCart((s) => s.count());
    const total = useCart((s) => s.totalC());
    const [tenderOpen, setTenderOpen] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    useEffect(() => { void load(); }, [load]);
    return (_jsxs("div", { className: "h-full grid grid-rows-[1fr] sm:grid-cols-[1fr_360px]", children: [_jsx("div", { className: "min-h-0 overflow-hidden", children: _jsx(TileGrid, {}) }), _jsx("div", { className: "hidden sm:block min-h-0", children: _jsx(CartPane, { onCheckout: () => setTenderOpen(true) }) }), _jsxs("div", { className: "sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 flex items-center gap-3 shadow-lg", children: [_jsxs("button", { onClick: () => setSheetOpen(true), className: "btn-secondary flex-1 justify-between px-3", children: [_jsxs("span", { children: [t('pos.cart'), " (", count, ")"] }), _jsx("span", { className: "font-bold text-amber-600", children: formatPHP(total) })] }), _jsx("button", { onClick: () => setTenderOpen(true), disabled: count === 0, className: "btn-primary px-4", children: t('pos.checkout') })] }), sheetOpen && (_jsx("div", { className: "sm:hidden fixed inset-0 z-30 bg-black/40 flex items-end", onClick: () => setSheetOpen(false), children: _jsxs("div", { className: "bg-white w-full max-h-[80vh] rounded-t-2xl flex flex-col", onClick: (e) => e.stopPropagation(), children: [_jsx(CartPane, { onCheckout: () => { setSheetOpen(false); setTenderOpen(true); } }), _jsx("button", { onClick: () => setSheetOpen(false), className: "btn-ghost m-2", children: t('pos.close') })] }) })), _jsx(TenderModal, { open: tenderOpen, onClose: () => setTenderOpen(false) })] }));
}
