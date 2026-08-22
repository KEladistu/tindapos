import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useCatalog } from '../../stores/catalog';
import { useCart } from '../../stores/cart';
import { formatPHP } from '../../engine/money';
import { useT } from '../../i18n';
export function TileGrid() {
    const t = useT();
    const items = useCatalog((s) => s.items);
    const categories = useCatalog((s) => s.categories);
    const add = useCart((s) => s.add);
    const [catId, setCatId] = useState('all');
    const filtered = useMemo(() => (catId === 'all' ? items : items.filter((i) => i.categoryId === catId)), [items, catId]);
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsxs("div", { className: "flex gap-2 overflow-x-auto p-2 bg-white border-b border-slate-200", children: [_jsx("button", { onClick: () => setCatId('all'), className: `btn min-h-[40px] px-3 text-sm ${catId === 'all' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`, children: t('cat.all') }), categories.map((c) => (_jsx("button", { onClick: () => setCatId(c.id), className: `btn min-h-[40px] px-3 text-sm whitespace-nowrap ${catId === c.id ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`, children: c.name }, c.id)))] }), _jsx("div", { className: "flex-1 overflow-y-auto p-2", children: filtered.length === 0 ? (_jsx("div", { className: "text-center text-slate-500 py-8", children: t('pos.emptyCatalog') })) : (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2", children: filtered.map((it) => (_jsxs("button", { onClick: () => add({ itemId: it.id, name: it.name, unitPriceC: it.priceCentavos, icon: it.icon }), className: "bg-white rounded-xl border-2 border-slate-200 p-2 min-h-[96px] flex flex-col items-center justify-center gap-1 hover:border-amber-400 active:bg-amber-50", children: [_jsx("div", { className: "text-3xl", children: it.icon ?? '📦' }), _jsx("div", { className: "text-xs font-medium text-slate-800 text-center leading-tight line-clamp-2", children: it.name }), _jsx("div", { className: "text-sm font-bold text-amber-600", children: formatPHP(it.priceCentavos) }), it.stock !== undefined && (_jsxs("div", { className: "text-[10px] text-slate-400", children: ["stk ", it.stock] }))] }, it.id))) })) })] }));
}
