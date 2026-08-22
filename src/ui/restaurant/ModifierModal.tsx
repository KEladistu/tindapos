import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatPHP } from '../../engine/money';
import { useT } from '../../i18n';
import type { ModifierGroup, ModifierOption, SelectedMod } from '../../profiles/restaurant/modifiers';

interface Props {
  open: boolean;
  onClose: () => void;
  itemName: string;
  basePriceCentavos: number;
  groups: ModifierGroup[];
  initialMods?: SelectedMod[];
  initialNote?: string;
  onConfirm: (mods: SelectedMod[], note: string, unitPriceC: number) => void;
}

export function ModifierModal({
  open, onClose, itemName, basePriceCentavos, groups,
  initialMods, initialNote, onConfirm
}: Props) {
  const t = useT();
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    const init: Record<string, Set<string>> = {};
    for (const g of groups) init[g.id] = new Set<string>();
    for (const m of initialMods ?? []) {
      init[m.groupId] = init[m.groupId] ?? new Set<string>();
      init[m.groupId].add(m.optionId);
    }
    setSelected(init);
    setNote(initialNote ?? '');
  }, [open, groups, initialMods, initialNote]);

  const flatMods: SelectedMod[] = useMemo(() => {
    const out: SelectedMod[] = [];
    for (const g of groups) {
      const chosen = selected[g.id] ?? new Set();
      for (const opt of g.options) {
        if (chosen.has(opt.id)) {
          out.push({
            groupId: g.id, groupName: g.name,
            optionId: opt.id, optionName: opt.name,
            priceDeltaCentavos: opt.priceDeltaCentavos
          });
        }
      }
    }
    return out;
  }, [groups, selected]);

  const delta = flatMods.reduce((s, m) => s + m.priceDeltaCentavos, 0);
  const unitPrice = basePriceCentavos + delta;

  function toggle(g: ModifierGroup, opt: ModifierOption) {
    const cur = new Set(selected[g.id] ?? []);
    if (g.select === 'single') {
      cur.clear();
      cur.add(opt.id);
    } else {
      if (cur.has(opt.id)) cur.delete(opt.id);
      else cur.add(opt.id);
    }
    setSelected({ ...selected, [g.id]: cur });
  }

  const requiredOk = groups.every((g) => !g.required || (selected[g.id]?.size ?? 0) > 0);

  return (
    <Modal open={open} onClose={onClose} title={itemName}>
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.id}>
            <div className="text-sm font-semibold text-slate-700 mb-1">
              {g.name}
              {g.required && <span className="text-red-500 ml-1">*</span>}
              <span className="ml-2 text-xs text-slate-400">
                {g.select === 'single' ? t('restaurant.pickOne') : t('restaurant.pickAny')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {g.options.map((opt) => {
                const active = selected[g.id]?.has(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggle(g, opt)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm min-h-[40px] ${
                      active ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {opt.name}
                    {opt.priceDeltaCentavos !== 0 && (
                      <span className="ml-1 text-xs text-slate-500">
                        ({opt.priceDeltaCentavos > 0 ? '+' : ''}{formatPHP(opt.priceDeltaCentavos)})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <label className="block">
          <div className="text-sm font-semibold text-slate-700 mb-1">{t('restaurant.note')}</div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('restaurant.notePh')}
            className="w-full min-h-[44px] px-3 rounded-lg border-2 border-slate-200 focus:border-amber-500 outline-none"
          />
        </label>
        <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
          <div className="text-slate-600 text-sm">{t('restaurant.unitPrice')}</div>
          <div className="text-lg font-bold text-amber-600">{formatPHP(unitPrice)}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>{t('pos.cancel')}</Button>
          <Button className="flex-1" disabled={!requiredOk} onClick={() => onConfirm(flatMods, note.trim(), unitPrice)}>
            {t('restaurant.addToOrder')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
