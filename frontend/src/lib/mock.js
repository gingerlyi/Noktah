// Maket website: mengubah isi PRD menjadi HTML pratinjau. Semua teks dari pengguna di-escape dengan e().
// Isi contoh (foto, harga, daftar) diambil dari katalog lewat T[s.tpl].isi; nama, tagline, tombol,
// warna, gaya, halaman, fitur, dan bagian yang dipilih mengikuti PRD.
import {GAYA,T} from './catalog.js';
import {e,fiturPeran,halamanPeran,kontras,lines,panelPeran,peranAktif} from './prd.js';

// Angka KPI yang panjang (misalnya "Rp 12.450.000" atau "2.640 kotak") memakai huruf lebih kecil agar tetap satu baris.
const kpiPanjang=v=>String(v).length>8?' class="long"':'';

const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const hex=a=>'#'+a.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
const mix=(a,b,t)=>hex(rgb(a).map((v,i)=>v+(rgb(b)[i]-v)*t));
function lum(h){const [r,g,b]=rgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b}
// Teks di atas warna aksen: putih atau hitam, mana yang kontrasnya lebih tinggi (sama dengan design brief).
export function accentFor(s){
  let a=/^#[0-9a-f]{6}$/i.test(s.warna)?s.warna:'#2456e6';
  const g=GAYA[s.gaya];
  if((s.gaya==='gelap'||(g?.t&&lum(g.latar)<.2))&&lum(a)<.16)a=mix(a,'#ffffff',.38);
  return {a,on:kontras(a,'#ffffff')>=kontras(a,'#14171f')?'#ffffff':'#14171f'};
}

// Atribut gaya untuk akar maket. Gaya dari data (katalog/gaya-*.js) membawa palet, huruf, sudut, dan garis sebagai
// variabel CSS, serta ciri tambahan sebagai atribut data-* (lihat "Gaya dari data" di mock.css).
// Dipakai sebagai teks di HTML maket dan sebagai objek di React (DesignBrief).
export function gayaProps(s){
  const {a,on}=accentFor(s),g=GAYA[s.gaya],t=g?.t;
  const style={'--m-accent':a,'--m-on':on},data={'data-gaya':s.gaya};
  if(t){
    Object.assign(style,{'--m-bg':g.latar,'--m-surface':t.surface,'--m-fg':g.teks,'--m-muted':t.muted,'--m-line':t.line,'--m-r':g.sudut+'px','--m-bw':g.garis+'px','--f-display':t.fd,'--f-body':t.fb});
    data['data-tok']='';
    for(const k of ['bayang','pola','judul'])if(t[k])data['data-'+k]=t[k];
    if(g.kapsul)data['data-kapsul']='';
    if(lum(g.latar)<.2)data['data-gelap']='';
  }
  return {style,data};
}
const gayaAttr=s=>{const {style,data}=gayaProps(s);return Object.entries(data).map(([k,v])=>` ${k}="${e(v)}"`).join('')+` style="${e(Object.entries(style).map(([k,v])=>k+':'+v).join(';'))}"`};

/* ---------- Maket website ---------- */
/* Ilustrasi pengganti foto: dipilih dari kata di label foto (misalnya "Foto rendang"), atau dari kategori dan nama
   PRD bila labelnya umum. Digambar sebagai SVG di dalam maket, warnanya mengikuti warna aksen PRD (lihat .m-img di CSS).
   Kelas: i-a aksen, i-d aksen gelap, i-s aksen lembut, i-w putih, i-l garis putih, i-la garis aksen. */
