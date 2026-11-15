// Açılış ve ana menü, yeni oyun başlatma, temel sim adımı
[
 {expect: {js: `!!document.getElementById('menu')?.classList.contains('active')`, truthy: true, label: 'Ana menü görünür'}},
 {expect: {js: `document.querySelectorAll('#menu-buttons .mbtn').length`, gte: 8, label: 'Menü düğmeleri'}},
 // Faz 1 Adım B (brief madde 17 + A-10/KI-158): G.state geçişleri kaydedilir (DK.G.state erişimci ile sarılır; değer ve davranış
 // aynı kalır). Her geçişte oyuncunun kurulu olup olmadığı, süren ve (oyun başlatıldıktan sonra) biten bölge hazırlıkları
 // (terrain.prepare çağrıları sayılır; davranış aynı), toplam arazi işi ve bekleyen karoların merkezleri yazılır (B0 düzeltmesi,
 // inceleme B0-I09: yorum daha önce yazılmayan "bekleyen arazi işi"ni anıyordu).
 {js: `(()=>{ const G = DK.G, T = DK.terrain; let v = G.state; const L = window.__durumGecisi = []; const t0 = performance.now();
   const PR = window.__prepKayit = []; const o = T.prepare; T.prepare = async function () { const k = { t0: performance.now(), t1: null }; PR.push(k); try { return await o.apply(this, arguments); } finally { k.t1 = performance.now(); } };
   Object.defineProperty(G, 'state', { configurable: true, enumerable: true, get() { return v; }, set(x) { if (x !== v) { const p = G.player; const b = window.__basladi === undefined ? Infinity : window.__basladi;
     L.push({ t: Math.round(performance.now() - t0), from: v, to: x, oyuncu: !!p, surenPrepare: PR.filter((k) => k.t1 === null).length, bitenPrepare: PR.filter((k) => k.t1 !== null && k.t1 >= b).length, isler: T.stats().jobs, bekleyenKaro: [...T.tiles.values()].filter((t) => t.pending).slice(0, 300).map((t) => [t.x0 + 80, t.z0 + 80]) }); } v = x; } });
   return { durum: v }; })()`},
 {js: `DK.G.noAutoPause=true; window.__basladi = performance.now(); DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 5000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
 {js: `(window.__durumGecisi || []).map((g) => ({ ...g, bekleyenKaro: g.bekleyenKaro.length }))`},
 {expect: {js: `(()=>{ const L = window.__durumGecisi || []; const oyuna = L.filter((g) => g.to === 'playing'); return oyuna.length >= 1 && oyuna.every((g) => g.oyuncu === true) && !!DK.G.player; })()`, truthy: true, label: "AC01 G.state 'playing'e yalnız oyuncu kurulduktan (bölge hazırlığı bittikten) sonra geçer (A-10; eski 'Oyun başladı' kontrolü prepare'den önce atanan değeri görüyordu)"}},
 {expect: {js: `(()=>{ const L = window.__durumGecisi || []; const i = L.findIndex((g) => g.to === 'playing'); return i > 0 && L.slice(0, i).some((g) => g.to === 'loading'); })()`, truthy: true, label: "AC02 Bölge hazırlığı (prepare) süresince G.state 'loading' (A-10)"}},
 {expect: {js: `(()=>{ const L = window.__durumGecisi || []; const g = L.find((x) => x.to === 'playing'); const p = DK.G.player; if (!g || !p) return 'geçiş ya da oyuncu yok'; const yakin = g.bekleyenKaro.filter((c) => Math.hypot(c[0] - p.pos.x, c[1] - p.pos.z) < 500).length; window.__ac03 = { surenPrepare: g.surenPrepare, bitenPrepare: g.bitenPrepare, yakinBekleyenKaro: yakin, isler: g.isler }; return g.surenPrepare === 0 && g.bitenPrepare >= 1 && yakin === 0 ? 'tamam' : JSON.stringify(window.__ac03); })()`, eq: 'tamam', label: "AC03 G.state 'playing'e geçiş anında başlangıç bölgesi hazırlığı bitmiş: süren prepare yok, oyun başlatıldıktan sonra ≥ 1 prepare tamamlanmış, başlangıç noktasının 500 m içinde bekleyen karo yok (A-10)"}},
 {expect: {js: `(()=>{ DK.sim(2); const p=DK.G.player; return p && p.hp > 0 && Math.abs(p.pos.y) < 50; })()`, truthy: true, label: 'Oyuncu dünyada'}},
 {expect: {js: `DK.terrain.stats().meshes`, gte: 10, label: 'Arazi karoları yüklendi'}},
 {expect: {js: `DK.terrain.workers.length`, gte: 1, label: 'Arazi işçileri çalışıyor'}},
]
