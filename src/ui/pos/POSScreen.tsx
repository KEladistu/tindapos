import { useEffect, useState } from 'react';
import { TileGrid } from './TileGrid';
import { CartPane } from './CartPane';
import { TenderModal } from './TenderModal';
import { useCatalog } from '../../stores/catalog';
import { useCart } from '../../stores/cart';
import { useT } from '../../i18n';
import { formatPHP } from '../../engine/money';
import { useEditor } from '../../stores/editor';
import { EditorToolbar } from '../editor/EditorToolbar';

export function POSScreen() {
  const t = useT();
  const load = useCatalog((s) => s.load);
  const count = useCart((s) => s.count());
  const total = useCart((s) => s.totalC());
  const [tenderOpen, setTenderOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const editing = useEditor((s) => s.enabled);
  const undo = useEditor((s) => s.undo);

  useEffect(() => { void load(); }, [load]);

  // Ctrl/Cmd+Z global undo (only in editor mode)
  useEffect(() => {
    if (!editing) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        void undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editing, undo]);

  return (
    <div className="h-full flex flex-col">
      {editing && <EditorToolbar />}
      <div className={`flex-1 min-h-0 grid grid-rows-[1fr] ${editing ? '' : 'sm:grid-cols-[1fr_360px]'}`}>
        <div className="min-h-0 overflow-hidden">
          <TileGrid editing={editing} />
        </div>
        {!editing && (
          <>
            <div className="hidden sm:block min-h-0">
              <CartPane onCheckout={() => setTenderOpen(true)} />
            </div>
            <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 flex items-center gap-3 shadow-lg">
              <button
                onClick={() => setSheetOpen(true)}
                className="btn-secondary flex-1 justify-between px-3"
              >
                <span>{t('pos.cart')} ({count})</span>
                <span className="font-bold text-amber-600">{formatPHP(total)}</span>
              </button>
              <button
                onClick={() => setTenderOpen(true)}
                disabled={count === 0}
                className="btn-primary px-4"
              >
                {t('pos.checkout')}
              </button>
            </div>
            {sheetOpen && (
              <div className="sm:hidden fixed inset-0 z-30 bg-black/40 flex items-end" onClick={() => setSheetOpen(false)}>
                <div className="bg-white w-full max-h-[80vh] rounded-t-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                  <CartPane onCheckout={() => { setSheetOpen(false); setTenderOpen(true); }} />
                  <button onClick={() => setSheetOpen(false)} className="btn-ghost m-2">
                    {t('pos.close')}
                  </button>
                </div>
              </div>
            )}
            <TenderModal open={tenderOpen} onClose={() => setTenderOpen(false)} />
          </>
        )}
      </div>
    </div>
  );
}
