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

const NOTE = 'm-0 text-[.92rem] text-muted';
const PLAN = 'sheet flex flex-col items-start gap-3 p-[clamp(22px,3vw,34px)]';
const HARGA_H2 = 'm-0 font-display text-[clamp(2rem,4vw,2.8rem)]/none font-medium';

function Daftar({ items }) {
  return (
    <ul className="mt-1.5 mb-2.5 flex flex-1 list-none flex-col gap-2.25 p-0">
      {items.map((t) => (
        <li
          key={t}
          className="relative pl-5.5 before:absolute before:top-[.5em] before:left-0.5 before:size-2 before:bg-ink before:[clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)] before:content-['']"
        >
          {t}
        </li>
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
      <p className={NOTE}>
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
    aksi = <p className={NOTE}>Hubungi admin untuk mengaktifkan Premium di akun {user.email}.</p>;
  }

  return (
    <main className="view tight">
      <div className="view-head">
        <div>
          <h1>Harga</h1>
          <p>Mulai gratis. Upgrade saat kamu butuh lebih dari satu PRD tersimpan.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
        <section className={PLAN} aria-labelledby="p-gratis">
          <span className="step">Gratis</span>
          <h2 id="p-gratis" className={HARGA_H2}>
            Rp 0
          </h2>
          <p className="hint">Untuk mencoba dan menyusun satu PRD.</p>
          <Daftar items={GRATIS} />
          {user ? (
            <p className={NOTE}>{user.premium ? 'Termasuk di paketmu.' : 'Paketmu saat ini.'}</p>
          ) : (
            <Link className="btn quiet big" to="/daftar">
              Buat akun gratis
            </Link>
          )}
        </section>
        <section className={PLAN + ' border-ink'} aria-labelledby="p-premium">
          <span className="step">Premium</span>
          <h2 id="p-premium" className={HARGA_H2}>
            {HARGA.bulan}
            <small className="font-mono text-base/normal font-normal text-muted"> / bulan</small>
          </h2>
          <p className="hint">
            atau {HARGA.tahun} / tahun ({HARGA.hemat}). Untuk freelancer, agensi, dan pemilik usaha dengan beberapa proyek.
          </p>
          <Daftar items={PREMIUM} />
          {aksi}
        </section>
      </div>
      <section className="sheet p-[clamp(22px,3vw,34px)]" aria-labelledby="h-faq">
        <h2 id="h-faq" className="mt-0 mb-3 font-display text-[1.5rem]/[1.2] font-medium">
          Tanya jawab
        </h2>
        <dl className="[&_dd]:mx-0 [&_dd]:mt-1 [&_dd]:mb-0 [&_dd]:text-muted [&_dt]:mt-3.5 [&_dt]:font-semibold">
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
