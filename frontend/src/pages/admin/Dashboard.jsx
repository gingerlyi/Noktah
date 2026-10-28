import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { fmt, useApp, when } from '../../lib/app.jsx';
import { T, TPL_IDS } from '../../lib/catalog.js';
import { Avatar, Loading } from '../../components/ui.jsx';

const dayLabel = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

function DayChart({ days }) {
  const [tip, setTip] = useState(-1);
  const max = Math.max(...days.map((d) => d.count));
  const sum = days.reduce((a, d) => a + d.count, 0);
  if (!sum) {
    return <p className="hint">Belum ada PRD yang dibuat dalam 14 hari terakhir. Grafik terisi setelah pengguna membuat PRD.</p>;
  }
  // Sumbu memakai angka bulat: 1, 2, 5, 10, dst.
  const half = Math.ceil(max / 2);
  const pow = Math.pow(10, Math.floor(Math.log10(half)));
  const step = [1, 2, 5, 10].find((f) => half <= f * pow) * pow;
  const top = step * 2;
  const labelAt = days.findIndex((d) => d.count === max);
  return (
    <>
      <div className="chart">
        <div className="c-plot">
          <div className="c-grid">
            {[top, step, 0].map((v, i) => (
              <span key={v} style={{ top: i * 50 + '%' }}>
                <b>{fmt(v)}</b>
              </span>
            ))}
          </div>
          <div className="c-cols" onPointerLeave={() => setTip(-1)}>
            {days.map((d, i) => {
              const h = (d.count / top) * 100;
              return (
                <div
                  className="c-col"
                  key={d.date}
                  tabIndex={0}
                  aria-label={`${dayLabel(d.date)}: ${fmt(d.count)} PRD`}
                  onPointerEnter={() => setTip(i)}
                  onFocus={() => setTip(i)}
                  onBlur={() => setTip(-1)}
                >
                  <i style={{ height: h + '%' }} />
                  {i === labelAt && tip !== i && <em style={{ bottom: h + '%' }}>{fmt(d.count)}</em>}
                </div>
              );
            })}
          </div>
          {tip >= 0 && (
            <div
              className="c-tip"
              style={{
                left: `clamp(48px, ${((tip + 0.5) / days.length) * 100}%, calc(100% - 48px))`,
                top: `calc(${100 - (days[tip].count / top) * 100}% - 8px)`,
              }}
            >
              {dayLabel(days[tip].date)}: {fmt(days[tip].count)} PRD
            </div>
          )}
        </div>
        <div className="c-x" aria-hidden="true">
          {days.map((d) => (
            <span key={d.date}>{Number(d.date.slice(8))}</span>
          ))}
        </div>
      </div>
      <details className="tv">
        <summary>Lihat sebagai tabel</summary>
        <div className="utbl">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>PRD dibuat</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.date}>
                  <td>{dayLabel(d.date)}</td>
                  <td>{fmt(d.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

export function PeopleTable({ rows, showRole = false, extra }) {
  return (
    <div className="utbl">
      <table>
        <thead>
          <tr>
            <th>Pengguna</th>
            {showRole && <th>Peran</th>}
            <th>Jumlah PRD</th>
            <th>Terakhir aktif</th>
            {extra && <th>{extra.head}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <span className="u">
                  <Avatar name={r.name} size={28} />
                  <span>
                    {r.name}
                    <small className="u-mail">{r.email}</small>
                  </span>
                </span>
              </td>
              {showRole && <td>{r.roleName}</td>}
              <td>{fmt(r.prds)}</td>
              <td>{when(r.lastActiveAt)}</td>
              {extra && <td>{extra.cell(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard() {
  const { pub } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let on = true;
    api
      .get('/admin/stats')
      .then((d) => on && setData(d))
      .catch((err) => on && setError(err.message));
    return () => {
      on = false;
    };
  }, []);

  const head = (
    <div className="view-head">
      <div>
        <h1>Dashboard</h1>
        <p>Ringkasan pemakaian Noktah.</p>
      </div>
    </div>
  );
  if (error) {
    return (
      <>
        {head}
        <div className="empty">
          <p>{error}</p>
        </div>
      </>
    );
  }
  if (!data) {
    return (
      <>
        {head}
        <Loading />
      </>
    );
  }

  const st = data.stats;
  const builtinShown = TPL_IDS.filter((id) => !data.hiddenBuiltin.includes(id)).length;
  const kpis = [
    ['Pengguna terdaftar', st.users, 'semua akun'],
    ['PRD tersimpan', st.prds, 'di semua akun'],
    ['Aktif 7 hari terakhir', st.active7, 'pengguna yang membuka Noktah'],
    ['PRD di perpustakaan', builtinShown + st.customShown, 'tampil, dari ' + (TPL_IDS.length + st.customTotal) + ' PRD'],
  ];
  const tplName = (key) => T[key]?.nama || pub.templates.find((t) => t.id === key)?.name || 'PRD buatan admin';
  const topCount = st.byTemplate.length ? st.byTemplate[0].count : 0;
  const days = st.perDay;

  return (
    <>
      {head}
      <div className="kpis">
        {kpis.map(([label, value, note]) => (
          <div className="kpi" key={label}>
            <span>{label}</span>
            <b>{fmt(value)}</b>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <div className="sheet adm">
          <h2>PRD dibuat, 14 hari terakhir</h2>
          {days.length > 0 && (
            <span className="hint">
              {dayLabel(days[0].date)} sampai {dayLabel(days[days.length - 1].date)} · {fmt(days.reduce((a, d) => a + d.count, 0))} PRD
            </span>
          )}
          <DayChart days={days} />
        </div>
        <div className="sheet adm">
          <h2>PRD perpustakaan terpopuler</h2>
          <span className="hint">Jumlah PRD pengguna yang diambil dari tiap PRD perpustakaan.</span>
          {st.byTemplate.length ? (
            <div>
              {st.byTemplate.map((t) => (
                <div className="hb" key={t.key}>
                  <span className="hb-l">{tplName(t.key)}</span>
                  <span className="hb-t">
                    <i style={{ width: (t.count / topCount) * 100 + '%' }} />
                  </span>
                  <span className="hb-v">{fmt(t.count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="hint">Belum ada PRD yang diambil dari perpustakaan.</p>
          )}
        </div>
      </div>
      {data.recent.length > 0 && (
        <div className="sheet adm">
          <h2>Aktivitas terbaru</h2>
          <PeopleTable rows={data.recent} />
        </div>
      )}
    </>
  );
}
