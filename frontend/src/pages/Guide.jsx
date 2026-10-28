// Halaman "Cara pakai": panduan untuk pengunjung dan pengguna, dari memilih PRD sampai memberikannya ke AI builder.
// Panduan untuk admin ada di dalam dashboard admin (/admin/panduan), supaya halaman publik tidak menautkan ke admin.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { libraryItems, useApp } from '../lib/app.jsx';
import { T, TPL_IDS } from '../lib/catalog.js';
import { NO, STRUKTUR, jumlahBagian } from '../lib/prd.js';
import { Icon } from '../components/ui.jsx';

// Nama tombol atau label yang disebut di panduan, ditulis seperti tombol supaya mudah dicari di layar.
const Ui = ({ children }) => <span className="ui-ref">{children}</span>;

const contohPrd = ['klinik', 'marketplace', 'restoran'].find((id) => T[id]) || TPL_IDS[0];

function promptAi() {
  return [
    `Berikut PRD dengan struktur ${STRUKTUR}. Baca seluruh dokumen sebelum menulis kode, lalu ikuti bagian ${NO['Instruksi untuk AI']} (Instruksi untuk AI).`,
    `Mulai dari peran dan hak akses (bagian ${NO['Peran dan hak akses']}) serta model data (bagian ${NO['Model data']}). Kerjakan kebutuhan P0 berurutan dari FR-01, dan periksa hak akses tiap peran di server, bukan hanya dengan menyembunyikan tombol.`,
    `Setelah satu kebutuhan selesai, sebutkan ID-nya, kriteria penerimaan yang sudah terpenuhi, dan alur di bagian ${NO['Alur utama']} yang sudah bisa dijalankan. Bila ada yang tidak jelas atau saling bertentangan, tanyakan dulu sebelum menebak.`,
    '',
    '[Tempel seluruh isi PRD di sini]',
  ].join('\n');
}

