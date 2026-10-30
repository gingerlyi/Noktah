// Kerangka halaman publik (navigasi + footer), menu akun, dan penjaga rute.
// Halaman publik tidak menautkan ke login admin: admin membukanya langsung di /admin/masuk.
// Tautan "Admin" di navigasi baru muncul setelah seseorang masuk dengan akun berperan admin.
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { resetDemo } from '../lib/api.js';
import { DEMO, isAdmin, useApp } from '../lib/app.jsx';
import { STRUKTUR } from '../lib/prd.js';
import { useReveal } from './Motion.jsx';
import { Avatar, Icon, Logo, Stipple, ThemeButton } from './ui.jsx';

// Pindah halaman selalu mulai dari atas (kecuali tautan ke bagian tertentu, misalnya #perpustakaan).
export function useScrollTop() {
  const { pathname, hash } = useLocation();
  useLayoutEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);
}

// Menutup menu yang sedang terbuka saat pengguna mengeklik di luar menu atau menekan Escape.
// onClose(true) berarti fokus perlu dikembalikan ke tombol pembuka (setelah Escape).
export function useDismiss(ref, open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const down = (ev) => {
      if (ref.current && !ref.current.contains(ev.target)) onClose(false);
    };
    const key = (ev) => {
      if (ev.key === 'Escape') onClose(true);
    };
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('keydown', key);
    };
  }, [ref, open, onClose]);
}

// Kelas Tailwind kerangka situs. Di bawah 1140 px tautan masuk ke menu garis tiga; di bawah 600 px tombol akun
// dan "Cari PRD" ikut masuk ke menu.
// Lapisan gambar titik di belakang bagian atas halaman, selebar layar tanpa membuat halaman bisa digulir ke samping.
const PAGE_BG = 'pointer-events-none absolute inset-x-0 top-0 -z-1 overflow-hidden';
const NAV_A =
  'whitespace-nowrap rounded-[9px] px-3.25 py-2.25 font-mono text-[.95rem] font-medium uppercase tracking-[.06em] text-muted no-underline hover:bg-field hover:text-ink motion-safe:transition-colors aria-[current=page]:bg-transparent aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:underline-offset-[5px] max-nav:px-3.5 max-nav:py-3 max-nav:text-base';
const FOOT_A = 'text-inherit no-underline hover:text-accent';
const MENU_ITEM =
  'flex w-full cursor-pointer items-center gap-2.5 rounded-[9px] border-0 bg-transparent px-3 py-2.5 text-left font-body text-[.92rem]/[1.2] font-medium no-underline hover:bg-field focus-visible:bg-field focus-visible:-outline-offset-2';

