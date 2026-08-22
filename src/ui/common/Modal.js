import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Modal({ open, onClose, title, children }) {
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4", children: _jsxs("div", { className: "bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[95vh]", children: [title && (_jsxs("div", { className: "px-4 py-3 border-b border-slate-200 flex items-center", children: [_jsx("div", { className: "font-semibold text-lg", children: title }), _jsx("button", { className: "ml-auto btn-ghost min-h-[36px] px-3", onClick: onClose, "aria-label": "Close", children: "\u2715" })] })), _jsx("div", { className: "p-4 overflow-y-auto", children: children })] }) }));
}
