// İşçiler oyun sırasında ölürse (killWorkers) işler kaybolmamalı; ana iş parçacığı yedeği devreye girmeli.
[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 4000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
 {expect: {js: `DK.terrain.workers.length`, gte: 1, label: 'İşçiler çalışıyor'}},
 {js: `(()=>{ const s=DK.G.ship, p=DK.G.player; s.x=600; s.z=-6200; s.anchored=true; s.anchorPt=null; s.updateTransform(0); p.boardShip(s, s.model.stations.helm.clone()); DK.terrain.update(600,-6200,true); const pend=[...DK.terrain.tiles.values()].filter(t=>t.pending).length; window._inflight=DK.terrain.workers.flatMap(r=>[...r.jobs.keys()]); DK.terrain.killWorkers(); return { pendingAtKill: pend, inflightAtKill: window._inflight.length, workers: DK.terrain.workers.length, fallback: DK.terrain.fallback, failures: DK.terrain.failures.length }; })()`},
 {expect: {js: `DK.terrain.fallback`, truthy: true, label: 'Tüm işçiler düşünce yedek kipi açıldı'}},
 {expect: {js: `(async()=>{ const t0=performance.now(); await DK.terrain.prepare(600, -6200, {radius: 300}); window._ms=Math.round(performance.now()-t0); return [...DK.terrain.tiles.values()].filter(t=>t.mesh && Math.hypot(t.x0+80-600, t.z0+80+6200) < 400).length; })()`, gte: 6, label: 'İşçisiz prepare() karo ağlarını üretti'}},
 {js: `({ ms: window._ms, stats: DK.terrain.stats() })`},
 {expect: {js: `(()=>{ const T=DK.terrain; const orphan=[...T._jobs.values()].filter(j => !T._queue.includes(j) && !T._lanes.some(a => a && a.job === j) && !j.rec); window._orphans = orphan.map(j=>[j.id,j.msg.t]); return orphan.length; })()`, eq: 0, label: 'Öksüz iş yok: her bekleyen iş ya kuyrukta ya bir şeritte ya da bir işçide (askıda söz yok)'}},
 {js: `({ orphans: window._orphans, inflightLeftInQueue: window._inflight.filter(id => DK.terrain._jobs.has(id)).length })`},
 {js: `window._j0 = DK.terrain.stats().jobs; 'ok'`},
 {wait: 12000, expect: {js: `(()=>{ const j=DK.terrain.stats().jobs; window._j1=j; return j < window._j0 || j === 0; })()`, truthy: true, label: 'Kuyruk ana iş parçacığında ilerliyor (12 sn)'}},
 {js: `({ jobsBefore: window._j0, jobsAfter12s: window._j1 })`},
 {expect: {js: `(()=>{ let ok=true; for (let i=0;i<120;i++){ DK.sim(1/30); } return DK.G.state==='playing'; })()`, truthy: true, label: 'Oyun döngüsü 4 sn hatasız sürdü'}},
]
