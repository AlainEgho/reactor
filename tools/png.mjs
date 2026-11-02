// A PNG from raw RGBA pixels, with no image library. rgb drops the alpha channel, which Google Play
// and the App Store require of listing images and icons (a "24-bit PNG, no alpha").
import { deflateSync, crc32 } from 'node:zlib';

export function png(w, h, rgba, rgb) {
  const ch = rgb ? 3 : 4, raw = Buffer.alloc((w * ch + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * ch + 1)] = 0;
    for (let x = 0; x < w; x++) for (let i = 0; i < ch; i++) raw[y * (w * ch + 1) + 1 + x * ch + i] = rgba[(y * w + x) * 4 + i];
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]), crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = rgb ? 2 : 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// Pixels come out of the browser as a base64 string (far lighter than a JSON array of numbers).
export function pngFromBase64(w, h, b64, rgb) {
  return png(w, h, Buffer.from(b64, 'base64'), rgb);
}
