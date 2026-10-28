// Panduan admin: cara masuk, hak tiap peran admin, dan tugas di tiap halaman dashboard.
// Bagian yang tidak bisa dibuka peran pengguna saat ini tetap tampil, dengan keterangan peran yang dibutuhkan.
import { Link } from 'react-router-dom';
import { ROLES, can, useApp } from '../../lib/app.jsx';
import { Icon } from '../../components/ui.jsx';
import { ADMIN_ROLES, PERMS } from './People.jsx';

const Ui = ({ children }) => <span className="ui-ref">{children}</span>;
const perannya = (perm) =>
  ADMIN_ROLES.filter((r) => ROLES[r].can.includes(perm))
    .map((r) => ROLES[r].nama)
    .join(', ');

const TUGAS = [
  {
    perm: 'dash',
    to: '/admin',
    judul: 'Membaca dashboard',
    isi: 'Dashboard merangkum pemakaian Noktah. Angkanya dihitung ulang setiap kali halaman dibuka.',
    poin: [
      <>Kartu angka menunjukkan pengguna terdaftar, PRD yang tersimpan di semua akun, pengguna yang aktif 7 hari terakhir, dan jumlah PRD yang tampil di perpustakaan.</>,
      <>
        Grafik <Ui>PRD dibuat, 14 hari terakhir</Ui> bisa dibuka sebagai tabel lewat <Ui>Lihat sebagai tabel</Ui>.
      </>,
      <>
        <Ui>PRD perpustakaan terpopuler</Ui> menunjukkan PRD yang paling sering diambil pengguna. Pakai ini untuk menentukan PRD mana yang perlu
        dirawat lebih dulu.
      </>,
    ],
  },
  {
    perm: 'tpl',
    to: '/admin/templat',
    judul: 'Mengatur isi perpustakaan',
    isi: 'Halaman Perpustakaan berisi PRD bawaan dan PRD buatan admin. Perubahan di sini langsung terlihat di perpustakaan publik dan landing page.',
    poin: [
      <>
        Tekan <Ui>Tampil</Ui> pada PRD bawaan untuk menyembunyikannya, lalu tekan lagi untuk menampilkannya. PRD bawaan tidak bisa diubah atau
        dihapus.
      </>,
      <>
        Untuk membuat PRD sendiri, pilih PRD dasar yang paling mirip, tekan <Ui>Tambah PRD</Ui>, lalu ubah isinya di editor: peran, halaman, alur,
        dan fitur. PRD baru awalnya disembunyikan.
      </>,
      <>
        Tampilkan PRD buatan admin setelah lencana <Ui>Sesuai struktur</Ui> muncul di editornya. Dengan begitu pengguna hanya mendapat PRD yang
        lolos pemeriksa.
      </>,
      <>
        PRD buatan admin bisa diubah lewat <Ui>Edit isi</Ui> dan dihapus lewat <Ui>Hapus</Ui>.
      </>,
    ],
  },
  {
    perm: 'site',
    to: '/admin/landing',
    judul: 'Mengubah teks landing page',
    isi: 'Judul dan kalimat pembuka di bagian teratas landing page bisa diganti tanpa mengubah kode.',
    poin: [
      <>Bagian judul setelah koma pertama diberi stabilo warna, jadi letakkan kata yang ingin ditonjolkan setelah koma.</>,
      <>Kolom yang dikosongkan kembali memakai teks bawaan.</>,
    ],
  },
  {
    perm: 'users',
    to: '/admin/pengguna',
    judul: 'Melihat pengguna',
    isi: 'Halaman Pengguna berisi semua akun yang terdaftar, jumlah PRD mereka, dan kapan terakhir aktif.',
    poin: [<>Isi PRD milik pengguna tidak bisa dibuka dari dashboard admin. Admin hanya melihat jumlahnya.</>],
  },
  {
    perm: 'roles',
    to: '/admin/peran',
    judul: 'Memberi akses admin',
    isi: 'Halaman Peran mengatur siapa yang boleh membuka dashboard admin dan halaman mana saja yang boleh dibukanya.',
    poin: [
      <>
        Pilih peran untuk tiap akun: <Ui>Pengguna</Ui> (tanpa akses admin), <Ui>Analis</Ui>, <Ui>Pengelola konten</Ui>, atau <Ui>Admin</Ui>.
        Perubahannya langsung berlaku.
      </>,
      <>Peran pemilik dan peranmu sendiri tidak bisa diubah dari halaman ini.</>,
      <>Berikan peran terkecil yang cukup untuk tugasnya. Misalnya, penulis PRD cukup menjadi pengelola konten.</>,
    ],
  },
];

