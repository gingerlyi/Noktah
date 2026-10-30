import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useApp } from '../lib/app.jsx';
import { fix, fromTemplate, valid } from '../lib/prd.js';
import { EditorShell, useAutosave } from '../components/Editor.jsx';
import { Loading } from '../components/ui.jsx';
import { waktuKomentar } from './Shared.jsx';

export default function PrdEdit() {
  const { id } = useParams();
  return <Inner key={id} id={id} />;
}

function Inner({ id }) {
  const { pub } = useApp();
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const { status, queue } = useAutosave((value) => api.put('/prds/' + id, { state: value }));

  useEffect(() => {
    let on = true;
    api
      .get('/prds/' + id)
      .then((p) => {
        if (!on) return;
        if (valid(p.state)) setState(fix(p.state));
        else setError('Isi PRD ini rusak dan tidak bisa dibuka.');
      })
      .catch((err) => on && setError(err.status === 404 ? 'PRD tidak ditemukan.' : err.message));
    return () => {
      on = false;
    };
  }, [id]);

  const change = useCallback(
    (next) => {
      setState(next);
      queue(next);
    },
    [queue],
  );

  if (error) {
    return (
      <main className="view tight">
        <div className="empty">
          <p>{error}</p>
          <Link className="btn" to="/prd">
            Kembali ke PRD Saya
          </Link>
        </div>
      </main>
    );
  }
  if (!state) return <Loading />;
  return (
    <EditorShell
      kind="prd"
      title={state.nama || 'Tanpa nama'}
      backTo="/prd"
      backLabel="PRD Saya"
      status={status}
      state={state}
      onChange={change}
      onReset={() => change(fromTemplate(pub.templates.some((t) => t.id === state.asal) ? state.asal : state.tpl, pub.templates))}
      tools={
        <>
          <Bagikan id={id} />
          <Riwayat id={id} busy={status === 'saving'} onRestore={(s) => setState(fix(s))} />
        </>
      }
    />
  );
}

// Dialog riwayat versi dan bagikan memakai bingkai yang sama.
const DIALOG = 'sheet max-h-[min(640px,calc(100vh_-_48px))] w-[min(560px,calc(100vw_-_32px))] p-5.5 text-ink backdrop:bg-black/60';
const KEPALA = 'flex items-center justify-between gap-3';
const JUDUL = 'm-0 font-display text-[1.4rem]/[1.2] font-medium';

const waktu = (iso) => new Date(iso).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Riwayat versi: server menyimpan isi lama paling sering tiap 10 menit saat PRD diubah. Daftarnya terbuka
// untuk semua; memulihkan versi untuk Premium. Isi sekarang ikut disimpan sebagai versi sebelum dipulihkan.
function Riwayat({ id, busy, onRestore }) {
  const { user, toast } = useApp();
  const ref = useRef(null);
  const [items, setItems] = useState(null);
  const [kerja, setKerja] = useState(false);
  const buka = () => {
    setItems(null);
    ref.current.showModal();
    api
      .get('/prds/' + id + '/versions')
      .then((d) => setItems(d.items))
      .catch((err) => {
        toast(err.message);
        ref.current.close();
      });
  };
  const pulihkan = async (v) => {
    setKerja(true);
    try {
      const p = await api.post('/prds/' + id + '/versions/' + v.id + '/restore');
      if (!valid(p.state)) throw new Error('Isi versi ini rusak dan tidak bisa dipulihkan.');
      onRestore(p.state);
      ref.current.close();
      toast('Versi ' + waktu(v.createdAt) + ' dipulihkan. Isi sebelumnya tersimpan di riwayat.');
    } catch (err) {
      toast(err.message);
    } finally {
      setKerja(false);
    }
  };
  return (
    <>
      <button type="button" className="btn quiet" onClick={buka}>
        Riwayat
      </button>
      <dialog ref={ref} className={DIALOG} aria-labelledby="versi-judul">
        <div className={KEPALA}>
          <h2 id="versi-judul" className={JUDUL}>
            Riwayat versi
          </h2>
          <button type="button" className="btn quiet" onClick={() => ref.current.close()}>
            Tutup
          </button>
        </div>
        <p className="hint">Versi disimpan otomatis saat kamu mengedit, paling sering tiap 10 menit, sampai 50 versi terakhir.</p>
        {!user?.premium && (
          <p className="my-2.5 border border-dashed border-line px-3 py-2.5 text-[.92rem]">
            Memulihkan versi lama adalah fitur Premium.{' '}
            <Link className="text-ink" to="/harga">
              Lihat Premium
            </Link>
          </p>
        )}
        {items === null ? (
          <Loading />
        ) : items.length === 0 ? (
          <p className="hint">Belum ada versi lama. Versi pertama muncul setelah kamu mengubah PRD ini.</p>
        ) : (
          <ol className="mt-3 mb-0 flex list-none flex-col p-0">
            {items.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 border-t border-line py-2.5">
                <span>
                  <b>{waktu(v.createdAt)}</b>
                  <small className="block text-muted">{v.name || 'Tanpa nama'}</small>
                </span>
                {user?.premium && (
                  <button type="button" className="btn quiet" disabled={kerja || busy} onClick={() => pulihkan(v)}>
                    Pulihkan
                  </button>
                )}
              </li>
            ))}
          </ol>
        )}
      </dialog>
    </>
  );
}

