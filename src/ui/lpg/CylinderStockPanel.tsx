import { useCylinders } from '../../stores/cylinders';
import { useT } from '../../i18n';

export function CylinderStockPanel() {
  const t = useT();
  const rows = useCylinders((s) => s.rows);

  const skus = Array.from(new Set(rows.map((r) => r.sku))).sort();

  return (
    <div className="p-3 space-y-3">
      <div className="font-semibold text-slate-800">{t('lpg.stockAtAGlance')}</div>
      <div className="flex items-center gap-3 text-xs text-slate-600">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />{t('lpg.full')}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />{t('lpg.empty')}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />{t('lpg.onLoan')}</span>
      </div>
      <div className="space-y-1">
        {skus.length === 0 && <div className="text-slate-500 text-sm">—</div>}
        {skus.map((sku) => {
          const r = rows.filter((c) => c.sku === sku);
          const full = r.filter((c) => c.state === 'full').length;
          const empty = r.filter((c) => c.state === 'empty').length;
          const loan = r.filter((c) => c.state === 'on-loan').length;
          return (
            <div key={sku} className="flex items-center gap-2 py-1 text-sm border-b border-slate-100">
              <div className="font-mono text-xs text-slate-500 w-24 truncate">{sku}</div>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /><b>{full}</b></span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /><b>{empty}</b></span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /><b>{loan}</b></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
