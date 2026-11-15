// Kaynak: karşıt denetçinin tanısı (faz1b_b1_denetim/tani/workers_kapsam.mjs), değiştirilmeden kopyalandı (B1 düzeltici, önce/sonra karşılaştırması için).
// workers alıcısının anlamı (B1): KY05 gibi hiç hazır olmayan işçilerde değişmez örnekleyicinin gördüğü kayıtlar
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const KOK = process.argv[2];
registerHooks({ resolve(spec, ctx, next) { if (spec === 'three') return { url: pathToFileURL(path.join(KOK, 'vendor', 'three', 'three.module.js')).href, shortCircuit: true }; return next(spec, ctx); } });
const THREE = await import('three');
Object.defineProperty(globalThis, 'navigator', { value: { hardwareConcurrency: 4 }, configurable: true, writable: true });
console.warn = () => {}; console.info = () => {};
class Sessiz { postMessage() {} terminate() {} }
globalThis.Worker = Sessiz;
const { terrain: T } = await import(pathToFileURL(path.join(KOK, 'js', 'world', 'terrain.js')).href);
T.init(new THREE.Scene(), 'high');
const p = T.prepare(160, 470, { radius: 900 });
const ornek = [];
for (const ms of [100, 500, 2000, 5000]) { await new Promise((r) => setTimeout(r, ms - (ornek.at(-1)?.t || 0))); ornek.push({ t: ms, workers: T.workers.length, kayit: (T._isciler || T.workers).length, kayitYuva: (T._isciler || T.workers).map((r) => r.jobs.size) }); }
await p;
console.log(JSON.stringify({ kok: path.basename(KOK), ornek }));
process.exit(0);
