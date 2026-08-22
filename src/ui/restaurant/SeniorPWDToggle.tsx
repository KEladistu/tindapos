import { useT } from '../../i18n';
import { formatPHP } from '../../engine/money';
import { computeSeniorPwdDiscount } from '../../engine/discounts';

export interface SeniorPWDState {
  enabled: boolean;
  type: 'senior' | 'pwd';
  name: string;
  idNumber: string;
}

interface Props {
  state: SeniorPWDState;
  onChange: (s: SeniorPWDState) => void;
  grossCentavos: number;
}

export function SeniorPWDToggle({ state, onChange, grossCentavos }: Props) {
  const t = useT();
  const preview = state.enabled ? computeSeniorPwdDiscount(grossCentavos) : null;
  return (
    <div className="border border-slate-200 rounded-lg p-3 space-y-2">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={state.enabled}
          onChange={(e) => onChange({ ...state, enabled: e.target.checked })}
        />
        <span className="text-sm font-semibold">{t('restaurant.seniorPwd')}</span>
      </label>
      {state.enabled && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                checked={state.type === 'senior'}
                onChange={() => onChange({ ...state, type: 'senior' })}
              />
              {t('restaurant.senior')}
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                checked={state.type === 'pwd'}
                onChange={() => onChange({ ...state, type: 'pwd' })}
              />
              {t('restaurant.pwd')}
            </label>
          </div>
          <input
            className="w-full min-h-[40px] px-3 rounded-lg border-2 border-slate-200"
            placeholder={t('restaurant.name')}
            value={state.name}
            onChange={(e) => onChange({ ...state, name: e.target.value })}
          />
          <input
            className="w-full min-h-[40px] px-3 rounded-lg border-2 border-slate-200"
            placeholder={t('restaurant.idNumber')}
            value={state.idNumber}
            onChange={(e) => onChange({ ...state, idNumber: e.target.value })}
          />
          {preview && (
            <div className="text-xs text-slate-600 space-y-0.5">
              <div>{t('restaurant.vatExempt')}: {formatPHP(preview.vatExemptC)}</div>
              <div>{t('restaurant.discount')} (20%): −{formatPHP(preview.discountC)}</div>
              <div className="font-bold text-emerald-700">{t('restaurant.netDue')}: {formatPHP(preview.netC)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
