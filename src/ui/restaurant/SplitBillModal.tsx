import { useMemo, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useT } from '../../i18n';
import { formatPHP } from '../../engine/money';
import { splitByItem, splitEvenly } from '../../profiles/restaurant/modules/split';
import type { RestaurantLine } from '../../stores/restaurant';

interface Props {
  open: boolean;
  onClose: () => void;
  lines: RestaurantLine[];
  onConfirmEven: (shares: number[]) => void;
  onConfirmByItem: (buckets: { personIndex: number; lines: RestaurantLine[]; totalC: number }[]) => void;
}

type Mode = 'even' | 'byItem';

export function SplitBillModal({ open, onClose, lines, onConfirmEven, onConfirmByItem }: Props) {
  const t = useT();
  const [mode, setMode] = useState<Mode>('even');
  const [people, setPeople] = useState(2);
  const [assignment, setAssignment] = useState<Record<string, number>>({});

  const total = useMemo(() => lines.reduce((s, l) => s + l.unitPriceCentavos * l.qty, 0), [lines]);
  const evenShares = useMemo(() => splitEvenly(total, Math.max(1, people)), [total, people]);

  const byItem = useMemo(() => {
    const flat = lines.map((l) => ({
      id: l.id,
      name: l.name,
      lineTotalCentavos: l.unitPriceCentavos * l.qty
    }));
    return splitByItem(flat, Math.max(1, people), assignment);
  }, [lines, people, assignment]);

  function bump(p: number) {
    setPeople((n) => Math.max(1, Math.min(4, n + p)));
  }

  return (
    <Modal open={open} onClose={onClose} title={t('restaurant.split')}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            className={`flex-1 min-h-[40px] rounded-lg text-sm font-medium ${mode === 'even' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
            onClick={() => setMode('even')}
          >{t('restaurant.splitEvenly')}</button>
          <button
            className={`flex-1 min-h-[40px] rounded-lg text-sm font-medium ${mode === 'byItem' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
            onClick={() => setMode('byItem')}
          >{t('restaurant.splitByItem')}</button>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm">{t('restaurant.people')}:</div>
          <button className="min-h-[36px] px-3 rounded bg-slate-100" onClick={() => bump(-1)}>−</button>
          <div className="min-w-[24px] text-center font-bold">{people}</div>
          <button className="min-h-[36px] px-3 rounded bg-slate-100" onClick={() => bump(1)}>+</button>
          <div className="ml-auto text-sm text-slate-600">{t('pos.total')}: <span className="font-bold text-amber-600">{formatPHP(total)}</span></div>
        </div>
        {mode === 'even' ? (
          <div className="space-y-1">
            {evenShares.map((s, i) => (
              <div key={i} className="flex items-center p-2 border border-slate-200 rounded-lg">
                <div className="text-sm">{t('restaurant.person')} {i + 1}</div>
                <div className="ml-auto font-bold text-amber-600">{formatPHP(s)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {lines.map((l) => (
              <div key={l.id} className="border border-slate-200 rounded-lg p-2">
                <div className="flex items-center">
                  <div className="text-sm font-medium">{l.name}</div>
                  <div className="ml-auto text-sm text-slate-600">{formatPHP(l.unitPriceCentavos * l.qty)}</div>
                </div>
                <div className="flex gap-1 mt-1">
                  {Array.from({ length: people }).map((_, i) => {
                    const active = (assignment[l.id] ?? 0) === i;
                    return (
                      <button
                        key={i}
                        onClick={() => setAssignment({ ...assignment, [l.id]: i })}
                        className={`flex-1 min-h-[32px] text-xs rounded ${active ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
                      >P{i + 1}</button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-200 space-y-1">
              {byItem.perPerson.map((b) => (
                <div key={b.personIndex} className="flex items-center">
                  <div className="text-sm">{t('restaurant.person')} {b.personIndex + 1}</div>
                  <div className="ml-auto font-bold text-amber-600">{formatPHP(b.totalC)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>{t('pos.cancel')}</Button>
          <Button
            className="flex-1"
            onClick={() => {
              if (mode === 'even') onConfirmEven(evenShares);
              else {
                // Reattach original RestaurantLine objects to buckets
                const withOriginal = byItem.perPerson.map((b) => ({
                  personIndex: b.personIndex,
                  totalC: b.totalC,
                  lines: lines.filter((l) => (assignment[l.id] ?? 0) === b.personIndex)
                }));
                onConfirmByItem(withOriginal);
              }
            }}
          >{t('restaurant.confirmSplit')}</Button>
        </div>
      </div>
    </Modal>
  );
}
