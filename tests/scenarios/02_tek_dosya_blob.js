// Faz 1 Adım B (B0 test düzeltmesi; inceleme B0-I12) — tek dosya http(s) altında blob: işçisi kurulamazsa data: ile ikinci deneme
// (A-16, brief madde 13). Başlatma betiği, YALNIZ adreste ?blob=red varsa blob: adresli Worker kurulumunu SecurityError ile reddeder
// (CSP ya da opak köken benzetimi); data: ve diğer adresler değişmez. Koşucunun ilk açılışı parametresizdir (normal); reddedilen
// sayfa goto {hazir: false} ile açılır ve açılış 120 sn'ye kadar yoklanır (FB0 ilk koşusu: v0.4 tek dosyası blob reddinde
// "Arazi örülüyor…"da takıldı ve koşucunun 240 sn __ready beklemesi KOSUCU_HATASI verdi).
// Kabul (A-16): en az 1 işçi çalışır, yedek kip kapalı.
//   node tests/harness/run.cjs tests/scenarios/02_tek_dosya_blob.js --url http://localhost:8081/dist/DenizKorsanlari-SonHazine.html
// (önce: v0.4'ten derlenen tek dosya geçici bir yerel sunucudan.) Sandbox'lı iframe (köken 'null') durumu ayrı senaryoda:
// 02_tek_dosya_cerceve.js (çerçevedeki durum başlatma betiğindeki postMessage köprüsüyle üst çerçeveye taşınır).
[
 {meta: {testler: ['1 Normal Worker açılışı', 'tek dosya', 'A-16', 'brief madde 13'],
   dosyalar: ['tools/build-single-html.mjs', 'js/world/terrain.js'],
   baslatma: `(() => { if (!/[?&]blob=red/.test(location.search)) return; const W = window.Worker; if (typeof W !== 'function') return; const K = window.__isciKurulum = [];
     function Sarili(url, opts) { const u = String(url); K.push(u.slice(0, 16)); if (/^blob:/i.test(u)) throw new DOMException('Test: blob işçisi reddedildi', 'SecurityError'); return new W(url, opts); }
     Sarili.prototype = W.prototype; window.Worker = Sarili; })();`}},
 {expect: {js: `!!window.__ready && /^https?:$/.test(location.protocol)`, truthy: true, label: 'TB00 Tek dosya http(s) altında açıldı (parametresiz)'}},
 {js: `({ url: String(window.__DK_WORKER_URL || '').slice(0, 40), workers: DK.terrain.workers.length, fallback: DK.terrain.fallback })`},
 {goto: {url: '?blob=red', hazir: false}},
 {expect: {js: `(async()=>{ const t0 = performance.now(); while (!window.__ready && performance.now() - t0 < 120000) await new Promise((r) => setTimeout(r, 250)); window.__acilis = { ready: !!window.__ready, ms: Math.round(performance.now()), yukleme: ((document.getElementById('load-text') || {}).textContent || '').trim(), kurulum: window.__isciKurulum || null }; return !!window.__ready; })()`, truthy: true, label: 'TB03 blob: işçisi kurulamazken tek dosyanın açılışı tamamlanır (window.__ready, 120 sn içinde)'}},
 {js: `window.__acilis`},
 {expect: {js: `(async()=>{ if (!window.DK) return 'açılış yok'; const T = DK.terrain; const t0 = performance.now(); while (performance.now() - t0 < 20000 && !(T.workers.length >= 1 && T.fallback === false)) await new Promise((r) => setTimeout(r, 250)); window.__blob = { kurulum: window.__isciKurulum, workers: T.workers.length, fallback: T.fallback, failures: T.failures.slice(0, 3) }; return T.workers.length >= 1 && T.fallback === false; })()`, truthy: true, label: 'TB01 blob: işçisi kurulamazsa data: ile ikinci deneme yapılır: en az 1 işçi çalışır, yedek kip kapalı (A-16)'}},
 {js: `window.__blob`},
 {expect: {js: `window.DK ? DK.terrain.stats().meshes : 'açılış yok'`, gte: 20, label: 'TB02 Tek dosyada arazi karoları üretildi (≥ 20 ağ)'}},
]
