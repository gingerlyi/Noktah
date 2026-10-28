// Paket prompt untuk AI builder: PRD dipecah menjadi fase kerja yang bisa ditempel satu per satu,
// ditambah daftar periksa. Fase: fondasi, satu fase per peran (P0 lalu P1), lalu penyempurnaan (P2 dan NFR).
import { GAYA, T, nfrFor } from './catalog.js';
import { SEMUA, alurAktif, fiturAktif, halamanPeran, lines, peranAktif, skalaHuruf, slug } from './prd.js';

export const ALAT = {
  lovable: { nama: 'Lovable', buka: 'Kamu membangun aplikasi ini di Lovable.' },
  bolt: { nama: 'Bolt', buka: 'Kamu membangun aplikasi ini di Bolt.new.' },
  v0: { nama: 'v0', buka: 'Kamu membangun aplikasi ini di v0 by Vercel.' },
  agen: { nama: 'Cursor / Claude Code', buka: 'Kamu adalah agen koding yang bekerja di repositori proyek ini.' },
};

const one = (v) => String(v || '').replace(/\s*\n\s*/g, ' ').trim();
const pad = (n) => String(n).padStart(2, '0');
const daftar = (a) => a.map((x) => '- ' + x).join('\n');

export function buatPrompt(s, alat = 'lovable') {
  const t = T[s.tpl];
  const mobile = t.platform === 'mobile';
  const unit = mobile ? 'layar' : 'halaman';
  const roles = peranAktif(s);
  const feats = fiturAktif(s);
  const fr = (f) => 'FR-' + pad(feats.indexOf(f) + 1);
  const milik = (f, id) => f.r.includes(SEMUA) || f.r.includes(id);
  const g = GAYA[s.gaya] || GAYA.bersih;
  const nama = one(s.nama) || 'proyek ini';
  const buka = `${ALAT[alat].buka} Dokumen PRD "${nama}" terlampir; ikuti PRD itu bila ada yang berbeda dengan ringkasan di bawah.`;
  const blokFitur = (f) => [`### ${fr(f)} ${one(f.n)} (${f.p})`, one(f.d), ...lines(f.k).map((k) => '- [ ] ' + k)].join('\n');

  const fase = [];
  fase.push({
    judul: 'Fondasi proyek',
    isi: [
      buka,
      `Tugas fase ini: siapkan fondasi ${mobile ? 'aplikasi mobile' : 'website'} "${nama}" tanpa membangun fitur dulu.`,
      `## Produk\n${one(s.deskripsi)}`,
      `## Teknologi\n${s.stack || 'Bebas, pilih yang paling sesuai.'}`,
      `## Tampilan\n- Gaya: ${g.nama}. ${g.ciri}\n- Huruf: ${g.huruf}\n- Warna: merek ${s.warna}, latar ${g.latar}, teks ${g.teks}\n- Gambar dan ikon: ${g.gambar}\n- Hindari: ${g.hindari}\n- Ukuran: huruf ${skalaHuruf(s).map(([n, px]) => `${n} ${px} px`).join(', ')}; sudut ${g.sudut} px, garis ${g.garis} px\n- Komponen, label status, dan keadaan kosong, memuat, dan galat: ikuti bagian Desain di PRD\n- Nada bahasa: ${g.nada}\n- Bahasa antarmuka: Indonesia`,
      `## Peran dan cara masuk\n${daftar(roles.map((r) => `${one(r.n)}: ${one(r.m) || 'tanpa akun'}`))}`,
      lines(s.data).length ? `## Data utama\n${daftar(lines(s.data))}` : '',
      '## Yang harus selesai',
      daftar([
        'Struktur proyek, routing, dan tata letak dasar dengan warna dan huruf di atas',
        'Model data dan migrasi untuk data utama',
        'Login sesuai cara masuk tiap peran, dan pembatasan akses: ' + unit + ' milik suatu peran hanya bisa dibuka peran itu',
        `Kerangka kosong untuk semua ${unit} (isi menyusul di fase berikutnya)`,
      ]),
      'Setelah selesai, jelaskan singkat apa yang dibuat dan tunggu prompt fase berikutnya.',
    ]
      .filter(Boolean)
      .join('\n\n'),
  });

  roles.forEach((r) => {
    const hal = halamanPeran(s, r.id);
    const fit = feats.filter((f) => milik(f, r.id) && f.p !== 'P2');
    const alur = alurAktif(s).filter((a) => a.r === r.id);
    fase.push({
      judul: 'Peran ' + one(r.n),
      peran: r.n,
      hal,
      fit,
      alur,
      isi: [
        buka,
        `Tugas fase ini: bangun semua yang dipakai peran **${one(r.n)}** (${one(r.d)}). Kerjakan P0 dulu, lalu P1.`,
        `## Hak akses ${one(r.n)}\nBisa:\n${daftar(lines(r.b))}` + (lines(r.t).length ? `\n\nTidak bisa:\n${daftar(lines(r.t))}` : ''),
        hal.length ? `## ${mobile ? 'Layar' : 'Halaman'}\n${hal.map((h, i) => `${i + 1}. ${one(h.n)}`).join('\n')}` : '',
        fit.length ? `## Kebutuhan fungsional\n${fit.map(blokFitur).join('\n\n')}` : '',
        alur.length ? `## Alur yang harus berjalan dari awal sampai akhir\n${alur.map((a) => `### ${one(a.n)}\n${lines(a.l).map((l, i) => `${i + 1}. ${l}`).join('\n')}`).join('\n\n')}` : '',
        'Setelah selesai, periksa setiap kriteria penerimaan di atas, laporkan yang belum terpenuhi, lalu tunggu prompt berikutnya.',
      ]
        .filter(Boolean)
        .join('\n\n'),
    });
  });

  const p2 = feats.filter((f) => f.p === 'P2');
  const nfrs = nfrFor(t.platform).filter(([id]) => s.nfr.some((x) => x.id === id && x.on));
  fase.push({
    judul: 'Penyempurnaan',
    fit: p2,
    isi: [
      buka,
      'Tugas fase ini: lengkapi kebutuhan P2 dan pastikan kebutuhan non-fungsional terpenuhi di seluruh aplikasi.',
      p2.length ? `## Kebutuhan P2\n${p2.map(blokFitur).join('\n\n')}` : '',
      nfrs.length ? `## Kebutuhan non-fungsional\n${daftar(nfrs.map(([, n, d]) => `**${n}:** ${d}`))}` : '',
      `## Pemeriksaan akhir\n${daftar(['Jalankan ulang semua alur utama di PRD dari awal sampai akhir untuk tiap peran', `Coba buka ${unit} milik peran lain tanpa hak akses: harus ditolak`, 'Perbaiki galat yang ditemukan, lalu laporkan ringkasan hasilnya'])}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
  });
  return fase;
}

// Daftar periksa untuk memantau progres pembangunan, satu bagian per fase.
export function buatChecklist(s, fase) {
  const feats = fiturAktif(s);
  const o = [`# Daftar periksa: ${one(s.nama)}`, ''];
  fase.forEach((f, i) => {
    o.push(`## Fase ${i + 1}: ${f.judul}`);
    if (i === 0) o.push('- [ ] Fondasi, login, model data, dan kerangka semua halaman');
    (f.hal || []).forEach((h) => o.push(`- [ ] Halaman: ${one(h.n)}`));
    (f.fit || []).forEach((x) => o.push(`- [ ] FR-${pad(feats.indexOf(x) + 1)} ${one(x.n)} (${x.p})`));
    (f.alur || []).forEach((a) => o.push(`- [ ] Alur berjalan: ${one(a.n)}`));
    o.push('');
  });
  return o.join('\n');
}

export const namaBerkas = (s) => 'prd-' + slug(s);