const LANGKAH = [
  {
    id: 'pilih',
    judul: 'Pilih PRD yang paling mirip',
    isi: (
      <>
        Buka perpustakaan, lalu persempit pilihan dengan filter. Pilih PRD yang <b>alur kerjanya</b> paling mirip dengan usahamu. Nama, warna,
        peran, dan fiturnya nanti bisa kamu ganti.
      </>
    ),
    tips: [
      <>
        Pilih <Ui>Website</Ui> atau <Ui>Aplikasi mobile</Ui>, lalu gaya desain dan kategori bila perlu.
      </>,
      <>Kotak pencarian juga mencari jenis usaha dan nama peran, misalnya kurir, dokter, atau kasir.</>,
      <>
        Label <Ui>3 peran</Ui> di tiap kartu menunjukkan berapa jenis pengguna yang diatur PRD itu, misalnya pembeli, penjual, dan admin.
      </>,
    ],
    aksi: { to: '/perpustakaan', label: 'Buka perpustakaan' },
  },
  {
    id: 'baca',
    judul: 'Baca isinya dan lihat dari sisi tiap peran',
    isi: (
      <>
        Halaman detail PRD merangkum isinya: peran, halaman, alur utama, kebutuhan fungsional, dan data. Siapa pun bisa membaca, menyalin, dan
        mengunduhnya tanpa akun.
      </>
    ),
    tips: [
      <>
        Tab <Ui>Dokumen PRD</Ui> berisi teks lengkap dalam Markdown. Tab <Ui>Pratinjau</Ui> menggambarkan hasil jadinya.
      </>,
      <>
        Pakai pilihan <Ui>Lihat sebagai</Ui> di pratinjau untuk melihat sisi peran lain, misalnya panel admin, layar kasir, atau aplikasi
        kurir.
      </>,
      <>Teks, harga, foto, dan nama orang di pratinjau hanya contoh. Susunan halaman, warna, dan gayanya mengikuti PRD.</>,
    ],
    aksi: { to: '/perpustakaan/' + contohPrd, label: 'Lihat contoh: ' + T[contohPrd].nama },
  },
  {
    id: 'sesuaikan',
    judul: 'Sesuaikan dengan usahamu',
    isi: (
      <>
        Tekan <Ui>Pakai dan sesuaikan</Ui>. Kamu perlu akun untuk menyimpan PRD. Salinannya masuk ke PRD Saya dan bisa kamu ubah sebebasnya
        tanpa mengubah aslinya di perpustakaan.
      </>
    ),
    tips: [
      <>
        Formulir di kiri dibagi per kelompok: dasar proyek, pengguna dan tujuan, peran, halaman atau layar, alur, fitur, model data, tampilan,
        serta teknis dan jadwal.
      </>,
      <>Dokumen dan pratinjau di kanan berubah setiap kali kamu mengetik, dan perubahannya tersimpan otomatis.</>,
      <>
        Tombol <Ui>Kembalikan ke isi perpustakaan</Ui> di kelompok terakhir mengembalikan semua isi ke PRD aslinya.
      </>,
    ],
    aksi: null,
  },
  {
    id: 'peran',
    judul: 'Atur peran, halaman, dan alur',
    isi: (
      <>
        Peran menentukan siapa saja yang memakai sistemmu dan apa yang boleh mereka lakukan. Bagian inilah yang membuat PRD menjadi sistem utuh,
        bukan hanya halaman depan.
      </>
    ),
    tips: [
      <>Peran pertama adalah peran utama. Halaman pertamanya menjadi tampilan utama di pratinjau.</>,
      <>
        Isi daftar <Ui>Bisa</Ui> dan <Ui>Tidak bisa</Ui> untuk tiap peran. AI builder memakainya untuk membatasi akses.
      </>,
      <>
        Setiap halaman atau layar dimiliki satu peran. Di aplikasi mobile, sebuah peran bisa memakai aplikasi atau <Ui>panel web</Ui>, misalnya
        admin.
      </>,
      <>Sebuah fitur bisa dipakai satu peran, beberapa peran, atau semua peran. Alur utama ditulis langkah demi langkah untuk satu peran.</>,
      <>Menghapus peran ikut menghapus halaman dan alurnya. Kamu bisa membatalkannya dari pemberitahuan yang muncul.</>,
    ],
    aksi: null,
  },
  {
    id: 'periksa',
    judul: 'Pastikan lencana "Sesuai struktur"',
    isi: (
      <>
        Pemeriksa struktur membaca dokumenmu setiap kali isinya berubah, termasuk saat kamu mengedit teksnya langsung lewat <Ui>Edit teks</Ui>.
      </>
    ),
    tips: [
      <>
        <b>Wajib</b> berarti ada yang melanggar struktur, misalnya bagian yang hilang, isi yang kosong, atau peran yang tidak dikenal. Perbaiki dulu
        sebelum memakai PRD.
      </>,
      <>
        <b>Saran</b> berarti dokumen sudah sah tetapi bisa dilengkapi, misalnya kebutuhan P0 yang belum punya kriteria penerimaan.
      </>,
      <>
        Setelah teks diedit langsung, perubahan di formulir tidak ikut masuk. Tekan <Ui>Pakai lagi hasil formulir</Ui> untuk kembali memakai
        formulir.
      </>,
    ],
    aksi: { to: '/struktur', label: 'Lihat ketentuan struktur', quiet: true },
  },
  {
    id: 'ai',
    judul: 'Berikan ke AI builder atau developer',
    isi: (
      <>
        Tekan <Ui>Salin Markdown</Ui> atau <Ui>Unduh .md</Ui>, lalu tempelkan ke AI builder seperti Lovable, Bolt, v0, Cursor, atau Claude.
        Kamu juga bisa mengirim berkasnya ke developer.
      </>
    ),
    tips: [
      <>Kirim seluruh dokumen sekaligus, jangan dipotong per bagian, karena tiap bagian saling merujuk.</>,
      <>Minta AI mengerjakan kebutuhan P0 lebih dulu, satu per satu, mulai dari FR-01.</>,
      <>
        Uji hasilnya dengan alur utama di bagian {NO['Alur utama']}, memakai akun untuk tiap peran. Daftar periksa di bagian {NO['Kriteria selesai']}{' '}
        membantu memastikan semuanya sudah benar.
      </>,
    ],
    aksi: null,
    prompt: true,
  },
];

const FAQ = [
  [
    'Apakah perlu akun?',
    'Tidak untuk membaca, menyalin, dan mengunduh PRD. Akun dibutuhkan untuk menyesuaikan PRD dan menyimpannya di PRD Saya.',
  ],
  [
    'Bolehkah mengubah judul atau urutan bagian?',
    `Isinya bebas diubah, tetapi nomor, judul, dan urutan ${jumlahBagian().toLowerCase()} bagiannya tetap. Dengan begitu AI builder selalu tahu di mana mencari tiap informasi.`,
  ],
  ['Apa arti P0, P1, dan P2?', 'P0 wajib ada di rilis pertama, P1 menyusul setelah rilis, dan P2 dikerjakan bila ada waktu.'],
  [
    'Apakah pratinjau itu desain final?',
    'Bukan. Pratinjau membantu membayangkan hasilnya. Teks, harga, foto, dan nama orang di dalamnya hanya contoh, sedangkan susunan halaman, warna, dan gayanya mengikuti PRD.',
  ],
  [
    'Bagaimana kalau hasil AI builder mengabaikan hak akses?',
    `Minta AI membaca ulang bagian ${NO['Peran dan hak akses']} dan memeriksa hak akses di server, lalu coba masuk dengan akun tiap peran. Peran yang membuka halaman milik peran lain berarti hak aksesnya belum benar.`,
  ],
  [
    'PRD yang saya butuhkan tidak ada di perpustakaan.',
    'Pilih PRD yang alurnya paling mirip, lalu ganti nama, peran, halaman, alur, dan fiturnya di editor. Pemeriksa struktur akan memberi tahu bila ada yang belum lengkap.',
  ],
];

