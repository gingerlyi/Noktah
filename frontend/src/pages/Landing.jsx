// Landing page: memperkenalkan perpustakaan PRD, cara memakainya, struktur baku, dan isi Noktah.
// Animasi: demo di hero, angka yang menghitung naik, pemeriksa struktur yang berjalan seiring halaman
// digulir, dan bagian-bagian yang muncul saat masuk layar (lihat components/Motion.jsx).
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DEF_SUB, DEF_TITLE, libraryItems, useApp } from '../lib/app.jsx';
import { GAYA, T, TPL_IDS, UNGGULAN } from '../lib/catalog.js';
import { NO, SECTIONS, STRUKTUR, fromBuiltin, fromTemplate, genMd, jumlahBagian, sectionTitle } from '../lib/prd.js';
import { Library } from '../components/Library.jsx';
import HeroDemo from '../components/HeroDemo.jsx';
import { CardStack } from '../components/CardStack.jsx';
import RoleShowcase from '../components/RoleShowcase.jsx';
import { CountUp, reducedMotion, spotlight, useInView } from '../components/Motion.jsx';
import { useCopyPrd } from '../components/Editor.jsx';
import { Icon, MockThumb, Stipple } from '../components/ui.jsx';

// Judul bagian bergaya Markdown: "##" kecil di depan judul, seperti di dokumen PRD.
function SecHead({ id, title, hint, children, className = 'mb-7' }) {
  return (
    <div className={'flex flex-wrap items-end justify-between gap-x-6 gap-y-3 ' + className} data-reveal="up">
      <div className="flex max-w-[64ch] min-w-0 flex-col gap-2.5">
        <h2 id={id} className="m-0 font-display text-[clamp(1.75rem,3.4vw,2.6rem)]/[1.1] font-medium">
          <span className="mr-[.5em] align-[.3em] font-mono text-[.5em]/none font-semibold text-muted" aria-hidden="true">
            ##
          </span>
          {title}
        </h2>
        {hint && <p className="m-0 text-[1.05rem] text-muted">{hint}</p>}
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
  const pilihan = useMemo(
    () => libraryItems(pub).filter((t) => UNGGULAN.includes(t.id)).map((t) => ({ ...t, state: fromTemplate(t.id, pub.templates) })),
    [pub],
  );
  const title = pub.site.title || DEF_TITLE;
  const comma = title.indexOf(',');
  const marked = comma > 0 && title.slice(comma + 1).trim();

  return (
    <main className="view gap-[clamp(72px,9vw,112px)] max-md:gap-11">
      <section className="relative grid grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)] items-center gap-[clamp(28px,4vw,60px)] pt-[clamp(20px,4.5vw,60px)] pb-2 max-[981px]:grid-cols-1">
        <div className="flex min-w-0 flex-col items-start gap-5.5 self-start [&>*]:[animation-delay:calc(var(--d,0)*80ms)] motion-safe:[&>*]:animate-[rise_.75s_var(--ease-out)_both]">
          <h1 className="m-0 font-display text-[clamp(2.4rem,5vw,3.9rem)]/none font-medium italic" style={{ '--d': 1 }}>
            {marked ? (
              <>
                {title.slice(0, comma + 1)} <mark className="block bg-transparent pb-[.08em] text-muted">{marked}</mark>
              </>
            ) : (
              title
            )}
          </h1>
          <p className="m-0 max-w-[52ch] font-mono text-base/[1.7] text-muted" style={{ '--d': 2 }}>
            {pub.site.subtitle || DEF_SUB}
          </p>
          <div className="row gap-3 max-hp:w-full max-hp:[&_.btn]:flex-[1_1_100%]" style={{ '--d': 3 }}>
            <Link className="btn big" to="/buat">
              Buat PRD dari usahamu
            </Link>
            <a className="btn quiet big" href="#perpustakaan">
              Jelajahi perpustakaan
            </a>
          </div>
          <dl
            className="mt-1 mb-0 grid grid-cols-[repeat(3,auto)] justify-start gap-3 p-0 max-hp:w-full max-hp:grid-cols-3 max-hp:gap-2"
            style={{ '--d': 4 }}
          >
            {[
              ['PRD website dan aplikasi mobile', total, 500],
              ['gaya desain untuk berbagai jenis usaha', Object.keys(GAYA).length, 600],
              ['bagian dengan urutan tetap', SECTIONS.length, 700],
            ].map(([label, n, delay]) => (
              <div
                key={label}
                className="flex min-w-0 flex-col-reverse justify-end gap-1 rounded-2xl border border-[color-mix(in_srgb,var(--accent-2)_22%,var(--line))] bg-surface px-4.5 py-3.5 max-hp:p-3"
              >
                <dt className="max-w-[17ch] font-mono text-[.84rem]/[1.35] font-medium tracking-[.06em] text-muted uppercase">{label}</dt>
                <dd className="m-0 font-display text-[1.9rem]/none font-medium tracking-[-.03em] tabular-nums max-hp:text-[1.55rem]">
                  <CountUp value={n} delay={delay} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="min-w-0 motion-safe:animate-[rise_.75s_var(--ease-out)_both] [animation-delay:160ms]" style={{ '--d': 2 }}>
          <HeroDemo />
        </div>
      </section>

      <section id="perpustakaan" aria-labelledby="h-lib">
        <SecHead
          id="h-lib"
          title="Perpustakaan PRD"
          hint={
            <>
              Setiap PRD berisi peran, alur, dan fitur tiap peran, serta menjelaskan cocok untuk usaha apa. Buka salah satu untuk membaca dokumennya.
              <span className="hidden [@media(hover:hover)]:inline"> Arahkan kursor ke kartu website untuk melihat seluruh halamannya.</span>
            </>
          }
        />
        <CardStack items={pilihan} />
        <h3 className="mt-14 mb-4 font-display text-[1.2rem] font-bold">Cari PRD lainnya</h3>
        <Library batas={8} />
      </section>

      <section aria-labelledby="h-peran">
        <SecHead
          id="h-peran"
          title="Bukan hanya landing page"
          hint="Setiap PRD menulis siapa saja penggunanya, apa yang boleh dilakukan tiap peran, dan halaman milik masing-masing, dari pengunjung sampai admin. Pilih peran untuk melihat sisi lain dari PRD yang sama."
        />
        <RoleShowcase />
      </section>

      <section aria-labelledby="h-gaya">
        <SecHead
          id="h-gaya"
          title={`${Object.keys(GAYA).length} gaya desain, satu untuk tiap PRD`}
          hint="Setiap PRD punya gaya sendiri yang dipilih sesuai jenis usahanya: palet, huruf, bentuk, dan ciri tampilannya. Gayanya bisa kamu ganti di editor."
        >
          <Link className="btn quiet" to="/perpustakaan">
            Lihat semua di perpustakaan
          </Link>
        </SecHead>
        <GayaGallery perGaya={perGaya} />
      </section>

      <section aria-labelledby="h-cara">
        <SecHead id="h-cara" title="Cara memakainya" hint="Dari perpustakaan sampai ke AI builder dalam tiga langkah.">
          <Link className="btn quiet" to="/cara-pakai">
            Baca panduan lengkap
          </Link>
        </SecHead>
        <Steps />
      </section>

      <section aria-labelledby="h-struktur">
        <StructureCheck />
      </section>

      <section aria-labelledby="h-isi">
        <SecHead id="h-isi" title="Yang ada di Noktah" hint="Beberapa di antaranya bisa langsung kamu coba di sini." />
        <div className="grid grid-cols-5 gap-4.5 max-md:grid-cols-1">
          <TileRead />
          <TileColor />
          <TileDevice />
          <TileAi />
        </div>
      </section>

      <section
        className="tema-gelap relative isolate flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-[28px] border border-line bg-black p-[clamp(32px,5vw,64px)] text-ink max-hp:rounded-[22px]"
        data-reveal="up"
      >
        <Stipple scene="bukit" className="-z-1 opacity-55" />
        <div className="flex max-w-[42ch] flex-col gap-2.5">
          <h2 className="m-0 font-display text-[clamp(1.8rem,3.6vw,2.8rem)]/[1.08] font-medium">Mulai dari PRD yang sudah rapi.</h2>
          <p className="m-0 text-[1.05rem] opacity-90">Pilih satu dari {total} PRD, sesuaikan isinya, lalu berikan ke AI builder atau developer.</p>
        </div>
        <div className="row max-hp:w-full max-hp:[&_.btn]:flex-[1_1_100%]">
          <Link className="btn big border-on-accent bg-on-accent text-accent" to="/perpustakaan">
            Buka perpustakaan
          </Link>
          {user ? (
            <Link className={GHOST} to="/prd">
              Buka PRD Saya
            </Link>
          ) : (
            <Link className={GHOST} to="/daftar">
              Buat akun
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

const GHOST = 'btn ghost big border-line text-ink hover:bg-[color-mix(in_srgb,var(--on-accent)_12%,transparent)]';

/* ---------- Galeri gaya desain ---------- */

// Satu contoh PRD untuk tiap gaya, dipakai sebagai gambar kartu.
// Gaya yang ditampilkan di landing page. Tiap gaya dipakai tepat satu PRD bawaan, yang menjadi gambar kartunya.
const PILIHAN_GAYA = ['bersih', 'kinetik', 'sangrai', 'ukiran', 'romansa', 'cmyk', 'malam-kafe', 'galeri-seni', 'halftone', 'neon', 'krayon', 'konser', 'emas', 'editorial', 'sunyi'];

function GayaGallery({ perGaya }) {
  const contoh = useMemo(() => Object.fromEntries(PILIHAN_GAYA.map((g) => [g, fromBuiltin(TPL_IDS.find((id) => T[id].d.gaya === g))])), []);
  return (
    <ul className="m-0 grid list-none grid-cols-3 gap-4 p-0 max-lg:grid-cols-2 max-hp:grid-cols-1" data-reveal="stagger">
      {PILIHAN_GAYA.map((k) => [k, GAYA[k]]).map(([k, g]) => (
        // Kartu memakai warna latar, teks, dan huruf judul gayanya sendiri; contoh PRD-nya muncul miring di pojok kanan bawah.
        <li key={k}>
          <Link
            className="gy-card group relative flex h-full min-h-52 flex-col overflow-hidden rounded-2xl border p-5.5 text-inherit no-underline shadow-[0_1px_2px_rgb(0_0_0/.06)] motion-safe:transition-[translate,box-shadow] motion-safe:duration-300 motion-safe:ease-(--ease-out) hover:shadow-[0_22px_44px_-20px_rgb(0_0_0/.4)] motion-safe:hover:-translate-y-1"
            style={{ background: g.latar, color: g.teks, borderColor: g.t?.line || 'color-mix(in srgb, ' + g.teks + ' 14%, transparent)' }}
            to={'/perpustakaan?gaya=' + k}
          >
            <span className="relative z-1 flex max-w-[64%] flex-col gap-1.5 max-hp:max-w-[70%]">
              <b
                className="text-[1.18rem]/[1.2] font-bold"
                style={{ fontFamily: g.t?.fd || 'var(--font-display)', fontStyle: g.t?.judul === 'miring' ? 'italic' : undefined }}
              >
                {g.nama}
              </b>
              <span className="text-[.84rem]/[1.45]" style={{ color: g.t?.muted || 'color-mix(in srgb, ' + g.teks + ' 72%, ' + g.latar + ')' }}>
                {g.cocok}
              </span>
            </span>
            <span className="relative z-1 mt-auto inline-flex items-center gap-1.5 pt-4 text-[.86rem] font-bold [&_.ico]:size-4 motion-safe:[&_.ico]:transition-transform group-hover:[&_.ico]:translate-x-1">
              {perGaya[k] || 0} PRD {Icon.arrow}
            </span>
            <MockThumb
              state={contoh[k]}
              className="tpl-thumb !absolute -right-7 -bottom-8 w-[52%] rotate-[-8deg] rounded-xl border shadow-[0_18px_36px_-14px_rgb(0_0_0/.45)] motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-(--ease-out) group-hover:rotate-[-4deg] group-hover:scale-105"
              lazy
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Tiga langkah ---------- */

const LANGKAH = 'group flex min-w-0 flex-col gap-3';
const NOMOR =
  'grid size-11 flex-none place-items-center rounded-full bg-(--grad) font-display text-[1.05rem]/none font-extrabold text-on-accent';
const GARIS = 'mr-[calc(-1*clamp(18px,2.6vw,32px))] ml-3.5 h-0.5 flex-1 origin-left rounded-xs bg-line opacity-45 max-lg:hidden';
const VIS = 'relative mt-1.5 h-37.5 overflow-hidden rounded-[18px] border border-line bg-(--grad-soft)';
const JUDUL3 = 'mt-1 mb-0 font-display text-[1.2rem]/[1.25] font-bold tracking-[-.01em]';
// Kartu kecil di langkah 1; tengahnya terangkat, dua lainnya miring ke samping dan melebar saat disorot.
const KARTU =
  'absolute top-1/2 left-1/2 flex w-[36%] flex-col gap-1.5 overflow-hidden rounded-[10px] border border-line bg-surface px-1.75 pt-1.75 pb-2.25 text-[.7rem] font-semibold text-ellipsis whitespace-nowrap [translate:-50%_-46%] transition-transform duration-500 ease-(--ease-out)';

function Steps() {
  return (
    <ol className="m-0 grid list-none grid-cols-3 gap-[clamp(18px,2.6vw,32px)] p-0 max-lg:grid-cols-1 max-lg:gap-9" data-reveal="stagger">
      <li className={LANGKAH}>
        <div className="flex items-center">
          <span className={NOMOR}>1</span>
          <i className={GARIS} data-reveal-line aria-hidden="true" />
        </div>
        <div className={VIS} aria-hidden="true">
          <span className={KARTU + ' [transform:translateX(-62%)_rotate(-8deg)] group-hover:[transform:translateX(-76%)_rotate(-12deg)]'}>
            <b className="block h-10.5 rounded-md bg-(--skel)" />
            Toko online
          </span>
          <span
            className={
              KARTU +
              ' z-1 border-[color-mix(in_srgb,var(--accent)_45%,var(--line))] [transform:translateY(-4px)] group-hover:[transform:translateY(-10px)_scale(1.05)]'
            }
          >
            <b className="block h-10.5 rounded-md bg-(--grad) opacity-85" />
            Aplikasi belanja
          </span>
          <span className={KARTU + ' [transform:translateX(62%)_rotate(8deg)] group-hover:[transform:translateX(76%)_rotate(12deg)]'}>
            <b className="block h-10.5 rounded-md bg-(--skel)" />
            Dashboard
          </span>
        </div>
        <h3 className={JUDUL3}>Pilih PRD dari perpustakaan</h3>
        <p className="m-0 text-muted">
          Tersedia untuk website dan aplikasi mobile. Tiap PRD sudah berisi peran dan hak akses, halaman tiap peran, alur utama, kebutuhan dengan
          kriteria penerimaan, dan model data.
        </p>
      </li>
      <li className={LANGKAH}>
        <div className="flex items-center">
          <span className={NOMOR}>2</span>
          <i className={GARIS} data-reveal-line aria-hidden="true" />
        </div>
        <div className={VIS + ' flex flex-col justify-center gap-1.5 px-5.5 py-3.5'} aria-hidden="true">
          <span className="text-[.7rem] font-semibold text-muted">Nama website</span>
          <span className="flex items-center rounded-lg border border-[color-mix(in_srgb,var(--accent)_50%,var(--line))] bg-surface px-2.5 py-1.5 text-[.84rem] font-semibold shadow-[0_0_0_3px_var(--ring)]">
            Kopi Senja
            <i className="ml-0.5 h-[1.05em] w-[1.5px] bg-accent motion-safe:animate-[blink_1s_steps(1)_infinite]" />
          </span>
          <span className="text-[.7rem] font-semibold text-muted">Warna merek</span>
          <span className="flex gap-2">
            {['#9a4f1f', '#2456e6', '#0f766e', '#be185d'].map((w, k) => (
              <i
                key={w}
                className={'size-5 rounded-full border-2 border-surface bg-(--w) ' + (k ? 'shadow-[0_0_0_1px_var(--line)]' : 'shadow-[0_0_0_2px_var(--ink)]')}
                style={{ '--w': w }}
              />
            ))}
          </span>
        </div>
        <h3 className={JUDUL3}>Sesuaikan isinya</h3>
        <p className="m-0 text-muted">
          Ubah nama, peran, fitur, prioritas, warna, dan teknologi. Susunan dokumennya tetap, dan pemeriksa struktur memberi tahu bila ada yang
          menyimpang.
        </p>
      </li>
      <li className={LANGKAH}>
        <div className="flex items-center">
          <span className={NOMOR}>3</span>
        </div>
        <div className={VIS + ' flex flex-col items-start justify-center gap-3 px-4.5 py-3.5'} aria-hidden="true">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 font-mono text-[.74rem]/none font-medium [&_.ico]:size-3.5 [&_.ico]:text-accent">
            {Icon.file}
            prd-kopisenja.md
          </span>
          <span className="max-w-[88%] self-end rounded-[14px_14px_4px_14px] bg-(--grad) px-3 py-2 text-[.78rem]/[1.4] text-on-accent transition-[translate] duration-400 ease-(--ease-spring) motion-safe:group-hover:-translate-y-1">
            Bangun website sesuai PRD ini. Kerjakan kebutuhan P0 lebih dulu.
          </span>
        </div>
        <h3 className={JUDUL3}>Berikan ke AI atau developer</h3>
        <p className="m-0 text-muted">Salin atau unduh sebagai Markdown, lalu tempel ke AI builder. Bagian terakhir dokumen berisi instruksi kerja untuk AI.</p>
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
    <div className="grid grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] items-start gap-[clamp(24px,4vw,64px)] max-[981px]:grid-cols-1">
      <div className="sticky top-27.5 flex flex-col items-start gap-4.5 max-[981px]:static">
        <SecHead
          className=""
          id="h-struktur"
          title="Satu struktur untuk semua PRD"
          hint={`${jumlahBagian()} bagian dengan nomor, judul, dan urutan yang tetap, dari peran dan hak akses sampai instruksi untuk AI. Karena susunannya selalu sama, AI builder tahu di mana mencari tiap informasi.`}
        />
        <div className="flex w-full flex-col gap-3 rounded-[18px] border border-line bg-surface px-5 py-4.5" data-reveal="up">
          <div className="flex items-center justify-between gap-2.5">
            <b>Pemeriksa struktur</b>
            <button type="button" className="link p-0" onClick={rerun}>
              Periksa ulang
            </button>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-(--skel)" aria-hidden="true">
            <i className="block h-full rounded-[inherit] bg-(--grad) transition-[width] duration-350 ease-(--ease-out)" style={{ width: (n / total) * 100 + '%' }} />
          </div>
          <p className="m-0 flex min-h-8.5 flex-wrap items-center gap-2.5 text-[.92rem] text-muted">
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
      <ol className="m-0 flex list-none flex-col p-0" ref={listRef}>
        {SECTIONS.map((sec, i) => (
          <li
            key={sec.n}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-0.5 border-t border-line px-1 py-3.5 first:border-t-0"
          >
            <i
              className={
                'row-span-2 grid size-[2.5em] place-items-center rounded-full border font-mono text-[.8rem]/none font-semibold not-italic transition-colors duration-300 ' +
                (i < n ? 'border-transparent bg-(--grad) text-on-accent' : 'border-line text-muted')
              }
            >
              {String(sec.n).padStart(2, '0')}
            </i>
            <b className="font-bold">{sec.tm ? `${sec.t} / ${sec.tm}` : sec.t}</b>
            <span className="col-start-2 text-[.9rem] text-muted">{sec.d}</span>
            <em
              aria-hidden="true"
              className={
                'col-start-3 row-span-2 row-start-1 grid size-6.5 place-items-center rounded-full bg-accent-soft text-accent transition-[opacity,scale] duration-[250ms,450ms] ease-(--ease-spring) [&_.ico]:size-3.75 ' +
                (i < n ? 'opacity-100' : 'scale-40 opacity-0')
              }
            >
              {Icon.check}
            </em>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- Kartu fitur ---------- */

// Kartu fitur. lebar: 'besar' (3 dari 5 kolom) atau 'kecil' (2 kolom); vis mengatur tinggi gambar di layar sempit.
function Tile({ besar = false, vis, title, text, action, children, delay = 0 }) {
  return (
    <article
      className={
        'group relative isolate flex min-w-0 flex-col rounded-[22px] border border-line bg-surface motion-safe:transition-[translate] motion-safe:duration-350 motion-safe:ease-(--ease-out) motion-safe:hover:-translate-y-0.75 max-md:col-auto ' +
        (besar ? 'col-span-3' : 'col-span-2')
      }
      onPointerMove={spotlight}
      data-reveal="up"
      data-reveal-delay={delay}
    >
      <div className={'relative mx-2.5 mt-2.5 grid h-62.5 place-items-center overflow-hidden rounded-2xl bg-(--grad-soft) p-4.5 ' + vis}>{children}</div>
      <div className="flex flex-col items-start gap-1.5 px-5.5 pt-4.5 pb-5.5 [&_.link]:px-0 [&_.link]:pt-1 [&_.link]:pb-0">
        <h3 className="m-0 font-display text-[1.22rem]/[1.25] font-bold tracking-[-.01em]">{title}</h3>
        <p className="m-0 max-w-[52ch] text-muted">{text}</p>
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
      besar
      vis="max-md:h-57.5"
      title="Baca, salin, dan unduh tanpa akun"
      text="Setiap PRD di perpustakaan terbuka untuk siapa saja. Akun baru dibutuhkan saat kamu ingin menyimpan versi sendiri."
      action={
        <Link className="link" to="/perpustakaan">
          Buka perpustakaan
        </Link>
      }
    >
      <div className="mt-0.5 w-full max-w-120 self-start overflow-hidden rounded-xl border border-line bg-surface [mask-image:linear-gradient(#000_70%,transparent_98%)] transition-[translate] duration-500 ease-(--ease-out) group-hover:-translate-y-1.5">
        <div className="flex items-center justify-between gap-2.5 border-b border-line py-1.75 pr-1.75 pl-3">
          <span className="inline-flex min-w-0 items-center gap-1.5 font-mono text-[.78rem]/none font-medium text-muted [&_.ico]:size-3.5">
            {Icon.file}
            prd-kopisenja.md
          </span>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[.78rem] font-semibold text-ink hover:border-accent hover:text-accent [&_.ico]:size-3.5"
            onClick={() => copyPrd(sample, [])}
          >
            {Icon.copy}
            Salin contoh
          </button>
        </div>
        <pre className="m-0 px-3.5 pt-3 pb-11 font-mono text-[.8rem]/[1.6] whitespace-pre-wrap text-ink [&_.t-h]:font-bold [&_.t-k]:text-accent [&_.t-m]:text-muted [&_b]:font-bold">
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

const WARNA_T = 'transition-colors duration-450';

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
      vis="max-md:h-auto max-md:min-h-57.5"
      delay={1}
      title="Sesuaikan, pratinjau ikut berubah"
      text="Di editor, setiap perubahan langsung terlihat di pratinjau. Coba ganti warna merek contoh ini."
      action={
        <Link className="link" to="/prd">
          Buka PRD Saya
        </Link>
      }
    >
      <div className="flex w-full flex-col items-center gap-4" style={{ '--c': c }}>
        <div className="w-[min(100%,300px)] overflow-hidden rounded-xl border border-line bg-white text-[#14171f]" aria-hidden="true">
          <div className="flex items-center gap-1.5 border-b border-[#e9ecf2] px-2.5 py-2 text-[.66rem]">
            <i className={'size-3 rounded-sm bg-(--c) ' + WARNA_T} />
            <b>Kopi Senja</b>
            <span className={'ml-auto h-3 w-9 rounded-sm bg-(--c) ' + WARNA_T} />
          </div>
          <div className={'flex flex-col gap-1.5 bg-[color-mix(in_srgb,var(--c)_10%,#fff)] px-3 py-3.5 ' + WARNA_T}>
            <span className="h-2.25 w-4/5 rounded-sm bg-[#14171f] opacity-85" />
            <span className="h-1.75 w-[55%] rounded-sm bg-[#14171f] opacity-35" />
            <span className={'mt-1 self-start rounded-md bg-(--c) px-2.25 py-1.25 text-[.6rem] font-bold text-white ' + WARNA_T}>Belanja sekarang</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 px-3 pt-2.5 pb-3">
            {[0, 1, 2].map((k) => (
              <i key={k} className={'h-8.5 rounded-md bg-[color-mix(in_srgb,var(--c)_18%,#fff)] ' + WARNA_T} />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2.5" role="group" aria-label="Warna merek contoh">
          {SWATCHES.map(([w, name]) => (
            <button
              type="button"
              key={w}
              className="size-6.5 cursor-pointer rounded-full border-3 border-surface bg-(--w) p-0 shadow-[0_0_0_1px_var(--line)] transition-[scale,box-shadow] duration-200 ease-(--ease-spring) hover:scale-112 aria-pressed:shadow-[0_0_0_2px_var(--ink)]"
              aria-pressed={w === c}
              aria-label={name}
              title={name}
              style={{ '--w': w }}
              onClick={() => setC(w)}
            />
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
      vis="max-md:h-auto max-md:min-h-57.5"
      delay={2}
      title="Website dan aplikasi mobile"
      text="PRD website punya pratinjau desktop dan ponsel. PRD aplikasi mobile memakai daftar layar dan tab navigasi bawah. Keduanya bisa dilihat dari sisi tiap peran."
    >
      <div className="flex size-full flex-col items-center justify-between gap-3" ref={ref}>
        <div
          className={
            'flex flex-col overflow-hidden bg-surface transition-[width,height,border-radius,border-color,border-width] duration-600 ease-(--ease-out) ' +
            (phone ? 'h-40.5 w-24 rounded-[18px] border-4 border-(--bezel)' : 'h-37.5 w-[88%] rounded-[10px] border border-line')
          }
          aria-hidden="true"
        >
          <div className={'flex gap-1 border-b border-line px-2 py-1.5 transition-[opacity,margin] duration-[300ms,600ms] ' + (phone ? '-mt-4.75 opacity-0' : '')}>
            {[0, 1, 2].map((k) => (
              <i key={k} className="size-1.5 rounded-full bg-line" />
            ))}
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-2.5">
            <span className="h-2.25 w-3/5 rounded-sm bg-(--grad)" />
            <span className="h-1.5 w-[85%] rounded-sm bg-(--skel)" />
            <span className="h-1.5 w-[55%] rounded-sm bg-(--skel)" />
            <div className={'mt-1 grid gap-1.5 transition-[grid-template-columns] duration-600 ' + (phone ? 'grid-cols-2' : 'grid-cols-3')}>
              {[0, 1, 2].map((k) => (
                <i key={k} className={'h-8.5 rounded-[5px] bg-(--skel)' + (phone && k === 2 ? ' hidden' : '')} />
              ))}
            </div>
          </div>
          <div
            className={
              'flex justify-around border-t border-line px-1 pt-1.25 pb-1.75 transition-[margin,opacity] duration-[600ms,300ms] ' + (phone ? 'mb-0 opacity-100' : '-mb-6 opacity-0')
            }
          >
            {[0, 1, 2, 3].map((k) => (
              <i key={k} className={'size-2.5 rounded-[3px] ' + (k ? 'bg-(--skel)' : 'bg-accent')} />
            ))}
          </div>
        </div>
        <div className="seg [&_.ico]:size-3.75 [&>button]:inline-flex [&>button]:items-center [&>button]:gap-1.5" role="group" aria-label="Jenis pratinjau">
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
      besar
      vis="max-md:h-auto max-md:min-h-57.5"
      delay={3}
      title="Siap dibaca AI builder"
      text="Bagian terakhir setiap PRD berisi aturan kerja untuk AI: mulai dari peran dan model data, kerjakan P0 lebih dulu, periksa hak akses di server, dan jangan menambah fitur."
      action={
        <Link className="link" to="/struktur">
          Lihat struktur PRD
        </Link>
      }
    >
      <div className="flex w-full flex-col gap-3" ref={ref}>
        <div className="rounded-xl border border-line bg-surface px-3.5 py-3 text-[.8rem]">
          <b className="mb-1.5 block font-mono text-[.8rem]/[1.3] font-semibold text-accent">## {sectionTitle(SECTIONS[SECTIONS.length - 1], false)}</b>
          <ol className="m-0 flex flex-col gap-0.75 pl-4.5">
            <li>Baca seluruh dokumen ini sebelum menulis kode.</li>
            <li>
              Mulai dari peran dan hak akses (bagian {NO['Peran dan hak akses']}) serta model data (bagian {NO['Model data']}).
            </li>
            <li>Kerjakan kebutuhan P0 lebih dulu, berurutan dari nomor FR terkecil.</li>
          </ol>
        </div>
        <div className="flex max-w-[86%] flex-col items-end gap-1 self-end">
          <span className="text-[.7rem] font-semibold text-muted">Contoh balasan AI builder</span>
          <span className="relative rounded-[14px_14px_4px_14px] border border-line bg-surface px-3 py-2.25 text-[.82rem]">
            {go && (
              <span
                className="absolute top-1/2 left-3 inline-flex -translate-y-1/2 animate-[fade-out_.2s_1.3s_forwards] gap-0.75"
                aria-hidden="true"
              >
                {[0, 0.15, 0.3].map((t) => (
                  <i key={t} className="size-1.5 animate-[bounce_1s_infinite] rounded-full bg-muted" style={{ animationDelay: t + 's' }} />
                ))}
              </span>
            )}
            <span className={go ? 'animate-[fade-in_.4s_1.4s_both]' : ''}>Siap. Saya buat dulu peran Pengunjung, Pembeli, dan Admin, lalu FR-01: Katalog dengan filter dan pencarian.</span>
          </span>
        </div>
      </div>
    </Tile>
  );
}
