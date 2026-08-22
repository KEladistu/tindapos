import { useState } from 'react';
import type { TindaDB } from '../../db/schema';
import { profileRegistry } from '../../profiles/registry';
import { useSettings, type ProfileId } from '../../stores/settings';
import { useT } from '../../i18n';
import { Button } from '../common/Button';
import { seedCylinders } from '../../profiles/lpg/seed';

interface Props { db: TindaDB; }

export function OnboardingFlow({ db }: Props) {
  const t = useT();
  const { setStore, language } = useSettings();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profileId, setProfileId] = useState<ProfileId | null>(null);
  const [storeName, setStoreName] = useState('');
  const [seed, setSeed] = useState(true);
  const [busy, setBusy] = useState(false);

  async function finish() {
    if (!profileId || !storeName.trim()) return;
    setBusy(true);
    const entry = profileRegistry[profileId];
    // Seed categories
    await db.categories.bulkPut(
      entry.profile.defaultCategories.map((c) => ({
        id: c.id,
        name: c.name[language] ?? c.name.en,
        order: c.order
      }))
    );
    if (seed) {
      await db.items.bulkPut(
        entry.profile.seedCatalog.map((it, i) => ({
          id: `seed-${i}-${it.name.replace(/\W+/g, '-').toLowerCase()}`,
          categoryId: it.categoryId,
          name: it.name,
          priceCentavos: it.priceCentavos,
          stock: it.stock ?? 0,
          icon: it.icon,
          order: i,
          archived: 0 as const,
          extras: it.extras
        }))
      );
    }
    if (profileId === 'lpg') {
      await db.cylinders.bulkPut(seedCylinders());
    }
    await setStore(storeName.trim(), profileId);
    setBusy(false);
  }

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">{t('onboarding.title')}</h1>

      {step === 1 && (
        <div className="space-y-3">
          <div className="font-semibold">{t('onboarding.pickProfile')}</div>
          {(Object.keys(profileRegistry) as ProfileId[]).map((id) => {
            const entry = profileRegistry[id];
            const active = profileId === id;
            return (
              <button
                key={id}
                disabled={!entry.available}
                onClick={() => setProfileId(id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition min-h-[64px] ${
                  active ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white'
                } ${!entry.available ? 'opacity-50 cursor-not-allowed' : 'hover:border-amber-300'}`}
              >
                <div className="font-semibold">{entry.profile.name[language]}</div>
                {!entry.available && (
                  <div className="text-xs text-slate-500 mt-1">{t('onboarding.comingSoon')}</div>
                )}
              </button>
            );
          })}
          <Button className="w-full" disabled={!profileId} onClick={() => setStep(2)}>
            →
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <label className="block">
            <div className="font-semibold mb-2">{t('onboarding.storeName')}</div>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder={t('onboarding.storeNamePh')}
              className="w-full min-h-[48px] px-3 rounded-lg border-2 border-slate-200 focus:border-amber-500 outline-none"
            />
          </label>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>←</Button>
            <Button className="flex-1" disabled={!storeName.trim()} onClick={() => setStep(3)}>→</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="font-semibold">{t('onboarding.seedChoice')}</div>
          <div className="flex flex-col gap-2">
            <label className={`p-3 rounded-lg border-2 cursor-pointer ${seed ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`}>
              <input type="radio" checked={seed} onChange={() => setSeed(true)} className="mr-2" />
              {t('onboarding.seedYes')}
            </label>
            <label className={`p-3 rounded-lg border-2 cursor-pointer ${!seed ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`}>
              <input type="radio" checked={!seed} onChange={() => setSeed(false)} className="mr-2" />
              {t('onboarding.seedNo')}
            </label>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(2)}>←</Button>
            <Button className="flex-1" disabled={busy} onClick={finish}>
              {t('onboarding.finish')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
