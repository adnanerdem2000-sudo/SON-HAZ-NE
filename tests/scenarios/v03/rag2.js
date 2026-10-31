[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `DK.sky.hour=11; const p=DK.G.player; DK.sim(0.5); DK.G.godMode=true; const e=DK.enemies.spawn('haydut', p.pos.x+0.5, p.pos.z+3, {role:'sentry', yaw: Math.PI}); window.e1=e; const e2=DK.enemies.spawn('iskelet', p.pos.x+3, p.pos.z+4, {role:'sentry', yaw: Math.PI}); window.e2=e2; DK.sim(0.5); p.yaw=0; DK.tpCamera.yaw=-Math.PI/2; DK.tpCamera.pitch=0.1; DK.tpCamera.targetDist=6; DK.sim(0.3); ({ys:[e.pos.y.toFixed(2),p.pos.y.toFixed(2)], pos:[p.pos.x.toFixed(1),p.pos.z.toFixed(1)]})`},
 {wait: 300, shot: '/tmp/preview/p2/r0.png'},
 {js: `const p=DK.G.player; e1.lastHitDir=new DK.THREE.Vector3(0,0,1); e1.applyDamage(500,{pos:p.pos, kb:3, heavy:true}); e2.applyDamage(500,{pos:p.pos, kb:2}); DK.sim(0.2); ({s2: e2.state, a2: e2.char.currentName, rise: e2.reviveT})`},
 {wait: 100, shot: '/tmp/preview/p2/r1.png'},
 {js: `DK.sim(1.5); ({sleep: e1.char.ragdoll.sleep, t: e1.char.ragdoll.t.toFixed(2), hips: e1.char.bones.hips.getWorldPosition(new DK.THREE.Vector3()).toArray().map(v=>v.toFixed(2)), root: e1.root.position.toArray().map(v=>v.toFixed(2))})`},
 {wait: 200, shot: '/tmp/preview/p2/r2.png'},
]
