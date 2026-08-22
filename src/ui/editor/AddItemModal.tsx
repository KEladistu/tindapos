import { useState } from 'react';
import { useT } from '../../i18n';
import { toCentavos } from '../../engine/money';
import { EmojiPicker } from './EmojiPicker';

interface Props {
  open: boolean;
  categoryName: string;
  onClose: () => void;
  onCreate: (data: { name: string; priceCentavos: number; icon?: string }) => void;
}

export function AddItemModal({ open, categoryName, onClose, onCreate }: Props) {
  const t = useT();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!open) return null;

  const reset = () => { setName(''); setPrice(''); setIcon(undefined); setPickerOpen(false); };
  const close = () => { reset(); onClose(); };
  const submit = () => {
    const n = name.trim();
    const p = parseFloat(price);
    if (!n || isNaN(p) || p < 0) return;
    onCreate({ name: n, priceCentavos: toCentavos(p), icon });
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={close}>
      <div className="bg-white rounded-xl w-full max-w-sm p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-bold text-slate-800 mb-2">{t('editor.addItem')}</div>
        <div className="text-xs text-slate-500 mb-3">{categoryName}</div>
        <label className="block text-xs text-slate-600 mb-1">{t('editor.name')}</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-slate-300 rounded px-2 py-2 mb-3"
          placeholder={t('editor.name')}
        />
        <label className="block text-xs text-slate-600 mb-1">{t('editor.price')}</label>
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="decimal"
          className="w-full border border-slate-300 rounded px-2 py-2 mb-3"
          placeholder="0.00"
        />
        <label className="block text-xs text-slate-600 mb-1">{t('editor.chooseIcon')}</label>
        <div className="relative mb-4">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="border border-slate-300 rounded px-3 py-2 text-2xl"
          >
            {icon ?? '📦'}
          </button>
          {pickerOpen && (
            <EmojiPicker value={icon} onPick={setIcon} onClose={() => setPickerOpen(false)} />
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost px-3 py-2" onClick={close}>{t('editor.cancel')}</button>
          <button className="btn-primary px-3 py-2" onClick={submit}>{t('editor.save')}</button>
        </div>
      </div>
    </div>
  );
}
