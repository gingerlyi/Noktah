// Editor PRD: formulir di kiri, pratinjau dan dokumen di kanan, dengan pemeriksa struktur.
// Dipakai untuk PRD milik pengguna dan untuk PRD perpustakaan yang diedit admin.
// ResultPanel juga dipakai halaman detail perpustakaan (tanpa formulir).
import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BLOK, GAYA, T, WARNA, nfrFor, stackFor } from '../lib/catalog.js';
import { bentukPeran, mockHTML } from '../lib/mock.js';
import { SEMUA, STRUKTUR, checkPrd, countLevel, genMd, halamanPeran, isMobile, md, peranAktif, rid, slug } from '../lib/prd.js';
import { DEMO, useApp } from '../lib/app.jsx';
import { ALAT, buatChecklist, buatPrompt, namaBerkas } from '../lib/prompts.js';
import { zip } from '../lib/zip.js';
import { nilaiPrd } from '../lib/nilai.js';

// Menyimpan otomatis 0,7 detik setelah perubahan terakhir, satu permintaan pada satu waktu.
export function useAutosave(save) {
  const [status, setStatus] = useState('saved');
  const timer = useRef(null);
  const pending = useRef(null);
  const saving = useRef(false);
  const saveRef = useRef(save);
  saveRef.current = save;

  const run = useCallback(async () => {
    if (saving.current || pending.current === null) return;
    const value = pending.current;
    pending.current = null;
    saving.current = true;
    setStatus('saving');
    try {
      await saveRef.current(value);
      setStatus(pending.current === null ? 'saved' : 'saving');
    } catch {
      if (pending.current === null) pending.current = value; // dicoba lagi pada perubahan berikutnya
      setStatus('error');
      saving.current = false;
      return;
    }
    saving.current = false;
    if (pending.current !== null) run();
  }, []);

  const queue = useCallback(
    (value) => {
      pending.current = value;
      setStatus('saving');
      clearTimeout(timer.current);
      timer.current = setTimeout(run, 700);
    },
    [run],
  );

  // Saat meninggalkan halaman editor, simpan perubahan yang masih menunggu.
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      run();
    },
    [run],
  );

  return { status, queue };
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Cadangan untuk peramban yang menolak API clipboard.
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

// Menyalin PRD dan memberi tahu bila masih ada bagian yang belum sesuai struktur.
export function useCopyPrd() {
  const { toast } = useApp();
  return useCallback(
    async (text, issues) => {
      if (!(await copyText(text))) {
        toast('Tidak bisa menyalin otomatis. Pakai tombol Unduh .md di tab Dokumen PRD.');
        return;
      }
      const n = countLevel(issues, 'wajib');
      toast(n ? `PRD disalin, tetapi masih ada ${n} hal yang belum sesuai struktur.` : 'PRD disalin sebagai Markdown.');
    },
    [toast],
  );
}

