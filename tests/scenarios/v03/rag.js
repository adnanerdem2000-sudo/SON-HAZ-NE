[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `DK.sky.hour=11; const p=DK.G.player; p.pos.set(30, 10, 120); p.vel.set(0,0,0); DK.sim(1); DK.G.godMode=true; const e=DK.enemies.spawn('haydut', p.pos.x, p.pos.z+3, {role:'sentry', yaw: Math.PI}); window.e1=e; const e2=DK.enemies.spawn('iskelet_agir', p.pos.x+2.5, p.pos.z+4, {role:'sentry', yaw: Math.PI}); window.e2=e2; const e3=DK.enemies.spawn('hayalet_muhafiz', p.pos.x-2.5, p.pos.z+4, {role:'sentry', yaw: Math.PI}); DK.sim(0.5); p.yaw=0; DK.tpCamera.yaw=0; DK.tpCamera.pitch=0.15; DK.tpCamera.targetDist=4.5; DK.sim(0.3); ({ys:[e.pos.y,p.pos.y]})`},
 {wait: 300, shot: '/tmp/preview/p2/r0.png'},
 {js: `const p=DK.G.player; e1.lastHitDir=new DK.THREE.Vector3(0,0,1); e1.applyDamage(500,{pos:p.pos, kb:3, heavy:true}); DK.sim(0.25); 'hit'`},
 {wait: 200, shot: '/tmp/preview/p2/r1.png'},
 {js: `DK.sim(1.2); ({sleep: e1.char.ragdoll.sleep, t: e1.char.ragdoll.t.toFixed(2)})`},
 {wait: 200, shot: '/tmp/preview/p2/r2.png'},
 {js: `DK.tpCamera.yaw=Math.PI/2; DK.sim(3); ({sleep: e1.char.ragdoll.sleep})`},
 {wait: 200, shot: '/tmp/preview/p2/r3.png'},
]
