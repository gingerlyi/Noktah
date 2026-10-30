// Paket prompt untuk AI builder: PRD dipecah menjadi fase kerja yang bisa ditempel satu per satu,
// ditambah daftar periksa. Fase: fondasi, satu fase per peran (P0 lalu P1), lalu penyempurnaan (P2 dan NFR).
import { GAYA, T, nfrFor } from './catalog.js';
import { SEMUA, alurAktif, briefDesain, fiturAktif, halamanPeran, lines, peranAktif, skalaHuruf, slug } from './prd.js';

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
  const b = briefDesain(s);
  const cta = one(s.cta) || 'Mulai';
  // Standar mutu tampilan di tiap fase, supaya hasil AI builder terlihat seperti produk jadi, bukan wireframe.
  const mutu = `## Standar tampilan (wajib: ini produk jadi, bukan wireframe)
- Tanpa kotak abu-abu pengganti gambar, lorem ipsum, atau teks seperti "Judul di sini". Isi dengan data contoh yang realistis dalam bahasa Indonesia: nama orang dan tempat, harga dalam Rupiah, tanggal, dan status. Daftar berisi 6 sampai 12 item yang beragam.
- Gambar sungguhan sesuai arahan gambar di atas (foto dari Unsplash atau ilustrasi), dipotong rapi dengan rasio tetap. Ikon dari satu set yang konsisten, misalnya Lucide; jangan memakai emoji sebagai ikon.
- Terapkan ciri gaya ${g.nama.toLowerCase()} sampai ke detail: bayangan, garis, sudut, tekstur, dan warna latar bagian. Beri kedalaman dengan bayangan lembut, lapisan permukaan, atau aksen warna, kecuali gaya ini memang meminta tampilan datar (lihat Hindari).
- Hierarki jelas: satu fokus utama per ${unit}, judul besar, jarak antarbagian konsisten, teks sekunder lebih redup. Kartu dan daftar punya isi yang kaya: gambar atau ikon, judul, keterangan, label status, dan aksi.
- Setiap elemen interaktif punya keadaan hover, tekan, fokus keyboard yang terlihat, dan nonaktif, dengan transisi halus 150 sampai 200 ms. Pakai skeleton saat memuat, dan keadaan kosong dengan ilustrasi kecil, satu kalimat penjelas, dan tombol aksi.
- ${mobile ? 'Rancang untuk layar 360 sampai 430 px dengan area sentuh minimal 44 px dan navigasi bawah.' : 'Responsif dari 360 px sampai 1440 px: satu kolom di ponsel, grid di desktop, lebar konten maksimal sekitar 1200 px.'}`;
  const blokFitur = (f) => [`### ${fr(f)} ${one(f.n)} (${f.p})`, one(f.d), ...lines(f.k).map((k) => '- [ ] ' + k)].join('\n');

  const fase = [];
  fase.push({
    judul: 'Fondasi proyek',
    isi: [
      buka,
      `Tugas fase ini: siapkan fondasi ${mobile ? 'aplikasi mobile' : 'website'} "${nama}" tanpa membangun fitur dulu.`,
      `## Produk\n${one(s.deskripsi)}`,
      `## Teknologi\n${s.stack || 'Bebas, pilih yang paling sesuai.'}`,
      `## Tampilan\n${b.kesan ? `- Kesan: ${one(b.kesan)}\n` : ''}- Gaya: ${g.nama}. ${g.ciri}\n- Huruf: ${g.huruf}\n- Warna: merek ${s.warna} (teks ${b.diAtas.nama} di atasnya), latar ${g.latar}, teks ${g.teks}. Buat turunan warna merek yang lebih muda dan lebih tua untuk latar bagian, hover, dan label.\n- Gambar dan ikon: ${g.gambar}\n- Hindari: ${g.hindari}\n- Ukuran: huruf ${skalaHuruf(s).map(([n, px]) => `${n} ${px} px`).join(', ')}; sudut ${g.sudut} px, garis ${g.garis} px, jarak antarbagian ${mobile ? 24 : g.jarak} px${g.kapsul ? ', tombol berbentuk kapsul' : ''}\n- Komponen, label status, dan keadaan kosong, memuat, dan galat: ikuti bagian Desain di PRD\n- Nada bahasa: ${g.nada}\n- Bahasa antarmuka: Indonesia`,
      `## Peran dan cara masuk\n${daftar(roles.map((r) => `${one(r.n)}: ${one(r.m) || 'tanpa akun'}`))}`,
      lines(s.data).length ? `## Data utama\n${daftar(lines(s.data))}` : '',
      mutu,
      '## Yang harus selesai',
      daftar([
        'Struktur proyek dan routing',
        'Token desain (warna, huruf, ukuran, sudut, bayangan, jarak) sebagai variabel CSS atau tema, dan huruf dimuat dari Google Fonts',
        `Komponen dasar yang sudah dipoles penuh: tombol utama ("${cta}") dan sekunder, kolom isian dengan keadaan fokus dan galat, kartu, label status, navigasi, dialog, notifikasi, skeleton, dan keadaan kosong`,
        'Model data dan migrasi untuk data utama, beserta data contoh yang realistis',
        'Login sesuai cara masuk tiap peran, dan pembatasan akses: ' + unit + ' milik suatu peran hanya bisa dibuka peran itu',
        `Tata letak dan navigasi semua ${unit} sudah bergaya lengkap. ${mobile ? 'Layar pertama' : 'Halaman depan'} langsung dibuat utuh${mobile ? '' : ` dengan hero yang kuat (judul "${one(s.tagline) || nama}", tombol "${cta}", dan visual pendukung)`} sebagai patokan mutu untuk fase berikutnya`,
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
        `Tugas fase ini: bangun semua yang dipakai peran **${one(r.n)}** (${one(r.d)}). Kerjakan P0 dulu, lalu P1. Pakai token dan komponen dari fase fondasi; tiap ${unit} harus terlihat siap rilis.`,
        `## Hak akses ${one(r.n)}\nBisa:\n${daftar(lines(r.b))}` + (lines(r.t).length ? `\n\nTidak bisa:\n${daftar(lines(r.t))}` : ''),
        hal.length ? `## ${mobile ? 'Layar' : 'Halaman'}\n${hal.map((h, i) => `${i + 1}. ${one(h.n)}`).join('\n')}` : '',
        fit.length ? `## Kebutuhan fungsional\n${fit.map(blokFitur).join('\n\n')}` : '',
        alur.length ? `## Alur yang harus berjalan dari awal sampai akhir\n${alur.map((a) => `### ${one(a.n)}\n${lines(a.l).map((l, i) => `${i + 1}. ${l}`).join('\n')}`).join('\n\n')}` : '',
        mutu,
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
      `## Polesan visual\n${daftar([`Periksa semua ${unit} satu per satu: jarak, ukuran huruf, warna, sudut, dan bayangan harus konsisten dengan token`, 'Ganti sisa kotak pengganti, teks contoh generik, atau ikon yang tidak seragam', `Tambahkan transisi halus saat berpindah ${unit}, membuka dialog, dan menyimpan data`, `Cek kontras teks minimal 4.5:1 dan tampilan di ${mobile ? '360 dan 430 px' : '390 px dan 1440 px'}`])}`,
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
