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
import { LoginScreen } from './ui/users/LoginScreen';
import { SettingsScreen } from './ui/settings/SettingsScreen';
import { ReportsScreen } from './ui/reports/ReportsScreen';
import { UtangList } from './ui/sari-sari/UtangList';

export default function App() {
  const { language, setLanguage, hydrate, hydrated, storeName, profileId, lastBackupTs } = useSettings();
  const role = useSession((s) => s.role);
  const authenticated = useSession((s) => s.authenticated);
  const hydrateSession = useSession((s) => s.hydrate);
  const logout = useSession((s) => s.logout);
  const editing = useEditor((s) => s.enabled);
  const toggleEditor = useEditor((s) => s.toggle);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<Error | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [utangOpen, setUtangOpen] = useState(false);
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showBackupNudge, setShowBackupNudge] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await hydrate();
        await hydrateEditorSettings();
        await hydrateSession();
      } catch (e) {
        console.error('[TindaPOS boot]', e);
        setBootError(e as Error);
      } finally {
        setLoading(false);
      }
    })();
  }, [hydrate, hydrateSession]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const week = 7 * 86400000;
    if (lastBackupTs && Date.now() - lastBackupTs < week) return;
    void db.sales.count().then((c) => { if (c > 0) setShowBackupNudge(true); });
  }, [hydrated, lastBackupTs]);

  if (bootError) {
    return (
      <div className="h-full p-6 overflow-auto bg-slate-50">
        <div className="max-w-xl mx-auto bg-white border border-red-200 rounded-lg p-5 shadow-sm">
          <h1 className="text-lg font-bold text-red-700 mb-2">Boot failed</h1>
          <pre className="text-xs bg-slate-100 p-3 rounded overflow-auto whitespace-pre-wrap text-slate-800 mb-4">
{String(bootError.stack || bootError.message || bootError)}
          </pre>
          <button className="px-3 py-2 rounded bg-red-600 text-white"
            onClick={async () => { indexedDB.deleteDatabase('tindapos'); location.reload(); }}>
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

  if (onboarded && !authenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="h-full flex flex-col">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="text-xl font-bold text-amber-600">TindaPOS</div>
        {onboarded && <div className="text-sm text-slate-600 truncate">{storeName}</div>}
        {editing && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-white">
            {t('editor.editingBadge')}
          </span>
        )}
        {!online && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-600 text-white">OFFLINE</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button className="btn-ghost text-sm px-3 min-h-[40px]"
            onClick={() => setLanguage(language === 'en' ? 'tl' : 'en')} title={t('header.langToggle')}>
            {language === 'en' ? 'EN' : 'TL'}
          </button>
          {onboarded && role === 'owner' && profileId === 'sari-sari' && (
            <button className="btn-ghost text-sm px-2 min-h-[40px]" onClick={() => setUtangOpen(true)} title="Utang">
              ₱
            </button>
          )}
          {onboarded && role === 'owner' && (
            <>
              <button className="btn-ghost text-sm px-2 min-h-[40px]" onClick={() => setReportsOpen(true)} title="Reports">
                ▤
              </button>
              <button className="btn-ghost text-sm px-2 min-h-[40px]" onClick={() => setSettingsOpen(true)} title="Settings">
                ⚙
              </button>
              <button className={`text-sm px-3 min-h-[40px] rounded ${editing ? 'bg-amber-500 text-white' : 'btn-ghost'}`}
                onClick={toggleEditor} title={t('header.editor')}>
                {editing ? t('editor.exit') : t('header.editor')}
              </button>
            </>
          )}
          {onboarded && (
            <button className="btn-ghost text-sm px-2 min-h-[40px]" onClick={logout} title="Log out">⇥</button>
          )}
        </div>
      </header>
      {showBackupNudge && (
        <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-sm flex items-center gap-2">
          <span>Backup your data — it lives only on this device.</span>
          <button className="ml-auto text-amber-800 underline" onClick={() => { setSettingsOpen(true); setShowBackupNudge(false); }}>Backup now</button>
          <button className="text-amber-800" onClick={() => setShowBackupNudge(false)}>✕</button>
        </div>
      )}
      <main className="flex-1 overflow-hidden">
        {onboarded
          ? (profileId === 'lpg' ? <LPGPOSScreen />
            : profileId === 'restaurant' ? <RestaurantPOSScreen />
            : <POSScreen />)
          : <OnboardingFlow db={db} />}
      </main>
      <SettingsScreen open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ReportsScreen open={reportsOpen} onClose={() => setReportsOpen(false)} />
      <UtangList open={utangOpen} onClose={() => setUtangOpen(false)} />
    </div>
  );
}
