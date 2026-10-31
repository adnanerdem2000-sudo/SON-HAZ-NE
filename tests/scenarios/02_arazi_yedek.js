// Arazi işçisi yedeği: aynı senaryo ?terrain=noworker / badurl / crash kipleriyle ve normal kipte çalıştırılır.
// Kabul: oyun yükleme ekranını geçer, karolar üretilir, oyuncu zemine basar, derinlik penceresi ve harita ızgarası gelir.
[
 {expect: {js: `!!window.DK && !!window.__ready`, truthy: true, label: 'Sayfa hazır (yükleme ekranı aşıldı)'}},
 {js: `({ mode: DK.terrain.mode, workers: DK.terrain.workers.length, fallback: DK.terrain.fallback, failures: DK.terrain.failures.slice(0,4), stats: DK.terrain.stats() })`},
 {expect: {js: `DK.terrain.stats().meshes`, gte: 20, label: 'Menü sahnesinde karo ağları üretildi'}},
 {expect: {js: `!!DK.terrain.depthWin`, truthy: true, label: 'Okyanus derinlik penceresi hazır'}},
 {js: `DK.G.noAutoPause=true; window._t0=performance.now(); DK.handlers.startGame({kind:'solo', slot:2, data:null}).then(()=>{ window._startMs = Math.round(performance.now()-window._t0); }); 'ok'`},
 {wait: 4000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
 {js: `({ startMs: window._startMs, pendingJobs: DK.terrain.stats().jobs, queue: DK.terrain.stats().queue })`},
 {expect: {js: `(()=>{ DK.sim(3); const p=DK.G.player; const g=DK.terrain.heightAt(p.pos.x,p.pos.z); return Math.abs(p.pos.y - g) < 0.6 && g > -1; })()`, truthy: true, label: 'Oyuncu zemine basıyor'}},
 {expect: {js: `(()=>{ const t=[...DK.terrain.tiles.values()].filter(t=>t.heights && t.mesh); return t.length; })()`, gte: 4, label: 'Yüksek çözünürlüklü karolar (yükseklik ızgarası + ağ)'}},
 {expect: {js: `(async()=>{ const t0=performance.now(); await DK.terrain.prepare(1900, 950, {radius: 300}); const ms=performance.now()-t0; window._prepMs=Math.round(ms); return true; })()`, truthy: true, label: 'Uzak bölge prepare() sonuçlanıyor (askıda kalmıyor)'}},
 {expect: {js: `!!DK.terrain.depthWin && Math.hypot(DK.terrain.depthWin.x0+1200-1900, DK.terrain.depthWin.z0+1200-950) < 100`, truthy: true, label: 'Derinlik penceresi yeni bölgeye taşındı'}},
 {js: `({ prepMs: window._prepMs, prepUnder45s: window._prepMs < 45000, stats: DK.terrain.stats() })`},
 {expect: {js: `(()=>{ const t=[...DK.terrain.tiles.values()].filter(t=>t.mesh && Math.hypot(t.x0+80-1900, t.z0+80-950) < 400); return t.length; })()`, gte: 6, label: 'Tuz Pazarı çevresinde karo ağları var'}},
 {expect: {js: `(async()=>{ const m = await DK.terrain.requestGrid(-10000, -10000, 20000, 256, -500); return m && m.heights && m.heights.length === 65536 && m.biomes.length === 65536; })()`, truthy: true, label: 'Harita ızgarası isteği sonuçlanıyor'}},
 {expect: {js: `(()=>{ const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(1930, DK.terrain.heightAt(1930,980)+0.2, 980); p.vel.set(0,0,0); DK.sim(2); DK.input.down.add('KeyW'); DK.sim(2); DK.input.down.clear(); const g=DK.terrain.heightAt(p.pos.x,p.pos.z); return Math.abs(p.pos.y-g) < 0.6; })()`, truthy: true, label: 'Uzak adada yürüme (zemin sorgusu tutarlı)'}},
 {js: `window._j0 = DK.terrain.stats().jobs; 'ok'`},
 {wait: 8000, expect: {js: `(()=>{ const j=DK.terrain.stats().jobs; return j < window._j0 || j === 0; })()`, truthy: true, label: 'Kuyruk ilerliyor (askıda iş yok)'}},
 {js: `({ jobsBefore: window._j0, jobsAfter8s: DK.terrain.stats().jobs, fallback: DK.terrain.fallback })`},
]