const ILUS={
 piala:'<ellipse class="i-d" cx="100" cy="124" rx="44" ry="5" opacity=".18"/><path class="i-la" d="M74 56h-10a12 12 0 0 0 12 22M126 56h10a12 12 0 0 1-12 22"/><path class="i-a" d="M72 42h56v22a28 28 0 0 1-56 0z"/><rect class="i-d" x="94" y="90" width="12" height="16"/><rect class="i-a" x="76" y="104" width="48" height="16" rx="4"/><path class="i-l" d="M86 54v10"/>',
 klinik:'<ellipse class="i-d" cx="100" cy="126" rx="46" ry="5" opacity=".18"/><rect class="i-w" x="62" y="40" width="76" height="76" rx="20"/><path class="i-a" d="M92 56h16v18h18v16h-18v18H92V90H74V74h18z"/><path class="i-la" d="M34 96h18l8-14 10 26 8-12h10" stroke-width="4"/>',
 masjid:'<rect class="i-s" x="46" y="60" width="9" height="62" rx="2"/><rect class="i-s" x="145" y="60" width="9" height="62" rx="2"/><path class="i-s" d="M44 62l6-14 6 14zM143 62l6-14 6 14z"/><rect class="i-d" x="64" y="84" width="72" height="38" rx="2"/><path class="i-a" d="M68 86a32 32 0 0 1 64 0z"/><path class="i-w" d="M92 122v-14a8 8 0 0 1 16 0v14z"/><circle class="i-w" cx="100" cy="48" r="4"/>',
 minum:'<ellipse class="i-s" cx="96" cy="123" rx="46" ry="7"/><path class="i-la" d="M124 74h8a12 12 0 0 1 0 24h-10"/><path class="i-a" d="M64 62h64l-7 54a8 8 0 0 1-8 7H79a8 8 0 0 1-8-7z"/><ellipse class="i-d" cx="96" cy="63" rx="31" ry="4"/><path class="i-l" d="M84 50c-5-7 5-11 0-18M98 48c-5-7 5-11 0-18M112 50c-5-7 5-11 0-18"/>',
 makan:'<ellipse class="i-d" cx="100" cy="124" rx="52" ry="6" opacity=".18"/><path class="i-s" d="M58 84c6-24 78-24 84 0z"/><circle class="i-d" cx="84" cy="72" r="5"/><circle class="i-w" cx="104" cy="68" r="4"/><circle class="i-d" cx="118" cy="75" r="4"/><path class="i-a" d="M46 84h108a54 38 0 0 1-108 0z"/><rect class="i-w" x="44" y="80" width="112" height="7" rx="3.5"/><path class="i-l" d="M84 50c-5-7 5-11 0-18M100 46c-5-7 5-11 0-18M116 50c-5-7 5-11 0-18"/>',
 kendaraan:'<ellipse class="i-d" cx="102" cy="120" rx="64" ry="5" opacity=".18"/><path class="i-a" d="M42 106V92a8 8 0 0 1 6-8l20-4 16-16a10 10 0 0 1 7-3h34a10 10 0 0 1 8 4l14 17 12 2a8 8 0 0 1 7 8v14z"/><path class="i-w" d="M88 68h16v14H76zM112 68h14l10 14h-24z"/><circle class="i-d" cx="72" cy="108" r="12"/><circle class="i-w" cx="72" cy="108" r="4"/><circle class="i-d" cx="134" cy="108" r="12"/><circle class="i-w" cx="134" cy="108" r="4"/>',
 olahraga:'<ellipse class="i-d" cx="100" cy="122" rx="56" ry="5" opacity=".18"/><rect class="i-d" x="66" y="78" width="68" height="9" rx="4.5"/><rect class="i-a" x="46" y="60" width="16" height="46" rx="5"/><rect class="i-a" x="62" y="67" width="9" height="32" rx="3"/><rect class="i-a" x="138" y="60" width="16" height="46" rx="5"/><rect class="i-a" x="129" y="67" width="9" height="32" rx="3"/>',
 orang:'<circle class="i-s" cx="122" cy="68" r="15"/><path class="i-s" d="M96 124a26 30 0 0 1 52 0z"/><circle class="i-a" cx="82" cy="62" r="17"/><path class="i-a" d="M52 124a30 34 0 0 1 60 0z"/><path class="i-l" d="M74 64q8 7 16 0" stroke-width="3"/>',
 buku:'<ellipse class="i-d" cx="100" cy="124" rx="56" ry="5" opacity=".18"/><path class="i-a" d="M100 64c-16-10-38-12-58-7v62c20-5 42-3 58 7 16-10 38-12 58-7V57c-20-5-42-3-58 7z"/><path class="i-w" d="M100 60c-14-9-32-11-50-7v58c18-4 36-2 50 7zM100 60c14-9 32-11 50-7v58c-18-4-36-2-50 7z"/><path class="i-la" d="M60 70c10-2 20-1 30 3M60 82c10-2 20-1 30 3M110 73c10-4 20-5 30-3M110 85c10-4 20-5 30-3" stroke-width="3"/>',
 rumah:'<circle class="i-s" cx="160" cy="96" r="15"/><rect class="i-d" x="158" y="106" width="4" height="16"/><path class="i-d" d="M50 80l50-40 50 40z"/><rect class="i-a" x="60" y="76" width="80" height="46"/><path class="i-w" d="M91 122V100a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v22z"/><rect class="i-w" x="68" y="88" width="15" height="13" rx="2"/><rect class="i-w" x="117" y="88" width="15" height="13" rx="2"/>',
 alam:'<circle class="i-w" cx="148" cy="44" r="14" opacity=".9"/><path class="i-d" d="M16 124l48-62 30 36 22-24 66 50z" opacity=".75"/><path class="i-a" d="M-6 124l62-42 52 42z"/><path class="i-w" d="M56 82l-9 6 9-2 8 4z" opacity=".7"/>',
 belanja:'<ellipse class="i-d" cx="100" cy="124" rx="50" ry="5" opacity=".18"/><rect class="i-s" x="114" y="74" width="40" height="48" rx="6"/><path class="i-la" d="M82 60V50a18 18 0 0 1 36 0v10"/><rect class="i-a" x="60" y="56" width="80" height="66" rx="8"/><rect class="i-w" x="78" y="80" width="44" height="18" rx="5"/>',
 karya:'<path class="i-la" d="M80 40l20-14 20 14" stroke-width="3"/><rect class="i-w" x="54" y="38" width="92" height="76" rx="5"/><rect class="i-s" x="62" y="46" width="76" height="60" rx="2"/><circle class="i-a" cx="86" cy="68" r="11"/><path class="i-d" d="M62 106l26-22 18 12 32-26v36z"/>',
};
const ILUS_KATA=[
 ['piala','turnamen|juara|esport|lomba'],
 ['klinik','klinik|dokter|sehat|obat|posyandu|pasien'],
 ['masjid','masjid|musala|jamaah'],
 ['minum','kopi|minum|teh|jus|kafe|kedai'],
 ['makan','makan|masak|menu|rendang|rantang|kuliner|resep|katering|nasi|kue|dapur'],
 ['belanja','laundry|cuci'],
 ['kendaraan','mobil|armada|motor|ojek|kurir|antar|jemput|rental|kendaraan|galon|bengkel|servis'],
 ['olahraga','hiit|gym|kebugaran|olahraga|latihan'],
 ['orang','murid|tim([^a-z]|$)|pengantin|prewedding|mekanik|kegiatan|salon|warga|komunitas|anggota|arisan|absensi|sales|rekrut|karier|profil'],
 ['buku','kelas|kursus|buku|belajar|ujian|sekolah|perpus|artikel|blog|berita|dokumentasi'],
 ['rumah','villa|kamar|properti|rumah|kos|hotel|kantor|gedung|koperasi|booking'],
 ['alam','sawah|destinasi|pulau|wisata|rute|desa|alam|tani|kebun'],
 ['belanja','produk|barang|toko|belanja|jual|marketplace|laundry|kasir|invoice'],
 ['karya','karya|pameran|galeri|proyek|sampul|poster|portofolio|fotografer|agensi|undangan|nikah|acara|event|tiket'],
];
let tema=''; // kategori, jenis, dan nama PRD yang sedang digambar, untuk label foto yang umum
const pilihIlus=label=>{
  // "produk" dan "barang" terlalu umum: toko kopi sebaiknya bergambar kopi, bukan tas belanja.
  for(const teks of [String(label||'').replace(/produk|barang/gi,''),tema]){const t=String(teks||'').toLowerCase();const m=ILUS_KATA.find(([,re])=>new RegExp('(^|[^a-z])('+re+')').test(t));if(m)return m[0]}
  return 'alam';
};
const ilus=label=>`<svg class="m-ilus-bg" viewBox="0 0 200 150" preserveAspectRatio="none" aria-hidden="true"><circle class="i-s" cx="34" cy="26" r="40" opacity=".55"/><circle class="i-w" cx="172" cy="112" r="3" opacity=".7"/><circle class="i-w" cx="22" cy="92" r="2" opacity=".7"/><path class="i-s" d="M0 122c40-12 80-12 120-3s60 3 80-2v33H0z"/></svg><svg class="m-ilus" viewBox="0 0 200 150" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${ILUS[pilihIlus(label)]}</svg>`;
let nImg=0; // urutan gambar dalam satu maket; gambar genap dicerminkan supaya kartu berjejer tidak kembar
const img=(label,ratio,k)=>`<div class="m-img${nImg++%2?' alt':''}" style="aspect-ratio:${ratio};--k:${k}%">${ilus(label)}<span>${e(label)}</span></div>`;
const shot=()=>`<div class="m-shot"><div class="bar" style="width:38%"></div><div class="big"></div><div class="rowx"><div></div><div></div><div></div></div><div class="bar"></div><div class="bar" style="width:72%"></div></div>`;
const head=(h,sub)=>`<h2 class="m-h2">${e(h)}</h2>${sub?`<p class="m-sub">${e(sub)}</p>`:'<p class="m-sub"></p>'}`;
const pills=(list,on=0)=>`<div class="m-chips">${list.map((k,i)=>`<span class="m-pill${i===on?' on':''}">${e(k)}</span>`).join('')}</div>`;
const LOGOS=['Warung Bu Sri','Toko Maju','Kedai 27','Berkah Jaya','Sumber Rejeki'];

