// Demo di hero landing page: dokumen PRD di kiri "ditulis" satu kebutuhan demi satu kebutuhan, dan
// hasilnya tersusun di bingkai kanan seiring dokumen bertambah. Berganti antara tiga contoh PRD.
// Tampilan pertama selalu lengkap (bukan kosong), dan tidak ada gerak bila pengunjung memilih
// "kurangi gerakan". Tombol jeda menghentikan pergantian otomatis.
import { useEffect, useMemo, useRef, useState } from 'react';
import { T } from '../lib/catalog.js';
import { mockHTML, thumbHTML } from '../lib/mock.js';
import { NO, STRUKTUR, fiturAktif, fiturPeran, fromBuiltin, peranAktif, slug } from '../lib/prd.js';
import { reducedMotion, useInView } from './Motion.jsx';
import { Icon, ScaledHTML } from './ui.jsx';

const IDS = ['toko', 'm-toko', 'dashboard'];
const FIRST_MS = 650; // jeda sebelum baris pertama ditulis
const STEP_MS = 640; // jeda antar baris
const HOLD_MS = 7200; // lama hasil jadi ditampilkan (termasuk digulir pelan) sebelum pindah contoh

function demo(id) {
  const s = fromBuiltin(id);
  const mobile = T[id].platform === 'mobile';
  const on = fiturAktif(s);
  const roles = peranAktif(s);
  // Contoh di landing page menampilkan kebutuhan milik peran utama, dengan nomor FR seperti di dokumennya.
  const rows = fiturPeran(s, roles[0].id)
    .slice(0, 4)
    .map((f) => ({ ...f, no: on.indexOf(f) + 1 }));
  return {
    id,
    s,
    mobile,
    rows,
    roles: roles.map((r) => r.n),
    more: on.length - rows.length,
    html: mobile ? mockHTML(s, true) : thumbHTML(s),
    file: 'prd-' + slug(s) + '.md',
    url: slug(s) + (T[id].app ? '.app' : '.id'),
  };
}

// Kerangka abu-abu yang tampil sebelum maket "tercetak" dari atas ke bawah.
const SKEL = ['h-[7%]', 'mt-[4%] h-[11%] w-[62%]', 'h-[6%] w-[44%]', 'h-[9%] w-[30%] rounded-full', 'flex-1'];
const PILL =
  'inline-flex min-h-9 cursor-pointer items-center gap-1.75 rounded-full border border-line bg-(--glass) px-3.25 py-1.5 text-[.86rem] font-semibold text-muted backdrop-blur-sm hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] hover:text-ink [&_.ico]:size-4';
const MASUK = 'motion-safe:animate-[frame-in_.6s_var(--ease-out)_both]';

function Screen({ d, live, done }) {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-surface">
      <div className="absolute inset-0 flex flex-col gap-[4.5%] px-[6%] py-[5%]">
        {SKEL.map((c) => (
          <i key={c} className={'block rounded-[1cqw] bg-(--skel) ' + c + (done ? '' : ' motion-safe:animate-[shimmer_1.1s_ease-in-out_infinite]')} />
        ))}
      </div>
      <div className="absolute inset-0 bg-surface [clip-path:inset(0_0_calc((1-var(--reveal))*100%)_0)] transition-[clip-path] duration-650 ease-(--ease-out)">
        <ScaledHTML
          className={'size-full overflow-hidden' + (!d.mobile && done ? ' motion-safe:[&>.mock]:animate-[tour_5s_cubic-bezier(.45,0,.25,1)_1.2s_both]' : '')}
          html={d.html}
          base={d.mobile ? 390 : 1120}
        />
      </div>
      <i
        className={
          'absolute inset-x-0 top-[calc(var(--reveal)*100%)] -mt-px h-0.5 bg-(--grad) shadow-[0_0_16px_3px_color-mix(in_srgb,var(--accent)_45%,transparent)] transition-[top,opacity] duration-[650ms,300ms] ease-(--ease-out) ' +
          (live && !done ? 'opacity-100' : 'opacity-0')
        }
      />
    </div>
  );
}

