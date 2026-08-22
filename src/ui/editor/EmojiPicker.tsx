import { useEffect, useRef } from 'react';

/** ~60 curated food / drink / household emojis for sari-sari inventory. */
export const EMOJIS: string[] = [
  '🍚','🍞','🥖','🥐','🥯','🥨','🥞','🧇','🧀','🥓',
  '🍳','🍔','🍟','🌭','🍕','🥙','🌮','🌯','🥗','🍝',
  '🍜','🍲','🍛','🍣','🍱','🥟','🍤','🍙','🍘','🍥',
  '🥮','🍢','🍡','🍧','🍨','🍦','🥧','🍰','🎂','🍮',
  '🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛',
  '🍼','☕','🍵','🧃','🥤','🧋','🍶','🍺','🍷','🍹',
  '🧴','🧼','🧻','🧽','🪥','🧯','🕯️','🔋','📦','🛒'
];

interface Props {
  value?: string;
  onPick: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ value, onPick, onClose }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-40 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 w-64 max-h-56 overflow-y-auto grid grid-cols-8 gap-1"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => { onPick(e); onClose(); }}
          className={`text-xl h-8 w-8 flex items-center justify-center rounded hover:bg-amber-100 ${value === e ? 'bg-amber-200' : ''}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
