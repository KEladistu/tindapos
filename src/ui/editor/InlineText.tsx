import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
}

export function InlineText({ value, onSave, className, placeholder, ariaLabel }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const v = draft.trim();
    if (v && v !== value) onSave(v);
    else setDraft(value);
  };
  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  if (!editing) {
    return (
      <span
        className={`${className ?? ''} cursor-text hover:bg-amber-50 rounded px-1`}
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {value || <span className="text-slate-400">{placeholder ?? '—'}</span>}
      </span>
    );
  }
  return (
    <input
      ref={inputRef}
      aria-label={ariaLabel}
      className={`${className ?? ''} bg-white border border-amber-400 rounded px-1 w-full`}
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
