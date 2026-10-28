// Daftar semua PRD bawaan, satu berkas per PRD. Urutan di sini menjadi urutan di perpustakaan.
// Menambah PRD: buat berkas baru di folder ini, impor di sini, tambahkan ke PRD, lalu daftarkan id-nya
// di builtinTemplates (backend/internal/api/admin.go) dan jalankan `node scripts/cek-id-bawaan.mjs`.
//
// Format entri:
//   id, platform ("web" atau "mobile"), nama, kategori, ringkas, cocok (jenis usaha yang cocok), desain (alasan desainnya)
//   hero: bentuk pembuka website (foto, app, intro, artikel, cari, undangan, poster, tengah); app: true untuk aplikasi web
//     dengan menu samping; bio: true untuk halaman satu kolom tanpa navigasi.
//   d.peran: [nama, siapa, cara masuk, [yang bisa], [yang tidak bisa], [halaman atau layar], "web" bila peran di PRD
//     aplikasi mobile memakai panel web]. Peran pertama adalah peran utama: halaman pertamanya menjadi pratinjau utama.
//   d.fitur: [nama, peran ("Admin", "Pasien, Dokter", atau "Semua peran"), prioritas (P0, P1, P2), deskripsi, [kriteria]]
//   d.alur: [judul, peran, [langkah]]
//   d.data: "Entitas: atribut, atribut"; d.blok: bagian halaman utama (lihat BLOK di catalog.js)
//   isi: contoh teks dan angka untuk pratinjau. isi.panel[nama peran] berisi kpi, grafik, tabel, dan acts untuk
//     pratinjau halaman pertama peran itu.
import landing from './landing.js';
import toko from './toko.js';
import portofolio from './portofolio.js';
import profil from './profil.js';
import blog from './blog.js';
import booking from './booking.js';
import kursus from './kursus.js';
import dashboard from './dashboard.js';
import restoran from './restoran.js';
import undangan from './undangan.js';
import event from './event.js';
import properti from './properti.js';
import karier from './karier.js';
import donasi from './donasi.js';
import sekolah from './sekolah.js';
import hotel from './hotel.js';
import wisata from './wisata.js';
import agensi from './agensi.js';
import fotografer from './fotografer.js';
import bengkel from './bengkel.js';
import gym from './gym.js';
import dokumentasi from './dokumentasi.js';
import linkbio from './linkbio.js';
import masjid from './masjid.js';
import crm from './crm.js';
import marketplace from './marketplace.js';
import rekrutmen from './rekrutmen.js';
import klinik from './klinik.js';
import desa from './desa.js';
import koperasi from './koperasi.js';
import helpdesk from './helpdesk.js';
import ujian from './ujian.js';
import proyek from './proyek.js';
import galeri from './galeri.js';
import rental from './rental.js';
import katering from './katering.js';
import berita from './berita.js';
import salon from './salon.js';
import invoice from './invoice.js';
import mToko from './m-toko.js';
import mAntar from './m-antar.js';
import mKeuangan from './m-keuangan.js';
import mBooking from './m-booking.js';
import mBelajar from './m-belajar.js';
import mKebugaran from './m-kebugaran.js';
import mKos from './m-kos.js';
import mDokter from './m-dokter.js';
import mAbsensi from './m-absensi.js';
import mResep from './m-resep.js';
import mTiket from './m-tiket.js';
import mMeditasi from './m-meditasi.js';
import mKasir from './m-kasir.js';
import mSekolah from './m-sekolah.js';
import mWisata from './m-wisata.js';
import mKomunitas from './m-komunitas.js';
import mLaundry from './m-laundry.js';
import mPerpus from './m-perpus.js';
import mOjek from './m-ojek.js';
import mKurir from './m-kurir.js';
import mWarga from './m-warga.js';
import mPosyandu from './m-posyandu.js';
import mSales from './m-sales.js';
import mGalon from './m-galon.js';
import mJualbeli from './m-jualbeli.js';
import mTani from './m-tani.js';
import mJemput from './m-jemput.js';
import mNikah from './m-nikah.js';
import mArisan from './m-arisan.js';
import mEsports from './m-esports.js';

export const PRD = [
  // Website
  landing,
  toko,
  portofolio,
  profil,
  blog,
  booking,
  kursus,
  dashboard,
  restoran,
  undangan,
  event,
  properti,
  karier,
  donasi,
  sekolah,
  hotel,
  wisata,
  agensi,
  fotografer,
  bengkel,
  gym,
  dokumentasi,
  linkbio,
  masjid,
  crm,
  marketplace,
  rekrutmen,
  klinik,
  desa,
  koperasi,
  helpdesk,
  ujian,
  proyek,
  galeri,
  rental,
  katering,
  berita,
  salon,
  invoice,
  // Aplikasi mobile
  mToko,
  mAntar,
  mKeuangan,
  mBooking,
  mBelajar,
  mKebugaran,
  mKos,
  mDokter,
  mAbsensi,
  mResep,
  mTiket,
  mMeditasi,
  mKasir,
  mSekolah,
  mWisata,
  mKomunitas,
  mLaundry,
  mPerpus,
  mOjek,
  mKurir,
  mWarga,
  mPosyandu,
  mSales,
  mGalon,
  mJualbeli,
  mTani,
  mJemput,
  mNikah,
  mArisan,
  mEsports,
];
