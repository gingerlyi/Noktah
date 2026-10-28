// Halaman masuk dan daftar untuk pengguna.
import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { DEMO, safeNext, useApp } from '../lib/app.jsx';
import { Loading } from '../components/ui.jsx';

export default function Auth({ mode }) {
  const { user, setUser, pub } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get('next'), '/dashboard');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const register = mode === 'register';
  const set = (k) => (ev) => setForm((f) => ({ ...f, [k]: ev.target.value }));
  const other = (path) => path + (params.get('next') ? '?next=' + encodeURIComponent(next) : '');

  if (user === undefined) return <Loading text="Memeriksa akun…" />;
  if (user) return <Navigate to={next} replace />;

  const submit = async (ev) => {
    ev.preventDefault();
    setError('');
    setBusy(true);
    try {
      const d = await api.post(register ? '/auth/register' : '/auth/login', register ? form : { email: form.email, password: form.password });
      setUser(d.user);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const closed = register && pub.loaded && !pub.features.register;
  return (
    <main className="login">
      <div className="sheet login-card">
        <h1>{register ? 'Buat akun' : 'Masuk'}</h1>
        <p className="hint">
          {register ? 'Akun dipakai untuk menyimpan PRD-mu supaya bisa dibuka lagi kapan saja.' : 'Masuk untuk membuka dan melanjutkan PRD-mu.'}
        </p>
        {closed ? (
          <p className="form-err">Pendaftaran akun baru sedang ditutup.</p>
        ) : (
          <form className="form" onSubmit={submit}>
            {register && (
              <div className="fld">
                <label htmlFor="au-name">Nama</label>
                <input id="au-name" type="text" autoComplete="name" required maxLength={80} value={form.name} onChange={set('name')} />
              </div>
            )}
            <div className="fld">
              <label htmlFor="au-email">Email</label>
              <input id="au-email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
            </div>
            {DEMO ? (
              <p className="hint">Di pratinjau ini tidak ada kata sandi, dan akunmu hanya tersimpan di peramban ini.</p>
            ) : (
              <div className="fld">
                <label htmlFor="au-pass">
                  Kata sandi {register && <span className="hint">minimal 8 karakter</span>}
                </label>
                <input
                  id="au-pass"
                  type="password"
                  autoComplete={register ? 'new-password' : 'current-password'}
                  required
                  minLength={register ? 8 : undefined}
                  value={form.password}
                  onChange={set('password')}
                />
              </div>
            )}
            {error && (
              <p className="form-err" role="alert">
                {error}
              </p>
            )}
            <button className="btn big" type="submit" disabled={busy}>
              {busy ? 'Memproses…' : register ? 'Daftar' : 'Masuk'}
            </button>
          </form>
        )}
        <p className="hint">
          {register ? (
            <>
              Sudah punya akun? <Link to={other('/masuk')}>Masuk</Link>
            </>
          ) : (
            <>
              Belum punya akun? <Link to={other('/daftar')}>Daftar</Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
