// Memastikan tiap PRD bawaan lengkap: isian wajib terisi, tiap peran punya alur, tiap kebutuhan P0 punya kriteria
// penerimaan, tiap gaya punya design brief, dan dokumen yang dihasilkan lolos pemeriksa struktur tanpa catatan.
// Jalankan dari folder frontend: node scripts/cek-katalog.mjs
import { BLOK, GAYA, T, TPL_IDS } from '../src/lib/catalog.js';
import { checkPrd, fromBuiltin, genMd } from '../src/lib/prd.js';

const salah = [];
for (const [k, g] of Object.entries(GAYA)) {
  for (const f of ['nama', 'ciri', 'huruf', 'nada', 'gambar', 'hindari', 'cocok']) if (!g[f]) salah.push(`gaya ${k}: "${f}" kosong`);
  if (!/^#[0-9a-f]{6}$/i.test(g.latar) || !/^#[0-9a-f]{6}$/i.test(g.teks)) salah.push(`gaya ${k}: latar atau teks bukan warna hex`);
}

for (const id of TPL_IDS) {
  const t = T[id], d = t.d, p = (m) => salah.push(`${id}: ${m}`);
  for (const f of ['nama', 'kategori', 'ringkas', 'desain']) if (!t[f]) p(`"${f}" kosong`);
  if (!t.cocok?.length) p('"cocok" kosong');
  for (const f of ['nama', 'tagline', 'cta', 'deskripsi', 'masalah']) if (!d[f]) p(`"d.${f}" kosong`);
  for (const f of ['audiens', 'tujuan', 'metrik', 'luar', 'data', 'peran', 'fitur', 'alur', 'blok']) if (!d[f]?.length) p(`"d.${f}" kosong`);
  if (!GAYA[d.gaya]) p(`gaya "${d.gaya}" tidak dikenal`);
  if (!/^#[0-9a-f]{6}$/i.test(d.warna)) p(`warna "${d.warna}" bukan warna hex`);
  d.blok.forEach((b) => BLOK[b] || p(`blok "${b}" tidak dikenal`));
  d.peran.forEach(([n, , , , , hal]) => {
    if (!hal?.length) p(`peran "${n}" belum punya halaman`);
    if (!d.alur.some((a) => a[1] === n)) p(`peran "${n}" belum punya alur`);
  });
  d.fitur.forEach(([n, , pr, , k]) => pr === 'P0' && !k?.length && p(`kebutuhan P0 "${n}" belum punya kriteria penerimaan`));
  checkPrd(genMd(fromBuiltin(id))).forEach((x) => p(`${x.level}: ${x.msg}`));
}

if (salah.length) {
  console.error(salah.join('\n'));
  process.exit(1);
}
console.log(`Katalog lengkap: ${TPL_IDS.length} PRD dan ${Object.keys(GAYA).length} gaya.`);
