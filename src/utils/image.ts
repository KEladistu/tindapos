/** Placeholder helpers for image handling. Photo capture lands in a later phase. */
export async function fileToBlob(file: File): Promise<Blob> {
  return file;
}

export function blobToObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