const B={
 hero(c){const {s,t}=c,i=t.isi;
  const btns=`<div class="m-row"><span class="m-btn">${e(s.cta)}</span>${i.cta2?`<span class="m-btn ghost">${e(i.cta2)}</span>`:''}</div>`;
  if(t.hero==='intro')return `<section class="m-sec m-hero-intro"><p class="m-eyebrow">${e(i.peran)}</p><h1 class="m-h1 big">${e(s.tagline)}</h1><p class="m-lead" style="max-width:640px">${e(s.deskripsi)}</p><div class="m-row"><span class="m-btn">${e(s.cta)}</span><span class="m-btn ghost">${e(i.cta2||'Unduh CV')}</span></div></section>`;
  if(t.hero==='artikel')return `<section class="m-hero">${img('Gambar sampul','4/3',30)}<div><p class="m-eyebrow">Tulisan terbaru</p><h1 class="m-h1" style="font-size:40px">${e(i.items[0][0])}</h1><p class="m-lead">${e(s.tagline)}.</p><div class="m-row"><span class="m-btn">Baca tulisan</span><span class="m-btn ghost">${e(s.cta)}</span></div></div></section>`;
  if(t.hero==='cari')return `<section class="m-sec center m-hero-cari"><p class="m-eyebrow">${e(i.eyebrow)}</p><h1 class="m-h1">${e(s.tagline)}</h1><p class="m-lead">${e(s.deskripsi)}</p><div class="m-search"><span>${e(i.cari)}</span><span class="m-btn">${e(s.cta)}</span></div>${i.populer?`<div class="m-chips">${i.populer.map(x=>`<span class="m-pill">${e(x)}</span>`).join('')}</div>`:''}</section>`;
  if(t.hero==='undangan')return `<section class="m-sec center m-hero-wed">${img(i.foto||'Foto','16/7',24)}<p class="m-eyebrow">${e(i.eyebrow)}</p><h1 class="m-h1 big">${e(s.nama)}</h1><p class="m-lead">${e(s.tagline)}</p><span class="m-btn">${e(s.cta)}</span></section>`;
  if(t.hero==='poster')return `<section class="m-poster"><span class="m-poster-tag">${e(i.foto||'Foto')}</span><div class="m-poster-in"><p class="m-eyebrow">${e(i.eyebrow)}</p><h1 class="m-h1 big">${e(s.tagline)}</h1><p class="m-lead">${e(s.deskripsi)}</p>${btns}</div></section>`;
  if(t.hero==='tengah')return `<section class="m-sec center m-hero-mid"><p class="m-eyebrow">${e(i.eyebrow)}</p><h1 class="m-h1 big">${e(s.tagline)}</h1><p class="m-lead">${e(s.deskripsi)}</p>${btns}${i.foto?`<div class="m-hero-img">${img(i.foto,'21/8',26)}</div>`:''}</section>`;
  return `<section class="m-hero"><div><p class="m-eyebrow">${e(i.eyebrow)}</p><h1 class="m-h1">${e(s.tagline)}</h1><p class="m-lead">${e(s.deskripsi)}</p>${btns}</div>${t.hero==='app'?shot():img(i.foto||'Foto','4/3',30)}</section>`},
 logos(c){const i=c.t.isi;return `<div class="m-logos">${e(i.logosLabel||'Dipakai oleh')} ${(i.logos||LOGOS).map(n=>`<b>${e(n)}</b>`).join('')}</div>`},
 fitur(c){const f=c.feats.slice(0,6);return `<section class="m-sec">${head(c.t.isi.fiturJudul||'Yang bisa kamu lakukan','Diambil dari daftar fitur di PRD.')}<div class="m-g3">${f.map((x,k)=>`<div class="m-card"><div class="m-ico">${String(k+1).padStart(2,'0')}</div><h3>${e(x.n)}</h3><p>${e(x.d)}</p></div>`).join('')}</div></section>`},
 unggul(c){const i=c.t.isi;return `<section class="m-sec tint">${head(i.unggulJudul||'Kenapa di sini')}<div class="m-g3">${i.unggul.map(([a,b])=>`<div class="m-card"><h3>${e(a)}</h3><p>${e(b)}</p></div>`).join('')}</div></section>`},
 stat(c){return `<section class="m-sec tint"><div class="m-g3">${c.t.isi.stat.map(([a,b])=>`<div class="m-stat"><b>${e(a)}</b><span>${e(b)}</span></div>`).join('')}</div></section>`},
 harga(c){const i=c.t.isi;return `<section class="m-sec">${head(i.hargaJudul||'Paket harga',i.hargaSub||'Mulai dari yang paling sesuai, bisa pindah paket kapan saja.')}<div class="m-g3">${i.harga.map(([a,b,d],k)=>`<div class="m-card m-price${k===1?' hot':''}"><h3>${e(a)}</h3><b>${e(b)}</b><p>${e(d)}</p><span class="m-btn${k===1?'':' ghost'}">${e(i.hargaTombol||'Pilih paket')}</span></div>`).join('')}</div></section>`},
 testi(c){const i=c.t.isi;return `<section class="m-sec">${head(i.testiJudul||'Kata mereka')}<div class="m-g3">${i.testi.map(([q,n,r])=>`<div class="m-card m-quote"><p>“${e(q)}”</p><small><b>${e(n)}</b> · ${e(r)}</small></div>`).join('')}</div></section>`},
 faq(c){return `<section class="m-sec">${head('Pertanyaan umum')}${c.t.isi.faq.map(([q,a])=>`<div class="m-faq"><span>${e(q)}</span><span>${a?'–':'+'}</span></div>${a?`<p>${e(a)}</p>`:''}`).join('')}</section>`},
 cta(c){return `<div class="m-cta"><h2 class="m-h2">${e(c.s.tagline)}</h2><span class="m-btn">${e(c.s.cta)}</span></div>`},
 kategori(c){return `<section class="m-sec m-sec-chips">${pills(c.t.isi.kategori)}</section>`},
 produk(c){const i=c.t.isi;return `<section class="m-sec">${head(i.produkJudul||'Produk unggulan')}<div class="m-g4">${i.items.map(([n,p],k)=>`<div class="m-prod">${img('Foto','1/1',16+k*7)}<h3>${e(n)}</h3><p>${e(p)}</p></div>`).join('')}</div></section>`},
 nawala(c){return `<section class="m-sec tint"><div class="m-g2"><div><h2 class="m-h2">${e(c.t.isi.nawalaJudul||'Kabar baru lewat email')}</h2><p class="m-sub" style="margin:0!important">Satu email tiap ada yang baru. Bisa berhenti kapan saja.</p></div><div class="m-row"><span class="m-input" style="flex:1;min-width:180px">nama@email.com</span><span class="m-btn">${e(c.s.tpl==='blog'?c.s.cta:'Berlangganan')}</span></div></div></section>`},
 galeri(c){const i=c.t.isi,g=i.galeri||i.items;return `<section class="m-sec">${head(i.galeriJudul||(c.s.tpl==='profil'?'Proyek pilihan':'Karya pilihan'))}<div class="${i.galeri?'m-masonry':'m-g2'}" style="align-items:start">${g.map(([n,m],k)=>`<div>${img(i.galeriFoto||'Gambar proyek',i.galeri?['4/5','4/3','1/1','3/4','4/3','4/5'][k%6]:'16/10',14+k*8)}${n?`<div class="m-cap"><b>${e(n)}</b><span>${e(m)}</span></div>`:''}</div>`).join('')}</div></section>`},
 tentang(c){return `<section class="m-sec"><div class="m-g2">${img('Foto','4/3',20)}<div><p class="m-eyebrow">Tentang</p><h2 class="m-h2">${e(c.s.nama)}</h2><p style="color:var(--m-muted);margin-top:8px">${e(c.s.deskripsi)}</p></div></div></section>`},
 layanan(c){const i=c.t.isi;return `<section class="m-sec">${head(i.layananJudul||'Layanan dan tarif')}${i.layanan.map(([n,m])=>`<div class="m-svc"><b>${e(n)}</b><span>${e(m)}</span></div>`).join('')}</section>`},
 kontak(c){return `<section class="m-sec tint"><div class="m-g2" style="align-items:start"><div><h2 class="m-h2">Hubungi ${e(c.s.nama)}</h2><p class="m-sub">Balasan paling lambat satu hari kerja.</p></div><div class="m-form"><span class="m-input">Nama</span><span class="m-input">Email atau WhatsApp</span><span class="m-input" style="min-height:84px">Pesan</span><span class="m-btn" style="align-self:flex-start">Kirim pesan</span></div></div></section>`},
 artikel(c){const i=c.t.isi,list=i.artikel||i.items.slice(1);return `<section class="m-sec" style="padding-top:28px">${i.artikel?head(i.artikelJudul||'Artikel terbaru'):''}${list.map(([n,m],k)=>`<div class="m-art">${img('Sampul','4/3',14+k*8)}<div><h3>${e(n)}</h3><p>${e(m)}</p></div></div>`).join('')}</section>`},
 booking(c){const i=c.t.isi,b=i.booking||{};const pilih=b.pilih||(i.layanan?'Layanan: '+i.layanan[0][0]:'Pilih layanan');return `<section class="m-sec tint"><div class="m-g2" style="align-items:start"><div><h2 class="m-h2">${e(b.judul||'Pesan jadwal')}</h2><p class="m-sub">${e(b.sub||'Pilih layanan dan jam, konfirmasi dikirim lewat WhatsApp.')}</p></div><div class="m-card m-form"><span class="m-input">${e(pilih)}</span><div class="m-row"><span class="m-input" style="flex:1">${e(b.tanggal||'Sabtu, 17 Oktober')}</span><span class="m-input" style="flex:1">${e(b.jam?b.jam[1]:'10.30')}</span></div>${pills(b.jam||['09.00','10.30','13.00','15.30'],1)}<span class="m-input">${e(b.kontak||'Nomor WhatsApp')}</span><span class="m-btn" style="text-align:center">${e(c.s.cta)}</span></div></div></section>`},
 kursus(c){return `<section class="m-sec">${head('Kelas tersedia','Mulai dari yang paling dasar, lanjut sesuai urutan.')}<div class="m-g3">${c.t.isi.items.map(([n,m],k)=>`<div class="m-card">${img('Sampul kelas','16/9',16+k*10)}<h3 style="margin-top:14px">${e(n)}</h3><p>${e(m)}</p></div>`).join('')}</div></section>`},
 // Bagian baru
 menu(c){const i=c.t.isi;return `<section class="m-sec">${head(i.menuJudul||'Menu',i.menuSub)}${i.kategoriMenu?`<div style="margin-bottom:22px">${pills(i.kategoriMenu)}</div>`:''}<div class="m-menu">${i.menu.map(([n,d,p])=>`<div class="m-dish"><div><b>${e(n)}</b><p>${e(d)}</p></div><i></i><span>${e(p)}</span></div>`).join('')}</div></section>`},
 lokasi(c){const l=c.t.isi.lokasi;return `<section class="m-sec tint"><div class="m-g2" style="align-items:stretch"><div class="m-map"><span class="m-mpin"></span></div><div><h2 class="m-h2">${e(l.judul||'Lokasi dan jam buka')}</h2><p class="m-sub">${e(l.alamat)}</p>${l.jam.map(([h,j])=>`<div class="m-svc"><b>${e(h)}</b><span>${e(j)}</span></div>`).join('')}<div class="m-row" style="margin-top:20px"><span class="m-btn">Petunjuk arah</span>${l.telp?`<span class="m-btn ghost">${e(l.telp)}</span>`:''}</div></div></div></section>`},
 hitung(c){const h=c.t.isi.hitung;return `<section class="m-sec tint center"><p class="m-eyebrow">${e(h[0])}</p><div class="m-count">${[['24','Hari'],['08','Jam'],['36','Menit'],['12','Detik']].map(([a,b])=>`<div><b>${a}</b><span>${b}</span></div>`).join('')}</div><p class="m-sub" style="margin-top:20px!important">${e(h[1])}</p></section>`},
 acara(c){const i=c.t.isi;return `<section class="m-sec center">${head(i.acaraJudul||'Rangkaian acara')}<div class="m-g2">${i.acara.map(([n,w,t])=>`<div class="m-card m-event"><p class="m-eyebrow">${e(n)}</p><h3>${e(w)}</h3><p>${e(t)}</p><span class="m-btn ghost">Lihat lokasi</span></div>`).join('')}</div></section>`},
 rsvp(c){return `<section class="m-sec tint"><div class="m-g2" style="align-items:start"><div><h2 class="m-h2">Konfirmasi kehadiran</h2><p class="m-sub">${e(c.t.isi.rsvp||'Mohon konfirmasi paling lambat satu minggu sebelum acara.')}</p></div><div class="m-card m-form"><span class="m-input">Nama tamu</span>${pills(['Hadir','Tidak hadir'])}<span class="m-input">Jumlah tamu: 2 orang</span><span class="m-input" style="min-height:70px">Ucapan dan doa</span><span class="m-btn" style="text-align:center">${e(c.s.cta)}</span></div></div></section>`},
 hadiah(c){return `<section class="m-sec center">${head('Amplop digital','Doa restu Anda adalah hadiah terbaik. Bila ingin memberi tanda kasih, bisa melalui rekening berikut.')}<div class="m-g2 m-narrow">${c.t.isi.hadiah.map(([b,n,a])=>`<div class="m-card m-gift"><small>${e(b)}</small><b>${e(n)}</b><p>a.n. ${e(a)}</p><span class="m-btn ghost">Salin nomor</span></div>`).join('')}</div></section>`},
 tim(c){const i=c.t.isi;return `<section class="m-sec">${head(i.timJudul||'Tim kami',i.timSub)}<div class="m-g4">${i.tim.map(([n,r],k)=>`<div class="m-person"><div class="m-ava" style="--k:${18+k*9}%"></div><b>${e(n)}</b><span>${e(r)}</span></div>`).join('')}</div></section>`},
 agenda(c){const a=c.t.isi.agenda;return `<section class="m-sec">${head(a.judul,a.sub)}<div class="m-agenda">${a.baris.map(([w,j,k])=>`<div class="m-ag"><span>${e(w)}</span><div><b>${e(j)}</b>${k?`<p>${e(k)}</p>`:''}</div></div>`).join('')}</div></section>`},
 listing(c){const l=c.t.isi.listing;return `<section class="m-sec">${head(l.judul,l.sub)}<div class="m-g3">${l.items.map(([n,m,p,tag],k)=>`<div class="m-card m-list">${img(l.foto||'Foto','4/3',16+k*8)}${tag?`<span class="m-tag m-badge">${e(tag)}</span>`:''}<h3>${e(n)}</h3><p>${e(m)}</p><b>${e(p)}</b></div>`).join('')}</div></section>`},
 kalkulator(c){const k=c.t.isi.kalk;return `<section class="m-sec tint"><div class="m-g2" style="align-items:center"><div><h2 class="m-h2">${e(k.judul)}</h2><p class="m-sub">${e(k.sub)}</p></div><div class="m-card m-form">${k.baris.map(([a,b])=>`<div class="m-calc"><span>${e(a)}</span><span class="m-input">${e(b)}</span></div>`).join('')}<div class="m-calc-out"><span>${e(k.hasil[0])}</span><b>${e(k.hasil[1])}</b></div></div></div></section>`},
 lowongan(c){const i=c.t.isi;return `<section class="m-sec">${head(i.lowonganJudul||'Lowongan terbaru',i.lowonganSub)}${i.lowongan.map(([p,u,l,t,g])=>`<div class="m-job"><span class="m-jlogo">${e(u[0])}</span><div><b>${e(p)}</b><p>${e(u)} · ${e(l)}</p></div><span class="m-tag">${e(t)}</span><span class="m-jpay">${e(g)}</span></div>`).join('')}</section>`},
 kampanye(c){const i=c.t.isi;return `<section class="m-sec">${head(i.kampanyeJudul||'Kampanye berjalan','Pilih kampanye, lihat kebutuhan dananya, lalu salurkan bantuan.')}<div class="m-g3">${i.kampanye.map(([n,a,t,p,h],k)=>`<div class="m-card m-list">${img('Foto kegiatan','16/10',16+k*8)}<h3>${e(n)}</h3><div class="m-prog"><i style="width:${p}%"></i></div><p><strong>${e(a)}</strong> dari ${e(t)}</p><p>${e(h)}</p><span class="m-btn">Donasi</span></div>`).join('')}</div></section>`},
 laporan(c){const l=c.t.isi.laporan;return `<section class="m-sec tint">${head(l.judul,l.sub)}<div class="m-card">${l.baris.map(([d,u,j])=>`<div class="m-row3"><span>${e(d)}</span><span>${e(u)}</span><b>${e(j)}</b></div>`).join('')}</div></section>`},
 waktu(c){const w=c.t.isi.waktu;return `<section class="m-sec m-sec-times"><div class="m-times-h"><b>${e(w.judul)}</b><span>${e(w.sub)}</span></div><div class="m-times">${w.items.map(([a,b],k)=>`<div class="${k===w.aktif?'on':''}"><span>${e(a)}</span><b>${e(b)}</b></div>`).join('')}</div></section>`},
 profil(c){const i=c.t.isi;return `<section class="m-sec center m-bio"><div class="m-ava big" style="--k:34%"></div><h1 class="m-h2">${e(c.s.nama)}</h1><p class="m-sub">${e(c.s.tagline)}</p>${pills(i.sosial,-1)}</section>`},
 tautan(c){return `<section class="m-sec m-bio-links">${c.t.isi.tautan.map((x,k)=>`<span class="m-btn${k?' ghost':''}">${e(x)}</span>`).join('')}</section>`},
 topik(c){const i=c.t.isi;return `<section class="m-sec">${head(i.topikJudul||'Topik bantuan')}<div class="m-g3">${i.topik.map(([n,j],k)=>`<div class="m-card"><div class="m-ico">${String(k+1).padStart(2,'0')}</div><h3>${e(n)}</h3><p>${e(j)}</p></div>`).join('')}</div></section>`},
 // Bagian untuk aplikasi web (dashboard)
 kpi(c){return `<div class="m-g4">${c.t.isi.kpi.map(([a,b,d])=>`<div class="m-card m-kpi"><small>${e(a)}</small><b${kpiPanjang(b)}>${e(b)}</b><em>${e(d)}</em></div>`).join('')}</div>`},
 grafik(c){const i=c.t.isi;return `<div class="m-card"><h3>${e(i.grafikJudul||'Barang keluar, 7 hari terakhir')}</h3><div class="m-bars">${i.bars.map(v=>`<div style="height:${v}%"></div>`).join('')}</div><div class="m-days">${['Sab','Min','Sen','Sel','Rab','Kam','Jum'].map(d=>`<span>${d}</span>`).join('')}</div></div>`},
 tabel(c){const i=c.t.isi,k=i.kolom||['Kode','Nama','Stok','Status'];return `<div class="m-card${i.kolomKode===false?' m-tbl-nama':''}"><h3>${e(i.tabelJudul||c.pages[1]||'Data')}</h3><div class="m-tr h">${k.map(x=>`<span>${e(x)}</span>`).join('')}</div>${i.rows.map(r=>`<div class="m-tr"><span${i.kolomKode===false?'':' style="font:400 12px var(--f-mono);color:var(--m-muted)"'}>${e(r[0])}</span><span>${e(r[1])}</span><span>${e(r[2])}</span><span class="m-tag">${e(r[3])}</span></div>`).join('')}</div>`},
 aktivitas(c){return `<div class="m-card"><h3>Aktivitas terbaru</h3>${c.t.isi.acts.map(([a,w])=>`<div class="m-act">${e(a)}<small>${e(w)}</small></div>`).join('')}</div>`}
};
const NAV_LEWAT=/^(detail|halaman (produk|toko|detail)|checkout|formulir|hasil pencarian|pembayaran|konfirmasi)\b/i;
// Bagian yang isi contohnya tidak ada untuk PRD ini dilewati, supaya pratinjau tidak patah.
const safe=(fn,c)=>{try{return fn(c)}catch{return ''}};

