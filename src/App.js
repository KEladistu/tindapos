import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
        return (_jsx("div", { className: "h-full flex items-center justify-center text-slate-500", children: "Loading\u2026" }));
    }
    const onboarded = !!storeName && !!profileId;
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsxs("header", { className: "sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm", children: [_jsx("div", { className: "text-xl font-bold text-amber-600", children: "TindaPOS" }), onboarded && (_jsx("div", { className: "text-sm text-slate-600 truncate", children: storeName })), _jsxs("div", { className: "ml-auto flex items-center gap-2", children: [_jsx("button", { className: "btn-ghost text-sm px-3 min-h-[40px]", onClick: () => setLanguage(language === 'en' ? 'tl' : 'en'), title: t('header.langToggle'), children: language === 'en' ? 'EN' : 'TL' }), _jsx("button", { className: "btn-ghost text-sm px-3 min-h-[40px] opacity-50 cursor-not-allowed", disabled: true, title: t('header.editorDisabled'), children: t('header.editor') })] })] }), _jsx("main", { className: "flex-1 overflow-hidden", children: onboarded ? _jsx(POSScreen, {}) : _jsx(OnboardingFlow, { db: db }) })] }));
}
