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

// Menu akun: tombol avatar yang membuka daftar tautan dan tombol keluar.
// Panah atas dan bawah berpindah antarpilihan, Escape menutup menu dan mengembalikan fokus ke tombol.
export function UserMenu({ user, sub, items = [], onLogout, className = '' }) {
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
      className={'umenu ' + className}
      ref={wrap}
      onBlur={(ev) => {
        if (open && !wrap.current.contains(ev.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={btn}
        type="button"
        className="umenu-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={'Menu akun ' + user.name}
        onClick={() => setOpen((o) => !o)}
      >
        <Avatar name={user.name} size={32} />
        <span className="umenu-name">{user.name}</span>
        {Icon.chev}
      </button>
      {open && (
        <div className="umenu-pop" role="menu" id={id} aria-label="Menu akun" onKeyDown={onKey}>
          <div className="umenu-head">
            <b>{user.name}</b>
            <small>{sub || user.email}</small>
          </div>
          {items.map((it) => (
            <Link role="menuitem" to={it.to} key={it.to} onClick={() => setOpen(false)}>
              {it.icon}
              {it.label}
            </Link>
          ))}
          <button
            role="menuitem"
            type="button"
            className="umenu-out"
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
export function DemoBar() {
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
    <div className="demo-bar" role="note">
      <span>
        <b>Pratinjau.</b> Data di sini adalah contoh, dan perubahanmu hanya tersimpan di peramban ini. Versi lengkap dengan akun dan
        PostgreSQL ada di proyek yang dijalankan sendiri.
      </span>
      <div className="row">
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
    <div className="page" ref={pageRef}>
      <div className={'page-bg' + (pathname === '/' ? ' is-home' : '')} aria-hidden="true">
        <Stipple key={pathname === '/' ? 'gunung' : 'bulan'} scene={pathname === '/' ? 'gunung' : 'bulan'} />
      </div>
      <DemoBar />
      <div className="kursor" ref={kursorRef} aria-hidden="true">
        <div className="ular">
          {Array.from({ length: RUAS }, (_, i) => (
            <i key={i} style={{ '--i': i }} />
          ))}
        </div>
        <span className="kursor-kepala">
          <svg className="kursor-intan" viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 1.5 22.5 12 12 22.5 1.5 12z" />
          </svg>
        </span>
      </div>
      <header className={'nav' + (menu ? ' is-open' : '')} ref={navRef}>
        <Link className="brand" to="/">
          <Logo />Noktah
        </Link>
        <nav className="nav-links" id="nav-menu" aria-label="Utama">
          {NAV.map((n) => (
            <NavLink to={n.to} end={n.end} key={n.to}>
              {n.label}
            </NavLink>
          ))}
          {admin && <NavLink to="/admin">Admin</NavLink>}
          {/* Bagian akun di dalam menu, hanya tampil di layar ponsel. */}
          <div className="nav-more">
            {user ? (
              <>
                <div className="nav-me">
                  <Avatar name={user.name} size={36} />
                  <span>
                    <b>{user.name}</b>
                    <small>{user.email}</small>
                  </span>
                </div>
                <button type="button" className="btn quiet" onClick={onLogout}>
                  {Icon.out}
                  Keluar
                </button>
              </>
            ) : (
              user === null && (
                <div className="row">
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
        <div className="nav-tools">
          <ThemeButton />
          {user ? (
            <UserMenu className="nav-user" user={user} items={akunItems} onLogout={onLogout} />
          ) : (
            user === null && (
              <Link className="btn quiet nav-masuk" to="/masuk">
                Masuk
              </Link>
            )
          )}
          <Link className="btn nav-cta" to="/perpustakaan">
            Cari PRD
          </Link>
          <button
            ref={burger}
            type="button"
            className="icon-btn nav-burger"
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
      <footer className="foot">
        <div className="foot-brand">
          <Link className="brand" to="/">
            <Logo />Noktah
          </Link>
          <p>Perpustakaan PRD untuk website dan aplikasi mobile, dengan struktur yang mudah dibaca AI builder.</p>
        </div>
        <nav className="foot-links" aria-label="Tautan bawah">
          <div>
            <b>Jelajahi</b>
            <Link to="/perpustakaan">Perpustakaan</Link>
            <Link to="/struktur">Struktur PRD</Link>
            <Link to="/cara-pakai">Cara pakai</Link>
          </div>
          <div>
            <b>Akun</b>
            <Link to="/prd">PRD Saya</Link>
            {!user && <Link to="/daftar">Buat akun</Link>}
          </div>
        </nav>
        <div className="foot-base">
          <span>© {new Date().getFullYear()} Noktah</span>
          <code>{STRUKTUR}</code>
        </div>
      </footer>
    </div>
  );
}