function webHTML(s,mobile){
  const t=T[s.tpl];
  tema=[t.kategori,s.jenis,s.nama].join(' ');
  nImg=0;
  const utama=peranAktif(s)[0];
  const pages=utama?halamanPeran(s,utama.id).map(p=>p.n):[];
  const feats=s.fitur.filter(f=>f.on&&f.n.trim());
  const has=re=>feats.some(f=>re.test(f.n));
  const c={s,t,pages,feats};
  const logo=`<div class="m-logo"><i>${e((s.nama.trim()[0]||'W').toUpperCase())}</i>${e(s.nama)}</div>`;
  const body=s.blok.filter(b=>b.on&&B[b.id]).map(b=>safe(B[b.id],c)).join('');
  let inner;
  if(t.app){
    inner=`<div class="m-app"><aside class="m-side">${logo}${pages.map((p,i)=>`<a class="${i?'':'on'}">${e(p)}</a>`).join('')}</aside><div class="m-main"><div class="m-top"><span class="m-burger" style="margin:0 6px 0 0"></span><b>${e(pages[0]||'Ringkasan')}</b>${has(/cari|filter/i)?`<span class="m-pill">${e(t.isi.cariApp||'Cari…')}</span>`:'<span class="m-pill" style="visibility:hidden"></span>'}<span class="m-btn">${e(s.cta)}</span></div>${body||'<div class="m-card">Belum ada bagian yang dipilih.</div>'}</div></div>`;
  }else if(t.bio){
    // Halaman satu kolom tanpa navigasi, misalnya halaman tautan kreator.
    inner=`<div class="m-biopage">${body||'<section class="m-sec"><p>Belum ada bagian yang dipilih.</p></section>'}<div class="m-foot center"><span>© 2026 ${e(s.nama)}</span></div></div>`;
  }else{
    // Kotak cari kecil di navigasi tidak perlu bila bagian pembuka sudah berupa kotak pencarian besar.
    const keranjang=has(/keranjang/i);
    const tools=[has(/cari|pencarian/i)&&t.hero!=='cari'?'<span class="m-pill">Cari</span>':'',s.nfr.some(n=>n.id==='i18n'&&n.on)||has(/\bbahasa\b/i)?'<span>ID / EN</span>':'',has(/akun|masuk|login/i)?'<span>Masuk</span>':'',keranjang?'<span class="m-pill">Keranjang · 2</span>':''].join('');
    // Halaman yang dibuka dari halaman lain (detail, checkout, formulir) tidak dijadikan tautan di menu atas.
    const menu=pages.filter(p=>!NAV_LEWAT.test(p)&&!(keranjang&&/^keranjang/i.test(p)));
    const nav=menu.length>=2?menu:pages;
    inner=`<div class="m-nav">${logo}<div class="m-links">${nav.slice(0,6).map(p=>`<span>${e(p)}</span>`).join('')}</div>${tools?`<div class="m-tools">${tools}</div>`:''}<span class="m-btn">${e(s.cta)}</span><span class="m-burger"></span></div>${body||'<section class="m-sec"><p>Belum ada bagian yang dipilih.</p></section>'}<div class="m-foot"><span>© 2026 ${e(s.nama)}</span><span>${nav.slice(0,5).map(e).join(' · ')}</span></div>${has(/whatsapp/i)?'<div class="m-wa">WA</div>':''}`;
  }
  return `<div class="mock${mobile?' is-mobile':''}"${gayaAttr(s)}>${inner}</div>`;
}

