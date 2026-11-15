// Tanı (B1): LY13'ün koşullarının birebir kopyası (normal kip: oyun başlar, işçili dolaşım 1, killWorkers, yerel dolaşım 2) ve
// dolaşım 2'de her yerel dilimin sırası, killWorkers'tan bu yana geçen süre, bütçe aşımı, en uzun parça (gen.next) ve şerit işleri.
// Dilim mantığı terrain._localSlice'ın aynısıdır (generate aynı modülden); yalnız ölçüm eklenmiştir. Amaç: aşan dilimlerin
// dolaşımın başına mı (JIT ısınması) yoksa rastgele anlara mı (çöp toplama) düştüğünü görmek.
[
 {meta: {olcum: true, testler: ['tanı LY13 sıra'], dosyalar: []}},
 {js: `DK.G.noAutoPause = true; window.__bas = DK.handlers.startGame({ kind: 'solo', slot: 2, data: null }); 'ok'`},
 {wait: 6000, js: `({ durum: DK.G.state, isci: DK.terrain.workers.length })`},
 {js: `(async()=>{ const E = DK.engine; window.__fps0 = E.fpsLimit; E.fpsLimit = 1e-6; const T = DK.terrain; const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
   window.__git = (x, z) => { const s = DK.G.ship, p = DK.G.player; s.x = x; s.z = z; s.vx = 0; s.vz = 0; s.speed = 0; s.anchored = true; s.anchorPt = null; s.updateTransform(0); if (p.ship !== s || p.mode !== 'helm') p.boardShip(s, s.model.stations.helm.clone()); T.update(x, z, true); };
   for (let x = 0; x <= 8000; x += 250) { window.__git(x, -6200); await bekle(150); const t0 = performance.now(); while (T.stats().jobs > 0 && performance.now() - t0 < 4000) await bekle(50); }
   return { dolasim1: 'tamam', stats: T.stats() }; })()`},
 {js: `(async()=>{ const T = DK.terrain; const { generate } = await import(new URL('js/world/terrainGen.js', location.href).href);
   if (T.workers.length) T.killWorkers(); const t0 = performance.now();
   const P = window.__P = { d: [] }; window.__o = T._localSlice; let sira = 0;
   const tur = (a) => (a && a.job ? a.job.msg.t + ':' + (a.job.msg.seg || a.job.msg.res) : '-');
   T._localSlice = function () {
     const s0 = performance.now(); const budget = this.dilimButcesi(); const paralel = this._yerelAktif(); const l0 = this._lanes.map(tur).join('|'); let enGen = 0, enTur = '', n = 0, yeni = 0;
     const kayit = () => { const d = performance.now() - s0; P.d.push([++sira, Math.round(s0 - t0), +(d - budget).toFixed(1), budget, +enGen.toFixed(1), enTur, n, yeni, l0]); };
     for (;;) { let any = false;
       for (let L = 0; L < 2; L++) { let a = this._lanes[L];
         if (!a) { const idx = this._queue.findIndex((j) => (j.msg.t !== 'tile') === (L === 1) && (paralel || j.yerel)); if (idx < 0) continue;
           const job = this._queue.splice(idx, 1)[0]; job.yerel = true; a = this._lanes[L] = { job, gen: generate(job.msg) }; yeni++; }
         any = true;
         if (a.job.iptal || a.job.bitti || !this._jobs.has(a.job.id)) { this._lanes[L] = null; if (!a.job.bitti) this._finish(a.job, null, null); continue; }
         const s3 = performance.now(); let r; try { r = a.gen.next(); } catch (e) { this._finish(a.job, null, e); this._lanes[L] = null; continue; } const d3 = performance.now() - s3; n++; if (d3 > enGen) { enGen = d3; enTur = tur(a); }
         if (r.done) { this._finish(a.job, r.value.out, null); this._lanes[L] = null; }
         if (performance.now() - s0 > budget) { kayit(); this._localBusy = true; window.__planla(); return; }
       }
       if (!any) break; }
     this._localBusy = false; kayit(); if (this._yerelIsVar()) this._localPump(); };
   const mc = new MessageChannel(); mc.port1.onmessage = () => T._localSlice(); window.__planla = () => mc.port2.postMessage(0);
   const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
   for (let x = 8000; x >= 0; x -= 250) { window.__git(x, -6200); await bekle(150); const tt = performance.now(); while (T.stats().jobs > 0 && performance.now() - tt < 5000) await bekle(50); }
   const D = P.d; const f = D.map((x) => x[2]).sort((a, b) => a - b);
   return { dilim: D.length, p99: f[Math.floor((f.length - 1) * 0.99)], enUzun: f[f.length - 1], asan: D.filter((x) => x[2] > 4), ilk12: D.slice(0, 12) }; })()`},
 {js: `(()=>{ DK.terrain._localSlice = window.__o; DK.engine.fpsLimit = window.__fps0; return 'ok'; })()`},
]
