# Contributing

## Adding a new business profile

1. Create `src/profiles/<your-profile>/` with at minimum a `profile.ts` exporting a `BusinessProfile` (see `src/profiles/types.ts`).
2. Optionally add `seed.ts` (default catalog) and `modules/` (profile-specific behaviors).
3. Register the profile in `src/profiles/registry.ts`.
4. Add i18n keys for any new UI in `src/i18n/en.ts` and `src/i18n/tl.ts`.
5. Add unit tests under `tests/` for any new pure logic.

## Code style

- Money is always integer centavos (`Centavos`). Never use floats for cash.
- All UI strings go through `t(key)`.
- Keep engine/ pure — no React, no Dexie imports.
