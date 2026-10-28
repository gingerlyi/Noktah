# Noktah

Perpustakaan PRD (Product Requirements Document) untuk membangun website dan aplikasi mobile. Semua PRD memakai satu struktur baku, sehingga AI builder dan developer membacanya dengan cara yang sama. Noktah tidak membuat PRD dengan AI: isinya disiapkan lebih dulu, lalu pengguna menyesuaikannya.

- **Frontend:** React 19 + Vite + React Router
- **Backend:** Go 1.24 (pustaka standar `net/http`, driver `lib/pq`)
- **Database:** PostgreSQL 16

Isinya:

1. **Perpustakaan** berisi 69 PRD bawaan: 39 untuk website dan 30 untuk aplikasi mobile, dalam 14 gaya desain dan 20 kategori. Tiap PRD menggambarkan sistem utuh, bukan hanya landing page: ada 2 sampai 4 peran (misalnya Pasien, Resepsionis, Dokter, dan Admin klinik) beserta hak aksesnya, halaman tiap peran, alur kerja, dan kebutuhan fungsional yang ditandai perannya. Siapa pun bisa membaca, menyalin, dan mengunduhnya tanpa akun.
1. **Wizard Buat PRD** (`/buat`): pengguna menulis jenis usahanya, memilih satu dari tiga PRD perpustakaan yang paling mirip, lalu mengisi nama usaha, tagline, peran, warna, dan gaya. Nama contoh di seluruh PRD diganti nama usahanya. Hasilnya bisa disalin dan diunduh tanpa akun, atau disimpan ke PRD Saya (terhitung dalam batas paket). Draf disimpan di sessionStorage selama tamu mendaftar.
1. **Prompt AI** (tab ketiga di editor dan halaman detail PRD): PRD dipecah menjadi prompt per fase (fondasi, satu fase per peran dengan P0 lalu P1, lalu penyempurnaan P2 dan NFR) untuk Lovable, Bolt, v0, atau Cursor/Claude Code. Fase pertama terbuka untuk semua; fase lainnya dan unduhan ZIP (PRD.md, prompts/, checklist.md) untuk Premium. ZIP dibuat di peramban tanpa pustaka (`src/lib/zip.js`, diperiksa dengan `node scripts/cek-zip.mjs`).
1. **Riwayat versi** (tombol Riwayat di editor PRD Saya): server menyalin isi lama ke tabel `prd_versions` saat PRD diubah, paling sering tiap 10 menit, sampai 50 versi per PRD. Daftarnya terbuka untuk semua; memulihkan versi untuk Premium. Sebelum memulihkan, isi sekarang ikut disimpan sebagai versi, jadi pemulihan bisa dibatalkan.
1. **Nilai PRD** (0 sampai 100, di editor PRD Saya): pemeriksa struktur ditambah penilaian isi, yaitu nama sendiri, deskripsi dan masalah, target dan tujuan, ukuran keberhasilan yang terukur, kriteria penerimaan P0/P1, batas lingkup, dan alur tiap peran. Tiap kriteria yang belum penuh disertai saran. Bobotnya di `src/lib/nilai.js`, diperiksa dengan `node scripts/cek-nilai.mjs`.
1. **Tautan bagikan** (tombol Bagikan di editor PRD Saya): membuat alamat `/p/<token>` yang bisa dibuka tanpa akun untuk membaca PRD, melihat pratinjau, dan berkomentar. Pemilik bisa menyalin, mencabut tautan, dan menghapus komentar. Komentar dibatasi 8 per 10 menit per IP per PRD, maksimal 500 per PRD, dengan kolom jebakan untuk bot. Data pemilik tidak ikut dikirim.
2. **Pratinjau per peran**: gambaran website atau aplikasi bisa dilihat dari sisi tiap peran, misalnya halaman publik untuk pasien dan panel antrean untuk resepsionis.
3. **PRD Saya** untuk pengguna yang sudah masuk: ambil PRD dari perpustakaan, sesuaikan isi, peran, halaman, dan alurnya di editor, lihat pratinjaunya, lalu salin atau unduh sebagai Markdown.
4. **Pemeriksa struktur** yang berjalan setiap kali isi PRD berubah, termasuk saat teksnya diedit langsung.
5. **Halaman Cara pakai** (`/cara-pakai`) berisi enam langkah memakai Noktah, contoh prompt untuk AI builder, dan tanya jawab.
6. **Dashboard admin** dengan menu samping, statistik, pengelolaan isi perpustakaan, teks landing page, daftar pengguna, pengaturan peran, dan Panduan admin.

## Menjalankan di komputer sendiri

Ekstrak `rancang-prd.zip` ke folder mana saja, lalu buka terminal di folder `rancang-prd` (folder yang berisi `docker-compose.yml`). Di Windows, buka folder itu di File Explorer, klik kolom alamat, ketik `powershell`, lalu tekan Enter.

Ada dua cara menjalankannya:

