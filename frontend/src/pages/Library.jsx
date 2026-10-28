// Halaman perpustakaan dan halaman detail satu PRD.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { libraryItems, useApp } from '../lib/app.jsx';
import { BLOK, GAYA, PLATFORM, T } from '../lib/catalog.js';
import { alurAktif, briefDesain, checkPrd, fiturAktif, fromTemplate, genMd, halamanPeran, isMobile, lines, namaPeran, peranAktif, rasio } from '../lib/prd.js';
import { bentukPeran, mockHTML } from '../lib/mock.js';
import { ResultPanel, checkSummary, useCopyPrd } from '../components/Editor.jsx';
import { Library } from '../components/Library.jsx';
import { GayaSwatch, Loading, ScaledHTML } from '../components/ui.jsx';

const kecil = (t) => t.charAt(0).toLowerCase() + t.slice(1);

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

// Ringkasan isi PRD dan penjelasan desainnya, di atas dokumen pada halaman detail.
function PrdInfo({ state }) {
  const t = T[state.tpl];
  const b = briefDesain(state);
  const g = b.g;
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
    <section className="info" aria-label="Tentang PRD ini">
      <div className="sheet info-card">
        <h2>Isi PRD ini</h2>
        <dl className="info-list">
          <div>
            <dt>
              {roles.length} peran, {nHal} {unit}
            </dt>
            <dd>
              <ul className="info-roles">
                {roles.map((r) => (
                  <li key={r.id}>
                    <b>{r.n}</b>
                    {r.d && <span>{r.d}</span>}
                    <small>
                      {mobile ? (r.w === 'web' ? 'Panel web: ' : 'Layar: ') : 'Halaman: '}
                      {halamanPeran(state, r.id)
                        .map((h) => h.n)
                        .join(', ') || '-'}
                    </small>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt>{flows.length} alur utama</dt>
            <dd>
              <ul className="info-flows">
                {flows.map((a, i) => (
                  <li key={i}>
                    {a.n} <span>{namaPeran(state, [a.r])}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt>{feats.length} kebutuhan fungsional</dt>
            <dd>
              {count('P0')} wajib di rilis pertama, {count('P1')} menyusul, {count('P2')} bila sempat. Yang wajib:{' '}
              {feats
                .filter((f) => f.p === 'P0')
                .map((f) => f.n)
                .join(', ')}
              .
            </dd>
          </div>
          <div>
            <dt>Susunan {unit} utama</dt>
            <dd>
              <ol className="info-steps">
                {blok.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ol>
            </dd>
          </div>
          <div>
            <dt>{data.length} entitas data</dt>
            <dd>{data.join(', ')}</dd>
          </div>
          <div>
            <dt>Bagian lainnya</dt>
            <dd>
              Masalah, target pengguna, tujuan dan ukuran keberhasilan, ruang lingkup, kebutuhan non-fungsional, teknologi dan hak akses, tahapan,
              kriteria selesai, dan instruksi untuk AI.
            </dd>
          </div>
        </dl>
      </div>
      <div className="sheet info-card">
        <h2>Design brief</h2>
        <div className="info-style">
          <GayaSwatch gaya={state.gaya} big />
          <div>
            <b>{g.nama}</b>
            <span>{g.ciri}</span>
          </div>
          <span className="info-color" style={{ '--c': state.warna }} title={'Warna merek ' + state.warna} />
        </div>
        {b.kesan && <p>{b.kesan}</p>}
        <dl className="info-list">
          <div>
            <dt>Warna</dt>
            <dd>
              <ul className="info-pal">
                <li>
                  <i style={{ '--c': state.warna }} />
                  Merek {state.warna}
                </li>
                <li>
                  <i style={{ '--c': g.latar }} />
                  Latar {g.latar}
                </li>
                <li>
                  <i style={{ '--c': g.teks }} />
                  Teks {g.teks}
                </li>
              </ul>
              Teks {b.diAtas.nama} di tombol: kontras {rasio(b.diAtas.k)}. Warna merek sebagai teks: {rasio(b.teks)}
              {b.teks < 4.5 ? ', jadi tautan memakai versi yang lebih ' + (b.latarGelap ? 'terang.' : 'gelap.') : '.'}
            </dd>
          </div>
          <div>
            <dt>Huruf</dt>
            <dd>{g.huruf}</dd>
          </div>
          <div>
            <dt>Gambar dan ikon</dt>
            <dd>{g.gambar}</dd>
          </div>
          <div>
            <dt>Hindari</dt>
            <dd>{g.hindari}</dd>
          </div>
          <div>
            <dt>Nada bahasa</dt>
            <dd>{g.nada}</dd>
          </div>
        </dl>
        {t.cocok && (
          <>
            <h3>PRD ini cocok untuk</h3>
            <ul className="info-fit">
              {t.cocok.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </>
        )}
        <p className="hint">
          Gaya {g.pendek.toLowerCase()} juga cocok untuk {kecil(g.cocok)}{' '}
          <Link to={'/perpustakaan?gaya=' + state.gaya}>Lihat PRD lain bergaya {g.pendek.toLowerCase()}</Link>
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
    <section className="hasil" aria-labelledby="hasil-judul">
      <div className="hasil-head">
        <div>
          <h2 id="hasil-judul">Gambaran hasil</h2>
          <p>
            Seperti inilah {app ? 'aplikasi' : 'website'} yang dibangun dari PRD ini, dilihat dari sisi tiap peran. Klik gambar untuk membuka pratinjau
            lengkapnya.
          </p>
        </div>
      </div>
      <div className={'hasil-grid ' + (app ? 'is-app' : 'is-web')}>
        {shots.map((sh) => (
          <button
            type="button"
            className={'hasil-shot ' + (sh.mobile ? 'is-hp' : 'is-web')}
            key={sh.role.id + sh.bentuk}
            onClick={() => onOpen(sh.role.id, sh.bentuk === 'ponsel')}
            aria-label={`Buka pratinjau ${BENTUK[sh.bentuk].toLowerCase()} untuk ${sh.role.n}`}
          >
            <span className="hasil-frame">
              {!sh.mobile && (
                <span className="hasil-bar">
                  <i />
                  <i />
                  <i />
                </span>
              )}
              <ScaledHTML className="hasil-view" base={sh.mobile ? 390 : 1120} html={sh.html} />
            </span>
            <span className="hasil-cap">
              <b>{sh.role.n}</b>
              <small>
                <em>{BENTUK[sh.bentuk]}</em>
                {sh.pages.length > 0 && ' · ' + sh.pages.slice(0, 3).join(', ') + (sh.pages.length > 3 ? ', dan lainnya' : '')}
              </small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function LibraryDetail() {
  const { id } = useParams();
  const { pub, user, toast } = useApp();
  const navigate = useNavigate();
  const copyPrd = useCopyPrd();
  const [tab, setTab] = useState('doc');
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

  return (
    <main className="view tight">
      <div>
        <Link className="btn quiet" to="/perpustakaan">
          ← Perpustakaan
        </Link>
      </div>
      <div className="view-head">
        <div className="lib-head">
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
          <h1>{item.name}</h1>
          <p>
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
      <HasilGaleri
        state={state}
        onOpen={(roleId, mobile) => {
          setTab('prev');
          setPick({ id: roleId, mobile });
        }}
      />
      <PrdInfo state={state} />
      <div ref={panelRef} style={{ scrollMarginTop: 'var(--stick)' }}>
        <ResultPanel state={state} text={text} issues={issues} tab={tab} onTab={setTab} pick={pick} />
      </div>
    </main>
  );
}