export default function AdminGuide() {
  const { user } = useApp();
  const peran = ROLES[user.role]?.nama || user.role;
  return (
    <>
      <div className="view-head">
        <div>
          <h1>Panduan admin</h1>
          <p>
            Tugas di dashboard admin dan siapa yang boleh mengerjakannya. Kamu masuk sebagai <b>{peran}</b>. Bagian yang tidak bisa kamu buka
            ditandai.
          </p>
        </div>
      </div>

      <div className="ag-grid">
        <section className="sheet adm" aria-labelledby="ag-masuk">
          <h2 id="ag-masuk">Masuk dan keluar</h2>
          <ul className="ag-list">
            <li>
              {Icon.check}
              <span>
                Dashboard admin dibuka lewat alamat <code>/admin/masuk</code>. Alamat ini sengaja tidak ditautkan dari halaman publik, jadi
                simpan sebagai bookmark.
              </span>
            </li>
            <li>
              {Icon.check}
              <span>
                Setelah masuk, tautan <Ui>Admin</Ui> juga muncul di navigasi situs, sehingga kamu bisa berpindah antara situs dan dashboard.
              </span>
            </li>
            <li>
              {Icon.check}
              <span>
                Keluar lewat menu akun di kanan atas, lalu pilih <Ui>Keluar</Ui>.
              </span>
            </li>
          </ul>
        </section>

        <section className="sheet adm" aria-labelledby="ag-hak">
          <h2 id="ag-hak">Hak tiap peran admin</h2>
          <div className="utbl">
            <table>
              <thead>
                <tr>
                  <th>Hak</th>
                  {ADMIN_ROLES.map((r) => (
                    <th key={r} className={r === user.role ? 'is-me' : ''}>
                      {ROLES[r].nama}
                      {r === user.role && <small> (kamu)</small>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMS.map(([k, label]) => (
                  <tr key={k}>
                    <td>{label}</td>
                    {ADMIN_ROLES.map((r) => (
                      <td key={r} className={r === user.role ? 'is-me' : ''}>
                        {ROLES[r].can.includes(k) ? 'Ya' : '–'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {TUGAS.map((t) => {
        const boleh = can(user, t.perm);
        return (
          <section className={'sheet adm ag-task' + (boleh ? '' : ' is-locked')} key={t.perm} aria-labelledby={'ag-' + t.perm}>
            <div className="adm-head">
              <h2 id={'ag-' + t.perm}>{t.judul}</h2>
              {boleh ? (
                <Link className="btn quiet" to={t.to}>
                  Buka halaman
                  {Icon.arrow}
                </Link>
              ) : (
                <span className="tag">Hanya untuk {perannya(t.perm)}</span>
              )}
            </div>
            <p className="ag-lead">{t.isi}</p>
            <ul className="ag-list">
              {t.poin.map((x, i) => (
                <li key={i}>
                  {Icon.check}
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="sheet adm" aria-labelledby="ag-bawaan">
        <h2 id="ag-bawaan">PRD bawaan dan pengembangan</h2>
        <p className="ag-lead">
          PRD bawaan ditulis di kode, satu berkas per PRD di folder <code>frontend/src/katalog</code>. Menambah atau mengubah PRD bawaan dilakukan
          oleh developer, dan langkahnya ada di README proyek. Untuk PRD yang cukup diubah dari dashboard, pakai <Ui>Tambah PRD</Ui> di halaman
          Perpustakaan.
        </p>
      </section>
    </>
  );
}
