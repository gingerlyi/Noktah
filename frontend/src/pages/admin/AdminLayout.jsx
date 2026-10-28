// Cangkang dashboard admin dan dashboard pengguna: menu samping di kiri, bilah atas berisi lokasi halaman dan menu akun, lalu isi halaman.
// Di layar sempit (di bawah 1000 px) menu samping menjadi laci yang dibuka dengan tombol garis tiga.
// Juga berisi halaman login admin.
import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { DEMO, ROLES, can, isAdmin, useApp } from '../../lib/app.jsx';
import { DemoBar, UserMenu, useScrollTop } from '../../components/Layout.jsx';
import { Avatar, Icon, Loading, Logo, ThemeButton } from '../../components/ui.jsx';

// Menu admin per kelompok. Item yang tidak boleh dibuka peran pengguna tidak ditampilkan.
export const MENU = [
  { grup: 'Ringkasan', items: [{ to: '/admin', end: true, perm: 'dash', label: 'Dashboard', icon: Icon.dash }] },
  {
    grup: 'Konten',
    items: [
      { to: '/admin/templat', perm: 'tpl', label: 'Perpustakaan', icon: Icon.tpl },
      { to: '/admin/landing', perm: 'site', label: 'Landing page', icon: Icon.site },
    ],
  },
  {
    grup: 'Akses',
    items: [
      { to: '/admin/pengguna', perm: 'users', label: 'Pengguna', icon: Icon.users },
      { to: '/admin/peran', perm: 'roles', label: 'Peran', icon: Icon.roles },
    ],
  },
  { grup: 'Bantuan', items: [{ to: '/admin/panduan', perm: 'dash', label: 'Panduan admin', icon: Icon.book }] },
];
// Menu pengguna. Item dengan perm hanya tampil bagi akun yang punya hak itu, misalnya jalan pintas ke dashboard admin.
const USER_MENU = [
  { grup: 'Ringkasan', items: [{ to: '/dashboard', label: 'Dashboard', icon: Icon.dash }] },
  {
    grup: 'PRD',
    items: [
      { to: '/prd', label: 'PRD Saya', icon: Icon.file },
      { to: '/perpustakaan', label: 'Perpustakaan', icon: Icon.tpl },
    ],
  },
  {
    grup: 'Bantuan',
    items: [
      { to: '/struktur', label: 'Struktur PRD', icon: Icon.roles },
      { to: '/cara-pakai', label: 'Cara pakai', icon: Icon.book },
    ],
  },
  { grup: 'Admin', items: [{ to: '/admin', perm: 'dash', label: 'Dashboard admin', icon: Icon.site }] },
];

// Perbedaan kedua area. Halaman pengguna sudah punya <main> sendiri, jadi isinya dibungkus <div>.
const AREA = {
  admin: {
    menu: MENU,
    home: '/admin',
    sub: 'Dashboard admin',
    root: 'Admin',
    nama: 'Menu admin',
    main: 'main',
    bye: 'Kamu keluar dari dashboard admin.',
    akun: [
      { to: '/admin/panduan', label: 'Panduan admin', icon: Icon.book },
      { to: '/dashboard', label: 'Dashboard saya', icon: Icon.dash },
      { to: '/prd', label: 'PRD Saya', icon: Icon.file },
      { to: '/', label: 'Lihat situs', icon: Icon.ext },
    ],
  },
  user: {
    menu: USER_MENU,
    home: '/dashboard',
    sub: 'Dashboard saya',
    root: 'Akun',
    nama: 'Menu akun',
    main: 'div',
    bye: 'Kamu sudah keluar.',
    akun: [
      { to: '/prd', label: 'PRD Saya', icon: Icon.file },
      { to: '/cara-pakai', label: 'Cara pakai', icon: Icon.book },
      { to: '/', label: 'Lihat situs', icon: Icon.ext },
    ],
  },
};

// Lokasi halaman untuk bilah atas, misalnya "Perpustakaan / Ubah PRD".
function lokasi(pathname, menu) {
  if (/^\/admin\/templat\/[^/]+/.test(pathname)) return [{ to: '/admin/templat', label: 'Perpustakaan' }, { label: 'Ubah PRD' }];
  if (/^\/prd\/[^/]+/.test(pathname)) return [{ to: '/prd', label: 'PRD Saya' }, { label: 'Ubah PRD' }];
  const semua = menu.flatMap((g) => g.items).sort((a, b) => b.to.length - a.to.length);
  const m = semua.find((x) => (x.end ? pathname === x.to || pathname === x.to + '/' : pathname.startsWith(x.to)));
  return [{ label: m ? m.label : 'Dashboard' }];
}

