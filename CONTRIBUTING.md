# Contributing

## Adding a new business profile

Checklist (all paths under `src/`):

1. `profiles/<id>/profile.ts` — export a `BusinessProfile` (id, name, itemSchema, defaultCategories, seedCatalog, modules, receiptTemplate, layoutDefaults).
2. `profiles/<id>/seed.ts` — (optional) helper seed rows for extra tables.
3. `profiles/registry.ts` — register the profile with `available: true`.
4. `stores/settings.ts` — add the id to `ProfileId` union.
5. `ui/<id>/<Name>POSScreen.tsx` — the profile's screen.
6. `App.tsx` — route to the new screen based on `profileId`.
7. `i18n/en.ts` and `i18n/tl.ts` — add strings under a `<id>.*` namespace.
8. Add tests under `tests/`.

Money is centavos (integer). Never store cash as float. Use `formatPHP`, `toCentavos`, `addC`, `mulC` from `engine/money.ts`.

## Schema changes

Add a new `this.version(N)` in `db/schema.ts` — **never delete or edit prior version() blocks**. Additive fields don't need index changes.
