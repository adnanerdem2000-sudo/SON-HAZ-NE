// Tanı (B1): LY13 dolaşımının yalın kopyası; aşan dilimlerin bileşimi (şerit işleri, kuyruk, dilim öncesi/sonrası) ve dağılım
[
 {meta: {olcum: true, testler: ['tanı LY13'], dosyalar: []}},
 {js: `DK.G.noAutoPause = true; window.__bas = DK.handlers.startGame({ kind: 'solo', slot: 2, data: null }); 'ok'`},
 {wait: 6000, js: `({ durum: DK.G.state, oyuncu: !!DK.G.player, isci: DK.terrain.workers.length })`},
 {js: `(()=>{ const E = DK.engine; window.__fps0 = E.fpsLimit; E.fpsLimit = 1e-6; const T = DK.terrain; if (T.workers.length) T.killWorkers();
   const S = window.__S = { d: [] }; const o = T._localSlice; window.__o = o;
   const tur = (a) => a && a.job ? a.job.msg.t + ':' + (a.job.msg.seg || a.job.msg.res) : '-';
   T._localSlice = function () { const q = this._queue.length; const but = typeof this.dilimButcesi === 'function' ? this.dilimButcesi() : (q > 30 ? Math.max(this.localBudget, 20) : this.localBudget); const l0 = this._lanes.map(tur); const s = performance.now(); try { return o.apply(this, arguments); } finally { const d = performance.now() - s; if (S.d.length < 5000) S.d.push([+(d - but).toFixed(1), but, q, l0.join('|'), this._lanes.map(tur).join('|')]); } };
   return 'ok'; })()`},
 {js: `(async()=>{ const T = DK.terrain; const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
   const git = (x, z) => { const s = DK.G.ship, p = DK.G.player; s.x = x; s.z = z; s.vx = 0; s.vz = 0; s.speed = 0; s.anchored = true; s.anchorPt = null; s.updateTransform(0); if (p.ship !== s || p.mode !== 'helm') p.boardShip(s, s.model.stations.helm.clone()); T.update(x, z, true); };
   for (let x = 8000; x >= 0; x -= 250) { git(x, -6200); await bekle(150); const t0 = performance.now(); while (T.stats().jobs > 0 && performance.now() - t0 < 5000) await bekle(50); }
   const D = window.__S.d; const f = D.map((x) => x[0]).sort((a, b) => a - b);
   return { n: D.length, p99: f[Math.floor((f.length - 1) * 0.99)], enUzun: f[f.length - 1], asan: D.filter((x) => x[0] > 4).slice(0, 12) }; })()`},
 {js: `(()=>{ DK.terrain._localSlice = window.__o; DK.engine.fpsLimit = window.__fps0; return 'ok'; })()`},
]
