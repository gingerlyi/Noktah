import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useApp, when } from '../lib/app.jsx';
import { PLATFORM, T } from '../lib/catalog.js';
import { clone, fix, valid } from '../lib/prd.js';
import { Loading, MockThumb } from '../components/ui.jsx';

const toItem = (p) => ({ id: p.id, updatedAt: p.updatedAt, name: p.name, state: valid(p.state) ? fix(p.state) : null });

export default function PrdList() {
  const { toast } = useApp();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let on = true;
    api
      .get('/prds')
      .then((d) => on && setItems(d.items.map(toItem)))
      .catch((err) => on && setError(err.message));
    return () => {
      on = false;
    };
  }, []);

  const create = async (state) => {
    const p = await api.post('/prds', { state });
    setItems((list) => [toItem(p), ...(list || [])]);
  };
  const duplicate = async (it) => {
    const state = clone(it.state);
    state.nama = (state.nama || 'Tanpa nama') + ' (salinan)';
    try {
      await create(state);
      toast('PRD diduplikat.');
    } catch (err) {
      toast(err.message);
    }
  };
  const remove = async (it) => {
    try {
      await api.del('/prds/' + it.id);
    } catch (err) {
      toast(err.message);
      return;
    }
    setItems((list) => list.filter((x) => x.id !== it.id));
    toast(
      'PRD dihapus.',
      it.state &&
        (() => {
          create(it.state).catch((err) => toast(err.message));
        }),
    );
  };

  return (
    <main className="view tight">
      <div className="view-head">
        <div>
          <h1>PRD Saya</h1>
          <p>Tersimpan di akunmu dan hanya kamu yang bisa membukanya.</p>
        </div>
        <Link className="btn" to="/perpustakaan">
          Ambil dari perpustakaan
        </Link>
      </div>
      {error ? (
        <div className="empty">
          <p>{error}</p>
        </div>
      ) : items === null ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="empty">
          <h2>Belum ada PRD</h2>
          <p>Ambil PRD dari perpustakaan, sesuaikan isinya, dan hasilnya tersimpan di sini.</p>
          <Link className="btn" to="/perpustakaan">
            Buka perpustakaan
          </Link>
        </div>
      ) : (
        <div className="prd-grid">
          {items.map((it) => (
            <article className="prd-card" key={it.id}>
              <Link className="prd-open" to={'/prd/' + it.id}>
                {it.state ? <MockThumb state={it.state} /> : <div className="tpl-thumb" />}
                <span className="tpl-body">
                  <span className="tpl-name">{it.state?.nama || it.name || 'Tanpa nama'}</span>
                  <span className="tpl-desc">
                    {it.state ? `${it.state.jenis || T[it.state.tpl].nama} · ${PLATFORM[T[it.state.tpl].platform]}` : 'Isi tidak terbaca'} · Diubah {when(it.updatedAt)}
                  </span>
                </span>
              </Link>
              <div className="prd-actions">
                {it.state && (
                  <button type="button" className="link" onClick={() => duplicate(it)}>
                    Duplikat
                  </button>
                )}
                <button type="button" className="link danger" onClick={() => remove(it)}>
                  Hapus
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
