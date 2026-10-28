// Alat kecil untuk animasi. Semua isi tetap terlihat tanpa animasi: animasi hanya diputar saat elemen
// masuk layar, dari keadaan tersembunyi ke keadaan akhirnya, lalu berhenti. Bila pengunjung memilih
// "kurangi gerakan" di perangkatnya, tidak ada yang diputar.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const EASE = 'cubic-bezier(.2,.7,.2,1)';
const FRAMES = {
  up: [
    { opacity: 0, transform: 'translateY(26px)' },
    { opacity: 1, transform: 'none' },
  ],
  pop: [
    { opacity: 0, transform: 'scale(.92)' },
    { opacity: 1, transform: 'none' },
  ],
  line: [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
};

function play(el) {
  const kind = el.dataset.reveal || 'up';
  const base = Number(el.dataset.revealDelay || 0) * 80;
  if (kind === 'stagger') {
    [...el.children].forEach((child, i) =>
      child.animate(FRAMES.up, { duration: 700, delay: base + Math.min(i, 8) * 110, easing: EASE, fill: 'backwards' }),
    );
    // Garis penghubung (misalnya antar langkah) digambar setelah kartunya muncul.
    el.querySelectorAll('[data-reveal-line]').forEach((line, i) =>
      line.animate(FRAMES.line, { duration: 900, delay: base + 350 + i * 260, easing: EASE, fill: 'backwards' }),
    );
    return;
  }
  el.animate(FRAMES[kind] || FRAMES.up, {
    duration: kind === 'line' ? 1100 : 700,
    delay: base,
    easing: EASE,
    fill: 'backwards',
  });
}

// Memutar animasi masuk untuk setiap [data-reveal] di dalam root yang belum terlihat saat halaman dimuat.
export function useReveal(rootRef, key) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion() || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          io.unobserve(en.target);
          play(en.target);
        }
      },
      { threshold: 0 },
    );
    // Tunggu satu frame supaya isi halaman baru sudah tersusun.
    const raf = requestAnimationFrame(() => {
      const fold = window.innerHeight;
      root.querySelectorAll('[data-reveal]').forEach((el) => {
        if (el.getBoundingClientRect().top > fold) io.observe(el);
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [rootRef, key]);
}

// true selama elemen terlihat di layar (dipakai untuk menjeda animasi yang berulang).
export function useInView(ref, { threshold = 0, rootMargin = '0px', once = false } = {}) {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(
      ([en]) => {
        setInView(en.isIntersecting);
        if (once && en.isIntersecting) io.disconnect();
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, rootMargin, once]);
  return inView;
}

// Angka yang menghitung naik. Pembaca layar langsung mendapat angka akhirnya.
export function CountUp({ value, duration = 900, delay = 300 }) {
  const ref = useRef(null);
  const from = useRef(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (reducedMotion()) {
      el.textContent = String(value);
      from.current = value;
      return undefined;
    }
    const start0 = from.current;
    el.textContent = String(start0);
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (now) => {
      const p = Math.min(1, Math.max(0, (now - t0) / duration));
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(start0 + (value - start0) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
      el.textContent = String(value);
    };
  }, [value, duration, delay]);
  return (
    <>
      <span ref={ref} aria-hidden="true">
        {value}
      </span>
      <span className="sr-only">{value}</span>
    </>
  );
}

// Sorotan yang mengikuti kursor di atas kartu (lihat .spot di CSS).
export function spotlight(ev) {
  const el = ev.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', ev.clientX - r.left + 'px');
  el.style.setProperty('--my', ev.clientY - r.top + 'px');
}
