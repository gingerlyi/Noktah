// Pengganti api.js untuk mode pratinjau ("npm run build:demo").
// Tidak ada server: semua data disimpan di peramban (localStorage) dan diisi data contoh.
// Kata sandi tidak diminta, tidak diperiksa, dan tidak disimpan. Jangan dipakai untuk data sungguhan.
import { T } from './catalog.js';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const KEY = 'rprd-demo-v1';
const DAY = 864e5;
const PERMS = {
  pemilik: ['dash', 'tpl', 'site', 'users', 'roles'],
  admin: ['dash', 'tpl', 'site', 'users'],
  konten: ['dash', 'tpl', 'site'],
  analis: ['dash'],
  user: [],
};
const iso = (t) => new Date(t).toISOString();
const newId = () =>
  globalThis.crypto?.randomUUID?.() || 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
const copy = (v) => JSON.parse(JSON.stringify(v));
const dayKey = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Data contoh: lima akun, beberapa PRD milik mereka, dan riwayat pembuatan PRD 14 hari terakhir.
function seed() {
  const now = Date.now();
  const user = (id, name, role, activeAgo) => ({
    id,
    name,
    email: id.slice(2) + '@demo.id',
    role,
    createdAt: iso(now - 40 * DAY),
    lastActiveAt: iso(now - activeAgo),
  });
  const users = [
    user('u-pemilik', 'Pemilik Demo', 'pemilik', 0),
    user('u-budi', 'Budi Santoso', 'konten', 2 * 36e5),
    user('u-sari', 'Sari Dewi', 'user', DAY),
    user('u-agus', 'Agus Pratama', 'analis', 3 * DAY),
    user('u-dian', 'Dian Lestari', 'user', 9 * DAY),
  ];
  const picks = [
    ['u-budi', 'marketplace'], ['u-budi', 'm-toko'], ['u-sari', 'klinik'], ['u-sari', 'marketplace'], ['u-sari', 'm-keuangan'],
    ['u-agus', 'dashboard'], ['u-dian', 'm-ojek'], ['u-dian', 'm-belajar'], ['u-dian', 'marketplace'],
  ];
  const prds = picks.map(([userId, key], i) => ({
    id: newId(),
    userId,
    name: T[key].d.nama,
    templateKey: key,
    state: null, // PRD milik akun contoh lain tidak pernah dibuka, jadi isinya tidak disimpan
    createdAt: iso(now - (i + 1) * DAY),
    updatedAt: iso(now - (i + 1) * DAY),
  }));
  const events = [];
  [0, 1, 0, 2, 1, 0, 3, 1, 2, 0, 1, 4, 2, 1].forEach((n, i) => {
    for (let k = 0; k < n; k++) events.push(now - (13 - i) * DAY);
  });
  return { users, session: null, prds, templates: [], site: { title: '', subtitle: '', hiddenBuiltin: [] }, events };
}

let db = null;
function load() {
  if (db) return db;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.prds)) {
        db = parsed;
        return db;
      }
    }
  } catch {
    /* penyimpanan diblokir atau rusak: mulai dari data contoh */
  }
  db = seed();
  persist();
  return db;
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* tetap berjalan di memori untuk kunjungan ini */
  }
}

// Menghapus semua perubahan dan kembali ke data contoh.
export function resetDemo() {
  db = seed();
  persist();
}

// Di pratinjau tanpa server semua akun Premium, supaya semua fitur bisa dicoba.
const view = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, perms: PERMS[u.role] || [], premium: true, premiumUntil: null });
const prdView = (p) => ({ id: p.id, name: p.name, templateKey: p.templateKey, state: p.state, createdAt: p.createdAt, updatedAt: p.updatedAt });
const fail = (status, code, message) => {
  throw new ApiError(status, code, message);
};

