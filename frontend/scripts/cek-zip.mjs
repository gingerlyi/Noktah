// Memastikan pembuat ZIP (src/lib/zip.js) menghasilkan arsip yang benar: CRC32 sesuai nilai baku
// dan isi berkas bisa dibaca ulang dari arsipnya. Jalankan dari folder frontend: node scripts/cek-zip.mjs
import assert from 'node:assert/strict';
import { crc32, zip } from '../src/lib/zip.js';

const enc = new TextEncoder();
assert.equal(crc32(enc.encode('123456789')), 0xcbf43926);

const files = [
  { name: 'PRD.md', text: '# PRD: Kopi Senja\n' },
  { name: 'prompts/01-fondasi.md', text: 'Fondasi — dengan huruf non-ASCII: é, ✓\n' },
];
const buf = new DataView(await zip(files).arrayBuffer());
const dec = new TextDecoder();

// Baca direktori pusat dari catatan akhir, lalu ambil tiap berkas lewat header lokalnya.
const end = buf.byteLength - 22;
assert.equal(buf.getUint32(end, true), 0x06054b50);
assert.equal(buf.getUint16(end + 10, true), files.length);
let at = buf.getUint32(end + 16, true);
for (const f of files) {
  assert.equal(buf.getUint32(at, true), 0x02014b50);
  const size = buf.getUint32(at + 20, true);
  const nameLen = buf.getUint16(at + 28, true);
  const local = buf.getUint32(at + 42, true);
  assert.equal(dec.decode(new Uint8Array(buf.buffer, at + 46, nameLen)), f.name);
  const data = new Uint8Array(buf.buffer, local + 30 + nameLen, size);
  assert.equal(dec.decode(data), f.text);
  assert.equal(crc32(data), buf.getUint32(local + 14, true));
  at += 46 + nameLen;
}
console.log('zip OK');
