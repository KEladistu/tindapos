/**
 * PIN hashing via PBKDF2-SHA256 through WebCrypto.
 * 100k iterations, 32-byte key. All strings base64url.
 */

const ITERATIONS = 100_000;
const KEY_LEN_BITS = 256;

function toB64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  for (let i = 0; i < arr.byteLength; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromB64Url(s: string): Uint8Array {
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b.length % 4 === 0 ? '' : '='.repeat(4 - (b.length % 4));
  const bin = atob(b + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function randomSalt(): string {
  const raw = new Uint8Array(16);
  crypto.getRandomValues(raw);
  return toB64Url(raw);
}

export async function hashPin(pin: string, saltB64: string): Promise<string> {
  const enc = new TextEncoder();
  const saltRaw = fromB64Url(saltB64);
  const saltBuf = new ArrayBuffer(saltRaw.byteLength);
  new Uint8Array(saltBuf).set(saltRaw);
  const salt = saltBuf;
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
    key,
    KEY_LEN_BITS
  );
  return toB64Url(bits);
}

export async function verifyPin(pin: string, hash: string, salt: string): Promise<boolean> {
  const computed = await hashPin(pin, salt);
  // constant-time-ish compare
  if (computed.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ hash.charCodeAt(i);
  return diff === 0;
}