|                     | Cara 1: Docker                     | Cara 2: tanpa Docker                     |
| ------------------- | ---------------------------------- | ---------------------------------------- |
| Yang perlu dipasang | Docker Desktop saja                | Go, Node.js, dan PostgreSQL              |
| Cocok untuk         | Mencoba dan memakai aplikasinya    | Mengubah kode dan langsung melihat hasilnya |
| Alamat situs        | <http://localhost:8080>            | <http://localhost:5173>                  |
| Alamat login admin  | <http://localhost:8080/admin/masuk> | <http://localhost:5173/admin/masuk>     |

### Cara 1: Docker (disarankan)

1. Pasang [Docker Desktop](https://www.docker.com/products/docker-desktop/), lalu buka aplikasinya dan tunggu sampai statusnya berjalan.
2. Buat berkas pengaturan dari contohnya:

   ```bash
   cp .env.example .env
   ```

   (Di Command Prompt Windows: `copy .env.example .env`.) Buka `.env` dengan editor teks, lalu isi tiga nilai ini:

   - `POSTGRES_PASSWORD`: kata sandi database, huruf dan angka saja.
   - `OWNER_EMAIL`: email akun pemilik, yaitu admin utama.
   - `OWNER_PASSWORD`: kata sandi akun pemilik, minimal 8 karakter.

3. Jalankan:

   ```bash
   docker compose up --build -d
   ```

   Pertama kali butuh beberapa menit karena Docker mengunduh dan membangun semuanya. Berikutnya jauh lebih cepat.

4. Buka <http://localhost:8080>. Untuk masuk sebagai admin, buka <http://localhost:8080/admin/masuk> dan masuk dengan `OWNER_EMAIL` dan `OWNER_PASSWORD`. Halaman login admin sengaja tidak ditautkan dari halaman publik mana pun, jadi simpan alamatnya sebagai bookmark.

Perintah lain:

```bash
docker compose ps            # memeriksa apakah aplikasi dan database berjalan
docker compose logs -f app   # melihat log aplikasi (keluar dengan Ctrl+C)
docker compose stop          # menghentikan sementara
docker compose start         # menyalakan lagi
docker compose down          # menghentikan dan menghapus kontainer (data tetap ada)
docker compose down -v       # menghentikan dan menghapus SEMUA data
```

### Cara 2: tanpa Docker

Butuh Go 1.24 atau lebih baru, Node.js 22 (atau 20.19 ke atas), dan PostgreSQL 13 atau lebih baru.

1. Buat database (cukup sekali):

   ```bash
   psql -U postgres -c "CREATE ROLE rancang LOGIN PASSWORD 'rancang'"
   psql -U postgres -c "CREATE DATABASE rancangprd OWNER rancang"
   ```

2. Jalankan backend di port 8080. Tabel dibuat otomatis saat pertama kali jalan.

   ```bash
   cd backend
   export DATABASE_URL='postgres://rancang:rancang@localhost:5432/rancangprd?sslmode=disable'
   export OWNER_EMAIL='kamu@contoh.id'
   export OWNER_PASSWORD='sandi-pemilik'
   go run ./cmd/server
   ```

   Di PowerShell, ganti `export NAMA='nilai'` dengan `$env:NAMA='nilai'`.

3. Di terminal lain, jalankan frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Buka <http://localhost:5173>. Permintaan ke `/api` diteruskan otomatis ke backend, dan perubahan kode frontend langsung terlihat di peramban.

Untuk menjalankan versi jadi tanpa Docker, bangun frontend lalu arahkan backend ke hasilnya, kemudian buka <http://localhost:8080>:

```bash
cd frontend && npm run build
cd ../backend && STATIC_DIR=../frontend/dist go run ./cmd/server
```

### Memperbarui project yang sudah ada

Bila folder `rancang-prd` versi lama sudah ada di komputermu:

1. Hentikan aplikasinya: `docker compose down`, atau tekan Ctrl+C di terminal backend dan frontend.
2. Pindahkan berkas `.env` lama ke tempat aman.
3. Ganti seluruh isi folder dengan isi zip baru, lalu kembalikan berkas `.env` tadi.
4. Jalankan lagi:
   - Docker: `docker compose up --build -d`. Tanda `--build` wajib supaya kode baru ikut dibangun. Data di database tetap ada.
   - Tanpa Docker: jalankan `npm install` sekali di folder `frontend`, lalu jalankan backend dan frontend seperti biasa.
5. Bila tampilan masih yang lama, muat ulang halaman dengan Ctrl+Shift+R (Cmd+Shift+R di Mac).

### Bila ada kendala

| Gejala | Penyebab dan jalan keluarnya |
| --- | --- |
| `Cannot connect to the Docker daemon` atau `error during connect` | Docker Desktop belum dibuka. Buka aplikasinya, tunggu sampai berjalan, lalu ulangi perintahnya. |
| `port is already allocated` atau `address already in use` | Port 8080 sedang dipakai program lain. Isi `APP_PORT=8081` di `.env`, jalankan `docker compose up -d`, lalu buka <http://localhost:8081>. |
| `Isi POSTGRES_PASSWORD di berkas .env` (atau `OWNER_EMAIL`, `OWNER_PASSWORD`) | Berkas `.env` belum dibuat atau nilainya kosong. Ulangi langkah 2. |
| Situs tidak terbuka dan `docker compose logs app` menampilkan `OWNER_PASSWORD` | Kata sandi pemilik kurang dari 8 karakter. Perbaiki di `.env`, lalu `docker compose up -d`. |
| Situs tidak terbuka dan log menampilkan `password authentication failed` | `POSTGRES_PASSWORD` diubah setelah database pertama kali dibuat. Kembalikan nilai lamanya, atau hapus semua data dengan `docker compose down -v` lalu jalankan lagi. |
| Tidak bisa masuk admin dengan email dan sandi di `.env` | Akun pemilik hanya dibuat saat database belum punya pemilik, jadi mengubah `OWNER_EMAIL` atau `OWNER_PASSWORD` sesudahnya tidak berpengaruh. Masuk dengan nilai yang dipakai pertama kali, atau hapus semua data dengan `docker compose down -v`. |
| "Terlalu banyak percobaan masuk" | Tunggu 15 menit, atau jalankan ulang aplikasinya dengan `docker compose restart app`. |
| <http://localhost:5173> terbuka tetapi data tidak muncul atau tidak bisa masuk | Backend belum berjalan di port 8080. Periksa terminal backend. |

### Pratinjau tanpa server

Untuk sekadar melihat tampilan tanpa Go dan PostgreSQL:

```bash
cd frontend
npm install
npm run build:demo
npm run preview:demo
```

Lalu buka <http://localhost:4173>. Di mode ini `src/lib/api.js` diganti `src/lib/api.demo.js`: data contoh disimpan di peramban, tidak ada kata sandi, dan halaman admin dibuka lewat bilah "Pratinjau" di bagian atas. Mode ini hanya untuk pratinjau, bukan untuk dipakai sungguhan.

## Memasang di server (VPS)

Contoh untuk VPS Ubuntu 22.04/24.04 (minimal 1 GB RAM) dengan domain sendiri, memakai Docker dan Caddy untuk HTTPS otomatis.

1. Arahkan domain ke server: buat record **A** `noktah.contoh.id` berisi IP server.
2. Masuk ke server lewat SSH, lalu pasang Docker, Caddy, dan firewall:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo apt install -y caddy
   sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable
   ```
3. Salin folder project ke server (tanpa `node_modules` dan `dist`), misalnya ke `/opt/noktah`.
4. Buat `.env` dari `.env.example` dan isi untuk produksi:
   ```env
   POSTGRES_PASSWORD=<sandi acak panjang>
   OWNER_EMAIL=kamu@domainmu.id
   OWNER_PASSWORD=<sandi kuat>
   APP_PORT=127.0.0.1:8080
   COOKIE_SECURE=true
   TRUST_PROXY=true
   UPGRADE_URL=https://wa.me/62812xxxxxxx
   ```
   `APP_PORT=127.0.0.1:8080` membuat aplikasi hanya bisa dibuka lewat Caddy, bukan langsung dari internet.
5. Jalankan: `cd /opt/noktah && sudo docker compose up -d --build`
6. Isi `/etc/caddy/Caddyfile`, lalu `sudo systemctl reload caddy`. Caddy mengambil sertifikat HTTPS sendiri.
   ```
   noktah.contoh.id {
       reverse_proxy 127.0.0.1:8080
   }
   ```
7. Buka `https://noktah.contoh.id`, lalu masuk sebagai admin di `/admin/masuk`.

**Memperbarui:** dari laptop (PowerShell, di folder project) jalankan `.\deploy.ps1 -Server user@alamat-server`. Skrip mengemas project tanpa `node_modules`, `dist`, dan `.env`, mengunggahnya, lalu menjalankan `docker compose up -d --build` di server. `.env` dan data database di server tidak tersentuh, dan migrasi database berjalan sendiri.

**Cadangan harian** (crontab root, `sudo crontab -e`):
```
0 3 * * * cd /opt/noktah && docker compose exec -T db pg_dump -U rancang rancangprd | gzip > /opt/cadangan/noktah-$(date +\%F).sql.gz
```

## Cara memakai aplikasi

- **Pengunjung dan pengguna:** halaman **Cara pakai** (`/cara-pakai`, ada di navigasi atas dan di kaki halaman) menjelaskan enam langkah: memilih PRD, membaca isinya dari sisi tiap peran, menyesuaikan dengan usaha sendiri, mengatur peran, halaman, dan alur, memastikan lencana "Sesuai struktur", lalu memberikan PRD ke AI builder atau developer. Di halaman itu ada tombol untuk menyalin contoh prompt.
- **Admin:** masuk lewat `/admin/masuk`, lalu buka **Panduan admin** di menu samping (`/admin/panduan`). Isinya cara masuk dan keluar, tabel hak tiap peran admin (peranmu sendiri ditandai), tugas-tugas admin, dan cara menambah PRD bawaan. Tugas yang tidak boleh dikerjakan peranmu ditandai terkunci beserta peran yang boleh mengerjakannya.

## Struktur PRD

Setiap PRD mengikuti struktur `rancang-prd/v2`. Halaman **Struktur PRD** di aplikasi menjelaskannya untuk pengguna; ringkasnya:

- Dokumen diawali blok metadata (`struktur`, `nama`, `platform`, `jenis`, `peran`, `bahasa`, `status`, `tanggal`) dan judul `# PRD: Nama proyek`.
- Ada 18 bagian dengan nomor, judul, dan urutan yang tetap: Ringkasan, Masalah, Target pengguna, Peran dan hak akses, Tujuan dan ukuran keberhasilan, Ruang lingkup, Struktur halaman (atau Daftar layar), Alur utama, Kebutuhan fungsional, Susunan halaman utama (atau Susunan layar utama), Model data, Kebutuhan non-fungsional, Desain, Teknologi, Tahapan pengerjaan, Kriteria selesai, Pertanyaan terbuka, dan Instruksi untuk AI.
- **Peran dan hak akses** (bagian 4) dibuka dengan tabel peran, siapa, dan cara masuk, lalu satu blok per peran:

  ```markdown
  ### Resepsionis
  - **Bisa:**
    - Memanggil dan melewati nomor antrean
    - Mencatat pembayaran dan mencetak kuitansi
  - **Tidak bisa:**
    - Membuka catatan pemeriksaan dokter
  - **Halaman:** Antrean hari ini, Daftar pasien, Pendaftaran langsung, Kasir
  ```

- **Struktur halaman** (bagian 7) dikelompokkan per peran, dan **Alur utama** (bagian 8) ditulis sebagai langkah bernomor:

  ```markdown
  ### Alur 2: Memanggil antrean pagi
  - **Peran:** Resepsionis
  1. Membuka Antrean hari ini untuk poli umum
  2. Memanggil nomor berikutnya sehingga tampil di layar ruang tunggu
  3. Melewati pasien yang belum datang
  ```

- Tiap kebutuhan fungsional ditulis sebagai satu blok yang menyebut perannya:

  ```markdown
  ### FR-02: Ambil antrean online
  - **Prioritas:** P0
  - **Peran:** Pasien
  - **Deskripsi:** Pilih poli, dokter, dan tanggal, lalu isi data pasien atau pilih anggota keluarga yang pernah didaftarkan.
  - **Kriteria penerimaan:**
    - [ ] Antrean online dibuka mulai H-3 sampai 1 jam sebelum praktik dimulai
    - [ ] Pasien menerima nomor antrean dan perkiraan jam dilayani lewat WhatsApp
  ```

Pengguna bebas mengubah isi, tetapi tidak susunannya. Pemeriksa struktur melaporkan dua tingkat masalah:

- **Wajib** (melanggar struktur): bagian hilang, urutan tertukar, isi kosong, peran tanpa daftar "Bisa", alur atau FR yang memakai peran yang tidak ada di bagian 4, alur dengan kurang dari dua langkah, atau blok FR yang tidak lengkap.
- **Saran** (sah tetapi sebaiknya dilengkapi): kebutuhan P0 tanpa kriteria penerimaan, peran yang belum punya halaman, atau peran yang belum dipakai di alur maupun kebutuhan fungsional mana pun.

Dokumen dengan struktur lama `rancang-prd/v1` dikenali dan pengguna diminta membuatnya ulang dari formulir. Aturan struktur, pembuat dokumen, dan pemeriksanya ada di satu berkas: `frontend/src/lib/prd.js`.

## Isi perpustakaan

Tiap PRD bawaan punya isi lengkap untuk 18 bagian, contoh nama usaha, warna merek, gaya desain, dan contoh isi tampilan untuk tiap peran. Di aplikasi, tiap PRD menjelaskan dirinya di tiga tempat:

- **Kartu perpustakaan:** ringkasan, baris "Cocok untuk" berisi dua jenis usaha pertama, platform, gaya desain, dan jumlah peran.
- **Halaman detail:** panel **Isi PRD ini** (peran beserta halamannya, alur utama, kebutuhan fungsional beserta yang wajib, susunan halaman utama, entitas data, dan bagian lainnya) dan panel **Design brief** (ciri gaya, alasan desainnya, palet warna merek, latar, dan teks beserta kontrasnya, huruf, ukuran, label status, gambar dan ikon, hal yang dihindari, nada bahasa, daftar jenis usaha yang cocok, dan tautan ke PRD lain bergaya sama). Tab pratinjau punya pilihan peran, sehingga halaman pertama tiap peran bisa dilihat: halaman publik, panel kerja dengan menu samping, atau layar aplikasi.
- **Dokumen PRD:** bagian 13 (Desain) adalah design brief: kesan yang dituju, gaya visual, huruf, gambar dan ikon, hal yang dihindari, warna merek, latar, dan teks, kontras WCAG untuk teks tombol dan untuk warna merek sebagai teks (beserta saran bila kurang dari 4,5:1), ukuran (skala huruf, jarak, sudut, dan garis), komponen utama (navigasi tiap peran, tombol utama, kartu, kolom isian, tabel, dan label status beserta warnanya), keadaan layar (kosong untuk halaman pertama tiap peran, memuat, galat, berhasil, dan tanpa internet di aplikasi), serta nada bahasa. Data tiap gaya ada di `GAYA` pada `src/lib/catalog.js`; label status diambil dari kolom Status di contoh tabel PRD dan diberi warna lewat `NADA_STATUS` di `src/lib/prd.js`. Bagian 10 menulis judul yang tampil di halaman bila berbeda dari nama bagiannya, misalnya `Testimoni (judul: "Ucapan dan doa")` pada undangan, supaya AI tahu maksudnya.

Perpustakaan bisa disaring per platform, gaya desain, dan kategori, serta dicari dengan nama, jenis usaha, atau nama peran. Hasil pencarian yang kata utuhnya ada di nama PRD tampil paling atas, jadi "kos" mendahulukan aplikasi cari kos daripada PRD yang hanya memuat kata "kosong". Filter juga bisa dibuka lewat alamat, misalnya `/perpustakaan?gaya=elegan` atau `/perpustakaan?platform=mobile&kategori=Kesehatan`. Landing page menampilkan 8 PRD pilihan (`UNGGULAN` di `catalog.js`), contoh PRD yang dilihat dari sisi tiap perannya, dan galeri 14 gaya yang masing-masing membuka perpustakaan dengan gaya itu.

| Gaya | Cocok untuk | PRD di perpustakaan |
| --- | --- | --- |
| Bersih dan modern | Startup dan layanan digital, toko online, marketplace, portal lowongan, aplikasi bisnis, dan dashboard | Landing page produk, Portal lowongan kerja, CRM penjualan, Marketplace multi-penjual, Situs karier dan sistem rekrutmen, Aplikasi belanja (mobile), Aplikasi cari kos (mobile) |
| Hangat dan ramah | Kuliner dan katering, kafe, klinik keluarga, produk rumahan, donasi, pesan antar, dan wisata lokal | Toko online, Reservasi dan booking, Restoran dan menu online, Donasi dan galang dana, Katering langganan dan acara, Aplikasi pesan antar (mobile), Aplikasi panduan wisata (mobile) |
| Tegas dan berani | Portofolio kreatif, bengkel dan jasa servis, rental kendaraan, ojek dan antar jemput, komunitas olahraga, dan brand streetwear | Portofolio pribadi, Bengkel dan jasa servis, Rental mobil, Aplikasi booking (mobile), Aplikasi komunitas olahraga (mobile), Aplikasi ojek online lokal (mobile), Aplikasi antar jemput sekolah (mobile) |
| Gelap dan premium | Produk teknologi, kursus coding, agensi kreatif, studio kebugaran, aplikasi keuangan dan arisan, turnamen gim, dan konser | Kursus online, Agensi kreatif, Studio kebugaran, Aplikasi pencatat keuangan (mobile), Aplikasi tiket pertunjukan (mobile), Aplikasi arisan kelompok (mobile), Aplikasi turnamen esports (mobile) |
| Elegan dan klasik | Undangan dan perencana pernikahan, hotel dan villa, media berita dan blog, perpustakaan, butik, dan salon | Blog atau media, Undangan pernikahan digital, Hotel dan villa, Portal berita daerah, Salon dan spa dengan booking, Aplikasi perpustakaan digital (mobile), Aplikasi perencana pernikahan (mobile) |
| Ceria dan bersahabat | Sekolah dan les anak, aplikasi belajar, posyandu, laundry, antar galon, resep masakan, dan halaman kreator | Profil sekolah dan PPDB, Halaman tautan kreator, Aplikasi belajar (mobile), Aplikasi resep masakan (mobile), Aplikasi laundry antar jemput (mobile), Aplikasi posyandu dan tumbuh kembang (mobile), Aplikasi pesan galon dan gas (mobile) |
| Minimal dan rapi | Fotografer, arsitek, galeri seni, company profile, merek fesyen, aplikasi warga, dan alat kerja tim | Company profile, Portofolio fotografer, Manajemen proyek tim, Galeri seni online, Aplikasi kasir UMKM (mobile), Aplikasi warga perumahan (mobile), Aplikasi jual beli barang bekas (mobile) |
| Modern dengan gradasi | Produk digital, acara dan konferensi, open trip, faktur dan kurir, aplikasi petani, serta kebugaran dan kesehatan mental | Event dan konferensi, Open trip dan paket wisata, Faktur dan penagihan, Aplikasi kebiasaan dan kebugaran (mobile), Aplikasi meditasi dan suasana hati (mobile), Aplikasi kurir paket dalam kota (mobile), Aplikasi pendamping petani (mobile) |
| Teknis dan terstruktur | Dokumentasi dan helpdesk, alat untuk developer, ujian online, dashboard data, dan aplikasi internal seperti absensi dan sales | Dashboard atau web app, Pusat bantuan dan dokumentasi, Helpdesk dan tiket dukungan, Ujian online sekolah, Aplikasi absensi karyawan (mobile), Aplikasi sales lapangan (mobile) |
| Resmi dan terpercaya | Sekolah, masjid dan yayasan, pemerintah desa, koperasi, layanan kesehatan, properti, dan perusahaan jasa | Listing properti, Masjid dan yayasan, Klinik dan antrean online, Website desa dan layanan surat, Koperasi simpan pinjam, Aplikasi konsultasi dokter (mobile), Aplikasi orang tua murid (mobile) |

Gaya desain didefinisikan di `GAYA` pada `frontend/src/lib/catalog.js` (nama, ciri, huruf, nada bahasa, dan kecocokan), sedangkan tampilannya di pratinjau diatur oleh aturan `.mock[data-gaya="..."]` di `frontend/src/styles.css`. Gaya Elegan memakai huruf Playfair Display dan gaya Ceria memakai Fredoka, keduanya dimuat dari Google Fonts.

## Navigasi

- **Navigasi publik** berisi Beranda, Perpustakaan, Struktur PRD, Cara pakai, dan PRD Saya. Tautan Admin hanya muncul setelah seseorang masuk dengan akun berperan admin. Pengguna yang sudah masuk mendapat menu akun (nama, PRD Saya, Cara pakai, Keluar) yang bisa dipakai dengan papan ketik. Di layar di bawah 1140 px, tautan pindah ke menu garis tiga.
- **Dashboard admin** punya menu samping yang tetap di tempatnya, dikelompokkan menjadi Ringkasan, Konten, Akses, dan Bantuan. Menu yang tidak boleh dibuka peran admin tersebut tidak ditampilkan. Bilah atas berisi jejak halaman (misalnya "Admin / Perpustakaan / Ubah PRD"), tombol tema, tombol Lihat situs, dan menu akun. Di layar di bawah 1000 px, menu samping menjadi laci yang dibuka dengan tombol garis tiga dan ditutup dengan Escape, tombol tutup, atau ketukan di luar laci. Keluar dari dashboard kembali ke beranda.
- Halaman Perpustakaan di dashboard admin bisa dicari dan disaring per platform dan status (tampil atau disembunyikan).

## Tampilan dan warna

Tampilannya dominan putih dengan satu gradasi sebagai aksen. Seluruh warna diatur lewat token di bagian atas `frontend/src/styles.css`:

- `--accent` dan `--accent-2` adalah ujung awal dan ujung akhir gradasi. Tombol utama, logo, frasa judul di landing page, tab aktif, grafik, dan blok penutup memakai gradasi ini (`--grad`). Tautan dan garis fokus memakai `--accent` polos.
- Untuk mengganti warna situs, ubah kedua token itu di blok `:root` (mode terang) dan di dua blok mode gelap. Warna turunannya dihitung otomatis. Di mode terang, pilih dua warna yang cukup gelap supaya teks putih di atas tombol tetap terbaca.
- Merah (`--danger`) hanya dipakai untuk pesan galat dan tombol hapus.
- Mode terang adalah bawaan untuk semua pengunjung, apa pun setelan perangkatnya. Mode gelap hanya aktif bila dipilih lewat tombol tema, dan pilihan itu diingat di peramban.
- Landing page punya animasi: demo di bagian atas (dokumen PRD ditulis baris demi baris dan hasilnya tersusun di sebelahnya, berganti antara tiga contoh, bisa dijeda), angka yang menghitung naik, pemeriksa struktur yang mencentang 18 bagian saat halaman digulir, dan kartu perpustakaan serta kartu galeri gaya yang menggulir pratinjau website saat disorot. Alatnya ada di `frontend/src/components/Motion.jsx` dan `HeroDemo.jsx`.
- Semua animasi mati bila pengunjung menyalakan "kurangi gerakan" (prefers-reduced-motion) di perangkatnya, dan semua isi tetap terlihat tanpa animasi.
- Pratinjau tiap PRD memakai warna merek PRD itu sendiri (kolom "Warna merek" di editor), karena menggambarkan website atau aplikasi yang akan dibangun, bukan Noktah.

## Akun dan peran

Akun pemilik dibuat otomatis dari `OWNER_EMAIL` dan `OWNER_PASSWORD` saat aplikasi pertama kali jalan. Admin masuk lewat `/admin/masuk`; tautan "Admin" di navigasi baru muncul setelah seseorang masuk dengan akun berperan admin. Orang lain mendaftar sendiri lewat halaman Daftar, lalu pemilik memberi peran di **Dashboard admin → Peran**.

| Hak                         | Pemilik | Admin | Pengelola konten | Analis | Pengguna |
| --------------------------- | :-----: | :---: | :--------------: | :----: | :------: |
| Mengambil dan menyimpan PRD |   Ya    |  Ya   |        Ya        |   Ya   |    Ya    |
| Lihat dashboard dan panduan |   Ya    |  Ya   |        Ya        |   Ya   |    –     |
| Kelola perpustakaan         |   Ya    |  Ya   |        Ya        |   –    |    –     |
| Ubah teks landing page      |   Ya    |  Ya   |        Ya        |   –    |    –     |
| Lihat daftar pengguna       |   Ya    |  Ya   |        –         |   –    |    –     |
| Atur peran                  |   Ya    |   –   |        –         |   –    |    –     |

Semua hak diperiksa di server (`backend/internal/api/server.go`), bukan hanya disembunyikan di tampilan. Admin tidak bisa membuka isi PRD milik pengguna lain.

Peran admin di atas berbeda dengan peran di dalam PRD (misalnya Pasien dan Dokter): peran admin mengatur siapa yang boleh mengelola Noktah, sedangkan peran di dalam PRD adalah pengguna sistem yang akan dibangun.

## Paket Gratis dan Premium

- **Gratis:** semua PRD perpustakaan bisa dibaca, dipratinjau, disalin, dan diunduh; akun Gratis bisa menyimpan **1 PRD** di PRD Saya.
- **Premium:** menyimpan sampai 300 PRD. Staf (peran selain Pengguna) selalu mendapat semua fitur.
- Batasnya diperiksa di server (`freePRDLimit` di `backend/internal/api/prds.go`). Bila Premium berakhir, PRD yang sudah ada tetap bisa dibuka dan diubah.
- **Pembayaran belum otomatis.** Halaman **Harga** (`/harga`, harganya diubah di `frontend/src/pages/Pricing.jsx`) membuka `UPGRADE_URL`. Setelah pembayaran diterima, admin membuka **Dashboard admin → Pengguna** dan menekan **+30 hari** atau **+1 tahun** (dihitung dari akhir langganan yang masih berjalan), atau **Cabut**.

## Pengaturan

| Variabel         | Bawaan         | Keterangan                                                           |
| ---------------- | -------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`   | (wajib)        | Alamat koneksi PostgreSQL. Di Docker Compose sudah disusun otomatis. |
| `OWNER_EMAIL`    | kosong         | Email akun pemilik. Dipakai hanya bila belum ada pemilik.            |
| `OWNER_PASSWORD` | kosong         | Kata sandi akun pemilik, minimal 8 karakter.                         |
| `OWNER_NAME`     | `Pemilik`      | Nama akun pemilik.                                                   |
| `PORT`           | `8080`         | Port server. Di Docker, port di komputermu diatur lewat `APP_PORT`.  |
| `STATIC_DIR`     | `./public`     | Folder hasil build frontend.                                         |
| `COOKIE_SECURE`  | `false`        | Isi `true` bila situs dibuka lewat HTTPS.                            |
| `ALLOW_REGISTER` | `true`         | Isi `false` untuk menutup pendaftaran akun baru.                     |
| `SESSION_DAYS`   | `30`           | Lama sesi login, dalam hari.                                         |
| `APP_TIMEZONE`   | `Asia/Jakarta` | Zona waktu untuk batas hari pada grafik dashboard.                   |
| `UPGRADE_URL`    | kosong         | Tautan tombol Upgrade di halaman Harga, misalnya `https://wa.me/62…`. |
| `TRUST_PROXY`    | `false`        | Isi `true` di belakang Caddy/Nginx supaya pembatas laju memakai IP pengunjung. |

## Menambah PRD ke perpustakaan

Ada dua cara:

- **Lewat dashboard admin** (tanpa menyentuh kode): buka **Dashboard admin → Perpustakaan**, pilih PRD dasar, tekan **Tambah PRD**, ubah isinya, lalu tampilkan. PRD baru awalnya disembunyikan sampai kamu menampilkannya. PRD ini tersimpan di database dan memakai tampilan pratinjau serta pilihan teknologi dari PRD dasarnya.
- **Lewat kode** (untuk PRD bawaan):
  1. Buat berkas baru di `frontend/src/katalog/`, satu berkas per PRD. Cara termudah adalah menyalin PRD yang paling mirip, misalnya `klinik.js` untuk website dengan beberapa peran atau `m-ojek.js` untuk aplikasi mobile dengan panel web. Format lengkapnya dijelaskan di bagian atas `katalog/index.js`.
  2. Impor berkas itu di `katalog/index.js` dan tambahkan ke daftar `PRD`. Urutan di daftar itu menjadi urutan di perpustakaan.
  3. Daftarkan id-nya di `builtinTemplates` pada `backend/internal/api/admin.go`, lalu periksa kecocokannya dengan `node scripts/cek-id-bawaan.mjs` dari folder `frontend`.
  4. Jalankan `node scripts/cek-katalog.mjs` dari folder `frontend`. Skrip ini gagal bila ada isian wajib yang kosong, kurang dari 3 kelompok target pengguna, peran tanpa halaman, alur, atau daftar "tidak bisa", kebutuhan P0 tanpa kriteria penerimaan, atau catatan dari pemeriksa struktur. Hal yang sering terlewat: nama halaman harus berbeda antarperan, setiap peran dipakai di minimal satu alur atau kebutuhan fungsional, dan kebutuhan P0 punya kriteria penerimaan.
  5. Bila ingin PRD itu tampil di landing page, tambahkan id-nya ke `UNGGULAN` di `frontend/src/lib/catalog.js`.

Saat dibangun untuk situs biasa, seluruh katalog dijadikan satu berkas JavaScript tersendiri (`katalog-*.js`) di samping berkas aplikasi dan pustaka React, sehingga peramban bisa menyimpannya terpisah. Pengaturannya ada di `frontend/vite.config.js`.

## Struktur folder

```
rancang-prd/
├── docker-compose.yml        PostgreSQL + aplikasi
├── Dockerfile                build frontend, build backend, image akhir
├── .env.example              contoh pengaturan
├── backend/
│   ├── cmd/server/main.go    titik mulai server
│   └── internal/
│       ├── api/              rute, middleware, handler (auth, PRD, admin, berkas statis)
│       ├── auth/             hash kata sandi dan token sesi
│       ├── config/           pembacaan variabel lingkungan
│       └── store/            semua query PostgreSQL dan migrasi (migrations/*.sql)
└── frontend/
    ├── scripts/cek-id-bawaan.mjs  memastikan daftar PRD bawaan di backend sama dengan katalog
    ├── scripts/cek-katalog.mjs    memastikan tiap PRD bawaan lengkap
    └── src/
        ├── main.jsx          daftar rute
        ├── styles.css        seluruh gaya; token warna (--accent, --accent-2) ada di bagian atas
        ├── katalog/          69 PRD bawaan, satu berkas per PRD, dan index.js berisi urutan serta formatnya
        ├── lib/
        │   ├── catalog.js    gaya desain, pilihan teknologi, bagian halaman, PRD pilihan
        │   ├── prd.js        struktur baku, pembuat dokumen, pemeriksa struktur
        │   ├── mock.js       pratinjau website, panel kerja tiap peran, dan layar aplikasi
        │   ├── api.js, app.jsx  klien API dan keadaan bersama
        │   └── api.demo.js   pengganti API untuk mode pratinjau tanpa server
        ├── components/       editor PRD, kisi perpustakaan, navigasi dan menu akun, contoh peran, demo hero, animasi
        └── pages/            landing, perpustakaan, struktur, cara pakai, masuk/daftar, PRD Saya
            └── admin/        tata letak admin, dashboard, perpustakaan, landing page, pengguna dan peran, panduan admin
```

## API

Semua alamat diawali `/api`. Permintaan selain GET wajib membawa header `X-Requested-With: rancang-prd`.

| Metode dan alamat                    | Akses       | Fungsi                                              |
| ------------------------------------ | ----------- | --------------------------------------------------- |
| `GET /public`                        | semua       | Teks landing page dan PRD perpustakaan buatan admin |
| `POST /auth/register`, `/auth/login` | semua       | Daftar dan masuk                                    |
| `POST /auth/logout`, `GET /auth/me`  | semua       | Keluar dan data akun yang sedang masuk              |
| `GET/POST /prds`                     | sudah masuk | Daftar dan buat PRD milik sendiri                   |
| `GET/PUT/DELETE /prds/{id}`          | pemilik PRD | Buka, simpan, hapus                                 |
| `GET /admin/stats`                   | hak `dash`  | Angka dashboard                                     |
| `GET/POST /admin/templates`          | hak `tpl`   | Daftar dan tambah PRD perpustakaan buatan admin     |
| `PUT/DELETE /admin/templates/{id}`   | hak `tpl`   | Ubah dan hapus PRD perpustakaan buatan admin        |
| `PUT /admin/builtin-templates`       | hak `tpl`   | Menyembunyikan PRD bawaan                           |
| `PUT /admin/site`                    | hak `site`  | Teks landing page                                   |
| `GET /admin/users`                   | hak `users` | Daftar pengguna                                     |
| `PUT /admin/users/{id}/role`         | hak `roles` | Mengubah peran                                      |

PRD bawaan ada di kode frontend, jadi tidak lewat API. Di database, PRD perpustakaan buatan admin disimpan di tabel `templates`.

## Keamanan

- **Kata sandi** di-hash dengan PBKDF2-HMAC-SHA256, 600.000 iterasi, salt acak per akun.
- **Sesi** memakai token acak di cookie `HttpOnly` dan `SameSite=Lax`. Database hanya menyimpan hash SHA-256 dari token.
- **CSRF** dicegah dengan header khusus yang tidak bisa dikirim situs lain, ditambah `SameSite=Lax`.
- **Percobaan masuk** dibatasi 10 kali per 15 menit untuk tiap pasangan email dan alamat IP.
- **PRD** selalu dicari bersama id pemiliknya, jadi PRD orang lain terbaca sebagai tidak ada.
- **Header** `Content-Security-Policy`, `X-Frame-Options`, dan `X-Content-Type-Options` dipasang di semua jawaban.

Sebelum dipakai di internet:

1. Pasang HTTPS di depan aplikasi (misalnya dengan Caddy atau Nginx) dan isi `COOKIE_SECURE=true`.
2. Pakai kata sandi yang kuat untuk `POSTGRES_PASSWORD` dan `OWNER_PASSWORD`.
3. Cadangkan database secara rutin: `docker compose exec db pg_dump -U rancang rancangprd > cadangan.sql`.

## Yang belum ada

- Ubah kata sandi, lupa kata sandi, dan verifikasi email.
- Pembatas percobaan masuk disimpan di memori, jadi kembali nol saat server dimulai ulang dan tidak dibagi antar beberapa server.
- Tes otomatis untuk frontend.

## Pengujian

```bash
cd backend && go test ./...
cd frontend && node scripts/cek-id-bawaan.mjs && node scripts/cek-katalog.mjs
```

Tes Go mencakup hash kata sandi, pemeriksaan isi PRD, pembatas laju, dan tabel hak peran. `cek-katalog.mjs` memastikan tiap PRD bawaan lengkap dan dokumennya lolos pemeriksa struktur tanpa catatan. `cek-id-bawaan.mjs` memastikan daftar PRD bawaan di `admin.go` sama dengan katalog frontend, karena server memakai daftar itu untuk menerima PRD dasar saat admin menambah PRD dan saat admin menyembunyikan PRD bawaan.