// Bagikan: tautan baca dan komentar tanpa akun untuk klien atau developer. Bisa dicabut kapan saja.
function Bagikan({ id }) {
  const { toast } = useApp();
  const ref = useRef(null);
  const [data, setData] = useState(null);
  const [kerja, setKerja] = useState(false);
  const url = data?.token ? location.origin + '/p/' + data.token : '';
  const minta = async (method) => {
    setKerja(true);
    try {
      setData(await api[method]('/prds/' + id + '/share'));
    } catch (err) {
      toast(err.message);
    } finally {
      setKerja(false);
    }
  };
  const buka = () => {
    setData(null);
    ref.current.showModal();
    minta('get');
  };
  const salin = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Tautan disalin.');
    } catch {
      toast('Tidak bisa menyalin otomatis. Pilih tautannya lalu salin manual.');
    }
  };
  const hapus = async (c) => {
    try {
      await api.del('/prds/' + id + '/comments/' + c.id);
      setData((d) => ({ ...d, comments: d.comments.filter((x) => x.id !== c.id) }));
    } catch (err) {
      toast(err.message);
    }
  };
  return (
    <>
      <button type="button" className="btn quiet" onClick={buka}>
        Bagikan
      </button>
      <dialog ref={ref} className={DIALOG} aria-labelledby="bagi-judul">
        <div className={KEPALA}>
          <h2 id="bagi-judul" className={JUDUL}>
            Bagikan PRD
          </h2>
          <button type="button" className="btn quiet" onClick={() => ref.current.close()}>
            Tutup
          </button>
        </div>
        {data === null ? (
          <Loading />
        ) : data.token ? (
          <>
            <p className="hint">Siapa pun yang punya tautan ini bisa membaca PRD, melihat pratinjaunya, dan berkomentar tanpa akun. Perubahanmu langsung ikut terlihat.</p>
            <input type="text" className="my-2.5" readOnly value={url} aria-label="Tautan bagikan" onFocus={(ev) => ev.target.select()} />
            <div className="row">
              <button type="button" className="btn" onClick={salin}>
                Salin tautan
              </button>
              <a className="btn quiet" href={url} target="_blank" rel="noopener noreferrer">
                Buka
              </a>
              <button type="button" className="link danger" disabled={kerja} onClick={() => minta('del')}>
                Cabut tautan
              </button>
            </div>
            <h3 className="mt-4.5 mb-0 font-display text-[1.05rem]/[1.2] font-medium">Komentar ({data.comments.length})</h3>
            {data.comments.length === 0 ? (
              <p className="hint">Belum ada komentar.</p>
            ) : (
              <ol className="komentar-list">
                {data.comments.map((c) => (
                  <li key={c.id}>
                    <b>{c.name}</b> <small>{waktuKomentar(c.createdAt)}</small>
                    <button type="button" className="link danger" onClick={() => hapus(c)}>
                      Hapus
                    </button>
                    <p>{c.body}</p>
                  </li>
                ))}
              </ol>
            )}
          </>
        ) : (
          <>
            <p className="hint">Buat tautan untuk klien, tim, atau developer. Mereka bisa membaca PRD ini dan memberi komentar tanpa perlu membuat akun.</p>
            <button type="button" className="btn" disabled={kerja} onClick={() => minta('post')}>
              Buat tautan bagikan
            </button>
          </>
        )}
      </dialog>
    </>
  );
}
