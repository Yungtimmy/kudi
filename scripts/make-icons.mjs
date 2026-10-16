import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

function crc(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc(body), 8 + data.length);
  return out;
}

function inRoundRect(x, y, size, radius) {
  const r = radius;
  const max = size - 1;
  if (x >= r && x <= max - r) return true;
  if (y >= r && y <= max - r) return true;
  const cx = x < r ? r : max - r;
  const cy = y < r ? r : max - r;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function distToSeg(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby)));
  const dx = px - (ax + abx * t);
  const dy = py - (ay + aby * t);
  return dx * dx + dy * dy;
}

function paint(x, y, size) {
  const n = size;
  if (!inRoundRect(x, y, n, n * 0.22)) return [0, 0, 0, 0];
  const nx = x / n;
  const ny = y / n;
  const stem = nx > 0.28 && nx < 0.40 && ny > 0.22 && ny < 0.78;
  const upper = distToSeg(nx, ny, 0.34, 0.48, 0.70, 0.24) < 0.0032;
  const lower = distToSeg(nx, ny, 0.34, 0.50, 0.70, 0.76) < 0.0032;
  const dx = nx - 0.66;
  const dy = ny - 0.20;
  if (dx * dx + dy * dy < 0.012) return [242, 140, 40, 255];
  if (stem || upper || lower) return [255, 255, 255, 255];
  return [14, 124, 74, 255];
}

function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = paint(x, y, size);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

writeFileSync(new URL("../public/icon-192.png", import.meta.url), png(192));
writeFileSync(new URL("../public/icon-512.png", import.meta.url), png(512));
console.log("icons written");
