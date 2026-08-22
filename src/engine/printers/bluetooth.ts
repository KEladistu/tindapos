import type { ReceiptOutput } from './browser';
import type { ReceiptData } from '../receipt-render';
import { renderReceiptText } from '../receipt-render';

// Common ESC/POS 58mm printer service UUID (Xprinter/Goojprt use SPP over BLE variants);
// this is best-effort — real hardware varies. We use the printerService approach with a wildcard.
const SERVICE_UUID = 0x18f0; // common for ESC/POS BLE printers
const CHAR_UUID = 0x2af1;

function encodeESCPOS(text: string): Uint8Array {
  const enc = new TextEncoder();
  const reset = new Uint8Array([0x1b, 0x40]);
  const body = enc.encode(text + '\n\n\n');
  const cut = new Uint8Array([0x1d, 0x56, 0x42, 0x00]);
  const out = new Uint8Array(reset.length + body.length + cut.length);
  out.set(reset, 0);
  out.set(body, reset.length);
  out.set(cut, reset.length + body.length);
  return out;
}

async function connect(): Promise<{ char: any; device: any; }> {
  const nav = navigator as unknown as { bluetooth: { requestDevice: (o: unknown) => Promise<any> } };
  const device = await nav.bluetooth.requestDevice({
    filters: [{ services: [SERVICE_UUID] }],
    optionalServices: [SERVICE_UUID]
  });
  const server = await device.gatt!.connect();
  const svc = await server.getPrimaryService(SERVICE_UUID);
  const char = await svc.getCharacteristic(CHAR_UUID);
  return { char, device };
}

export const bluetoothPrinter: ReceiptOutput = {
  name: 'Bluetooth Printer',
  available() { return typeof navigator !== 'undefined' && 'bluetooth' in navigator; },
  async print(r: ReceiptData) {
    const { char } = await connect();
    const data = encodeESCPOS(renderReceiptText(r));
    // Chunk to 180 bytes per write
    const chunk = 180;
    for (let i = 0; i < data.length; i += chunk) {
      const slice = data.slice(i, Math.min(i + chunk, data.length));
      await char.writeValueWithoutResponse!(slice);
    }
  }
};
