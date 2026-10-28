import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Mode biasa: permintaan /api diteruskan ke server Go di port 8080 saat pengembangan.
// Mode demo ("npm run build:demo"): api.js diganti api.demo.js, sehingga aplikasi berjalan
// tanpa server dengan data contoh di peramban. Hasilnya masuk ke folder dist-demo.
export default defineConfig(({ mode }) => {
  const demo = mode === 'demo';
  return {
    plugins: [react()],
    resolve: demo
      ? {
          alias: [
            {
              find: /^(\.\.?\/)+(lib\/)?api\.js$/,
              replacement: fileURLToPath(new URL('./src/lib/api.demo.js', import.meta.url)),
            },
          ],
        }
      : {},
    // Katalog berisi puluhan PRD lengkap. Di situs biasa, katalog dan pustaka React dipisah menjadi berkas
    // tersendiri yang dimuat bersamaan, sehingga tidak ada satu berkas yang terlalu besar dan peramban bisa
    // menyimpannya terpisah. Mode demo dijadikan satu berkas saja karena dibungkus menjadi satu halaman HTML.
    build: demo
      ? { outDir: 'dist-demo', modulePreload: false, cssCodeSplit: false, chunkSizeWarningLimit: 1400, rolldownOptions: { output: { codeSplitting: false } } }
      : {
          chunkSizeWarningLimit: 900,
          rolldownOptions: {
            output: {
              codeSplitting: {
                groups: [
                  { name: 'katalog', test: /[\\/]src[\\/]katalog[\\/]/, priority: 2 },
                  { name: 'react', test: /[\\/]node_modules[\\/]/, priority: 1 },
                ],
              },
            },
          },
        },
    server: {
      port: 5173,
      proxy: { '/api': 'http://localhost:8080' },
    },
  };
});
