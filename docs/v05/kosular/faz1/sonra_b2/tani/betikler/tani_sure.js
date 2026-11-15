// B2 tanı (ölçüm, onay yok): yeni oyun başlangıcındaki ve Kuzeyfener hızlı yolculuğundaki terrain.prepare süresi; prepare süresince
// yerel dilim sayısı/süresi, kare sayısı ve en uzun kare aralığı, bütçe. Oyun koduna dokunmaz (yalnız sarmalayıcı ölçüm).
[
 {meta: {olcum: true, testler: ['B2 tanı: hazırlık süreleri (madde 6, 21)']}},
 {js: `(()=>{ const T = DK.terrain; const L = window.__prep = [];
   const acik = () => L.filter((k) => k.ms === undefined);
   const o = T.prepare; T.prepare = async function (x, z, op) { const st = T.stats(); const k = { x: Math.round(x), z: Math.round(z), r: op && op.radius, t0: performance.now(), butce: T.localBudget, isOnce: st.jobs, kuyrukOnce: st.queue, dilim: 0, dilimMs: 0, enUzunDilim: 0, kare: 0, enUzunKare: 0 }; L.push(k); try { return await o.apply(this, arguments); } finally { k.ms = Math.round(performance.now() - k.t0); k.dilimMs = Math.round(k.dilimMs); k.enUzunDilim = Math.round(k.enUzunDilim); k.enUzunKare = Math.round(k.enUzunKare); k.butceSon = T.localBudget; } };
   const ls = T._localSlice; T._localSlice = function () { const t0 = performance.now(); try { return ls.apply(this, arguments); } finally { const d = performance.now() - t0; for (const k of acik()) { k.dilim++; k.dilimMs += d; k.enUzunDilim = Math.max(k.enUzunDilim, d); } } };
   let son = performance.now(); const f = (t) => { const d = t - son; son = t; for (const k of acik()) { k.kare++; k.enUzunKare = Math.max(k.enUzunKare, d); } requestAnimationFrame(f); }; requestAnimationFrame(f);
   return { kip: T.mode, isci: T.workers.length, yedek: T.fallback, butce: T.localBudget, st: T.stats() }; })()`},
 {js: `(async()=>{ const t0 = performance.now(); DK.G.noAutoPause = true; const s = DK.handlers.startGame({ kind: 'solo', slot: 2, data: null }); let durumOyun = null; const izle = setInterval(() => { if (durumOyun === null && DK.G.state === 'playing' && DK.G.player) durumOyun = Math.round(performance.now() - t0); }, 20); await s; clearInterval(izle); return { basla: Math.round(performance.now() - t0), oyunaGecis: durumOyun, prepare: window.__prep.slice() }; })()`},
 {wait: 3000},
 {js: `(async()=>{ const P = DK.ports.byId('kuzeyfener_port_0'), H = DK.ports.byId('kirlangic_limani'); const n0 = window.__prep.length; const t0 = performance.now();
   DK.G.emit('fastTravel', { to: P.id, from: H.id, cost: 0 });
   const vardi = () => { const s = DK.G.ship; return !!s && Math.hypot(s.x - P.mooring.x, s.z - P.mooring.z) < 10; };
   while (!vardi() && performance.now() - t0 < 120000) await new Promise((r) => setTimeout(r, 100));
   return { vardiMs: Math.round(performance.now() - t0), prepare: window.__prep.slice(n0) }; })()`},
]
