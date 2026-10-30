// Dasar gaya desain yang dibangun dari data (gaya-situs.js dan gaya-aplikasi.js). 14 gaya pertama ada di
// lib/catalog.js dengan CSS sendiri; gaya di sini cukup ditulis sebagai palet, huruf, dan beberapa ciri, lalu
// diterapkan ke maket lewat variabel CSS dan atribut data-* (lihat bagian "Gaya dari data" di mock.css).
//
// Isian: nama, pendek, ciri, nada, gambar, hindari, cocok (teks design brief), latar, teks, surface (warna kartu),
// muted (teks redup), line (garis), fd dan fb (kunci huruf judul dan isi di F), skala, sudut, garis, jarak, kapsul,
// bayang ("lembut", "keras", "cahaya", "dalam", atau tanpa), pola latar pembuka ("titik", "kisi", "garis", atau
// tanpa), dan judul ("kapital", "miring", atau biasa). Semua huruf di F dimuat dari Google Fonts di index.html.

// [nama di Google Fonts, cadangan]
export const F = {
  abril: ['Abril Fatface', 'Georgia, serif'],
  archivo: ['Archivo', 'system-ui, sans-serif'],
  baloo: ['Baloo 2', 'system-ui, sans-serif'],
  barlow: ['Barlow Condensed', 'system-ui, sans-serif'],
  baskerville: ['Libre Baskerville', 'Georgia, serif'],
  bebas: ['Bebas Neue', 'Impact, sans-serif'],
  caveat: ['Caveat', 'cursive'],
  chivo: ['Chivo', 'system-ui, sans-serif'],
  comfortaa: ['Comfortaa', 'system-ui, sans-serif'],
  cormorant: ['Cormorant Garamond', 'Georgia, serif'],
  dmsans: ['DM Sans', 'system-ui, sans-serif'],
  dmserif: ['DM Serif Display', 'Georgia, serif'],
  fraunces: ['Fraunces', 'Georgia, serif'],
  fredoka: ['Fredoka', 'system-ui, sans-serif'],
  garamond: ['EB Garamond', 'Georgia, serif'],
  jetbrains: ['JetBrains Mono', 'ui-monospace, monospace'],
  josefin: ['Josefin Sans', 'system-ui, sans-serif'],
  karla: ['Karla', 'system-ui, sans-serif'],
  lexend: ['Lexend', 'system-ui, sans-serif'],
  lora: ['Lora', 'Georgia, serif'],
  manrope: ['Manrope', 'system-ui, sans-serif'],
  marcellus: ['Marcellus', 'Georgia, serif'],
  merri: ['Merriweather', 'Georgia, serif'],
  nunito: ['Nunito', 'system-ui, sans-serif'],
  oswald: ['Oswald', 'Impact, sans-serif'],
  outfit: ['Outfit', 'system-ui, sans-serif'],
  plexsans: ['IBM Plex Sans', 'system-ui, sans-serif'],
  plexserif: ['IBM Plex Serif', 'Georgia, serif'],
  poppins: ['Poppins', 'system-ui, sans-serif'],
  publicsans: ['Public Sans', 'system-ui, sans-serif'],
  quicksand: ['Quicksand', 'system-ui, sans-serif'],
  raleway: ['Raleway', 'system-ui, sans-serif'],
  righteous: ['Righteous', 'system-ui, sans-serif'],
  rubik: ['Rubik', 'system-ui, sans-serif'],
  sora: ['Sora', 'system-ui, sans-serif'],
  space: ['Space Grotesk', 'system-ui, sans-serif'],
  spacemono: ['Space Mono', 'ui-monospace, monospace'],
  syne: ['Syne', 'system-ui, sans-serif'],
  unbounded: ['Unbounded', 'system-ui, sans-serif'],
  work: ['Work Sans', 'system-ui, sans-serif'],
};

// Ukuran huruf siap pakai: [judul halaman, judul bagian, subjudul, isi, keterangan] dalam px.
export const SKALA = {
  tenang: [44, 30, 20, 16, 13],
  sedang: [48, 32, 20, 16, 13],
  besar: [56, 36, 22, 17, 13],
  poster: [64, 40, 24, 17, 14],
};

const css = (k) => `'${F[k][0]}', ${F[k][1]}`;

export function buat({ fd, fb, surface, muted, line, bayang = '', pola = '', judul = '', skala = 'sedang', ...g }) {
  if (!F[fd] || !F[fb]) throw new Error('huruf tidak dikenal: ' + fd + ', ' + fb);
  return {
    ...g,
    skala: SKALA[skala],
    huruf: fd === fb ? `${F[fd][0]} untuk judul dan isi.` : `${F[fd][0]} untuk judul, ${F[fb][0]} untuk isi.`,
    t: { fd: css(fd), fb: css(fb), surface, muted, line, bayang, pola, judul },
  };
}
