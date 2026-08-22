import { useState } from 'react';
import { useRestaurant } from '../../stores/restaurant';
import { useT } from '../../i18n';
import { Button } from '../common/Button';
import type { TableRow } from '../../db/schema';

const COLS = 6;
const ROWS = 4;

interface Props {
  editing?: boolean;
  onPickTable?: (t: TableRow) => void;
}

function cellClass(status?: string) {
  switch (status) {
    case 'occupied': return 'bg-amber-500 text-white border-amber-600';
    case 'reserved': return 'bg-sky-500 text-white border-sky-600';
    case 'cleaning': return 'bg-slate-400 text-white border-slate-500';
    case 'available': return 'bg-emerald-500 text-white border-emerald-600';
    default: return 'bg-white text-slate-400 border-dashed border-slate-300';
  }
}

export function TableMap({ editing = false, onPickTable }: Props) {
  const t = useT();
  const tables = useRestaurant((s) => s.tables);
  const seed = useRestaurant((s) => s.seedSampleTables);
  const upsertTable = useRestaurant((s) => s.upsertTable);
  const removeTable = useRestaurant((s) => s.removeTable);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  function tableAt(x: number, y: number): TableRow | undefined {
    return tables.find((t) => t.mapX === x && t.mapY === y);
  }

  function onCellClick(x: number, y: number) {
    const existing = tableAt(x, y);
    if (editing) {
      if (!existing) {
        const id = `tbl-${Date.now().toString(36)}`;
        const name = `T${tables.length + 1}`;
        void upsertTable({ id, name, mapX: x, mapY: y, status: 'available' });
      } else {
        setRenaming(existing.id);
        setRenameValue(existing.name ?? existing.id);
      }
    } else if (existing && onPickTable) {
      onPickTable(existing);
    }
  }

  if (tables.length === 0 && !editing) {
    return (
      <div className="p-6 text-center space-y-3">
        <div className="text-slate-500">{t('restaurant.noTables')}</div>
        <Button onClick={() => void seed()}>{t('restaurant.seedSampleTables')}</Button>
      </div>
    );
  }

  return (
    <div className="p-3">
      {editing && (
        <div className="mb-2 text-xs text-slate-500">{t('restaurant.tapCellToAdd')}</div>
      )}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: ROWS * COLS }).map((_, i) => {
          const x = i % COLS;
          const y = Math.floor(i / COLS);
          const tbl = tableAt(x, y);
          return (
            <button
              key={i}
              onClick={() => onCellClick(x, y)}
              className={`min-h-[64px] rounded-lg border-2 flex flex-col items-center justify-center text-sm font-bold ${cellClass(tbl?.status)}`}
            >
              {tbl ? (
                <>
                  <div>{tbl.name ?? tbl.id}</div>
                  <div className="text-[10px] uppercase opacity-80 font-normal">{tbl.status}</div>
                </>
              ) : editing ? '+' : ''}
            </button>
          );
        })}
      </div>
      {renaming && (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="text-sm font-semibold">{t('restaurant.renameTable')}</div>
          <input
            className="w-full min-h-[40px] px-3 rounded-lg border-2 border-slate-200"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => { void removeTable(renaming); setRenaming(null); }}
            >{t('editor.delete')}</Button>
            <Button
              onClick={() => {
                const cur = tables.find((t) => t.id === renaming);
                if (cur) void upsertTable({ ...cur, name: renameValue.trim() || cur.name });
                setRenaming(null);
              }}
            >{t('editor.save')}</Button>
            <Button variant="ghost" onClick={() => setRenaming(null)}>{t('pos.cancel')}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
