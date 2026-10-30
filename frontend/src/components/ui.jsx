// Komponen kecil yang dipakai di banyak halaman.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { accentFor, thumbHTML } from '../lib/mock.js';
import { GAYA, T } from '../lib/catalog.js';
import { slug } from '../lib/prd.js';
import { useApp } from '../lib/app.jsx';

const SV = {
  viewBox: '0 0 24 24',
  width: 18,
  height: 18,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

// Gambar titik-titik (stipple) bergaya NOCTRA: arsiran hanya dari kerapatan titik. Tiap adegan adalah fungsi
// kerapatan 0..1 untuk titik (x, y) di kotak W × H. Titik digambar ke kanvas lalu dipakai sebagai mask,
// jadi warnanya ikut --ink di kedua tema.
const halus = (a, b, x) => Math.min(Math.max((x - a) / (b - a), 0), 1);
const ADEGAN = {
  // Gunung di kanan dan bukit di bawah (belakang hero landing page).
  gunung(x, y, W, H) {
    const u = x / W;
    const v = y / H;
    const puncak = W < 760 ? 0.72 : 0.8;
    const pudar = (t) => 1 - halus(0.42, 0.68, t);
    const tepi = 0.1 + 1.1 * Math.abs(u - puncak) ** 1.3 + 0.012 * Math.sin(u * 90) + 0.008 * Math.sin(u * 37);
    const bukit = 0.58 + 0.035 * Math.sin(u * 7 + 1) + 0.01 * Math.sin(u * 61);
    let k = 0.004; // langit: titik jarang seperti bintang
    if (v > tepi) {
      // sisi kiri gunung terkena cahaya (jarang), sisi kanan dalam bayangan (rapat), garis puncak lebih gelap
      const sisi = u < puncak ? 0.12 + 0.35 * halus(0.3, puncak, u) * (1 - halus(0, 0.25, v - tepi)) : 0.62;
      const urat = 0.18 * Math.sin(u * 23 + v * 17) * Math.sin(v * 31 - u * 11);
      k = (sisi + urat + 0.55 * Math.exp(-((v - tepi) * H) / 7)) * pudar(v);
    }
    if (v > bukit) k = Math.max(k, (0.5 * (1 - u) + 0.45 * Math.exp(-((v - bukit) * H) / 6)) * pudar(v + 0.06));
    return k;
  },
  // Bulan berkawah yang disinari dari kiri atas (pojok kanan atas halaman lain).
  bulan(x, y, W) {
    const r = Math.min(150, W * 0.2);
    const nx = (x - (W - r - Math.min(80, W * 0.06))) / r;
    const ny = (y - r - 70) / r;
    const d = nx * nx + ny * ny;
    if (d > 1) return 0.003;
    const nz = Math.sqrt(1 - d);
    const terang = Math.max(0, -0.55 * nx - 0.45 * ny + 0.7 * nz);
    const kawah = 0.16 * Math.sin(nx * 17 + 1) * Math.sin(ny * 13) + 0.1 * Math.sin(nx * 41) * Math.sin(ny * 37 + 2);
    return 0.05 + 0.75 * (1 - terang) ** 1.6 + kawah + 0.4 * Math.exp(-((1 - Math.sqrt(d)) * r) / 4);
  },
  // Tiga lapis bukit pasir, makin depan makin rapat (blok penutup).
  bukit(x, y, W, H) {
    const u = x / W;
    const v = y / H;
    const lapis = [
      [0.42, 0.07, 5, 0.5, 0.14],
      [0.6, 0.06, 7, 2.1, 0.3],
      [0.78, 0.05, 9, 4, 0.48],
    ];
    let k = 0.002;
    for (const [dasar, tinggi, f, fase, isi] of lapis) {
      const t = dasar + tinggi * Math.sin(u * f + fase);
      if (v < t) continue;
      // lereng yang menghadap cahaya (turunan negatif) lebih jarang
      const lereng = Math.cos(u * f + fase) > 0 ? 0.22 : -0.08;
      k = isi + lereng * (1 - halus(0, 0.12, v - t)) + 0.5 * Math.exp(-((v - t) * H) / 5);
    }
    return k;
  },
};

export function Stipple({ scene = 'gunung', className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const rapat = ADEGAN[scene];
    let ukuran = '';
    const gambar = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      if (!W || !H || W + 'x' + H === ukuran) return;
      ukuran = W + 'x' + H;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const c = document.createElement('canvas');
      c.width = W * dpr;
      c.height = H * dpr;
      const g = c.getContext('2d');
      g.scale(dpr, dpr);
      let seed = 7; // acak tetap, supaya gambarnya sama setiap kali dimuat
      const acak = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
      for (let y = 0; y < H; y += 2.6) {
        for (let x = 0; x < W; x += 2.6) {
          const px = x + acak() * 2.6;
          const py = y + acak() * 2.6;
          if (acak() < rapat(px, py, W, H)) {
            g.beginPath();
            g.arc(px, py, 0.55 + acak() * 0.75, 0, 7);
            g.fill();
          }
        }
      }
      const url = `url(${c.toDataURL()})`;
      el.style.maskImage = url;
      el.style.webkitMaskImage = url;
    };
    gambar();
    const ro = new ResizeObserver(gambar);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scene]);
  return <div className={'absolute inset-0 bg-ink [mask-size:100%_100%] forced-colors:hidden ' + className} data-scene={scene} ref={ref} aria-hidden="true" />;
}

