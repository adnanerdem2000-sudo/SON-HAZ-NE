[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 2000, js: `(async()=>{ const s=DK.G.ship; const p=DK.G.player; s.x=-200; s.z=700; s.yaw=0; s.anchored=false; s.anchorState='up'; s.anchorT=0; await DK.terrain.prepare(s.x, s.z, {radius:300}); s.updateTransform(0); p.boardShip(s, s.model.stations.helm.clone()); p.mode='deck'; DK.sim(0.5); const b = DK.bosses.spawn('kraken'); DK.sim(6); return {hp: Math.round(b.hp), ten: b.tentacles.map(t=>t.state), headY: b.headY.toFixed(1), shipHp: Math.round(s.hp), holes: s.holes.length, phit: Math.round(p.hp)}; })()`},
 {js: `const b=DK.bosses.active; const s=DK.G.ship; DK.sim(8); ({ten: b.tentacles.map(t=>t.state), shipHp: Math.round(s.hp), holes: s.holes.length, php: Math.round(DK.G.player.hp)})`},
 {js: `DK.tpCamera.pitch=0.35; DK.tpCamera.targetDist=26; DK.sim(0.3); 'cam'`},
 {wait: 1500, snap: '/tmp/preview/p2/boss_kraken.jpg'},
 {js: `const b=DK.bosses.active; const t=b.tentacles.find(t=>t.state!=='gone'); t.state='stuck'; t.st=0; for(let i=0;i<10;i++){ t.target.hurt(60,{}); } DK.sim(0.5); ({hp: Math.round(b.hp), max: Math.round(b.maxHp), gone: t.state, exposed: b.exposed.toFixed(1), phase: b.phase})`},
 {js: `const b=DK.bosses.active; b.applyDamage(5000,{kind:'cannon'}); DK.sim(2); ({alive: b.alive, def: DK.bosses.defeated, gold: DK.G.player.inv.gold})`},
 {js: `DK.sim(9); ({active: !!DK.bosses.active})`},
 {js: `(async()=>{ const b = DK.bosses.spawn('derinlik_yilani'); DK.sim(10); return {mode: b.mode, y: b.pos.y.toFixed(1), shipHp: Math.round(DK.G.ship.hp), shots: DK.enemies.shots.length}; })()`},
 {js: `const b=DK.bosses.active; b.mode='spit'; b.mt=0; b.spits=0; DK.sim(1.4); DK.tpCamera.pitch=0.3; DK.tpCamera.targetDist=30; DK.sim(0.2); ({mode:b.mode, shots: DK.enemies.shots.length})`},
 {wait: 1200, snap: '/tmp/preview/p2/boss_serpent.jpg'},
 {js: `const b=DK.bosses.active; DK.sim(6); ({mode:b.mode, hp: Math.round(b.hp), shipHp: Math.round(DK.G.ship.hp), php: Math.round(DK.G.player.hp), poison: DK.G.player.poison.toFixed(1)})`},
]
