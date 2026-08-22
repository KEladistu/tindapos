import { useEffect, useRef, useState } from 'react';
import { formatPHP, toCentavos } from '../../engine/money';

interface Props {
  cents: number;
  onSave: (cents: number) => void;
  className?: string;
  ariaLabel?: string;
}

export function InlinePrice({ cents, onSave, className, ariaLabel }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>((cents / 100).toFixed(2));
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { setDraft((cents / 100).toFixed(2)); }, [cents]);
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const cleaned = draft.replace(/[₱,\s]/g, '');
    const pesos = parseFloat(cleaned);
    if (!isNaN(pesos) && pesos >= 0) {
      const c = toCentavos(pesos);
      if (c !== cents) onSave(c);
    }
    setDraft((cents / 100).toFixed(2));
  };
  const cancel = () => {
    setEditing(false);
    setDraft((cents / 100).toFixed(2));
  };

  if (!editing) {
    return (
      <span
        className={`${className ?? ''} cursor-text hover:bg-amber-50 rounded px-1`}
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {formatPHP(cents)}
      </span>
    );
  }
  return (
    <input
      ref={inputRef}
      aria-label={ariaLabel}
      inputMode="decimal"
      className={`${className ?? ''} bg-white border border-amber-400 rounded px-1 w-full text-right`}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    />
  );
}
