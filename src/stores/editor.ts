import { create } from 'zustand';
import type { UndoOp } from './catalog';
import { db } from '../db/schema';

const MAX_UNDO = 10;

export type ColumnCount = 2 | 3 | 4;

interface EditorState {
  enabled: boolean;
  columns: ColumnCount;
  undoStack: UndoOp[];
  toggle: () => void;
  setEnabled: (v: boolean) => void;
  setColumns: (n: ColumnCount) => void;
  pushUndo: (op: UndoOp | null | undefined) => void;
  undo: () => Promise<void>;
  clearUndo: () => void;
}

async function persistColumns(n: ColumnCount) {
  try { await db.settings.put({ key: 'editor.columns', value: n }); } catch { /* ignore */ }
}

export const useEditor = create<EditorState>((set, get) => ({
  enabled: false,
  columns: 3,
  undoStack: [],
  toggle() { set({ enabled: !get().enabled }); },
  setEnabled(v) { set({ enabled: v }); },
  setColumns(n) {
    set({ columns: n });
    void persistColumns(n);
  },
  pushUndo(op) {
    if (!op) return;
    const next = [...get().undoStack, op];
    if (next.length > MAX_UNDO) next.splice(0, next.length - MAX_UNDO);
    set({ undoStack: next });
  },
  async undo() {
    const stack = get().undoStack;
    if (stack.length === 0) return;
    const op = stack[stack.length - 1];
    set({ undoStack: stack.slice(0, -1) });
    try { await op.inverse(); } catch (e) { console.error('undo failed', e); }
  },
  clearUndo() { set({ undoStack: [] }); }
}));

/** Hydrate persisted editor settings (columns). */
export async function hydrateEditorSettings() {
  try {
    const row = await db.settings.get('editor.columns');
    const v = row?.value as ColumnCount | undefined;
    if (v === 2 || v === 3 || v === 4) useEditor.setState({ columns: v });
  } catch { /* ignore */ }
}
