// Halaman PRD yang dibagikan (/p/:token): siapa pun yang punya tautannya bisa membaca dokumen, melihat
// pratinjau, dan berkomentar tanpa akun. Data pemilik tidak ikut dikirim server.
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useApp } from '../lib/app.jsx';
import { checkPrd, fix, genMd, valid } from '../lib/prd.js';
import { ResultPanel } from '../components/Editor.jsx';
import { Loading } from '../components/ui.jsx';

export const waktuKomentar = (iso) => new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Shared() {
  const { token } = useParams();
  const { toast } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('doc');
  const [form, setForm] = useState({ name: '', body: '', website: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let on = true;
    api
      .get('/shared/' + token)
      .then((d) => {
        if (!on) return;
        if (!valid(d.state)) setError('Isi PRD ini rusak dan tidak bisa ditampilkan.');
        else setData({ ...d, state: fix(d.state) });
      })
      .catch((err) => on && setError(err.message));
    return () => {
      on = false;
    };
  }, [token]);

  const text = useMemo(() => (data ? data.state.manual ?? genMd(data.state) : ''), [data]);
  const issues = useMemo(() => checkPrd(text), [text]);

  const kirim = async (ev) => {
    ev.preventDefault();
    setBusy(true);
    try {
      const c = await api.post('/shared/' + token + '/comments', form);
      setData((d) => ({ ...d, comments: [...d.comments, c] }));
      setForm((f) => ({ ...f, body: '' }));
      toast('Komentar terkirim.');
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (error)
    return (
      <main className="view tight">
        <div className="empty">
          <h2>PRD tidak bisa dibuka</h2>
          <p>{error}</p>
          <Link className="btn" to="/buat">
            Buat PRD sendiri
          </Link>
        </div>
      </main>
    );
  if (!data) return <Loading text="Memuat PRD…" />;

  return (
    <main className="view tight">
      <div className="view-head">
        <div>
          <span className="step">PRD yang dibagikan</span>
          <h1>{data.name || 'Tanpa nama'}</h1>
          <p>Diperbarui {waktuKomentar(data.updatedAt)}. Baca dokumennya, lihat pratinjaunya, lalu tinggalkan komentar untuk penyusunnya.</p>
        </div>
        <Link className="btn quiet" to="/buat">
          Buat PRD seperti ini
        </Link>
      </div>

      <ResultPanel state={data.state} text={text} issues={issues} tab={tab} onTab={setTab} />

      <section className="sheet komentar" aria-labelledby="h-komentar">
        <h2 id="h-komentar">Komentar ({data.comments.length})</h2>
        {data.comments.length === 0 ? (
          <p className="hint">Belum ada komentar. Jadilah yang pertama memberi masukan.</p>
        ) : (
          <ol className="komentar-list">
            {data.comments.map((c) => (
              <li key={c.id}>
                <b>{c.name}</b> <small>{waktuKomentar(c.createdAt)}</small>
                <p>{c.body}</p>
              </li>
            ))}
          </ol>
        )}
        <form className="komentar-form" onSubmit={kirim}>
          <div className="fld">
            <label htmlFor="k-nama">Nama</label>
            <input id="k-nama" type="text" required maxLength={60} value={form.name} onChange={(ev) => setForm({ ...form, name: ev.target.value })} />
          </div>
          <div className="fld">
            <label htmlFor="k-isi">Komentar</label>
            <textarea id="k-isi" required maxLength={2000} rows={4} value={form.body} onChange={(ev) => setForm({ ...form, body: ev.target.value })} />
          </div>
          {/* Kolom jebakan untuk bot: tersembunyi dari pengunjung dan pembaca layar. */}
          <input className="jebakan" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={(ev) => setForm({ ...form, website: ev.target.value })} />
          <div className="row">
            <button type="submit" className="btn" disabled={busy}>
              Kirim komentar
            </button>
            <span className="hint">Komentarmu bisa dibaca semua orang yang punya tautan ini.</span>
          </div>
        </form>
      </section>

      <section className="sheet plan-bar">
        <span>
          <b>Dibuat dengan Noktah.</b> Susun PRD lengkap dengan peran, halaman, dan fitur untuk usahamu dalam satu menit.
        </span>
        <Link className="btn" to="/buat">
          Coba gratis
        </Link>
      </section>
    </main>
  );
}
