// Design brief sebagai papan gaya: warna, huruf, komponen, bentuk, dan keadaan layar digambar dengan gaya PRD itu sendiri.
// Papan memakai kelas maket (.mock, .m-btn, .m-card, ...) sehingga tiap gaya tampil dengan bayangan, sudut, dan hurufnya.
import { T } from '../lib/catalog.js';
import { gayaProps } from '../lib/mock.js';
import { briefDesain, halamanPeran, kontras, peranAktif, rasio, skalaHuruf, statusPrd } from '../lib/prd.js';

const lulus = (k) => (k >= 4.5 ? 'AA' : k >= 3 ? 'AA teks besar' : 'Kurang');

export function DesignBrief({ state, actions, className = '' }) {
  const t = T[state.tpl];
  const b = briefDesain(state);
  const g = b.g;
  const gp = gayaProps(state);
  const mobile = t.platform === 'mobile';
  const status = statusPrd(state);
  const roles = peranAktif(state);
  const hal = roles[0] ? halamanPeran(state, roles[0].id).map((h) => h.n) : [];
  const cta = state.cta || 'Mulai';
  const latarTeks = kontras(g.teks, g.latar);
  const warna = [
    ['Merek', state.warna, `Tombol utama, teks ${b.diAtas.nama} ${rasio(b.diAtas.k)}`, b.diAtas.k],
    ['Latar', g.latar, `Teks di atasnya ${rasio(latarTeks)}`, latarTeks],
    ['Teks', g.teks, `Judul dan isi. Merek sebagai teks ${rasio(b.teks)}`, null],
  ];
  const contoh = {
    'judul halaman': state.tagline,
    'judul layar': state.tagline,
    'judul bagian': hal[0],
    subjudul: hal[1],
    isi: state.deskripsi,
    keterangan: 'Diperbarui 2 menit lalu',
  };

  return (
    <div className={'mock db ' + className} {...gp.data} style={gp.style}>
      <header className="m-hero-mid db-hero">
        <p className="m-eyebrow">Design brief · {g.nama}</p>
        <h2 className="m-h1">{state.nama}</h2>
        <p className="m-lead">{b.kesan || g.ciri}</p>
        <div className="m-row">
          <span className="m-btn">{cta}</span>
          <span className="m-btn ghost">Pelajari dulu</span>
        </div>
        {actions && <div className="db-actions">{actions}</div>}
      </header>

      <section className="db-sec">
        <h3 className="db-h">
          <i>01</i>Warna
        </h3>
        <div className="db-pal">
          {warna.map(([n, hex, ket, k]) => (
            <div className="m-card db-sw" key={n}>
              <span className="db-chip" style={{ '--c': hex }}>
                {k != null && <em className={k >= 4.5 ? 'ok' : ''}>{lulus(k)}</em>}
              </span>
              <b>{n}</b>
              <code>{hex}</code>
              <small>{ket}</small>
            </div>
          ))}
        </div>
        {b.teks < 4.5 && (
          <p className="db-note">
            Warna merek kurang kontras sebagai teks di latar ini, jadi tautan memakai versi yang lebih {b.latarGelap ? 'terang' : 'gelap'}.
          </p>
        )}
      </section>

      <section className="db-sec">
        <h3 className="db-h">
          <i>02</i>Huruf
        </h3>
        <p className="db-note">{g.huruf}</p>
        <div className="db-type">
          {skalaHuruf(state).map(([n, px], i) => (
            <div key={n}>
              <small>
                {n} · {px} px
              </small>
              <span
                className={i < 2 ? 'db-disp' : ''}
                style={{
                  fontSize: `min(${px}px, ${(px / 9).toFixed(1)}cqi + 12px)`,
                }}
              >
                {contoh[n] || state.nama}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="db-sec">
        <h3 className="db-h">
          <i>03</i>Komponen
        </h3>
        <div className="db-comp">
          <div className="m-card db-form">
            <b>Tombol</b>
            <div className="m-row">
              <span className="m-btn">{cta}</span>
              <span className="m-btn ghost">Batal</span>
            </div>
            <b>Kolom isian</b>
            <label>
              <small>Nama lengkap</small>
              <span className="m-input db-focus">Rina Wulandari</span>
            </label>
            <label>
              <small>Nomor WhatsApp</small>
              <span className="m-input db-err">0812</span>
              <small className="db-errtxt">Nomor terlalu pendek, minimal 10 angka.</small>
            </label>
          </div>
          <div className="db-stack">
            <div className="m-card">
              <b>Navigasi {mobile ? 'bawah' : 'atas'}</b>
              <div className="db-nav">
                {hal.slice(0, 4).map((h, i) => (
                  <span key={h} className={i ? '' : 'on'}>
                    {h}
                  </span>
                ))}
              </div>
            </div>
            {status.length > 0 && (
              <div className="m-card">
                <b>Label status</b>
                <ul className="db-st">
                  {status.map((x) =>
                    x.label.map((l) => (
                      <li key={l} style={{ '--st': b.latarGelap ? x.gelap : x.terang }} title={x.arti}>
                        {l}
                      </li>
                    )),
                  )}
                </ul>
              </div>
            )}
            <div className="m-card db-shape">
              <b>Bentuk</b>
              <div>
                <span style={{ borderRadius: g.sudut }}>
                  <i>Sudut</i>
                  {g.sudut} px
                </span>
                <span style={{ borderRadius: g.kapsul ? 999 : g.sudut }}>
                  <i>Tombol</i>
                  {g.kapsul ? 'kapsul' : g.sudut + ' px'}
                </span>
                <span className="db-gap">
                  <i>Jarak</i>
                  {mobile ? 24 : g.jarak} px
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="db-sec">
        <h3 className="db-h">
          <i>04</i>Keadaan layar
        </h3>
        <div className="db-states">
          <div className="m-card">
            <small>Kosong</small>
            <span className="db-empty" />
            <b>Belum ada data</b>
            <p>Satu kalimat yang menjelaskan mengapa masih kosong, lalu tombol untuk memulai.</p>
            <span className="m-btn">{cta}</span>
          </div>
          <div className="m-card">
            <small>Memuat</small>
            <span className="db-skel" />
            <span className="db-skel" style={{ width: '70%' }} />
            <span className="db-skel" style={{ width: '45%' }} />
          </div>
          <div className="m-card">
            <small>Galat</small>
            <b>Gagal memuat data</b>
            <p>Periksa koneksi, lalu coba lagi. Isian kamu tidak hilang.</p>
            <span className="m-btn ghost">Coba lagi</span>
          </div>
        </div>
      </section>

      <section className="db-sec">
        <h3 className="db-h">
          <i>05</i>Arahan
        </h3>
        <div className="db-rules">
          <div className="m-card db-do">
            <b>Gambar dan ikon</b>
            <p>{g.gambar}</p>
          </div>
          <div className="m-card db-dont">
            <b>Hindari</b>
            <p>{g.hindari}</p>
          </div>
          <div className="m-card">
            <b>Nada bahasa</b>
            <p>{g.nada} Antarmuka berbahasa Indonesia dengan kata kerja yang jelas di tombol.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
