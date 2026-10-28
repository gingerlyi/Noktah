// Berkas ZIP sederhana tanpa kompresi (metode "stored"), cukup untuk beberapa berkas teks.
// ponytail: tanpa kompresi dan tanpa ZIP64; isi paket prompt hanya puluhan KB, jadi tidak perlu pustaka zip.
const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

export function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// files: [{ name, text }] → Blob application/zip
export function zip(files) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const data = enc.encode(f.text);
    const crc = crc32(data);
    const head = new DataView(new ArrayBuffer(30));
    // tanda, versi 2.0, bendera UTF-8 (bit 11), stored, waktu dan tanggal 0, crc, ukuran, panjang nama
    [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [14, crc, 4], [18, data.length, 4], [22, data.length, 4], [26, name.length, 2]].forEach(
      ([at, v, n]) => (n === 4 ? head.setUint32(at, v, true) : head.setUint16(at, v, true)),
    );
    parts.push(head, name, data);
    const cen = new DataView(new ArrayBuffer(46));
    [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [16, crc, 4], [20, data.length, 4], [24, data.length, 4], [28, name.length, 2], [42, offset, 4]].forEach(
      ([at, v, n]) => (n === 4 ? cen.setUint32(at, v, true) : cen.setUint16(at, v, true)),
    );
    central.push(cen, name);
    offset += 30 + name.length + data.length;
  }
  const size = central.reduce((n, p) => n + p.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  [[0, 0x06054b50, 4], [8, files.length, 2], [10, files.length, 2], [12, size, 4], [16, offset, 4]].forEach(([at, v, n]) =>
    n === 4 ? end.setUint32(at, v, true) : end.setUint16(at, v, true),
  );
  return new Blob([...parts, ...central, end], { type: 'application/zip' });
}
