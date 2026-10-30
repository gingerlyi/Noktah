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
    <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start gap-7 max-lg:grid-cols-1">
      <div className="flex min-w-0 flex-col gap-3.5">
        <div
          className="seg max-w-full flex-wrap self-start [&_.ico]:size-3.75 [&>button]:inline-flex [&>button]:items-center [&>button]:gap-1.5"
          role="group"
          aria-label="Contoh PRD"
        >
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
        <div className="flex flex-wrap gap-2" role="group" aria-label={'Peran di ' + s.nama}>
          {roles.map((r, i) => (
            <button
              type="button"
              key={r.id}
              className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 font-body text-[.92rem]/[1.2] font-semibold text-ink hover:border-accent aria-pressed:border-transparent aria-pressed:bg-(--grad) aria-pressed:text-on-accent"
              aria-pressed={r.id === role.id}
              onClick={() => setRi(i)}
            >
              {r.n}
            </button>
          ))}
        </div>
        <div
          className="flex flex-col gap-2.5 rounded-[18px] border border-line bg-surface p-5 motion-safe:animate-[rs-in_.35s_var(--ease-out)]"
          key={id + role.id}
        >
          <b className="font-display text-[1.35rem]/[1.2] font-extrabold">{role.n}</b>
          <span className="-mt-1.5 text-muted">{role.d}</span>
          <span className="font-mono text-[.8rem]/[1.4] font-semibold text-accent">Masuk: {role.m}</span>
          <ul className="m-0 flex list-none flex-col gap-1.75 p-0 [&_.ico]:mt-0.75 [&_.ico]:size-4 [&_.ico]:flex-none [&_.ico]:text-accent">
            {lines(role.b)
              .slice(0, 4)
              .map((x) => (
                <li key={x} className="flex items-start gap-2 text-[.94rem]/[1.45]">
                  {Icon.check}
                  {x}
                </li>
              ))}
          </ul>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 text-[.8rem] font-bold text-muted">{app ? 'Layar' : 'Halaman'}</span>
            {pages.map((p) => (
              <i key={p} className="rounded-full border border-line bg-field px-2.5 py-0.75 text-[.8rem] not-italic">
                {p}
              </i>
            ))}
          </div>
          <Link className="link" to={'/perpustakaan/' + id}>
            Baca PRD lengkapnya ({nFitur} kebutuhan untuk peran ini)
          </Link>
        </div>
      </div>
      <div className="flex min-w-0 justify-center rounded-[22px] border border-line bg-(--grad-soft) p-5.5" aria-hidden="true">
        <div
          className={
            'overflow-hidden bg-surface ' + (app ? 'w-75 max-w-full rounded-[36px] border-8 border-ink' : 'w-full rounded-[14px] border border-line')
          }
        >
          {!app && (
            <div className="flex items-center gap-1.5 border-b border-line px-3 py-2.25">
              {[0, 1, 2].map((k) => (
                <i key={k} className="size-2.25 rounded-full bg-line" />
              ))}
              <span className="ml-2 truncate font-mono text-[.76rem]/none text-muted">{url}</span>
            </div>
          )}
          <ScaledHTML className={'overflow-hidden ' + (app ? 'h-140' : 'h-110 max-lg:h-85')} html={html} base={app ? 390 : 1120} />
        </div>
      </div>
    </div>
  );
}
