import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { DEF_SUB, DEF_TITLE, useApp } from '../../lib/app.jsx';

export default function Site() {
  const { pub, reloadPublic, toast } = useApp();
  const [title, setTitle] = useState(pub.site.title);
  const [subtitle, setSubtitle] = useState(pub.site.subtitle);
  const [busy, setBusy] = useState(false);

  // Isi kolom mengikuti data server begitu selesai dimuat.
  useEffect(() => {
    setTitle(pub.site.title);
    setSubtitle(pub.site.subtitle);
  }, [pub.site.title, pub.site.subtitle]);

  const save = async (t, s, message) => {
    setBusy(true);
    try {
      await api.put('/admin/site', { title: t, subtitle: s });
      await reloadPublic();
      toast(message);
    } catch (err) {
      toast(err.message);
    }
    setBusy(false);
  };

  return (
    <>
      <div className="view-head">
        <div>
          <h1>Landing page</h1>
          <p>Teks yang tampil di bagian atas landing page.</p>
        </div>
      </div>
      <form
        className="sheet adm"
        onSubmit={(ev) => {
          ev.preventDefault();
          save(title.trim(), subtitle.trim(), 'Teks landing page disimpan.');
        }}
      >
        <div className="fld">
          <label htmlFor="a-judul">
            Judul <span className="hint">bagian setelah koma pertama diberi stabilo</span>
          </label>
          <input id="a-judul" type="text" maxLength={120} placeholder={DEF_TITLE} value={title} onChange={(ev) => setTitle(ev.target.value)} />
        </div>
        <div className="fld">
          <label htmlFor="a-sub">Kalimat penjelas</label>
          <textarea id="a-sub" maxLength={300} placeholder={DEF_SUB} value={subtitle} onChange={(ev) => setSubtitle(ev.target.value)} />
        </div>
        <span className="hint">Kolom yang dikosongkan memakai teks bawaan.</span>
        <div className="row">
          <button className="btn" type="submit" disabled={busy}>
            Simpan teks
          </button>
          <button className="btn quiet" type="button" disabled={busy} onClick={() => save('', '', 'Landing page memakai teks bawaan.')}>
            Pakai teks bawaan
          </button>
        </div>
      </form>
    </>
  );
}
