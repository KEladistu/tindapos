import { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ItemRow } from '../../db/schema';
import { InlineText } from './InlineText';
import { InlinePrice } from './InlinePrice';
import { EmojiPicker } from './EmojiPicker';
import { loadPhotoURL } from '../../utils/image';
import { useT } from '../../i18n';

interface Props {
  item: ItemRow;
  onRename: (name: string) => void;
  onReprice: (cents: number) => void;
  onDropImage: (file: File) => void;
  onPickImage: (file: File) => void;
  onSetIcon: (icon: string) => void;
  onDelete: () => void;
}

export function SortableTile({ item, onRename, onReprice, onDropImage, onPickImage, onSetIcon, onDelete }: Props) {
  const t = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  };
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    if (item.photoBlobId) {
      loadPhotoURL(item.photoBlobId).then((u) => {
        if (cancelled) { if (u) URL.revokeObjectURL(u); return; }
        url = u;
        setPhotoUrl(u);
      });
    } else {
      setPhotoUrl(null);
    }
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [item.photoBlobId]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f && f.type.startsWith('image/')) onDropImage(f);
      }}
      className={`relative bg-white rounded-xl border-2 p-2 min-h-[128px] flex flex-col items-center justify-between gap-1 select-none ${dragOver ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 border border-slate-300 text-slate-500 hover:text-red-600 text-xs"
        title={t('editor.delete')}
      >
        ×
      </button>

      <div className="relative flex flex-col items-center">
        {photoUrl ? (
          <img src={photoUrl} alt={item.name} className="w-16 h-16 object-cover rounded" />
        ) : (
          <div className="text-4xl">{item.icon ?? '📦'}</div>
        )}
        <div className="flex gap-1 mt-1">
          <label
            className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded cursor-pointer hover:bg-amber-100"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {t('editor.choosePhoto')}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickImage(f);
                e.currentTarget.value = '';
              }}
            />
          </label>
          <button
            type="button"
            className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded hover:bg-amber-100"
            onClick={(e) => { e.stopPropagation(); setPickerOpen((v) => !v); }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {t('editor.chooseIcon')}
          </button>
        </div>
        {pickerOpen && (
          <EmojiPicker
            value={item.icon}
            onPick={(em) => onSetIcon(em)}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>

      <div className="w-full text-xs font-medium text-slate-800 text-center leading-tight">
        <InlineText value={item.name} onSave={onRename} ariaLabel="item name" />
      </div>
      <div className="w-full text-sm font-bold text-amber-600 text-center">
        <InlinePrice cents={item.priceCentavos} onSave={onReprice} ariaLabel="item price" />
      </div>
    </div>
  );
}
