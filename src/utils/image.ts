import { db } from '../db/schema';

/** Generate a compact id (used for photo blob ids). */
function uid(prefix = 'ph'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Convert a File/Blob to an ImageBitmap (or HTMLImageElement fallback). */
async function toBitmap(src: File | Blob): Promise<{ w: number; h: number; draw: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, dw: number, dh: number) => void; close?: () => void; }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(src);
      return {
        w: bmp.width,
        h: bmp.height,
        draw: (ctx, dw, dh) => ctx.drawImage(bmp as unknown as CanvasImageSource, 0, 0, dw, dh),
        close: () => bmp.close?.()
      };
    } catch {
      // fall through
    }
  }
  // Fallback: HTMLImageElement
  const url = URL.createObjectURL(src);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to decode image'));
      el.src = url;
    });
    return {
      w: img.naturalWidth,
      h: img.naturalHeight,
      draw: (ctx, dw, dh) => ctx.drawImage(img, 0, 0, dw, dh)
    };
  } finally {
    // We can't revoke here since draw is called later; revoke after resize completes.
    // Return a close that revokes.
    // eslint-disable-next-line no-unsafe-finally
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
}

/** Resize an image blob to at most maxEdge on longest edge, encoded as JPEG. */
export async function resizeImageBlob(file: File | Blob, maxEdge = 512, quality = 0.85): Promise<Blob> {
  const bmp = await toBitmap(file);
  const { w, h } = bmp;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const dw = Math.max(1, Math.round(w * scale));
  const dh = Math.max(1, Math.round(h * scale));

  // Prefer OffscreenCanvas
  if (typeof OffscreenCanvas !== 'undefined') {
    try {
      const oc = new OffscreenCanvas(dw, dh);
      const ctx = oc.getContext('2d');
      if (!ctx) throw new Error('no 2d context');
      bmp.draw(ctx, dw, dh);
      bmp.close?.();
      const blob: Blob = await oc.convertToBlob({ type: 'image/jpeg', quality });
      return blob;
    } catch {
      // fall through to HTMLCanvasElement
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas 2d context');
  bmp.draw(ctx, dw, dh);
  bmp.close?.();
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('canvas.toBlob returned null'))),
      'image/jpeg',
      quality
    );
  });
  return blob;
}

/** Save a photo blob to the photos table and return the assigned id. */
export async function savePhoto(blob: Blob): Promise<string> {
  const id = uid('ph');
  await db.photos.put({ id, blob });
  return id;
}

/** Load a photo id → object URL. Caller MUST revoke via URL.revokeObjectURL when unused. */
export async function loadPhotoURL(id: string): Promise<string | null> {
  const row = await db.photos.get(id);
  if (!row) return null;
  return URL.createObjectURL(row.blob);
}

/** Legacy helpers kept for compatibility. */
export async function fileToBlob(file: File): Promise<Blob> {
  return file;
}
export function blobToObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
