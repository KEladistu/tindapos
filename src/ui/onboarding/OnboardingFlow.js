import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { profileRegistry } from '../../profiles/registry';
import { useSettings } from '../../stores/settings';
import { useT } from '../../i18n';
import { Button } from '../common/Button';
export function OnboardingFlow({ db }) {
    const t = useT();
    const { setStore, language } = useSettings();
    const [step, setStep] = useState(1);
    const [profileId, setProfileId] = useState(null);
    const [storeName, setStoreName] = useState('');
    const [seed, setSeed] = useState(true);
    const [busy, setBusy] = useState(false);
    async function finish() {
        if (!profileId || !storeName.trim())
            return;
        setBusy(true);
        const entry = profileRegistry[profileId];
        // Seed categories
        await db.categories.bulkPut(entry.profile.defaultCategories.map((c) => ({
            id: c.id,
            name: c.name[language] ?? c.name.en,
            order: c.order
        })));
        if (seed) {
            await db.items.bulkPut(entry.profile.seedCatalog.map((it, i) => ({
                id: `seed-${i}-${it.name.replace(/\W+/g, '-').toLowerCase()}`,
                categoryId: it.categoryId,
                name: it.name,
                priceCentavos: it.priceCentavos,
                stock: it.stock ?? 0,
                icon: it.icon,
                order: i,
                archived: 0,
                extras: it.extras
            })));
        }
        await setStore(storeName.trim(), profileId);
        setBusy(false);
    }
    return (_jsxs("div", { className: "max-w-md mx-auto p-4 sm:p-6 space-y-6", children: [_jsx("h1", { className: "text-2xl font-bold text-slate-800", children: t('onboarding.title') }), step === 1 && (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "font-semibold", children: t('onboarding.pickProfile') }), Object.keys(profileRegistry).map((id) => {
                        const entry = profileRegistry[id];
                        const active = profileId === id;
                        return (_jsxs("button", { disabled: !entry.available, onClick: () => setProfileId(id), className: `w-full text-left p-4 rounded-xl border-2 transition min-h-[64px] ${active ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white'} ${!entry.available ? 'opacity-50 cursor-not-allowed' : 'hover:border-amber-300'}`, children: [_jsx("div", { className: "font-semibold", children: entry.profile.name[language] }), !entry.available && (_jsx("div", { className: "text-xs text-slate-500 mt-1", children: t('onboarding.comingSoon') }))] }, id));
                    }), _jsx(Button, { className: "w-full", disabled: !profileId, onClick: () => setStep(2), children: "\u2192" })] })), step === 2 && (_jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "block", children: [_jsx("div", { className: "font-semibold mb-2", children: t('onboarding.storeName') }), _jsx("input", { type: "text", value: storeName, onChange: (e) => setStoreName(e.target.value), placeholder: t('onboarding.storeNamePh'), className: "w-full min-h-[48px] px-3 rounded-lg border-2 border-slate-200 focus:border-amber-500 outline-none" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setStep(1), children: "\u2190" }), _jsx(Button, { className: "flex-1", disabled: !storeName.trim(), onClick: () => setStep(3), children: "\u2192" })] })] })), step === 3 && (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "font-semibold", children: t('onboarding.seedChoice') }), _jsxs("div", { className: "flex flex-col gap-2", children: [_jsxs("label", { className: `p-3 rounded-lg border-2 cursor-pointer ${seed ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`, children: [_jsx("input", { type: "radio", checked: seed, onChange: () => setSeed(true), className: "mr-2" }), t('onboarding.seedYes')] }), _jsxs("label", { className: `p-3 rounded-lg border-2 cursor-pointer ${!seed ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`, children: [_jsx("input", { type: "radio", checked: !seed, onChange: () => setSeed(false), className: "mr-2" }), t('onboarding.seedNo')] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setStep(2), children: "\u2190" }), _jsx(Button, { className: "flex-1", disabled: busy, onClick: finish, children: t('onboarding.finish') })] })] }))] }));
}
