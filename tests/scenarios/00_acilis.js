// Açılış ve ana menü, yeni oyun başlatma, temel sim adımı
[
 {expect: {js: `!!document.getElementById('menu')?.classList.contains('active')`, truthy: true, label: 'Ana menü görünür'}},
 {expect: {js: `document.querySelectorAll('#menu-buttons .mbtn').length`, gte: 8, label: 'Menü düğmeleri'}},
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 5000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
 {expect: {js: `(()=>{ DK.sim(2); const p=DK.G.player; return p && p.hp > 0 && Math.abs(p.pos.y) < 50; })()`, truthy: true, label: 'Oyuncu dünyada'}},
 {expect: {js: `DK.terrain.stats().meshes`, gte: 10, label: 'Arazi karoları yüklendi'}},
 {expect: {js: `DK.terrain.workers.length`, gte: 1, label: 'Arazi işçileri çalışıyor'}},
]
