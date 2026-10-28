// Wizard "Buat PRD dari usahamu": lima langkah singkat yang mengubah PRD perpustakaan terdekat menjadi PRD
// milik usaha pengguna (nama, tagline, peran, warna, gaya), lalu menyimpannya ke PRD Saya atau mengunduhnya.
// Draf disimpan di sessionStorage supaya tidak hilang saat tamu mendaftar dulu.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { libraryItems, useApp } from '../lib/app.jsx';
import { GAYA, PLATFORM, UNGGULAN, WARNA } from '../lib/catalog.js';
import { checkPrd, fiturAktif, fromTemplate, genMd, halamanAktif, peranAktif } from '../lib/prd.js';
import { skor } from '../components/Library.jsx';
import { downloadMd, useCopyPrd } from '../components/Editor.jsx';
import { MockThumb } from '../components/ui.jsx';

const SIMPAN = 'rprd-wizard';
const LANGKAH = ['Usaha', 'Nama', 'Peran', 'Tampilan', 'Hasil'];
const ABAIKAN = new Set(['dan', 'yang', 'untuk', 'dengan', 'saya', 'kami', 'usaha', 'website', 'aplikasi', 'sistem', 'online', 'bisnis']);
const low = (x) => String(x || '').toLowerCase();

// Mengganti nama contoh di semua teks PRD dengan nama usaha pengguna.
function gantiNama(v, dari, ke) {
  if (typeof v === 'string') return dari ? v.split(dari).join(ke) : v;
  if (Array.isArray(v)) return v.map((x) => gantiNama(x, dari, ke));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, gantiNama(x, dari, ke)]));
  return v;
}

function bacaDraf() {
  try {
    return JSON.parse(sessionStorage.getItem(SIMPAN)) || null;
  } catch {
    return null;
  }
}

