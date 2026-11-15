// Tanı: tileGen/depthGen parça (gen.next) süreleri, soğuk ve ılık; özellikle yield'siz son parça (etek + indeks)
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const KOK = process.argv[2] || '/home/user/SON-HAZ-NE-b1';
const { generate } = await import(pathToFileURL(path.join(KOK, 'js/world/terrainGen.js')).href);
const olc = (msg) => { const g = generate(msg); const d = []; for (;;) { const t = performance.now(); const r = g.next(); d.push(performance.now() - t); if (r.done) break; } return d; };
const ozet = (d) => ({ parca: d.length, enUzun: +Math.max(...d).toFixed(2), son: +d[d.length - 1].toFixed(2), toplam: +d.reduce((a, b) => a + b, 0).toFixed(1) });
const karo = (i, seg) => ({ t: 'tile', id: i, key: i, x0: -10000 + (62 + (i % 5)) * 160, z0: -10000 + (63 + (i % 3)) * 160, size: 160, seg, hires: seg === 80 });
console.log('soğuk ilk karo seg80', JSON.stringify(ozet(olc(karo(0, 80)))));
for (let k = 1; k <= 5; k++) console.log(`karo seg80 #${k}`, JSON.stringify(ozet(olc(karo(k, 80)))));
for (let k = 0; k < 200; k++) olc(karo(k, k % 2 ? 32 : 80));
console.log('ılık karo seg80', JSON.stringify(ozet(olc(karo(7, 80)))));
console.log('derinlik 512²', JSON.stringify(ozet(olc({ t: 'depth', id: 1, x0: -1200, z0: -1200, size: 2400, res: 512 }))));
