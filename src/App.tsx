import { useEffect, useState } from 'react';
import { db } from './db/schema';
import { useSettings } from './stores/settings';
import { OnboardingFlow } from './ui/onboarding/OnboardingFlow';
import { POSScreen } from './ui/pos/POSScreen';
import { LPGPOSScreen } from './ui/lpg/LPGPOSScreen';
import { RestaurantPOSScreen } from './ui/restaurant/RestaurantPOSScreen';
import { t } from './i18n';
import { useSession } from './stores/session';
import { useEditor, hydrateEditorSettings } from './stores/editor';

export default function App() {
  const { language, setLanguage, hydrate, hydrated, storeName, profileId } = useSettings();
  const role = useSession((s) => s.role);
  const editing = useEditor((s) => s.enabled);
  const toggleEditor = useEditor((s) => s.toggle);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<Error | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await hydrate();
        await hydrateEditorSettings();
      } catch (e) {
        console.error('[TindaPOS boot]', e);
        setBootError(e as Error);
      } finally {
        setLoading(false);
      }
    })();
  }, [hydrate]);

  if (bootError) {
    return (
      <div className="h-full p-6 overflow-auto bg-slate-50">
        <div className="max-w-xl mx-auto bg-white border border-red-200 rounded-lg p-5 shadow-sm">
          <h1 className="text-lg font-bold text-red-700 mb-2">Boot failed</h1>
          <pre className="text-xs bg-slate-100 p-3 rounded overflow-auto whitespace-pre-wrap text-slate-800 mb-4">
{String(bootError.stack || bootError.message || bootError)}
          </pre>
          <button
            className="px-3 py-2 rounded bg-red-600 text-white"
            onClick={async () => { indexedDB.deleteDatabase('tindapos'); location.reload(); }}
          >
            Reset local data & reload
          </button>
        </div>
      </div>
    );
  }

  if (loading || !hydrated) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-lg font-semibold text-amber-600">TindaPOS — Loading…</div>
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
        {editing && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-white">
            {t('editor.editingBadge')}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            className="btn-ghost text-sm px-3 min-h-[40px]"
            onClick={() => setLanguage(language === 'en' ? 'tl' : 'en')}
            title={t('header.langToggle')}
          >
            {language === 'en' ? 'EN' : 'TL'}
          </button>
          {onboarded && role === 'owner' && (
            <button
              className={`text-sm px-3 min-h-[40px] rounded ${editing ? 'bg-amber-500 text-white' : 'btn-ghost'}`}
              onClick={toggleEditor}
              title={t('header.editor')}
            >
              {editing ? t('editor.exit') : t('header.editor')}
            </button>
          )}
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        {onboarded
          ? (profileId === 'lpg'
              ? <LPGPOSScreen />
              : profileId === 'restaurant'
                ? <RestaurantPOSScreen />
                : <POSScreen />)
          : <OnboardingFlow db={db} />}
      </main>
    </div>
  );
}
