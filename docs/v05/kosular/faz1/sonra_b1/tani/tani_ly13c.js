// Tanı (B1): _localSlice'ın adım adım süre ölçümlü kopyası (aynı mantık; generate aynı modülden) — dilim aşımının bileşimi
[
 {meta: {olcum: true, testler: ['tanı LY13 adım'], dosyalar: []}},
 {js: `DK.G.noAutoPause = true; window.__bas = DK.handlers.startGame({ kind: 'solo', slot: 2, data: null }); 'ok'`},
 {wait: 6000, js: `({ durum: DK.G.state, isci: DK.terrain.workers.length })`},
 {js: `(async()=>{ const E = DK.engine; window.__fps0 = E.fpsLimit; E.fpsLimit = 1e-6; const T = DK.terrain; if (T.workers.length) T.killWorkers();
   const { generate } = await import(new URL('js/world/terrainGen.js', location.href).href);
   const P = window.__P = { dilim: [], adim: [] }; window.__o = T._localSlice;
   T._localSlice = function () {
     const t0 = performance.now(); const budget = this.dilimButcesi(); const paralel = this._yerelAktif(); const A = { gen: 0, yeni: 0, bitir: 0, sec: 0, enGen: 0, enYeni: 0, enBitir: 0, n: 0 };
     try {
     for (;;) { let any = false;
       for (let L = 0; L < 2; L++) { let a = this._lanes[L];
         if (!a) { const s1 = performance.now(); const idx = this._queue.findIndex((j) => (j.msg.t !== 'tile') === (L === 1) && (paralel || j.yerel)); A.sec += performance.now() - s1; if (idx < 0) continue;
           const job = this._queue.splice(idx, 1)[0]; job.yerel = true; const s2 = performance.now(); a = this._lanes[L] = { job, gen: generate(job.msg) }; const d2 = performance.now() - s2; A.yeni += d2; A.enYeni = Math.max(A.enYeni, d2); }
         any = true;
         if (a.job.iptal || a.job.bitti || !this._jobs.has(a.job.id)) { this._lanes[L] = null; if (!a.job.bitti) this._finish(a.job, null, null); continue; }
         const s3 = performance.now(); const r = a.gen.next(); const d3 = performance.now() - s3; A.gen += d3; A.enGen = Math.max(A.enGen, d3); A.n++;
         if (r.done) { const s4 = performance.now(); this._finish(a.job, r.value.out, null); const d4 = performance.now() - s4; A.bitir += d4; A.enBitir = Math.max(A.enBitir, d4); this._lanes[L] = null; }
         if (performance.now() - t0 > budget) { const d = performance.now() - t0; P.dilim.push([+(d - budget).toFixed(1), budget, +A.gen.toFixed(1), +A.enGen.toFixed(1), +A.enYeni.toFixed(1), +A.enBitir.toFixed(1), A.n]); this._localBusy = true; window.__planla(); return; }
       }
       if (!any) break; }
     this._localBusy = false; const d = performance.now() - t0; P.dilim.push([+(d - budget).toFixed(1), budget, +A.gen.toFixed(1), +A.enGen.toFixed(1), +A.enYeni.toFixed(1), +A.enBitir.toFixed(1), A.n]);
     if (this._yerelIsVar()) this._localPump();
     } catch (e) { P.hata = String(e); throw e; } };
   const mc = new MessageChannel(); mc.port1.onmessage = () => T._localSlice(); window.__planla = () => mc.port2.postMessage(0);
   return 'ok'; })()`},
 {js: `(async()=>{ const T = DK.terrain; const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
   const git = (x, z) => { const s = DK.G.ship, p = DK.G.player; s.x = x; s.z = z; s.vx = 0; s.vz = 0; s.speed = 0; s.anchored = true; s.anchorPt = null; s.updateTransform(0); if (p.ship !== s || p.mode !== 'helm') p.boardShip(s, s.model.stations.helm.clone()); T.update(x, z, true); };
   for (let x = 8000; x >= 0; x -= 250) { git(x, -6200); await bekle(150); const t0 = performance.now(); while (T.stats().jobs > 0 && performance.now() - t0 < 5000) await bekle(50); }
   const P = window.__P; const d = P.dilim.slice().sort((a, b) => b[0] - a[0]);
   return { dilim: P.dilim.length, hata: P.hata || null, enUzun: d.slice(0, 8) }; })()`},
 {js: `(()=>{ DK.terrain._localSlice = window.__o; DK.engine.fpsLimit = window.__fps0; return 'ok'; })()`},
]
