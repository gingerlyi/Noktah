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
      <div className="pt-5 pl-8.5">
        <div className="relative h-47.5">
          <div>
            {[top, step, 0].map((v, i) => (
              <span key={v} className="absolute inset-x-0 h-0 border-t border-line" style={{ top: i * 50 + '%' }}>
                <b className="absolute right-[calc(100%+8px)] -top-[.5em] font-body text-[.76rem]/none font-medium text-muted tabular-nums">{fmt(v)}</b>
              </span>
            ))}
          </div>
          <div className="absolute inset-0 flex" onPointerLeave={() => setTip(-1)}>
            {days.map((d, i) => {
              const h = (d.count / top) * 100;
              return (
                <div
                  className="relative min-w-0 flex-1 rounded-t-sm hover:bg-[color-mix(in_srgb,var(--chart)_10%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--chart)_10%,transparent)] focus-visible:-outline-offset-2"
                  key={d.date}
                  tabIndex={0}
                  aria-label={`${dayLabel(d.date)}: ${fmt(d.count)} PRD`}
                  onPointerEnter={() => setTip(i)}
                  onFocus={() => setTip(i)}
                  onBlur={() => setTip(-1)}
                >
                  <i className="absolute bottom-0 left-1/2 w-[min(24px,calc(100%-2px))] -translate-x-1/2 rounded-t-sm bg-(--grad-v)" style={{ height: h + '%' }} />
                  {i === labelAt && tip !== i && (
                    <em className="absolute left-1/2 -translate-x-1/2 -translate-y-1 font-body text-[.78rem]/none font-bold text-ink not-italic" style={{ bottom: h + '%' }}>
                      {fmt(d.count)}
                    </em>
                  )}
                </div>
              );
            })}
          </div>
          {tip >= 0 && (
            <div
              className="pointer-events-none absolute z-2 -translate-x-1/2 -translate-y-full rounded-[7px] border border-line bg-surface px-2.5 py-1.5 text-[.82rem] whitespace-nowrap text-ink"
              style={{
                left: `clamp(48px, ${((tip + 0.5) / days.length) * 100}%, calc(100% - 48px))`,
                top: `calc(${100 - (days[tip].count / top) * 100}% - 8px)`,
              }}
            >
              {dayLabel(days[tip].date)}: {fmt(days[tip].count)} PRD
            </div>
          )}
        </div>
        <div className="mt-1.5 flex" aria-hidden="true">
          {days.map((d) => (
            <span key={d.date} className="flex-1 text-center font-body text-[.74rem]/[1.2] font-medium text-muted tabular-nums">
              {Number(d.date.slice(8))}
            </span>
          ))}
        </div>
      </div>
      <details className="mt-3 text-[.9rem]">
        <summary className="cursor-pointer font-semibold text-accent">Lihat sebagai tabel</summary>
        <div className="utbl mt-2">
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
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start gap-5.5 max-lg:grid-cols-1">
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
                <div
                  className="grid grid-cols-[minmax(0,10.5em)_minmax(0,1fr)_auto] items-center gap-2.5 py-2 text-[.92rem] max-md:grid-cols-[minmax(0,7.5em)_minmax(0,1fr)_auto]"
                  key={t.key}
                >
                  <span className="truncate">{tplName(t.key)}</span>
                  <span>
                    <i className="block h-2.5 min-w-0.5 rounded-r-sm bg-(--grad)" style={{ width: (t.count / topCount) * 100 + '%' }} />
                  </span>
                  <span className="font-bold tabular-nums">{fmt(t.count)}</span>
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
