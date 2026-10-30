// Halaman perpustakaan dan halaman detail satu PRD.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { libraryItems, useApp } from '../lib/app.jsx';
import { BLOK, GAYA, PLATFORM, T } from '../lib/catalog.js';
import { alurAktif, checkPrd, fiturAktif, fromTemplate, genMd, halamanPeran, isMobile, lines, namaPeran, peranAktif } from '../lib/prd.js';
import { bentukPeran, mockHTML } from '../lib/mock.js';
import { ResultPanel, checkSummary, useCopyPrd } from '../components/Editor.jsx';
import { DesignBrief } from '../components/DesignBrief.jsx';
import { Library } from '../components/Library.jsx';
import { GayaSwatch, Loading, ScaledHTML } from '../components/ui.jsx';

const kecil = (t) => t.charAt(0).toLowerCase() + t.slice(1);
const UL = 'm-0 flex list-none p-0';
const PIL = 'rounded-full bg-accent-soft font-semibold text-accent';

// Satu baris daftar "Isi PRD ini": judul di kiri, isi di kanan (bertumpuk di layar sempit).
function Baris({ t, children }) {
  return (
    <div className="grid grid-cols-[minmax(0,11em)_minmax(0,1fr)] gap-x-4 gap-y-1 border-t border-line py-2.75 first:border-t-0 first:pt-0 max-lg:grid-cols-1">
      <dt className="text-[.92rem] font-bold">{t}</dt>
      <dd className="m-0 text-[.92rem] text-muted">{children}</dd>
    </div>
  );
}

export default function LibraryPage() {
  const [params] = useSearchParams();
  const awal = { platform: params.get('platform') || '', gaya: params.get('gaya') || '', kategori: params.get('kategori') || '', q: params.get('q') || '' };
  return (
    <main className="view tight">
      <div className="view-head">
        <div>
          <h1>Perpustakaan PRD</h1>
          <p>PRD siap pakai untuk website dan aplikasi mobile. Semuanya memakai struktur yang sama, jadi AI builder membacanya dengan cara yang sama.</p>
        </div>
        <Link className="btn quiet" to="/struktur">
          Lihat struktur PRD
        </Link>
      </div>
      <Library key={params.toString()} awal={awal} />
    </main>
  );
}

