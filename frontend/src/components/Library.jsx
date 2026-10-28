// Kisi perpustakaan PRD dengan filter platform, gaya desain, kategori, dan pencarian.
// Di landing page dipakai dengan "batas" dan "utama": PRD pilihan tampil lebih dulu, sisanya di halaman perpustakaan.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { libraryItems, useApp } from '../lib/app.jsx';
import { GAYA, KATEGORI_LIST, PLATFORM } from '../lib/catalog.js';
import { fromTemplate } from '../lib/prd.js';
import { GayaSwatch, Icon, MockThumb } from './ui.jsx';

const FILTERS = [
  ['all', 'Semua'],
  ['web', 'Website'],
  ['mobile', 'Aplikasi mobile'],
];
const NONE = [];
const KOSONG = {};
const low = (x) => String(x || '').toLowerCase();

// Nilai kecocokan pencarian: 0 = tidak cocok, 1 = ada di dalam kata lain (misalnya "kos" di "kosong"),
// 2 = kata utuh di ringkasan atau jenis usaha, 3 = kata utuh di nama PRD atau kategori. Hasil diurutkan dari nilai tertinggi.
export function skor(t, q) {
  const fields = [t.name, t.summary, t.kategori, t.state.nama, GAYA[t.gaya]?.nama, ...t.cocok, ...t.peran];
  if (!fields.some((x) => low(x).includes(q))) return 0;
  const kata = new RegExp('(^|[^\\p{L}\\p{N}])' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^\\p{L}\\p{N}])', 'iu');
  if (kata.test(t.name) || kata.test(t.kategori)) return 3;
  if (kata.test(t.summary) || t.cocok.some((x) => kata.test(x)) || t.peran.some((x) => kata.test(x))) return 2;
  return 1;
}

export function Library({ batas = 0, utama = NONE, awal = KOSONG }) {
  const { pub } = useApp();
  const [platform, setPlatform] = useState(FILTERS.some(([k]) => k === awal.platform) ? awal.platform : 'all');
  const [gaya, setGaya] = useState(GAYA[awal.gaya] ? awal.gaya : '');
  const [kategori, setKategori] = useState(KATEGORI_LIST.includes(awal.kategori) ? awal.kategori : '');
  const [query, setQuery] = useState(awal.q || '');

  const all = useMemo(() => {
    const list = libraryItems(pub).map((t) => ({ ...t, state: fromTemplate(t.id, pub.templates) }));
    if (!utama.length) return list;
    const rank = (id) => (utama.includes(id) ? utama.indexOf(id) : utama.length);
    return [...list].sort((a, b) => rank(a.id) - rank(b.id));
  }, [pub, utama]);
  const perGaya = useMemo(() => all.reduce((m, t) => ({ ...m, [t.gaya]: (m[t.gaya] || 0) + 1 }), {}), [all]);

  const q = low(query.trim());
  const hasil = all
    .filter((t) => (platform === 'all' || t.platform === platform) && (!gaya || t.gaya === gaya) && (!kategori || t.kategori === kategori))
    .map((t) => ({ t, n: q ? skor(t, q) : 1 }))
    .filter((x) => x.n > 0);
  const items = (q ? hasil.sort((a, b) => b.n - a.n) : hasil).map((x) => x.t);
  const shown = batas ? items.slice(0, batas) : items;
  // Tautan "Lihat semua" membawa filter yang sedang dipakai ke halaman perpustakaan.
  const qs = new URLSearchParams(
    Object.entries({ platform: platform === 'all' ? '' : platform, gaya, kategori, q: query.trim() }).filter(([, v]) => v),
  ).toString();
  const reset = () => {
    setQuery('');
    setPlatform('all');
    setGaya('');
    setKategori('');
  };

  return (
    <>
      <div className="lib-bar">
        <div className="seg" role="group" aria-label="Platform">
          {FILTERS.map(([k, label]) => (
            <button type="button" key={k} aria-pressed={platform === k} onClick={() => setPlatform(k)}>
              {label}
            </button>
          ))}
        </div>
        <select id="lib-gaya" aria-label="Gaya desain" value={gaya} onChange={(ev) => setGaya(ev.target.value)}>
          <option value="">Semua gaya</option>
          {Object.entries(GAYA).map(([k, g]) => (
            <option key={k} value={k}>
              {g.pendek} ({perGaya[k] || 0})
            </option>
          ))}
        </select>
        <select id="lib-kategori" aria-label="Kategori" value={kategori} onChange={(ev) => setKategori(ev.target.value)}>
          <option value="">Semua kategori</option>
          {KATEGORI_LIST.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <input
          type="text"
          id="lib-cari"
          placeholder="Cari PRD, jenis usaha, atau peran, misalnya kafe, sekolah, kurir"
          aria-label="Cari PRD"
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
        />
        <span className="lib-count" role="status">
          {items.length} dari {all.length} PRD
        </span>
      </div>
      {items.length === 0 ? (
        <div className="empty">
          <p>Tidak ada PRD yang cocok. Coba kata lain, atau ganti platform, gaya, dan kategori.</p>
          <button type="button" className="btn quiet" onClick={reset}>
            Tampilkan semua
          </button>
        </div>
      ) : (
        <div className="tpl-grid">
          {shown.map((t, i) => (
            <Link className={'tpl is-' + t.platform} key={t.id} to={'/perpustakaan/' + t.id} data-reveal="up" data-reveal-delay={i % 4}>
              <MockThumb state={t.state} lazy={!batas} />
              <span className="tpl-body">
                <span className="tpl-name">{t.name}</span>
                <span className="tpl-desc">{t.summary}</span>
                {t.cocok.length > 0 && (
                  <span className="tpl-fit">
                    <b>Cocok untuk</b> {t.cocok.slice(0, 2).join(' · ')}
                  </span>
                )}
                <span className="tpl-tags">
                  <span className="tag tag-pf">
                    {t.platform === 'mobile' ? Icon.phone : Icon.web}
                    {PLATFORM[t.platform]}
                  </span>
                  <span className="tag tag-peran" title={'Peran: ' + t.peran.join(', ')}>
                    {t.peran.length} peran
                  </span>
                  <span className="tag tag-gaya" title={'Gaya ' + GAYA[t.gaya].nama.toLowerCase()}>
                    <GayaSwatch gaya={t.gaya} />
                    {GAYA[t.gaya].pendek}
                  </span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
      {batas > 0 && items.length > shown.length && (
        <div className="lib-more">
          <span>
            Menampilkan {shown.length} dari {items.length} PRD{items.length < all.length ? ' yang cocok' : ''}.
          </span>
          <Link className="btn quiet" to={'/perpustakaan' + (qs ? '?' + qs : '')}>
            {items.length < all.length ? `Lihat semua ${items.length} PRD yang cocok` : `Lihat semua ${all.length} PRD`}
          </Link>
        </div>
      )}
    </>
  );
}