export default function Guide() {
  const { user, pub, toast } = useApp();
  const jumlah = libraryItems(pub).length;
  const [aktif, setAktif] = useState(LANGKAH[0].id);
  const bodyRef = useRef(null);
  const prompt = promptAi();

  // Daftar isi menandai langkah yang sedang dibaca.
  useEffect(() => {
    const secs = [...(bodyRef.current?.querySelectorAll('[data-step]') || [])];
    if (!secs.length || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((x) => x.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setAktif(vis[0].target.dataset.step);
      },
      { rootMargin: '-20% 0px -60% 0px' },
    );
    secs.forEach((x) => io.observe(x));
    return () => io.disconnect();
  }, []);

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast('Prompt disalin. Tempelkan di AI builder, lalu tempel isi PRD di bawahnya.');
    } catch {
      toast('Tidak bisa menyalin otomatis. Pilih teks prompt lalu salin manual.');
    }
  };

  return (
    <main className="view tight">
      <div className="view-head">
        <div>
          <h1>Cara pakai Noktah</h1>
          <p>
            Dari memilih PRD sampai memberikannya ke AI builder atau developer, dalam enam langkah. Semua {jumlah} PRD di perpustakaan
            dipakai dengan cara yang sama.
          </p>
        </div>
        <div className="row">
          <Link className="btn quiet" to="/struktur">
            Struktur PRD
          </Link>
          <Link className="btn" to="/perpustakaan">
            Buka perpustakaan
          </Link>
        </div>
      </div>

      <div className="guide">
        <nav className="guide-toc" aria-label="Langkah">
          <b>Langkah</b>
          {LANGKAH.map((l, i) => (
            <a key={l.id} href={'#langkah-' + l.id} className={aktif === l.id ? 'on' : ''} aria-current={aktif === l.id ? 'step' : undefined}>
              <i>{String(i + 1).padStart(2, '0')}</i>
              {l.judul.replace(/"/g, '')}
            </a>
          ))}
          <a href="#tanya-jawab" className={aktif === 'faq' ? 'on' : ''} aria-current={aktif === 'faq' ? 'step' : undefined}>
            <i>?</i>
            Tanya jawab
          </a>
        </nav>

        <div className="guide-body" ref={bodyRef}>
          {LANGKAH.map((l, i) => (
            <section className="sheet g-step" id={'langkah-' + l.id} data-step={l.id} key={l.id} aria-labelledby={'gj-' + l.id}>
              <span className="g-num" aria-hidden="true">
                {i + 1}
              </span>
              <div className="g-main">
                <span className="step">Langkah {i + 1}</span>
                <h2 id={'gj-' + l.id}>{l.judul}</h2>
                <p>{l.isi}</p>
                <ul>
                  {l.tips.map((t, k) => (
                    <li key={k}>
                      {Icon.check}
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                {l.id === 'sesuaikan' && (
                  <div className="row">
                    {user ? (
                      <Link className="btn quiet" to="/prd">
                        Buka PRD Saya
                      </Link>
                    ) : (
                      <>
                        <Link className="btn quiet" to="/daftar">
                          Buat akun
                        </Link>
                        <Link className="link" to="/masuk">
                          Sudah punya akun? Masuk
                        </Link>
                      </>
                    )}
                  </div>
                )}
                {l.aksi && (
                  <div className="row">
                    <Link className={'btn' + (l.aksi.quiet || i ? ' quiet' : '')} to={l.aksi.to}>
                      {l.aksi.label}
                      {Icon.arrow}
                    </Link>
                  </div>
                )}
                {l.prompt && (
                  <div className="g-prompt">
                    <div className="g-prompt-head">
                      <div>
                        <b>Prompt pembuka untuk AI builder</b>
                        <span className="hint">Tempel prompt ini lebih dulu, lalu seluruh isi PRD di bawahnya.</span>
                      </div>
                      <button type="button" className="btn quiet" onClick={salin}>
                        {Icon.copy}
                        Salin prompt
                      </button>
                    </div>
                    <pre className="sample">{prompt}</pre>
                  </div>
                )}
              </div>
            </section>
          ))}

          <section className="sheet g-step g-faq" id="tanya-jawab" data-step="faq" aria-labelledby="gj-faq">
            <span className="g-num" aria-hidden="true">
              ?
            </span>
            <div className="g-main">
              <span className="step">Tanya jawab</span>
              <h2 id="gj-faq">Yang sering ditanyakan</h2>
              <div className="g-qa">
                {FAQ.map(([q, a]) => (
                  <details key={q}>
                    <summary>{q}</summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
