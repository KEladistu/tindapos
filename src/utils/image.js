/** Placeholder helpers for image handling. Photo capture lands in a later phase. */
export async function fileToBlob(file) {
    return file;
}
export function blobToObjectUrl(blob) {
    return URL.createObjectURL(blob);
}
