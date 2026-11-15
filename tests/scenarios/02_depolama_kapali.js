// Faz 1 Adım B — site verisi (localStorage) engelliyken açılış (KI-037/A-18 (doğrulama A-M01); 62 test listesi 6 "Ana menü",
// 7 "Yeni oyun"; brief madde 15). Kabul (dogrulama_A.json): localStorage erişimi SecurityError atarken window.__ready=true, ana menü
// görünür, oyun başlar (DK.handlers.startGame ve arayüzden "YENİ MACERA"), kayıt denemesi "kayıt yapılamıyor / tarayıcı kayda izin
// vermiyor" bildirimi verir; sayfa hatası 0, SecurityError konsol hatası 0. Normal açılış etkilenmez.
//
// Başlatma betiği (meta.baslatma; tests/fixtures/kosucu/depolama_engelle.js ile aynı engel): yalnız adreste ?depolama=kapali varsa,
// sayfa betiklerinden ÖNCE window.localStorage erişimini SecurityError atacak biçimde kapatır ve SecurityError/localStorage içeren
// console.error, 'error' ve 'unhandledrejection' olaylarını sayar. Koşucunun ilk açılışı (parametresiz) normal depolamayla olur,
// böylece engelli açılış kontrol düzeyinde ölçülür (açılış düşerse koşucunun 240 sn __ready beklemesine takılmaz).
// B0 düzeltmesi (inceleme B0-I17, brief madde 15 "startOnlineHost/Guest … yolları da korumalı"): engelli sayfa yerel sinyal sunucusuyla
// açılır (?peerhost=127.0.0.1&peerport=9000) ve sonda arayüzden ONLINE → Oda kur → Odayı oluştur → Oyunu başlat akışı sınanır (DK12–DK15).
[
 {meta: {testler: ['6 Ana menü', '7 Yeni oyun', 'KI-037', 'A-18 (doğrulama A-M01)'],
   dosyalar: ['js/core/save.js', 'js/main.js', 'js/ui/menu.js', 'js/core/settings.js', 'index.html'],
   baslatma: `(() => { if (!/[?&]depolama=kapali/.test(location.search)) return;
     Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException("Failed to read the 'localStorage' property from 'Window': Access is denied for this document.", 'SecurityError'); } });
     const say = window.__guvenlik = { konsol: 0, sayfa: 0, ornek: [] };
     const esles = (x) => { try { return /SecurityError|localStorage/i.test(String(x && ((x.name || '') + ' ' + (x.message || x)))); } catch (e) { return false; } };
     const ce = console.error; console.error = function (...a) { if (a.some(esles)) { say.konsol++; if (say.ornek.length < 3) say.ornek.push(a.map((x) => String(x && (x.message || x))).join(' ').slice(0, 200)); } return ce.apply(this, a); };
     window.addEventListener('error', (e) => { if (esles(e.error) || esles(e.message)) say.sayfa++; });
     window.addEventListener('unhandledrejection', (e) => { if (esles(e.reason)) say.sayfa++; }); })();`}},
 // ---- normal depolamayla açılış (gerileme koruması)
 {expect: {js: `!!document.getElementById('menu')?.classList.contains('active') && document.querySelectorAll('#menu-buttons .mbtn').length >= 8`, truthy: true, label: 'DK01 Normal depolamayla açılış: ana menü görünür, ≥ 8 düğme'}},
 // ---- site verisi engelli açılış
 {goto: {url: 'index.html?depolama=kapali&peerhost=127.0.0.1&peerport=9000', hazir: false}},
 {expect: {js: `(()=>{ try { void window.localStorage; return 'erişildi'; } catch (e) { return e.name; } })()`, eq: 'SecurityError', label: 'DK02 Kurulum: bu sayfada localStorage erişimi SecurityError atıyor'}},
 {expect: {js: `(async()=>{ const t0 = performance.now(); while (!window.__ready && performance.now() - t0 < 90000) { const t = document.getElementById('load-text'); if (t && /başlatılamadı/i.test(t.textContent) && performance.now() - t0 > 5000) break; await new Promise((r) => setTimeout(r, 250)); } window.__acilis = { ready: !!window.__ready, ms: Math.round(performance.now() - t0), yuklemeMetni: (document.getElementById('load-text') || {}).textContent }; return !!window.__ready; })()`, truthy: true, label: 'DK03 Site verisi engelliyken açılış tamamlanır (window.__ready)'}},
 {js: `window.__acilis`},
 {expect: {js: `!!document.getElementById('menu')?.classList.contains('active') && document.querySelectorAll('#menu-buttons .mbtn').length >= 8 && !document.getElementById('loading')?.classList.contains('active')`, truthy: true, label: 'DK04 Site verisi engelliyken ana menü görünür (≥ 8 düğme), yükleme ekranı kapalı'}},
 {expect: {js: `!/başlatılamadı|WebGL/i.test((document.getElementById('load-text') || {}).textContent || '')`, truthy: true, label: "DK05 Yükleme ekranında yanıltıcı 'Oyun başlatılamadı … WebGL' metni yok"}},
 {expect: {js: `/kayda izin vermiyor|kayıt yapılamıyor|kayıt yapılamayacak/i.test(document.body.innerText)`, truthy: true, label: 'DK06 Menüde görünür "tarayıcı kayda izin vermiyor / kayıt yapılamıyor" bildirimi var'}},
 // ---- arayüzden yeni oyun (YENİ MACERA → karakter oluşturucu → Maceraya Başla; yuva listesi save.list'ten gelir)
 {tikla: {metin: 'YENİ MACERA', tam: true}},
 {tikla: {metin: 'Maceraya Başla', tam: true, zaman: 15000}},
 {expect: {js: `(async()=>{ for (let i = 0; i < 300 && !(window.DK && DK.G.state === 'playing' && DK.G.player); i++) await new Promise((r) => setTimeout(r, 100)); return !!(window.DK && DK.G.state === 'playing' && DK.G.player); })()`, truthy: true, label: 'DK07 Site verisi engelliyken arayüzden yeni oyun başlar (YENİ MACERA → Maceraya Başla)'}},
 // ---- kayıt denemesi
 {js: `(()=>{ DK.handlers.saveNow(true); return [...document.querySelectorAll('#notify-stack > *')].map((e) => e.textContent).slice(-3); })()`},
 {expect: {js: `(async()=>{ await new Promise((r) => setTimeout(r, 300)); const t = [...document.querySelectorAll('#notify-stack > *')].map((e) => e.textContent).join(' | '); window.__bildirim = t; return /kayda izin vermiyor|kayıt yapılamıyor/i.test(t); })()`, truthy: true, label: 'DK08 Kayıt denemesi "tarayıcı kayda izin vermiyor / kayıt yapılamıyor" bildirimi verir'}},
 {js: `window.__bildirim`},
 // ---- menüye dönüş ve DK.handlers.startGame (kabuldeki yol)
 {js: `(()=>{ DK.handlers.toMenu(); return { durum: DK.G.state, menu: !!document.getElementById('menu')?.classList.contains('active') }; })()`},
 {expect: {js: `DK.G.state === 'menu' && !!document.getElementById('menu')?.classList.contains('active') && document.querySelectorAll('#menu-buttons .mbtn').length >= 8`, truthy: true, label: 'DK09 Site verisi engelliyken menüye dönüş ve menü yeniden çizimi çalışır'}},
 {js: `DK.G.noAutoPause = true; window.__bas = DK.handlers.startGame({ kind: 'solo', slot: 0 }); 'başlatıldı'`},
 {expect: {js: `(async()=>{ try { await window.__bas; } catch (e) { return 'hata: ' + e.message; } for (let i = 0; i < 100 && !(DK.G.state === 'playing' && DK.G.player); i++) await new Promise((r) => setTimeout(r, 100)); return DK.G.state === 'playing' && !!DK.G.player; })()`, truthy: true, label: 'DK10 Site verisi engelliyken DK.handlers.startGame({kind:"solo", slot:0}) ile oyun başlar'}},
 // ---- hata sayıları (başlatma betiğinin sayaçları; koşucu ayrıca bütün konsol/sayfa hatalarını sayar)
 {expect: {js: `(()=>{ const g = window.__guvenlik || { konsol: -1, sayfa: -1 }; window.__guvenlikOzet = g; return g.konsol === 0 && g.sayfa === 0; })()`, truthy: true, label: 'DK11 Engelli açılış boyunca SecurityError/localStorage içeren konsol hatası ve sayfa hatası 0'}},
 {js: `window.__guvenlikOzet`},
 // ---- B0-I17: ONLINE → Oda kur → Odayı oluştur → Oyunu başlat (startOnlineHost; site verisi engelli)
 {js: `(()=>{ DK.handlers.toMenu(); return { durum: DK.G.state }; })()`},
 {tikla: {metin: 'ONLINE', tam: true}},
 {tikla: {metin: 'Oda kur', tam: true}},
 {expect: {js: `(async()=>{ await new Promise((r) => setTimeout(r, 500)); return [...document.querySelectorAll('#modal.active .panel h2')].some((h) => h.textContent === 'Oda Kur'); })()`, truthy: true, label: 'DK12 Site verisi engelliyken ONLINE → Oda kur paneli açılır (yuva listesi okunabiliyor)'}},
 {tikla: {metin: 'Odayı oluştur', tam: true}},
 {expect: {js: `(async()=>{ for (let i = 0; i < 200; i++) { if (document.getElementById('start-btn')) return 'lobi'; if ([...document.querySelectorAll('#modal.active .panel h2')].some((h) => /kurulamadı/i.test(h.textContent))) return 'oda kurulamadı'; await new Promise((r) => setTimeout(r, 100)); } return 'zaman aşımı'; })()`, eq: 'lobi', label: 'DK13 Site verisi engelliyken oda kurulur (yerel sinyal sunucusu), lobi açılır'}},
 {tikla: '#start-btn'},
 {expect: {js: `(async()=>{ for (let i = 0; i < 300 && !(DK.G.state === 'playing' && DK.G.player); i++) await new Promise((r) => setTimeout(r, 100)); return DK.G.state === 'playing' && !!DK.G.player && DK.G.online === true; })()`, truthy: true, label: 'DK14 Site verisi engelliyken çevrimiçi oyun (oda sahibi) başlar (startOnlineHost korumalı)'}},
 {expect: {js: `(()=>{ const g = window.__guvenlik || { konsol: -1, sayfa: -1 }; window.__guvenlikOzet2 = g; return g.konsol === 0 && g.sayfa === 0; })()`, truthy: true, label: 'DK15 Çevrimiçi akış boyunca da SecurityError/localStorage içeren konsol hatası ve sayfa hatası 0'}},
 {js: `window.__guvenlikOzet2`},
]