function handle(method, path, body) {
  const d = load();
  const me = d.users.find((u) => u.id === d.session) || null;
  const need = () => me || fail(401, 'unauthorized', 'Kamu belum masuk.');
  const perm = (p) => (PERMS[need().role].includes(p) ? me : fail(403, 'forbidden', 'Peranmu tidak punya hak untuk ini.'));
  const stateOf = () => {
    const s = body?.state;
    if (!s || typeof s !== 'object' || !T[s.tpl]) fail(400, 'invalid', 'Isi PRD tidak valid.');
    return { state: s, name: String(s.nama || '').trim().slice(0, 200), key: typeof s.asal === 'string' && s.asal ? s.asal : s.tpl };
  };
  const route = method + ' ' + path;
  let m;

  if (route === 'GET /public') {
    return { site: d.site, templates: d.templates.filter((t) => !t.hidden), features: { register: true } };
  }
  if (route === 'GET /auth/me') return { user: me ? view(me) : null };
  if (route === 'POST /auth/logout') {
    d.session = null;
    return { ok: true };
  }
  if (route === 'POST /auth/login') {
    const email = String(body?.email || '').trim().toLowerCase();
    const u = d.users.find((x) => x.email === email);
    if (!u) fail(401, 'bad_credentials', 'Email ini belum terdaftar di pratinjau. Coba pemilik@demo.id, atau daftar dulu.');
    d.session = u.id;
    u.lastActiveAt = iso(Date.now());
    return { user: view(u) };
  }
  if (route === 'POST /auth/register') {
    const name = String(body?.name || '').trim().slice(0, 80);
    const email = String(body?.email || '').trim().toLowerCase();
    if (!name) fail(400, 'invalid', 'Nama belum diisi.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'invalid', 'Alamat email tidak valid.');
    if (d.users.some((x) => x.email === email)) fail(409, 'email_taken', 'Email ini sudah terdaftar. Silakan masuk.');
    const u = { id: newId(), name, email, role: 'user', createdAt: iso(Date.now()), lastActiveAt: iso(Date.now()) };
    d.users.push(u);
    d.session = u.id;
    return { user: view(u) };
  }

  // Pratinjau tanpa server tidak punya tautan bagikan.
  if (method === 'GET' && /^\/prds\/[\w-]+\/share$/.test(path)) return { token: '', comments: [] };
  if (/^\/prds\/[\w-]+\/share$/.test(path)) fail(400, 'demo', 'Tautan bagikan hanya tersedia di versi dengan server.');
  // Pratinjau tanpa server tidak menyimpan riwayat versi.
  if (method === 'GET' && /^\/prds\/[\w-]+\/versions$/.test(path)) return { items: [] };
  if (route === 'GET /prds') {
    const mine = d.prds.filter((p) => p.userId === need().id && p.state);
    return { items: mine.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).map(prdView) };
  }
  if (route === 'POST /prds') {
    const u = need();
    const { state, name, key } = stateOf();
    const now = iso(Date.now());
    const p = { id: newId(), userId: u.id, name, templateKey: key, state, createdAt: now, updatedAt: now };
    d.prds.push(p);
    d.events.push(Date.now());
    u.lastActiveAt = now;
    return prdView(p);
  }
  if ((m = path.match(/^\/prds\/([\w-]+)$/))) {
    const i = d.prds.findIndex((p) => p.id === m[1] && p.userId === need().id && p.state);
    if (i < 0) fail(404, 'not_found', 'PRD tidak ditemukan.');
    if (method === 'GET') return prdView(d.prds[i]);
    if (method === 'DELETE') {
      d.prds.splice(i, 1);
      return { ok: true };
    }
    if (method === 'PUT') {
      const { state, name, key } = stateOf();
      Object.assign(d.prds[i], { state, name, templateKey: key, updatedAt: iso(Date.now()) });
      return prdView(d.prds[i]);
    }
  }

  if (route === 'GET /admin/stats') {
    const u = perm('dash');
    const now = Date.now();
    const perDay = [];
    for (let i = 13; i >= 0; i--) {
      const key = dayKey(now - i * DAY);
      perDay.push({ date: key, count: d.events.filter((t) => dayKey(t) === key).length });
    }
    const counts = {};
    d.prds.forEach((p) => {
      counts[p.templateKey] = (counts[p.templateKey] || 0) + 1;
    });
    const byTemplate = Object.entries(counts).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count).slice(0, 6);
    return {
      stats: {
        users: d.users.length,
        prds: d.prds.length,
        active7: d.users.filter((x) => Date.parse(x.lastActiveAt) >= now - 7 * DAY).length,
        perDay,
        byTemplate,
        customTotal: d.templates.length,
        customShown: d.templates.filter((t) => !t.hidden).length,
      },
      hiddenBuiltin: d.site.hiddenBuiltin,
      recent: PERMS[u.role].includes('users') ? userRows(d).slice(0, 5) : [],
    };
  }
  if (route === 'GET /admin/templates') {
    perm('tpl');
    return { items: d.templates };
  }
  if (route === 'POST /admin/templates') {
    perm('tpl');
    const { state } = stateOf();
    const name = String(body?.name || '').trim().slice(0, 60);
    if (!name || !T[body?.base]) fail(400, 'invalid', 'Isi PRD perpustakaan tidak valid.');
    const t = { id: newId(), name, summary: String(body?.summary || '').slice(0, 200), base: body.base, hidden: true, state, updatedAt: iso(Date.now()) };
    d.templates.push(t);
    return t;
  }
  if ((m = path.match(/^\/admin\/templates\/([\w-]+)$/))) {
    perm('tpl');
    const i = d.templates.findIndex((t) => t.id === m[1]);
    if (i < 0) fail(404, 'not_found', 'PRD tidak ditemukan.');
    if (method === 'DELETE') {
      d.templates.splice(i, 1);
      return { ok: true };
    }
    if (method === 'PUT') {
      const { state } = stateOf();
      const name = String(body?.name || '').trim().slice(0, 60);
      if (!name) fail(400, 'invalid', 'Isi PRD perpustakaan tidak valid.');
      Object.assign(d.templates[i], { name, summary: String(body?.summary || '').slice(0, 200), hidden: !!body?.hidden, state, updatedAt: iso(Date.now()) });
      return d.templates[i];
    }
  }
  if (route === 'PUT /admin/builtin-templates') {
    perm('tpl');
    d.site.hiddenBuiltin = [...new Set((body?.hiddenBuiltin || []).filter((k) => T[k]))];
    return { hiddenBuiltin: d.site.hiddenBuiltin };
  }
  if (route === 'PUT /admin/site') {
    perm('site');
    d.site.title = String(body?.title || '').trim().slice(0, 120);
    d.site.subtitle = String(body?.subtitle || '').trim().slice(0, 300);
    return { title: d.site.title, subtitle: d.site.subtitle };
  }
  if (route === 'GET /admin/users') {
    perm('users');
    return { items: userRows(d) };
  }
  if (method === 'PUT' && (m = path.match(/^\/admin\/users\/([\w-]+)\/premium$/))) {
    perm('users');
    const target = d.users.find((x) => x.id === m[1]) || fail(404, 'not_found', 'Pengguna tidak ditemukan.');
    const days = Number(body?.days) || 0;
    const dari = Math.max(Date.now(), Date.parse(target.premiumUntil || 0) || 0);
    target.premiumUntil = days ? iso(dari + days * 864e5) : null;
    return { user: { ...view(target), premiumUntil: target.premiumUntil } };
  }
  if (method === 'PUT' && (m = path.match(/^\/admin\/users\/([\w-]+)\/role$/))) {
    const u = perm('roles');
    if (!['user', 'analis', 'konten', 'admin'].includes(body?.role)) fail(400, 'invalid', 'Peran tidak dikenal.');
    if (m[1] === u.id) fail(400, 'invalid', 'Kamu tidak bisa mengubah peranmu sendiri.');
    const target = d.users.find((x) => x.id === m[1] && x.role !== 'pemilik');
    if (!target) fail(404, 'not_found', 'Pengguna tidak ditemukan, atau dia pemilik.');
    target.role = body.role;
    return { user: view(target) };
  }
  return fail(404, 'not_found', 'Alamat API tidak ditemukan.');
}

function userRows(d) {
  return d.users
    .map((u) => ({ ...u, prds: d.prds.filter((p) => p.userId === u.id).length }))
    .sort((a, b) => (a.lastActiveAt < b.lastActiveAt ? 1 : -1));
}

async function request(method, path, body) {
  await new Promise((r) => setTimeout(r, 40)); // jeda kecil supaya alurnya terasa seperti memanggil server
  const out = handle(method, path, body === undefined ? undefined : copy(body));
  if (method !== 'GET') persist();
  return copy(out);
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  put: (path, body) => request('PUT', path, body ?? {}),
  del: (path) => request('DELETE', path),
};
