import { jsx as _jsx } from "react/jsx-runtime";
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
export function NumericPad({ value, onChange }) {
    function press(k) {
        if (k === '⌫')
            return onChange(value.slice(0, -1));
        if (k === '.' && value.includes('.'))
            return;
        onChange(value + k);
    }
    return (_jsx("div", { className: "grid grid-cols-3 gap-2", children: KEYS.map((k) => (_jsx("button", { onClick: () => press(k), className: "btn-secondary text-xl h-14", type: "button", children: k }, k))) }));
}
