// Faz 1 Adım B (B0 test düzeltmesi; inceleme B0-I09) — kayıt yüklemede bölge hazırlığı beklemesi (62 test listesi 8 "Kayıt yükleme";
// KI-158/A-10; brief madde 6). Kabul (A-10): "Bekleme süresince yükleme katmanı görünür ve Esc duraklatma açmaz. İptal edilen start
// hiçbir durumu değiştirmez."
// Test verisi (DK ile; sınanan eylem değildir): yeni oyun, oyunun hızlı yolculuk olayıyla (ücret 0) Kuzeyfener'e (5,3 km) gidilir, kayıt
// alınır, menüye dönülür; sayfa yeniden yüklenir. Sınanan eylem ARAYÜZDEN yapılır: ana menüdeki "DEVAM ET".
// Bekleme penceresi uygulamadan bağımsız olarak uzatılır: terrain.prepare sarılır, asıl hazırlık bittikten sonra test bir "kapı"
// açana kadar söz sonuçlanmaz (yalnız bu sayfada; işçi kipinden ve makine hızından bağımsız). Kapı kapalıyken: yükleme katmanı,
// oyun durumu, Esc; sonra iptal (DK.handlers.toMenu: arayüzde iptal düğmesi yok) ve kapı açılır; devam kodunun hiçbir durumu
// değiştirmediği denetlenir.
[
 {meta: {testler: ['8 Kayıt yükleme', 'KI-158', 'A-10', 'brief madde 6'],
   dosyalar: ['js/main.js', 'js/game/game.js', 'js/ui/menu.js', 'js/ui/ui.js', 'js/world/terrain.js', 'js/core/save.js']}},
 // ---- test verisi: yuva 1'de uzak adada (Kuzeyfener) kayıt
 {expect: {js: `(async()=>{ const bekle = (ms) => new Promise((r) => setTimeout(r, ms)); DK.G.noAutoPause = true;
   await DK.handlers.startGame({ kind: 'solo', slot: 0, data: null }); for (let i = 0; i < 100 && !(DK.G.state === 'playing' && DK.G.player); i++) await bekle(100);
   const P = DK.ports.byId('kuzeyfener_port_0'); DK.G.emit('fastTravel', { to: P.id, from: 'kirlangic_limani', cost: 0 }); const t0 = performance.now();
   const vardi = () => { const s = DK.G.ship, p = DK.G.player; return !!s && Math.hypot(s.x - P.mooring.x, s.z - P.mooring.z) < 10 && !!p && Math.hypot(p.pos.x - P.boarding.x, p.pos.z - P.boarding.z) < 30; };
   while (!vardi() && performance.now() - t0 < 120000) await bekle(250);
   while (document.querySelector('#sleep-fade.on') && performance.now() - t0 < 130000) await bekle(250);
   const vardiMi = vardi();
   // v0.4'te biniş noktası iskelenin dışında (HYU-05): oyuncu suya düşer ve kayıt yüzerken son güvenli noktayı (Kırlangıç) yazar.
   // Test verisi için oyuncu limanın kara tarafındaki doğuş noktasına konur ve yere basması beklenir.
   const p = DK.G.player; p.pos.set(P.spawn.x, DK.terrain.heightAt(P.spawn.x, P.spawn.z) + 0.5, P.spawn.z); p.vel.set(0, 0, 0);
   const t1 = performance.now(); while (!(p.mode === 'ground' && p.onGround) && performance.now() - t1 < 8000) await bekle(100); await bekle(1500);
   DK.handlers.saveNow(true); await bekle(300); DK.handlers.toMenu(); await bekle(500);
   const d = DK.save.read('solo', 0); window.__veri = { vardi: vardiMi, mod: p.mode, kayitKonum: d && d.player && d.player.pos ? [Math.round(d.player.pos.x), Math.round(d.player.pos.z)] : null, durum: DK.G.state };
   return !!d && Math.hypot(d.player.pos.x - P.x, d.player.pos.z - P.z) < 150 && DK.G.state === 'menu'; })()`, truthy: true, label: "YB00 Test verisi: yuva 1'de Kuzeyfener'de (5,3 km) kayıt var, oyun menüde"}},
 {js: `window.__veri`},
 {degisken: {ad: 'kayitOnce', js: `JSON.stringify(DK.save.read('solo', 0))`}},
 // ---- temiz sayfa: ana menü + DEVAM ET; terrain.prepare kapısı
 {goto: 'index.html'},
 {js: `(()=>{ const T = DK.terrain; const C = window.__prepCagri = []; let ac; window.__kapi = new Promise((r) => { ac = r; }); window.__kapiAc = () => ac();
   const o = T.prepare; T.prepare = async function (x, z) { const k = { x: Math.round(x), z: Math.round(z), t0: performance.now(), asil: null, t1: null }; C.push(k); const r = await o.apply(this, arguments); k.asil = performance.now(); await window.__kapi; k.t1 = performance.now(); return r; };
   const B = window.__bildirimler = []; DK.G.on('notify', (n) => B.push({ text: String(n && n.text), t: performance.now() }));
   window.__oncesi = { durum: DK.G.state, oyuncu: !!DK.G.player, menu: !!document.getElementById('menu')?.classList.contains('active') };
   return window.__oncesi; })()`},
 {expect: {js: `!!document.querySelector('#menu .mbtn.primary') && /DEVAM ET/.test(document.getElementById('menu').innerText) && !DK.G.player`, truthy: true, label: 'YB01 Yeniden yüklenen sayfada ana menü ve DEVAM ET düğmesi var, oyuncu yok'}},
 {tikla: {metin: 'DEVAM ET', tam: true}},
 // ---- kapı kapalıyken (asıl hazırlık bitmiş ya da sürüyor; start bekliyor)
 {expect: {js: `(async()=>{ const K = JSON.parse(window.__KOSUCU.kayitOnce || 'null'), sp = K && K.player && K.player.pos ? K.player.pos : { x: 1e9, z: 1e9 }; const t0 = performance.now(); let k = null; while (performance.now() - t0 < 15000) { k = (window.__prepCagri || []).find((c) => Math.hypot(c.x - sp.x, c.z - sp.z) < 60 && c.t1 === null); if (k) break; await new Promise((r) => setTimeout(r, 100)); } window.__bekleme = { cagri: (window.__prepCagri || []).map((c) => [c.x, c.z]), kapida: !!k }; return !!k; })()`, truthy: true, label: "YB02 Önkoşul: DEVAM ET kayıttaki bölgenin (Kuzeyfener) hazırlığını başlattı ve start o hazırlığı bekliyor (kapı kapalı)"}},
 {js: `window.__bekleme`},
 {wait: 600, expect: {js: `(()=>{ const r = { yukleme: !!document.getElementById('loading')?.classList.contains('active'), perde: !!document.querySelector('#sleep-fade.on'), menu: !!document.getElementById('menu')?.classList.contains('active'), hud: !document.getElementById('hud')?.classList.contains('hidden'), durum: DK.G.state }; window.__katman = r; return r.yukleme || r.perde; })()`, truthy: true, label: 'YB03 Bölge hazırlığı beklenirken yükleme katmanı görünür (#loading etkin ya da perde açık; A-10)'}},
 {js: `window.__katman`},
 {expect: {js: `DK.G.state !== 'playing' ? 'oynanmıyor (' + DK.G.state + ')' : false`, truthy: true, label: "YB04 Bölge hazırlığı beklenirken oyun durumu 'playing' değil (A-10: G.state 'loading')"}},
 {key: 'Escape'},
 {wait: 800, expect: {js: `(()=>{ const h = [...document.querySelectorAll('#modal.active .panel h2')].map((e) => e.textContent); window.__esc = { paneller: h, duraklatildi: !!DK.G.paused }; return !h.includes('Duraklatıldı') && !DK.G.paused; })()`, truthy: true, label: 'YB05 Bölge hazırlığı beklenirken Esc duraklatma menüsünü açmaz (A-10)'}},
 {js: `window.__esc`},
 // ---- iptal: menüye dönüş, sonra kapı açılır; devam kodu hiçbir durumu değiştirmemeli
 {js: `(()=>{ window.__iptalAni = performance.now(); DK.handlers.toMenu(); return { durum: DK.G.state }; })()`},
 {js: `(async()=>{ window.__kapiAc(); const t0 = performance.now(); while (performance.now() - t0 < 30000 && (window.__prepCagri || []).some((c) => c.t1 === null)) await new Promise((r) => setTimeout(r, 100)); await new Promise((r) => setTimeout(r, 3000));
   const ani = window.__iptalAni; const r = window.__sonra = { durum: DK.G.state, menu: !!document.getElementById('menu')?.classList.contains('active'), hud: !document.getElementById('hud')?.classList.contains('hidden'), oyuncu: !!DK.G.player, bildirim: (window.__bildirimler || []).filter((b) => b.t > ani).map((b) => b.text), kilit: !!document.pointerLockElement };
   return r; })()`},
 {expect: {js: `(()=>{ const r = window.__sonra; return r.durum === 'menu' && r.menu === true && r.hud === false && r.oyuncu === false; })()`, truthy: true, label: "YB06 İptal edilen yükleme hiçbir durumu değiştirmez: hazırlık bittikten sonra da durum 'menu', ana menü açık, HUD kapalı, oyuncu kurulmamış (A-10, oturum belirteci)"}},
 {expect: {js: `!window.__sonra.bildirim.some((t) => /Kayıt yüklendi/i.test(t))`, truthy: true, label: "YB07 İptal edilen yükleme 'Kayıt yüklendi' bildirimi üretmez (A-10)"}},
 {expect: {js: `JSON.stringify(DK.save.read('solo', 0)) === window.__KOSUCU.kayitOnce`, truthy: true, label: 'YB08 İptal edilen yükleme kayıttaki veriyi değiştirmez (yuva 1 aynı)'}},
]
