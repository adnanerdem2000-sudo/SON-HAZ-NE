[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:1, data:null}); 'ok'`},
 {wait: 1500, js: `const p=DK.G.player; const c=DK.treasure.spawnChest('small', new DK.THREE.Vector3(p.pos.x, p.pos.y, p.pos.z+1.5), {}); DK.sim(1); DK.treasure.pickUp(p, c); DK.sim(0.2); ({carrying: !!p.carrying})`},
 {js: `const p=DK.G.player; const s=DK.G.ship; p.boardShip(s, s.model.stations.hold.clone()); DK.sim(0.5); ({mode: p.mode, mem: Math.round(performance.memory.usedJSHeapSize/1e6)})`},
 {js: `const p=DK.G.player; const s=DK.G.ship; DK.treasure.stowInHold(s); ({hold: s.hold.chests.length, carrying: !!p.carrying, mem: Math.round(performance.memory.usedJSHeapSize/1e6)})`},
 {js: `DK.sim(0.03); ({mem: Math.round(performance.memory.usedJSHeapSize/1e6)})`},
 {js: `DK.sim(0.3); ({mem: Math.round(performance.memory.usedJSHeapSize/1e6)})`},
 {wait: 1000, js: `({fps: DK.engine.fps, mem: Math.round(performance.memory.usedJSHeapSize/1e6)})`},
]
