[
 {js: `DK.G.noAutoPause=true; window.__p=null; DK.G.on('prompt', p=>window.__p=p); window.tp=(x,z)=>{const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(x, 10, z); p.vel.set(0,0,0);}; DK.handlers.startGame({kind:'solo', slot:1, data:null}); 'ok'`},
 {wait: 1500, js: `const spot = DK.port.npcSpots.find(s=>s.id==='tuzla'); tp(spot.x, spot.z+1.6); DK.sim(1.5); DK.tap('KeyE'); DK.sim(0.1); document.querySelector('.dialog .opt').click(); DK.sim(0.2); const s2 = DK.port.npcSpots.find(s=>s.id==='haritaci'); tp(s2.x, s2.z+1.6); DK.sim(1.5); DK.tap('KeyE'); DK.sim(0.1); document.querySelector('.dialog .opt').click(); DK.sim(0.1); ({stage: DK.quests.stage, maps: DK.G.player.inv.count('hazine_haritasi')})`},
 {wait: 200, js: `DK.tap('Digit5'); DK.sim(0.1); DK.ui.stack.map(s=>s.kind)`},
 {wait: 600, shot: '/tmp/preview/g_tmap.png', js: `DK.ui.close(); tp(478, 349); DK.sim(1.5); const p=DK.G.player; p.yaw=0; DK.tap('Digit3'); DK.sim(0.1); 'dig-ready'`},
 {wait: 200, js: `const p=DK.G.player; p.yaw=0; DK.tap('Mouse0'); DK.sim(0.1); ({busy: p.busy && p.busy.label})`},
 {wait: 200, js: `DK.sim(5); const c=DK.treasure.chests[0]; const p=DK.G.player; p.pos.set(c.pos.x, p.pos.y, c.pos.z-1.2); DK.sim(0.5); DK.press('KeyE'); 'tapped'`},
 {wait: 250, js: `DK.sim(0.3); const p=DK.G.player; ({carrying: p.carrying, state: DK.treasure.chests[0]?.state})`},
 {wait: 200, shot: '/tmp/preview/g_carry.png', js: `const p=DK.G.player; const s=DK.G.ship; p.boardShip(s, s.model.stations.hold.clone()); DK.sim(0.5); const pr=window.__p; DK.press('KeyE'); ({pr})`},
 {wait: 250, js: `DK.sim(0.3); const p=DK.G.player; ({hold: DK.G.ship.hold.chests.length, carrying: p.carrying})`},
 {js: `const p=DK.G.player; p.leaveShipToWorld(new DK.THREE.Vector3(-16, 4, DK.port.shoreZ-15.6)); DK.sim(1.5); DK.tap('KeyE'); DK.sim(0.1); const o=[...document.querySelectorAll('.dialog .opt')]; const t=o.map(x=>x.textContent); if (o[0]) o[0].click(); DK.sim(0.3); ({opts:t, gold: p.inv.gold, stage: DK.quests.stage, hold: DK.G.ship.hold.chests.length})`},
 {wait: 400, shot: '/tmp/preview/g_sold.png'},
]
