// Katalog perpustakaan: bagian halaman atau layar, kebutuhan non-fungsional, pilihan teknologi, gaya desain,
// dan daftar PRD bawaan. Isi tiap PRD ada di folder src/katalog, satu berkas per PRD.
import {PRD} from '../katalog/index.js';

export const BLOK={hero:'Hero pembuka',menu:'Daftar menu',lokasi:'Lokasi dan jam buka',hitung:'Hitung mundur',acara:'Rangkaian acara',rsvp:'Konfirmasi kehadiran',hadiah:'Amplop digital',tim:'Tim atau pembicara',agenda:'Jadwal atau rencana per hari',listing:'Kartu pilihan (properti, kamar, paket)',kalkulator:'Simulasi biaya',lowongan:'Daftar lowongan',kampanye:'Kampanye donasi',laporan:'Laporan dana',waktu:'Jadwal harian',profil:'Profil singkat',tautan:'Daftar tautan',topik:'Topik bantuan',logos:'Logo klien',fitur:'Daftar fitur',unggul:'Keunggulan',stat:'Angka pencapaian',harga:'Paket harga',testi:'Testimoni',faq:'FAQ',cta:'Ajakan penutup',kategori:'Kategori',produk:'Produk unggulan',nawala:'Langganan email',galeri:'Galeri foto atau karya',tentang:'Tentang',layanan:'Layanan dan tarif',kontak:'Formulir kontak',artikel:'Daftar artikel',booking:'Formulir reservasi',kursus:'Daftar kelas',kpi:'Kartu KPI',grafik:'Grafik tren',tabel:'Tabel data',aktivitas:'Aktivitas terbaru',
 'a-sapa':'Sapaan dan profil','a-cari':'Kolom pencarian','a-banner':'Banner promo','a-kategori':'Ikon kategori','a-produk':'Kisi produk','a-saldo':'Kartu ringkasan angka','a-aksi':'Tombol aksi cepat','a-grafik':'Grafik mini','a-daftar':'Daftar item','a-jadwal':'Pilihan jadwal','a-progres':'Kartu progres','a-peta':'Peta pelacakan',
 'a-kartu':'Kartu bergambar','a-absen':'Kartu absen','a-pemutar':'Pemutar audio','a-mood':'Pilihan suasana hati','a-kursi':'Denah kursi','a-tiket':'E-tiket','a-rak':'Rak sampul buku','a-total':'Total dan tombol bayar','a-status':'Status langkah demi langkah'};
export const NFR_WEB=[
 ['resp','Responsif','Tampilan utuh di lebar layar 360 px sampai 1440 px tanpa gulir horizontal.'],
 ['perf','Cepat dimuat','LCP di bawah 2,5 detik pada jaringan 4G dan skor Lighthouse Performance minimal 90.'],
 ['seo','SEO dasar','Judul dan meta description unik tiap halaman, sitemap.xml, robots.txt, dan tag Open Graph.'],
 ['a11y','Aksesibilitas','Memenuhi WCAG 2.1 AA: kontras teks minimal 4,5:1, bisa dipakai dengan keyboard, gambar punya teks alternatif.'],
 ['sec','Keamanan','HTTPS di semua halaman, validasi input di server, kata sandi di-hash, dan proteksi CSRF pada formulir.'],
 ['ana','Analitik','Kunjungan dan klik tombol utama tercatat, misalnya dengan Google Analytics 4 atau Plausible.'],
 ['i18n','Dua bahasa','Konten tersedia dalam bahasa Indonesia dan Inggris dengan pengalih bahasa di navigasi.'],
 ['cms','Konten mudah diubah','Teks dan gambar bisa diganti lewat CMS tanpa menyentuh kode.']];
const NFR_ON_WEB=['resp','perf','seo','a11y','sec','ana'];
export const NFR_MOBILE=[
 ['plat','Android dan iOS','Berjalan di Android 8 ke atas dan iOS 15 ke atas dari satu basis kode.'],
 ['perf','Cepat dibuka','Layar pertama tampil kurang dari 2 detik pada ponsel kelas menengah, dan gulir tetap mulus di 60 fps.'],
 ['offline','Tahan sinyal buruk','Data terakhir tetap tampil tanpa internet, dan perubahan dikirim ulang saat koneksi kembali.'],
 ['a11y','Aksesibilitas','Ukuran teks mengikuti pengaturan ponsel, area sentuh minimal 44 × 44 pt, dan mendukung pembaca layar.'],
 ['sec','Keamanan','Token masuk disimpan di penyimpanan aman perangkat, semua permintaan lewat HTTPS, dan data pribadi tidak ditulis ke log.'],
 ['push','Notifikasi push','Izin notifikasi diminta saat pertama kali dibutuhkan, dan tiap jenis notifikasi bisa dimatikan.'],
 ['ana','Analitik dan laporan galat','Peristiwa utama dan crash tercatat, misalnya dengan Firebase Analytics dan Crashlytics.'],
 ['i18n','Dua bahasa','Teks antarmuka tersedia dalam bahasa Indonesia dan Inggris.'],
 ['gelap','Mode gelap','Tampilan mengikuti mode terang atau gelap dari sistem.']];
