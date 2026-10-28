// Keadaan bersama: akun yang sedang masuk, data publik (teks landing, templat), tema, dan toast.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { GAYA, T, TPL_IDS } from './catalog.js';
import { valid } from './prd.js';

// Mode pratinjau: dibangun dengan "npm run build:demo", tanpa server, data di peramban.
export const DEMO = import.meta.env.MODE === 'demo';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const EMPTY_PUBLIC = {
  site: { title: '', subtitle: '', hiddenBuiltin: [] },
  templates: [],
  features: { register: true },
  loaded: false,
};

function storedTheme() {
  try {
    const t = localStorage.getItem('rprd-theme');
    if (t === 'dark' || t === 'light') return t;
  } catch {
    /* penyimpanan diblokir */
  }
  return null;
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = sedang memeriksa, null = belum masuk
  const [pub, setPub] = useState(EMPTY_PUBLIC);
  const [pref, setPref] = useState(storedTheme);
  const [toastState, setToastState] = useState(null);
  const toastTimer = useRef(null);

  const reloadPublic = useCallback(async () => {
    try {
      const d = await api.get('/public');
      setPub({
        site: { title: d.site?.title || '', subtitle: d.site?.subtitle || '', hiddenBuiltin: d.site?.hiddenBuiltin || [] },
        templates: (d.templates || []).filter((t) => valid(t.state)),
        features: { register: d.features?.register !== false, upgradeUrl: d.features?.upgradeUrl || '' },
        loaded: true,
      });
    } catch {
      setPub((p) => ({ ...p, loaded: true }));
    }
  }, []);

  useEffect(() => {
    reloadPublic();
    api.get('/auth/me').then((d) => setUser(d.user)).catch(() => setUser(null));
  }, [reloadPublic]);

  // Tema: bawaannya gelap (gaya NOCTRA), apa pun setelan perangkat. Terang hanya bila dipilih lewat tombol tema.
  const theme = pref ?? 'dark';
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setPref(next);
    try {
      localStorage.setItem('rprd-theme', next);
    } catch {
      /* tidak tersimpan, tetap berlaku untuk kunjungan ini */
    }
  }, [theme]);

  const toast = useCallback((message, undo) => {
    clearTimeout(toastTimer.current);
    setToastState({ message, undo: undo || null });
    toastTimer.current = setTimeout(() => setToastState(null), undo ? 9000 : 3600);
  }, []);
  const runUndo = () => {
    const fn = toastState?.undo;
    clearTimeout(toastTimer.current);
    setToastState(null);
    if (fn) fn();
  };

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* cookie tetap dihapus di sisi klien lewat status di bawah */
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, logout, pub, reloadPublic, theme, toggleTheme, toast }),
    [user, logout, pub, reloadPublic, theme, toggleTheme, toast],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {toastState && (
        <div className="toast" role="status" aria-live="polite">
          <span>{toastState.message}</span>
          {toastState.undo && (
            <button type="button" onClick={runUndo}>
              Urungkan
            </button>
          )}
        </div>
      )}
    </Ctx.Provider>
  );
}

// Peran dan haknya. Server yang menegakkan; daftar ini hanya untuk tampilan.
export const ROLES = {
  pemilik: { nama: 'Pemilik', can: ['dash', 'tpl', 'site', 'users', 'roles'] },
  admin: { nama: 'Admin', can: ['dash', 'tpl', 'site', 'users'] },
  konten: { nama: 'Pengelola konten', can: ['dash', 'tpl', 'site'] },
  analis: { nama: 'Analis', can: ['dash'] },
  user: { nama: 'Pengguna', can: [] },
};
export const can = (user, perm) => !!user?.perms?.includes(perm);
export const isAdmin = (user) => (user?.perms?.length || 0) > 0;

// Isi perpustakaan yang tampil: PRD bawaan yang tidak disembunyikan, lalu PRD buatan admin.
// PRD buatan admin mewarisi platform dan kategori dari PRD dasarnya.
export function libraryItems(pub) {
  return [
    ...TPL_IDS.filter((id) => !pub.site.hiddenBuiltin.includes(id)).map((id) => ({
      id,
      name: T[id].nama,
      summary: T[id].ringkas,
      platform: T[id].platform,
      kategori: T[id].kategori,
      gaya: T[id].d.gaya,
      cocok: T[id].cocok || [],
      peran: T[id].d.peran.map((p) => p[0]),
    })),
    ...pub.templates.map((t) => ({
      id: t.id,
      name: t.name,
      summary: t.summary,
      platform: T[t.state.tpl].platform,
      kategori: T[t.state.tpl].kategori,
      gaya: GAYA[t.state.gaya] ? t.state.gaya : T[t.state.tpl].d.gaya,
      cocok: T[t.state.tpl].cocok || [],
      peran: Array.isArray(t.state.peran) ? t.state.peran.filter((p) => p && p.on !== false && p.n).map((p) => p.n) : T[t.state.tpl].d.peran.map((p) => p[0]),
    })),
  ];
}

export const DEF_TITLE = 'Perpustakaan PRD, untuk website dan aplikasi mobile.';
export const DEF_SUB =
  'Kumpulan PRD siap pakai untuk sistem yang utuh, lengkap dengan peran dan hak akses, halaman tiap peran, alur, dan fitur. Ambil satu, sesuaikan isinya, lalu berikan ke AI builder atau developer.';

export const when = (iso) =>
  iso ? new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
export const fmt = (n) => Number(n).toLocaleString('id-ID');

// Hanya menerima tujuan di dalam situs ini, supaya ?next= tidak bisa mengarah ke situs lain.
export const safeNext = (raw, fallback) => (raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : fallback);
