// B2 tanı (ölçüm, onay yok; KI-236 / HYU-02 işçisiz kip): hızlı yolculuk varışından sonraki kareler: oyuncu y/kip/zeminde, varış adası
// kurulu mu, biniş noktasında physics.floorAt, islands.checkT/job, game.update dt'si, perde.
[
 {meta: {olcum: true, testler: ['B2 tanı: varış kareleri (HYU-02)']}},
 {js: `(async()=>{ DK.G.noAutoPause = true; await DK.handlers.startGame({ kind: 'solo', slot: 2, data: null }); return DK.G.state; })()`},
 {wait: 1500},
 {js: `(async()=>{ const P = DK.ports.byId('kuzeyfener_port_0'), H = DK.ports.byId('kirlangic_limani'), I = DK.islands; const L = window.__v = [];
   let varis = null; DK.G.on('arrivedPort', () => { varis = performance.now(); L.push({ t: 0, olay: 'arrivedPort', built: I.built.has(P.island), job: I.job ? I.job.I.id : null, checkT: +I.checkT.toFixed(2) }); });
   const ub = I._build.bind(I); I._build = function (Ix) { const t0 = performance.now(); try { return ub(Ix); } finally { if (varis) L.push({ t: Math.round(performance.now() - varis), olay: '_build ' + Ix.id, ms: Math.round(performance.now() - t0) }); } };
   const gu = DK.game.update.bind(DK.game); let sonDt = 0; DK.game.update = function (dt) { sonDt = dt; return gu(dt); };
   const f = () => { if (varis && performance.now() - varis < 8000) { const p = DK.G.player; L.push({ t: Math.round(performance.now() - varis), dt: +sonDt.toFixed(3), y: +p.pos.y.toFixed(2), mod: p.mode, zeminde: !!p.onGround, built: I.built.has(P.island), job: I.job ? I.job.I.id : null, checkT: +I.checkT.toFixed(2), zemin: +DK.physics.floorAt(P.boarding.x, P.boarding.z, 10).toFixed(2), perde: !!document.querySelector('#sleep-fade.on') }); } requestAnimationFrame(f); }; requestAnimationFrame(f);
   const t0 = performance.now(); DK.G.emit('fastTravel', { to: P.id, from: H.id, cost: 0 });
   while ((!varis || performance.now() - varis < 8000) && performance.now() - t0 < 120000) await new Promise((r) => setTimeout(r, 200));
   return { ada: P.island, adaR: DK.archipelago.EXTRA_ISLANDS.find((x) => x.id === P.island).r, binisUzaklik: Math.round(Math.hypot(P.boarding.x - DK.archipelago.EXTRA_ISLANDS.find((x) => x.id === P.island).x, P.boarding.z - DK.archipelago.EXTRA_ISLANDS.find((x) => x.id === P.island).z)), n: L.length }; })()`},
 {js: `window.__v.slice(0, 120)`},
]
