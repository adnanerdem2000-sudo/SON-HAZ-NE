// B2 tanı (A-03 / madde 21 kabulü "perde açıkken oyun girdisi kilitli"): hızlı yolculuk perdesi sürerken W basılı tutulup benzetim
// ilerletilir (DK.press → DK.sim → game.update); oyuncu yürümemeli, etkileşim/envanter açılmamalı. Varıştan sonra W ile yürüyebilmeli.
[
 {meta: {testler: ['B2 tanı: perde altında girdi kilidi'], olcum: true}},
 {js: `(async()=>{ DK.G.noAutoPause = true; await DK.handlers.startGame({ kind: 'solo', slot: 2, data: null }); const p = DK.G.player; p.inv.gold = 2000; return DK.G.state; })()`},
 {wait: 1500},
 {js: `(async()=>{ const p = DK.G.player, A = DK.ports.byId('tuz_pazari_port_0'), H = DK.ports.byId('kirlangic_limani');
   DK.sim(1); const once = { x: p.pos.x, z: p.pos.z };
   DK.G.emit('fastTravel', { to: A.id, from: H.id, cost: 10 });
   await new Promise((r) => setTimeout(r, 300));
   const perdeAcik = !!document.querySelector('#sleep-fade.on'), kilitli = DK.input.isBlocked();
   DK.press('KeyW', 0.8); DK.press('Tab', 0.1); DK.press('KeyE', 0.1);
   const sonra = { x: p.pos.x, z: p.pos.z }; const yuruyus = Math.hypot(sonra.x - once.x, sonra.z - once.z);
   const panel = [...document.querySelectorAll('#modal.active .panel h2')].map((e) => e.textContent);
   window.__g1 = { perdeAcik, kilitli, yuruyus: +yuruyus.toFixed(3), panel, uiOpen: !!DK.G.uiOpen };
   const t0 = performance.now(); while (performance.now() - t0 < 90000 && !(Math.hypot(DK.G.ship.x - A.mooring.x, DK.G.ship.z - A.mooring.z) < 5)) await new Promise((r) => setTimeout(r, 200));
   while (document.querySelector('#sleep-fade.on') && performance.now() - t0 < 100000) await new Promise((r) => setTimeout(r, 200));
   await new Promise((r) => setTimeout(r, 1500));
   const q = DK.G.player; DK.tpCamera.yaw = 0; const v0 = { x: q.pos.x, z: q.pos.z }; DK.press('KeyW', 0.8); const v1 = { x: q.pos.x, z: q.pos.z };
   window.__g2 = { kilitSonra: DK.input.isBlocked(), yuruyusSonra: +Math.hypot(v1.x - v0.x, v1.z - v0.z).toFixed(3), mod: q.mode, altin: q.inv.gold };
   return { perdeAltinda: window.__g1, varistanSonra: window.__g2 }; })()`},
 {expect: {js: `window.__g1.perdeAcik && window.__g1.kilitli && window.__g1.yuruyus < 0.05 && window.__g1.panel.length === 0`, truthy: true, label: 'G1 Perde açıkken W/Tab/E: oyuncu yürümez, panel açılmaz (girdi kilitli)'}},
 {expect: {js: `!window.__g2.kilitSonra && window.__g2.yuruyusSonra > 0.3 && window.__g2.altin === 1990`, truthy: true, label: 'G2 Varıştan sonra kilit kalkar: W ile yürünür; ücret bir kez (varışta) düşülmüş'}},
]
