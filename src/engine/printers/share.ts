import type { ReceiptOutput } from './browser';
import type { ReceiptData } from '../receipt-render';
import { renderReceiptText } from '../receipt-render';

async function textToImageBlob(text: string): Promise<Blob> {
  const lines = text.split('\n');
  const W = 384; // ~58mm at 203dpi
  const line = 20;
  const H = Math.max(200, lines.length * line + 40);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#000';
  ctx.font = '14px monospace';
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, 12, 20 + i * line));
  return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
}

export const shareImagePrinter: ReceiptOutput = {
  name: 'Share as image',
  available() { return typeof navigator !== 'undefined' && 'share' in navigator; },
  async print(r: ReceiptData) {
    const blob = await textToImageBlob(renderReceiptText(r));
    const file = new File([blob], `receipt-${r.sale.id.slice(-6)}.png`, { type: 'image/png' });
    const nav = navigator as unknown as { share?: (d: unknown) => Promise<void>; canShare?: (d: unknown) => boolean };
    if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
      await nav.share({ files: [file], title: 'Receipt' });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = file.name; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
};

export const shareTextPrinter: ReceiptOutput = {
  name: 'Share as text',
  available() {
    return typeof navigator !== 'undefined' && (('share' in navigator) || !!(navigator as any).clipboard);
  },
  async print(r: ReceiptData) {
    const text = renderReceiptText(r);
    const nav = navigator as unknown as { share?: (d: unknown) => Promise<void> };
    if (nav.share) {
      try { await nav.share({ text, title: 'Receipt' }); return; } catch {}
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      alert('Receipt copied to clipboard');
    }
  }
};
