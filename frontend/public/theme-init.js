// Menerapkan mode terang/gelap sebelum halaman digambar, supaya tidak berkedip.
// Bawaannya gelap (hitam dan krem, gaya NOCTRA); terang hanya bila pernah dipilih lewat tombol tema.
var t = 'dark';
try {
  if (localStorage.getItem('rprd-theme') === 'light') t = 'light';
} catch (e) {}
document.documentElement.dataset.theme = t;