export const AdminLayout = () => <SideLayout area="admin" />;
export const UserLayout = () => <SideLayout area="user" />;

function SideLayout({ area }) {
  const a = AREA[area];
  const Main = a.main;
  const { user, logout, toast } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const burger = useRef(null);
  const side = useRef(null);
  // Setelah laci ditutup dengan Escape atau tombol tutup, fokus kembali ke tombol garis tiga.
  // Ini dilakukan setelah render, karena selama laci terbuka isi halaman masih "inert" dan tidak bisa difokus.
  const kembali = useRef(false);
  // Saat pengguna menekan Keluar, halaman ini tidak boleh mengalihkan ke halaman masuk lebih dulu,
  // karena tujuan setelah keluar adalah beranda.
  const keluar = useRef(false);
  useScrollTop();
  // Laci menu ditutup saat pindah halaman, dan saat layar melebar sehingga menu samping tampil tetap.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1000px)');
    const f = () => mq.matches && setOpen(false);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  // Selama laci terbuka: halaman di belakangnya tidak ikut bergulir, Escape menutup laci, dan fokus pindah ke menu.
  useEffect(() => {
    if (!open) {
      if (kembali.current) burger.current?.focus();
      kembali.current = false;
      return undefined;
    }
    const key = (ev) => {
      if (ev.key === 'Escape') {
        kembali.current = true;
        setOpen(false);
      }
    };
    document.addEventListener('keydown', key);
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    side.current?.querySelector('.adm-nav a')?.focus();
    return () => {
      document.removeEventListener('keydown', key);
      html.style.overflow = prev;
    };
  }, [open]);

  if (user === undefined) {
    return (
      <div className="page">
        <Loading text="Memeriksa akses…" />
      </div>
    );
  }
  // Area admin butuh peran admin; area pengguna cukup akun yang sudah masuk, lalu kembali ke halaman semula.
  if (area === 'admin' ? !isAdmin(user) : !user) {
    if (keluar.current) return null;
    return <Navigate to={area === 'admin' ? '/admin/masuk' : '/masuk?next=' + encodeURIComponent(pathname)} replace />;
  }
  const onLogout = async () => {
    keluar.current = true;
    await logout();
    navigate('/');
    toast(a.bye);
  };
  const tutup = () => {
    kembali.current = true;
    setOpen(false);
  };
  const peran = ROLES[user.role]?.nama || user.role;
  const crumbs = lokasi(pathname, a.menu);

  return (
    <div className={'adm-page' + (open ? ' nav-open' : '')}>
      <aside className="adm-side" id="adm-side" ref={side} aria-label={a.nama}>
        <div className="adm-side-top">
          <Link className="brand" to={a.home}>
            <Logo />
            <span>
              Noktah<small>{a.sub}</small>
            </span>
          </Link>
          <button type="button" className="icon-btn adm-close" aria-label={'Tutup ' + a.nama.toLowerCase()} onClick={tutup}>
            {Icon.close}
          </button>
        </div>
        <nav className="adm-nav" aria-label={a.nama}>
          {a.menu.map((g) => {
            const items = g.items.filter((m) => !m.perm || can(user, m.perm));
            if (!items.length) return null;
            return (
              <div className="adm-group" key={g.grup}>
                <span className="adm-group-t">{g.grup}</span>
                {items.map((m) => (
                  <NavLink className="side-link" to={m.to} end={m.end} key={m.to}>
                    {m.icon}
                    <span>{m.label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="adm-side-foot">
          <Link className="side-link" to="/">
            {Icon.ext}
            <span>Lihat situs</span>
          </Link>
          <div className="adm-me">
            <Avatar name={user.name} size={36} />
            <div>
              <b>{user.name}</b>
              <small>{peran}</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="adm-scrim" hidden={!open} onClick={tutup} />
      <div className="adm-body" inert={open || undefined}>
        <DemoBar />
        <header className="adm-top">
          <button
            ref={burger}
            type="button"
            className="icon-btn adm-burger"
            aria-label={'Buka ' + a.nama.toLowerCase()}
            aria-controls="adm-side"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            {Icon.menu}
          </button>
          <nav className="crumbs" aria-label="Lokasi halaman">
            <span className="crumb-root">{a.root}</span>
            {crumbs.map((c, i) => (
              <Fragment key={c.label}>
                <span className={'crumb-sep' + (i ? '' : ' first')} aria-hidden="true">
                  /
                </span>
                {c.to ? (
                  <Link to={c.to}>{c.label}</Link>
                ) : (
                  <b aria-current="page">{c.label}</b>
                )}
              </Fragment>
            ))}
          </nav>
          <div className="adm-tools">
            <ThemeButton />
            <Link className="btn quiet adm-site" to="/">
              {Icon.ext}
              <span>Lihat situs</span>
            </Link>
            <UserMenu
              user={user}
              sub={peran + ' · ' + user.email}
              items={a.akun}
              onLogout={onLogout}
            />
          </div>
        </header>
        <Main className="adm-main">
          <Outlet />
        </Main>
      </div>
    </div>
  );
}

// Membungkus halaman admin yang butuh hak tertentu.
export function Need({ perm, children }) {
  const { user } = useApp();
  if (can(user, perm)) return children;
  return (
    <div className="empty">
      <p>Peranmu tidak punya akses ke halaman ini.</p>
      <Link className="btn" to="/admin">
        Ke dashboard
      </Link>
    </div>
  );
}

export function AdminLogin() {
  const { user, setUser, logout } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: DEMO ? 'pemilik@demo.id' : '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (ev) => {
    ev.preventDefault();
    setError('');
    setBusy(true);
    try {
      const d = await api.post('/auth/login', form);
      setUser(d.user);
      if (isAdmin(d.user)) navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  let body;
  if (user === undefined) {
    body = <Loading text="Memeriksa akun…" />;
  } else if (user && isAdmin(user)) {
    body = (
      <>
        <div className="login-acct">
          <Avatar name={user.name} size={42} />
          <div>
            <b>{user.name}</b>
            <small>Peran: {ROLES[user.role]?.nama}</small>
          </div>
        </div>
        <Link className="btn big" to="/admin">
          Masuk ke dashboard
        </Link>
      </>
    );
  } else if (user) {
    body = (
      <>
        <div className="login-acct">
          <Avatar name={user.name} size={42} />
          <div>
            <b>{user.name}</b>
            <small>{user.email}</small>
          </div>
        </div>
        <p className="form-err" role="alert">
          Akun ini bukan admin. Minta pemilik Noktah memberimu peran admin, atau masuk dengan akun lain.
        </p>
        <button className="btn" type="button" onClick={logout}>
          Masuk dengan akun lain
        </button>
      </>
    );
  } else {
    body = (
      <form className="form" onSubmit={submit}>
        <div className="fld">
          <label htmlFor="ad-email">Email</label>
          <input
            id="ad-email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(ev) => setForm((f) => ({ ...f, email: ev.target.value }))}
          />
        </div>
        {DEMO ? (
          <p className="hint">
            Di pratinjau ini tidak ada kata sandi. Akun contoh: pemilik@demo.id (Pemilik), budi@demo.id (Pengelola konten), agus@demo.id
            (Analis).
          </p>
        ) : (
          <div className="fld">
            <label htmlFor="ad-pass">Kata sandi</label>
            <input
              id="ad-pass"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(ev) => setForm((f) => ({ ...f, password: ev.target.value }))}
            />
          </div>
        )}
        {error && (
          <p className="form-err" role="alert">
            {error}
          </p>
        )}
        <button className="btn big" type="submit" disabled={busy}>
          {busy ? 'Memproses…' : 'Masuk ke dashboard'}
        </button>
      </form>
    );
  }

  return (
    <div className="page">
      <div className="page-bg" aria-hidden="true" />
      <DemoBar />
      <main className="login">
        <div className="sheet login-card">
          <Logo />
          <h1>Masuk admin</h1>
          <p className="hint">Dashboard admin hanya untuk pemilik Noktah dan orang yang diberi peran admin.</p>
          {body}
          <div className="row">
            <Link className="btn quiet" to="/">
              Kembali ke beranda
            </Link>
            <ThemeButton />
          </div>
        </div>
      </main>
    </div>
  );
}