export async function downloadMd(text, state, toast) {
  const filename = 'prd-' + slug(state) + '.md';
  if (DEMO) {
    // Pratinjau berjalan di dalam Claude, yang hanya mengizinkan unduhan lewat izin khususnya.
    try {
      const downloads = await window.claude?.use?.('downloads');
      if (!downloads) throw new Error('tidak tersedia');
      await downloads.save({ filename, data: text });
    } catch (err) {
      if (err?.code !== 'declined') toast('Unduhan tidak tersedia di pratinjau ini. Pakai tombol Salin Markdown.');
    }
    return;
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Ringkasan hasil pemeriksaan struktur: teks dan warna berjalan bersama, tidak hanya warna.
export function checkSummary(issues) {
  const wajib = countLevel(issues, 'wajib');
  const saran = countLevel(issues, 'saran');
  if (wajib) return { tone: 'bad', label: `${wajib} hal wajib diperbaiki` };
  if (saran) return { tone: 'warn', label: `Sesuai struktur · ${saran} saran` };
  return { tone: 'ok', label: '✓ Sesuai struktur' };
}

// Nilai mutu PRD dengan rincian kriteria dan saran perbaikan (hanya di editor PRD Saya).
function NilaiPanel({ nilai }) {
  return (
    <div className="nilai" role="status">
      <div className="nilai-head">
        <b className="nilai-angka">{nilai.nilai}</b>
        <span>
          <b>Nilai PRD: {nilai.tingkat}</b>
          <small>Seberapa siap PRD ini dipakai AI builder tanpa banyak menebak.</small>
        </span>
      </div>
      <div className="nilai-bar" aria-hidden="true">
        <i style={{ width: nilai.nilai + '%' }} />
      </div>
      <ul>
        {nilai.kriteria.map((k) => (
          <li key={k.label} className={k.ok ? 'is-ok' : ''}>
            <span>
              {k.ok ? '✓' : '○'} {k.label}
              {!k.ok && <small>{k.tip}</small>}
            </span>
            <em>
              {k.poin}/{k.bobot}
            </em>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CheckPanel({ issues }) {
  const sum = checkSummary(issues);
  return (
    <div className={'check ' + sum.tone} role="status">
      <div>
        <b>{sum.tone === 'bad' ? 'Belum sesuai struktur baku' : 'Sesuai struktur baku'}</b> ({STRUKTUR}).{' '}
        {sum.tone === 'ok' && 'AI builder bisa membaca dokumen ini tanpa menebak letak informasinya. '}
        <Link to="/struktur">Lihat ketentuannya</Link>
      </div>
      {issues.length > 0 && (
        <ul>
          {issues.map((x, i) => (
            <li key={i}>
              <b>{x.level === 'wajib' ? 'Wajib: ' : 'Saran: '}</b>
              {x.msg}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stage({ state, mobile, role }) {
  const stageRef = useRef(null);
  const viewRef = useRef(null);
  const roleId = role?.id;
  const html = useMemo(() => mockHTML(state, mobile, roleId), [state, mobile, roleId]);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const view = viewRef.current;
    if (!stage || !view) return undefined;
    // Lebar yang tersedia diambil dari isi bingkai (sudah dikurangi garis tepi dan batang gulir).
    // Maket website mengisi penuh lebar bingkai, boleh sedikit diperbesar; maket ponsel hanya diperkecil.
    const apply = () => {
      const width = mobile ? 390 : 1120;
      const avail = view.clientWidth;
      const m = view.firstElementChild;
      if (m && avail > 0) m.style.zoom = Math.min(mobile ? 1 : 1.4, avail / width);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(stage);
    ro.observe(view);
    return () => ro.disconnect();
  }, [html, mobile]);
  useEffect(() => {
    if (viewRef.current) viewRef.current.scrollTop = 0;
  }, [mobile, roleId]);
  const bentuk = role ? bentukPeran(state, role.id) : isMobile(state) ? 'app' : 'situs';
  const utama = peranAktif(state)[0];
  const path = role && utama && role.id !== utama.id ? rid(role.n) : '';
  return (
    <div className="stage" ref={stageRef}>
      <div className={'frame' + (mobile ? ' is-mobile' : '')}>
        <div className="frame-bar">
          <i />
          <i />
          <i />
          <span className="frame-url">{slug(state) + (T[state.tpl].app ? '.app/' : '.id/') + path}</span>
        </div>
        <div className="frame-view" ref={viewRef} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <p className="stage-note">
        Teks, harga, dan nama orang di pratinjau adalah contoh.{' '}
        {bentuk === 'situs'
          ? 'Susunan, halaman, warna, dan gaya mengikuti PRD.'
          : bentuk === 'app'
            ? 'Layar, tab navigasi, warna, dan gaya mengikuti PRD.'
            : `Menu samping berisi halaman milik ${role.n}, sesuai PRD.`}
      </p>
    </div>
  );
}

// Panel hasil: pratinjau dan dokumen PRD. onEditText diisi bila dokumen boleh diedit langsung.
// pick ({ id, mobile }) memilih peran dan ukuran layar pratinjau dari luar, misalnya dari galeri gambaran hasil.
export function ResultPanel({ state, text, issues, nilai, tab, onTab, onEditText, onResetManual, pick }) {
  const { toast } = useApp();
  const copyPrd = useCopyPrd();
  const [wide, setWide] = useState(false); // false = desktop, true = ponsel (hanya untuk tampilan web)
  const [edit, setEdit] = useState(false);
  const [roleId, setRoleId] = useState('');
  useEffect(() => {
    if (!pick) return;
    setRoleId(pick.id);
    setWide(pick.mobile);
  }, [pick]);
  const app = isMobile(state);
  const preview = useDeferredValue(state);
  // Peran yang bisa dilihat pratinjaunya: peran utama dan peran aktif lain yang punya halaman.
  const roles = peranAktif(preview).filter((r, i) => i === 0 || halamanPeran(preview, r.id).length);
  const role = roles.find((r) => r.id === roleId) || roles[0];
  const appView = role ? bentukPeran(preview, role.id) === 'app' : app;
  const mobile = appView || wide;
  const docHtml = useMemo(() => (tab === 'doc' && !edit ? md(text) : ''), [tab, edit, text]);

  return (
    <div className="sheet panel">
      <div className="tabs">
        <div role="tablist" aria-label="Hasil">
          <button className="tab" role="tab" type="button" aria-selected={tab === 'doc'} onClick={() => onTab('doc')}>
            Dokumen PRD
          </button>
          <button className="tab" role="tab" type="button" aria-selected={tab === 'prev'} onClick={() => onTab('prev')}>
            {app ? 'Pratinjau aplikasi' : 'Pratinjau website'}
          </button>
          <button className="tab" role="tab" type="button" aria-selected={tab === 'ai'} onClick={() => onTab('ai')}>
            Prompt AI
          </button>
        </div>
        {tab === 'prev' ? (
          (roles.length > 1 || !appView) && (
            <div className="tabs-right">
              {roles.length > 1 && (
                <label className="role-pick">
                  <span>Lihat sebagai</span>
                  <select value={role.id} aria-label="Lihat pratinjau sebagai peran" onChange={(ev) => setRoleId(ev.target.value)}>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.n}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {!appView && (
                <div className="seg" role="group" aria-label="Ukuran layar">
                  <button type="button" aria-pressed={!wide} onClick={() => setWide(false)}>
                    Desktop
                  </button>
                  <button type="button" aria-pressed={wide} onClick={() => setWide(true)}>
                    Ponsel
                  </button>
                </div>
              )}
            </div>
          )
        ) : tab === 'ai' ? null : (
          <div className="tabs-right">
            {onEditText && (
              <div className="seg" role="group" aria-label="Mode dokumen">
                <button type="button" aria-pressed={!edit} onClick={() => setEdit(false)}>
                  Baca
                </button>
                <button type="button" aria-pressed={edit} onClick={() => setEdit(true)}>
                  Edit teks
                </button>
              </div>
            )}
            <button className="btn quiet" type="button" onClick={() => downloadMd(text, state, toast)}>
              Unduh .md
            </button>
            <button className="btn" type="button" onClick={() => copyPrd(text, issues)}>
              Salin Markdown
            </button>
          </div>
        )}
      </div>

      {tab === 'prev' ? (
        <Stage state={preview} mobile={mobile} role={role} />
      ) : tab === 'ai' ? (
        <PromptPanel state={preview} text={text} />
      ) : (
        <div className="docwrap">
          {nilai && <NilaiPanel nilai={nilai} />}
          <CheckPanel issues={issues} />
          {onResetManual && state.manual != null && (
            <div className="manual">
              <span>Dokumen ini sudah kamu edit langsung, jadi perubahan di formulir tidak ikut masuk.</span>
              <button className="btn quiet" type="button" onClick={onResetManual}>
                Pakai lagi hasil formulir
              </button>
            </div>
          )}
          {edit && onEditText ? (
            <>
              <p className="hint">
                Edit langsung tetap harus mengikuti struktur baku: jangan mengubah judul bagian, urutan, atau bentuk blok FR. Pemeriksa di atas
                menunjukkan bagian yang menyimpang.
              </p>
              <textarea
                id="mdEdit"
                aria-label="Teks PRD dalam Markdown"
                spellCheck={false}
                value={text}
                onChange={(ev) => onEditText(ev.target.value)}
              />
            </>
          ) : (
            <div className="doc" dangerouslySetInnerHTML={{ __html: docHtml }} />
          )}
        </div>
      )}
    </div>
  );
}

// Tab "Prompt AI": PRD dipecah menjadi prompt per fase untuk AI builder, plus paket ZIP.
// Fase pertama terbuka untuk semua orang sebagai contoh; fase berikutnya dan ZIP untuk Premium.
function PromptPanel({ state, text }) {
  const { user, toast } = useApp();
  const [alat, setAlat] = useState('lovable');
  const fase = useMemo(() => buatPrompt(state, alat), [state, alat]);
  const premium = !!user?.premium;
  const salin = async (isi) => toast((await copyText(isi)) ? 'Prompt disalin.' : 'Tidak bisa menyalin otomatis. Pilih teksnya lalu salin manual.');
  const unduhZip = () => {
    if (DEMO) {
      toast('Unduhan ZIP tidak tersedia di pratinjau ini. Salin prompt satu per satu.');
      return;
    }
    const berkas = namaBerkas(state);
    const files = [
      { name: 'PRD.md', text },
      ...fase.map((f, i) => ({ name: `prompts/${String(i + 1).padStart(2, '0')}-${rid(f.judul)}.md`, text: f.isi })),
      { name: 'checklist.md', text: buatChecklist(state, fase) },
      {
        name: 'BACA-DULU.md',
        text: `# Cara memakai paket ini\n\n1. Buka ${ALAT[alat].nama} dan lampirkan PRD.md.\n2. Tempel isi prompts/ satu per satu, berurutan. Tunggu tiap fase selesai sebelum lanjut.\n3. Centang checklist.md setiap ada yang selesai.\n`,
      },
    ];
    const url = URL.createObjectURL(zip(files));
    const a = document.createElement('a');
    a.href = url;
    a.download = berkas + '-prompt.zip';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="pr">
      <div className="pr-head">
        <div className="seg" role="group" aria-label="AI builder">
          {Object.entries(ALAT).map(([k, a]) => (
            <button type="button" key={k} aria-pressed={alat === k} onClick={() => setAlat(k)}>
              {a.nama}
            </button>
          ))}
        </div>
        {premium ? (
          <button type="button" className="btn" onClick={unduhZip}>
            Unduh paket ZIP
          </button>
        ) : (
          <Link className="btn" to="/harga">
            Buka semua fase dengan Premium
          </Link>
        )}
      </div>
      <p className="hint">
        Lampirkan dokumen PRD ke {ALAT[alat].nama}, lalu tempel prompt di bawah satu per satu sesuai urutan. Tiap fase ditutup dengan
        pemeriksaan kriteria penerimaan, jadi kamu tahu kapan boleh lanjut.
      </p>
      <ol className="pr-list">
        {fase.map((f, i) => {
          const kunci = !premium && i > 0;
          return (
            <li key={f.judul} className={kunci ? 'is-locked' : ''}>
              <div className="pr-row">
                <b>
                  Fase {i + 1}: {f.judul}
                </b>
                {kunci ? (
                  <span className="tag">Premium</span>
                ) : (
                  <button type="button" className="btn quiet" onClick={() => salin(f.isi)}>
                    Salin prompt
                  </button>
                )}
              </div>
              {!kunci && (
                <details open={i === 0}>
                  <summary>Lihat isi prompt</summary>
                  <pre>{f.isi}</pre>
                </details>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Field({ id, label, hint, value, onChange, area = false, placeholder }) {
  const Tag = area ? 'textarea' : 'input';
  return (
    <div className="fld">
      <label htmlFor={id}>
        {label} {hint && <span className="hint">{hint}</span>}
      </label>
      <Tag id={id} type={area ? undefined : 'text'} value={value} placeholder={placeholder} onChange={(ev) => onChange(ev.target.value)} />
    </div>
  );
}

function Chips({ items, label, onToggle }) {
  return (
    <div className="chips">
      {items.map((x, i) => (
        <button type="button" className="chip" key={i} aria-pressed={!!x.on} onClick={() => onToggle(i)}>
          {label(x)}
        </button>
      ))}
    </div>
  );
}

const STATUS_TEXT = {
  saving: 'Menyimpan…',
  error: 'Gagal menyimpan. Perubahan berikutnya dicoba lagi.',
};

export function EditorShell({ kind, title, backTo, backLabel, status, state, onChange, onReset, metaGroup, tools }) {
  const { toast } = useApp();
  const copyPrd = useCopyPrd();
  const [tab, setTab] = useState('prev');
  const [pane, setPane] = useState('form');
  const [newPage, setNewPage] = useState('');
  const [newPageRole, setNewPageRole] = useState('');
  const topRef = useRef(null);
  const focusFeat = useRef(-1);
  const focusRole = useRef(-1);
  const focusFlow = useRef(-1);
  const isLib = kind === 'tpl';
  const app = isMobile(state);
  const unit = app ? 'layar' : 'halaman';
  const platform = T[state.tpl].platform;
  const nfrs = nfrFor(platform);

  // "Urungkan" dari toast hanya berlaku selama editor dokumen ini masih terbuka.
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const undoTo = (prev) => () => {
    if (alive.current) changeRef.current(prev);
  };

  const set = (patch) => onChange({ ...state, ...patch });
  const toggleIn = (key, i) => set({ [key]: state[key].map((x, j) => (j === i ? { ...x, on: !x.on } : x)) });
  const setFeat = (i, patch) => set({ fitur: state.fitur.map((f, j) => (j === i ? { ...f, ...patch } : f)) });

  const text = state.manual ?? genMd(state);
  const checked = useDeferredValue(text);
  const issues = useMemo(() => checkPrd(checked), [checked]);
  const sum = checkSummary(issues);
  const nilai = useMemo(() => (kind === 'prd' ? nilaiPrd(state, issues) : null), [kind, state, issues]);

  const feats = state.fitur.filter((f) => f.on && f.n.trim());
  const stacks = stackFor(platform);
  const stackOptions = stacks.includes(state.stack) ? stacks : [...stacks, state.stack];
  const aktif = peranAktif(state);
  const pageRole = aktif.some((r) => r.id === newPageRole) ? newPageRole : aktif[0]?.id || '';

  // Peran
  const setRole = (i, patch) => set({ peran: state.peran.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const addRole = () => {
    focusRole.current = state.peran.length;
    set({ peran: [...state.peran, { id: 'peran-' + Date.now().toString(36), n: '', d: '', m: '', b: '', t: '', w: '', on: true }] });
  };
  const removeRole = (i) => {
    if (state.peran.length < 2) return;
    const prev = state;
    const id = state.peran[i].id;
    const sisa = state.peran.filter((_, j) => j !== i);
    set({
      peran: sisa,
      halaman: state.halaman.filter((h) => h.r !== id),
      fitur: state.fitur.map((f) => {
        const r = f.r.filter((x) => x !== id);
        return { ...f, r: r.length ? r : [sisa[0].id] };
      }),
      alur: state.alur.filter((a) => a.r !== id),
    });
    toast('Peran dihapus beserta halaman dan alurnya.', undoTo(prev));
  };
  // Halaman
  const togglePage = (i) => set({ halaman: state.halaman.map((h, j) => (j === i ? { ...h, on: !h.on } : h)) });
  const addPage = () => {
    const v = newPage.trim();
    if (!v || !pageRole) return;
    set({ halaman: [...state.halaman, { n: v.slice(0, 40), r: pageRole, on: true }] });
    setNewPage('');
  };
  // Fitur
  const addFeat = () => {
    focusFeat.current = state.fitur.length;
    set({ fitur: [...state.fitur, { n: '', d: '', k: '', p: 'P1', r: [aktif[0]?.id || state.peran[0].id], on: true }] });
  };
  const toggleFeatRole = (i, id) => {
    const f = state.fitur[i];
    const cur = f.r.includes(SEMUA) ? aktif.map((r) => r.id) : f.r;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    if (next.length) setFeat(i, { r: next });
  };
  // Alur
  const setFlow = (i, patch) => set({ alur: state.alur.map((a, j) => (j === i ? { ...a, ...patch } : a)) });
  const addFlow = () => {
    focusFlow.current = state.alur.length;
    set({ alur: [...state.alur, { n: '', r: aktif[0]?.id || state.peran[0].id, l: '', on: true }] });
  };
  const removeFlow = (i) => {
    const prev = state;
    set({ alur: state.alur.filter((_, j) => j !== i) });
    toast('Alur dihapus.', undoTo(prev));
  };
  useEffect(() => {
    for (const [ref, prefix] of [
      [focusFeat, 'fi-n-'],
      [focusRole, 'pr-n-'],
      [focusFlow, 'al-n-'],
    ]) {
      if (ref.current >= 0) {
        document.getElementById(prefix + ref.current)?.focus();
        ref.current = -1;
      }
    }
  });
  const removeFeat = (i) => {
    const prev = state;
    set({ fitur: state.fitur.filter((_, j) => j !== i) });
    toast('Fitur dihapus.', undoTo(prev));
  };
  const reset = () => {
    const prev = state;
    onReset();
    toast('Isian dikembalikan ke isi PRD perpustakaan.', undoTo(prev));
  };
  const switchPane = (p) => {
    setPane(p);
    topRef.current?.scrollIntoView();
  };
  const showCheck = () => {
    setTab('doc');
    setPane('hasil');
  };

  return (
    <main className="view tight" ref={topRef}>
      <div className="ed-bar">
        <Link className="btn quiet" to={backTo}>
          ← {backLabel}
        </Link>
        <div className="ed-title">
          <span className="step">{isLib ? 'PRD perpustakaan' : 'PRD'}</span>
          <h1>{title}</h1>
        </div>
        <button type="button" className={'badge ' + sum.tone} onClick={showCheck} title="Buka hasil pemeriksaan struktur">
          {sum.label}
        </button>
        {nilai && (
          <button type="button" className="badge nilai-badge" onClick={showCheck} title="Lihat rincian nilai PRD">
            Nilai {nilai.nilai}
          </button>
        )}
        <span className={'ed-status' + (status === 'error' ? ' err' : '')} role="status">
          {STATUS_TEXT[status] || 'Tersimpan'}
        </span>
        {tools}
        {!isLib && (
          <button className="btn" type="button" onClick={() => copyPrd(text, issues)}>
            Salin PRD
          </button>
        )}
      </div>
      <div className="pane-switch seg" role="group" aria-label="Bagian editor">
        <button type="button" aria-pressed={pane === 'form'} onClick={() => switchPane('form')}>
          Isi PRD
        </button>
        <button type="button" aria-pressed={pane === 'hasil'} onClick={() => switchPane('hasil')}>
          Lihat hasil
        </button>
      </div>

      <section className="work" data-pane={pane}>
        <div className="sheet" id="form">
          <div className="sheet-head">
            <div className="sec-head">
              <h2>Isi PRD</h2>
            </div>
            <p>Isinya bebas kamu ubah. Susunan dokumennya tetap mengikuti struktur baku supaya mudah dibaca AI.</p>
          </div>

          {metaGroup}

          <details className="grp" open>
            <summary>Dasar proyek</summary>
            <div className="grp-body">
              <Field id="f-nama" label={app ? 'Nama aplikasi' : 'Nama website'} value={state.nama} onChange={(v) => set({ nama: v })} />
              <Field
                id="f-tagline"
                label="Kalimat utama"
                hint={app ? 'janji utama aplikasi dalam satu kalimat' : 'tampil besar di halaman depan'}
                value={state.tagline}
                onChange={(v) => set({ tagline: v })}
              />
              <Field id="f-cta" label="Teks tombol utama" value={state.cta} onChange={(v) => set({ cta: v })} />
              <Field id="f-deskripsi" label="Deskripsi singkat" area value={state.deskripsi} onChange={(v) => set({ deskripsi: v })} />
              <Field id="f-masalah" label="Masalah yang diselesaikan" area value={state.masalah} onChange={(v) => set({ masalah: v })} />
            </div>
          </details>

          <details className="grp">
            <summary>Pengguna dan tujuan</summary>
            <div className="grp-body">
              <Field id="f-audiens" label="Target pengguna" hint="satu per baris" area value={state.audiens} onChange={(v) => set({ audiens: v })} />
              <Field id="f-tujuan" label="Tujuan" hint="satu per baris" area value={state.tujuan} onChange={(v) => set({ tujuan: v })} />
              <Field id="f-metrik" label="Ukuran keberhasilan" hint="satu per baris" area value={state.metrik} onChange={(v) => set({ metrik: v })} />
              <Field id="f-luar" label="Di luar lingkup" hint="satu per baris" area value={state.luar} onChange={(v) => set({ luar: v })} />
            </div>
          </details>

          <details className="grp" open>
            <summary>
              Peran dan hak akses <span className="sum-meta">{aktif.length} peran</span>
            </summary>
            <div className="grp-body">
              <span className="hint">
                Siapa saja yang memakai {app ? 'aplikasi' : 'website'} ini dan apa yang boleh mereka lakukan. Peran pertama adalah peran utama. Peran
                yang dimatikan tidak masuk dokumen, begitu juga {unit}, fitur, dan alur miliknya.
              </span>
              <ul className="roles">
                {state.peran.map((r, i) => (
                  <li className={'role' + (r.on ? '' : ' off')} key={r.id}>
                    <div className="role-head">
                      <input
                        type="checkbox"
                        id={'pr-on-' + i}
                        checked={r.on}
                        aria-label={'Sertakan peran ' + r.n}
                        onChange={(ev) => setRole(i, { on: ev.target.checked })}
                      />
                      <input
                        type="text"
                        id={'pr-n-' + i}
                        value={r.n}
                        placeholder="Nama peran, misalnya Admin"
                        aria-label="Nama peran"
                        onChange={(ev) => setRole(i, { n: ev.target.value.slice(0, 40) })}
                      />
                      {app && (
                        <select id={'pr-w-' + i} value={r.w} aria-label="Peran ini memakai" onChange={(ev) => setRole(i, { w: ev.target.value })}>
                          <option value="">Di aplikasi</option>
                          <option value="web">Di panel web</option>
                        </select>
                      )}
                      <button
                        type="button"
                        className="x"
                        aria-label={'Hapus peran ' + r.n}
                        disabled={state.peran.length < 2}
                        onClick={() => removeRole(i)}
                      >
                        ×
                      </button>
                    </div>
                    <label className="rf" htmlFor={'pr-d-' + i}>
                      <span>Siapa</span>
                      <input
                        type="text"
                        id={'pr-d-' + i}
                        value={r.d}
                        placeholder="Misalnya pemilik dan kasir toko"
                        aria-label="Siapa yang memegang peran ini"
                        onChange={(ev) => setRole(i, { d: ev.target.value })}
                      />
                    </label>
                    <label className="rf" htmlFor={'pr-m-' + i}>
                      <span>Cara masuk</span>
                      <input
                        type="text"
                        id={'pr-m-' + i}
                        value={r.m}
                        placeholder="Misalnya email dan kata sandi, atau tanpa akun"
                        aria-label="Cara masuk"
                        onChange={(ev) => setRole(i, { m: ev.target.value })}
                      />
                    </label>
                    <div className="role-lists">
                      <label className="rf" htmlFor={'pr-b-' + i}>
                        <span>Bisa</span>
                        <textarea
                          id={'pr-b-' + i}
                          value={r.b}
                          placeholder="Satu per baris"
                          aria-label={'Yang bisa dilakukan ' + r.n}
                          onChange={(ev) => setRole(i, { b: ev.target.value })}
                        />
                      </label>
                      <label className="rf" htmlFor={'pr-t-' + i}>
                        <span>Tidak bisa</span>
                        <textarea
                          id={'pr-t-' + i}
                          value={r.t}
                          placeholder="Satu per baris, boleh kosong"
                          aria-label={'Yang tidak bisa dilakukan ' + r.n}
                          onChange={(ev) => setRole(i, { t: ev.target.value })}
                        />
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
              <div>
                <button className="btn quiet" type="button" onClick={addRole}>
                  Tambah peran
                </button>
              </div>
            </div>
          </details>

          <details className="grp" open>
            <summary>
              {app ? 'Layar' : 'Halaman'}{' '}
              <span className="sum-meta">
                {state.halaman.filter((h) => h.on && aktif.some((r) => r.id === h.r)).length} {unit}
              </span>
            </summary>
            <div className="grp-body">
              <span className="hint">
                {app
                  ? 'Dikelompokkan per peran. Empat layar pertama tiap peran yang memakai aplikasi menjadi tab navigasi bawahnya.'
                  : 'Dikelompokkan per peran. Halaman peran utama menjadi menu di bagian atas website.'}
              </span>
              {aktif.map((r) => (
                <div className="pg-group" key={r.id}>
                  <span className="lbl">
                    {r.n}
                    {app && r.w === 'web' ? ' · panel web' : ''}
                  </span>
                  <div className="chips">
                    {state.halaman.map((h, i) =>
                      h.r === r.id ? (
                        <button type="button" className="chip" key={i} aria-pressed={!!h.on} onClick={() => togglePage(i)}>
                          {h.n}
                        </button>
                      ) : null,
                    )}
                  </div>
                </div>
              ))}
              <div className="addrow">
                <input
                  type="text"
                  id="addHal"
                  placeholder={`Nama ${unit} baru`}
                  aria-label={`Nama ${unit} baru`}
                  value={newPage}
                  onChange={(ev) => setNewPage(ev.target.value)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter') {
                      ev.preventDefault();
                      addPage();
                    }
                  }}
                />
                {aktif.length > 1 && (
                  <select id="addHalPeran" value={pageRole} aria-label={`Peran pemilik ${unit} baru`} onChange={(ev) => setNewPageRole(ev.target.value)}>
                    {aktif.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.n}
                      </option>
                    ))}
                  </select>
                )}
                <button className="btn quiet" type="button" onClick={addPage}>
                  Tambah
                </button>
              </div>
            </div>
          </details>

          <details className="grp">
            <summary>
              Alur utama <span className="sum-meta">{state.alur.filter((a) => a.on && aktif.some((r) => r.id === a.r)).length} alur</span>
            </summary>
            <div className="grp-body">
              <span className="hint">Langkah yang dijalani satu peran dari awal sampai selesai. AI memakai alur ini untuk menguji hasilnya.</span>
              <ul className="flows">
                {state.alur.map((a, i) => (
                  <li className={'flow' + (a.on ? '' : ' off')} key={i}>
                    <input
                      type="checkbox"
                      id={'al-on-' + i}
                      checked={a.on}
                      aria-label={'Sertakan alur ' + a.n}
                      onChange={(ev) => setFlow(i, { on: ev.target.checked })}
                    />
                    <input
                      type="text"
                      id={'al-n-' + i}
                      value={a.n}
                      placeholder="Judul alur, misalnya Memesan meja"
                      aria-label="Judul alur"
                      onChange={(ev) => setFlow(i, { n: ev.target.value })}
                    />
                    <button type="button" className="x" aria-label={'Hapus alur ' + a.n} onClick={() => removeFlow(i)}>
                      ×
                    </button>
                    <label className="rf flow-r" htmlFor={'al-r-' + i}>
                      <span>Dijalankan oleh</span>
                      <select id={'al-r-' + i} value={a.r} aria-label="Peran yang menjalankan alur" onChange={(ev) => setFlow(i, { r: ev.target.value })}>
                        {state.peran.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.n || 'Tanpa nama'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="rf flow-lw" htmlFor={'al-l-' + i}>
                      <span>Langkah, satu per baris</span>
                      <textarea
                        className="flow-l"
                        id={'al-l-' + i}
                        value={a.l}
                        placeholder="Misalnya: Membuka halaman Reservasi"
                        aria-label="Langkah alur"
                        onChange={(ev) => setFlow(i, { l: ev.target.value })}
                      />
                    </label>
                  </li>
                ))}
              </ul>
              <div>
                <button className="btn quiet" type="button" onClick={addFlow}>
                  Tambah alur
                </button>
              </div>
            </div>
          </details>

          <details className="grp" open>
            <summary>
              Fitur{' '}
              <span className="sum-meta">
                {feats.length} fitur · {feats.filter((f) => f.p === 'P0').length} P0
              </span>
            </summary>
            <div className="grp-body">
              <span className="hint">
                P0 wajib ada di rilis pertama, P1 menyusul, P2 bila ada waktu. Kriteria penerimaan memberi tahu AI kapan sebuah fitur dianggap
                selesai.
              </span>
              <ul className="feats">
                {state.fitur.map((f, i) => (
                  <li className={'feat' + (f.on ? '' : ' off')} key={i}>
                    <input
                      type="checkbox"
                      id={'fi-on-' + i}
                      checked={f.on}
                      aria-label={'Sertakan fitur ' + f.n}
                      onChange={(ev) => setFeat(i, { on: ev.target.checked })}
                    />
                    <input
                      type="text"
                      id={'fi-n-' + i}
                      value={f.n}
                      placeholder="Nama fitur"
                      aria-label="Nama fitur"
                      onChange={(ev) => setFeat(i, { n: ev.target.value })}
                    />
                    <select id={'fi-p-' + i} value={f.p} aria-label="Prioritas" onChange={(ev) => setFeat(i, { p: ev.target.value })}>
                      <option>P0</option>
                      <option>P1</option>
                      <option>P2</option>
                    </select>
                    <button type="button" className="x" aria-label={'Hapus fitur ' + f.n} onClick={() => removeFeat(i)}>
                      ×
                    </button>
                    {aktif.length > 1 && (
                      <div className="feat-r" role="group" aria-label={'Peran untuk fitur ' + f.n}>
                        {aktif.map((r) => (
                          <button
                            type="button"
                            className="chip sm"
                            key={r.id}
                            aria-pressed={f.r.includes(SEMUA) || f.r.includes(r.id)}
                            onClick={() => toggleFeatRole(i, r.id)}
                          >
                            {r.n}
                          </button>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      className="feat-d"
                      id={'fi-d-' + i}
                      value={f.d}
                      placeholder="Deskripsi singkat"
                      aria-label="Deskripsi fitur"
                      onChange={(ev) => setFeat(i, { d: ev.target.value })}
                    />
                    <textarea
                      className="feat-k"
                      id={'fi-k-' + i}
                      value={f.k}
                      placeholder="Kriteria penerimaan, satu per baris"
                      aria-label="Kriteria penerimaan"
                      onChange={(ev) => setFeat(i, { k: ev.target.value })}
                    />
                  </li>
                ))}
              </ul>
              <div>
                <button className="btn quiet" type="button" onClick={addFeat}>
                  Tambah fitur
                </button>
              </div>
            </div>
          </details>

          <details className="grp">
            <summary>
              Model data <span className="sum-meta">{state.data.split('\n').filter((x) => x.trim()).length} entitas</span>
            </summary>
            <div className="grp-body">
              <Field
                id="f-data"
                label="Entitas dan atributnya"
                hint="satu entitas per baris"
                area
                placeholder="Produk: nama, harga, stok"
                value={state.data}
                onChange={(v) => set({ data: v })}
              />
            </div>
          </details>

          <details className="grp" open>
            <summary>Tampilan</summary>
            <div className="grp-body">
              <div className="fld">
                <span className="lbl">Warna merek</span>
                <div className="swatches">
                  {WARNA.map((c) => (
                    <button
                      type="button"
                      className="sw"
                      key={c}
                      style={{ background: c }}
                      aria-label={'Warna ' + c}
                      aria-pressed={c === state.warna}
                      onClick={() => set({ warna: c })}
                    />
                  ))}
                  <input type="color" id="f-warna" value={state.warna} aria-label="Warna lain" onChange={(ev) => set({ warna: ev.target.value })} />
                  <span className="hex">{state.warna}</span>
                </div>
              </div>
              <div className="fld">
                <span className="lbl">Gaya</span>
                <div className="gaya">
                  {Object.entries(GAYA).map(([k, g]) => (
                    <label key={k} title={g.ciri}>
                      <input type="radio" name="gaya" id={'gy-' + k} value={k} checked={k === state.gaya} onChange={() => set({ gaya: k })} />
                      <b>
                        <i className="gy-swatch" data-gaya={k} aria-hidden="true">
                          Aa
                        </i>
                        {g.nama}
                      </b>
                      <span>Cocok untuk {g.cocok.charAt(0).toLowerCase() + g.cocok.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="fld">
                <span className="lbl">{app || T[state.tpl].app ? 'Bagian di layar utama' : 'Bagian di halaman utama'}</span>
                <Chips items={state.blok} label={(x) => BLOK[x.id]} onToggle={(i) => toggleIn('blok', i)} />
              </div>
            </div>
          </details>

          <details className="grp">
            <summary>Teknis dan jadwal</summary>
            <div className="grp-body">
              <div className="fld">
                <label htmlFor="f-stack">Teknologi</label>
                <select id="f-stack" value={state.stack} onChange={(ev) => set({ stack: ev.target.value })}>
                  {stackOptions.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <div className="fld">
                <label htmlFor="f-waktu">Target waktu pengerjaan</label>
                <select id="f-waktu" value={state.waktu} onChange={(ev) => set({ waktu: ev.target.value })}>
                  <option>2 minggu</option>
                  <option>1 bulan</option>
                  <option>3 bulan</option>
                </select>
              </div>
              <div className="fld">
                <span className="lbl">Kebutuhan non-fungsional</span>
                <Chips items={state.nfr} label={(x) => nfrs.find((n) => n[0] === x.id)?.[1] || x.id} onToggle={(i) => toggleIn('nfr', i)} />
              </div>
              <div>
                <button className="btn quiet" type="button" onClick={reset}>
                  Kembalikan ke isi perpustakaan
                </button>
              </div>
            </div>
          </details>
        </div>

        <ResultPanel
          state={state}
          text={text}
          issues={issues}
          nilai={nilai}
          tab={tab}
          onTab={setTab}
          onEditText={(value) => set({ manual: value })}
          onResetManual={() => {
            const prev = state;
            set({ manual: null });
            toast('Dokumen kembali mengikuti formulir.', undoTo(prev));
          }}
        />
      </section>
    </main>
  );
}
