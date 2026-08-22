import { useEffect, useMemo, useState } from 'react';
import { useCatalog } from '../../stores/catalog';
import { useCart } from '../../stores/cart';
import { formatPHP } from '../../engine/money';
import { useT } from '../../i18n';
import { useEditor } from '../../stores/editor';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableTile } from '../editor/SortableTile';
import { SortableCategoryTabs } from '../editor/SortableCategoryTabs';
import { AddItemModal } from '../editor/AddItemModal';
import { resizeImageBlob, savePhoto, loadPhotoURL } from '../../utils/image';
import type { ItemRow } from '../../db/schema';

interface Props {
  editing?: boolean;
}

/** Non-editing product tile with an async-loaded photo. */
function PhotoTile({ item, onClick }: { item: ItemRow; onClick: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let u: string | null = null;
    let cancelled = false;
    if (item.photoBlobId) {
      loadPhotoURL(item.photoBlobId).then((r) => {
        if (cancelled) { if (r) URL.revokeObjectURL(r); return; }
        u = r; setUrl(r);
      });
    } else {
      setUrl(null);
    }
    return () => {
      cancelled = true;
      if (u) URL.revokeObjectURL(u);
    };
  }, [item.photoBlobId]);
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border-2 border-slate-200 p-2 min-h-[96px] flex flex-col items-center justify-center gap-1 hover:border-amber-400 active:bg-amber-50"
    >
      {url ? (
        <img src={url} alt={item.name} className="w-12 h-12 object-cover rounded" />
      ) : (
        <div className="text-3xl">{item.icon ?? '📦'}</div>
      )}
      <div className="text-xs font-medium text-slate-800 text-center leading-tight line-clamp-2">
        {item.name}
      </div>
      <div className="text-sm font-bold text-amber-600">{formatPHP(item.priceCentavos)}</div>
      {item.stock !== undefined && (
        <div className="text-[10px] text-slate-400">stk {item.stock}</div>
      )}
    </button>
  );
}

