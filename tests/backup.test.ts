import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../src/db/schema';
import { exportJSON, importJSON } from '../src/utils/backup';

describe('backup', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('round-trip preserves data', async () => {
    await db.settings.put({ key: 'storeName', value: 'Test' });
    await db.users.put({ id: 'u1', role: 'owner', name: 'Owner' });
    await db.sales.put({
      id: 's1', ts: 1, userId: 'u1', paymentMethod: 'cash', status: 'complete',
      totalCentavos: 1000, tenderedCentavos: 1000, changeCentavos: 0
    });
    const blob = await exportJSON();
    await db.sales.clear();
    await db.settings.clear();
    await importJSON(blob);
    expect((await db.settings.get('storeName'))?.value).toBe('Test');
    expect((await db.sales.get('s1'))?.totalCentavos).toBe(1000);
  });
});
