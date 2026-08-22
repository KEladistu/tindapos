import { jsx as _jsx } from "react/jsx-runtime";
export function Button({ variant = 'primary', className = '', ...rest }) {
    const cls = variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : 'btn-ghost';
    return _jsx("button", { className: `${cls} ${className}`, ...rest });
}
