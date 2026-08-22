export { formatPHP } from '../engine/money';

export function formatDateTime(ts: number, locale = 'en-PH'): string {
  return new Date(ts).toLocaleString(locale);
}