export function TileGrid({ editing = false }: Props) {
  const t = useT();
  const items = useCatalog((s) => s.items);
  const categories = useCatalog((s) => s.categories);
  const add = useCart((s) => s.add);

  const catalog = useCatalog();
  const pushUndo = useEditor((s) => s.pushUndo);
  const columns = useEditor((s) => s.columns);

  const [catId, setCatId] = useState<string | 'all'>('all');
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const arr = catId === 'all' ? items : items.filter((i) => i.categoryId === catId);
    return [...arr].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [items, catId]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const activeId = e.active.id as string;
    const overId = e.over.id as string;
    // Category tab drop targets are wrapped as `cat-drop-<id>` via useDroppable, but since we mount that inside another DndContext, moves happen via reorder inside grid only.
    const ids = filtered.map((i) => i.id);
    const from = ids.indexOf(activeId);
    const to = ids.indexOf(overId);
    if (from < 0 || to < 0) return;
    const reordered = arrayMove(ids, from, to);
    // Reorder within current category (only meaningful when a category tab is picked, but also works for 'all' by touching one category slice).
    const active = items.find((i) => i.id === activeId);
    if (!active) return;
    const catSlice = items.filter((i) => i.categoryId === active.categoryId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((i) => i.id);
    // Compute new order for this category: apply move within just the intersection.
    const intersection = reordered.filter((id) => catSlice.includes(id));
    // For any ids in catSlice not in intersection (shouldn't happen unless filtering), keep them at end in original order.
    const missing = catSlice.filter((id) => !intersection.includes(id));
    const finalOrder = [...intersection, ...missing];
    const op = await catalog.reorderItems(active.categoryId, finalOrder);
    pushUndo(op);
  };

  const gridCols = editing
    ? (columns === 2 ? 'grid-cols-2' : columns === 4 ? 'grid-cols-4' : 'grid-cols-3')
    : 'grid-cols-2 sm:grid-cols-3';

  const handleDropImage = async (itemId: string, file: File) => {
    try {
      const resized = await resizeImageBlob(file, 512, 0.85);
      const id = await savePhoto(resized);
      const op = await catalog.setItemPhoto(itemId, id);
      pushUndo(op);
    } catch (e) {
      console.error('image drop failed', e);
    }
  };

  const currentCategory = categories.find((c) => c.id === catId);
  const addTargetCategoryId = currentCategory?.id ?? categories[0]?.id;

  return (
    <div className="flex flex-col h-full">
      {editing ? (
        <SortableCategoryTabs
          categories={categories}
          activeId={catId}
          onSelect={setCatId}
          onReorder={async (ids) => {
            const op = await catalog.reorderCategories(ids);
            pushUndo(op);
          }}
          onRename={async (id, name) => {
            const op = await catalog.renameCategory(id, name);
            pushUndo(op);
          }}
          onAdd={async () => {
            const name = window.prompt(t('editor.newCategoryName'));
            if (name && name.trim()) {
              const op = await catalog.createCategory(name.trim());
              pushUndo(op);
            }
          }}
          onDelete={async (id) => {
            const cat = categories.find((c) => c.id === id);
            if (!cat) return;
            if (!window.confirm(t('editor.confirmDeleteCategory').replace('{name}', cat.name))) return;
            try {
              const op = await catalog.deleteCategory(id);
              pushUndo(op);
              if (catId === id) setCatId('all');
            } catch (err) {
              if ((err as Error).message === 'CATEGORY_NOT_EMPTY') {
                alert(t('editor.categoryNotEmpty'));
              } else {
                throw err;
              }
            }
          }}
        />
      ) : (
        <div className="flex gap-2 overflow-x-auto p-2 bg-white border-b border-slate-200">
          <button
            onClick={() => setCatId('all')}
            className={`btn min-h-[40px] px-3 text-sm ${catId === 'all' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {t('cat.all')}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCatId(c.id)}
              className={`btn min-h-[40px] px-3 text-sm whitespace-nowrap ${catId === c.id ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 && !editing ? (
          <div className="text-center text-slate-500 py-8">{t('pos.emptyCatalog')}</div>
        ) : editing ? (
          <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={filtered.map((i) => i.id)} strategy={rectSortingStrategy}>
                <div className={`grid ${gridCols} gap-2`}>
                  {filtered.map((it) => (
                    <SortableTile
                      key={it.id}
                      item={it}
                      onRename={async (name) => {
                        const op = await catalog.renameItem(it.id, name);
                        pushUndo(op);
                      }}
                      onReprice={async (cents) => {
                        const op = await catalog.repriceItem(it.id, cents);
                        pushUndo(op);
                      }}
                      onDropImage={(f) => handleDropImage(it.id, f)}
                      onPickImage={(f) => handleDropImage(it.id, f)}
                      onSetIcon={async (icon) => {
                        const op = await catalog.setItemIcon(it.id, icon);
                        pushUndo(op);
                      }}
                      onDelete={async () => {
                        if (!window.confirm(t('editor.confirmDeleteItem').replace('{name}', it.name))) return;
                        const op = await catalog.deleteItem(it.id);
                        pushUndo(op);
                      }}
                    />
                  ))}
                  {addTargetCategoryId && (
                    <button
                      onClick={() => setAddOpen(true)}
                      className="min-h-[128px] rounded-xl border-2 border-dashed border-slate-300 text-slate-500 flex items-center justify-center text-3xl hover:bg-amber-50 hover:border-amber-400"
                    >
                      +
                    </button>
                  )}
                </div>
              </SortableContext>
            </DndContext>
            {addTargetCategoryId && (
              <AddItemModal
                open={addOpen}
                categoryName={currentCategory?.name ?? categories[0]?.name ?? ''}
                onClose={() => setAddOpen(false)}
                onCreate={async (data) => {
                  const op = await catalog.createItem({
                    ...data,
                    categoryId: addTargetCategoryId
                  });
                  pushUndo(op);
                }}
              />
            )}
          </>
        ) : (
          <div className={`grid ${gridCols} gap-2`}>
            {filtered.map((it) => (
              <PhotoTile
                key={it.id}
                item={it}
                onClick={() =>
                  add({ itemId: it.id, name: it.name, unitPriceC: it.priceCentavos, icon: it.icon })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
