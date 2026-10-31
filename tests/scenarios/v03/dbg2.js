[
 {js: `DK.G.noAutoPause=true; window.__p=null; DK.G.on('prompt', p=>window.__p=p); window.tp=(x,z)=>{const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(x, 10, z); p.vel.set(0,0,0);}; DK.handlers.startGame({kind:'solo', slot:1, data:null}); 'ok'`},
 {wait: 1500, js: `const p=DK.G.player; const c=DK.treasure.spawnChest('small', new DK.THREE.Vector3(p.pos.x, p.pos.y, p.pos.z+1.5), {}); DK.sim(2); window.__log=[]; const o1=DK.G.on('dropCarry', e=>window.__log.push('dropCarry')); DK.treasure.pickUp(p, c); const a = {carrying: !!p.carrying, st: c.state}; DK.sim(0.1); const b = {carrying: !!p.carrying, st: c.state}; DK.sim(0.5); ({a, b, c2: {carrying: !!p.carrying, st: c.state}, log: window.__log})`},
 {js: `const p=DK.G.player; const c=DK.treasure.chests[DK.treasure.chests.length-1]; DK.treasure.drop(p); DK.sim(1); window.__armed=[]; DK.tap('KeyE'); DK.sim(0.05); const h1 = DK.input.isDown('etkilesim'); ({h1, hold: DK.interact ? 1 : 0, st: c.state})`},
 {wait: 400, js: `const p=DK.G.player; const c=DK.treasure.chests[DK.treasure.chests.length-1]; ({carrying: !!p.carrying, st: c.state, pr: window.__p && window.__p.label})`},
]