/* ---------- Maket aplikasi mobile ----------
   Satu layar utama dalam bingkai ponsel. Isi contoh diambil dari katalog; nama, tombol utama,
   warna, gaya, bagian layar, dan tab navigasi mengikuti PRD. */
function seats(k){
  let h='';
  for(let r=0;r<6;r++){
    h+='<div>';
    for(let x=0;x<8;x++){const id=r*8+x;h+=`<i class="${k.pilih.includes(id)?'on':k.terisi.includes(id)?'full':''}"></i>`;if(x===3)h+='<b></b>'}
    h+='</div>';
  }
  return h;
}
const A={
 'a-sapa':c=>`<div class="a-hello"><div><small>${e(c.s.nama)}</small><b>${e(c.i.sapa)}</b></div><span class="a-ava">${e((c.s.nama.trim()[0]||'A').toUpperCase())}</span></div>`,
 'a-cari':c=>`<div class="a-search">${e(c.i.cari||'Cari…')}</div>`,
 'a-banner':c=>`<div class="a-banner"><b>${e(c.i.banner[0])}</b><span>${e(c.i.banner[1])}</span><em>${e(c.i.banner[2]||c.s.cta)}</em></div>`,
 'a-kategori':c=>`<div class="a-cats">${c.i.kategori.map(k=>`<div><i>${e(k[0])}</i><span>${e(k)}</span></div>`).join('')}</div>`,
 'a-produk':c=>`<div class="a-h">${e(c.i.judulProduk||'Pilihan hari ini')}</div><div class="a-grid">${c.i.produk.map(([n,p],k)=>`<div class="a-prod">${img('Foto','4/3',16+k*7)}<b>${e(n)}</b><span>${e(p)}</span><em>+</em></div>`).join('')}</div>`,
 'a-saldo':c=>`<div class="a-balance"><small>${e(c.i.saldo[0])}</small><b>${e(c.i.saldo[1])}</b><span>${e(c.i.saldo[2])}</span></div>`,
 'a-aksi':c=>`<div class="a-actions">${c.i.aksi.map((x,k)=>`<span class="${k?'':'on'}">${e(k?x:(c.i.aksiUtama||c.s.cta))}</span>`).join('')}</div>`,
 'a-grafik':c=>`<div class="a-card"><div class="a-h">${e(c.i.judulGrafik)}</div><div class="a-bars">${c.i.bars.map(v=>`<i style="height:${Math.max(v,3)}%"></i>`).join('')}</div><div class="a-days">${['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d=>`<span>${d}</span>`).join('')}</div></div>`,
 'a-daftar':c=>`<div class="a-h">${e(c.i.judulDaftar)}</div><div class="a-list">${c.i.daftar.map(([a,b,x])=>`<div><span class="a-dot"></span><div><b>${e(a)}</b><small>${e(b)}</small></div><em>${e(x)}</em></div>`).join('')}</div>`,
 'a-jadwal':c=>{const j=c.i.jadwal;return `<div class="a-h">${e(j.judul||'Pilih jadwal')}</div><div class="a-daysel">${j.hari.map((h,k)=>`<span class="${k?'':'on'}">${e(h)}</span>`).join('')}</div><div class="a-slots">${j.jam.map((t,k)=>`<span class="${k===j.pilih?'on':j.penuh.includes(k)?'full':''}">${e(t)}</span>`).join('')}</div><div class="a-cta">${e(c.s.cta)}</div>`},
 'a-progres':c=>`<div class="a-progress"><div><b>${e(c.i.progres[0])}</b><small>${e(c.i.progres[1])}</small></div><div class="a-track"><i style="width:${c.i.progres[2]}%"></i></div></div>`,
 'a-peta':c=>`<div class="a-map"><span class="a-pin"></span><div class="a-eta"><b>${e(c.i.peta[0])}</b><small>${e(c.i.peta[1])}</small></div></div>`,
 // Bagian baru
 'a-kartu':c=>`<div class="a-h">${e(c.i.judulKartu)}</div><div class="a-cards">${c.i.kartu.map(([n,m,x],k)=>`<div class="a-media">${img(c.i.fotoKartu||'Foto','16/8',18+k*9)}<div class="a-media-b"><div><b>${e(n)}</b><small>${e(m)}</small></div>${x?`<em>${e(x)}</em>`:''}</div></div>`).join('')}</div>`,
 'a-absen':c=>{const a=c.i.absen;return `<div class="a-clock"><small>${e(a[1])}</small><b>${e(a[0])}</b><span>${e(a[2])}</span><em>${e(c.s.cta)}</em></div>`},
 'a-pemutar':c=>{const p=c.i.pemutar;return `<div class="a-player"><div class="a-art"></div><b>${e(p[0])}</b><small>${e(p[1])}</small><div class="a-track"><i style="width:${p[2]}%"></i></div><div class="a-ctrls"><span>−15</span><em><i></i></em><span>+15</span></div></div>`},
 'a-mood':c=>{const m=c.i.mood;return `<div class="a-card"><div class="a-h">${e(m[0])}</div><div class="a-moods">${m[1].map((x,k)=>`<span class="${k===m[2]?'on':''}"><i></i>${e(x)}</span>`).join('')}</div></div>`},
 'a-kursi':c=>{const k=c.i.kursi;return `<div class="a-card"><div class="a-stagebar">${e(k.layar||'Panggung')}</div><div class="a-seats">${seats(k)}</div><div class="a-legend"><span><i></i>Kosong</span><span><i class="full"></i>Terisi</span><span><i class="on"></i>Pilihanmu</span></div></div><div class="a-cta">${e(c.s.cta)}</div>`},
 'a-tiket':c=>{const t=c.i.tiket;return `<div class="a-ticket"><div><small>${e(t[1])}</small><b>${e(t[0])}</b><span>${e(t[2])}</span></div><div class="a-qr"></div></div>`},
 'a-rak':c=>`<div class="a-h">${e(c.i.judulRak)}</div><div class="a-shelf">${c.i.rak.map(([n,p],k)=>`<div><span class="a-cover" style="--k:${34+k*14}%"><b>${e(n)}</b></span><small>${e(p)}</small></div>`).join('')}</div>`,
 'a-total':c=>{const t=c.i.total;return `<div class="a-sum"><div><small>${e(t[0])}</small><b>${e(t[1])}</b></div><em>${e(c.s.cta)}</em></div>`},
 'a-status':c=>{const st=c.i.status;return `<div class="a-card"><div class="a-h">${e(st.judul)}</div><div class="a-steps">${st.langkah.map((l,k)=>`<span class="${k<st.aktif?'done':k===st.aktif?'on':''}"><i></i>${e(l)}</span>`).join('')}</div><small class="a-note">${e(st.ket)}</small></div>`},
};
function appHTML(s){
  const t=T[s.tpl];
  tema=[t.kategori,s.jenis,s.nama].join(' ');
  nImg=0;
  const utama=peranAktif(s)[0];
  const pages=utama?halamanPeran(s,utama.id).map(p=>p.n):[];
  const c={s,i:t.isi};
  const body=s.blok.filter(b=>b.on&&A[b.id]).map(b=>safe(A[b.id],c)).join('');
  const tabs=pages.slice(0,4);
  return `<div class="mock is-mobile is-app"${gayaAttr(s)}><div class="a-screen"><div class="a-status"><span>9.41</span><span>5G ▮▮▮</span></div><div class="a-body">${body||'<p>Belum ada bagian yang dipilih.</p>'}</div>${tabs.length?`<div class="a-tabs">${tabs.map((p,k)=>`<span class="${k?'':'on'}"><i></i>${e(p)}</span>`).join('')}</div>`:''}</div></div>`;
}

