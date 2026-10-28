// Logika PRD: bentuk data formulir, struktur dokumen baku, pembuat Markdown, pemeriksa struktur,
// dan perender Markdown sederhana.
import {BLOK,GAYA,T,nfrFor,nfrOnFor,stackFor} from './catalog.js';

export const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const lines=v=>String(v||'').split('\n').map(x=>x.trim()).filter(Boolean);
export const clone=o=>JSON.parse(JSON.stringify(o));
export const isMobile=s=>T[s.tpl].platform==='mobile';
export const slug=s=>(s.nama||'proyek').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,24)||'proyek';
// Kunci peran yang tidak berubah walau namanya diganti, misalnya "Pengelola konten" menjadi "pengelola-konten".
export const rid=n=>String(n||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'peran';
export const SEMUA='*';

/* ---------- Bentuk data formulir ----------
   peran:   [{id, n: nama, d: siapa, m: cara masuk, b: yang bisa (per baris), t: yang tidak bisa, w: 'web' bila memakai panel web di PRD aplikasi, on}]
   halaman: [{n, r: id peran pemilik halaman, on}]
   fitur:   [{n, d, p, k: kriteria (per baris), r: [id peran] atau ['*'] untuk semua peran, on}]
   alur:    [{n: judul, r: id peran, l: langkah (per baris), on}] */
const TXT=['nama','tagline','cta','deskripsi','masalah','audiens','tujuan','metrik','luar','data'];
const txt=v=>typeof v==='string'?v:'';
const PRI=['P0','P1','P2'];
export function valid(s){return !!(s&&T[s.tpl]&&Array.isArray(s.fitur)&&Array.isArray(s.halaman)&&Array.isArray(s.blok)&&Array.isArray(s.nfr))}

// Fitur di katalog menulis peran sebagai teks: "Admin", "Pasien, Dokter", atau "Semua peran".
const peranDari=v=>/^semua peran$/i.test(String(v||'').trim())?[SEMUA]:String(v||'').split(',').map(x=>rid(x.trim())).filter(Boolean);
export function fromBuiltin(id){
  const t=T[id],d=t.d;
  const peran=d.peran.map(([n,ds,m,b,tb,,w])=>({id:rid(n),n,d:ds,m,b:(b||[]).join('\n'),t:(tb||[]).join('\n'),w:w==='web'?'web':'',on:true}));
  return {tpl:id,asal:id,jenis:'',nama:d.nama,tagline:d.tagline,cta:d.cta,deskripsi:d.deskripsi,masalah:d.masalah,
    audiens:d.audiens.join('\n'),tujuan:d.tujuan.join('\n'),metrik:d.metrik.join('\n'),luar:d.luar.join('\n'),
    data:(d.data||[]).join('\n'),
    peran,
    halaman:d.peran.flatMap(([n,,,,,hal])=>(hal||[]).map(h=>({n:h,r:rid(n),on:true}))),
    fitur:d.fitur.map(([n,r,p,ds,k])=>({n,d:ds,p,k:(k||[]).join('\n'),r:peranDari(r),on:true})),
    alur:(d.alur||[]).map(([n,r,l])=>({n,r:rid(r),l:l.join('\n'),on:true})),
    blok:d.blok.map(b=>({id:b,on:true})),
    nfr:nfrFor(t.platform).map(([nid])=>({id:nid,on:nfrOnFor(t.platform).includes(nid)})),
    warna:d.warna,gaya:d.gaya,stack:stackFor(t.platform)[d.stack],waktu:'1 bulan',manual:null};
}

/* Merapikan isi yang datang dari penyimpanan, supaya data lama atau rusak tidak mematahkan tampilan.
   PRD yang disimpan sebelum ada peran (struktur v1) diberi peran, halaman, fitur, dan alur dari PRD perpustakaannya. */
export function fix(s){
  const platform=T[s.tpl].platform;
  TXT.forEach(k=>{s[k]=txt(s[k])});
  const base=fromBuiltin(s.tpl);
  const lama=!Array.isArray(s.peran);
  if(lama){
    s.peran=base.peran;
    const halPeran=new Map(base.halaman.map(h=>[h.n.toLowerCase(),h.r]));
    const fitPeran=new Map(base.fitur.map(f=>[f.n.toLowerCase(),f.r]));
    const hal=(s.halaman||[]).filter(x=>x&&typeof x.n==='string').map(x=>({...x,r:halPeran.get(x.n.toLowerCase())}));
    const fit=(s.fitur||[]).filter(x=>x&&typeof x.n==='string').map(x=>({...x,r:fitPeran.get(x.n.toLowerCase())}));
    // Halaman dan fitur peran lain yang baru ada di v2 ikut ditambahkan.
    s.halaman=[...hal,...base.halaman.filter(h=>!hal.some(x=>x.n.toLowerCase()===h.n.toLowerCase()))];
    s.fitur=[...fit,...base.fitur.filter(f=>!fit.some(x=>x.n.toLowerCase()===f.n.toLowerCase()))];
    s.alur=base.alur;
  }
  const ids=new Set();
  s.peran=s.peran.filter(x=>x&&typeof x.n==='string').map((x,i)=>{
    let id=typeof x.id==='string'&&x.id?x.id:rid(x.n);
    while(ids.has(id))id+='-'+i;
    ids.add(id);
    return {id,n:x.n,d:txt(x.d),m:txt(x.m),b:txt(x.b),t:txt(x.t),w:platform==='mobile'&&x.w==='web'?'web':'',on:x.on!==false};
  });
  if(!s.peran.length)s.peran=[{id:'pengguna',n:'Pengguna',d:'',m:'',b:'',t:'',w:'',on:true}];
  const utama=s.peran[0].id,ada=id=>ids.has(id);
  s.halaman=(s.halaman||[]).filter(x=>x&&typeof x.n==='string').map(x=>({n:x.n,r:ada(x.r)?x.r:utama,on:!!x.on}));
  s.fitur=(s.fitur||[]).filter(x=>x&&typeof x.n==='string').map(x=>{
    let r=Array.isArray(x.r)?x.r.filter(v=>v===SEMUA||ada(v)):[];
    if(r.includes(SEMUA))r=[SEMUA];
    return {n:x.n,d:txt(x.d),k:txt(x.k),p:PRI.includes(x.p)?x.p:'P1',r:r.length?r:[utama],on:!!x.on};
  });
  s.alur=(Array.isArray(s.alur)?s.alur:[]).filter(x=>x&&typeof x.n==='string').map(x=>({n:x.n,r:ada(x.r)?x.r:utama,l:txt(x.l),on:x.on!==false}));
  s.blok=(s.blok||[]).filter(x=>x&&BLOK[x.id]).map(x=>({id:x.id,on:!!x.on}));
  const nf=s.nfr||[];s.nfr=nfrFor(platform).map(([id])=>({id,on:nf.some(x=>x&&x.id===id&&x.on)}));
  if(!/^#[0-9a-f]{6}$/i.test(s.warna))s.warna=T[s.tpl].d.warna;
  if(!GAYA[s.gaya])s.gaya='bersih';
  s.stack=txt(s.stack)||stackFor(platform)[0];
  if(!['2 minggu','1 bulan','3 bulan'].includes(s.waktu))s.waktu='1 bulan';
  // Teks yang diedit langsung dengan struktur v1 tidak dibuang; pemeriksa memberi tahu cara memperbaruinya.
  s.manual=typeof s.manual==='string'?s.manual:null;
  s.jenis=txt(s.jenis);s.asal=txt(s.asal)||s.tpl;
  return s;
}
/* Isi awal PRD dari perpustakaan. PRD buatan admin (custom) didahulukan, lalu PRD bawaan. */
export function fromTemplate(id,custom){
  const c=(custom||[]).find(t=>t.id===id);
  if(c&&valid(c.state)){const s=fix(clone(c.state));s.jenis=c.name;s.asal=id;s.manual=null;return s}
  return fromBuiltin(T[id]?id:'landing');
}

/* ---------- Bacaan bersama untuk dokumen, editor, dan pratinjau ---------- */
// Peran yang aktif dan bernama. Peran pertama adalah peran utama: halaman pertamanya menjadi pratinjau utama.
export const peranAktif=s=>s.peran.filter(r=>r.on&&r.n.trim());
const aktifSet=s=>new Set(peranAktif(s).map(r=>r.id));
export const halamanPeran=(s,id)=>s.halaman.filter(h=>h.on&&h.r===id&&h.n.trim());
export const halamanAktif=s=>{const a=aktifSet(s);return s.halaman.filter(h=>h.on&&h.n.trim()&&a.has(h.r))};
// Fitur ikut dokumen bila salah satu perannya aktif. Fitur untuk semua peran selalu ikut.
export const fiturAktif=s=>{const a=aktifSet(s);return s.fitur.filter(f=>f.on&&f.n.trim()&&(f.r.includes(SEMUA)||f.r.some(r=>a.has(r))))};
export const alurAktif=s=>{const a=aktifSet(s);return s.alur.filter(x=>x.on&&x.n.trim()&&a.has(x.r))};
export function namaPeran(s,r){
  const ps=peranAktif(s);
  if(r.includes(SEMUA)||(ps.length>1&&ps.every(p=>r.includes(p.id))))return 'Semua peran';
  return ps.filter(p=>r.includes(p.id)).map(p=>p.n.trim()).join(', ');
}
export const fiturPeran=(s,id)=>fiturAktif(s).filter(f=>f.r.includes(SEMUA)||f.r.includes(id));
// Contoh isi panel (kartu angka, tabel, aktivitas) untuk peran tertentu, dari katalog.
export function panelPeran(tpl,id){
  const p=T[tpl].isi?.panel||{};
  const k=Object.keys(p).find(x=>rid(x)===id);
  return k?p[k]:null;
}

/* ---------- Struktur baku ----------
   Semua PRD memakai urutan dan judul bagian yang sama, supaya AI yang membacanya tahu persis
   di mana tiap informasi berada. "tm" adalah judul untuk aplikasi mobile bila berbeda. */
export const STRUKTUR='rancang-prd/v2';
const STRUKTUR_LAMA='rancang-prd/v1';
export const SECTIONS=[
 {n:1,t:'Ringkasan',d:'Dua sampai tiga kalimat: apa yang dibangun dan untuk siapa.'},
 {n:2,t:'Masalah',d:'Masalah yang diselesaikan, dari sudut pandang pengguna.'},
 {n:3,t:'Target pengguna',d:'Kelompok pengguna, satu per butir.'},
 {n:4,t:'Peran dan hak akses',d:'Tabel semua peran, lalu satu blok "### Nama peran" berisi yang bisa dan tidak bisa dilakukan, serta halamannya.'},
 {n:5,t:'Tujuan dan ukuran keberhasilan',d:'Subbagian "Tujuan" dan "Ukuran keberhasilan", masing-masing berupa daftar.'},
 {n:6,t:'Ruang lingkup',d:'Subbagian "Termasuk" dan "Di luar lingkup".'},
 {n:7,t:'Struktur halaman',tm:'Daftar layar',d:'Daftar bernomor semua halaman atau layar, dikelompokkan per peran dengan subjudul "### Nama peran".'},
 {n:8,t:'Alur utama',d:'Satu blok "### Alur 1: Judul" per alur, berisi peran yang menjalankannya dan langkah bernomor.'},
 {n:9,t:'Kebutuhan fungsional',d:'Satu blok per kebutuhan: ID FR, prioritas, peran, deskripsi, dan kriteria penerimaan.'},
 {n:10,t:'Susunan halaman utama',tm:'Susunan layar utama',d:'Urutan bagian di halaman pertama, ditambah isi halaman pertama peran lain.'},
 {n:11,t:'Model data',d:'Entitas dan atributnya, satu entitas per butir.'},
 {n:12,t:'Kebutuhan non-fungsional',d:'Satu butir per kebutuhan dengan ID NFR.'},
 {n:13,t:'Desain',d:'Gaya, warna merek, teks tombol utama, dan nada bahasa.'},
 {n:14,t:'Teknologi',d:'Stack yang dipakai dan cara hak akses diperiksa.'},
 {n:15,t:'Tahapan pengerjaan',d:'Daftar bernomor: tahap, waktu, dan hasilnya.'},
 {n:16,t:'Kriteria selesai',d:'Daftar periksa yang harus terpenuhi sebelum rilis.'},
 {n:17,t:'Pertanyaan terbuka',d:'Hal yang belum diputuskan.'},
 {n:18,t:'Instruksi untuk AI',d:'Aturan kerja bagi AI yang membangun dari dokumen ini.'},
];
// Nomor bagian menurut judulnya, supaya teks yang menyebut nomor bagian tidak perlu diubah bila struktur berubah.
export const NO=Object.fromEntries(SECTIONS.map(x=>[x.t,x.n]));
export const sectionTitle=(sec,mobile)=>`${sec.n}. ${mobile&&sec.tm?sec.tm:sec.t}`;
// Jumlah bagian dalam kata, untuk teks seperti "Delapan belas bagian".
export const jumlahBagian=()=>({16:'Enam belas',17:'Tujuh belas',18:'Delapan belas',19:'Sembilan belas',20:'Dua puluh'})[SECTIONS.length]||String(SECTIONS.length);
const PLATFORM_ID={web:'website',mobile:'aplikasi-mobile'};
const KOSONG='(belum diisi)';

/* ---------- Pembuat dokumen ---------- */
function tahap(w,mobile,p0,p1,p2){
  const unit=mobile?'layar':'halaman',uji=mobile?'Uji di ponsel Android dan iOS dengan akun tiap peran':'Uji di ponsel dan desktop dengan akun tiap peran';
  if(w==='2 minggu')return [['Rancang','Hari 1–3',`Peran, struktur ${unit}, desain ${unit} utama, dan konten awal disetujui`],['Bangun','Hari 4–10',`Masuk dan hak akses tiap peran, lalu ${p0} kebutuhan P0 selesai dan bisa dicoba`],['Uji dan rilis','Hari 11–14',`${uji}, perbaikan, lalu rilis`]];
  if(w==='3 bulan')return [['Riset dan desain','Bulan 1',`Wawancara pengguna tiap peran, struktur ${unit}, dan desain semua ${unit}`],['Bangun inti','Bulan 2',`Masuk dan hak akses tiap peran, ${p0} kebutuhan P0, dan ${p1} kebutuhan P1 selesai`],['Lengkapi dan rilis','Bulan 3',`${p2} kebutuhan P2 bila sempat, ${uji.charAt(0).toLowerCase()+uji.slice(1)}, lalu rilis`]];
  return [['Rancang','Minggu 1',`Peran, struktur ${unit}, dan desain ${unit} utama disetujui`],['Bangun inti','Minggu 2–3',`Masuk dan hak akses tiap peran, lalu ${p0} kebutuhan P0 selesai dan bisa dicoba`],['Lengkapi dan rilis','Minggu 4',`${p1} kebutuhan P1 yang sempat, ${uji.charAt(0).toLowerCase()+uji.slice(1)}, perbaikan, lalu rilis`]];
}
const one=v=>String(v||'').replace(/\s*\n\s*/g,' ').trim();
const cell=v=>one(v).replace(/\|/g,'/');
const pad=n=>String(n).padStart(2,'0');
// Judul yang tampil di halaman untuk sebuah bagian, diambil dari isi contoh PRD (sama dengan pratinjau).
// Ditulis di bagian 10 supaya AI tahu maksud bagian umum, misalnya "Testimoni" yang di undangan berarti ucapan dan doa.
export function judulBlok(id,i){
  const j={fitur:i.fiturJudul,unggul:i.unggulJudul,harga:i.hargaJudul,testi:i.testiJudul,produk:i.produkJudul,nawala:i.nawalaJudul,
    galeri:i.galeriJudul,layanan:i.layananJudul,artikel:i.artikelJudul,booking:i.booking?.judul,menu:i.menuJudul,lokasi:i.lokasi?.judul,
    acara:i.acaraJudul,tim:i.timJudul,agenda:i.agenda?.judul,listing:i.listing?.judul,kalkulator:i.kalk?.judul,lowongan:i.lowonganJudul,
    kampanye:i.kampanyeJudul,laporan:i.laporan?.judul,waktu:i.waktu?.judul,topik:i.topikJudul,grafik:i.grafikJudul,tabel:i.tabelJudul,
    'a-produk':i.judulProduk,'a-daftar':i.judulDaftar,'a-grafik':i.judulGrafik,'a-kartu':i.judulKartu,'a-rak':i.judulRak,
    'a-jadwal':i.jadwal?.judul,'a-status':i.status?.judul}[id];
  const v=typeof j==='string'?j.trim():'';
  // Judul yang sama dengan awal nama bagian (misalnya "Galeri" untuk "Galeri foto atau karya") tidak perlu ditulis.
  return v&&!String(BLOK[id]).toLowerCase().startsWith(v.toLowerCase())?v:'';
}
// Isi halaman pertama sebuah peran (selain peran utama), dari contoh panel di katalog.
// Panel web berisi kpi, grafik, tabel, dan acts; layar aplikasi berisi saldo dan daftar.
function isiPanel(p){
  const bag=[];
  if(p.kpi?.length)bag.push('kartu angka '+p.kpi.map(k=>k[0]).join(', '));
  if(p.saldo)bag.push(`kartu ringkasan "${p.saldo[0]}"`);
  if(p.grafik)bag.push(`grafik "${p.grafik.judul}"`);
  if(p.tabel)bag.push(`tabel "${p.tabel.judul}" dengan kolom ${p.tabel.kolom.join(', ')}`);
  if(p.daftar)bag.push(`daftar "${p.daftar.judul}"`);
  if(p.acts?.length)bag.push('aktivitas terbaru');
  return bag.join('; ');
}

export function genMd(s){
  const t=T[s.tpl],mobile=t.platform==='mobile',L=k=>lines(s[k]);
  const roles=peranAktif(s),feats=fiturAktif(s),flows=alurAktif(s);
  const nama=id=>one(roles.find(r=>r.id===id)?.n);
  const hal=id=>halamanPeran(s,id);
  const idOf=p=>feats.map((f,i)=>f.p===p?'FR-'+pad(i+1):null).filter(Boolean);
  const bl=s.blok.filter(b=>b.on).map(b=>{const j=judulBlok(b.id,t.isi||{});return BLOK[b.id]+(j?` (judul: "${j}")`:'')});
  const g=GAYA[s.gaya]||GAYA.bersih;
  const nfrs=nfrFor(t.platform);
  const unit=mobile?'layar':'halaman';
  const d=new Date(),tgl=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const list=a=>a.length?a.map(x=>'- '+x).join('\n'):'- '+KOSONG;
  const H=n=>'## '+sectionTitle(SECTIONS[n-1],mobile);
  const o=[];
  o.push('---',`struktur: ${STRUKTUR}`,`nama: ${one(s.nama)||KOSONG}`,`platform: ${PLATFORM_ID[t.platform]}`,`jenis: ${one(s.jenis||t.nama)}`,
    `peran: ${roles.map(r=>one(r.n)).join(', ')||KOSONG}`,'bahasa: id','status: draf',`tanggal: ${tgl}`,'---','');
  o.push(`# PRD: ${one(s.nama)||KOSONG}`,'',`> ${one(s.tagline)||KOSONG}`,'');
  o.push(H(1),one(s.deskripsi)||KOSONG,'');
  o.push(H(2),one(s.masalah)||KOSONG,'');
  o.push(H(3),list(L('audiens')),'');

  // 4. Peran dan hak akses
  o.push(H(4));
  if(!roles.length)o.push(KOSONG,'');
  else{
    const web=mobile&&roles.some(r=>r.w==='web');
    const kol=['Peran','Siapa','Cara masuk',...(web?['Memakai']:[])];
    o.push(`| ${kol.join(' | ')} |`,`| ${kol.map(()=>'---').join(' | ')} |`);
    roles.forEach(r=>o.push(`| ${cell(r.n)} | ${cell(r.d)||'-'} | ${cell(r.m)||'-'}${web?` | ${r.w==='web'?'Panel web':'Aplikasi'}`:''} |`));
    o.push('');
    roles.forEach(r=>{
      const b=lines(r.b),tb=lines(r.t),hp=hal(r.id);
      o.push(`### ${one(r.n)}`,'- **Bisa:**',...(b.length?b:[KOSONG]).map(x=>'  - '+x));
      if(tb.length)o.push('- **Tidak bisa:**',...tb.map(x=>'  - '+x));
      o.push(`- **${mobile&&r.w!=='web'?'Layar':'Halaman'}:** ${hp.length?hp.map(p=>one(p.n)).join(', '):'belum ada'}`,'');
    });
  }

  o.push(H(5),'### Tujuan',list(L('tujuan')),'','### Ukuran keberhasilan',list(L('metrik')),'');
  const p0=idOf('P0');
  o.push(H(6),'### Termasuk',
    `- Peran: ${roles.map(r=>one(r.n)).join(', ')||KOSONG}`,
    `- Semua kebutuhan fungsional berprioritas P0${p0.length?': '+p0.join(', '):''}`,
    '- Kebutuhan P1 dan P2 dikerjakan setelah semua P0 selesai','','### Di luar lingkup',list(L('luar')),'');

  // 7. Struktur halaman, per peran
  o.push(H(7));
  let no=0;
  roles.forEach(r=>{const hp=hal(r.id);if(hp.length)o.push(`### ${one(r.n)}`,...hp.map(p=>`${++no}. ${one(p.n)}`),'')});
  if(!no)o.push('1. '+KOSONG,'');
  else{
    o.push(`${mobile?'Layar':'Halaman'} milik peran yang perlu masuk hanya bisa dibuka setelah masuk dengan peran itu.`);
    if(mobile)o.push(`Di aplikasi, navigasi bawah tiap peran berisi empat layar pertama miliknya.${roles.some(r=>r.w==='web')?' Peran yang memakai panel web membuka halamannya lewat menu samping.':''}`);
    o.push('');
  }

  // 8. Alur utama
  o.push(H(8));
  if(!flows.length)o.push(KOSONG,'');
  flows.forEach((a,i)=>{
    const st=lines(a.l);
    o.push(`### Alur ${i+1}: ${one(a.n)}`,`- **Peran:** ${nama(a.r)||KOSONG}`,...(st.length?st:[KOSONG]).map((x,j)=>`${j+1}. ${x}`),'');
  });

  // 9. Kebutuhan fungsional
  o.push(H(9),'Prioritas: P0 = wajib ada di rilis pertama. P1 = menyusul setelah rilis. P2 = dikerjakan bila ada waktu.','');
  if(!feats.length)o.push(KOSONG,'');
  feats.forEach((f,i)=>{
    o.push(`### FR-${pad(i+1)}: ${one(f.n)}`,`- **Prioritas:** ${f.p}`,`- **Peran:** ${namaPeran(s,f.r)||KOSONG}`,`- **Deskripsi:** ${one(f.d)||KOSONG}`);
    const k=lines(f.k);
    if(k.length)o.push('- **Kriteria penerimaan:**',...k.map(x=>'  - [ ] '+x));
    o.push('');
  });

  // 10. Susunan halaman utama: halaman pertama peran utama, lalu halaman pertama peran lain yang punya contoh panel
  const r0=roles[0],h0=r0?hal(r0.id)[0]:null;
  o.push(H(10),`${mobile?'Layar':'Halaman'} ${h0?`"${one(h0.n)}"`:'pertama'}${r0?` untuk ${one(r0.n)}`:''}, urutan dari atas ke bawah:`,
    (mobile?['Bilah status dan judul layar',...bl,'Navigasi bawah']:t.app?['Menu samping dan bilah atas',...bl]:['Navigasi',...bl,'Footer']).map((b,i)=>`${i+1}. ${b}`).join('\n'),'');
  const lain=roles.slice(1).map(r=>{const p=panelPeran(s.tpl,r.id),h=hal(r.id)[0];return p&&h?`- **${one(r.n)}, ${unit} "${one(h.n)}":** ${isiPanel(p)}.`:null}).filter(Boolean);
  if(lain.length)o.push('### Halaman pertama peran lain',...lain,'');

  o.push(H(11),L('data').length?L('data').map(x=>{const i=x.indexOf(':');return i>0?`- **${x.slice(0,i).trim()}:** ${x.slice(i+1).trim()}`:'- '+x}).join('\n'):'- '+KOSONG,'');
  const on=s.nfr.filter(n=>n.on).map(n=>nfrs.find(x=>x[0]===n.id)).filter(Boolean);
  o.push(H(12),on.length?on.map((r,i)=>`- **NFR-${pad(i+1)} ${r[1]}:** ${r[2]}`).join('\n'):'- '+KOSONG,'');
  o.push(H(13),`- **Gaya:** ${g.nama}. ${g.ciri}`,`- **Huruf:** ${g.huruf}`,`- **Warna merek:** \`${s.warna}\``,`- **Tombol utama:** "${one(s.cta)||KOSONG}"`,`- **Nada bahasa:** ${g.nada}`,`- **Gaya ini cocok untuk:** ${g.cocok}`,'');
  o.push(H(14),`- **Stack:** ${one(s.stack)}`,
    `- **Masuk dan hak akses:** Tiap peran masuk dengan cara yang ditulis di bagian ${NO['Peran dan hak akses']}. Hak akses diperiksa di server pada setiap permintaan, bukan hanya dengan menyembunyikan tombol atau menu.`,'');
  const cnt=p=>feats.filter(f=>f.p===p).length;
  o.push(H(15),`Target: ${s.waktu}.`,'',tahap(s.waktu,mobile,cnt('P0'),cnt('P1'),cnt('P2')).map((r,i)=>`${i+1}. **${r[0]} (${r[1]}):** ${r[2]}`).join('\n'),'');
  o.push(H(16),
    mobile?'- [ ] Semua kebutuhan P0 lolos kriteria penerimaannya di Android dan iOS, pada ponsel sungguhan':'- [ ] Semua kebutuhan P0 lolos kriteria penerimaannya di Chrome, Safari, dan Firefox versi terbaru, di ponsel dan desktop',
    `- [ ] Tiap peran sudah dicoba dengan akunnya sendiri dan hanya bisa membuka ${unit} serta data sesuai bagian ${NO['Peran dan hak akses']}`,
    `- [ ] Semua alur di bagian ${NO['Alur utama']} bisa dijalankan dari awal sampai akhir`,
    `- [ ] Semua kebutuhan non-fungsional di bagian ${NO['Kebutuhan non-fungsional']} terpenuhi dan sudah diuji`,
    '- [ ] Tidak ada teks contoh atau tautan mati yang tersisa',
    '- [ ] Pemilik proyek sudah mencoba hasilnya dan menyetujuinya','');
  o.push(H(17),'- Siapa yang menyiapkan teks dan foto final, dan kapan tenggatnya?',
    '- Siapa yang mendapat akun admin pertama, dan bagaimana akun peran lain dibuat?',
    mobile?'- Akun developer Google Play dan App Store didaftarkan atas nama siapa?':'- Domain dan hosting dibeli atas nama siapa?',
    `- Siapa yang merawat ${mobile?'aplikasi':'website'} setelah rilis?`,'');
  o.push(H(18),
    '1. Baca seluruh dokumen ini sebelum menulis kode.',
    `2. Mulai dari peran dan hak akses (bagian ${NO['Peran dan hak akses']}) serta model data (bagian ${NO['Model data']}), karena semua fitur bergantung pada keduanya.`,
    '3. Kerjakan kebutuhan P0 lebih dulu, berurutan dari nomor FR terkecil. Jangan mengerjakan P1 dan P2 sebelum semua P0 lolos kriteria penerimaannya.',
    `4. Setiap ${unit} dan aksi hanya boleh dipakai oleh peran yang disebut di bagian ${NO['Peran dan hak akses']} dan di baris "Peran" pada tiap kebutuhan. Periksa hak akses di server.`,
    `5. Jangan menambah fitur, ${unit}, peran, atau pustaka yang tidak disebut di dokumen ini. Hal di "Di luar lingkup" tidak dikerjakan.`,
    `6. Ikuti bagian ${NO['Model data']} (Model data), ${NO['Desain']} (Desain), dan ${NO['Teknologi']} (Teknologi) apa adanya.`,
    '7. Bila ada yang tidak jelas atau saling bertentangan, tanyakan dulu sebelum menebak.',
    `8. Setelah tiap kebutuhan selesai, sebutkan ID-nya dan kriteria penerimaan yang sudah dipenuhi, lalu jalankan alur di bagian ${NO['Alur utama']} yang memakainya.`);
  return o.join('\n');
}

/* ---------- Pemeriksa struktur ----------
   Memeriksa teks PRD (hasil formulir maupun hasil edit langsung) terhadap struktur baku.
   level "wajib" = melanggar struktur; "saran" = sah, tetapi sebaiknya dilengkapi. */
// Memecah isi sebuah bagian menjadi blok menurut subjudul "### ".
function blokDari(lines_){
  const blocks=[];
  lines_.forEach(l=>{
    const m=l.match(/^### (.+?)\s*$/);
    if(m)blocks.push({head:m[1],text:''});
    else if(blocks.length)blocks[blocks.length-1].text+=l+'\n';
  });
  return blocks;
}
export function checkPrd(text){
  const out=[];
  const wajib=msg=>out.push({level:'wajib',msg}),saran=msg=>out.push({level:'saran',msg});
  let body=String(text||'').replace(/\r\n/g,'\n'),mobile=false;

  const fm=body.match(/^---\n([\s\S]*?)\n---\n?/);
  if(!fm)wajib('Blok metadata di awal dokumen (di antara dua baris "---") tidak ada.');
  else{
    const meta={};
    fm[1].split('\n').forEach(l=>{const i=l.indexOf(':');if(i>0)meta[l.slice(0,i).trim()]=l.slice(i+1).trim()});
    if(meta.struktur===STRUKTUR_LAMA){
      wajib(`Dokumen ini masih memakai struktur lama ${STRUKTUR_LAMA}, sebelum ada bagian peran dan alur. Buat ulang dari formulir dengan tombol "Pakai lagi hasil formulir", lalu pindahkan suntinganmu.`);
      return out;
    }
    if(meta.struktur!==STRUKTUR)wajib(`Metadata "struktur" harus berisi ${STRUKTUR}.`);
    if(!meta.nama||meta.nama===KOSONG)wajib('Metadata "nama" belum diisi.');
    if(!Object.values(PLATFORM_ID).includes(meta.platform))wajib('Metadata "platform" harus berisi website atau aplikasi-mobile.');
    mobile=meta.platform===PLATFORM_ID.mobile;
    body=body.slice(fm[0].length);
  }
  if(!/^# PRD: \S/m.test(body))wajib('Judul dokumen harus berbentuk "# PRD: Nama proyek".');

  // Pecah dokumen menjadi bagian menurut judul "## ".
  const found=[];
  body.split('\n').forEach(l=>{
    const m=l.match(/^## (.+?)\s*$/);
    if(m)found.push({title:m[1],lines:[]});
    else if(found.length)found[found.length-1].lines.push(l);
  });
  const expected=SECTIONS.map(sec=>sectionTitle(sec,mobile));
  let last=-1,ordered=true;
  found.forEach(f=>{
    const i=expected.indexOf(f.title);
    if(i<0){saran(`Bagian "${f.title}" tidak ada di struktur baku. AI bisa melewatkannya, jadi pindahkan isinya ke bagian yang sesuai.`);return}
    if(i<last)ordered=false;
    last=Math.max(last,i);
  });
  expected.forEach(title=>{
    const hits=found.filter(f=>f.title===title);
    if(!hits.length){wajib(`Bagian "${title}" tidak ada.`);return}
    if(hits.length>1)wajib(`Bagian "${title}" muncul lebih dari sekali.`);
    const isi=hits[0].lines.join('\n').trim();
    if(!isi)wajib(`Bagian "${title}" masih kosong.`);
    else if(isi.includes(KOSONG))wajib(`Bagian "${title}" masih punya isian "${KOSONG}".`);
  });
  if(!ordered)wajib(`Urutan bagian tidak sesuai struktur baku (1 sampai ${SECTIONS.length}).`);
  const bagian=n=>found.find(f=>f.title===expected[n-1]);
  const judul=n=>expected[n-1];

  // Peran dan hak akses: tiap peran satu blok "### Nama" dengan daftar "Bisa".
  const roleNames=[];
  const ps=bagian(NO['Peran dan hak akses']);
  if(ps){
    const blocks=blokDari(ps.lines);
    if(!blocks.length)wajib(`Bagian "${judul(NO['Peran dan hak akses'])}" belum punya blok "### Nama peran".`);
    blocks.forEach(b=>{
      const n=b.head.trim();
      if(roleNames.includes(n))wajib(`Peran "${n}" ditulis lebih dari sekali di bagian ${NO['Peran dan hak akses']}.`);
      roleNames.push(n);
      const ls=b.text.split('\n'),i=ls.findIndex(l=>/^- \*\*Bisa:\*\*\s*$/.test(l));
      if(i<0||!/^\s{2,}- \S/.test(ls[i+1]||''))wajib(`Peran "${n}" harus punya daftar "- **Bisa:**" berisi minimal satu hal.`);
    });
  }
  const dipakai=new Set();
  const cekPeran=(id,teks)=>{
    const v=teks.trim();
    if(/^semua peran$/i.test(v)){roleNames.forEach(n=>dipakai.add(n));return}
    v.split(',').map(x=>x.trim()).filter(Boolean).forEach(n=>{
      if(roleNames.length&&!roleNames.includes(n))wajib(`${id} memakai peran "${n}" yang tidak ada di bagian ${NO['Peran dan hak akses']}.`);
      else dipakai.add(n);
    });
  };

  // Struktur halaman: subjudul harus nama peran.
  const hs=bagian(NO['Struktur halaman']);
  if(hs&&roleNames.length){
    const blocks=blokDari(hs.lines);
    blocks.forEach(b=>{if(!roleNames.includes(b.head.trim()))saran(`Subjudul "${b.head}" di bagian ${NO['Struktur halaman']} bukan nama peran di bagian ${NO['Peran dan hak akses']}.`)});
    roleNames.forEach(n=>{if(!blocks.some(b=>b.head.trim()===n))saran(`Peran "${n}" belum punya ${mobile?'layar':'halaman'} di bagian ${NO['Struktur halaman']}.`)});
  }

  // Alur utama: "### Alur N: Judul", baris peran, dan minimal dua langkah bernomor.
  const as=bagian(NO['Alur utama']);
  if(as){
    const blocks=blokDari(as.lines);
    if(!blocks.length)wajib(`Bagian "${judul(NO['Alur utama'])}" belum punya blok "### Alur 1: Judul alur".`);
    let urut=true;
    blocks.forEach((b,i)=>{
      const m=b.head.match(/^Alur (\d+): \S/);
      if(!m){wajib(`Judul alur "${b.head}" harus berbentuk "Alur ${i+1}: Judul alur".`);return}
      if(+m[1]!==i+1)urut=false;
      const id='Alur '+m[1];
      const pr=b.text.match(/^- \*\*Peran:\*\* (.*)$/m);
      if(!pr||!pr[1].trim())wajib(`${id} harus punya baris "- **Peran:** Nama peran".`);
      else cekPeran(id,pr[1]);
      if(b.text.split('\n').filter(l=>/^\d+\.\s+\S/.test(l)).length<2)wajib(`${id} harus punya minimal dua langkah bernomor.`);
    });
    if(!urut)wajib('Nomor alur harus berurutan mulai dari Alur 1 tanpa ada yang terlewat.');
  }

  // Kebutuhan fungsional: tiap blok harus punya ID berurutan, prioritas, peran, dan deskripsi.
  const fr=bagian(NO['Kebutuhan fungsional']);
  if(fr){
    const blocks=blokDari(fr.lines);
    if(!blocks.length)wajib(`Bagian "${judul(NO['Kebutuhan fungsional'])}" belum punya satu pun blok "### FR-01: Nama kebutuhan".`);
    let p0=0,urut=true;
    blocks.forEach((b,i)=>{
      const m=b.head.match(/^FR-(\d{2}): \S/);
      if(!m){wajib(`Judul kebutuhan "${b.head}" harus berbentuk "FR-${pad(i+1)}: Nama kebutuhan".`);return}
      const id='FR-'+m[1];
      if(+m[1]!==i+1)urut=false;
      const pr=b.text.match(/^- \*\*Prioritas:\*\* (.*)$/m);
      if(!pr||!/^P[012]$/.test(pr[1].trim()))wajib(`${id} harus punya baris "- **Prioritas:** P0", P1, atau P2.`);
      else if(pr[1].trim()==='P0')p0++;
      const pe=b.text.match(/^- \*\*Peran:\*\* (.*)$/m);
      if(!pe||!pe[1].trim())wajib(`${id} harus punya baris "- **Peran:** Nama peran" atau "Semua peran".`);
      else cekPeran(id,pe[1]);
      const ds=b.text.match(/^- \*\*Deskripsi:\*\* (.*)$/m);
      if(!ds||!ds[1].trim())wajib(`${id} harus punya baris "- **Deskripsi:** ...".`);
      if(pr&&pr[1].trim()==='P0'&&!/^\s+- \[[ x]\] \S/m.test(b.text))saran(`${id} berprioritas P0 tetapi belum punya kriteria penerimaan. Tanpa itu AI tidak tahu kapan kebutuhan ini dianggap selesai.`);
    });
    if(!urut)wajib('Nomor FR harus berurutan mulai dari FR-01 tanpa ada yang terlewat.');
    if(blocks.length&&!p0)saran('Belum ada kebutuhan berprioritas P0, jadi AI tidak tahu apa yang harus dibangun lebih dulu.');
  }
  roleNames.forEach(n=>{if(!dipakai.has(n))saran(`Peran "${n}" belum dipakai di alur atau kebutuhan fungsional mana pun.`)});
  return out;
}
export const countLevel=(issues,level)=>issues.filter(x=>x.level===level).length;

/* ---------- Perender Markdown sederhana untuk tampilan "Baca" ---------- */
export function md(src){
  const inl=t=>e(t).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');
  const item=t=>{
    const m=t.match(/^\[([ x])\] (.*)$/);
    return m?`<span class="cb${m[1]==='x'?' on':''}" aria-hidden="true"></span>${inl(m[2])}`:inl(t);
  };
  let h='',text=String(src||'').replace(/\r\n/g,'\n');
  const fm=text.match(/^---\n([\s\S]*?)\n---\n?/);
  if(fm){
    h+='<dl class="doc-meta">'+fm[1].split('\n').filter(l=>l.includes(':')).map(l=>{const i=l.indexOf(':');return `<div><dt>${e(l.slice(0,i).trim())}</dt><dd>${e(l.slice(i+1).trim())}</dd></div>`}).join('')+'</dl>';
    text=text.slice(fm[0].length);
  }
  const L=text.split('\n');let i=0;
  const isLi=x=>/^\s*[-*]\s+/.test(x),isOl=x=>/^\s*\d+\.\s+/.test(x);
  while(i<L.length){const l=L[i];let m;
    if(!l.trim()){i++;continue}
    if((m=l.match(/^(#{1,4})\s+(.*)/))){const n=Math.min(6,m[1].length+2);h+=`<h${n}>${inl(m[2]).replace(/^(FR-\d{2}|Alur \d+):/,'<code>$1</code>')}</h${n}>`;i++;continue}
    if(l.startsWith('|')){const rows=[];while(i<L.length&&L[i].startsWith('|')){rows.push(L[i]);i++}
      const cells=r=>r.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());
      const body=rows.filter((r,j)=>!(j===1&&/^[|\s:-]+$/.test(r)));
      h+='<div class="tbl"><table><thead><tr>'+cells(body[0]).map(x=>`<th>${inl(x)}</th>`).join('')+'</tr></thead><tbody>'+body.slice(1).map(r=>'<tr>'+cells(r).map(x=>`<td>${inl(x)}</td>`).join('')+'</tr>').join('')+'</tbody></table></div>';continue}
    if(isLi(l)){
      // Daftar dua tingkat: butir yang menjorok dua spasi atau lebih menjadi anak butir sebelumnya.
      h+='<ul>';let open=false,sub=false;
      while(i<L.length&&isLi(L[i])){
        const deep=/^\s{2,}/.test(L[i]),t=item(L[i].replace(/^\s*[-*]\s+/,''));
        if(deep&&open){if(!sub){h+='<ul>';sub=true}h+=`<li>${t}</li>`}
        else{if(sub){h+='</ul>';sub=false}if(open)h+='</li>';h+=`<li>${t}`;open=true}
        i++;
      }
      if(sub)h+='</ul>';if(open)h+='</li>';h+='</ul>';continue}
    if(isOl(l)){
      // Daftar bernomor yang tidak mulai dari 1 (misalnya halaman peran kedua) tetap memakai nomor aslinya.
      const start=+(l.match(/^\s*(\d+)\./)[1]);
      h+=start>1?`<ol start="${start}">`:'<ol>';
      while(i<L.length&&isOl(L[i])){h+=`<li>${inl(L[i].replace(/^\s*\d+\.\s+/,''))}</li>`;i++}
      h+='</ol>';continue}
    if(l.startsWith('>')){h+=`<blockquote>${inl(l.replace(/^>\s?/,''))}</blockquote>`;i++;continue}
    const p=[l];i++;
    while(i<L.length&&L[i].trim()&&!/^(#{1,4}\s|\||>)/.test(L[i])&&!isLi(L[i])&&!isOl(L[i])){p.push(L[i]);i++}
    h+=`<p>${inl(p.join(' '))}</p>`;
  }
  return h;
}
