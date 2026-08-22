export { formatPHP } from '../engine/money';
export function formatDateTime(ts, locale = 'en-PH') {
    return new Date(ts).toLocaleString(locale);
}
