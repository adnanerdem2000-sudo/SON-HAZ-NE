[
 {js: `DK.G.noAutoPause=true; window.__p=null; DK.G.on('prompt', p=>window.__p=p); window.tp=(x,z)=>{const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(x, 10, z); p.vel.set(0,0,0);}; DK.handlers.startGame({kind:'solo', slot:1, data:null}); 'ok'`},
 {wait: 1500, js: `DK.treasure.giveMap('marti_1'); tp(478, 349); DK.sim(1.5); const p=DK.G.player; p.yaw=0; DK.tap('Digit3'); DK.sim(0.1); DK.tap('Mouse0'); DK.sim(0.1); ({busy: p.busy && p.busy.label})`},
 {wait: 200, js: `DK.sim(5); const c=DK.treasure.chests[0]; ({c: c && [c.pos.x.toFixed(2), c.pos.y.toFixed(2), c.pos.z.toFixed(2), c.state, !!c.body], mem: performance.memory && Math.round(performance.memory.usedJSHeapSize/1e6)})`},
 {js: `const c=DK.treasure.chests[0]; const p=DK.G.player; p.pos.set(c.pos.x, p.pos.y, c.pos.z-1.2); DK.sim(0.5); ({pr: window.__p && window.__p.label, ppos: p.pos.toArray().map(v=>+v.toFixed(2)), c: [c.pos.x.toFixed(2), c.pos.y.toFixed(2), c.pos.z.toFixed(2)]})`},
 {js: `DK.tap('KeyE'); DK.sim(0.05); 'tapped'`},
 {wait: 250, js: `DK.sim(0.3); const p=DK.G.player; ({carrying: p.carrying, state: DK.treasure.chests[0]?.state, mem: performance.memory && Math.round(performance.memory.usedJSHeapSize/1e6)})`},
 {js: `const p=DK.G.player; const s=DK.G.ship; p.boardShip(s, s.model.stations.hold.clone()); DK.sim(0.1); ({mode: p.mode})`},
 {js: `DK.sim(0.4); ({pr: window.__p && window.__p.label, mem: performance.memory && Math.round(performance.memory.usedJSHeapSize/1e6)})`},
]
