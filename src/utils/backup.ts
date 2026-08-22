import { db } from '../db/schema';
import { salesToCSV } from '../engine/reports';
import JSZip from 'jszip';

const APP_VERSION = '0.5.0';
const SCHEMA_VERSION = 4;

const TABLES = [
  'settings', 'users', 'categories', 'items', 'photos',
  'customers', 'utangEntries', 'sales', 'saleLines', 'discounts',
  'cylinders', 'deliveries', 'diningTables', 'orders', 'auditLog', 'shifts'
] as const;

async function blobToDataUrl(b: Blob): Promise<string> {
  return await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = () => rej(fr.error);
    fr.readAsDataURL(b);
  });
}

async function dataUrlToBlob(u: string): Promise<Blob> {
  const r = await fetch(u);
  return await r.blob();
}

function readAsText(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = () => rej(fr.error);
    fr.readAsText(b);
  });
}

export async function exportJSON(): Promise<Blob> {
  const tables: Record<string, unknown[]> = {};
  for (const name of TABLES) {
    const table = (db as unknown as Record<string, { toArray: () => Promise<unknown[]> }>)[name];
    if (!table) continue;
    const rows = await table.toArray();
    if (name === 'photos') {
      const converted: unknown[] = [];
      for (const r of rows as { id: string; blob: Blob }[]) {
        converted.push({ id: r.id, dataUrl: await blobToDataUrl(r.blob) });
      }
      tables[name] = converted;
    } else {
      tables[name] = rows;
    }
  }
  const payload = {
    appVersion: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: Date.now(),
    tables
  };
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
}

export async function importJSON(blob: Blob): Promise<{ restored: number; skipped: number }> {
  const text = await readAsText(blob);
  const parsed = JSON.parse(text) as { schemaVersion?: number; tables?: Record<string, unknown[]> };
  if (!parsed.tables) throw new Error('Invalid backup: no tables');
  let restored = 0;
  let skipped = 0;
  for (const name of TABLES) {
    const rows = parsed.tables[name];
    if (!Array.isArray(rows)) { skipped++; continue; }
    const table = (db as unknown as Record<string, { clear: () => Promise<void>; bulkAdd: (rows: unknown[]) => Promise<unknown> }>)[name];
    if (!table) { skipped++; continue; }
    await table.clear();
    if (name === 'photos') {
      const converted: unknown[] = [];
      for (const r of rows as { id: string; dataUrl: string }[]) {
        converted.push({ id: r.id, blob: await dataUrlToBlob(r.dataUrl) });
      }
      if (converted.length) await table.bulkAdd(converted);
    } else if (rows.length) {
      await table.bulkAdd(rows);
    }
    restored += rows.length;
  }
  return { restored, skipped };
}

export async function exportSalesCSV(startMs?: number, endMs?: number): Promise<Blob> {
  let sales = await db.sales.toArray();
  if (startMs != null && endMs != null) {
    sales = sales.filter((s) => s.ts >= startMs && s.ts <= endMs);
  }
  const ids = new Set(sales.map((s) => s.id));
  const lines = (await db.saleLines.toArray()).filter((l) => ids.has(l.saleId));
  return new Blob([salesToCSV(sales, lines)], { type: 'text/csv' });
}

export async function hardReset(): Promise<void> {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    if (regs) for (const r of regs) await r.unregister();
  } catch {}
  await db.delete();
  location.reload();
}

export async function exportSelfHostZip(): Promise<Blob> {
  const zip = new JSZip();
  zip.file('README-selfhost.txt',
    `TindaPOS — self-host instructions
====================================

Best approach:
  1. git clone the repo
  2. npm install
  3. npm run build
  4. Serve the "dist/" folder from any static host (nginx, caddy, python -m http.server, Cloudflare Pages, GitHub Pages).

This zip contains a best-effort snapshot of the currently-cached PWA assets.
If it is empty, the app was not installed as a PWA — run "npm run build" instead.
`);
  try {
    if ('caches' in globalThis) {
      const cacheNames = await caches.keys();
      for (const cn of cacheNames) {
        const cache = await caches.open(cn);
        const reqs = await cache.keys();
        for (const req of reqs) {
          const res = await cache.match(req);
          if (!res) continue;
          const buf = await res.arrayBuffer();
          const url = new URL(req.url);
          let path = url.pathname;
          if (path.endsWith('/')) path += 'index.html';
          zip.file(path.replace(/^\//, ''), buf);
        }
      }
    }
  } catch (e) {
    zip.file('EXPORT-ERROR.txt', String(e));
  }
  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
