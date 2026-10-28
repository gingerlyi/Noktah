// Landing page: memperkenalkan perpustakaan PRD, cara memakainya, struktur baku, dan isi Noktah.
// Animasi: demo di hero, angka yang menghitung naik, pemeriksa struktur yang berjalan seiring halaman
// digulir, dan bagian-bagian yang muncul saat masuk layar (lihat components/Motion.jsx).
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DEF_SUB, DEF_TITLE, libraryItems, useApp } from '../lib/app.jsx';
import { GAYA, UNGGULAN } from '../lib/catalog.js';
import { NO, SECTIONS, STRUKTUR, fromBuiltin, genMd, jumlahBagian, sectionTitle } from '../lib/prd.js';
import { Library } from '../components/Library.jsx';
import HeroDemo from '../components/HeroDemo.jsx';
import RoleShowcase from '../components/RoleShowcase.jsx';
import { CountUp, reducedMotion, spotlight, useInView } from '../components/Motion.jsx';
import { useCopyPrd } from '../components/Editor.jsx';
import { Icon, MockThumb, Stipple } from '../components/ui.jsx';

// Judul bagian bergaya Markdown: "##" kecil di depan judul, seperti di dokumen PRD.
function SecHead({ id, title, hint, children }) {
  return (
    <div className="sh" data-reveal="up">
      <div className="sh-text">
        <h2 id={id}>
          <span className="sh-md" aria-hidden="true">
            ##
          </span>
          {title}
        </h2>
        {hint && <p>{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export default function Landing() {
  const { pub, user } = useApp();
  const items = libraryItems(pub);
  const total = items.length;
  const perGaya = items.reduce((m, t) => ({ ...m, [t.gaya]: (m[t.gaya] || 0) + 1 }), {});
  const title = pub.site.title || DEF_TITLE;
  const comma = title.indexOf(',');
  const marked = comma > 0 && title.slice(comma + 1).trim();

  return (
    <main className="view landing">
      <section className="hero">
        <div className="hero-text">
          <h1 style={{ '--d': 1 }}>
            {marked ? (
              <>
                {title.slice(0, comma + 1)} <mark>{marked}</mark>
              </>
            ) : (
              title
            )}
          </h1>
          <p className="hero-sub" style={{ '--d': 2 }}>
            {pub.site.subtitle || DEF_SUB}
          </p>
          <div className="row hero-cta" style={{ '--d': 3 }}>
            <Link className="btn big" to="/buat">
              Buat PRD dari usahamu
            </Link>
            <a className="btn quiet big" href="#perpustakaan">
              Jelajahi perpustakaan
            </a>
          </div>
          <dl className="hero-facts" style={{ '--d': 4 }}>
            <div>
              <dt>PRD website dan aplikasi mobile</dt>
              <dd>
                <CountUp value={total} delay={500} />
              </dd>
            </div>
            <div>
              <dt>gaya desain untuk berbagai jenis usaha</dt>
              <dd>
                <CountUp value={Object.keys(GAYA).length} delay={600} />
              </dd>
            </div>
            <div>
              <dt>bagian dengan urutan tetap</dt>
              <dd>
                <CountUp value={SECTIONS.length} delay={700} />
              </dd>
            </div>
          </dl>
        </div>
        <div className="hero-demo" style={{ '--d': 2 }}>
          <HeroDemo />
        </div>
      </section>

      <section id="perpustakaan" className="sec" aria-labelledby="h-lib">
        <SecHead
          id="h-lib"
          title="Perpustakaan PRD"
          hint={
            <>
              Setiap PRD berisi peran, alur, dan fitur tiap peran, serta menjelaskan cocok untuk usaha apa. Buka salah satu untuk membaca dokumennya.
              <span className="hover-only"> Arahkan kursor ke kartu website untuk melihat seluruh halamannya.</span>
            </>
          }
        />
        <Library batas={8} utama={UNGGULAN} />
      </section>

      <section className="sec" aria-labelledby="h-peran">
        <SecHead
          id="h-peran"
          title="Bukan hanya landing page"
          hint="Setiap PRD menulis siapa saja penggunanya, apa yang boleh dilakukan tiap peran, dan halaman milik masing-masing, dari pengunjung sampai admin. Pilih peran untuk melihat sisi lain dari PRD yang sama."
        />
        <RoleShowcase />
      </section>

      <section className="sec" aria-labelledby="h-gaya">
        <SecHead
          id="h-gaya"
          title="Empat belas gaya desain"
          hint="Gaya tiap PRD dipilih sesuai jenis usahanya, dan bisa kamu ganti di editor. Pilih satu gaya untuk melihat semua PRD-nya."
        />
        <GayaGallery perGaya={perGaya} />
      </section>

      <section className="sec" aria-labelledby="h-cara">
        <SecHead id="h-cara" title="Cara memakainya" hint="Dari perpustakaan sampai ke AI builder dalam tiga langkah.">
          <Link className="btn quiet" to="/cara-pakai">
            Baca panduan lengkap
          </Link>
        </SecHead>
        <Steps />
      </section>

      <section className="sec" aria-labelledby="h-struktur">
        <StructureCheck />
      </section>

      <section className="sec" aria-labelledby="h-isi">
        <SecHead id="h-isi" title="Yang ada di Noktah" hint="Beberapa di antaranya bisa langsung kamu coba di sini." />
        <div className="bento">
          <TileRead />
          <TileColor />
          <TileDevice />
          <TileAi />
        </div>
      </section>

      <section className="closing" data-reveal="up">
        <Stipple scene="bukit" />
        <div className="closing-text">
          <h2>Mulai dari PRD yang sudah rapi.</h2>
          <p>Pilih satu dari {total} PRD, sesuaikan isinya, lalu berikan ke AI builder atau developer.</p>
        </div>
        <div className="row">
          <Link className="btn big" to="/perpustakaan">
            Buka perpustakaan
          </Link>
          {user ? (
            <Link className="btn ghost big" to="/prd">
              Buka PRD Saya
            </Link>
          ) : (
            <Link className="btn ghost big" to="/daftar">
              Buat akun
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

/* ---------- Galeri gaya desain ---------- */

// Satu contoh PRD untuk tiap gaya, dipakai sebagai gambar kartu.
const CONTOH_GAYA = {
  bersih: 'landing',
  hangat: 'restoran',
  tegas: 'bengkel',
  gelap: 'kursus',
  elegan: 'hotel',
  ceria: 'sekolah',
  minimal: 'profil',
  gradasi: 'invoice',
  teknis: 'dokumentasi',
  resmi: 'masjid',
  ukiran: 'wisata',
  halftone: 'event',
  retro: 'helpdesk',
  editorial: 'berita',
};

function GayaGallery({ perGaya }) {
  const contoh = useMemo(() => Object.fromEntries(Object.entries(CONTOH_GAYA).map(([g, id]) => [g, fromBuiltin(id)])), []);
  return (
    <ul className="gy-grid" data-reveal="stagger">
      {Object.entries(GAYA).map(([k, g]) => (
        <li key={k}>
          <Link className="gy-card" to={'/perpustakaan?gaya=' + k}>
            <MockThumb state={contoh[k]} className="tpl-thumb gy-thumb" lazy />
            <span className="gy-body">
              <b>{g.nama}</b>
              <span>{g.cocok}</span>
              <em>{perGaya[k] || 0} PRD</em>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Tiga langkah ---------- */

function Steps() {
  return (
    <ol className="how" data-reveal="stagger">
      <li>
        <div className="how-head">
          <span className="how-n">1</span>
          <i className="how-link" data-reveal-line aria-hidden="true" />
        </div>
        <div className="how-vis v-pick" aria-hidden="true">
          <span>
            <b />
            Toko online
          </span>
          <span className="on">
            <b />
            Aplikasi belanja
          </span>
          <span>
            <b />
            Dashboard
          </span>
        </div>
        <h3>Pilih PRD dari perpustakaan</h3>
        <p>
          Tersedia untuk website dan aplikasi mobile. Tiap PRD sudah berisi peran dan hak akses, halaman tiap peran, alur utama, kebutuhan dengan
          kriteria penerimaan, dan model data.
        </p>
      </li>
      <li>
        <div className="how-head">
          <span className="how-n">2</span>
          <i className="how-link" data-reveal-line aria-hidden="true" />
        </div>
        <div className="how-vis v-edit" aria-hidden="true">
          <span className="ve-l">Nama website</span>
          <span className="ve-in">
            Kopi Senja
            <i />
          </span>
          <span className="ve-l">Warna merek</span>
          <span className="ve-sw">
            <i style={{ '--w': '#9a4f1f' }} className="on" />
            <i style={{ '--w': '#2456e6' }} />
            <i style={{ '--w': '#0f766e' }} />
            <i style={{ '--w': '#be185d' }} />
          </span>
        </div>
        <h3>Sesuaikan isinya</h3>
        <p>
          Ubah nama, peran, fitur, prioritas, warna, dan teknologi. Susunan dokumennya tetap, dan pemeriksa struktur memberi tahu bila ada yang
          menyimpang.
        </p>
      </li>
      <li>
        <div className="how-head">
          <span className="how-n">3</span>
        </div>
        <div className="how-vis v-send" aria-hidden="true">
          <span className="vs-file">
            {Icon.file}
            prd-kopisenja.md
          </span>
          <span className="vs-msg">Bangun website sesuai PRD ini. Kerjakan kebutuhan P0 lebih dulu.</span>
        </div>
        <h3>Berikan ke AI atau developer</h3>
        <p>Salin atau unduh sebagai Markdown, lalu tempel ke AI builder. Bagian terakhir dokumen berisi instruksi kerja untuk AI.</p>
      </li>
    </ol>
  );
}

/* ---------- Pemeriksa struktur yang berjalan seiring digulir ---------- */

function StructureCheck() {
  const total = SECTIONS.length;
  const [n, setN] = useState(total);
  const listRef = useRef(null);
  const timer = useRef(0);

  // Bagian dicentang satu per satu saat melewati 60% tinggi layar.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || reducedMotion()) return undefined;
    const rows = [...list.children];
    let best = -1;
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.6;
      let c = 0;
      for (const r of rows) {
        if (r.getBoundingClientRect().top < line) c += 1;
        else break;
      }
      if (c > best) {
        best = c;
        setN(c);
      }
      if (best >= rows.length) stop();
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const stop = () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      stop();
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => () => clearInterval(timer.current), []);

  const rerun = useCallback(() => {
    clearInterval(timer.current);
    if (reducedMotion()) {
      setN(total);
      return;
    }
    let k = 0;
    setN(0);
    timer.current = setInterval(() => {
      k += 1;
      setN(k);
      if (k >= total) clearInterval(timer.current);
    }, 90);
  }, [total]);

  const done = n >= total;
  return (
    <div className="chk">
      <div className="chk-side">
        <SecHead
          id="h-struktur"
          title="Satu struktur untuk semua PRD"
          hint={`${jumlahBagian()} bagian dengan nomor, judul, dan urutan yang tetap, dari peran dan hak akses sampai instruksi untuk AI. Karena susunannya selalu sama, AI builder tahu di mana mencari tiap informasi.`}
        />
        <div className={'chk-card' + (done ? ' is-done' : '')} data-reveal="up">
          <div className="chk-top">
            <b>Pemeriksa struktur</b>
            <button type="button" className="link" onClick={rerun}>
              Periksa ulang
            </button>
          </div>
          <div className="chk-bar" aria-hidden="true">
            <i style={{ width: (n / total) * 100 + '%' }} />
          </div>
          <p className="chk-msg">
            {done ? (
              <>
                <span className="badge ok">✓ Sesuai struktur</span>
                <span>
                  {total} dari {total} bagian lengkap
                </span>
              </>
            ) : (
              <span>
                Memeriksa bagian {Math.min(n + 1, total)} dari {total}…
              </span>
            )}
          </p>
        </div>
        <Link className="btn quiet" to="/struktur" data-reveal="up">
          Baca ketentuan lengkapnya
        </Link>
      </div>
      <ol className="chk-list" ref={listRef}>
        {SECTIONS.map((sec, i) => (
          <li key={sec.n} className={i < n ? 'ok' : ''}>
            <i>{String(sec.n).padStart(2, '0')}</i>
            <b>{sec.tm ? `${sec.t} / ${sec.tm}` : sec.t}</b>
            <span>{sec.d}</span>
            <em aria-hidden="true">{Icon.check}</em>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- Kartu fitur ---------- */

function Tile({ className, title, text, action, children, delay = 0 }) {
  return (
    <article className={'tile spot ' + className} onPointerMove={spotlight} data-reveal="up" data-reveal-delay={delay}>
      <div className="tile-vis">{children}</div>
      <div className="tile-text">
        <h3>{title}</h3>
        <p>{text}</p>
        {action}
      </div>
    </article>
  );
}

function TileRead() {
  const copyPrd = useCopyPrd();
  const sample = useMemo(() => genMd(fromBuiltin('toko')), []);
  return (
    <Tile
      className="t-read"
      title="Baca, salin, dan unduh tanpa akun"
      text="Setiap PRD di perpustakaan terbuka untuk siapa saja. Akun baru dibutuhkan saat kamu ingin menyimpan versi sendiri."
      action={
        <Link className="link" to="/perpustakaan">
          Buka perpustakaan
        </Link>
      }
    >
      <div className="md-win">
        <div className="md-bar">
          <span className="md-file">
            {Icon.file}
            prd-kopisenja.md
          </span>
          <button type="button" className="md-copy" onClick={() => copyPrd(sample, [])}>
            {Icon.copy}
            Salin contoh
          </button>
        </div>
        <pre className="md-code">
          <span className="t-m">---</span>
          {'\n'}
          <span className="t-k">struktur:</span> {STRUKTUR}
          {'\n'}
          <span className="t-k">platform:</span> website
          {'\n'}
          <span className="t-k">peran:</span> Pengunjung, Pembeli, Admin
          {'\n'}
          <span className="t-m">---</span>
          {'\n\n'}
          <span className="t-h"># PRD: Kopi Senja</span>
          {'\n\n'}
          <span className="t-h">### FR-03: Keranjang belanja</span>
          {'\n'}- <b>Prioritas:</b> P0
          {'\n'}- <b>Peran:</b> Pengunjung
          {'\n'}- <b>Kriteria penerimaan:</b>
          {'\n'}
          {'  '}- [ ] Total berubah seketika
        </pre>
      </div>
    </Tile>
  );
}

const SWATCHES = [
  ['#9a4f1f', 'Cokelat kopi'],
  ['#2456e6', 'Biru'],
  ['#0f766e', 'Hijau toska'],
  ['#c2410c', 'Oranye'],
  ['#be185d', 'Merah muda'],
  ['#6d28d9', 'Ungu'],
];

function TileColor() {
  const [c, setC] = useState(SWATCHES[0][0]);
  return (
    <Tile
      className="t-color"
      delay={1}
      title="Sesuaikan, pratinjau ikut berubah"
      text="Di editor, setiap perubahan langsung terlihat di pratinjau. Coba ganti warna merek contoh ini."
      action={
        <Link className="link" to="/prd">
          Buka PRD Saya
        </Link>
      }
    >
      <div className="vc" style={{ '--c': c }}>
        <div className="vc-site" aria-hidden="true">
          <div className="vc-nav">
            <i />
            <b>Kopi Senja</b>
            <span />
          </div>
          <div className="vc-hero">
            <span className="vc-t" />
            <span className="vc-t s" />
            <span className="vc-btn">Belanja sekarang</span>
          </div>
          <div className="vc-cards">
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="vc-sw" role="group" aria-label="Warna merek contoh">
          {SWATCHES.map(([w, name]) => (
            <button type="button" key={w} aria-pressed={w === c} aria-label={name} title={name} style={{ '--w': w }} onClick={() => setC(w)} />
          ))}
        </div>
      </div>
    </Tile>
  );
}

function TileDevice() {
  const [phone, setPhone] = useState(false);
  const [manual, setManual] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref);
  useEffect(() => {
    if (manual || !inView || reducedMotion()) return undefined;
    const t = setInterval(() => setPhone((p) => !p), 3200);
    return () => clearInterval(t);
  }, [manual, inView]);
  const choose = (v) => {
    setManual(true);
    setPhone(v);
  };
  return (
    <Tile
      className="t-device"
      delay={2}
      title="Website dan aplikasi mobile"
      text="PRD website punya pratinjau desktop dan ponsel. PRD aplikasi mobile memakai daftar layar dan tab navigasi bawah. Keduanya bisa dilihat dari sisi tiap peran."
    >
      <div className="vd" ref={ref}>
        <div className={'vd-frame' + (phone ? ' is-phone' : '')} aria-hidden="true">
          <div className="vd-bar">
            <i />
            <i />
            <i />
          </div>
          <div className="vd-body">
            <span className="vd-t" />
            <span className="vd-l" />
            <span className="vd-l s" />
            <div className="vd-grid">
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="vd-tabs">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="seg vd-seg" role="group" aria-label="Jenis pratinjau">
          <button type="button" aria-pressed={!phone} onClick={() => choose(false)}>
            {Icon.web}
            Website
          </button>
          <button type="button" aria-pressed={phone} onClick={() => choose(true)}>
            {Icon.phone}
            Aplikasi mobile
          </button>
        </div>
      </div>
    </Tile>
  );
}

function TileAi() {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, threshold: 0.6 });
  const [go, setGo] = useState(false);
  useEffect(() => {
    if (seen && !reducedMotion()) setGo(true);
  }, [seen]);
  return (
    <Tile
      className="t-ai"
      delay={3}
      title="Siap dibaca AI builder"
      text="Bagian terakhir setiap PRD berisi aturan kerja untuk AI: mulai dari peran dan model data, kerjakan P0 lebih dulu, periksa hak akses di server, dan jangan menambah fitur."
      action={
        <Link className="link" to="/struktur">
          Lihat struktur PRD
        </Link>
      }
    >
      <div className={'vai' + (go ? ' go' : '')} ref={ref}>
        <div className="vai-doc">
          <b>## {sectionTitle(SECTIONS[SECTIONS.length - 1], false)}</b>
          <ol>
            <li>Baca seluruh dokumen ini sebelum menulis kode.</li>
            <li>
              Mulai dari peran dan hak akses (bagian {NO['Peran dan hak akses']}) serta model data (bagian {NO['Model data']}).
            </li>
            <li>Kerjakan kebutuhan P0 lebih dulu, berurutan dari nomor FR terkecil.</li>
          </ol>
        </div>
        <div className="vai-reply">
          <span className="vai-who">Contoh balasan AI builder</span>
          <span className="vai-msg">
            <span className="vai-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="vai-text">Siap. Saya buat dulu peran Pengunjung, Pembeli, dan Admin, lalu FR-01: Katalog dengan filter dan pencarian.</span>
          </span>
        </div>
      </div>
    </Tile>
  );
}
