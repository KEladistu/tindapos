import { useT } from '../../i18n';
import { DEFAULT_RIDERS } from '../../profiles/lpg/modules/delivery';

export interface DeliveryFields {
  forDelivery: boolean;
  customerName: string;
  phone: string;
  address: string;
  riderId: string;
}

interface Props {
  value: DeliveryFields;
  onChange: (v: DeliveryFields) => void;
}

export function DeliveryCaptureFields({ value, onChange }: Props) {
  const t = useT();
  const set = <K extends keyof DeliveryFields>(k: K, v: DeliveryFields[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200">
        <input
          type="checkbox"
          checked={value.forDelivery}
          onChange={(e) => set('forDelivery', e.target.checked)}
        />
        <span className="font-medium">{t('lpg.forDelivery')}</span>
      </label>
      {value.forDelivery && (
        <div className="space-y-2 pl-2 border-l-2 border-amber-400">
          <input
            className="w-full min-h-[44px] px-3 rounded-lg border-2 border-slate-200"
            placeholder={t('lpg.customerName')}
            value={value.customerName}
            onChange={(e) => set('customerName', e.target.value)}
          />
          <input
            className="w-full min-h-[44px] px-3 rounded-lg border-2 border-slate-200"
            placeholder={t('lpg.phone')}
            value={value.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
          <textarea
            className="w-full min-h-[64px] px-3 py-2 rounded-lg border-2 border-slate-200"
            placeholder={t('lpg.address')}
            value={value.address}
            onChange={(e) => set('address', e.target.value)}
          />
          <label className="block text-sm">
            <div className="text-slate-600 mb-1">{t('lpg.assignedRider')}</div>
            <select
              className="w-full min-h-[44px] px-3 rounded-lg border-2 border-slate-200"
              value={value.riderId}
              onChange={(e) => set('riderId', e.target.value)}
            >
              {DEFAULT_RIDERS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
