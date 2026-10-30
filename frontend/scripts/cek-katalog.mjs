// Memastikan tiap PRD bawaan lengkap: isian wajib terisi, minimal 3 target pengguna, tiap peran punya alur dan
// daftar "tidak bisa", tiap kebutuhan P0 punya kriteria penerimaan, tiap gaya punya design brief yang kontrasnya
// cukup, dan dokumen yang dihasilkan lolos pemeriksa struktur tanpa catatan.
// Jalankan dari folder frontend: node scripts/cek-katalog.mjs
import { BLOK, GAYA, T, TPL_IDS } from '../src/lib/catalog.js';
import { NADA_STATUS, checkPrd, fromBuiltin, genMd, kontras } from '../src/lib/prd.js';

const salah = [];
for (const [k, g] of Object.entries(GAYA)) {
  for (const f of ['nama', 'ciri', 'huruf', 'nada', 'gambar', 'hindari', 'cocok']) if (!g[f]) salah.push(`gaya ${k}: "${f}" kosong`);
  if (!/^#[0-9a-f]{6}$/i.test(g.latar) || !/^#[0-9a-f]{6}$/i.test(g.teks)) salah.push(`gaya ${k}: latar atau teks bukan warna hex`);
}

// Gaya dari data: teks harus sangat terbaca di latar, teks redup minimal 4,5:1 di latar dan di kartu.
for (const [k, g] of Object.entries(GAYA)) {
  if (!g.t) continue;
  if (kontras(g.teks, g.latar) < 7) salah.push(`gaya ${k}: teks di latar hanya ${kontras(g.teks, g.latar).toFixed(2)}:1, minimal 7`);
  for (const [n, w] of [['latar', g.latar], ['kartu', g.t.surface]]) {
    const r = kontras(g.t.muted, w);
    if (r < 4.5) salah.push(`gaya ${k}: teks redup di ${n} hanya ${r.toFixed(2)}:1`);
  }
}

// Label status: teks berwarna di atas latar warna yang sama 12% harus kontras minimal 4,5:1 di latar tiap gaya.
const hex = (n) => n.toString(16).padStart(2, '0');
const campur = (a, b, k) => '#' + [1, 3, 5].map((i) => hex(Math.round(parseInt(a.slice(i, i + 2), 16) * k + parseInt(b.slice(i, i + 2), 16) * (1 - k)))).join('');
for (const [k, g] of Object.entries(GAYA)) {
  const gelap = kontras(g.latar, '#000000') < kontras(g.latar, '#ffffff');
  for (const [n, , terang, warnaGelap] of NADA_STATUS) {
    const w = gelap ? warnaGelap : terang, r = kontras(w, campur(w, g.latar, 0.12));
    if (r < 4.5) salah.push(`gaya ${k}: label status ${n} ${w} hanya ${r.toFixed(2)}:1`);
  }
}

// Urutan pola warna status: kata yang mengandung kata lain harus jatuh ke warna yang benar.
for (const [v, n] of [['Tidak hadir', 'merah'], ['Belum dinilai', 'kuning'], ['Persiapan 82%', 'biru'], ['Siap antar', 'hijau'], ['Diverifikasi', 'hijau'], ['Perlu verifikasi', 'kuning'], ['Nonaktif', 'abu']])
  if (NADA_STATUS.find((x) => x[4].test(v))[0] !== n) salah.push(`status "${v}" seharusnya ${n}`);

for (const id of TPL_IDS) {
  const t = T[id], d = t.d, p = (m) => salah.push(`${id}: ${m}`);
  for (const f of ['nama', 'kategori', 'ringkas', 'desain']) if (!t[f]) p(`"${f}" kosong`);
  if (!t.cocok?.length) p('"cocok" kosong');
  for (const f of ['nama', 'tagline', 'cta', 'deskripsi', 'masalah']) if (!d[f]) p(`"d.${f}" kosong`);
  for (const f of ['audiens', 'tujuan', 'metrik', 'luar', 'data', 'peran', 'fitur', 'alur', 'blok']) if (!d[f]?.length) p(`"d.${f}" kosong`);
  if (!GAYA[d.gaya]) p(`gaya "${d.gaya}" tidak dikenal`);
  if (!/^#[0-9a-f]{6}$/i.test(d.warna)) p(`warna "${d.warna}" bukan warna hex`);
  d.blok.forEach((b) => BLOK[b] || p(`blok "${b}" tidak dikenal`));
  if (d.audiens.length < 3) p(`baru ${d.audiens.length} kelompok target pengguna, minimal 3`);
  d.peran.forEach(([n, , , , tidak, hal]) => {
    if (!hal?.length) p(`peran "${n}" belum punya halaman`);
    if (!tidak?.length) p(`peran "${n}" belum punya daftar "tidak bisa"`);
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
