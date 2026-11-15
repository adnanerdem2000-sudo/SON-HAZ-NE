// B1 tanı betiği (Node, sahte işçi): testlerin kapsamadığı üç yol.
//  T1 kalıcı karo hatası (işçide ve yerelde üretim hatası): üstel geri çekilme (1→2→4…≤30 sn), istek sıklığı, failures ≤ 50
//  T2 çalışan (kanıtlanmış) bütün işçiler birer kez çöker → yedek kip → yeniden başlatılan işçiler kanıtlanınca üretim işçilere döner
//     (fallback=false); T2b hiç çalışmamış (ilk işinde çöken) işçiler yeniden başlatılmaz
//  T3 prepare dönüşleri: ready=false iken 'ok'; normalde 'ok'; zaman aşımında 'timeout'; asla reddetmez
// Kullanım: node b1_tani.mjs [kök]
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
const KOK = process.argv[2] || '/home/user/SON-HAZ-NE-b1';
const THREE_URL = pathToFileURL(path.join(KOK, 'vendor', 'three', 'three.module.js')).href;
const GEN_URL = pathToFileURL(fs.realpathSync(path.join(KOK, 'js', 'world', 'terrainGen.js'))).href;
registerHooks({
  resolve(spec, ctx, next) { if (spec === 'three') return { url: THREE_URL, shortCircuit: true }; return next(spec, ctx); },
  // T1: tileGen, globalThis.__bozukKaro anahtarlı karoda hata fırlatır (işçide de yerelde de aynı kod)
  load(url, ctx, next) { const r = next(url, ctx); if (url !== GEN_URL) return r; const s = String(r.source);
    return { ...r, source: s.replace('export function* tileGen(m) {', 'export function* tileGen(m) {\n  if (globalThis.__bozukKaro !== undefined && m.key === globalThis.__bozukKaro) throw new Error("tanı: bozuk karo üretimi");') }; },
});
Object.defineProperty(globalThis, 'navigator', { value: { hardwareConcurrency: 4 }, configurable: true, writable: true });
const out = []; const log = (s) => { out.push(s); process.stdout.write(s + '\n'); };
const konsol = { w: 0, e: 0, i: 0 }; console.warn = () => konsol.w++; console.error = () => konsol.e++; console.info = () => konsol.i++;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const THREE = await import('three');
const { generate, runAll } = await import(GEN_URL);
let SAHNE = null;
class Sahte { constructor(url, o) { const S = SAHNE; this.S = S; this.no = S.kurulan++; this.olu = false; this.onmessage = null; this.onerror = null; this.alinan = 0; S.isciler.push(this);
    setTimeout(() => { if (!this.olu && this.onmessage) this.onmessage({ data: { t: 'ready' } }); }, 3); }
  postMessage(m) { const S = this.S; if (this.olu) return; this.alinan++; S.gonderim.push([this.no, m.t, m.key, performance.now()]);
    if (S.cok && S.cok(this, m)) { setTimeout(() => { if (!this.olu && this.onerror) this.onerror({ message: 'tanı: çökme', preventDefault() {} }); }, 1); return; }
    setTimeout(() => { if (this.olu) return; let d; try { d = runAll(generate(m)).out; } catch (e) { d = { t: 'error', id: m.id, msg: String(e.message) }; } this.onmessage && this.onmessage({ data: d }); }, 2); }
  terminate() { this.olu = true; } }
globalThis.Worker = Sahte;
let n = 0;
async function yeni(ayar = {}) { SAHNE = { kurulan: 0, isciler: [], gonderim: [], ...ayar }; const { terrain: T } = await import(pathToFileURL(path.join(KOK, 'js/world/terrain.js')).href + '?t=' + (++n)); return T; }
const sonuc = {};
// ---- T1
{
  const T = await yeni();
  const K = Math.floor((10 + 10000) / 160) * 1024 + Math.floor((222 + 10000) / 160);
  globalThis.__bozukKaro = K;
  T.init(new THREE.Scene(), 'high');
  const t0 = performance.now(); const zam = [];
  const oT = T._requestTile.bind(T); T._requestTile = (t, s, p) => { if (t.k === K) zam.push(Math.round(performance.now() - t0)); return oT(t, s, p); };
  // oyun döngüsü benzetimi: 65 sn boyunca 100 ms'de bir zorlamalı güncelleme
  while (performance.now() - t0 < 65000) { T.update(10, 222, true); await bekle(100); }
  const h = T._karoHata.get(K);
  const araliklar = zam.slice(1).map((v, i) => v - zam[i]);
  sonuc.T1 = { istekSayisi: zam.length, istekZamanlariMs: zam, araliklarMs: araliklar, sonAralikSn: araliklar.length ? araliklar[araliklar.length - 1] / 1000 : null, karoHata: h, failures: T.failures.length, hataToplam: T.stats().hataToplam, karoAgi: !!T.tiles.get(K)?.mesh, digerAg: T.stats().meshes };
  log('T1 ' + JSON.stringify(sonuc.T1));
  delete globalThis.__bozukKaro; T.ready = false;
}
// ---- T2
{
  let cokSay = 0;
  const T = await yeni({ cok: (w) => w.no < 3 && w.alinan === 2 && (++cokSay, true) }); // ilk üç işçi ikinci işinde (ilk işine yanıt verdikten sonra) bir kez çöker
  T.init(new THREE.Scene(), 'high');
  const r = await T.prepare(160, 470, { radius: 600 });
  const once = { donus: r, workers: T.workers.length, fallback: T.fallback, cokSay };
  const t0 = performance.now(); let geri = null;
  while (performance.now() - t0 < 15000) { if (T.workers.length === 3 && T.fallback === false) { geri = Math.round(performance.now() - t0); break; } T.update(160 + (performance.now() - t0) / 10, 470, true); await bekle(100); }
  sonuc.T2 = { once, geriDonusMs: geri, sonra: { workers: T.workers.length, fallback: T.fallback, kanitli: T.stats().isciKanit, kurulan: SAHNE.kurulan }, failures: T.failures.slice(0, 8) };
  log('T2 ' + JSON.stringify(sonuc.T2));
  T.ready = false;
}
// ---- T2b
{
  const T = await yeni({ cok: (w) => w.no < 3 && w.alinan === 1 }); // ilk üç işçi ilk işinde çöker (hiç çalışmamış)
  T.init(new THREE.Scene(), 'high');
  const r = await T.prepare(160, 470, { radius: 600 });
  await bekle(12000);
  sonuc.T2b = { donus: r, workers: T.workers.length, fallback: T.fallback, kurulan: SAHNE.kurulan, meshes: T.stats().meshes };
  log('T2b ' + JSON.stringify(sonuc.T2b));
  T.ready = false;
}
// ---- T3
{
  const T = await yeni();
  const r0 = await T.prepare(0, 0); // init öncesi
  T.init(new THREE.Scene(), 'high');
  const r1 = await T.prepare(160, 470, { radius: 300 });
  SAHNE.cok = () => false; for (const w of SAHNE.isciler) w.postMessage = function () {}; // bütün işçiler askıda (iş almaya devam eder, yanıt yok)
  const r2 = await T.prepare(-3000, 2000, { radius: 300, timeout: 50 });
  sonuc.T3 = { initOncesi: r0, normal: r1, zamanAsimi: r2 };
  log('T3 ' + JSON.stringify(sonuc.T3));
  T.ready = false;
}
log('konsol ' + JSON.stringify(konsol));
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify({ kok: KOK, node: process.version, sonuc, konsol }, null, 1));
process.exit(0);
