# TindaPOS

Offline-first, installable, tablet-friendly POS for Philippine small businesses.
Three profiles: **sari-sari**, **LPG**, and **restaurant**. Runs entirely in the browser via IndexedDB; no server required.

## Features (by profile)

- **All profiles**: touch tile catalog, cart, tender modal, editor mode with drag-and-drop reorder, PIN login (owner/cashier), reports (today, X/Z reading, top items, low stock, payment breakdown, date range + CSV export), receipts (on-screen preview + browser print + Web Bluetooth ESC/POS + share as image/text), backup/restore, PWA install.
- **Sari-sari**: utang (customer ledger with payments), tingi-ready item extras, senior/PWD discount at tender.
- **LPG**: refill vs new-tank vs accessories, cylinder pool (full/empty/on-loan), deposit accounting, delivery dispatch board.
- **Restaurant**: table map, modifiers, kitchen ticket screen, dine-in/takeout, queue numbers, split bill.

Money is always integer centavos. Peso formatting uses `Intl.NumberFormat('en-PH')`.

## Quick start

```
npm install
npm run dev -- --host
```

Open http://localhost:5173 on any device on your LAN.

## Build & test

```
npm run build     # -> dist/
npm test -- --run # vitest, fake-indexeddb
```

## Deploy

See [DEPLOY.md](./DEPLOY.md).

## Adding a new business profile

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT. Provided as-is, no warranty. Receipts are marked "PROVISIONAL RECEIPT — NOT FOR BIR"; use an accredited POS for BIR-compliant issuance.