// Logo Noktah: intan dari titik-titik yang mengecil ke tepi, seperti arsiran stipple; titik besar di tengah adalah "noktah"-nya.
// Titik-titiknya sama dengan favicon (public/favicon.svg).
export function Logo() {
  return (
    <span className="brand-mark">
      <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" aria-hidden="true">
        <circle cx="1.8" cy="12.0" r="0.9"/>
        <circle cx="5.2" cy="8.6" r="0.9"/>
        <circle cx="5.2" cy="12.0" r="1.2"/>
        <circle cx="5.2" cy="15.4" r="0.9"/>
        <circle cx="8.6" cy="5.2" r="0.9"/>
        <circle cx="8.6" cy="8.6" r="1.2"/>
        <circle cx="8.6" cy="12.0" r="1.5"/>
        <circle cx="8.6" cy="15.4" r="1.2"/>
        <circle cx="8.6" cy="18.8" r="0.9"/>
        <circle cx="12.0" cy="1.8" r="0.9"/>
        <circle cx="12.0" cy="5.2" r="1.2"/>
        <circle cx="12.0" cy="8.6" r="1.5"/>
        <circle cx="12.0" cy="12.0" r="1.75"/>
        <circle cx="12.0" cy="15.4" r="1.5"/>
        <circle cx="12.0" cy="18.8" r="1.2"/>
        <circle cx="12.0" cy="22.2" r="0.9"/>
        <circle cx="15.4" cy="5.2" r="0.9"/>
        <circle cx="15.4" cy="8.6" r="1.2"/>
        <circle cx="15.4" cy="12.0" r="1.5"/>
        <circle cx="15.4" cy="15.4" r="1.2"/>
        <circle cx="15.4" cy="18.8" r="0.9"/>
        <circle cx="18.8" cy="8.6" r="0.9"/>
        <circle cx="18.8" cy="12.0" r="1.2"/>
        <circle cx="18.8" cy="15.4" r="0.9"/>
        <circle cx="22.2" cy="12.0" r="0.9"/>
      </svg>
    </span>
  );
}

