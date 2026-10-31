[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:1, data:null}); 'ok'`},
 {wait: 1500, js: `const p=DK.G.player; const c=DK.treasure.spawnChest('small', new DK.THREE.Vector3(p.pos.x, p.pos.y, p.pos.z+1.5), {}); DK.sim(2); DK.tap('KeyE'); const r=[]; for (let i=0;i<4;i++){ DK.sim(1/30); r.push([DK.interact._armed, +DK.interact.holdT.toFixed(3), DK.interact.current && DK.interact.current.id, DK.input.isDown('etkilesim')]); } ({r, st: c.state})`},
 {wait: 400, js: `const c=DK.treasure.chests[DK.treasure.chests.length-1]; ({armed: DK.interact._armed, holdT: DK.interact.holdT, st: c.state, fps: DK.engine.fps})`},
]
