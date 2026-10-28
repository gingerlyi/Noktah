// Memastikan nilai mutu PRD (src/lib/nilai.js) masuk akal: bobot berjumlah 100, PRD bawaan yang diberi nama
// sendiri bernilai tinggi, dan nilainya turun bila isi penting dihapus. Jalankan dari folder frontend: node scripts/cek-nilai.mjs
import assert from 'node:assert/strict';
import { TPL_IDS } from '../src/lib/catalog.js';
import { checkPrd, fromBuiltin, genMd } from '../src/lib/prd.js';
import { nilaiPrd } from '../src/lib/nilai.js';

const nilai = (s) => nilaiPrd(s, checkPrd(genMd(s)));
const milikku = (id) => ({ ...fromBuiltin(id), nama: 'Usaha Saya' });

assert.equal(nilai(milikku('klinik')).kriteria.reduce((n, k) => n + k.bobot, 0), 100);
const semua = TPL_IDS.map((id) => [id, nilai(milikku(id)).nilai]).sort((a, b) => a[1] - b[1]);
console.log('terendah:', semua.slice(0, 5).map((x) => x.join(' ')).join(', '));
assert.ok(semua[0][1] >= 70, 'PRD bawaan seharusnya minimal "Hampir siap"');

const asli = nilai(fromBuiltin('klinik')).nilai;
assert.ok(asli < nilai(milikku('klinik')).nilai, 'nama contoh seharusnya mengurangi nilai');
const kosong = { ...milikku('klinik'), metrik: '', luar: '', fitur: milikku('klinik').fitur.map((f) => ({ ...f, k: '' })) };
assert.ok(nilai(kosong).nilai <= nilai(milikku('klinik')).nilai - 25, 'menghapus metrik, batas lingkup, dan kriteria seharusnya menurunkan nilai jauh');
console.log('nilai OK');