export default function Wizard() {
  const { pub, user, toast } = useApp();
  const navigate = useNavigate();
  const copy = useCopyPrd();
  const [d, setD] = useState(
    () => bacaDraf() || { step: 0, jenis: '', platform: 'all', tpl: '', nama: '', tagline: '', peranOff: [], warna: '', gaya: '' },
  );
  const [busy, setBusy] = useState(false);
  const set = (x) => setD((p) => ({ ...p, ...x }));

  useEffect(() => {
    try {
      sessionStorage.setItem(SIMPAN, JSON.stringify(d));
    } catch {
      /* penyimpanan diblokir: draf hanya hilang bila halaman dimuat ulang */
    }
  }, [d]);

  // Tiga PRD perpustakaan yang paling cocok dengan jenis usaha, dari nilai pencarian tiap kata.
  const semua = useMemo(() => libraryItems(pub).map((t) => ({ ...t, state: fromTemplate(t.id, pub.templates) })), [pub]);
  const kata = low(d.jenis)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 3 && !ABAIKAN.has(w));
  const calon = semua
    .filter((t) => d.platform === 'all' || t.platform === d.platform)
    .map((t) => ({ t, n: kata.reduce((sum, w) => sum + skor(t, w), 0) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    // Buang kecocokan yang jauh lebih lemah dari yang terbaik, misalnya "klinik" yang hanya disebut sekilas.
    .filter((x, _, list) => x.n * 2 >= list[0].n)
    .slice(0, 3)
    .map((x) => x.t);
  const cadangan = !calon.length;
  const pilihan = cadangan ? semua.filter((t) => UNGGULAN.includes(t.id) && (d.platform === 'all' || t.platform === d.platform)).slice(0, 3) : calon;
  const dasar = semua.find((t) => t.id === d.tpl);

  // PRD hasil wizard, disusun ulang dari PRD dasar setiap kali jawaban berubah.
  const state = useMemo(() => {
    if (!dasar) return null;
    const asli = dasar.state;
    const s = d.nama.trim() ? gantiNama(asli, asli.nama, d.nama.trim()) : structuredClone(asli);
    s.tpl = asli.tpl;
    s.asal = asli.asal;
    if (d.tagline.trim()) s.tagline = d.tagline.trim();
    s.peran = s.peran.map((r) => ({ ...r, on: r.on && !d.peranOff.includes(r.id) }));
    if (d.warna) s.warna = d.warna;
    if (d.gaya) s.gaya = d.gaya;
    return s;
  }, [dasar, d.nama, d.tagline, d.peranOff, d.warna, d.gaya]);

  const pilih = (t) => set({ tpl: t.id, tagline: t.state.tagline, peranOff: [], warna: t.state.warna, gaya: t.state.gaya });
  const bisaLanjut = [!!dasar, !!d.nama.trim(), state && peranAktif(state).length > 0, true, true][d.step];
  const ke = (step) => {
    set({ step });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const ulang = () => setD({ step: 0, jenis: '', platform: 'all', tpl: '', nama: '', tagline: '', peranOff: [], warna: '', gaya: '' });

  const text = state && d.step === 4 ? genMd(state) : '';
  const simpan = async () => {
    if (!user) {
      navigate('/daftar?next=/buat');
      return;
    }
    setBusy(true);
    try {
      const p = await api.post('/prds', { state });
      try {
        sessionStorage.removeItem(SIMPAN);
      } catch {
        /* abaikan */
      }
      toast('PRD tersimpan di PRD Saya.');
      navigate('/prd/' + p.id);
    } catch (err) {
      toast(err.message);
      setBusy(false);
      if (err.code === 'premium') navigate('/harga');
    }
  };

  return (
    <main className="view tight wz">
      <div className="view-head">
        <div>
          <h1>Buat PRD dari usahamu</h1>
          <p>Jawab empat pertanyaan singkat. PRD lengkap dengan peran, halaman, dan fiturnya langsung jadi.</p>
        </div>
        {d.step > 0 && (
          <button type="button" className="btn quiet" onClick={ulang}>
            Mulai ulang
          </button>
        )}
      </div>

      <ol className="wz-steps" aria-label="Langkah">
        {LANGKAH.map((l, i) => (
          <li key={l} aria-current={i === d.step ? 'step' : undefined} className={i < d.step ? 'is-done' : ''}>
            <span>{i + 1}</span>
            {l}
          </li>
        ))}
      </ol>

      <section className="sheet wz-card">
        {d.step === 0 && (
          <>
            <label className="wz-q" htmlFor="wz-jenis">
              Usaha apa yang mau kamu buatkan sistemnya?
            </label>
            <input
              id="wz-jenis"
              type="text"
              autoFocus
              placeholder="Misalnya klinik gigi, kedai kopi, les privat, laundry kiloan"
              value={d.jenis}
              onChange={(ev) => set({ jenis: ev.target.value })}
            />
            <div className="seg" role="group" aria-label="Platform">
              {[['all', 'Bebas'], ['web', PLATFORM.web], ['mobile', PLATFORM.mobile]].map(([k, label]) => (
                <button type="button" key={k} aria-pressed={d.platform === k} onClick={() => set({ platform: k })}>
                  {label}
                </button>
              ))}
            </div>
            {(kata.length > 0 || d.tpl) && (
              <>
                <p className="hint">
                  {cadangan ? 'Belum ada yang cocok persis. Pilih salah satu PRD populer ini, atau ubah kata kuncinya.' : 'PRD yang paling mirip dengan usahamu. Pilih satu sebagai dasar:'}
                </p>
                <div className="wz-picks">
                  {pilihan.map((t) => (
                    <button type="button" key={t.id} className="wz-pick" aria-pressed={d.tpl === t.id} onClick={() => pilih(t)}>
                      <MockThumb state={t.state} className="tpl-thumb" lazy />
                      <b>{t.name}</b>
                      <span>{t.cocok.slice(0, 2).join(' · ')}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {d.step === 1 && (
          <>
            <label className="wz-q" htmlFor="wz-nama">
              Apa nama usahamu?
            </label>
            <input id="wz-nama" type="text" autoFocus maxLength={80} placeholder={dasar?.state.nama} value={d.nama} onChange={(ev) => set({ nama: ev.target.value })} />
            <label className="wz-q" htmlFor="wz-tag">
              Kalimat pembuka di halaman utama
            </label>
            <input id="wz-tag" type="text" maxLength={140} value={d.tagline} onChange={(ev) => set({ tagline: ev.target.value })} />
            <p className="hint">Nama contoh &ldquo;{dasar?.state.nama}&rdquo; di seluruh PRD akan diganti dengan nama usahamu.</p>
          </>
        )}

        {d.step === 2 && state && (
          <>
            <p className="wz-q">Siapa saja yang akan memakai sistemnya?</p>
            <div className="wz-roles">
              {state.peran.map((r) => {
                const on = !d.peranOff.includes(r.id);
                return (
                  <label key={r.id} className="wz-role">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => set({ peranOff: on ? [...d.peranOff, r.id] : d.peranOff.filter((x) => x !== r.id) })}
                    />
                    <span>
                      <b>{r.n}</b>
                      <small>{r.d}</small>
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="hint">Halaman, alur, dan fitur milik peran yang tidak dipilih ikut dilepas. Peran bisa diaktifkan lagi di editor.</p>
          </>
        )}

        {d.step === 3 && state && (
          <>
            <p className="wz-q">Warna merek</p>
            <div className="swatches">
              {WARNA.map((c) => (
                <button type="button" key={c} className="sw" style={{ background: c }} aria-label={'Warna ' + c} aria-pressed={c === state.warna} onClick={() => set({ warna: c })} />
              ))}
              <input type="color" value={state.warna} aria-label="Warna lain" onChange={(ev) => set({ warna: ev.target.value })} />
            </div>
            <p className="wz-q">Gaya desain</p>
            <div className="wz-gaya">
              {Object.entries(GAYA).map(([k, g]) => (
                <button type="button" key={k} aria-pressed={k === state.gaya} title={g.ciri} onClick={() => set({ gaya: k })}>
                  <i className="gy-swatch" data-gaya={k} aria-hidden="true">
                    Aa
                  </i>
                  {g.pendek}
                </button>
              ))}
            </div>
            <MockThumb state={state} className="tpl-thumb wz-preview" />
          </>
        )}

        {d.step === 4 && state && (
          <div className="wz-result">
            <MockThumb state={state} className="tpl-thumb wz-preview" />
            <div className="wz-sum">
              <p className="wz-q">PRD {state.nama} sudah jadi.</p>
              <ul>
                <li>{peranAktif(state).length} peran: {peranAktif(state).map((r) => r.n).join(', ')}</li>
                <li>{halamanAktif(state).length} halaman dan {fiturAktif(state).length} kebutuhan fungsional</li>
                <li>
                  Gaya {GAYA[state.gaya].nama.toLowerCase()}, warna {state.warna}
                </li>
              </ul>
              <div className="row">
                <button type="button" className="btn big" disabled={busy} onClick={simpan}>
                  {user ? 'Simpan dan sesuaikan' : 'Daftar gratis untuk menyimpan'}
                </button>
                <button type="button" className="btn quiet" onClick={() => copy(text, checkPrd(text))}>
                  Salin Markdown
                </button>
                <button type="button" className="btn quiet" onClick={() => downloadMd(text, state, toast)}>
                  Unduh .md
                </button>
              </div>
              <p className="hint">
                Berikan PRD ini ke AI builder atau developer. Lihat contoh prompt di <Link to="/cara-pakai">Cara pakai</Link>.
              </p>
            </div>
          </div>
        )}

        <div className="row wz-nav">
          {d.step > 0 && (
            <button type="button" className="btn quiet" onClick={() => ke(d.step - 1)}>
              Kembali
            </button>
          )}
          {d.step < 4 && (
            <button type="button" className="btn" disabled={!bisaLanjut} onClick={() => ke(d.step + 1)}>
              {d.step === 3 ? 'Lihat hasilnya' : 'Lanjut'}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