export const Icon = {
  moon: (
    <svg className="ico" {...SV}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  sun: (
    <svg className="ico" {...SV}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  dash: (
    <svg className="ico" {...SV}>
      <path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" />
    </svg>
  ),
  tpl: (
    <svg className="ico" {...SV}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  site: (
    <svg className="ico" {...SV}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  users: (
    <svg className="ico" {...SV}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  roles: (
    <svg className="ico" {...SV}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  web: (
    <svg className="ico" {...SV}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 9h20M6 6.5h.01M9 6.5h.01" />
    </svg>
  ),
  phone: (
    <svg className="ico" {...SV}>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M11 18h2" />
    </svg>
  ),
  play: (
    <svg className="ico" {...SV}>
      <path d="M7 4.5v15l12-7.5z" />
    </svg>
  ),
  pause: (
    <svg className="ico" {...SV}>
      <path d="M8 5v14M16 5v14" />
    </svg>
  ),
  check: (
    <svg className="ico" {...SV}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  copy: (
    <svg className="ico" {...SV}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  ),
  file: (
    <svg className="ico" {...SV}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  ),
  arrow: (
    <svg className="ico" {...SV}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  menu: (
    <svg className="ico" {...SV}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  close: (
    <svg className="ico" {...SV}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  out: (
    <svg className="ico" {...SV}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  ext: (
    <svg className="ico" {...SV}>
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  ),
  book: (
    <svg className="ico" {...SV}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  chev: (
    <svg className="ico" {...SV} width={16} height={16}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
};

export function ThemeButton({ withLabel = false }) {
  const { theme, toggleTheme } = useApp();
  const dark = theme === 'dark';
  const title = dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap';
  if (withLabel) {
    return (
      <button type="button" className="btn quiet" onClick={toggleTheme} title={title}>
        {dark ? Icon.sun : Icon.moon}
        <span>{dark ? 'Mode terang' : 'Mode gelap'}</span>
      </button>
    );
  }
  return (
    <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={title} title={title}>
      {dark ? Icon.sun : Icon.moon}
    </button>
  );
}

export function Avatar({ name, size = 30 }) {
  const initial = (String(name || '?').trim()[0] || '?').toUpperCase();
  return (
    <span className="grid flex-none place-items-center rounded-full bg-accent-soft leading-none font-bold text-accent" style={{ width: size, height: size, fontSize: size * 0.44 }} aria-hidden="true">
      {initial}
    </span>
  );
}

export const Loading = ({ text = 'Memuat…' }) => <p className="m-0 py-14 text-center text-muted">{text}</p>;

// Menggambar HTML maket pada lebar tetap (base) lalu memperkecilnya mengikuti lebar wadah.
// --frame = tinggi wadah dalam satuan maket, dipakai CSS untuk "menggulir" maket sampai bawah.
export function ScaledHTML({ html, base = 1120, className }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const apply = () => {
      const m = el.firstElementChild;
      if (!m || !el.clientWidth) return;
      const z = el.clientWidth / base;
      m.style.zoom = z;
      m.style.setProperty('--frame', el.clientHeight / z + 'px');
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [html, base]);
  return <div className={className} ref={ref} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}

// Gambar kecil PRD: website di jendela peramban, aplikasi mobile sebagai poster selebar kartu. Latarnya diwarnai
// dengan warna merek dan latar gaya PRD itu (lihat .tpl-thumb di app.css).
// lazy: maket baru digambar saat kartunya mendekati layar, supaya perpustakaan yang panjang tetap ringan.
export function MockThumb({ state, className = 'tpl-thumb', lazy = false }) {
  const ref = useRef(null);
  const [show, setShow] = useState(!lazy);
  useEffect(() => {
    if (show) return undefined;
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) {
      setShow(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([en]) => {
        if (en.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: '900px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show]);
  const html = useMemo(() => (show ? thumbHTML(state) : ''), [state, show]);
  const poster = T[state.tpl]?.platform === 'mobile';
  const view = show ? <ScaledHTML className="thumb-view" html={html} /> : <div className="thumb-view is-wait" />;
  return (
    <div
      className={className + (poster ? ' is-poster' : '')}
      style={{ '--th-a': accentFor(state).a, '--th-bg': GAYA[state.gaya]?.latar || '#ffffff' }}
      ref={ref}
      aria-hidden="true"
    >
      {poster ? (
        view
      ) : (
        <div className="thumb-win">
          <div className="thumb-bar">
            <i />
            <i />
            <i />
            <span>{slug(state) + (T[state.tpl]?.app ? '.app' : '.id')}</span>
          </div>
          {view}
        </div>
      )}
    </div>
  );
}

// Contoh huruf dan bentuk sebuah gaya desain (lihat .gy-swatch di CSS).
// Gaya dari data memakai warna, huruf, garis, dan sudutnya sendiri lewat style.
export function GayaSwatch({ gaya, big = false }) {
  const g = GAYA[gaya];
  const style = g?.t && {
    background: g.latar,
    color: g.teks,
    borderColor: g.t.line,
    borderWidth: g.garis,
    borderRadius: g.kapsul ? 999 : Math.min(g.sudut, 12),
    fontFamily: g.t.fd,
    fontStyle: g.t.judul === 'miring' ? 'italic' : undefined,
    boxShadow: g.t.bayang === 'keras' ? '2px 2px 0 ' + g.teks : undefined,
  };
  return (
    <i className={'gy-swatch' + (big ? ' big' : '')} data-gaya={gaya} style={style || undefined} aria-hidden="true">
      Aa
    </i>
  );
}
