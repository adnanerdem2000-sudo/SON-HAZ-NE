// B2 tanı (ölçüm, onay yok; madde 21 / KI-237): hızlı yolculuk hazırlığı sırasında kare kare zaman çizelgesi: rAF aralıkları, yerel
// dilimler, karo uygulama (_apply), derinlik uygulama (onDepth), güncelleyici ve çizim süreleri (engine.updaters ve post.render sarılır).
[
 {meta: {olcum: true, testler: ['B2 tanı: hızlı yolculuk kare zaman çizelgesi (madde 21)']}},
 {js: `(()=>{ const T = DK.terrain, E = DK.engine, P = DK.post; const Z = window.__z = { aktif: false, t0: 0, ol: [] };
   const kay = (tur, ms, ek) => { if (Z.aktif) Z.ol.push([Math.round(performance.now() - Z.t0), tur, Math.round(ms * 10) / 10, ek]); };
   const ls = T._localSlice; T._localSlice = function () { const t0 = performance.now(); try { return ls.apply(this, arguments); } finally { kay('dilim', performance.now() - t0, T._queue.length); } };
   const ap = T._apply; T._apply = function (t, m) { const t0 = performance.now(); try { return ap.apply(this, arguments); } finally { kay('apply', performance.now() - t0, m && m.seg); } };
   const od = T.onDepth; T.onDepth = function (m) { const t0 = performance.now(); try { return od && od.apply(this, arguments); } finally { kay('derinlik', performance.now() - t0); } };
   const pr = P.render; P.render = function () { const t0 = performance.now(); try { return pr.apply(this, arguments); } finally { kay('cizim', performance.now() - t0, DK.engine.renderer.info.render.calls); } };
   const us = [...E.updaters]; E.updaters.clear(); for (const u of us) E.updaters.add(function (dt) { const t0 = performance.now(); try { return u(dt); } finally { kay('guncelle', performance.now() - t0); } });
   const pp = T.prepare; T.prepare = async function () { Z.aktif = true; Z.t0 = performance.now(); kay('prepare-bas', 0); try { return await pp.apply(this, arguments); } finally { kay('prepare-son', 0); Z.aktif = false; Z.ms = Math.round(performance.now() - Z.t0); } };
   return 'kuruldu'; })()`},
 {js: `(async()=>{ DK.G.noAutoPause = true; await DK.handlers.startGame({ kind: 'solo', slot: 2, data: null }); return DK.G.state; })()`},
 {wait: 3000},
 {js: `(async()=>{ const P = DK.ports.byId('kuzeyfener_port_0'), H = DK.ports.byId('kirlangic_limani'); const t0 = performance.now();
   DK.G.emit('fastTravel', { to: P.id, from: H.id, cost: 0 });
   while (!(window.__z.ms) && performance.now() - t0 < 120000) await new Promise((r) => setTimeout(r, 100));
   const Z = window.__z; const say = (tur) => Z.ol.filter((x) => x[1] === tur); const top = (tur) => Math.round(say(tur).reduce((a, x) => a + x[2], 0));
   return { prepareMs: Z.ms, ozet: { dilim: [say('dilim').length, top('dilim')], apply: [say('apply').length, top('apply')], derinlik: [say('derinlik').length, top('derinlik')], cizim: [say('cizim').length, top('cizim'), Math.max(0, ...say('cizim').map((x) => x[2]))], guncelle: [say('guncelle').length, top('guncelle'), Math.max(0, ...say('guncelle').map((x) => x[2]))] }, uzun: Z.ol.filter((x) => x[2] > 100) }; })()`},
 {js: `window.__z.ol.slice(0, 400)`},
]
