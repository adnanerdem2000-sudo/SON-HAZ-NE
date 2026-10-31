// Tek dosya (dist/DenizKorsanlari-SonHazine.html) file:// ile: işçiler data: URL üzerinden çalışmalı, oyun açılmalı.
// Çalıştır: node tests/harness/run.cjs tests/scenarios/02_tek_dosya.js --url file:///…/dist/DenizKorsanlari-SonHazine.html
[
 {expect: {js: `!!window.DK && !!window.__ready`, truthy: true, label: 'Tek dosya: sayfa hazır'}},
 {js: `({ proto: location.protocol, workers: DK.terrain.workers.length, fallback: DK.terrain.fallback, failures: DK.terrain.failures.slice(0,3), url: String(window.__DK_WORKER_URL).slice(0,40), stats: DK.terrain.stats() })`},
 {expect: {js: `DK.terrain.workers.length`, gte: 1, label: 'Tek dosya (file://): arazi işçileri çalışıyor'}},
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 4000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Tek dosya: oyun başladı'}},
 {expect: {js: `(()=>{ DK.sim(2); const p=DK.G.player; return Math.abs(p.pos.y - DK.terrain.heightAt(p.pos.x,p.pos.z)) < 0.6; })()`, truthy: true, label: 'Tek dosya: oyuncu zemine basıyor'}},
 {js: `DK.terrain.stats()`},
]
