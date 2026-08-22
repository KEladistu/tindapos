import { useEffect, useState } from 'react';
import { db } from './db/schema';
import { useSettings } from './stores/settings';
import { OnboardingFlow } from './ui/onboarding/OnboardingFlow';
import { POSScreen } from './ui/pos/POSScreen';
import { t } from './i18n';

export default function App() {
  const { language, setLanguage, hydrate, hydrated, storeName, profileId } = useSettings();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await hydrate();
      setLoading(false);
    })();
  }, [hydrate]);

  if (loading || !hydrated) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  const onboarded = !!storeName && !!profileId;

  return (
    <div className="h-full flex flex-col">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="text-xl font-bold text-amber-600">TindaPOS</div>
        {onboarded && (
          <div className="text-sm text-slate-600 truncate">{storeName}</div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            className="btn-ghost text-sm px-3 min-h-[40px]"
            onClick={() => setLanguage(language === 'en' ? 'tl' : 'en')}
            title={t('header.langToggle')}
          >
            {language === 'en' ? 'EN' : 'TL'}
          </button>
          <button
            className="btn-ghost text-sm px-3 min-h-[40px] opacity-50 cursor-not-allowed"
            disabled
            title={t('header.editorDisabled')}
          >
            {t('header.editor')}
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        {onboarded ? <POSScreen /> : <OnboardingFlow db={db} />}
      </main>
    </div>
  );
}
