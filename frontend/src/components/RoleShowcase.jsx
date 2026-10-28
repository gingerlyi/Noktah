// Contoh "satu PRD, banyak peran" di landing page: pilih PRD contoh dan perannya, lalu lihat
// hak akses peran itu dan pratinjau dari sisinya (halaman website, panel admin, atau layar aplikasi).
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { T } from '../lib/catalog.js';
import { bentukPeran, mockHTML } from '../lib/mock.js';
import { fiturPeran, fromBuiltin, halamanPeran, lines, peranAktif, rid, slug } from '../lib/prd.js';
import { Icon, ScaledHTML } from './ui.jsx';

const CONTOH = ['klinik', 'm-ojek', 'marketplace'];

export default function RoleShowcase() {
  const items = useMemo(
    () =>
      CONTOH.filter((id) => T[id])
        .slice(0, 3)
        // Maket di sini selalu bergaya ukiran (hitam dan krem) supaya menyatu dengan latar situs, apa pun gaya PRD-nya.
        .map((id) => ({ id, s: { ...fromBuiltin(id), gaya: 'ukiran' } })),
    [],
  );
  const [pi, setPi] = useState(0);
  const [ri, setRi] = useState(0);
  const { id, s } = items[pi];
  const roles = peranAktif(s);
  const role = roles[Math.min(ri, roles.length - 1)];
  const app = bentukPeran(s, role.id) === 'app';
  const html = useMemo(() => mockHTML(s, false, role.id), [s, role.id]);
  const pages = halamanPeran(s, role.id).map((h) => h.n);
  const nFitur = fiturPeran(s, role.id).length;
  const url = slug(s) + (T[id].app ? '.app/' : '.id/') + (role.id === roles[0].id ? '' : rid(role.n));

  return (
    <div className="rs">
      <div className="rs-side">
        <div className="seg rs-prd" role="group" aria-label="Contoh PRD">
          {items.map((x, i) => (
            <button
              type="button"
              key={x.id}
              aria-pressed={i === pi}
              onClick={() => {
                setPi(i);
                setRi(0);
              }}
            >
              {T[x.id].platform === 'mobile' ? Icon.phone : Icon.web}
              {x.s.nama}
            </button>
          ))}
        </div>
        <div className="rs-roles" role="group" aria-label={'Peran di ' + s.nama}>
          {roles.map((r, i) => (
            <button type="button" key={r.id} aria-pressed={r.id === role.id} onClick={() => setRi(i)}>
              {r.n}
            </button>
          ))}
        </div>
        <div className="rs-card" key={id + role.id}>
          <b>{role.n}</b>
          <span className="rs-who">{role.d}</span>
          <span className="rs-in">Masuk: {role.m}</span>
          <ul className="rs-can">
            {lines(role.b)
              .slice(0, 4)
              .map((x) => (
                <li key={x}>
                  {Icon.check}
                  {x}
                </li>
              ))}
          </ul>
          <div className="rs-pages">
            <span>{app ? 'Layar' : 'Halaman'}</span>
            {pages.map((p) => (
              <i key={p}>{p}</i>
            ))}
          </div>
          <Link className="link" to={'/perpustakaan/' + id}>
            Baca PRD lengkapnya ({nFitur} kebutuhan untuk peran ini)
          </Link>
        </div>
      </div>
      <div className={'rs-stage' + (app ? ' is-app' : '')} aria-hidden="true">
        <div className="rs-frame">
          {!app && (
            <div className="rs-bar">
              <i />
              <i />
              <i />
              <span>{url}</span>
            </div>
          )}
          <ScaledHTML className="rs-view" html={html} base={app ? 390 : 1120} />
        </div>
      </div>
    </div>
  );
}
