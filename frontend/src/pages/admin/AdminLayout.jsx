// Cangkang dashboard admin dan dashboard pengguna: menu samping di kiri, bilah atas berisi lokasi halaman dan menu akun, lalu isi halaman.
// Di layar sempit (di bawah 1000 px) menu samping menjadi laci yang dibuka dengan tombol garis tiga.
// Juga berisi halaman login admin.
import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { DEMO, ROLES, can, isAdmin, useApp } from '../../lib/app.jsx';
import { DemoBar, UserMenu, useScrollTop } from '../../components/Layout.jsx';
import { Avatar, Icon, Loading, Logo, ThemeButton } from '../../components/ui.jsx';

// Tautan menu samping; halaman yang sedang dibuka diberi garis aksen di tepi kiri.
const SIDE =
  "relative flex items-center gap-2.75 whitespace-nowrap rounded-[10px] px-3 py-2.25 text-[.94rem] font-semibold text-muted no-underline hover:bg-field hover:text-ink motion-safe:transition-colors aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-1.75 aria-[current=page]:before:-left-3.5 aria-[current=page]:before:w-0.75 aria-[current=page]:before:rounded-r-[3px] aria-[current=page]:before:bg-(--grad-v) aria-[current=page]:before:content-[''] [&>span]:flex-1";
const AKUN = 'flex w-full min-w-0 items-center gap-3 rounded-xl border border-line bg-field p-3.5';

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
    side.current?.querySelector('nav a')?.focus();
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
    <div className="grid min-h-dvh grid-cols-[264px_minmax(0,1fr)] bg-paper [--stick:calc(env(safe-area-inset-top,0px)+80px)] max-[1000px]:block max-[1000px]:[--stick:calc(env(safe-area-inset-top,0px)+74px)]">
      <aside
        className={
          'sticky top-0 flex h-dvh flex-col gap-5.5 overflow-y-auto overscroll-contain border-r border-line bg-surface px-3.5 pt-4.5 pb-4 max-[1000px]:fixed max-[1000px]:inset-y-0 max-[1000px]:left-0 max-[1000px]:z-50 max-[1000px]:h-auto max-[1000px]:w-[min(300px,86vw)] motion-reduce:transition-none! ' +
          (open
            ? 'max-[1000px]:[transition:transform_.26s_var(--ease-out)]'
            : 'max-[1000px]:invisible max-[1000px]:[transform:translateX(-102%)] max-[1000px]:[transition:transform_.26s_var(--ease-out),visibility_0s_linear_.26s]')
        }
        id="adm-side"
        ref={side}
        aria-label={a.nama}
      >
        <div className="flex items-center justify-between gap-2 px-1.5 pt-0.5">
          <Link className="brand text-[1.04rem]" to={a.home}>
            <Logo />
            <span>
              Noktah<small className="mt-1 block font-body text-[.68rem]/none font-semibold tracking-[.07em] text-muted uppercase">{a.sub}</small>
            </span>
          </Link>
          <button type="button" className="icon-btn hidden max-[1000px]:grid" aria-label={'Tutup ' + a.nama.toLowerCase()} onClick={tutup}>
            {Icon.close}
          </button>
        </div>
        <nav className="flex flex-col gap-4.5" aria-label={a.nama}>
          {a.menu.map((g) => {
            const items = g.items.filter((m) => !m.perm || can(user, m.perm));
            if (!items.length) return null;
            return (
              <div className="flex flex-col gap-0.5" key={g.grup}>
                <span className="px-3 pb-1.5 font-body text-[.68rem]/[1.2] font-bold tracking-[.08em] text-muted uppercase">{g.grup}</span>
                {items.map((m) => (
                  <NavLink className={SIDE} to={m.to} end={m.end} key={m.to}>
                    {m.icon}
                    <span>{m.label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2.5 border-t border-line pt-3.5">
          <Link className={SIDE} to="/">
            {Icon.ext}
            <span>Lihat situs</span>
          </Link>
          <div className="flex min-w-0 items-center gap-2.5 px-2 py-0.5">
            <Avatar name={user.name} size={36} />
            <div className="min-w-0">
              <b className="block truncate text-[.92rem]/[1.3]">{user.name}</b>
              <small className="text-[.8rem] text-muted">{peran}</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="fixed inset-0 z-40 bg-[rgba(9,13,24,.45)] backdrop-blur-[2px]" hidden={!open} onClick={tutup} />
      <div className="flex min-w-0 flex-col" inert={open || undefined}>
        <DemoBar className="mx-[clamp(16px,3vw,32px)] mt-3" />
        <header className="sticky top-0 z-30 flex min-h-16.5 items-center gap-3 border-b border-line bg-[color-mix(in_srgb,var(--paper)_92%,transparent)] px-[clamp(16px,3vw,32px)] py-3 backdrop-blur-[16px] backdrop-saturate-[1.6] max-[1000px]:min-h-15.5 max-[1000px]:gap-2.5 max-[1000px]:px-4 max-[1000px]:py-2.5">
          <button
            ref={burger}
            type="button"
            className="icon-btn hidden max-[1000px]:grid"
            aria-label={'Buka ' + a.nama.toLowerCase()}
            aria-controls="adm-side"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            {Icon.menu}
          </button>
          <nav className="flex min-w-0 items-center gap-2 text-[.94rem] text-muted" aria-label="Lokasi halaman">
            <span className="max-[641px]:hidden">{a.root}</span>
            {crumbs.map((c, i) => (
              <Fragment key={c.label}>
                <span className={'opacity-45' + (i ? '' : ' max-[641px]:hidden')} aria-hidden="true">
                  /
                </span>
                {c.to ? (
                  <Link className="whitespace-nowrap text-muted no-underline hover:text-accent" to={c.to}>
                    {c.label}
                  </Link>
                ) : (
                  <b className="truncate font-bold text-ink" aria-current="page">
                    {c.label}
                  </b>
                )}
              </Fragment>
            ))}
          </nav>
          <div className="ml-auto flex flex-none items-center gap-2">
            <ThemeButton />
            <Link className="btn quiet max-[641px]:hidden" to="/">
              {Icon.ext}
              <span>Lihat situs</span>
            </Link>
            <UserMenu
              nameClass="max-[641px]:hidden"
              user={user}
              sub={peran + ' · ' + user.email}
              items={a.akun}
              onLogout={onLogout}
            />
          </div>
        </header>
        <Main className="mx-auto flex w-full max-w-310 min-w-0 flex-col gap-5.5 px-[clamp(16px,3vw,32px)] pt-6.5 pb-18 max-[1000px]:px-4 max-[1000px]:pt-5 max-[1000px]:pb-16">
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
        <div className={AKUN}>
          <Avatar name={user.name} size={42} />
          <div>
            <b className="block">{user.name}</b>
            <small className="text-[.86rem] text-muted">Peran: {ROLES[user.role]?.nama}</small>
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
        <div className={AKUN}>
          <Avatar name={user.name} size={42} />
          <div>
            <b className="block">{user.name}</b>
            <small className="text-[.86rem] text-muted">{user.email}</small>
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
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-1 h-190 overflow-hidden" aria-hidden="true" />
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
