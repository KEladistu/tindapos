import { useEditor } from '../../stores/editor';
import { useT } from '../../i18n';

export function EditorToolbar() {
  const t = useT();
  const columns = useEditor((s) => s.columns);
  const setColumns = useEditor((s) => s.setColumns);
  const undoStack = useEditor((s) => s.undoStack);
  const undo = useEditor((s) => s.undo);
  const toggle = useEditor((s) => s.toggle);

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 flex flex-wrap items-center gap-2 text-sm">
      <div className="font-semibold text-amber-800">{t('editor.editingBadge')}</div>
      <div className="flex items-center gap-1 ml-2">
        <span className="text-xs text-slate-600">{t('editor.columns')}:</span>
        {[2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => setColumns(n as 2 | 3 | 4)}
            className={`min-h-[36px] px-2 rounded ${columns === n ? 'bg-amber-500 text-white' : 'bg-white border border-slate-300'}`}
          >
            {n}
          </button>
        ))}
      </div>
      <button
        onClick={() => void undo()}
        disabled={undoStack.length === 0}
        className={`min-h-[36px] px-3 rounded border ${undoStack.length === 0 ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-300 hover:bg-amber-100'}`}
        title="Ctrl/Cmd+Z"
      >
        {t('editor.undo')} ({undoStack.length})
      </button>
      <button
        onClick={toggle}
        className="ml-auto min-h-[36px] px-3 rounded bg-slate-800 text-white hover:bg-slate-700"
      >
        {t('editor.exit')}
      </button>
    </div>
  );
}
