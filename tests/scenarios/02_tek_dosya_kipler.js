// Faz 1 Adım B (B0 test düzeltmesi; inceleme B0-I12) — tek dosya (dist/DenizKorsanlari-SonHazine.html) file:// altında badurl kipi
// (A-17, brief madde 14: "badurl kipini data:/blob altında da gerçekten bozuk içerik verecek biçimde düzelt"). Kabul (A-17): badurl
// kipi file:// altında 0 işçiyle yedek kipe geçer. v0.4'te badurl, data: adresine '#missing' parçası ekliyordu; parça içeriği
// değiştirmediği için işçiler çalışıyordu.
//   node tests/harness/run.cjs tests/scenarios/02_tek_dosya_kipler.js --url file:///…/dist/DenizKorsanlari-SonHazine.html
// Koşucunun ilk açılışı parametresizdir; badurl sayfası goto ile (hazir: false) açılır ve açılış yoklanır.
[
 {meta: {testler: ['2 Worker bulunamadığında', 'tek dosya', 'A-17', 'KI-165', 'brief madde 14'],
   dosyalar: ['tools/build-single-html.mjs', 'js/world/terrain.js']}},
 {expect: {js: `!!window.__ready && location.protocol === 'file:'`, truthy: true, label: 'TK00 Tek dosya file:// altında açıldı (parametresiz)'}},
 {goto: {url: '?terrain=badurl', hazir: false}},
 {expect: {js: `(async()=>{ const t0 = performance.now(); while (!window.__ready && performance.now() - t0 < 90000) await new Promise((r) => setTimeout(r, 200)); return !!window.__ready && !!window.DK; })()`, truthy: true, label: 'TK01 Tek dosyada ?terrain=badurl ile açılış tamamlanır (window.__ready)'}},
 {expect: {js: `(async()=>{ const T = DK.terrain; const t0 = performance.now(); let ok = false; while (performance.now() - t0 < 30000) { ok = T.mode === 'badurl' && T.workers.length === 0 && T.fallback === true && T.failures.length >= 1; if (ok) break; await new Promise((r) => setTimeout(r, 250)); } window.__badurl = { proto: location.protocol, mode: T.mode, workers: T.workers.length, fallback: T.fallback, failures: T.failures.slice(0, 4), url: String(window.__DK_WORKER_URL || '').slice(0, 48) }; return ok; })()`, truthy: true, label: 'TK02 Tek dosya file:// altında badurl kipi gerçekten bozuk işçi içeriği verir: 0 işçi, yedek kip açık, hata kaydı var (A-17)'}},
 {js: `window.__badurl`},
 {expect: {js: `DK.terrain.stats().meshes`, gte: 20, label: 'TK03 badurl kipinde tek dosyada arazi karoları üretilir (≥ 20 ağ; düzeltmeden sonra yerel yedekte, v0.4’te işçiler bozulmadığı için işçilerde)'}},
]
