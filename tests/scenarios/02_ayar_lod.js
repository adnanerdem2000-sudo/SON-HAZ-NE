// Faz 1 Adım B — arazi LOD ölçeği ve gölge haritasının ayar/açılış sırası (KI-038/A-19 (doğrulama A-M02), KI-130/J-09, J-10;
// brief madde 16). Kabul (dogrulama_A.json): kalite düşük + görüş %30 kayıtlıyken açılışta DK.terrain.lodScale ≈ 0,553 ve karo
// sayısı görüş %100'e göre belirgin az; oyun içinde ses değişimi lodScale'i değiştirmez; görüş %100 → 0,7; yüksek + %100 → 1;
// gölgeler 'orta' iken açılışta güneş gölge haritası 1024; değerler sayfa yenilendikten sonra da doğru.
//
// Kayıtlı ayar: başlatma betiği (meta.baslatma) sayfa betiklerinden ÖNCE, adreste ?ayar=<profil> varsa localStorage'daki
// 'dksh.settings' kaydına profili yazar (biçim v0.4 js/core/settings.js: KEY 'dksh.settings', JSON; load() kısmi kaydı
// DEFAULT_SETTINGS ile birleştirir, save() tam settings.v nesnesini yazar). Profilsiz adreste betik hiçbir şeye dokunmaz.
// Ayar değişiklikleri GERÇEK arayüzden yapılır: ana menü "AYARLAR" → sekmeler → kaydırıcıya tıklama + Home/End tuşları
// (settingsPanel.js commit(): settings.apply + save).
[
 {meta: {testler: ['KI-038', 'KI-130', 'A-19 (doğrulama A-M02)', 'J-09', 'J-10'],
   dosyalar: ['js/core/settings.js', 'js/world/terrain.js', 'js/world/sky.js', 'js/main.js', 'js/game/game.js', 'js/ui/settingsPanel.js'],
   baslatma: `(() => { const m = /[?&]ayar=([a-z0-9_]+)/i.exec(location.search); if (!m) return;
     const P = { dusuk30: { quality: 'low', viewDistance: 0.3, shadows: 'medium' }, dusuk100: { quality: 'low', viewDistance: 1, shadows: 'medium' }, yuksek100: { quality: 'high', viewDistance: 1, shadows: 'medium' } }[m[1]];
     if (!P) return;
     try { const eski = JSON.parse(localStorage.getItem('dksh.settings') || 'null') || {}; localStorage.setItem('dksh.settings', JSON.stringify(Object.assign({}, eski, P))); window.__ayarProfili = m[1]; } catch (e) { window.__ayarProfili = 'yazılamadı: ' + e.name; } })();`}},
 // ---- varsayılan ayarlar (kayıt yok): yüksek kalite, görüş %100
 {expect: {js: `+DK.terrain.lodScale.toFixed(4)`, eq: 1, label: 'AL00 Varsayılan ayarlarla (yüksek, görüş %100) açılışta lodScale = 1'}},
 // ---- kalite düşük + görüş %30 kayıtlı
 {goto: 'index.html?ayar=dusuk30'},
 {wait: 3000, js: `({ profil: window.__ayarProfili, ayar: { q: DK.settings.v.quality, vd: DK.settings.v.viewDistance, sh: DK.settings.v.shadows }, lodScale: DK.terrain.lodScale, baseLod: DK.terrain.baseLod, stats: DK.terrain.stats() })`},
 {expect: {js: `+DK.terrain.lodScale.toFixed(4)`, gte: 0.548, lte: 0.558, label: 'AL01 Kalite düşük + görüş %30 kayıtlıyken açılışta lodScale ≈ 0,553 (0,7 × (0,7 + 0,3 × 0,3))'}},
 {degisken: {ad: 'karo30', js: `DK.terrain.stats().tiles`}},
 // ---- oyun içi ayar paneli: ses değişimi lodScale'i değiştirmez
 {degisken: {ad: 'lodOnce', js: `DK.terrain.lodScale`}},
 {tikla: {metin: 'AYARLAR', tam: true}},
 {tikla: {metin: 'Ses', tam: true}},
 {tikla: '#modal label.set:has-text("Ana ses") input[type=range]'},
 {key: 'Home'},
 {js: `({ master: DK.settings.v.master, lodScale: DK.terrain.lodScale })`},
 {expect: {js: `DK.settings.v.master === 0 && Math.abs(DK.terrain.lodScale - window.__KOSUCU.lodOnce) < 1e-9`, truthy: true, label: "AL02 Ayarlar panelinde ses değişimi (Ana ses → %0) lodScale'i değiştirmez"}},
 // ---- görüş %100 → 0,7 (kalite düşük)
 {tikla: {metin: 'Görüntü', tam: true}},
 {tikla: '#modal label.set:has-text("Görüş mesafesi") input[type=range]'},
 {key: 'End'},
 {js: `({ viewDistance: DK.settings.v.viewDistance, lodScale: DK.terrain.lodScale })`},
 {expect: {js: `DK.settings.v.viewDistance === 1 ? +DK.terrain.lodScale.toFixed(4) : -1`, gte: 0.695, lte: 0.705, label: 'AL03 Kalite düşükken görüş %100 seçilince lodScale ≈ 0,7'}},
 // görüş yeniden %30, panel kapanır; sayfa profilsiz yenilenir (kayıtlı ayarlarla açılış)
 {key: 'Home'},
 {js: `({ viewDistance: DK.settings.v.viewDistance, kayit: JSON.parse(localStorage.getItem('dksh.settings') || 'null') && JSON.parse(localStorage.getItem('dksh.settings')).viewDistance })`},
 {tikla: '#modal .close-x'},
 {goto: 'index.html'},
 {wait: 2000, js: `({ ayar: { q: DK.settings.v.quality, vd: DK.settings.v.viewDistance }, lodScale: DK.terrain.lodScale })`},
 {expect: {js: `DK.settings.v.viewDistance === 0.3 && DK.settings.v.quality === 'low' ? +DK.terrain.lodScale.toFixed(4) : -1`, gte: 0.548, lte: 0.558, label: 'AL04 Panelden kaydedilen (düşük, %30) ayarlarla sayfa yenilenince lodScale ≈ 0,553'}},
 // ---- kalite düşük + görüş %100: karo sayısı karşılaştırması
 {goto: 'index.html?ayar=dusuk100'},
 {wait: 3000, js: `({ ayar: { q: DK.settings.v.quality, vd: DK.settings.v.viewDistance }, lodScale: DK.terrain.lodScale, stats: DK.terrain.stats() })`},
 {expect: {js: `+DK.terrain.lodScale.toFixed(4)`, gte: 0.695, lte: 0.705, label: 'AL05 Kalite düşük + görüş %100 kayıtlıyken açılışta lodScale ≈ 0,7'}},
 {degisken: {ad: 'karo100', js: `DK.terrain.stats().tiles`}},
 {expect: {js: `(()=>{ const a = window.__KOSUCU.karo30, b = window.__KOSUCU.karo100; window.__karo = { yuzde30: a, yuzde100: b, oran: b ? +(a / b).toFixed(3) : null }; return b > 0 && a <= 0.85 * b; })()`, truthy: true, label: "AL06 Görüş %30 ile açılışta karo sayısı görüş %100'e göre belirgin az (≤ %85)"}},
 {js: `window.__karo`},
 // ---- yüksek kalite + görüş %100 + gölgeler 'orta'
 {goto: 'index.html?ayar=yuksek100'},
 {wait: 1500, js: `({ ayar: { q: DK.settings.v.quality, vd: DK.settings.v.viewDistance, sh: DK.settings.v.shadows }, lodScale: DK.terrain.lodScale, golge: DK.sky.sun && DK.sky.sun.shadow.mapSize.x, golgeAcik: DK.engine.renderer.shadowMap.enabled })`},
 {expect: {js: `+DK.terrain.lodScale.toFixed(4)`, eq: 1, label: 'AL07 Yüksek kalite + görüş %100 kayıtlıyken açılışta lodScale = 1'}},
 {expect: {js: `DK.sky.sun ? DK.sky.sun.shadow.mapSize.x : null`, eq: 1024, label: "AL08 Gölgeler 'orta' kayıtlıyken açılışta güneş gölge haritası 1024 (yüksek kalitede bile)"}},
 // ---- sayfa yenilendikten sonra (profilsiz: kayıtlı yüksek/%100/orta)
 {goto: 'index.html'},
 {wait: 1500, expect: {js: `DK.settings.v.shadows === 'medium' && DK.sky.sun ? DK.sky.sun.shadow.mapSize.x : null`, eq: 1024, label: "AL09 Sayfa yenilendikten sonra da gölgeler 'orta' → güneş gölge haritası 1024"}},
 {expect: {js: `+DK.terrain.lodScale.toFixed(4)`, eq: 1, label: 'AL10 Sayfa yenilendikten sonra yüksek kalite + %100 → lodScale = 1'}},
]
