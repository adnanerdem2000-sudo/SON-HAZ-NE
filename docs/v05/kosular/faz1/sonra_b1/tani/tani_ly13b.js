// Tanı (B1): LY13 dolaşımında yerel şerit parçalarının (gen.next) süreleri; uzun parçanın iş türü ve parça sırası
[
 {meta: {olcum: true, testler: ['tanı LY13 parça'], dosyalar: []}},
 {js: `DK.G.noAutoPause = true; window.__bas = DK.handlers.startGame({ kind: 'solo', slot: 2, data: null }); 'ok'`},
 {wait: 6000, js: `({ durum: DK.G.state, isci: DK.terrain.workers.length })`},
 {js: `(()=>{ const E = DK.engine; window.__fps0 = E.fpsLimit; E.fpsLimit = 1e-6; const T = DK.terrain; if (T.workers.length) T.killWorkers();
   const P = window.__P = { parca: [], dilim: [] }; const o = T._localSlice; window.__o = o;
   const sar = (a) => { if (!a || a.gen.__sarili) return; const g = a.gen; const n0 = g.next.bind(g); let k = 0; const tur = a.job.msg.t + ':' + (a.job.msg.seg || a.job.msg.res);
     g.next = function () { const s = performance.now(); const r = n0(); const d = performance.now() - s; k++; if (d > 1.5 && P.parca.length < 200) P.parca.push([+d.toFixed(1), tur, k, r.done]); return r; }; g.__sarili = true; };
   T._localSlice = function () { for (const a of this._lanes) sar(a); const s = performance.now(); try { return o.apply(this, arguments); } finally { const d = performance.now() - s; if (P.dilim.length < 5000) P.dilim.push(+d.toFixed(1)); } };
   return 'ok'; })()`},
 {js: `(async()=>{ const T = DK.terrain; const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
   const git = (x, z) => { const s = DK.G.ship, p = DK.G.player; s.x = x; s.z = z; s.vx = 0; s.vz = 0; s.speed = 0; s.anchored = true; s.anchorPt = null; s.updateTransform(0); if (p.ship !== s || p.mode !== 'helm') p.boardShip(s, s.model.stations.helm.clone()); T.update(x, z, true); };
   for (let x = 8000; x >= 0; x -= 250) { git(x, -6200); await bekle(150); const t0 = performance.now(); while (T.stats().jobs > 0 && performance.now() - t0 < 5000) await bekle(50); }
   const P = window.__P; const d = P.dilim.slice().sort((a, b) => a - b);
   return { dilim: d.length, enUzunDilim: d.slice(-5), uzunParca: P.parca.slice(0, 40) }; })()`},
 {js: `(()=>{ DK.terrain._localSlice = window.__o; DK.engine.fpsLimit = window.__fps0; return 'ok'; })()`},
]
