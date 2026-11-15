// Faz 1 Adım B (B0 test düzeltmesi; inceleme B0-I12) — tek dosya sandbox'lı iframe'de (allow-scripts, allow-same-origin yok; köken
// 'null') açılır ve en az 1 arazi işçisi çalışır (A-16 kabulü: "sandbox'lı iframe'de 02_tek_dosya 4/4 geçer ve en az 1 işçi çalışır";
// brief madde 13).
// Koşucu kontrolleri üst çerçevede değerlendirir; opak kökenli çerçevenin DK'sine üst çerçeveden erişilemez. Bu yüzden başlatma betiği
// (koşucu addInitScript ile kurar; alt çerçevelerde de çalışır) alt çerçevede Worker kurulumunu sayar (kurulan, kurucu hatası, işçiden
// 'ready', işçiden yanıt, hata) ve 500 ms'de bir durumu postMessage ile üst çerçeveye yayınlar (köken, __ready, DK, işçi sayısı, yedek,
// hata kaydı, karo ağı, yükleme metni, yakalanmamış hatalar); üst çerçeve son iletiyi window.__cerceve'ye yazar. İletiler oyunu etkilemez.
// Üst sayfa tek dosyanın kendisidir (koşucunun ilk açılışı); iki oyun aynı süreçte koşmasın diye üst sayfanın çizimi oyunun FPS sınırı
// ayarıyla durdurulur. Not: allow-same-origin olmadan çerçevede localStorage erişimi SecurityError verir; depolama kapalı açılış ayrıca
// madde 15/A-18'in konusudur (02_depolama_kapali). TC03 işçi ölçütünü açılıştan bağımsız da ölçer (işçiden 'ready' ve yanıt).
//   node tests/harness/run.cjs tests/scenarios/02_tek_dosya_cerceve.js --url http://localhost:8081/dist/DenizKorsanlari-SonHazine.html
// (önce: v0.4'ten derlenen tek dosya geçici bir yerel sunucudan.)
[
 {meta: {testler: ['1 Normal Worker açılışı', 'tek dosya', 'A-16', 'brief madde 13'],
   dosyalar: ['tools/build-single-html.mjs', 'js/world/terrain.js'],
   baslatma: `(() => {
     if (window.top === window) {
       const C = window.__cerceve = { ileti: 0, son: null };
       window.addEventListener('message', (e) => { const d = e.data; if (d && d.__fb0Cerceve) { C.ileti++; C.son = d; } });
       return;
     }
     const K = { kurulan: [], kurucuHata: [], hazir: 0, yanit: 0, hata: [] }; const H = [];
     const W = window.Worker;
     if (typeof W === 'function') {
       function Sarili(url, opts) { const u = String(url).slice(0, 12); let w;
         try { w = new W(url, opts); } catch (e) { K.kurucuHata.push(u + ': ' + (e && e.name)); throw e; }
         K.kurulan.push(u);
         w.addEventListener('message', (e) => { if (e && e.data && e.data.t === 'ready') K.hazir++; else K.yanit++; });
         w.addEventListener('error', (e) => { if (K.hata.length < 5) K.hata.push(String((e && e.message) || 'error').slice(0, 100)); });
         return w; }
       Sarili.prototype = W.prototype; window.Worker = Sarili;
     }
     window.addEventListener('error', (e) => { if (H.length < 5) H.push(String(e && e.message).slice(0, 140)); });
     window.addEventListener('unhandledrejection', (e) => { if (H.length < 5) H.push('red: ' + String(e && e.reason && (e.reason.message || e.reason)).slice(0, 140)); });
     setInterval(() => { try {
       const T = window.DK && window.DK.terrain;
       parent.postMessage({ __fb0Cerceve: true, koken: String(self.origin), ready: !!window.__ready, dk: !!window.DK,
         workers: T ? T.workers.length : null, fallback: T ? T.fallback : null, failures: T ? T.failures.slice(0, 3).map(String) : null,
         meshes: T && typeof T.stats === 'function' ? T.stats().meshes : null,
         yukleme: ((document.getElementById('load-text') || {}).textContent || '').trim().slice(0, 160),
         isci: { kurulan: K.kurulan.slice(0, 6), kurucuHata: K.kurucuHata.slice(0, 6), hazir: K.hazir, yanit: K.yanit, hata: K.hata.slice() }, hatalar: H.slice() }, '*');
     } catch (e) { /* yoksay */ } }, 500);
   })();`}},
 {expect: {js: `!!window.__ready && /^https?:$/.test(location.protocol) && window.top === window`, truthy: true, label: 'TC00 Tek dosya http(s) altında açıldı (üst sayfa, parametresiz)'}},
 {js: `(()=>{ try { DK.engine.fpsLimit = 1e-6; } catch (e) { /* yoksay */ }
   const f = document.createElement('iframe'); f.id = 'fb0-cerceve'; f.setAttribute('sandbox', 'allow-scripts'); f.width = 640; f.height = 360;
   f.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;border:0;background:#000'; f.src = location.pathname + '?test=1'; document.body.appendChild(f);
   return { src: f.src, sandbox: f.getAttribute('sandbox') }; })()`},
 {expect: {js: `(async()=>{ const t0 = performance.now(); while (!(window.__cerceve && window.__cerceve.son) && performance.now() - t0 < 60000) await new Promise((r) => setTimeout(r, 250)); const s = window.__cerceve && window.__cerceve.son; return s ? s.koken : 'çerçeveden ileti yok'; })()`, eq: 'null', label: "TC01 Önkoşul: tek dosya sandbox'lı iframe'de (allow-scripts, allow-same-origin yok) yüklendi, köken 'null'"}},
 {expect: {js: `(async()=>{ const t0 = performance.now(); let s = null; while (performance.now() - t0 < 120000) { s = window.__cerceve && window.__cerceve.son; if (s && s.ready) break; await new Promise((r) => setTimeout(r, 500)); } window.__tc02 = s; return !!(s && s.ready); })()`, truthy: true, label: "TC02 Sandbox'lı iframe'de açılış tamamlanır (window.__ready, 120 sn içinde)"}},
 {js: `window.__tc02`},
 {expect: {js: `(async()=>{ const ok = (s) => !!(s && s.isci && s.isci.hazir >= 1 && s.isci.yanit >= 1 && (!s.dk || (s.workers >= 1 && s.fallback === false))); const t0 = performance.now(); let s = null; while (performance.now() - t0 < 30000) { s = window.__cerceve && window.__cerceve.son; if (ok(s)) break; await new Promise((r) => setTimeout(r, 500)); } window.__tc03 = s; return ok(s); })()`, truthy: true, label: "TC03 Sandbox'lı iframe'de en az 1 arazi işçisi çalışır: işçiden 'ready' ve iş yanıtı geldi; DK varsa DK.terrain.workers ≥ 1 ve yedek kapalı (A-16)"}},
 {js: `window.__tc03`},
 {expect: {js: `(()=>{ const s = window.__cerceve && window.__cerceve.son; return s && typeof s.meshes === 'number' ? s.meshes : 'çerçevede DK yok'; })()`, gte: 20, label: "TC04 Sandbox'lı iframe'de arazi karoları üretildi (≥ 20 ağ)"}},
]