// Ringkasan isi PRD di atas dokumen pada halaman detail. Design brief punya tab sendiri.
function PrdInfo({ state }) {
  const t = T[state.tpl];
  const g = GAYA[state.gaya] || GAYA.bersih;
  const mobile = t.platform === 'mobile';
  const unit = mobile ? 'layar' : 'halaman';
  const roles = peranAktif(state);
  const flows = alurAktif(state);
  const feats = fiturAktif(state);
  const nHal = roles.reduce((n, r) => n + halamanPeran(state, r.id).length, 0);
  const count = (p) => feats.filter((f) => f.p === p).length;
  const blok = state.blok.filter((b) => b.on && BLOK[b.id]).map((b) => BLOK[b.id]);
  const data = lines(state.data).map((x) => x.split(':')[0].trim());
  return (
    <section aria-label="Tentang PRD ini">
      <div className="sheet flex flex-col gap-3.5 px-6 py-5.5">
        <h2 className="m-0 font-display text-[1.15rem]/[1.3] font-bold">Isi PRD ini</h2>
        <dl className="m-0 flex flex-col">
          <Baris t={`${roles.length} peran, ${nHal} ${unit}`}>
            <ul className={UL + ' flex-col gap-2'}>
              {roles.map((r) => (
                <li key={r.id} className="flex flex-col gap-0.5 rounded-xl border border-line bg-field px-3 py-2.25">
                  <b className="text-[.92rem] text-ink">{r.n}</b>
                  {r.d && <span className="text-[.86rem]">{r.d}</span>}
                  <small className="text-[.8rem] text-muted">
                    {mobile ? (r.w === 'web' ? 'Panel web: ' : 'Layar: ') : 'Halaman: '}
                    {halamanPeran(state, r.id)
                      .map((h) => h.n)
                      .join(', ') || '-'}
                  </small>
                </li>
              ))}
            </ul>
          </Baris>
          <Baris t={flows.length + ' alur utama'}>
            <ul className="m-0 flex flex-col gap-0.75 pl-[1.2em]">
              {flows.map((a, i) => (
                <li key={i}>
                  {a.n} <span className={PIL + ' ml-1 inline-block px-2 py-px text-[.76rem]'}>{namaPeran(state, [a.r])}</span>
                </li>
              ))}
            </ul>
          </Baris>
          <Baris t={feats.length + ' kebutuhan fungsional'}>
            {count('P0')} wajib di rilis pertama, {count('P1')} menyusul, {count('P2')} bila sempat. Yang wajib:{' '}
            {feats
              .filter((f) => f.p === 'P0')
              .map((f) => f.n)
              .join(', ')}
            .
          </Baris>
          <Baris t={'Susunan ' + unit + ' utama'}>
            <ol className={UL + ' flex-wrap gap-1.5 [counter-reset:s]'}>
              {blok.map((b, i) => (
                <li
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-field py-0.75 pr-2.5 pl-1 text-[.82rem] text-ink [counter-increment:s] before:grid before:size-5 before:place-items-center before:rounded-full before:bg-(--grad) before:font-body before:text-[.7rem]/none before:font-bold before:text-on-accent before:content-[counter(s)]"
                >
                  {b}
                </li>
              ))}
            </ol>
          </Baris>
          <Baris t={data.length + ' entitas data'}>{data.join(', ')}</Baris>
          <Baris t="Bagian lainnya">
            Masalah, target pengguna, tujuan dan ukuran keberhasilan, ruang lingkup, kebutuhan non-fungsional, teknologi dan hak akses, tahapan, kriteria
            selesai, dan instruksi untuk AI.
          </Baris>
        </dl>
        {t.cocok && (
          <>
            <h3 className="mt-1 -mb-1 font-display text-[.95rem]/[1.3] font-bold">PRD ini cocok untuk</h3>
            <ul className={UL + ' flex-wrap gap-1.5'}>
              {t.cocok.map((c) => (
                <li key={c} className={PIL + ' px-3 py-1.25 text-[.86rem]'}>
                  {c}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="hint m-0">
          Gaya {g.pendek.toLowerCase()} juga cocok untuk {kecil(g.cocok)}{' '}
          <Link className="font-semibold text-accent" to={'/perpustakaan?gaya=' + state.gaya}>
            Lihat PRD lain bergaya {g.pendek.toLowerCase()}
          </Link>
        </p>
      </div>
    </section>
  );
}

// Gambaran hasil: tampilan tiap peran sebagai galeri bergambar, supaya hasil PRD terlihat sebelum membaca dokumennya.
// Website juga ditampilkan di ponsel. Klik gambar membuka pratinjau lengkap untuk peran itu.
const BENTUK = { situs: 'Halaman website', ponsel: 'Website di ponsel', app: 'Layar aplikasi', panel: 'Panel web' };
function HasilGaleri({ state, onOpen }) {
  const shots = useMemo(() => {
    const roles = peranAktif(state).filter((r, i) => i === 0 || halamanPeran(state, r.id).length);
    return roles.flatMap((r, i) => {
      const bentuk = bentukPeran(state, r.id);
      const one = (b, mobile) => ({ role: r, bentuk: b, mobile, html: mockHTML(state, mobile, r.id), pages: halamanPeran(state, r.id).map((p) => p.n) });
      const list = [one(bentuk, bentuk === 'app')];
      if (i === 0 && bentuk === 'situs') list.push(one('ponsel', true));
      return list;
    });
  }, [state]);
  const app = isMobile(state);
  return (
    <section className="flex flex-col gap-4 rounded-[20px] border border-line bg-(--grad-soft) p-5.5" aria-labelledby="hasil-judul">
      <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-2">
        <div>
          <h2 id="hasil-judul" className="m-0 font-display text-[1.35rem]/[1.2] font-medium">
            Gambaran hasil
          </h2>
          <p className="mt-1 mb-0 max-w-[62ch] text-[.92rem] text-muted">
            Seperti inilah {app ? 'aplikasi' : 'website'} yang dibangun dari PRD ini, dilihat dari sisi tiap peran. Klik gambar untuk membuka pratinjau
            lengkapnya.
          </p>
        </div>
      </div>
      <div className={'grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] items-start gap-4.5' + (app ? '' : ' min-[900px]:grid-flow-dense min-[900px]:grid-cols-3')}>
        {shots.map((sh) => (
          <button
            type="button"
            className={
              'group flex min-w-0 cursor-pointer flex-col gap-2.5 border-0 bg-transparent p-0 text-left focus-visible:outline-none' +
              (app ? '' : sh.mobile ? ' min-[900px]:row-span-2' : ' min-[900px]:first:col-span-2')
            }
            key={sh.role.id + sh.bentuk}
            onClick={() => onOpen(sh.role.id, sh.bentuk === 'ponsel')}
            aria-label={`Buka pratinjau ${BENTUK[sh.bentuk].toLowerCase()} untuk ${sh.role.n}`}
          >
            <span
              className={
                'block overflow-hidden border bg-white group-hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--line))] group-focus-visible:outline-2 group-focus-visible:outline-offset-3 group-focus-visible:outline-accent motion-safe:transition-[translate,border-color] motion-safe:duration-250 motion-safe:ease-(--ease-out) motion-safe:group-hover:-translate-y-1 ' +
                (sh.mobile ? 'mx-auto w-[min(200px,100%)] rounded-[26px] border-6 border-[#14171f]' : 'rounded-xl border-line')
              }
            >
              {!sh.mobile && (
                <span className="flex gap-1.25 border-b border-[#e9ecf2] bg-[#f7f8fb] px-2.5 py-1.75">
                  {[0, 1, 2].map((k) => (
                    <i key={k} className="size-1.75 rounded-full bg-[#d9dde6]" />
                  ))}
                </span>
              )}
              <ScaledHTML
                className={'hasil-view pointer-events-none block overflow-hidden ' + (sh.mobile ? 'aspect-[9/17]' : 'aspect-[16/10]')}
                base={sh.mobile ? 390 : 1120}
                html={sh.html}
              />
            </span>
            <span className="flex flex-col gap-0.5 px-1">
              <b className="font-display text-[.98rem]/[1.3] font-bold">{sh.role.n}</b>
              <small className="text-[.82rem]/[1.4] text-muted">
                <em className="font-semibold text-accent not-italic">{BENTUK[sh.bentuk]}</em>
                {sh.pages.length > 0 && ' · ' + sh.pages.slice(0, 3).join(', ') + (sh.pages.length > 3 ? ', dan lainnya' : '')}
              </small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

// Tab halaman detail: [id, judul, tab panel hasil yang tampil]. Gabungan memuat semuanya dalam satu halaman.
const BAGIAN = [
  ['semua', 'Gabungan', ['doc', 'prev', 'ai']],
  ['prd', 'PRD', ['doc', 'ai']],
  ['desain', 'Design brief', ['brief']],
  ['tampilan', 'Contoh tampilan', ['prev']],
];

export function LibraryDetail() {
  const { id } = useParams();
  const { pub, user, toast } = useApp();
  const navigate = useNavigate();
  const copyPrd = useCopyPrd();
  const [params, setParams] = useSearchParams();
  const bagian = BAGIAN.find((x) => x[0] === params.get('tab')) || BAGIAN[0];
  const [tab, setTab] = useState(bagian[2][0]);
  const panelTab = bagian[2].includes(tab) ? tab : bagian[2][0];
  const pilihBagian = (x) => {
    setParams(x[0] === 'semua' ? {} : { tab: x[0] }, { replace: true });
    setTab(x[2][0]);
  };
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState(null);
  const panelRef = useRef(null);
  // Setelah gambar di galeri diklik, pratinjau lengkap dibuka lalu digulir ke layar.
  useEffect(() => {
    if (pick) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [pick]);

  const item = useMemo(() => libraryItems(pub).find((t) => t.id === id), [pub, id]);
  const state = useMemo(() => (item ? fromTemplate(id, pub.templates) : null), [item, id, pub.templates]);
  const text = useMemo(() => (state ? genMd(state) : ''), [state]);
  const issues = useMemo(() => (state ? checkPrd(text) : []), [state, text]);

  if (!item) {
    if (!pub.loaded) return <Loading />;
    return (
      <main className="view tight">
        <div className="empty">
          <h2>PRD tidak ditemukan</h2>
          <p>PRD ini tidak ada di perpustakaan, atau sedang disembunyikan oleh admin.</p>
          <Link className="btn" to="/perpustakaan">
            Kembali ke perpustakaan
          </Link>
        </div>
      </main>
    );
  }

  // Menyalin PRD perpustakaan ke akun pengguna supaya bisa disesuaikan.
  const use = async () => {
    if (!user) {
      navigate('/daftar?next=' + encodeURIComponent('/perpustakaan/' + id));
      return;
    }
    setBusy(true);
    try {
      const p = await api.post('/prds', { state });
      navigate('/prd/' + p.id);
    } catch (err) {
      toast(err.message);
      setBusy(false);
      if (err.code === 'premium') navigate('/harga');
    }
  };
  const sum = checkSummary(issues);
  const lihat = bagian[0];
  const ket = {
    semua: 'Semua bagian di satu halaman',
    prd: `${fiturAktif(state).length} kebutuhan, ${peranAktif(state).length} peran`,
    desain: `${GAYA[state.gaya]?.pendek}: warna, huruf, komponen`,
    tampilan: `Tampilan tiap peran${isMobile(state) ? '' : ', desktop dan ponsel'}`,
  };

  return (
    <main className="view tight">
      <div>
        <Link className="btn quiet" to="/perpustakaan">
          ← Perpustakaan
        </Link>
      </div>
      <div className="view-head">
        <div className="flex flex-col items-start gap-2.5">
          <div className="row">
            <span className="tag">{PLATFORM[item.platform]}</span>
            <span className="tag">{item.kategori}</span>
            <span className="tag" title={peranAktif(state).map((r) => r.n).join(', ')}>
              {peranAktif(state).length} peran
            </span>
            <span className="tag tag-gaya">
              <GayaSwatch gaya={state.gaya} />
              {GAYA[state.gaya]?.pendek}
            </span>
            <span className={'badge ' + sum.tone}>{sum.label}</span>
          </div>
          <h1 className="text-[clamp(1.7rem,3.2vw,2.3rem)]">{item.name}</h1>
          <p className="m-0">
            {item.summary} Contoh di dalamnya: <b>{state.nama}</b>.
          </p>
        </div>
        <div className="row">
          <button className="btn quiet" type="button" onClick={() => copyPrd(text, issues)}>
            Salin PRD
          </button>
          <button className="btn" type="button" disabled={busy} onClick={use}>
            Pakai dan sesuaikan
          </button>
        </div>
      </div>
      <div
        className="sticky top-(--stick) z-5 grid grid-cols-4 gap-1.5 rounded-2xl border border-line bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] p-1.5 backdrop-blur-md max-[721px]:static max-[721px]:grid-cols-2"
        role="tablist"
        aria-label="Bagian project"
      >
        {BAGIAN.map((x) => (
          <button
            key={x[0]}
            type="button"
            role="tab"
            className="group flex min-w-0 cursor-pointer flex-col items-start gap-0.5 rounded-[11px] border-0 bg-transparent px-3.5 py-2.5 text-left text-ink transition-colors duration-200 hover:bg-field aria-selected:bg-(--grad) aria-selected:text-on-accent"
            aria-selected={lihat === x[0]}
            onClick={() => pilihBagian(x)}
          >
            <b className="font-display text-[.98rem]/[1.2] font-bold">{x[1]}</b>
            <small className="max-w-full truncate text-[.78rem] text-muted group-aria-selected:text-inherit group-aria-selected:opacity-80">{ket[x[0]]}</small>
          </button>
        ))}
      </div>
      {(lihat === 'semua' || lihat === 'tampilan') && (
        <HasilGaleri
          state={state}
          onOpen={(roleId, mobile) => {
            setTab('prev');
            setPick({ id: roleId, mobile });
          }}
        />
      )}
      {(lihat === 'semua' || lihat === 'prd') && <PrdInfo state={state} />}
      {lihat === 'semua' && (
        <section className="sheet overflow-hidden p-0" aria-label="Design brief">
          <DesignBrief state={state} />
        </section>
      )}
      <div ref={panelRef} style={{ scrollMarginTop: 'var(--stick)' }}>
        <ResultPanel state={state} text={text} issues={issues} tab={panelTab} onTab={setTab} pick={pick} tabs={bagian[2]} />
      </div>
    </main>
  );
}
