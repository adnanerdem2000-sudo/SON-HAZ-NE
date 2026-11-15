// Faz 1 Adım B — GERÇEK arayüzle açılış akışı (62 test listesi 6 "Ana menü", 7 "Yeni oyun", 8 "Kayıt yükleme", 10 "Dünya değişimi";
// brief madde 19; denetim K: hiçbir test "Yeni Macera"ya, karakter oluşturucuya ya da yuva seçimine tıklamıyordu).
// Eylemler arayüzden yapılır (Playwright tıklaması / klavye: tikla, key, down/up); DK.handlers kısayolu YOK. DK yalnız durumu okumak
// ve iki test verisi hazırlığı için kullanılır (altın 777 + 5 muz: yükleme denetimi yeni oyunun varsayılanlarıyla karışmasın diye).
// Karakter adı, oluşturucudaki ad kutusuna yazılır (input olayı = klavyeyle yazmanın arayüz yolu).
// Akış: ana menü → menü düğmeleri (KREDİLER, AYARLAR açılıp kapanır) → YENİ MACERA → karakter oluşturucu (ad, cinsiyet) →
// Maceraya Başla (boş ilk yuva) → oyun → yürü (W) → Esc → Kaydet → Ana menüye dön → Evet → menü kartı → DEVAM ET (aynı yuva:
// konum, altın, envanter, ad) → Esc → Ana menüye dön → Evet → DÜNYALAR → "Yuva 2 — Yeni macera başlat" (yuva seçimi) → oluşturucu →
// Maceraya Başla → yeni dünya (önceki dünyanın ve yuvanın kalıntısı yok), sayfa yeniden yüklenmeden.
// B0 düzeltmesi (inceleme B0-I07): AA15 kördü (birinci dünya limandan hiç ayrılmıyordu; ortada kalıntı olabilecek uzak karo, ada içeriği,
// düşman ya da sandık yoktu). Artık yükleme denetiminden (AA11) sonra birinci dünya uzak bir bölgeye taşınır: oyunun hızlı yolculuk
// olayıyla (G.emit('fastTravel'), ücret 0: AA16'nın 777 altını korunur) Kuzeyfener'e (5,3 km) gidilir; ada içeriği kurulduktan sonra
// oyunun kendi olaylarıyla iki düşman (G.emit('spawnEnemies')) ve bir sandık (treasure.spawnChest) oluşturulur (test verisi hazırlığı;
// menü/yuva geçişi yine arayüzden). AA18 bunların gerçekten oluştuğunu (önkoşul), AA19–AA22 yeni dünyada eski bölgenin karolarının,
// eski adanın içerik grubunun, eski düşman/sandık nesnelerinin bulunmadığını ve derinlik penceresinin yeni başlangıçta olduğunu denetler.
// AA15'e düşman sayısı karşılaştırması eklendi.
[
 {meta: {testler: ['6 Ana menü', '7 Yeni oyun', '8 Kayıt yükleme', '10 Dünya değişimi', 'brief madde 19'],
   dosyalar: ['js/ui/menu.js', 'js/ui/creator.js', 'js/ui/ui.js', 'js/main.js', 'js/game/game.js', 'js/core/save.js', 'js/world/terrain.js']}},
 // ---- durum okuma yardımcıları (yalnız okuma)
 {js: `(()=>{ window.__ayniSayfa = Math.random().toString(36).slice(2); const Y = window.__Y = {};
   Y.bekle = (ms) => new Promise((r) => setTimeout(r, ms));
   Y.oyunda = async (ms) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (DK.G.state === 'playing' && DK.G.player && !document.getElementById('menu').classList.contains('active')) return true; await Y.bekle(100); } return false; };
   Y.envanter = () => JSON.stringify(DK.G.player.inv.toJSON());
   Y.olcum = () => { const T = DK.terrain, R = DK.engine.renderer; const p = DK.G.player; return { karo: T.tiles.size, ag: [...T.tiles.values()].filter((t) => t.mesh).length, grupAg: T.group.children.length, sahneCocuk: DK.engine.scene.children.length, geometri: R.info.memory.geometries, doku: R.info.memory.textures, gemi: DK.G.ships.length, dusman: (DK.enemies.list || []).length, sandik: (DK.treasure.chests || []).length, kese: (DK.treasure.pickups || []).length, oyuncu: p ? [Math.round(p.pos.x), Math.round(p.pos.z)] : null }; };
   Y.zeminde = () => { const p = DK.G.player; return Math.abs(p.pos.y - DK.physics.floorAt(p.pos.x, p.pos.z, p.pos.y + 0.6)) < 0.6; };
   Y.sahnede = (o) => { for (let x = o; x; x = x.parent) if (x === DK.engine.scene) return true; return false; };
   Y.agYakin = (x, z, r) => [...DK.terrain.tiles.values()].filter((t) => t.mesh && Math.hypot(t.x0 + 80 - x, t.z0 + 80 - z) < r).length;
   return Object.keys(Y); })()`},
 // ---- ana menü
 {expect: {js: `(()=>{ const m = document.getElementById('menu'); const d = [...document.querySelectorAll('#menu-buttons .mbtn .mlabel')].map((e) => e.textContent); window.__dugmeler = d; return !!m && m.classList.contains('active') && ['YENİ MACERA', 'DÜNYALAR', 'ONLINE', 'AYARLAR', 'KREDİLER'].every((x) => d.includes(x)); })()`, truthy: true, label: 'AA01 Ana menü görünür; YENİ MACERA, DÜNYALAR, ONLINE, AYARLAR, KREDİLER düğmeleri var'}},
 {js: `window.__dugmeler`},
 {tikla: {metin: 'KREDİLER', tam: true}},
 {expect: {js: `(()=>{ const h = [...document.querySelectorAll('#modal.active .panel h2')].map((e) => e.textContent); return h.includes('Krediler'); })()`, truthy: true, label: 'AA02 KREDİLER düğmesi Krediler panelini açar'}},
 {tikla: '#modal .close-x'},
 {tikla: {metin: 'AYARLAR', tam: true}},
 {expect: {js: `(()=>{ const h = [...document.querySelectorAll('#modal.active .panel h2')].map((e) => e.textContent); return h.includes('Ayarlar') && document.querySelectorAll('#modal .tab').length >= 4; })()`, truthy: true, label: 'AA03 AYARLAR düğmesi Ayarlar panelini (≥ 4 sekme) açar'}},
 {tikla: '#modal .close-x'},
 {expect: {js: `!document.getElementById('modal').classList.contains('active') && document.getElementById('menu').classList.contains('active')`, truthy: true, label: 'AA04 Paneller kapanınca ana menüye dönülür'}},
 // ---- YENİ MACERA → karakter oluşturucu → Maceraya Başla
 {tikla: {metin: 'YENİ MACERA', tam: true}},
 {expect: {js: `(()=>{ const h = [...document.querySelectorAll('#modal.active .panel h2')].map((e) => e.textContent); return h.includes('Korsanını Oluştur') && !!document.querySelector('#modal .creator canvas') && !!document.querySelector('#modal .creator input[type=text]'); })()`, truthy: true, label: 'AA05 YENİ MACERA karakter oluşturucuyu açar (önizleme tuvali ve ad kutusu)'}},
 {js: `(()=>{ const i = document.querySelector('#modal .creator input[type=text]'); i.focus(); i.value = 'Kaptan Bir'; i.dispatchEvent(new Event('input', { bubbles: true })); return i.value; })()`},
 {tikla: {metin: 'Kadın', tam: true}},
 {tikla: {metin: 'Maceraya Başla', tam: true}},
 {expect: {js: `window.__Y.oyunda(60000)`, truthy: true, label: 'AA06 Maceraya Başla ile oyun başlar (G.state playing, oyuncu var, menü kapalı)'}},
 {wait: 2500, expect: {js: `(()=>{ const p = DK.G.player, T = DK.terrain, w = T.depthWin; const ag = [...T.tiles.values()].filter((t) => t.mesh && Math.hypot(t.x0 + 80 - p.pos.x, t.z0 + 80 - p.pos.z) < 400).length; const dUzak = w ? Math.hypot(w.x0 + w.size / 2 - p.pos.x, w.z0 + w.size / 2 - p.pos.z) : 1e9; window.__bas1 = { ad: p.appearance && p.appearance.name, cinsiyet: p.appearance && p.appearance.gender, slot: DK.G.slot, hud: !document.getElementById('hud').classList.contains('hidden'), ag400: ag, derinlikUzak: Math.round(dUzak), zeminde: window.__Y.zeminde(), olcum: window.__Y.olcum() }; const b = window.__bas1; return b.ad === 'Kaptan Bir' && b.cinsiyet === 'f' && b.slot === 0 && b.hud && b.ag400 >= 6 && b.derinlikUzak < 600 && b.zeminde; })()`, truthy: true, label: 'AA07 Yeni oyun: oluşturucudaki ad ve cinsiyet uygulandı, yuva 1, HUD açık, ≥ 6 karo ağı, derinlik penceresi hazır, oyuncu zeminde'}},
 {js: `window.__bas1`},
 // ---- yürü (W), test verisi, Esc → Kaydet
 {down: 'KeyW'}, {wait: 1200}, {up: 'KeyW'},
 {js: `(()=>{ const p = DK.G.player; p.inv.gold = 777; p.inv.add('muz', 5); return { konum: [p.pos.x, p.pos.z], altin: p.inv.gold }; })()`},
 {wait: 600, key: 'Escape'},
 {tikla: {metin: 'Kaydet', tam: true, zaman: 15000}},
 {expect: {js: `(async()=>{ await window.__Y.bekle(300); const p = DK.G.player, d = DK.save.read('solo', 0); window.__kayit1 = d ? { ad: d.name, altin: d.player.inv.gold, konum: [d.player.pos.x, d.player.pos.z], envanter: JSON.stringify(d.player.inv) } : null; window.__oyun1 = { altin: p.inv.gold, konum: [p.pos.x, p.pos.z], envanter: window.__Y.envanter() }; window.__oyuncu1 = p; return !!d && d.name === 'Kaptan Bir' && d.player.inv.gold === 777 && Math.hypot(d.player.pos.x - p.pos.x, d.player.pos.z - p.pos.z) < 0.5; })()`, truthy: true, label: "AA08 Duraklatma menüsündeki Kaydet yuva 1'e yazar (ad, altın, konum)"}},
 {js: `({ kayit: window.__kayit1, oyun: window.__oyun1 })`},
 {tikla: {metin: 'Ana menüye dön', tam: true}},
 {tikla: {metin: 'Evet', tam: true}},
 {expect: {js: `(()=>{ const kart = document.querySelector('#menu-card .save-card .sc-name'); return DK.G.state === 'menu' && document.getElementById('menu').classList.contains('active') && document.getElementById('hud').classList.contains('hidden') && !!kart && kart.textContent === 'Kaptan Bir'; })()`, truthy: true, label: 'AA09 Ana menüye dönüş: menü ve son macera kartı (Kaptan Bir) görünür, HUD kapalı'}},
 // ---- DEVAM ET: aynı yuva yüklenir
 // ui.close() son paneli kapatırken 30 ms sonrası için input.lockPointer() kurar; kilit isteği birkaç kare sonra sonuçlanır: 1,5 sn beklenip
 // denetlenir
 {wait: 1500, expect: {js: `!document.pointerLockElement`, truthy: true, label: "AA09b Ana menüye dönüşten 1,5 sn sonra fare kilidi yok (document.pointerLockElement; kilitliyken menü düğmelerine tıklanamaz)"}},
 // v0.4'te kilit menüde kalıyor (AA09b). Gerçek tarayıcıda oyuncu Esc ile kilidi tarayıcı düzeyinde bırakır; başsız Chromium'da
 // Esc tuşu bunu yapmıyor. Akışın geri kalanı sınanabilsin diye kilit tarayıcı API'siyle bırakılır (oyun işleyicisi değildir; kilit
 // yoksa etkisizdir). Kontrol AA09b hatayı ayrıca kaydeder.
 {js: `(()=>{ const k = !!document.pointerLockElement; if (k) document.exitPointerLock(); return { kilitVardi: k }; })()`},
 {wait: 600, tikla: {metin: 'DEVAM ET', tam: true}},
 {expect: {js: `window.__Y.oyunda(60000)`, truthy: true, label: 'AA10 DEVAM ET ile kayıtlı oyun yüklenir'}},
 {wait: 1000, expect: {js: `(()=>{ const p = DK.G.player, o = window.__oyun1; const r = { durum: DK.G.state, yeniOyuncu: !!p && p !== window.__oyuncu1, slot: DK.G.slot, ad: p.appearance && p.appearance.name, altin: p.inv.gold, konumFark: +Math.hypot(p.pos.x - o.konum[0], p.pos.z - o.konum[1]).toFixed(2), envanterAyni: window.__Y.envanter() === o.envanter }; window.__yukle = r; window.__oyuncu2 = p; return r.durum === 'playing' && r.yeniOyuncu && r.slot === 0 && r.ad === 'Kaptan Bir' && r.altin === 777 && r.konumFark < 1 && r.envanterAyni; })()`, truthy: true, label: 'AA11 Yüklenen oyun (yeni oyuncu nesnesi, durum playing) aynı yuva: konum (≤ 1 m), altın, envanter ve ad kayıttakiyle aynı'}},
 {js: `window.__yukle`},
 // ---- birinci dünyayı uzak bölgeye taşı (test verisi): Kuzeyfener'e hızlı yolculuk (ücret 0), ada içeriği, iki düşman, bir sandık
 {js: `(async()=>{ const Y = window.__Y, P = DK.ports.byId('kuzeyfener_port_0'), H = DK.ports.byId('kirlangic_limani'); const t0 = performance.now();
   DK.G.emit('fastTravel', { to: P.id, from: H.id, cost: 0 });
   const vardi = () => { const s = DK.G.ship, p = DK.G.player; return !!s && Math.hypot(s.x - P.mooring.x, s.z - P.mooring.z) < 10 && !!p && Math.hypot(p.pos.x - P.boarding.x, p.pos.z - P.boarding.z) < 30; };
   while (!vardi() && performance.now() - t0 < 120000) await Y.bekle(250);
   const t1 = performance.now(); while (!(DK.islands.built && DK.islands.built.has(P.island)) && performance.now() - t1 < 30000) await Y.bekle(250);
   while (document.querySelector('#sleep-fade.on') && performance.now() - t1 < 40000) await Y.bekle(250);
   // v0.4'te biniş noktası iskelenin dışında (HYU-05): oyuncu suya düşer; test verisi için limanın kara tarafındaki doğuş noktasına konur
   const p = DK.G.player; p.pos.set(P.spawn.x, DK.terrain.heightAt(P.spawn.x, P.spawn.z) + 0.5, P.spawn.z); p.vel.set(0, 0, 0);
   const t2 = performance.now(); while (!(p.mode === 'ground' && p.onGround) && performance.now() - t2 < 8000) await Y.bekle(100);
   DK.G.emit('spawnEnemies', { list: ['haydut', 'haydut'], x: p.pos.x + 8, z: p.pos.z + 8, r: 2 });
   const c = DK.treasure.spawnChest('small', new DK.THREE.Vector3(p.pos.x + 3, p.pos.y, p.pos.z + 3));
   await Y.bekle(1500);
   const B = DK.islands.built ? DK.islands.built.get(P.island) : null;
   window.__eski = { ada: P.island, adaGrubu: B ? B.group : null, dusman: [...(DK.enemies.list || [])], sandik: [...(DK.treasure.chests || [])], yeniSandik: c, bolge: { x: P.mooring.x, z: P.mooring.z } };
   return { vardi: vardi(), ms: Math.round(performance.now() - t0), ada: P.island, adaKurulu: !!B, kuzeyfenerAg: Y.agYakin(P.mooring.x, P.mooring.z, 450), dusman: window.__eski.dusman.length, sandik: window.__eski.sandik.length, oyuncu: [Math.round(p.pos.x), Math.round(p.pos.z)] }; })()`},
 {expect: {js: `(()=>{ const E = window.__eski; return !!E && !!E.adaGrubu && window.__Y.sahnede(E.adaGrubu) && E.dusman.length >= 1 && E.sandik.length >= 1 && window.__Y.agYakin(E.bolge.x, E.bolge.z, 450) >= 6; })()`, truthy: true, label: "AA18 Önkoşul: birinci dünya uzak bölgede (Kuzeyfener, 5,3 km): orada ≥ 6 karo ağı, adanın içerik grubu sahnede, ≥ 1 düşman ve ≥ 1 sandık var (yoksa AA15/AA19–AA21 kördür)"}},
 // ---- menüye dön → DÜNYALAR → yuva 2 (yeni dünya)
 {wait: 600, key: 'Escape'},
 {tikla: {metin: 'Ana menüye dön', tam: true, zaman: 15000}},
 {tikla: {metin: 'Evet', tam: true}},
 {wait: 1500, js: `(()=>{ const k = !!document.pointerLockElement; if (k) document.exitPointerLock(); return { kilitVardi: k }; })()`},
 {wait: 600, tikla: {metin: 'DÜNYALAR', tam: true}},
 {expect: {js: `(()=>{ const s = [...document.querySelectorAll('#modal .slots .slot')]; window.__yuvalar = s.map((e) => e.textContent.slice(0, 60)); return s.length === 3 && s[0].textContent.includes('Kaptan Bir') && /Yuva 2 — Yeni macera başlat/.test(s[1].textContent); })()`, truthy: true, label: 'AA12 DÜNYALAR yuva listesini gösterir: yuva 1 Kaptan Bir, yuva 2 boş'}},
 {js: `window.__yuvalar`},
 {tikla: {metin: 'Yuva 2 — Yeni macera başlat', tam: true}},
 {js: `(()=>{ const i = document.querySelector('#modal .creator input[type=text]'); i.focus(); i.value = 'Kaptan İki'; i.dispatchEvent(new Event('input', { bubbles: true })); return i.value; })()`},
 {tikla: {metin: 'Erkek', tam: true}},
 {tikla: {metin: 'Maceraya Başla', tam: true}},
 {expect: {js: `window.__Y.oyunda(60000)`, truthy: true, label: 'AA13 Yuva 2 seçilip oluşturucudan yeni dünya başlar'}},
 {wait: 2500, expect: {js: `(()=>{ const p = DK.G.player, inv = p.inv.toJSON(); const b = window.__bas1.olcum; const r = { durum: DK.G.state, yeniOyuncu: !!p && p !== window.__oyuncu1 && p !== window.__oyuncu2, slot: DK.G.slot, ad: p.appearance && p.appearance.name, altin: p.inv.gold, muz: JSON.stringify(inv).match(/muz/g) ? (p.inv.count ? p.inv.count('muz') : null) : 0, konumYeniBaslangic: Math.hypot(p.pos.x - b.oyuncu[0], p.pos.z - b.oyuncu[1]) < 15 }; window.__yeni = r; return r.durum === 'playing' && r.yeniOyuncu && r.slot === 1 && r.ad === 'Kaptan İki' && r.altin === 150 && r.muz === 3 && r.konumYeniBaslangic; })()`, truthy: true, label: 'AA14 Yeni dünyaya önceki yuvanın verisi sızmıyor: yuva 2, ad Kaptan İki, başlangıç altını 150, başlangıç envanteri (3 muz), başlangıç noktası'}},
 {js: `window.__yeni`},
 {expect: {js: `(()=>{ const a = window.__bas1.olcum, b = window.__Y.olcum(); const T = DK.terrain; const r = { ilk: a, simdi: b }; r.ok = { yeniDunyada: DK.G.state === 'playing' && DK.G.slot === 1 && !!DK.G.player && DK.G.player !== window.__oyuncu1 && DK.G.player !== window.__oyuncu2, karoMakul: b.karo <= a.karo * 1.3 + 20, grupAg: b.grupAg === b.ag, sahne: b.sahneCocuk <= a.sahneCocuk + 10, geometri: b.geometri <= a.geometri * 1.25 + 50, doku: b.doku <= a.doku * 1.25 + 20, gemi: b.gemi === 1, dusman: b.dusman <= a.dusman, sandik: b.sandik <= a.sandik, kese: b.kese <= a.kese }; window.__kalinti = r; return Object.values(r.ok).every(Boolean); })()`, truthy: true, label: 'AA15 Dünya değişiminde önceki dünyanın kalıntısı yok: karo/ağ, sahne nesnesi, geometri/doku, gemi, düşman, sandık ve kese sayıları ilk açılışla aynı düzeyde'}},
 {js: `window.__kalinti`},
 {expect: {js: `(()=>{ const E = window.__eski; if (!E) return -1; return window.__Y.agYakin(E.bolge.x, E.bolge.z, 1000); })()`, eq: 0, label: "AA19 Yeni dünyada önceki dünyanın uzak bölgesinde (Kuzeyfener, 1 km içinde) karo ağı kalmadı"}},
 {expect: {js: `(()=>{ const E = window.__eski; if (!E || !E.adaGrubu) return 'önkoşul yok'; const r = { grupSahnede: window.__Y.sahnede(E.adaGrubu), adaKurulu: !!(DK.islands.built && DK.islands.built.has(E.ada)) }; window.__adaKalinti = r; return !r.grupSahnede && !r.adaKurulu ? 'tamam' : JSON.stringify(r); })()`, eq: 'tamam', label: 'AA20 Yeni dünyada önceki dünyanın uzak adasının içerik grubu sahnede değil ve ada kurulu değil'}},
 {expect: {js: `(()=>{ const E = window.__eski; if (!E) return 'önkoşul yok'; const L = DK.enemies.list || [], C = DK.treasure.chests || []; const r = { eskiDusmanListede: E.dusman.filter((e) => L.includes(e)).length, eskiSandikListede: E.sandik.filter((c) => C.includes(c)).length, eskiSandikSahnede: E.sandik.filter((c) => c.mesh && window.__Y.sahnede(c.mesh)).length }; window.__nesneKalinti = r; return r.eskiDusmanListede === 0 && r.eskiSandikListede === 0 && r.eskiSandikSahnede === 0 ? 'tamam' : JSON.stringify(r); })()`, eq: 'tamam', label: 'AA21 Yeni dünyada önceki dünyanın düşman ve sandık nesneleri yok (listelerde değil, sandık ağı sahnede değil)'}},
 {expect: {js: `(()=>{ const w = DK.terrain.depthWin, p = DK.G.player; return w && p ? Math.round(Math.hypot(w.x0 + w.size / 2 - p.pos.x, w.z0 + w.size / 2 - p.pos.z)) : 1e9; })()`, lte: 600, label: 'AA22 Yeni dünyada derinlik penceresi yeni başlangıç noktasında (≤ 600 m), eski bölgede değil'}},
 {expect: {js: `(()=>{ const d = DK.save.read('solo', 0); return !!d && d.name === 'Kaptan Bir' && d.player.inv.gold === 777; })()`, truthy: true, label: 'AA16 Yeni dünya önceki yuvanın kaydını bozmaz (yuva 1: Kaptan Bir, 777 altın)'}},
 {expect: {js: `typeof window.__ayniSayfa === 'string' && window.__ayniSayfa.length > 3`, truthy: true, label: 'AA17 Bütün akış sayfa yeniden yüklenmeden tamamlandı'}},
]
