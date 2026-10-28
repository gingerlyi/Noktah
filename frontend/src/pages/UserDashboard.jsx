// Dashboard pengguna: ringkasan PRD milik akun ini dan jalan pintas ke pekerjaan berikutnya.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { fmt, isAdmin, useApp, when } from '../lib/app.jsx';
import { PLATFORM, T } from '../lib/catalog.js';
import { fix, valid } from '../lib/prd.js';
import { Loading, MockThumb } from '../components/ui.jsx';

export default function UserDashboard() {
  const { user } = useApp();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let on = true;
    api
      .get('/prds')
      .then(
        (d) =>
          on &&
          setItems(
            d.items.map((p) => ({
              ...p,
              state: valid(p.state) ? fix(p.state) : null,
            })),
          ),
      )
      .catch((err) => on && setError(err.message));
    return () => {
      on = false;
    };
  }, []);

  const head = (
    <div className="view-head">
      <div>
        <h1>Halo, {user?.name || 'kamu'}</h1>
        <p>Ringkasan PRD yang kamu susun di Noktah.</p>
      </div>
      <div className="row">
        {isAdmin(user) && (
          <Link className="btn quiet" to="/admin">
            Dashboard admin
          </Link>
        )}
        <Link className="btn quiet" to="/perpustakaan">
          Ambil dari perpustakaan
        </Link>
        <Link className="btn" to="/buat">
          Buat PRD dari usahamu
        </Link>
      </div>
    </div>
  );

  if (error)
    return (
      <main className="view tight">
        {head}
        <div className="empty">
          <h2>Data tidak bisa dimuat</h2>
          <p>{error}</p>
        </div>
      </main>
    );
  if (!items) return <Loading text="Memuat dashboard…" />;

  const count = (pf) => items.filter((it) => it.state && T[it.state.tpl]?.platform === pf).length;
  const recent = [...items].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 3);
  const kpis = [
    ['PRD tersimpan', fmt(items.length), user?.premium ? 'dari batas 300' : 'dari batas 1 (paket Gratis)'],
    [PLATFORM.web, fmt(count('web')), 'PRD website'],
    [PLATFORM.mobile, fmt(count('mobile')), 'PRD aplikasi'],
    ['Terakhir diubah', recent[0] ? when(recent[0].updatedAt) : '-', recent[0]?.name || 'belum ada PRD'],
  ];

  return (
    <main className="view tight">
      {head}
      <div className="sheet plan-bar">
        {user?.premium ? (
          <span>
            <b>Premium</b>
            {user.premiumUntil ? ' aktif sampai ' + new Date(user.premiumUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ' aktif'}
          </span>
        ) : (
          <>
            <span>
              <b>Paket Gratis</b>: simpan 1 PRD. Premium membuka sampai 300 PRD.
            </span>
            <Link className="btn" to="/harga">
              Lihat Premium
            </Link>
          </>
        )}
      </div>
      <div className="kpis">
        {kpis.map(([label, value, note]) => (
          <div className="kpi" key={label}>
            <span>{label}</span>
            <b>{value}</b>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <section className="dash-sec">
        <div className="view-head">
          <h2>PRD terakhir diubah</h2>
          <Link to="/prd">Lihat semua</Link>
        </div>
        {recent.length ? (
          <div className="prd-grid">
            {recent.map((it) => (
              <article className="prd-card" key={it.id}>
                <Link className="prd-open" to={'/prd/' + it.id}>
                  {it.state ? <MockThumb state={it.state} /> : <div className="tpl-thumb" />}
                  <span className="tpl-body">
                    <span className="tpl-name">{it.state?.nama || it.name || 'Tanpa nama'}</span>
                    <span className="tpl-desc">Diubah {when(it.updatedAt)}</span>
                  </span>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">
            <h2>Belum ada PRD</h2>
            <p>Pilih PRD dari perpustakaan, lalu sesuaikan isinya di editor.</p>
            <Link className="btn" to="/perpustakaan">
              Buka perpustakaan
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