export default function HeroDemo() {
  const demos = useMemo(() => IDS.map(demo), []);
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState(() => demos[0].rows.length); // mulai lengkap
  const [live, setLive] = useState(false); // animasi tulis baru dipakai setelah pergantian pertama
  const [paused, setPaused] = useState(false);
  const [reduced] = useState(reducedMotion);
  const [hidden, setHidden] = useState(() => document.hidden);
  const ref = useRef(null);
  const inView = useInView(ref);

  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);

  const d = demos[idx];
  const n = d.rows.length;
  const done = step >= n;

  useEffect(() => {
    if (reduced || paused || !inView || hidden) return undefined;
    const wait = step >= n ? HOLD_MS : step === 0 ? FIRST_MS : STEP_MS;
    const t = setTimeout(() => {
      if (step < n) {
        setStep(step + 1);
      } else {
        setLive(true);
        setIdx((idx + 1) % demos.length);
        setStep(0);
      }
    }, wait);
    return () => clearTimeout(t);
  }, [step, idx, n, paused, inView, hidden, reduced, demos.length]);

  const pick = (i) => {
    if (i === idx) return;
    setLive(true);
    setIdx(i);
    setStep(reduced || paused ? demos[i].rows.length : 0);
  };

  return (
    <div className={'flex min-w-0 flex-col gap-4' + (paused ? ' [&_*]:[animation-play-state:paused]!' : '')} ref={ref}>
      <div
        className="@container relative aspect-[16/12.4] min-w-0 before:absolute before:inset-[12%_4%_6%_30%] before:-z-1 before:rounded-[40%] before:bg-(--grad) before:opacity-20 before:blur-[50px] before:content-['']"
        style={{ '--reveal': n ? Math.min(step, n) / n : 1 }}
        aria-hidden="true"
      >
        {d.mobile ? (
          <div
            className={
              'absolute top-[1%] right-[13%] bottom-[3%] flex aspect-[9/18.5] flex-col overflow-hidden rounded-[6.5cqw] border-[1.4cqw] border-(--bezel) bg-surface outline outline-line @max-[470px]:right-[6%] ' +
              (live ? MASUK : '')
            }
            key={'s' + idx}
          >
            <Screen d={d} live={live} done={done} />
          </div>
        ) : (
          <div
            className={
              'absolute top-0 right-0 flex h-[84%] w-[80%] flex-col overflow-hidden rounded-[2.4cqw] border border-line bg-surface @max-[470px]:h-[80%] @max-[470px]:w-[86%] ' +
              (live ? MASUK : '')
            }
            key={'s' + idx}
          >
            <div className="flex flex-none items-center gap-[1.1cqw] border-b border-line px-[2.2cqw] py-[1.7cqw]">
              {[0, 1, 2].map((k) => (
                <i key={k} className="size-[1.5cqw] flex-none rounded-full bg-line" />
              ))}
              <span className="ml-[1.4cqw] min-w-0 flex-1 truncate rounded-full bg-field px-[2.2cqw] py-[1.1cqw] font-mono text-[clamp(9px,1.75cqw,12px)]/none font-medium text-muted">
                {d.url}
              </span>
            </div>
            <Screen d={d} live={live} done={done} />
          </div>
        )}

        <div
          className={
            'absolute bottom-0 left-0 flex w-[47%] flex-col rounded-[2.4cqw] border border-line bg-surface text-[clamp(9.5px,1.9cqw,13px)]/[1.45] @max-[470px]:w-[58%] ' +
            (live ? 'motion-safe:animate-[doc-in_.6s_var(--ease-out)_both]' : '')
          }
          key={'d' + idx}
        >
          <div className="flex items-center gap-[.6em] border-b border-line px-[1.1em] py-[.8em] font-mono text-[.9em]/none font-medium text-muted [&_.ico]:size-[1.25em] [&_.ico]:text-accent">
            {Icon.file}
            <span className="min-w-0 truncate">{d.file}</span>
          </div>
          <div className="flex flex-col gap-[.45em] px-[1.1em] pt-[.9em] pb-[1.15em]">
            <code className="block font-mono text-[.86em]/[1.5] text-muted @max-[470px]:hidden">
              ---
              <br />
              struktur: {STRUKTUR}
              <br />
              platform: {d.mobile ? 'aplikasi-mobile' : 'website'}
              <br />
              peran: {d.roles.join(', ')}
              <br />
              ---
            </code>
            <b className="mt-[.15em] font-display text-[1.2em]/[1.2] font-extrabold tracking-[-.01em]"># PRD: {d.s.nama}</b>
            <span className="font-mono text-[.88em]/[1.3] font-semibold text-accent">## {NO['Kebutuhan fungsional']}. Kebutuhan fungsional</span>
            <ul className="m-0 flex list-none flex-col gap-[.4em] p-0">
              {d.rows.map((f, i) => {
                const on = i < step;
                const tulis = on && live;
                return (
                  <li key={f.n} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-[.6em]">
                    <code
                      className={
                        'font-mono text-[.82em]/none font-semibold text-accent ' + (on ? (tulis ? 'motion-safe:animate-[fade-in_.3s_both]' : '') : 'opacity-0')
                      }
                    >
                      FR-{String(f.no).padStart(2, '0')}
                    </code>
                    <span className={on ? (tulis ? 'motion-safe:animate-[type_.55s_steps(22,end)_both]' : '') : 'rounded-[.4em] bg-(--skel) text-transparent'}>
                      {f.n}
                    </span>
                    <em
                      className={
                        'rounded-full bg-(--grad) px-[.55em] py-[.3em] font-body text-[.76em]/none font-bold text-on-accent not-italic ' +
                        (on ? (tulis ? 'motion-safe:animate-[pop_.45s_var(--ease-spring)_.45s_both]' : '') : 'opacity-0')
                      }
                    >
                      {f.p}
                    </em>
                  </li>
                );
              })}
            </ul>
            <span className="text-[.9em] text-muted">dan {d.more} kebutuhan lain</span>
          </div>
          <span
            className={
              'absolute -top-[1.15em] -right-[1em] inline-flex items-center gap-[.4em] rounded-full bg-(--grad) px-[.95em] py-[.5em] text-[.95em] font-bold text-on-accent transition-[opacity,transform] duration-[300ms,500ms] ease-(--ease-spring) [&_.ico]:size-[1.15em] ' +
              (done ? 'opacity-100 [transform:rotate(-3deg)]' : 'opacity-0 [transform:scale(.6)_rotate(-8deg)]')
            }
          >
            {Icon.check}
            Sesuai struktur
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2.5">
        <div className="flex min-w-0 gap-1.5 overflow-x-auto [scrollbar-width:none]" role="group" aria-label="Contoh PRD di animasi">
          {demos.map((x, i) => (
            <button
              type="button"
              key={x.id}
              className={
                PILL +
                ' flex-none aria-pressed:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] aria-pressed:bg-accent-soft aria-pressed:text-accent max-hp:px-2.5 max-hp:py-1.25 max-hp:text-[.8rem] max-hp:[&_.ico]:hidden'
              }
              aria-pressed={i === idx}
              onClick={() => pick(i)}
            >
              {x.mobile ? Icon.phone : Icon.web}
              <span>{x.s.nama}</span>
            </button>
          ))}
        </div>
        {!reduced && (
          <button
            type="button"
            className={PILL + ' w-9 flex-none justify-center p-0'}
            aria-pressed={paused}
            aria-label={paused ? 'Lanjutkan animasi' : 'Jeda animasi'}
            title={paused ? 'Lanjutkan animasi' : 'Jeda animasi'}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? Icon.play : Icon.pause}
          </button>
        )}
      </div>
    </div>
  );
}
