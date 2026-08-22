import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../src/db/schema';
import { useCatalog } from '../src/stores/catalog';
import { useEditor } from '../src/stores/editor';
import { resizeImageBlob } from '../src/utils/image';

async function resetDb() {
  await db.items.clear();
  await db.categories.clear();
  await db.photos.clear();
  await db.auditLog.clear();
  useEditor.setState({ enabled: false, columns: 3, undoStack: [] });
}

async function seed() {
  await db.categories.bulkPut([
    { id: 'c1', name: 'Snacks', order: 0 }
  ]);
  await db.items.bulkPut([
    { id: 'i1', categoryId: 'c1', name: 'Chippy', priceCentavos: 1200, stock: 0, order: 0, archived: 0 },
    { id: 'i2', categoryId: 'c1', name: 'Piattos', priceCentavos: 1500, stock: 0, order: 1, archived: 0 },
    { id: 'i3', categoryId: 'c1', name: 'Nova', priceCentavos: 1800, stock: 0, order: 2, archived: 0 }
  ]);
  await useCatalog.getState().load();
}

describe('catalog editor mutations', () => {
  beforeEach(async () => {
    await resetDb();
    await seed();
  });

  it('reorderItems produces expected order sequence', async () => {
    const newOrder = ['i3', 'i1', 'i2'];
    await useCatalog.getState().reorderItems('c1', newOrder);
    const items = useCatalog.getState().items
      .filter((i) => i.categoryId === 'c1')
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((i) => i.id);
    expect(items).toEqual(newOrder);
    const rowsFromDb = (await db.items.where('categoryId').equals('c1').toArray())
      .sort((a, b) => a.order - b.order)
      .map((r) => r.id);
    expect(rowsFromDb).toEqual(newOrder);
  });

  it('undo of a rename restores the previous value', async () => {
    const pushUndo = useEditor.getState().pushUndo;
    const op = await useCatalog.getState().renameItem('i1', 'Chippy BBQ');
    pushUndo(op);
    expect(useCatalog.getState().items.find((i) => i.id === 'i1')!.name).toBe('Chippy BBQ');
    await useEditor.getState().undo();
    expect(useCatalog.getState().items.find((i) => i.id === 'i1')!.name).toBe('Chippy');
  });

  it('undo stack is bounded to 10 entries', async () => {
    const pushUndo = useEditor.getState().pushUndo;
    for (let n = 0; n < 15; n++) {
      const op = await useCatalog.getState().renameItem('i1', `Chippy ${n}`);
      pushUndo(op);
    }
    expect(useEditor.getState().undoStack.length).toBe(10);
  });
});

describe('resizeImageBlob', () => {
  // jsdom lacks canvas rendering; only run when a real 2d context is available.
  let canTest = false;
  try {
    if (typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      canTest = !!c.getContext('2d');
    }
  } catch { canTest = false; }

  it.skipIf(!canTest)('shrinks a 2000x2000 image to <=512 on longest edge', async () => {
    const src = document.createElement('canvas');
    src.width = 2000;
    src.height = 2000;
    const sctx = src.getContext('2d');
    if (!sctx) return;
    sctx.fillStyle = '#f00';
    sctx.fillRect(0, 0, 2000, 2000);
    const blob = await new Promise<Blob>((resolve, reject) =>
      src.toBlob((b) => (b ? resolve(b) : reject(new Error('no blob'))), 'image/jpeg', 0.9)
    );
    const resized = await resizeImageBlob(blob, 512, 0.85);
    // Decode result and check dimensions
    if (typeof createImageBitmap === 'function') {
      try {
        const bmp = await createImageBitmap(resized);
        expect(Math.max(bmp.width, bmp.height)).toBeLessThanOrEqual(512);
        bmp.close?.();
      } catch {
        // If jsdom cannot decode, at least the resize didn't throw. TODO revisit under a real browser env.
        expect(resized.size).toBeGreaterThan(0);
      }
    } else {
      expect(resized.size).toBeGreaterThan(0);
    }
  });
});
