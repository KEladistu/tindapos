import { useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  type DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CategoryRow } from '../../db/schema';
import { InlineText } from './InlineText';
import { useT } from '../../i18n';

interface Props {
  categories: CategoryRow[];
  activeId: string | 'all';
  onSelect: (id: string | 'all') => void;
  onReorder: (orderedIds: string[]) => void;
  onRename: (id: string, name: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

function SortableTab({ cat, active, onSelect, onRename, onDelete }: {
  cat: CategoryRow;
  active: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const t = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `cat-drop-${cat.id}`, data: { categoryId: cat.id } });
  const [editing, setEditing] = useState(false);
  const pressTimer = useRef<number | null>(null);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const startPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => setEditing(true), 550);
  };
  const cancelPress = () => {
    if (pressTimer.current) { window.clearTimeout(pressTimer.current); pressTimer.current = null; }
  };

  return (
    <div
      ref={(el) => { setNodeRef(el); setDropRef(el); }}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={() => setEditing(true)}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      className={`relative shrink-0 min-h-[40px] px-3 rounded flex items-center gap-1 text-sm ${active ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'} ${isOver ? 'ring-2 ring-amber-400' : ''}`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="whitespace-nowrap"
      >
        {editing ? (
          <InlineText
            value={cat.name}
            onSave={(v) => { onRename(v); setEditing(false); }}
            ariaLabel="category name"
          />
        ) : (
          cat.name
        )}
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="text-xs opacity-60 hover:opacity-100"
        title={t('editor.delete')}
      >
        🗑
      </button>
    </div>
  );
}

export function SortableCategoryTabs({ categories, activeId, onSelect, onReorder, onRename, onAdd, onDelete }: Props) {
  const t = useT();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = categories.map((c) => c.id);
    const from = ids.indexOf(e.active.id as string);
    const to = ids.indexOf(e.over.id as string);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(ids, from, to));
  };

  return (
    <div className="flex gap-2 overflow-x-auto p-2 bg-white border-b border-slate-200">
      <button
        onClick={() => onSelect('all')}
        className={`shrink-0 min-h-[40px] px-3 text-sm rounded ${activeId === 'all' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
      >
        {t('cat.all')}
      </button>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={categories.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
          {categories.map((c) => (
            <SortableTab
              key={c.id}
              cat={c}
              active={activeId === c.id}
              onSelect={() => onSelect(c.id)}
              onRename={(name) => onRename(c.id, name)}
              onDelete={() => onDelete(c.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button
        onClick={onAdd}
        className="shrink-0 min-h-[40px] px-3 text-sm rounded bg-white border border-dashed border-slate-400 text-slate-600 hover:bg-amber-50"
      >
        + {t('editor.addCategory')}
      </button>
    </div>
  );
}
