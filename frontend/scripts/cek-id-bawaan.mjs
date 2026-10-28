// Memastikan daftar PRD bawaan di backend (builtinTemplates di admin.go) sama dengan katalog frontend.
// Jalankan dari folder frontend: node scripts/cek-id-bawaan.mjs
import { readFileSync } from 'node:fs';
import { TPL_IDS } from '../src/lib/catalog.js';

const go = readFileSync(new URL('../../backend/internal/api/admin.go', import.meta.url), 'utf8');
const blok = go.slice(go.indexOf('var builtinTemplates'), go.indexOf('}', go.indexOf('var builtinTemplates')));
const diGo = [...blok.matchAll(/"([a-z0-9-]+)": true/g)].map((m) => m[1]);
const kurang = TPL_IDS.filter((id) => !diGo.includes(id));
const lebih = diGo.filter((id) => !TPL_IDS.includes(id));
if (kurang.length || lebih.length) {
  console.error('Daftar PRD bawaan tidak sama.');
  if (kurang.length) console.error('Belum ada di admin.go:', kurang.join(', '));
  if (lebih.length) console.error('Ada di admin.go tetapi tidak di katalog:', lebih.join(', '));
  process.exit(1);
}
console.log(`Daftar PRD bawaan sama: ${TPL_IDS.length} PRD.`);
