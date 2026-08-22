import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[95vh]">
        {title && (
          <div className="px-4 py-3 border-b border-slate-200 flex items-center">
            <div className="font-semibold text-lg">{title}</div>
            <button className="ml-auto btn-ghost min-h-[36px] px-3" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        )}
        <div className="p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
