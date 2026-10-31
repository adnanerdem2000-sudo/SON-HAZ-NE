[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `DK.sky.hour=11; const p=DK.G.player; p.inv.add('kilic',1); p.pos.set(-40, 10, -200); p.vel.set(0,0,0); DK.sim(2); p.equip('sword'); DK.sim(0.5); ({en: DK.enemies.list.map(e=>e.type+':'+e.state+':'+e.role+':'+e.char.currentName), pos:[p.pos.x.toFixed(1), p.pos.y.toFixed(1), p.pos.z.toFixed(1)]})`},
 {js: `const p=DK.G.player; DK.tpCamera.yaw=Math.PI; DK.tpCamera.pitch=0.25; DK.tpCamera.targetDist=7; p.yaw=Math.PI; DK.sim(3); ({en: DK.enemies.list.map(e=>e.type+':'+e.state+':'+e.alert+':'+e.awareness.toFixed(2)+':'+e.pos.distanceTo(p.pos).toFixed(1))})`},
 {wait: 300, shot: '/tmp/preview/p2/f_camp.png'},
 {js: `const p=DK.G.player; DK.sim(3); ({hp: p.hp.toFixed(0), en: DK.enemies.list.map(e=>e.type+':'+e.state+':'+e.char.currentName+':'+(e.char.upperName||'-')+':'+e.pos.distanceTo(p.pos).toFixed(1)), shots: DK.enemies.shots.length, tokens: [...DK.enemies.tokens.values()].map(s=>s.size)})`},
 {wait: 300, shot: '/tmp/preview/p2/f_fight.png'},
 {js: `const p=DK.G.player; p.hp=100; const e=DK.enemies.list.find(e=>e.alive); let n=0; for(let i=0;i<40 && e.alive;i++){ e.applyDamage(30,{pos:p.pos, kb:2}); DK.sim(0.2); n++; } DK.sim(0.5); ({killed: !e.alive, state: e.state, rag: !!e.char.ragdoll, anim: e.char.currentName, n})`},
 {wait: 300, shot: '/tmp/preview/p2/f_rag.png'},
]