// Menu akun: tombol avatar yang membuka daftar tautan dan tombol keluar.
// Panah atas dan bawah berpindah antarpilihan, Escape menutup menu dan mengembalikan fokus ke tombol.
// nameClass mengatur kapan nama pengguna di tombol disembunyikan.
export function UserMenu({ user, sub, items = [], onLogout, className = '', nameClass = '' }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const btn = useRef(null);
  const id = useId();
  const close = useCallback((focus) => {
    setOpen(false);
    if (focus) btn.current?.focus();
  }, []);
  useDismiss(wrap, open, close);
  useEffect(() => {
    if (open) wrap.current?.querySelector('[role="menuitem"]')?.focus();
  }, [open]);
  const onKey = (ev) => {
    const list = [...wrap.current.querySelectorAll('[role="menuitem"]')];
    const i = list.indexOf(document.activeElement);
    const go = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: list.length - 1 }[ev.key];
    if (go === undefined) return;
    ev.preventDefault();
    list[(go + list.length) % list.length]?.focus();
  };
  return (
    <div
      className={'relative flex-none ' + className}
      ref={wrap}
      onBlur={(ev) => {
        if (open && !wrap.current.contains(ev.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={btn}
        type="button"
        className="flex h-10.5 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface py-0 pr-2.5 pl-1 font-body text-[.9rem]/none font-semibold text-ink hover:border-accent aria-expanded:border-accent [&>.ico]:text-muted"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={'Menu akun ' + user.name}
        onClick={() => setOpen((o) => !o)}
      >
        <Avatar name={user.name} size={32} />
        <span className={'max-w-[16ch] truncate ' + nameClass}>{user.name}</span>
        {Icon.chev}
      </button>
      {open && (
        <div
          className="absolute top-[calc(100%+8px)] right-0 z-60 flex w-max max-w-[min(320px,calc(100vw-32px))] min-w-60 flex-col rounded-[14px] border border-line bg-surface p-1.5 [&_.ico]:text-muted"
          role="menu"
          id={id}
          aria-label="Menu akun"
          onKeyDown={onKey}
        >
          <div className="mb-1 min-w-0 border-b border-line px-3 pt-2.5 pb-3">
            <b className="block text-[.94rem]">{user.name}</b>
            <small className="mt-0.5 block truncate text-[.8rem] text-muted">{sub || user.email}</small>
          </div>
          {items.map((it) => (
            <Link role="menuitem" className={MENU_ITEM + ' text-ink'} to={it.to} key={it.to} onClick={() => setOpen(false)}>
              {it.icon}
              {it.label}
            </Link>
          ))}
          <button
            role="menuitem"
            type="button"
            className={
              MENU_ITEM +
              " relative mt-1.75 text-danger before:absolute before:inset-x-1.5 before:-top-1 before:border-t before:border-line before:content-[''] [&>.ico]:text-danger!"
            }
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            {Icon.out}
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}

// Keterangan di atas halaman saat mode pratinjau, dengan tombol untuk kembali ke data contoh.
// Pratinjau tidak punya kolom alamat, jadi halaman admin (yang di situs asli dibuka lewat /admin/masuk)
// diberi tautan di bilah ini. Bilah ini tidak ada di situs asli.
export function DemoBar({ className = '' }) {
  const { setUser, reloadPublic, toast } = useApp();
  const navigate = useNavigate();
  const loc = useLocation();
  if (!DEMO) return null;
  const reset = async () => {
    resetDemo();
    setUser(null);
    await reloadPublic();
    navigate('/');
    toast('Pratinjau dikembalikan ke data contoh.');
  };
  return (
    <div
      className={'flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 rounded-xl bg-(--grad-soft) px-4 py-2.5 text-[.9rem] text-ink ' + className}
      role="note"
    >
      <span className="flex-[1_1_320px]">
        <b>Pratinjau.</b> Data di sini adalah contoh, dan perubahanmu hanya tersimpan di peramban ini. Versi lengkap dengan akun dan
        PostgreSQL ada di proyek yang dijalankan sendiri.
      </span>
      <div className="row gap-x-4.5 gap-y-1">
        {!loc.pathname.startsWith('/admin') && (
          <Link className="link" to="/admin/masuk">
            Buka halaman admin
          </Link>
        )}
        <button type="button" className="link" onClick={reset}>
          Atur ulang
        </button>
      </div>
    </div>
  );
}

// Tautan utama situs publik. Di layar lebar tampil berderet; di layar sempit masuk ke menu yang dibuka tombol garis tiga.
const NAV = [
  { to: '/', label: 'Beranda', end: true },
  { to: '/perpustakaan', label: 'Perpustakaan' },
  { to: '/struktur', label: 'Struktur PRD' },
  { to: '/cara-pakai', label: 'Cara pakai' },
  { to: '/harga', label: 'Harga' },
  { to: '/prd', label: 'PRD Saya' },
];

// Kursor ikon: kursor mouse diganti intan (titik tengahnya = titik klik) dengan ekor "ular" dari intan kecil. Tiap ruas ekor mengikuti ruas
// di depannya dengan jarak tetap, jadi badannya meliuk mengikuti jalur kursor. Hanya untuk perangkat bermouse.
export const RUAS = 16; // jumlah ruas ekor ular
const RENGGANG = 13; // jarak antarruas, dalam piksel
const LIUK = 7; // simpangan terbesar liukan badan ular, dalam piksel
const bermouse = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const tenang = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function usePengikut(kursorRef) {
  useEffect(() => {
    const el = kursorRef.current;
    if (!el || !bermouse()) return undefined;
    const diam = tenang();
    const kepala = el.querySelector('.kursor-kepala');
    const ruasEl = [...el.querySelectorAll('.ular i')];
    const pos = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let ruas = [];
    let raf = 0;
    // Gaya kepala: condong mengikuti arah gerak, memanjang ke arah gerak saat cepat, bergoyang pelan saat diam.
    const gaya = { condong: 0, regang: 0, arah: 0 };
    const tengah = () => ({ x: cur.x + kepala.offsetWidth / 2, y: cur.y + kepala.offsetHeight / 2 });
    // Kepala menempel langsung di kursor supaya klik tetap presisi; kecepatannya dipakai untuk gaya kepala.
    const langkah = () => {
      const vx = pos.x - kepala.offsetWidth / 2 - cur.x;
      const vy = pos.y - kepala.offsetHeight / 2 - cur.y;
      cur.x += vx;
      cur.y += vy;
      const t = diam ? 0 : performance.now() / 160;
      if (diam) {
        kepala.style.transform = `translate(${cur.x}px, ${cur.y}px)`;
      } else {
        const laju = Math.hypot(vx, vy);
        gaya.condong += (Math.max(-28, Math.min(28, vx * 0.6)) + Math.sin(t * 0.45) * 4 - gaya.condong) * 0.15;
        gaya.regang += (Math.min(laju / 100, 0.22) - gaya.regang) * 0.2;
        if (laju > 0.5) gaya.arah = (Math.atan2(vy, vx) * 180) / Math.PI;
        kepala.style.transform =
          `translate(${cur.x}px, ${cur.y}px) rotate(${gaya.condong}deg) ` +
          `rotate(${gaya.arah}deg) scale(${1 + gaya.regang}, ${1 - gaya.regang * 0.6}) rotate(${-gaya.arah}deg)`;
      }
      let depan = tengah();
      ruas.forEach((r, i) => {
        const dx = depan.x - r.x;
        const dy = depan.y - r.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > RENGGANG) {
          r.x = depan.x - (dx / d) * RENGGANG;
          r.y = depan.y - (dy / d) * RENGGANG;
        }
        const liuk = Math.sin(t - i * 0.55) * LIUK * (i / RUAS);
        const denyut = diam ? 1 : 1 + 0.22 * Math.sin(t * 0.7 - i * 0.5);
        ruasEl[i].style.transform = `translate(${r.x - (dy / d) * liuk}px, ${r.y + (dx / d) * liuk}px) translate(-50%, -50%) scale(${denyut})`;
        depan = r;
      });
      raf = requestAnimationFrame(langkah);
    };
    const html = document.documentElement;
    const ikut = (ev) => {
      pos.x = ev.clientX;
      pos.y = ev.clientY;
      // Di kolom teks, kursor teks bawaan dipakai; di tautan dan tombol, ikonnya membesar sebagai tanda bisa diklik.
      const t = ev.target instanceof Element ? ev.target : null;
      el.toggleAttribute('data-teks', !!t?.closest('input:not([type=checkbox],[type=radio],[type=range],[type=button],[type=submit]),textarea,[contenteditable="true"]'));
      el.toggleAttribute('data-klik', !!t?.closest('a[href],button:not(:disabled),[role=button],[role=tab],[role=menuitem],summary,label,select'));
      if (el.dataset.on) return;
      // Muncul (lagi) tepat di kursor, dengan ekor tergulung di bawah kepala.
      cur.x = pos.x - kepala.offsetWidth / 2;
      cur.y = pos.y - kepala.offsetHeight / 2;
      ruas = ruasEl.map(() => tengah());
      el.dataset.on = '1';
      html.classList.add('kursor-ikon');
      if (!raf) langkah();
    };
    const pergi = () => {
      delete el.dataset.on;
      html.classList.remove('kursor-ikon');
      cancelAnimationFrame(raf);
      raf = 0;
    };
    window.addEventListener('pointermove', ikut, { passive: true });
    document.documentElement.addEventListener('mouseleave', pergi);
    return () => {
      pergi();
      window.removeEventListener('pointermove', ikut);
      document.documentElement.removeEventListener('mouseleave', pergi);
    };
  }, [kursorRef]);
}

export function PublicLayout() {
  const { user, logout, toast } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pageRef = useRef(null);
  const navRef = useRef(null);
  const burger = useRef(null);
  const [menu, setMenu] = useState(false);
  useScrollTop();
  useReveal(pageRef, pathname);
  useEffect(() => setMenu(false), [pathname]);
  const closeMenu = useCallback((focus) => {
    setMenu(false);
    if (focus) burger.current?.focus();
  }, []);
  useDismiss(navRef, menu, closeMenu);
  const kursorRef = useRef(null);
  usePengikut(kursorRef);
  const onLogout = async () => {
    setMenu(false);
    await logout();
    navigate('/');
    toast('Kamu sudah keluar.');
  };
  const admin = isAdmin(user);
  const akunItems = [
    { to: '/dashboard', label: 'Dashboard saya', icon: Icon.dash },
    { to: '/prd', label: 'PRD Saya', icon: Icon.file },
    ...(admin ? [{ to: '/admin', label: 'Dashboard admin', icon: Icon.dash }] : []),
    { to: '/cara-pakai', label: 'Cara pakai', icon: Icon.book },
  ];
  return (
    <div className="page min-h-dvh pb-0" ref={pageRef}>
      <div className={PAGE_BG + (pathname === '/' ? ' h-275' : ' h-190')} aria-hidden="true">
        {pathname === '/' ? <Stipple key="gunung" className="opacity-28 dark:opacity-45" /> : <Stipple key="bulan" scene="bulan" className="opacity-32" />}
      </div>
      <DemoBar />
      <div
        className="group pointer-events-none fixed inset-0 z-[2147483000] opacity-0 data-[on]:not-data-[teks]:opacity-100 motion-safe:transition-opacity motion-safe:duration-350 [@media(hover:none),(pointer:coarse)]:hidden"
        ref={kursorRef}
        aria-hidden="true"
      >
        <div className="ular">
          {Array.from({ length: RUAS }, (_, i) => (
            <i
              key={i}
              className="absolute top-0 left-0 size-[calc(16px-var(--i)*.7px)] bg-ink opacity-[calc(.75-var(--i)*.04)] will-change-transform [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]"
              style={{ '--i': i }}
            />
          ))}
        </div>
        <span className="kursor-kepala absolute top-0 left-0 will-change-transform">
          <svg
            className="block fill-ink stroke-paper stroke-[1.5] transition-[scale] duration-200 ease-(--ease-spring) group-data-[klik]:scale-125"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path d="M12 1.5 22.5 12 12 22.5 1.5 12z" />
          </svg>
        </span>
      </div>
      <header
        className="sticky top-[calc(env(safe-area-inset-top,0px)+10px)] z-30 flex flex-nowrap items-center gap-x-3 gap-y-2 rounded-[18px] border border-line bg-[var(--glass)] py-[9px] pr-[10px] pl-4 backdrop-blur-[16px] backdrop-saturate-[1.6] motion-safe:transition-colors motion-safe:duration-500 max-nav:flex-wrap max-md:top-[calc(env(safe-area-inset-top,0px)+8px)] max-md:py-2 max-md:pr-2 max-md:pl-[14px]"
        ref={navRef}
      >
        <Link className="brand" to="/">
          <Logo />Noktah
        </Link>
        <nav
          className={
            'mr-auto ml-2 flex min-w-0 flex-nowrap gap-1 max-nav:order-9 max-nav:mr-0 max-nav:mt-1.5 max-nav:mb-0.5 max-nav:ml-0 max-nav:shrink max-nav:grow max-nav:basis-full max-nav:flex-col max-nav:items-stretch max-nav:gap-0.5 max-nav:border-t max-nav:border-line max-nav:pt-2' +
            (menu ? '' : ' max-nav:hidden')
          }
          id="nav-menu"
          aria-label="Utama"
        >
          {NAV.map((n) => (
            <NavLink className={NAV_A} to={n.to} end={n.end} key={n.to}>
              {n.label}
            </NavLink>
          ))}
          {admin && (
            <NavLink className={NAV_A} to="/admin">
              Admin
            </NavLink>
          )}
          {/* Bagian akun di dalam menu, hanya tampil di layar ponsel. */}
          <div className="mt-2 hidden flex-col gap-2.5 border-t border-line px-1 pt-3 pb-1 max-sm:flex [&_.btn]:w-full">
            {user ? (
              <>
                <div className="flex min-w-0 items-center gap-2.5 px-1">
                  <Avatar name={user.name} size={36} />
                  <span className="min-w-0">
                    <b className="block text-[.95rem]">{user.name}</b>
                    <small className="block truncate text-[.82rem] text-muted">{user.email}</small>
                  </span>
                </div>
                <button type="button" className="btn quiet" onClick={onLogout}>
                  {Icon.out}
                  Keluar
                </button>
              </>
            ) : (
              user === null && (
                <div className="grid grid-cols-2 gap-2">
                  <Link className="btn quiet" to="/masuk">
                    Masuk
                  </Link>
                  <Link className="btn quiet" to="/daftar">
                    Buat akun
                  </Link>
                </div>
              )
            )}
            <Link className="btn" to="/perpustakaan">
              Cari PRD
            </Link>
          </div>
        </nav>
        <div className="flex flex-none items-center gap-2 max-nav:ml-auto">
          <ThemeButton />
          {user ? (
            <UserMenu className="max-sm:hidden" nameClass="hidden wide:inline" user={user} items={akunItems} onLogout={onLogout} />
          ) : (
            user === null && (
              <Link className="btn quiet max-sm:hidden" to="/masuk">
                Masuk
              </Link>
            )
          )}
          <Link className="btn max-sm:hidden" to="/perpustakaan">
            Cari PRD
          </Link>
          <button
            ref={burger}
            type="button"
            className="icon-btn hidden max-nav:grid"
            aria-controls="nav-menu"
            aria-expanded={menu}
            aria-label={menu ? 'Tutup menu' : 'Buka menu'}
            onClick={() => setMenu((m) => !m)}
          >
            {menu ? Icon.close : Icon.menu}
          </button>
        </div>
      </header>
      <Outlet />
      <footer className="tema-gelap mx-[calc(50%-50vw)] mt-auto grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-x-10 gap-y-7 border-t border-line bg-black px-[calc(50vw-50%+clamp(16px,3vw,40px))] pt-[clamp(28px,4vw,44px)] pb-[calc(env(safe-area-inset-bottom,0px)+22px)] text-[.92rem] text-muted max-lg:grid-cols-1">
        <div className="flex flex-col items-start gap-3">
          <Link className="brand text-ink" to="/">
            <Logo />Noktah
          </Link>
          <p className="m-0 max-w-[44ch]">Perpustakaan PRD untuk website dan aplikasi mobile, dengan struktur yang mudah dibaca AI builder.</p>
        </div>
        <nav className="flex flex-wrap justify-end gap-x-14 gap-y-6 max-lg:justify-start" aria-label="Tautan bawah">
          <div className="flex flex-col gap-2">
            <b className="text-[.88rem] text-ink">Jelajahi</b>
            <Link className={FOOT_A} to="/perpustakaan">
              Perpustakaan
            </Link>
            <Link className={FOOT_A} to="/struktur">
              Struktur PRD
            </Link>
            <Link className={FOOT_A} to="/cara-pakai">
              Cara pakai
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <b className="text-[.88rem] text-ink">Akun</b>
            <Link className={FOOT_A} to="/prd">
              PRD Saya
            </Link>
            {!user && (
              <Link className={FOOT_A} to="/daftar">
                Buat akun
              </Link>
            )}
          </div>
        </nav>
        <div className="col-span-full flex flex-wrap justify-between gap-3 border-t border-line pt-[18px] text-[.84rem]">
          <span>© {new Date().getFullYear()} Noktah</span>
          <code className="font-mono text-[.8rem]/[1.4] font-medium">{STRUKTUR}</code>
        </div>
      </footer>
    </div>
  );
}
