// Admin: mengelola isi perpustakaan. PRD bawaan bisa disembunyikan; PRD buatan admin bisa dibuat,
// diedit, ditampilkan, dan dihapus. Di server, PRD buatan admin disimpan di tabel "templates".
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useApp } from '../../lib/app.jsx';
import { PLATFORM, T, TPL_IDS } from '../../lib/catalog.js';
import { fix, fromBuiltin, valid } from '../../lib/prd.js';
import { EditorShell, useAutosave } from '../../components/Editor.jsx';
import { Loading } from '../../components/ui.jsx';

const body = (t, patch) => ({ name: t.name, summary: t.summary, hidden: t.hidden, state: t.state, ...patch });
const platformOf = (t) => (valid(t.state) ? T[t.state.tpl].platform : T[t.base]?.platform || 'web');

export default function Templates() {
  const { pub, reloadPublic, toast } = useApp();
  const navigate = useNavigate();
  const [custom, setCustom] = useState(null);
  const [error, setError] = useState('');
  const [base, setBase] = useState(TPL_IDS[0]);
  const [hiddenBuiltin, setHiddenBuiltin] = useState(pub.site.hiddenBuiltin);
  // Penyaring daftar, karena isi perpustakaan bisa puluhan PRD.
  const [cari, setCari] = useState('');
  const [pf, setPf] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => setHiddenBuiltin(pub.site.hiddenBuiltin), [pub.site.hiddenBuiltin]);
  useEffect(() => {
    let on = true;
    api
      .get('/admin/templates')
      .then((d) => on && setCustom(d.items))
      .catch((err) => on && setError(err.message));
    return () => {
      on = false;
    };
  }, []);

  const toggleBuiltin = async (id) => {
    const next = hiddenBuiltin.includes(id) ? hiddenBuiltin.filter((x) => x !== id) : [...hiddenBuiltin, id];
    setHiddenBuiltin(next);
    try {
      await api.put('/admin/builtin-templates', { hiddenBuiltin: next });
      reloadPublic();
    } catch (err) {
      setHiddenBuiltin(hiddenBuiltin);
      toast(err.message);
    }
  };
  const toggleCustom = async (t) => {
    try {
      const saved = await api.put('/admin/templates/' + t.id, body(t, { hidden: !t.hidden }));
      setCustom((list) => list.map((x) => (x.id === t.id ? saved : x)));
      reloadPublic();
    } catch (err) {
      toast(err.message);
    }
  };
  const create = async () => {
    try {
      const t = await api.post('/admin/templates', { name: 'PRD baru', summary: T[base].ringkas, base, state: fromBuiltin(base) });
      navigate('/admin/templat/' + t.id);
    } catch (err) {
      toast(err.message);
    }
  };
  const remove = async (t) => {
    try {
      await api.del('/admin/templates/' + t.id);
    } catch (err) {
      toast(err.message);
      return;
    }
    setCustom((list) => list.filter((x) => x.id !== t.id));
    reloadPublic();
    toast('PRD dihapus dari perpustakaan.', async () => {
      try {
        let back = await api.post('/admin/templates', { name: t.name, summary: t.summary, base: t.base, state: t.state });
        if (!t.hidden) back = await api.put('/admin/templates/' + back.id, body(back, { hidden: false }));
        setCustom((list) => [...(list || []), back]);
        reloadPublic();
      } catch (err) {
        toast(err.message);
      }
    });
  };

  const q = cari.trim().toLowerCase();
  const cocok = (nama, kategori, ringkas, platform, hidden) =>
    (!q || [nama, kategori, ringkas].some((x) => String(x || '').toLowerCase().includes(q))) &&
    (!pf || platform === pf) &&
    (!status || (status === 'tampil') === !hidden);
  const bawaan = TPL_IDS.filter((id) => cocok(T[id].nama, T[id].kategori, T[id].ringkas, T[id].platform, hiddenBuiltin.includes(id)));
  const buatan = (custom || []).filter((t) => cocok(t.name, T[t.base]?.kategori, t.summary, platformOf(t), t.hidden));

  return (
    <>
      <div className="view-head">
        <div>
          <h1>Perpustakaan</h1>
          <p>PRD yang bisa dibaca dan diambil pengguna.</p>
        </div>
      </div>
      <div className="sheet adm">
        <div className="adm-head">
          <h2>Isi perpustakaan</h2>
          <div className="addrow">
            <select aria-label="PRD dasar" value={base} onChange={(ev) => setBase(ev.target.value)}>
              {Object.entries(PLATFORM).map(([key, label]) => (
                <optgroup label={label} key={key}>
                  {TPL_IDS.filter((id) => T[id].platform === key).map((id) => (
                    <option key={id} value={id}>
                      Dasar: {T[id].nama}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button className="btn" type="button" onClick={create}>
              Tambah PRD
            </button>
          </div>
        </div>
        <span className="hint">
          PRD baru disalin dari PRD dasar yang dipilih dan awalnya disembunyikan. Tampilkan setelah isinya siap dan lolos pemeriksa struktur.
        </span>
        <div className="adm-filter">
          <input
            type="search"
            id="adm-cari"
            placeholder="Cari nama, kategori, atau isi singkat"
            aria-label="Cari PRD di perpustakaan"
            value={cari}
            onChange={(ev) => setCari(ev.target.value)}
          />
          <select aria-label="Saring platform" value={pf} onChange={(ev) => setPf(ev.target.value)}>
            <option value="">Semua platform</option>
            {Object.entries(PLATFORM).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select aria-label="Saring status" value={status} onChange={(ev) => setStatus(ev.target.value)}>
            <option value="">Tampil dan tersembunyi</option>
            <option value="tampil">Hanya yang tampil</option>
            <option value="sembunyi">Hanya yang disembunyikan</option>
          </select>
          <span className="hint" role="status">
            {bawaan.length + buatan.length} dari {TPL_IDS.length + (custom || []).length} PRD
          </span>
        </div>
        {error && <p className="form-err">{error}</p>}
        <ul className="adm-list">
          {bawaan.length + buatan.length === 0 && custom !== null && (
            <li className="adm-none">
              <span>Tidak ada PRD yang cocok dengan penyaring ini.</span>
              <button
                type="button"
                className="link"
                onClick={() => {
                  setCari('');
                  setPf('');
                  setStatus('');
                }}
              >
                Hapus penyaring
              </button>
            </li>
          )}
          {bawaan.map((id) => {
            const hidden = hiddenBuiltin.includes(id);
            return (
              <li className={hidden ? 'is-hidden' : ''} key={id}>
                <div className="t-main">
                  <b>{T[id].nama}</b>
                  <span>{T[id].ringkas}</span>
                </div>
                <div className="t-act">
                  <span className="tag">{PLATFORM[T[id].platform]}</span>
                  <span className="tag">Bawaan</span>
                  <button type="button" className="chip" aria-pressed={!hidden} onClick={() => toggleBuiltin(id)}>
                    {hidden ? 'Disembunyikan' : 'Tampil'}
                  </button>
                </div>
              </li>
            );
          })}
          {custom === null && !error && (
            <li>
              <Loading />
            </li>
          )}
          {buatan.map((t) => (
            <li className={t.hidden ? 'is-hidden' : ''} key={t.id}>
              <div className="t-main">
                <b>{t.name}</b>
                <span>{t.summary}</span>
              </div>
              <div className="t-act">
                <span className="tag">{PLATFORM[platformOf(t)]}</span>
                <span className="tag">Buatan admin</span>
                <button type="button" className="chip" aria-pressed={!t.hidden} onClick={() => toggleCustom(t)}>
                  {t.hidden ? 'Disembunyikan' : 'Tampil'}
                </button>
                <Link className="link" to={'/admin/templat/' + t.id}>
                  Edit isi
                </Link>
                <button type="button" className="link danger" onClick={() => remove(t)}>
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export function TemplateEdit() {
  const { id } = useParams();
  return <EditInner key={id} id={id} />;
}

function EditInner({ id }) {
  const { reloadPublic } = useApp();
  const [tpl, setTpl] = useState(null);
  const tplRef = useRef(null);
  const [error, setError] = useState('');
  // Nama tidak boleh kosong di server, jadi nama yang sedang dikosongkan disimpan sebagai "PRD".
  const { status, queue } = useAutosave((value) =>
    api.put('/admin/templates/' + id, body(value, { name: value.name.trim() || 'PRD' })),
  );

  useEffect(() => {
    let on = true;
    api
      .get('/admin/templates')
      .then((d) => {
        if (!on) return;
        const t = d.items.find((x) => x.id === id);
        if (!t || !valid(t.state)) setError('PRD tidak ditemukan.');
        else {
          tplRef.current = { ...t, state: fix(t.state) };
          setTpl(tplRef.current);
        }
      })
      .catch((err) => on && setError(err.message));
    return () => {
      on = false;
      reloadPublic(); // perpustakaan ikut diperbarui setelah keluar dari editor
    };
  }, [id, reloadPublic]);

  const change = useCallback(
    (patch) => {
      const next = { ...tplRef.current, ...patch };
      tplRef.current = next;
      setTpl(next);
      queue(next);
    },
    [queue],
  );

  if (error) {
    return (
      <div className="empty">
        <p>{error}</p>
        <Link className="btn" to="/admin/templat">
          Kembali ke perpustakaan
        </Link>
      </div>
    );
  }
  if (!tpl) return <Loading />;
  return (
    <EditorShell
      kind="tpl"
      title={tpl.name || 'PRD'}
      backTo="/admin/templat"
      backLabel="Perpustakaan"
      status={status}
      state={tpl.state}
      onChange={(state) => change({ state })}
      onReset={() => change({ state: fromBuiltin(tpl.state.tpl) })}
      metaGroup={
        <details className="grp" open>
          <summary>Info di perpustakaan</summary>
          <div className="grp-body">
            <div className="fld">
              <label htmlFor="t-nama">
                Jenis PRD <span className="hint">judul kartu, misalnya "Aplikasi kasir"</span>
              </label>
              <input id="t-nama" type="text" maxLength={60} value={tpl.name} onChange={(ev) => change({ name: ev.target.value })} />
            </div>
            <div className="fld">
              <label htmlFor="t-ringkas">
                Ringkasan <span className="hint">tampil di kartu perpustakaan</span>
              </label>
              <textarea id="t-ringkas" maxLength={200} value={tpl.summary} onChange={(ev) => change({ summary: ev.target.value })} />
            </div>
            <span className="hint">Isi formulir di bawah menjadi isi PRD ini di perpustakaan.</span>
          </div>
        </details>
      }
    />
  );
}