const NFR_ON_MOBILE=['plat','perf','offline','a11y','sec','push','ana'];
export const nfrFor=platform=>platform==='mobile'?NFR_MOBILE:NFR_WEB;
export const nfrOnFor=platform=>platform==='mobile'?NFR_ON_MOBILE:NFR_ON_WEB;
export const STACK_WEB=['Next.js + Tailwind CSS + Supabase, hosting di Vercel','Astro + Tailwind CSS, hosting di Netlify (situs statis)','Laravel + Blade + MySQL, hosting di VPS','WordPress dengan tema kustom','HTML, CSS, dan JavaScript murni','React + Go + PostgreSQL, hosting di VPS','Bebas, ditentukan oleh pembangun'];
export const STACK_MOBILE=['Flutter + Firebase (Android dan iOS)','React Native (Expo) + Supabase','Flutter + backend Go + PostgreSQL','Kotlin (Android) dan Swift (iOS) native','Bebas, ditentukan oleh pembangun'];
export const stackFor=platform=>platform==='mobile'?STACK_MOBILE:STACK_WEB;
// Gaya desain. "ciri" dan "huruf" masuk ke bagian 11 PRD; "cocok" membantu memilih gaya.
export const GAYA={
 bersih:{nama:'Bersih dan modern',pendek:'Bersih',ciri:'Latar putih, banyak ruang kosong, sudut membulat sedang, dan satu warna aksen.',huruf:'Sans-serif modern seperti Plus Jakarta Sans atau Inter untuk judul dan isi.',nada:'Jelas, ringkas, langsung ke inti.',cocok:'Startup dan layanan digital, toko online, marketplace, rekrutmen, aplikasi bisnis, dan dashboard.'},
 hangat:{nama:'Hangat dan ramah',pendek:'Hangat',ciri:'Latar bernuansa warna merek, sudut sangat membulat, dan bentuk yang lembut.',huruf:'Sans-serif yang membulat dan ramah, misalnya Nunito atau Plus Jakarta Sans.',nada:'Akrab dan menenangkan.',cocok:'Restoran dan kafe, klinik keluarga, donasi, booking jasa, pesan antar, dan wisata lokal.'},
 tegas:{nama:'Tegas dan berani',pendek:'Tegas',ciri:'Huruf besar dan tebal, garis hitam, sudut siku, dan bayangan keras.',huruf:'Sans-serif tebal atau condensed untuk judul, misalnya Archivo atau Anton.',nada:'Percaya diri dan lugas.',cocok:'Bengkel dan jasa servis, rental kendaraan, ojek dan antar jemput, komunitas olahraga, dan brand streetwear.'},
 gelap:{nama:'Gelap dan premium',pendek:'Gelap',ciri:'Latar gelap, teks terang, dan warna merek sebagai aksen yang menyala.',huruf:'Sans-serif bersih dengan berat sedang, misalnya Inter atau Manrope.',nada:'Tenang, premium, dan hemat kata.',cocok:'Produk teknologi, kursus coding, studio kebugaran, dan aplikasi keuangan dan arisan.'},
 elegan:{nama:'Elegan dan klasik',pendek:'Elegan',ciri:'Latar putih gading, judul berhuruf serif, garis tipis, tombol bersudut tajam, dan banyak ruang di sekitar teks.',huruf:'Judul serif seperti Playfair Display atau Cormorant, isi sans-serif yang mudah dibaca.',nada:'Sopan, hangat, dan berkesan.',cocok:'Undangan dan perencana pernikahan, hotel dan villa, butik, dan salon.'},
 ceria:{nama:'Ceria dan bersahabat',pendek:'Ceria',ciri:'Warna cerah yang lembut, bentuk bulat besar, tombol kapsul dengan bayangan tebal, dan huruf membulat.',huruf:'Huruf membulat seperti Fredoka atau Baloo 2 untuk judul, Nunito untuk isi.',nada:'Riang, sederhana, dan mudah dipahami semua umur.',cocok:'Sekolah dan les anak, posyandu, laundry, dan antar galon.'},
 minimal:{nama:'Minimal dan rapi',pendek:'Minimal',ciri:'Hampir monokrom, garis rambut, tanpa bayangan, huruf yang rapi, dan foto berukuran besar.',huruf:'Satu keluarga sans-serif dengan berat tipis sampai sedang, misalnya Inter atau Helvetica.',nada:'Singkat, tenang, dan membiarkan karya berbicara.',cocok:'Fotografer, arsitek, company profile, merek fesyen, aplikasi warga, dan alat kerja tim.'},
 gradasi:{nama:'Modern dengan gradasi',pendek:'Gradasi',ciri:'Latar gradasi warna merek, kartu semi transparan, sudut besar, dan tombol kapsul.',huruf:'Sans-serif geometris seperti Plus Jakarta Sans atau Poppins.',nada:'Segar, optimis, dan kekinian.',cocok:'Produk digital, faktur dan kurir, aplikasi petani, dan kebugaran.'},
 teknis:{nama:'Teknis dan terstruktur',pendek:'Teknis',ciri:'Judul berhuruf monospace, garis kisi, label bernomor, dan sudut kecil.',huruf:'Monospace seperti JetBrains Mono untuk judul dan angka, sans-serif untuk isi.',nada:'Tepat, faktual, dan tanpa basa-basi.',cocok:'Dokumentasi, alat untuk developer, ujian online, dashboard data, dan aplikasi absensi.'},
 resmi:{nama:'Resmi dan terpercaya',pendek:'Resmi',ciri:'Bilah navigasi berwarna merek, susunan kolom yang rapi, garis aksen di bawah judul, dan kaki halaman gelap.',huruf:'Sans-serif netral yang mudah dibaca, misalnya Source Sans 3 atau Plus Jakarta Sans.',nada:'Sopan, jelas, dan meyakinkan.',cocok:'Sekolah, masjid dan yayasan, pemerintah desa, koperasi, layanan kesehatan, properti, dan perusahaan jasa.'},
 ukiran:{nama:'Ukiran titik',pendek:'Ukiran',ciri:'Latar hitam pekat dan teks krem, ilustrasi yang diarsir dengan titik-titik (stipple) seperti ukiran lama, judul berhuruf piksel, label monospace kapital, dan sudut siku.',huruf:'Huruf piksel seperti PP Mondwest atau Pixelify Sans untuk judul, monospace seperti IBM Plex Mono untuk label dan isi.',nada:'Tenang, misterius, dan bercerita.',cocok:'Wisata alam dan observatorium, aplikasi meditasi, agensi dan studio kreatif, galeri seni, dan perpustakaan.'},
 halftone:{nama:'Risograf dan halftone',pendek:'Risograf',ciri:'Kertas krem dengan dua warna tinta, pola titik halftone di gambar dan latar, cetakan yang sedikit bergeser, tepi tebal, dan tombol kapsul.',huruf:'Sans-serif tebal yang berkarakter seperti Bricolage Grotesque untuk judul, sans-serif biasa untuk isi.',nada:'Riang, kreatif, dan terasa buatan tangan.',cocok:'Acara dan konser, tiket pertunjukan, portofolio kreatif, toko produk lokal, dan halaman tautan kreator.'},
 retro:{nama:'Retro piksel',pendek:'Retro',ciri:'Latar dengan kisi titik seperti layar dot matrix, huruf piksel, gambar berpola dither, tepi bertitik tebal, dan sudut siku.',huruf:'Huruf piksel seperti Pixelify Sans atau Silkscreen untuk judul dan angka, monospace untuk isi.',nada:'Main-main, nostalgia, dan ringkas.',cocok:'Turnamen gim, aplikasi belajar, aplikasi kasir, alat sales lapangan, dan helpdesk.'},
 editorial:{nama:'Editorial majalah',pendek:'Editorial',ciri:'Kertas krem, judul serif sangat besar, kolom rapi seperti majalah, huruf awal yang besar, dan garis titik-titik di antara nama dan angka.',huruf:'Serif dengan kontras tinggi seperti Fraunces atau Playfair Display untuk judul, sans-serif yang tenang untuk isi.',nada:'Bercerita, cermat, dan berwibawa.',cocok:'Media berita, blog, katering dan menu restoran, buku resep, dan portal lowongan.'},
};
export const WARNA=['#2456e6','#0e7490','#0f766e','#4d7c0f','#c2410c','#be185d','#6d28d9','#9a4f1f','#1f2937'];


// PRD bawaan dengan id-nya sebagai kunci.
export const T=Object.fromEntries(PRD.map(p=>[p.id,p]));
export const TPL_IDS=Object.keys(T);
// PRD yang ditampilkan lebih dulu di landing page: sistem multi-peran, campuran website dan aplikasi, delapan gaya berbeda.
export const UNGGULAN=['marketplace','klinik','m-ojek','restoran','m-posyandu','galeri','m-nikah','invoice'];
export const KATEGORI_LIST=[...new Set(TPL_IDS.map(id=>T[id].kategori))].sort((a,b)=>a.localeCompare(b,'id'));
export const PLATFORM={web:'Website',mobile:'Aplikasi mobile'};
