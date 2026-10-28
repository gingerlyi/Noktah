// Nilai mutu PRD (0 sampai 100): seberapa siap PRD dipakai AI builder. Pemeriksa struktur (checkPrd) menilai
// bentuk dokumen; nilai ini menambah isi: identitas sendiri, tujuan terukur, kriteria penerimaan, dan batas lingkup.
// Tiap kriteria punya bobot dan saran perbaikan yang bisa langsung dikerjakan.
import { T } from './catalog.js';
import { alurAktif, countLevel, fiturAktif, lines, peranAktif } from './prd.js';

const bagi = (a, b) => (b ? a / b : 1);

export function nilaiPrd(s, issues) {
  const wajib = countLevel(issues, 'wajib');
  const saran = countLevel(issues, 'saran');
  const roles = peranAktif(s);
  const inti = fiturAktif(s).filter((f) => f.p !== 'P2');
  const metrik = lines(s.metrik);
  const contoh = T[s.tpl]?.d.nama;
  const kriteria = [
    { label: 'Struktur baku terpenuhi', bobot: 25, skor: Math.max(0, 1 - wajib / 3), tip: `Perbaiki ${wajib} hal wajib di pemeriksa struktur.` },
    { label: 'Saran struktur dikerjakan', bobot: 10, skor: Math.max(0, 1 - saran / 5), tip: `Kerjakan ${saran} saran di pemeriksa struktur.` },
    {
      label: 'Nama dan tagline milik usahamu',
      bobot: 10,
      skor: (s.nama.trim() && s.nama.trim() !== contoh ? 0.5 : 0) + (s.tagline.trim() ? 0.5 : 0),
      tip: s.nama.trim() === contoh ? `Ganti nama contoh "${contoh}" dengan nama usahamu.` : 'Isi tagline: satu kalimat yang menjelaskan manfaat utamanya.',
    },
    {
      label: 'Deskripsi dan masalah jelas',
      bobot: 10,
      skor: (s.deskripsi.trim().length >= 120 ? 0.5 : 0) + (s.masalah.trim().length >= 80 ? 0.5 : 0),
      tip: 'Tulis deskripsi minimal dua kalimat dan masalah yang dialami pengguna sekarang, lengkap dengan akibatnya.',
    },
    {
      label: 'Target pengguna dan tujuan',
      bobot: 10,
      skor: Math.min(lines(s.audiens).length, 2) / 4 + Math.min(lines(s.tujuan).length, 2) / 4,
      tip: 'Tulis minimal dua kelompok target pengguna dan dua tujuan.',
    },
    {
      label: 'Ukuran keberhasilan terukur',
      bobot: 10,
      skor: metrik.length < 2 ? metrik.length * 0.25 : bagi(metrik.filter((m) => /\d/.test(m)).length, metrik.length),
      tip: 'Tulis minimal dua ukuran keberhasilan dengan angka, misalnya "60% antrean lewat online dalam 3 bulan".',
    },
    {
      label: 'Kriteria penerimaan di kebutuhan P0 dan P1',
      bobot: 15,
      skor: bagi(inti.filter((f) => lines(f.k).length).length, inti.length),
      tip: `${inti.filter((f) => !lines(f.k).length).length} kebutuhan P0/P1 belum punya kriteria penerimaan. Tanpa itu AI tidak tahu kapan fiturnya selesai.`,
    },
    { label: 'Batas lingkup ditulis', bobot: 5, skor: lines(s.luar).length ? 1 : 0, tip: 'Tulis apa yang tidak dibangun di versi ini, supaya AI tidak menambah fitur sendiri.' },
    {
      label: 'Setiap peran punya alur',
      bobot: 5,
      skor: bagi(roles.filter((r) => alurAktif(s).some((a) => a.r === r.id)).length, roles.length),
      tip: 'Tambahkan alur utama untuk peran yang belum punya, supaya AI tahu urutan kerjanya.',
    },
  ].map((k) => ({ ...k, poin: Math.round(k.bobot * k.skor), ok: k.skor >= 1 }));
  const nilai = kriteria.reduce((n, k) => n + k.poin, 0);
  return { nilai, kriteria, tingkat: nilai >= 90 ? 'Siap dibangun' : nilai >= 70 ? 'Hampir siap' : 'Perlu dilengkapi' };
}
