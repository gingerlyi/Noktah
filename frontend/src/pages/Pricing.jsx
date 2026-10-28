// Halaman Harga: paket Gratis dan Premium. Pembayaran belum otomatis: tombol Upgrade membuka UPGRADE_URL
// (misalnya WhatsApp atau halaman pembayaran), lalu admin mengaktifkan Premium di Dashboard admin → Pengguna.
import { Link } from 'react-router-dom';
import { useApp } from '../lib/app.jsx';

// Ubah harga di sini.
const HARGA = { bulan: 'Rp 49.000', tahun: 'Rp 399.000', hemat: 'hemat 32%' };

const GRATIS = [
  'Baca semua PRD di perpustakaan',
  'Pratinjau website dan aplikasi dari sisi tiap peran',
  'Salin dan unduh PRD sebagai Markdown',
  'Wizard: PRD dari jenis usahamu dalam satu menit',
  'Prompt AI builder fase pertama (fondasi proyek)',
  'Simpan dan sesuaikan 1 PRD di PRD Saya',
  'Tautan bagikan dengan komentar untuk klien atau developer',
  'Pemeriksa struktur dan nilai PRD dengan saran perbaikan',
];
const PREMIUM = [
  'Semua yang ada di paket Gratis',
  'Simpan sampai 300 PRD, misalnya satu PRD untuk tiap klien',
  'Duplikat PRD dan susun versi berbeda untuk dibandingkan',
  'Pakai wizard berkali-kali untuk tiap usaha atau klien',
  'Paket prompt AI builder lengkap per fase (Lovable, Bolt, v0, Cursor) dan unduhan ZIP',
  'Riwayat versi: pulihkan isi PRD dari 50 versi terakhir',
];
const tanggal = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

function Daftar({ items }) {
  return (
    <ul className="plan-list">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

export default function Pricing() {
  const { user, pub } = useApp();
  const upgradeUrl = pub.features.upgradeUrl;

  let aksi;
  if (!user) {
    aksi = (
      <Link className="btn big" to="/daftar?next=/harga">
        Daftar, lalu upgrade
      </Link>
    );
  } else if (user.premium) {
    aksi = (
      <p className="plan-note">
        Premium aktif{user.premiumUntil ? ` sampai ${tanggal(user.premiumUntil)}` : ''}.
      </p>
    );
  } else if (upgradeUrl) {
    aksi = (
      <a className="btn big" href={upgradeUrl} target="_blank" rel="noopener noreferrer">
        Upgrade ke Premium
      </a>
    );
  } else {
    aksi = <p className="plan-note">Hubungi admin untuk mengaktifkan Premium di akun {user.email}.</p>;
  }

  return (
    <main className="view tight">
      <div className="view-head">
        <div>
          <h1>Harga</h1>
          <p>Mulai gratis. Upgrade saat kamu butuh lebih dari satu PRD tersimpan.</p>
        </div>
      </div>
      <div className="plans">
        <section className="plan sheet" aria-labelledby="p-gratis">
          <span className="step">Gratis</span>
          <h2 id="p-gratis">Rp 0</h2>
          <p className="hint">Untuk mencoba dan menyusun satu PRD.</p>
          <Daftar items={GRATIS} />
          {user ? (
            <p className="plan-note">{user.premium ? 'Termasuk di paketmu.' : 'Paketmu saat ini.'}</p>
          ) : (
            <Link className="btn quiet big" to="/daftar">
              Buat akun gratis
            </Link>
          )}
        </section>
        <section className="plan plan-pro sheet" aria-labelledby="p-premium">
          <span className="step">Premium</span>
          <h2 id="p-premium">
            {HARGA.bulan}
            <small> / bulan</small>
          </h2>
          <p className="hint">
            atau {HARGA.tahun} / tahun ({HARGA.hemat}). Untuk freelancer, agensi, dan pemilik usaha dengan beberapa proyek.
          </p>
          <Daftar items={PREMIUM} />
          {aksi}
        </section>
      </div>
      <section className="sheet plan-faq" aria-labelledby="h-faq">
        <h2 id="h-faq">Tanya jawab</h2>
        <dl>
          <dt>Bagaimana cara membayar?</dt>
          <dd>Tekan Upgrade ke Premium dan ikuti petunjuknya. Setelah pembayaran diterima, admin mengaktifkan Premium di akunmu.</dd>
          <dt>Apa yang terjadi bila Premium berakhir?</dt>
          <dd>Semua PRD-mu tetap tersimpan dan bisa dibuka, diubah, dan diunduh. Kamu hanya tidak bisa menambah PRD baru melebihi batas paket Gratis.</dd>
          <dt>Apakah PRD di perpustakaan tetap gratis?</dt>
          <dd>Ya. Semua PRD bisa dibaca, disalin, dan diunduh tanpa akun.</dd>
        </dl>
      </section>
    </main>
  );
}
