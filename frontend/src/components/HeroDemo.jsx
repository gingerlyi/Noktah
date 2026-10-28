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

function Screen({ d }) {
  return (
    <div className="hd-screen">
      <div className="hd-skel">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="hd-site">
        <ScaledHTML className="hd-view" html={d.html} base={d.mobile ? 390 : 1120} />
      </div>
      <i className="hd-scan" />
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

  const cls = ['hd-stage', d.mobile ? 'is-app' : 'is-web', live && 'is-live', done && 'is-done'].filter(Boolean).join(' ');

  return (
    <div className={'hd' + (paused ? ' is-paused' : '')} ref={ref}>
      <div className={cls} style={{ '--reveal': n ? Math.min(step, n) / n : 1 }} aria-hidden="true">
        {d.mobile ? (
          <div className="hd-phone" key={'s' + idx}>
            <Screen d={d} />
          </div>
        ) : (
          <div className="hd-browser" key={'s' + idx}>
            <div className="hd-bar">
              <i />
              <i />
              <i />
              <span>{d.url}</span>
            </div>
            <Screen d={d} />
          </div>
        )}

        <div className="hd-doc" key={'d' + idx}>
          <div className="hd-doc-top">
            {Icon.file}
            <span>{d.file}</span>
          </div>
          <div className="hd-doc-body">
            <code className="hd-fm">
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
            <b className="hd-title"># PRD: {d.s.nama}</b>
            <span className="hd-h">## {NO['Kebutuhan fungsional']}. Kebutuhan fungsional</span>
            <ul className="hd-rows">
              {d.rows.map((f, i) => (
                <li key={f.n} className={i < step ? 'on' : ''}>
                  <code>FR-{String(f.no).padStart(2, '0')}</code>
                  <span>{f.n}</span>
                  <em>{f.p}</em>
                </li>
              ))}
            </ul>
            <span className="hd-more">dan {d.more} kebutuhan lain</span>
          </div>
          <span className="hd-ok">
            {Icon.check}
            Sesuai struktur
          </span>
        </div>
      </div>

      <div className="hd-ctrl">
        <div className="hd-pills" role="group" aria-label="Contoh PRD di animasi">
          {demos.map((x, i) => (
            <button type="button" key={x.id} aria-pressed={i === idx} onClick={() => pick(i)}>
              {x.mobile ? Icon.phone : Icon.web}
              <span>{x.s.nama}</span>
            </button>
          ))}
        </div>
        {!reduced && (
          <button
            type="button"
            className="hd-pause"
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
