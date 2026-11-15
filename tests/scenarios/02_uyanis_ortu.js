// Faz 1 Adım B2 düzeltmesi (karşıt denetim bulguları B2-D1, B2-D2, B2-D3): uzak uyanışın kenar durumları ve örtü (KI-237)
// altında oyun döngüsü ile girdi. Normal kipte koşulur:
//   node tests/harness/run.cjs tests/scenarios/02_uyanis_ortu.js --url http://localhost:8085/index.html --size 640x360 --timeout 600
// Her bölüm sayfayı yeniden yükleyip yeni oyunla başlar (bir bölümde ölü kalan oyuncu sonrakini bozmasın).
//   1) B2-D2: hızlı yolculuk perdesi süresince (oyun girdisi kilitliyken) oyun döngüsü sürer: güncelleyiciler ve net.update her
//      karede çağrılır (oda sahibinin anlık görüntüleri, HUD, benzetim durmaz), 3B sahne çizilmez (KI-237). Perde altında GERÇEK
//      klavye olayıyla (koşucunun key adımı, Playwright) basılan Tab/M/E/Space varışta işlenmez; varıştan sonra girdi çalışır.
//   2) B2-D1a: önceki oturumdan kalan bekleyen uyanış (hazırlığı 15 sn geciktirilir) yeni oturumdaki uyanışı engellemez.
//   3) B2-D1b: aynı oturumda bekleyen uyanış sürerken oyuncu kaldırılıp (co-op 'revive') yeniden bayılırsa yeni seçim çalışır;
//      eski hazırlık bitince oyuncuyu eski seçime (gemiye) taşımaz.
//   4) B2-D1c: gemide uyanış beklenirken gemi batarsa oyuncu limanda uyanır (ölü, perdesiz ve ekransız kalmaz).
//   5) B2-D3: uyanış perdesi gemi adını düz metin olarak gösterir (HTML yorumlanmaz).
// "Önce": düzeltmeden önceki B2 ağacında (faz1-b2, taban 03b5c97 + B2 uygulaması) UO11, UO12, UO21, UO22, UO31, UO32, UO41, UO50
// kırmızıdır (kayıt: docs/v05/kosular/faz1/sonra_b2/duzeltme/once/).
[
 {meta: {testler: ['B2-D1 uzak uyanış kilitlenmesi', 'B2-D2 örtü altında oyun döngüsü ve girdi', 'B2-D3 uyanış perdesi metni', 'A-14', 'A-03', 'KI-237'],
   dosyalar: ['js/main.js', 'js/game/game.js', 'js/core/engine.js', 'js/core/input.js'],
   izinliHatalar: [
     {desen: 'data:,', gerekce: 'Bölüm 5: gemi adına konan <img src="data:,"> düzeltmeden önce HTML olarak yorumlanıp çözülemeyen görsel isteği üretir (perde HTML yorumlama tanısı)', tur: 'hepsi'},
   ]}},
 {degisken: {ad: 'yardimci', deger: `(()=>{ const Y = window.__Y = {};
   Y.bekle = (ms) => new Promise((r) => setTimeout(r, ms));
   Y.perde = () => !!document.querySelector('#sleep-fade.on');
   Y.yeniOyun = async (slot) => { DK.G.noAutoPause = true; await DK.handlers.startGame({ kind: 'solo', slot: slot || 0, data: null }); for (let i = 0; i < 100 && !(DK.G.state === 'playing' && DK.G.player); i++) await Y.bekle(100); return DK.G.state === 'playing' && !!DK.G.player; };
   Y.gemiUzaga = (x, z) => { const s = DK.G.ship; s.x = x; s.z = z; s.vx = 0; s.vz = 0; s.speed = 0; s.anchored = true; s.anchorPt = null; s.updateTransform(0); return [s.x, s.z]; };
   Y.geciktir = (ms) => { const T = DK.terrain, o = T.prepare; const D = window.__gecikme = { ms, basladi: null, bitti: false }; T.prepare = function (x, z, op) { if (op && op.radius === 400 && D.basladi === null) { T.prepare = o; D.basladi = Math.round(performance.now()); D.x = Math.round(x); D.z = Math.round(z); const self = this, args = arguments; return new Promise((r) => setTimeout(r, ms)).then(() => o.apply(self, args)).finally(() => { D.bitti = true; }); } return o.apply(this, arguments); }; return D; };
   Y.uyanisBitti = async (sinir) => { const t0 = performance.now(); while (performance.now() - t0 < (sinir || 60000) && (DK.input.isBlocked() || Y.perde())) await Y.bekle(200); await Y.bekle(1000); };
   Y.durum = () => { const p = DK.G.player, s = DK.G.ship, H = DK.ports.byId('kirlangic_limani'); return { olu: p.dead, mod: p.mode, panel: DK.ui.isOpen(), kilit: DK.input.isBlocked(), perde: Y.perde(), limanaUzaklik: Math.round(Math.hypot(p.pos.x - H.x, p.pos.z - H.z)), gemiyeUzaklik: s ? Math.round(Math.hypot(p.pos.x - s.x, p.pos.z - s.z)) : null, oturum: DK.G.session }; };
   return Object.keys(Y); })()`}},
 {js: `eval(window.__KOSUCU.yardimci)`},
 // ==== 1) B2-D2: örtü altında oyun döngüsü ve gerçek klavye olayları (Kırlangıç → Tuz Pazarı)
 {expect: {js: `window.__Y.yeniOyun(0)`, truthy: true, label: 'UO00 (bölüm 1) Yeni oyun başladı'}},
 {wait: 1500, js: `(()=>{ const T = window.__T1 = { tik: 0, net: 0, cizim: 0, cizimSonra: 0, blok: [], tus: [], olay: [], varis: null };
   DK.engine.updaters.add(() => { if (DK.input.isBlocked()) T.tik++; });
   const nu = DK.net.update; DK.net.update = function () { if (DK.input.isBlocked()) T.net++; return nu.apply(this, arguments); };
   const pr = DK.post.render; DK.post.render = function () { if (DK.input.isBlocked()) T.cizim++; else if (T.varis) T.cizimSonra++; return pr.apply(this, arguments); };
   window.addEventListener('keydown', (e) => { T.tus.push({ code: e.code, kilit: DK.input.isBlocked(), perde: window.__Y.perde(), t: Math.round(performance.now()) }); }, true);
   for (const ad of ['openInventory', 'openMap', 'openJournal', 'openSkills']) DK.G.on(ad, () => T.olay.push({ ad, t: Math.round(performance.now()) }));
   let b = false; T.iv = setInterval(() => { const k = DK.input.isBlocked(); if (k !== b) { T.blok.push([k ? 'kilit' : 'acik', Math.round(performance.now())]); b = k; } }, 10);
   DK.G.on('arrivedPort', () => { if (!T.varis) T.varis = Math.round(performance.now()); });
   const p = DK.G.player; p.inv.gold = 2000; T.fps0 = DK.engine.fpsLimit; T.butce0 = DK.terrain.localBudget;
   /* kilit fastTravel işleyicisinde eşzamanlı alınır: başlangıç anı yayım anıdır (yoklayıcının ilk tiki ana iş parçacığı meşgulse gecikir) */
   T.t0 = Math.round(performance.now()); DK.G.emit('fastTravel', { to: 'tuz_pazari_port_0', from: 'kirlangic_limani', cost: 50 }); T.kilitHemen = DK.input.isBlocked();
   return { kilitli: T.kilitHemen, perde: window.__Y.perde(), fps0: T.fps0, butce0: T.butce0 }; })()`},
 {wait: 250, key: 'Tab'},
 {key: 'KeyM'},
 {key: 'KeyE'},
 {key: 'Space'},
 {expect: {js: `(()=>{ const T = window.__T1; window.__T1tus = T.tus.slice(); return T.tus.length === 4 && T.tus.every((k) => k.kilit && k.perde); })()`, truthy: true, label: 'UO10 Önkoşul: dört tuş (Tab, M, E, Boşluk) gerçek klavye olayıyla, hızlı yolculuk perdesi açık ve oyun girdisi kilitliyken basıldı'}},
 {js: `window.__T1tus`},
 {js: `(async()=>{ const T = window.__T1, Y = window.__Y, t0 = performance.now(); while (performance.now() - t0 < 90000 && !T.varis) await Y.bekle(100); while (performance.now() - t0 < 100000 && (Y.perde() || DK.input.isBlocked())) await Y.bekle(100); await Y.bekle(1500); clearInterval(T.iv);
   const ac = T.blok.find((x) => x[0] === 'kilit'), kapa = T.blok.find((x) => x[0] === 'acik'); T.blokYoklama = ac && kapa ? kapa[1] - ac[1] : null;
   T.blokMs = T.kilitHemen && kapa ? kapa[1] - T.t0 : null; T.tikSn = T.blokMs ? +(T.tik / (T.blokMs / 1000)).toFixed(1) : null;
   const k0 = T.tus.length ? T.tus[0].t : 0; T.olaySonra = T.olay.filter((o) => o.t >= k0).map((o) => o.ad); T.son = { panel: DK.ui.isOpen(), uiOpen: !!DK.G.uiOpen, mod: DK.G.player.mode, fps: DK.engine.fpsLimit, butce: DK.terrain.localBudget };
   return { varis: !!T.varis, blokMs: T.blokMs, blokYoklama: T.blokYoklama, tik: T.tik, tikSn: T.tikSn, net: T.net, cizimBlok: T.cizim, cizimSonra: T.cizimSonra, olaySonra: T.olaySonra, son: T.son }; })()`},
 {expect: {js: `(()=>{ const T = window.__T1; return !!T.varis && T.blokMs >= 1000 && T.tikSn >= 5 && T.net >= 5; })()`, truthy: true, label: 'UO11 Hızlı yolculuk perdesi (girdi kilidi) süresince oyun döngüsü sürer: güncelleyiciler saniyede ≥ 5 kez ve net.update ≥ 5 kez çağrıldı (B2-D2; önce: örtü motorun kare sınırını 0,25 FPS yapıyor, 0 tik). Kilit süresi yayım anından ölçülür (kilit eşzamanlı alınır)'}},
 {expect: {js: `(()=>{ const T = window.__T1; return T.olaySonra.length === 0 && !T.son.panel && !T.son.uiOpen; })()`, truthy: true, label: 'UO12 Perde altında gerçek klavyeyle basılan Tab/M/E/Boşluk varışta işlenmez: envanter/harita olayı yok, panel açık değil (B2-D2; önce: basışlar birikip kilit kalkınca ilk karede işleniyordu)'}},
 {expect: {js: `(()=>{ const T = window.__T1; return T.cizim === 0 && T.cizimSonra >= 1 && T.son.fps === T.fps0 && T.son.butce === T.butce0; })()`, truthy: true, label: 'UO14 Örtü süresince 3B sahne çizilmez (KI-237), örtü kapanınca çizim sürer; motorun kare sınırı ve yerel dilim bütçesi eski değerinde'}},
 {js: `(()=>{ DK.ui.closeAll(); window.__T1.olay.length = 0; window.__T1.t13 = Math.round(performance.now()); return 'hazır'; })()`},
 {wait: 400, key: 'Tab'},
 {wait: 600, expect: {js: `(()=>{ const T = window.__T1; const r = T.olay.filter((o) => o.t >= T.t13).map((o) => o.ad); DK.ui.closeAll(); return r.includes('openInventory') && !DK.input.isBlocked(); })()`, truthy: true, label: 'UO13 Varıştan sonra girdi çalışır: gerçek klavyeyle Tab envanteri açar, kilit kalkmış'}},
 // ==== 2) B2-D1a: önceki oturumdan kalan bekleyen uyanış yeni oturumdaki uyanışı engellemez
 {goto: 'index.html'},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `window.__Y.yeniOyun(0)`, truthy: true, label: 'UO20 (bölüm 2) Yeni oyun başladı'}},
 {js: `(()=>{ const Y = window.__Y; Y.geciktir(15000); Y.gemiUzaga(4000, -4000); DK.G.player.die('Test: uzak gemi, ilk bayılma'); return Y.durum(); })()`},
 {tikla: {metin: 'Gemide uyan', zaman: 15000}},
 {wait: 2000, js: `(()=>{ window.__C2 = { bekleyen: window.__Y.durum(), gecikme: window.__gecikme }; return window.__C2; })()`},
 {expect: {js: `(async()=>{ const Y = window.__Y; DK.handlers.toMenu(); window.__C2.menu = DK.G.state; const ok = await Y.yeniOyun(2); window.__C2.yeni = Y.durum(); return ok && window.__C2.menu === 'menu' && !window.__gecikme.bitti; })()`, truthy: true, label: 'UO23 Önkoşul: eski oturumun gemide uyanışı beklerken (hazırlık 15 sn geciktirildi) menüye dönüldü ve yeni oyun başladı'}},
 {js: `(()=>{ DK.G.player.die('Test: yeni oturumda bayılma'); return window.__Y.durum(); })()`},
 {tikla: {metin: "Kırlangıç Limanı'nda uyan", zaman: 15000}},
 {wait: 2500, expect: {js: `(()=>{ window.__C2.ikinci = window.__Y.durum(); return window.__C2.ikinci.olu === false; })()`, truthy: true, label: 'UO21 Yeni oturumda ölüm ekranından uyanış çalışır; önceki oturumdan kalan bekleyen uyanış onu yutmaz (B2-D1)'}},
 {expect: {js: `(async()=>{ const Y = window.__Y, t0 = performance.now(); while (performance.now() - t0 < 40000 && !window.__gecikme.bitti) await Y.bekle(200); await Y.bekle(1500); const d = window.__C2.son = Y.durum(); return window.__gecikme.bitti && !d.olu && !d.kilit && !d.perde && d.limanaUzaklik < 300; })()`, truthy: true, label: 'UO22 Eski oturumun hazırlığı bittikten sonra oyuncu uyanık ve limanda; girdi kilidi ve perde kalmadı (B2-D1)'}},
 {js: `window.__C2`},
 // ==== 3) B2-D1b: aynı oturumda bekleyen uyanış sürerken kaldırılıp yeniden bayılma
 {goto: 'index.html'},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `window.__Y.yeniOyun(0)`, truthy: true, label: 'UO30 (bölüm 3) Yeni oyun başladı'}},
 {js: `(()=>{ const Y = window.__Y; Y.geciktir(12000); Y.gemiUzaga(4000, -4000); DK.G.player.die('Test: uzak gemi, ilk bayılma'); return Y.durum(); })()`},
 {tikla: {metin: 'Gemide uyan', zaman: 15000}},
 {wait: 2000, js: `(()=>{ const p = DK.G.player; window.__C3 = { bekleyen: window.__Y.durum() }; p.revive(); /* co-op: tayfa arkadaşı kaldırdı (net.js 'revive' → G.player.revive()) */ window.__C3.kaldirildi = !p.dead; p.die('Test: ikinci bayılma'); window.__C3.ikinciOlum = p.dead; return window.__C3; })()`},
 {expect: {js: `window.__C3.bekleyen.olu && window.__C3.bekleyen.kilit && window.__C3.kaldirildi && window.__C3.ikinciOlum && !window.__gecikme.bitti`, truthy: true, label: 'UO33 Önkoşul: gemide uyanış beklerken (hazırlık 12 sn geciktirildi) oyuncu kaldırıldı ve yeniden bayıldı'}},
 {wait: 2700, expect: {js: `(()=>{ window.__C3.ekran = { olum: !!DK.ui.topIs('death'), perde: window.__Y.perde(), kilit: DK.input.isBlocked(), gecikmeBitti: window.__gecikme.bitti }; return window.__C3.ekran.olum && !window.__C3.ekran.perde && !window.__C3.ekran.kilit && !window.__gecikme.bitti; })()`, truthy: true, label: 'UO34 Yeniden bayılınca bekleyen uyanışın perdesi ve girdi kilidi kalkar, yeni ölüm ekranı görünür (eski hazırlık sürerken; önce ölüm ekranı perdenin altında kalıyordu, B2-D1)'}},
 {tikla: {metin: "Kırlangıç Limanı'nda uyan", zaman: 15000}},
 {wait: 2500, expect: {js: `(()=>{ const d = window.__C3.ikinci = window.__Y.durum(); return d.olu === false && d.mod !== 'deck' && d.mod !== 'helm' && d.limanaUzaklik < 300 && !window.__gecikme.bitti; })()`, truthy: true, label: 'UO31 Aynı oturumda bekleyen uyanış sürerken yeni ölüm ekranındaki liman seçimi eski hazırlık bitmeden çalışır: oyuncu limanda uyanık (bekleyen uyanış yeni seçimi yutmaz ve engellemez, B2-D1)'}},
 {expect: {js: `(async()=>{ const Y = window.__Y, t0 = performance.now(); while (performance.now() - t0 < 40000 && !window.__gecikme.bitti) await Y.bekle(200); await Y.bekle(1500); const d = window.__C3.son = Y.durum(); return window.__gecikme.bitti && !d.olu && d.mod !== 'deck' && d.mod !== 'helm' && d.limanaUzaklik < 300 && !d.kilit && !d.perde; })()`, truthy: true, label: 'UO32 Eski (gemi) hazırlığı bitince oyuncu limanda kalır: eski seçim oyuncuyu gemiye taşımaz; kilit ve perde kalmadı (B2-D1)'}},
 {js: `window.__C3`},
 // ==== 4) B2-D1c: gemide uyanış beklenirken gemi batar
 {goto: 'index.html'},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `window.__Y.yeniOyun(0)`, truthy: true, label: 'UO40 (bölüm 4) Yeni oyun başladı'}},
 {js: `(()=>{ const Y = window.__Y; Y.gemiUzaga(4300, 4300); DK.G.player.die('Test: gemi batarken uyanış'); return Y.durum(); })()`},
 {tikla: {metin: 'Gemide uyan', zaman: 15000}},
 {wait: 300, js: `(()=>{ window.__C4 = { bekleyen: window.__Y.durum() }; DK.G.ship.sunk = true; return window.__C4; })()`},
 {expect: {js: `(async()=>{ const Y = window.__Y; await Y.uyanisBitti(60000); const d = window.__C4.son = Y.durum(); return window.__C4.bekleyen.olu && window.__C4.bekleyen.kilit && !d.olu && !d.kilit && !d.perde && d.limanaUzaklik < 300; })()`, truthy: true, label: 'UO41 Gemide uyanış beklenirken gemi batarsa oyuncu en yakın keşfedilmiş limanda uyanır (ölü ve ekransız kalmaz; v0.4: batık gemide uyanış limana düşer) (B2-D1)'}},
 {js: `window.__C4`},
 // ==== 5) B2-D3: uyanış perdesinde gemi adı düz metin
 {goto: 'index.html'},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `window.__Y.yeniOyun(0)`, truthy: true, label: 'UO52 (bölüm 5) Yeni oyun başladı'}},
 {js: `(()=>{ const Y = window.__Y, s = DK.G.ship; window.__ad = '<b id="perdeB">K</b><img id="perdeImg" src="data:," onerror="window.__perdeXss=(window.__perdeXss||0)+1">'; s.name = window.__ad; Y.gemiUzaga(-4200, 4200); DK.G.player.die('Test: perde'); return Y.durum(); })()`},
 {tikla: {metin: 'Gemide uyan', zaman: 15000}},
 {wait: 800, expect: {js: `(()=>{ const f = document.getElementById('sleep-fade'); const D = window.__D = { on: !!(f && f.classList.contains('on')), ogeler: f ? [...f.querySelectorAll('*')].map((e) => e.tagName + (e.id ? '#' + e.id : '') + (e.className ? '.' + e.className : '')) : null, metin: f ? f.textContent : null, xss: window.__perdeXss || 0 };
   DK.G.ship.name = 'Martı'; /* HUD gemi paneli (hud.js, v0.4'ten beri innerHTML; Faz 2 konusu) bu bölümü karıştırmasın */
   return D.on && !!f && !f.querySelector('#perdeB, #perdeImg, b, img') && D.metin.includes(window.__ad) && D.xss === 0; })()`, truthy: true, label: 'UO50 Uyanış perdesi gemi adını düz metin olarak gösterir: addaki HTML öğe olarak kurulmaz, betik çalışmaz (B2-D3)'}},
 {js: `window.__D`},
 {expect: {js: `(async()=>{ const Y = window.__Y; await Y.uyanisBitti(60000); const d = window.__D.son = Y.durum(); return !d.olu && !d.kilit && !d.perde; })()`, truthy: true, label: 'UO51 Gemide uyanış tamamlanır (oyuncu uyanık, kilit ve perde kalmadı)'}},
 {js: `window.__D.son`},
 // ==== 6) B2-D1d: bekleyen uyanış sırasında oyuncu başka yoldan kaldırılır (co-op 'revive'), yeniden bayılmaz
 {goto: 'index.html'},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `window.__Y.yeniOyun(0)`, truthy: true, label: 'UO60 (bölüm 6) Yeni oyun başladı'}},
 {js: `(()=>{ const Y = window.__Y; Y.geciktir(12000); Y.gemiUzaga(4000, -4000); DK.G.player.die('Test: uzak gemi'); return Y.durum(); })()`},
 {tikla: {metin: 'Gemide uyan', zaman: 15000}},
 {wait: 2000, js: `(()=>{ const p = DK.G.player; window.__C6 = { bekleyen: window.__Y.durum() }; p.revive(); /* co-op: tayfa arkadaşı kaldırdı */ window.__C6.kaldirildi = !p.dead; return window.__C6; })()`},
 {wait: 1500, expect: {js: `(()=>{ const d = window.__C6.ilk = window.__Y.durum(); return window.__C6.bekleyen.olu && window.__C6.bekleyen.kilit && !d.olu && !d.kilit && !d.perde && !window.__gecikme.bitti; })()`, truthy: true, label: 'UO61 Bekleyen uyanış sırasında başka yoldan kaldırılan oyuncu eski hazırlık bitmeden perdeden ve girdi kilidinden kurtulur (B2-D1)'}},
 {expect: {js: `(async()=>{ const Y = window.__Y, t0 = performance.now(); while (performance.now() - t0 < 40000 && !window.__gecikme.bitti) await Y.bekle(200); await Y.bekle(1500); const d = window.__C6.son = Y.durum(); return window.__gecikme.bitti && !d.olu && d.mod !== 'deck' && d.mod !== 'helm' && d.limanaUzaklik < 300 && !d.kilit && !d.perde; })()`, truthy: true, label: 'UO62 Eski (gemi) hazırlığı bitince kaldırılan oyuncu yerinde kalır (gemiye taşınmaz), kilit ve perde yok (B2-D1)'}},
 {js: `window.__C6`},
]
