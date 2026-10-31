[
 {js: `DK.G.noAutoPause=true; window.__p=null; DK.G.on('prompt', p=>window.__p=p); DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `const sched = d => DK.time.scheduleFor(d).some(e=>e.id==='ticaret_gemisi'); let d=DK.time.day; while(!sched(d)) d++; DK.time.day=d; DK.sky.hour=10.5; DK.time._prevHour=10.5; DK.sim(2); DK.sky.hour=11.5; DK.time._prevHour=11.5; DK.sim(2); const t=DK.details.trader; const p=DK.G.player; const np=t.npc.root.position; p.pos.set(np.x, np.y+0.3, np.z-1.8); p.vel.set(0,0,0); p.yaw=0; DK.tpCamera.yaw=Math.PI*0.75; DK.tpCamera.pitch=0.25; DK.sim(1); ({phase:t.phase, ship:[+t.ship.x.toFixed(1), +t.ship.z.toFixed(1)], npc:[+np.x.toFixed(1), +np.y.toFixed(1), +np.z.toFixed(1)], mode:p.mode, pr: window.__p && window.__p.label})`},
 {wait: 400, shot: '/tmp/preview/p2/trader_docked.png'},
 {js: `const p=DK.G.player; p.inv.gold=2000; DK.press('KeyE'); DK.sim(0.2); const shop = DK.ui.stack.map(s=>s.kind); const row=[...document.querySelectorAll('.shop-row')].find(r=>r.textContent.includes('Baharat')); row && row.querySelector('button').click(); ({shop, bought: p.inv.count('baharat'), gold: p.inv.gold})`},
 {js: `DK.ui.closeAll(); DK.sky.hour=22.2; DK.time._prevHour=22.2; DK.sim(80, 0.1); const r = DK.npcs.list.filter(n=>n.home).map(n=>n.spot.id+':'+n.at); r`},
 {js: `const p=DK.G.player; const L=DK.port.npcSpots.find(s=>s.id==='tuzla'); p.pos.set(L.x+1, 3, L.z+9); p.vel.set(0,0,0); DK.tpCamera.yaw=Math.PI; DK.tpCamera.pitch=0.15; DK.sim(1); 'cam'`},
 {wait: 400, shot: '/tmp/preview/p2/npc_inn_night.png'},
 {js: `DK.sky.hour=6.5; DK.time._prevHour=6.5; DK.sim(80, 0.1); DK.npcs.list.filter(n=>n.home).map(n=>n.spot.id+':'+n.at)`},
]
