// Tumpukan kartu PRD yang dikipas: kartu aktif di tengah, sisanya miring ke kiri dan kanan.
// Pindah dengan klik kartu samping, geser (drag), tombol panah, atau titik di bawah. Berputar sendiri kecuali
// sedang disorot atau pengguna memilih gerak dikurangi.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, MockThumb } from './ui.jsx';
import { reducedMotion } from './Motion.jsx';

const TERLIHAT = 3; // kartu yang tampil di tiap sisi

export function CardStack({ items, interval = 3200 }) {
  const n = items.length;
  const [aktif, setAktif] = useState(0);
  const [jeda, setJeda] = useState(false);
  const tarik = useRef(null);
  const geser = (d) => setAktif((i) => (i + d + n) % n);

  useEffect(() => {
    if (jeda || reducedMotion()) return undefined;
    const t = setInterval(() => geser(1), interval);
    return () => clearInterval(t);
  }, [jeda, interval, n]); // eslint-disable-line react-hooks/exhaustive-deps

  const lepas = (ev) => {
    const dx = tarik.current == null ? 0 : ev.clientX - tarik.current;
    tarik.current = null;
    if (Math.abs(dx) > 50) {
      geser(dx < 0 ? 1 : -1);
      tarik.dx = true;
    }
  };

  return (
    <div
      className="relative overflow-x-clip pb-2"
      role="region"
      aria-roledescription="carousel"
      aria-label="PRD pilihan"
      onMouseEnter={() => setJeda(true)}
      onMouseLeave={() => setJeda(false)}
      onFocus={() => setJeda(true)}
      onBlur={() => setJeda(false)}
      onKeyDown={(ev) => (ev.key === 'ArrowRight' ? geser(1) : ev.key === 'ArrowLeft' ? geser(-1) : null)}
    >
      <div
        className="relative mx-auto h-[clamp(240px,34vw,340px)] touch-pan-y select-none [perspective:1100px]"
        onPointerDown={(ev) => {
          tarik.current = ev.clientX;
          tarik.dx = false;
        }}
        onPointerUp={lepas}
        onPointerCancel={() => (tarik.current = null)}
      >
        {items.map((t, i) => {
          // Jarak bertanda dari kartu aktif, memutar agar kartu terakhir tampil di kiri kartu pertama.
          let off = (i - aktif + n) % n;
          if (off > n / 2) off -= n;
          const jauh = Math.abs(off);
          const tampil = jauh <= TERLIHAT;
          return (
            <Link
              key={t.id}
              to={'/perpustakaan/' + t.id}
              draggable={false}
              tabIndex={off === 0 ? 0 : -1}
              aria-hidden={off !== 0}
              onClick={(ev) => {
                if (tarik.dx || off !== 0) ev.preventDefault();
                if (!tarik.dx && off !== 0) setAktif(i);
              }}
              className="group absolute top-0 left-1/2 block w-[min(480px,74vw)] overflow-hidden rounded-[18px] border border-line bg-surface text-inherit no-underline shadow-[0_24px_48px_-24px_rgb(0_0_0/.45)] motion-safe:transition-[transform,opacity] motion-safe:duration-500 motion-safe:ease-(--ease-out)"
              style={{
                transform: `translateX(calc(-50% + ${off * 38}%)) translateY(${jauh * 14 - (off === 0 ? 10 : 0)}px) translateZ(${-jauh * 120}px) rotateZ(${off * 6}deg) rotateX(${off === 0 ? 0 : 8}deg) scale(${off === 0 ? 1.02 : 0.94})`,
                zIndex: 50 - jauh,
                opacity: tampil ? 1 - jauh * 0.12 : 0,
                pointerEvents: tampil ? 'auto' : 'none',
              }}
            >
              <MockThumb state={t.state} className="tpl-thumb !border-0" />
              <span
                className={(off === 0 ? '' : 'opacity-0 ') + 'absolute inset-x-0 bottom-0 flex items-end gap-3 motion-safe:transition-opacity motion-safe:duration-300 bg-linear-to-t from-black/80 via-black/45 to-transparent px-4.5 pt-14 pb-4 text-white'}
              >
                <span className="min-w-0 flex-1">
                  <b className="block truncate font-display text-[1.08rem]/[1.3] font-bold">{t.name}</b>
                  <span className="line-clamp-1 text-[.86rem]/[1.45] text-white/80">{t.summary}</span>
                </span>
                <span className="grid size-9 flex-none place-items-center rounded-full bg-white/15 backdrop-blur-sm [&_.ico]:size-4.5">{Icon.ext}</span>
              </span>
            </Link>
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-center gap-2">
        {items.map((t, i) => (
          <button
            type="button"
            key={t.id}
            aria-label={'Tampilkan ' + t.name}
            aria-current={i === aktif}
            onClick={() => setAktif(i)}
            className="h-2 w-2 cursor-pointer rounded-full border-0 bg-line p-0 transition-[width,background-color] duration-300 aria-[current=true]:w-6 aria-[current=true]:bg-ink"
          />
        ))}
      </div>
    </div>
  );
}
