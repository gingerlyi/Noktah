// Halaman ketentuan struktur PRD.
import { Link } from 'react-router-dom';
import { NO, SECTIONS, STRUKTUR, jumlahBagian } from '../lib/prd.js';

const SAMPLE_META = `---
struktur: ${STRUKTUR}
nama: Kopi Senja
platform: website
jenis: Toko online
peran: Pengunjung, Pembeli, Admin
bahasa: id
status: draf
tanggal: 2026-10-13
---

# PRD: Kopi Senja`;

const SAMPLE_PERAN = `### Admin
- **Bisa:**
  - Menambah dan mengubah produk, harga, dan stok
  - Memproses pesanan sampai mengisi nomor resi
- **Tidak bisa:**
  - Melihat data kartu atau rekening pembeli
- **Halaman:** Dashboard, Pesanan, Produk, Kode promo`;

const SAMPLE_ALUR = `### Alur 2: Memproses pesanan sampai dikirim
- **Peran:** Admin
1. Membuka Pesanan dan menyaring status "Dibayar"
2. Mengubah status menjadi "Dikemas" setelah dikemas
3. Mengisi nomor resi sehingga status berubah menjadi "Dikirim"`;

const SAMPLE_FR = `### FR-03: Keranjang belanja
- **Prioritas:** P0
- **Peran:** Pengunjung
- **Deskripsi:** Tambah, ubah jumlah, dan hapus barang, dengan total yang langsung dihitung.
- **Kriteria penerimaan:**
  - [ ] Total berubah seketika saat jumlah diubah
  - [ ] Isi keranjang tetap ada setelah halaman dimuat ulang`;

export default function Structure() {
  const jumlah = jumlahBagian();
  return (
    <main className="view tight">
      <div className="view-head">
        <div>
          <h1>Struktur PRD</h1>
          <p>
            Semua PRD di perpustakaan memakai struktur <b>{STRUKTUR}</b>. Urutan dan judul bagiannya tetap, sehingga AI builder selalu tahu di
            mana mencari tiap informasi: siapa saja penggunanya, apa yang boleh dilakukan tiap peran, dan alur apa yang harus berjalan.
          </p>
        </div>
        <Link className="btn" to="/perpustakaan">
          Buka perpustakaan
        </Link>
      </div>

      <div className="rules">
        <div className="sheet adm">
          <h2>Yang boleh kamu ubah</h2>
          <ul>
            <li>Semua isi: nama, deskripsi, target pengguna, tujuan, dan ruang lingkup.</li>
            <li>Peran beserta hak aksesnya, halaman atau layar tiap peran, dan alur utama.</li>
            <li>Fitur, perannya, prioritas, dan kriteria penerimaannya.</li>
            <li>Model data, kebutuhan non-fungsional, desain, teknologi, dan jadwal.</li>
          </ul>
        </div>
        <div className="sheet adm">
          <h2>Yang harus tetap</h2>
          <ul>
            <li>Blok metadata di awal dokumen dan judul "# PRD: Nama proyek".</li>
            <li>{jumlah} bagian di bawah, dengan nomor, judul, dan urutan yang sama.</li>
            <li>Tiap peran punya blok sendiri dengan daftar "Bisa", dan namanya dipakai sama persis di halaman, alur, dan fitur.</li>
            <li>Bentuk blok alur dan blok kebutuhan: nomor berurutan, peran, dan isi yang lengkap.</li>
          </ul>
        </div>
      </div>

      <div className="sheet adm">
        <h2>{jumlah} bagian</h2>
        <span className="hint">
          Untuk aplikasi mobile, bagian {NO['Struktur halaman']} berjudul "Daftar layar" dan bagian {NO['Susunan halaman utama']} berjudul "Susunan layar
          utama".
        </span>
        <ol className="sec-list">
          {SECTIONS.map((sec) => (
            <li key={sec.n}>
              <i>{String(sec.n).padStart(2, '0')}</i>
              <b>{sec.tm ? `${sec.t} / ${sec.tm}` : sec.t}</b>
              <span>{sec.d}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rules">
        <div className="sheet adm">
          <h2>Metadata dan judul</h2>
          <span className="hint">Baris "platform" berisi website atau aplikasi-mobile. Baris "peran" berisi semua peran di bagian {NO['Peran dan hak akses']}.</span>
          <pre className="sample">{SAMPLE_META}</pre>
        </div>
        <div className="sheet adm">
          <h2>Satu peran</h2>
          <span className="hint">
            Bagian {NO['Peran dan hak akses']} dibuka dengan tabel semua peran, lalu satu blok seperti ini untuk tiap peran.
          </span>
          <pre className="sample">{SAMPLE_PERAN}</pre>
        </div>
        <div className="sheet adm">
          <h2>Satu alur utama</h2>
          <span className="hint">Nomor alur berurutan dari Alur 1. Tiap alur dijalankan satu peran dan punya minimal dua langkah.</span>
          <pre className="sample">{SAMPLE_ALUR}</pre>
        </div>
        <div className="sheet adm">
          <h2>Satu kebutuhan fungsional</h2>
          <span className="hint">
            Nomor FR berurutan dari FR-01. Baris "Peran" berisi nama peran, beberapa nama dipisah koma, atau "Semua peran".
          </span>
          <pre className="sample">{SAMPLE_FR}</pre>
        </div>
      </div>

      <div className="sheet adm">
        <h2>Pemeriksa struktur</h2>
        <p style={{ margin: 0 }}>
          Editor memeriksa dokumen setiap kali isinya berubah, termasuk saat kamu mengedit teksnya langsung. Hasilnya ada dua tingkat:
        </p>
        <ul style={{ margin: 0, paddingLeft: 22 }}>
          <li>
            <b>Wajib:</b> dokumen melanggar struktur, misalnya ada bagian yang hilang, urutannya tertukar, isinya masih kosong, peran tanpa daftar
            "Bisa", atau alur dan kebutuhan yang memakai peran yang tidak ada.
          </li>
          <li>
            <b>Saran:</b> dokumen sah, tetapi sebaiknya dilengkapi, misalnya kebutuhan P0 tanpa kriteria penerimaan, atau peran yang belum punya
            halaman dan belum dipakai di alur maupun kebutuhan mana pun.
          </li>
        </ul>
      </div>
    </main>
  );
}
