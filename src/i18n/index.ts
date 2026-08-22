import en from './en';
import tl from './tl';
import { useSettings } from '../stores/settings';

const dicts = { en, tl };

export function t(key: string): string {
  const lang = useSettings.getState().language;
  return dicts[lang][key] ?? dicts.en[key] ?? key;
}

/** Hook version — subscribes the caller to language changes. */
export function useT() {
  const lang = useSettings((s) => s.language);
  return (key: string) => dicts[lang][key] ?? dicts.en[key] ?? key;
}
