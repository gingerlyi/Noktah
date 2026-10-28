// Halaman Pengguna (daftar) dan Peran (siapa boleh apa).
import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { ROLES, fmt, useApp, when } from '../../lib/app.jsx';
import { Avatar, Loading } from '../../components/ui.jsx';
import { PeopleTable } from './Dashboard.jsx';

function useUsers() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let on = true;
    api
      .get('/admin/users')
      .then((d) => on && setUsers(d.items))
      .catch((err) => on && setError(err.message));
    return () => {
      on = false;
    };
  }, []);
  return { users, setUsers, error };
}

const tanggal = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export function Users() {
  const { users, setUsers, error } = useUsers();
  const { toast } = useApp();
  // Aktivasi manual setelah pembayaran diterima: tambah 30 atau 365 hari, atau cabut (0).
  const setPremium = async (target, days) => {
    try {
      const d = await api.put('/admin/users/' + target.id + '/premium', { days });
      setUsers((list) => list.map((u) => (u.id === target.id ? { ...u, premiumUntil: d.user.premiumUntil } : u)));
      toast(days ? `Premium ${target.name} aktif sampai ${tanggal(d.user.premiumUntil)}.` : `Premium ${target.name} dicabut.`);
    } catch (err) {
      toast(err.message);
    }
  };
  const paket = {
    head: 'Paket',
    cell: (u) => {
      if (u.role !== 'user') return <span className="hint">Staf (semua fitur)</span>;
      const aktif = u.premiumUntil && new Date(u.premiumUntil) > new Date();
      return (
        <span className="row plan-cell">
          <span>{aktif ? 'Premium s/d ' + tanggal(u.premiumUntil) : 'Gratis'}</span>
          <button type="button" className="link" onClick={() => setPremium(u, 30)}>
            +30 hari
          </button>
          <button type="button" className="link" onClick={() => setPremium(u, 365)}>
            +1 tahun
          </button>
          {aktif && (
            <button type="button" className="link danger" onClick={() => setPremium(u, 0)}>
              Cabut
            </button>
          )}
        </span>
      );
    },
  };
  return (
    <>
      <div className="view-head">
        <div>
          <h1>Pengguna</h1>
          <p>Semua akun yang terdaftar. Isi PRD mereka tidak bisa dibuka dari sini.</p>
        </div>
      </div>
      <div className="sheet adm">
        {error ? (
          <p className="form-err">{error}</p>
        ) : users === null ? (
          <Loading />
        ) : (
          <>
            <span className="hint">{fmt(users.length)} akun, yang terakhir aktif di atas.</span>
            <PeopleTable rows={users.map((u) => ({ ...u, roleName: ROLES[u.role]?.nama || u.role }))} showRole extra={paket} />
          </>
        )}
      </div>
    </>
  );
}

// Hak di dashboard admin, juga dipakai tabel di Panduan admin.
export const PERMS = [
  ['dash', 'Lihat dashboard'],
  ['tpl', 'Kelola perpustakaan'],
  ['site', 'Ubah teks landing page'],
  ['users', 'Lihat daftar pengguna'],
  ['roles', 'Atur peran'],
];
export const ADMIN_ROLES = ['pemilik', 'admin', 'konten', 'analis'];
const ASSIGNABLE = ['user', 'analis', 'konten', 'admin'];

export function Roles() {
  const { user, toast } = useApp();
  const { users, setUsers, error } = useUsers();

  const setRole = async (target, role) => {
    try {
      const d = await api.put('/admin/users/' + target.id + '/role', { role });
      setUsers((list) => list.map((u) => (u.id === target.id ? { ...u, role: d.user.role } : u)));
      toast(`Peran ${target.name} diubah menjadi ${ROLES[role].nama}.`);
    } catch (err) {
      toast(err.message);
    }
  };

  return (
    <>
      <div className="view-head">
        <div>
          <h1>Peran</h1>
          <p>Siapa boleh melakukan apa di dashboard ini.</p>
        </div>
      </div>
      <div className="sheet adm">
        <h2>Hak tiap peran</h2>
        <div className="utbl">
          <table>
            <thead>
              <tr>
                <th>Hak</th>
                {ADMIN_ROLES.map((r) => (
                  <th key={r}>{ROLES[r].nama}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMS.map(([k, label]) => (
                <tr key={k}>
                  <td>{label}</td>
                  {ADMIN_ROLES.map((r) => (
                    <td key={r}>{ROLES[r].can.includes(k) ? 'Ya' : '–'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="sheet adm">
        <h2>Atur peran</h2>
        <span className="hint">Peran "Pengguna" berarti akun biasa tanpa akses ke dashboard admin. Perubahan langsung berlaku.</span>
        {error ? (
          <p className="form-err">{error}</p>
        ) : users === null ? (
          <Loading />
        ) : (
          <div className="utbl">
            <table>
              <thead>
                <tr>
                  <th>Orang</th>
                  <th>Peran</th>
                  <th>Terakhir aktif</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const fixed = u.role === 'pemilik' || u.id === user.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <span className="u">
                          <Avatar name={u.name} size={28} />
                          <span>
                            {u.name}
                            {u.id === user.id ? ' (kamu)' : ''}
                            <small className="u-mail">{u.email}</small>
                          </span>
                        </span>
                      </td>
                      <td>
                        {fixed ? (
                          ROLES[u.role]?.nama
                        ) : (
                          <select id={'role-' + u.id} aria-label={'Peran ' + u.name} value={u.role} onChange={(ev) => setRole(u, ev.target.value)}>
                            {ASSIGNABLE.map((r) => (
                              <option key={r} value={r}>
                                {ROLES[r].nama}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>{when(u.lastActiveAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
