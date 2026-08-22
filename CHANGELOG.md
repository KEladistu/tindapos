# Changelog

## Phase 5 — Reports, Receipts, PINs, Backup, PWA polish
- PBKDF2 PIN login (owner/cashier), session persistence, role guards on Editor/Settings/Reports.
- Store settings screen: store info, VAT toggle, accent theme, language, users, printer, data.
- Reports: today, X/Z reading (shifts table), top items, low stock, payment breakdown, date range, CSV export.
- Receipts: 32-col text render, on-screen preview, browser print, Web Bluetooth ESC/POS, share as image, share as text.
- Backup: JSON export/import (photos as data URLs), sales CSV, hard reset, weekly nudge, self-host zip via SW cache.
- Sari-sari: utang payment method in tender, customer picker, utang ledger with payments.
- PWA: SVG icons (any + maskable), manifest updated, offline pill in header, autoUpdate registration.
- Schema v4: additive `shifts` table + `pinHash`/`pinSalt`/`color` on users. v1–v3 preserved.
- Docs: README/DEPLOY/CONTRIBUTING/CHANGELOG rewritten.

## Phase 4 — Restaurant
- Table map, orders, kitchen ticket screen, dine-in/takeout, queue numbers, split bill.
- Modifiers on items, senior/PWD tender with VAT-exempt handling.

## Phase 3 — LPG
- Cylinder pool (full/empty/on-loan), refill vs new-tank vs accessories, deposit tracking, delivery board.

## Phase 2 — Editor
- Drag-and-drop tile/category reorder, add/rename/delete items, photo upload.

## Phase 1 — Foundation
- Vite + React + TS + Tailwind + Dexie + Zustand skeleton, onboarding, sari-sari POS.