/* ---------- Pratinjau peran lain ----------
   Peran selain peran utama ditampilkan sebagai panel web (menu samping berisi halaman peran itu) atau,
   untuk peran yang memakai aplikasi, sebagai layar aplikasi dengan tab miliknya. Isi contohnya dari
   isi.panel di katalog; bila tidak ada, yang tampil adalah hak dan kebutuhan fungsional peran itu. */
const KOLOM_TAG=/^(status|tahapan|jenis|tren)$/i;
function panelBody(s,role,p){
  if(!p){
    const fs=fiturPeran(s,role.id).slice(0,6),b=lines(role.b).slice(0,5);
    return `<div class="m-card"><h3>Yang bisa dilakukan ${e(role.n)}</h3>${b.map(x=>`<div class="m-act">${e(x)}</div>`).join('')}</div>${fs.length?`<div class="m-g2">${fs.map(f=>`<div class="m-card"><span class="m-tag">${e(f.p)}</span><h3 style="margin-top:10px">${e(f.n)}</h3><p>${e(f.d)}</p></div>`).join('')}</div>`:''}`;
  }
  let h='';
  if(p.kpi)h+=`<div class="m-g4">${p.kpi.map(([a,b,d])=>`<div class="m-card m-kpi"><small>${e(a)}</small><b${kpiPanjang(b)}>${e(b)}</b>${d?`<em>${e(d)}</em>`:''}</div>`).join('')}</div>`;
  if(p.grafik)h+=`<div class="m-card"><h3>${e(p.grafik.judul)}</h3><div class="m-bars">${p.grafik.bars.map(v=>`<div style="height:${Math.max(v,3)}%"></div>`).join('')}</div><div class="m-days">${['Sab','Min','Sen','Sel','Rab','Kam','Jum'].map(d=>`<span>${d}</span>`).join('')}</div></div>`;
  if(p.tabel){
    const t=p.tabel,n=Math.min(5,t.kolom.length),tag=KOLOM_TAG.test(t.kolom[n-1]);
    h+=`<div class="m-card m-ptbl k${n}"><h3>${e(t.judul)}</h3><div class="m-tr h">${t.kolom.slice(0,n).map(x=>`<span>${e(x)}</span>`).join('')}</div>${t.rows.map(r=>`<div class="m-tr">${r.slice(0,n).map((x,i)=>`<span${i===n-1&&tag?' class="m-tag"':''}>${e(x)}</span>`).join('')}</div>`).join('')}</div>`;
  }
  if(p.acts)h+=`<div class="m-card"><h3>Aktivitas terbaru</h3>${p.acts.map(([a,w])=>`<div class="m-act">${e(a)}<small>${e(w)}</small></div>`).join('')}</div>`;
  return h;
}
function panelHTML(s,role,mobile){
  tema=[T[s.tpl].kategori,s.jenis,s.nama].join(' ');
  nImg=0;
  const pages=halamanPeran(s,role.id).map(p=>p.n);
  const p=panelPeran(s.tpl,role.id);
  const logo=`<div class="m-logo" title="${e(s.nama)}"><i>${e((s.nama.trim()[0]||'W').toUpperCase())}</i><span>${e(s.nama)}</span></div>`;
  const inisial=e((role.n.trim()[0]||'P').toUpperCase());
  return `<div class="mock is-panel${mobile?' is-mobile':''}"${gayaAttr(s)}><div class="m-app"><aside class="m-side">${logo}<span class="m-role">${e(role.n)}</span>${pages.map((x,i)=>`<a class="${i?'':'on'}">${e(x)}</a>`).join('')}</aside><div class="m-main"><div class="m-top"><span class="m-burger" style="margin:0 6px 0 0"></span><b>${e(pages[0]||role.n)}</b><span class="m-rolepill">${e(role.n)}</span><span class="m-ava-sm">${inisial}</span></div>${panelBody(s,role,p)}</div></div></div>`;
}
function appRoleHTML(s,role){
  tema=[T[s.tpl].kategori,s.jenis,s.nama].join(' ');
  nImg=0;
  const tabs=halamanPeran(s,role.id).slice(0,4).map(p=>p.n);
  const p=panelPeran(s.tpl,role.id);
  let body=`<div class="a-hello"><div><small>${e(s.nama)} · ${e(role.n)}</small><b>${e(p?.sapa||tabs[0]||role.n)}</b></div><span class="a-ava">${e((role.n.trim()[0]||'P').toUpperCase())}</span></div>`;
  if(p?.saldo)body+=`<div class="a-balance"><small>${e(p.saldo[0])}</small><b>${e(p.saldo[1])}</b><span>${e(p.saldo[2])}</span></div>`;
  if(p?.daftar)body+=`<div class="a-h">${e(p.daftar.judul)}</div><div class="a-list">${p.daftar.items.map(([x,y,z])=>`<div><span class="a-dot"></span><div><b>${e(x)}</b><small>${e(y)}</small></div><em>${e(z)}</em></div>`).join('')}</div>`;
  if(!p){
    const fs=fiturPeran(s,role.id).slice(0,5);
    body+=`<div class="a-h">Yang dikerjakan ${e(role.n.toLowerCase())}</div><div class="a-list">${fs.map(f=>`<div><span class="a-dot"></span><div><b>${e(f.n)}</b><small>${e(f.d)}</small></div><em>${e(f.p)}</em></div>`).join('')}</div>`;
  }
  return `<div class="mock is-mobile is-app"${gayaAttr(s)}><div class="a-screen"><div class="a-status"><span>9.41</span><span>5G ▮▮▮</span></div><div class="a-body">${body}</div>${tabs.length?`<div class="a-tabs">${tabs.map((x,k)=>`<span class="${k?'':'on'}"><i></i>${e(x)}</span>`).join('')}</div>`:''}</div></div>`;
}
// Bentuk pratinjau untuk sebuah peran: 'situs' (halaman utama website), 'app' (layar aplikasi), atau 'panel' (panel web).
export function bentukPeran(s,roleId){
  const roles=peranAktif(s),role=roles.find(r=>r.id===roleId)||roles[0];
  const mobile=T[s.tpl].platform==='mobile';
  if(!role||role.id===roles[0].id)return mobile?'app':'situs';
  return mobile&&role.w!=='web'?'app':'panel';
}

/* Pratinjau: halaman utama peran utama (website desktop atau ponsel, atau layar aplikasi), atau tampilan peran lain. */
export function mockHTML(s,mobile,roleId){
  const roles=peranAktif(s),role=roles.find(r=>r.id===roleId);
  if(role&&role.id!==roles[0].id){
    if(T[s.tpl].platform==='mobile'&&role.w!=='web')return appRoleHTML(s,role);
    return panelHTML(s,role,mobile);
  }
  return T[s.tpl].platform==='mobile'?appHTML(s):webHTML(s,mobile);
}
/* Gambar kecil untuk kartu perpustakaan, selalu selebar 1120 px. Aplikasi mobile digambar sebagai poster berisi ponsel. */
export function thumbHTML(s){
  if(T[s.tpl].platform!=='mobile')return webHTML(s,false);
  return `<div class="mock-poster"${gayaAttr(s)}><div class="mp-text"><span>Aplikasi mobile</span><b>${e(s.nama)}</b><p>${e(s.tagline)}</p></div><div class="mp-phone">${appHTML(s)}</div></div>`;
}
