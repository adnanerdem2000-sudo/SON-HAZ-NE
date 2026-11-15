// B2 tanı (madde 7 çağıran tarafı; HY21'in B2 yarısı): B1'in prepare dönüş değeri bu ağaçta yok (undefined). Tanı için
// terrain.prepare sarılır: asıl hazırlık bittikten sonra 'timeout' döner (yalnız bu sayfada). Beklenen: oyun başlatma, hızlı yolculuk
// ve uzak uyanışta oyuncu 'warn' türünde, "vardın" içermeyen bir bildirim alır; akış yine tamamlanır. Onaylar ölçüm amaçlıdır.
[
 {meta: {testler: ['B2 tanı: prepare timeout bildirimi (madde 7)'], olcum: true}},
 {js: `(()=>{ const T = DK.terrain; const o = T.prepare; T.prepare = async function () { await o.apply(this, arguments); return 'timeout'; };
   const B = window.__B = []; DK.G.on('notify', (n) => B.push({ text: String(n && n.text), kind: n && n.kind, t: performance.now() })); return 'sarıldı'; })()`},
 // 1) oyun başlatma
 {js: `(async()=>{ DK.G.noAutoPause = true; const t0 = performance.now(); const ok = await DK.handlers.startGame({ kind: 'solo', slot: 2, data: null }); DK.G.player.inv.gold = 2000; window.__b1 = window.__B.filter((b) => b.t >= t0); return { durum: DK.G.state, bildirim: window.__b1 }; })()`},
 {expect: {js: `window.__b1.some((b) => b.kind === 'warn' && /hazırlanamadı/.test(b.text)) && DK.G.state === 'playing'`, truthy: true, label: "T1 Oyun başlatmada prepare 'timeout' → uyarı bildirimi, oyun yine başlar"}},
 // 2) hızlı yolculuk
 {js: `(async()=>{ const A = DK.ports.byId('tuz_pazari_port_0'), H = DK.ports.byId('kirlangic_limani'); const t0 = performance.now(); DK.G.emit('fastTravel', { to: A.id, from: H.id, cost: 10 });
   let vardi = false; while (performance.now() - t0 < 90000) { const s = DK.G.ship; if (s && Math.hypot(s.x - A.mooring.x, s.z - A.mooring.z) < 5) { vardi = true; break; } await new Promise((r) => setTimeout(r, 200)); }
   await new Promise((r) => setTimeout(r, 500)); window.__b2 = window.__B.filter((b) => b.t >= t0); return { vardi, altin: DK.G.player.inv.gold, bildirim: window.__b2 }; })()`},
 {expect: {js: `window.__b2.some((b) => b.kind === 'warn' && !/vardın/i.test(b.text) && /hazırlanamadı/.test(b.text)) && window.__b2.some((b) => /limanına vardın/.test(b.text)) && DK.G.player.inv.gold === 1990`, truthy: true, label: "T2 Hızlı yolculukta prepare 'timeout' → uyarı bildirimi (vardın içermez), varış yine olur, ücret bir kez"}},
 // 3) uzak uyanış: açık denizde ölüm → Kırlangıç'ta uyan
 {js: `(async()=>{ const p = DK.G.player, s = DK.G.ship, H = DK.ports.byId('kirlangic_limani'); s.x = 4000; s.z = -4000; s.vx = 0; s.vz = 0; s.speed = 0; s.anchored = true; s.anchorPt = null; s.updateTransform(0); p.boardShip(s, s.model.stations.helm.clone());
   const t0 = performance.now(); while (performance.now() - t0 < 60000) { const ag = [...DK.terrain.tiles.values()].filter((t) => t.mesh && Math.hypot(t.x0 + 80 - H.x, t.z0 + 80 - H.z) < 300).length; if (ag === 0) break; await new Promise((r) => setTimeout(r, 250)); }
   window.__t3 = performance.now(); p.die('Tanı: uzak ölüm'); return 'öldü'; })()`},
 {tikla: {metin: "Kırlangıç Limanı'nda uyan", zaman: 15000}},
 {js: `(async()=>{ const p = DK.G.player; const t0 = performance.now(); while (p.dead && performance.now() - t0 < 60000) await new Promise((r) => setTimeout(r, 200)); await new Promise((r) => setTimeout(r, 500)); window.__b3 = window.__B.filter((b) => b.t >= window.__t3); return { olu: p.dead, konum: [Math.round(p.pos.x), Math.round(p.pos.z)], bildirim: window.__b3 }; })()`},
 {expect: {js: `!DK.G.player.dead && window.__b3.some((b) => b.kind === 'warn' && /hazırlanamadı/.test(b.text))`, truthy: true, label: "T3 Uzak uyanışta prepare 'timeout' → uyarı bildirimi, oyuncu yine uyanır"}},
]
