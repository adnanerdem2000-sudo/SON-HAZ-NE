[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `DK.sky.hour=11; const p=DK.G.player; p.inv.add('kilic',1); p.pos.set(-40, 10, -215); p.vel.set(0,0,0); DK.sim(1); p.equip('sword'); DK.G.godMode=true; DK.sim(6); ({hp:p.hp, en: DK.enemies.list.map(e=>e.type+':'+e.state+':'+e.char.currentName+':'+(e.char.upperName||'-')+':'+e.pos.distanceTo(p.pos).toFixed(1))})`},
 {js: `const p=DK.G.player; DK.tpCamera.pitch=0.3; DK.tpCamera.targetDist=8; DK.sim(0.3); 'cam'`},
 {wait: 300, shot: '/tmp/preview/p2/f_fight.png'},
 {js: `const p=DK.G.player; const log=[]; let parries=0, blocks=0; DK.G.on('parry', ()=>parries++); DK.G.on('blockSpark', ()=>blocks++); for (let i=0;i<120;i++){ const att=DK.enemies.list.find(e=>e.alive && e.state==='attack' && !e.move?.ranged && e.atkHit && e.stateT > e.atkHit[0]-0.18 && e.stateT < e.atkHit[0]); if (att && !p.blocking) { DK.input.down.add('Mouse2'); } DK.sim(1/30); if (p.blocking && !att) DK.input.down.delete('Mouse2'); } DK.input.down.delete('Mouse2'); DK.sim(0.2); ({parries, blocks, stunned: DK.enemies.list.filter(e=>e.state==='stunned').length, st: DK.enemies.list.map(e=>e.type+':'+e.state)})`},
 {wait: 200, shot: '/tmp/preview/p2/f_parry.png'},
 {js: `const p=DK.G.player; const e=DK.enemies.list.filter(e=>e.alive).sort((a,b)=>a.pos.distanceTo(p.pos)-b.pos.distanceTo(p.pos))[0]; DK.tpCamera.yaw=Math.atan2(e.pos.x-p.pos.x, e.pos.z-p.pos.z); const hp0=e.hp; DK.tap('Mouse0'); DK.sim(0.1); DK.sim(0.5); const a1=p.action&&p.action.anim; DK.tap('Mouse0'); DK.sim(0.6); const a2=p.action&&p.action.anim; DK.tap('Mouse0'); DK.sim(0.5); const a3=p.action&&p.action.anim; DK.sim(1); DK.input.down.add('Mouse0'); DK.input.pressedSet.add('Mouse0'); DK.sim(0.4); DK.input.down.delete('Mouse0'); const a4=p.action&&p.action.anim; DK.sim(1.2); ({a1,a2,a3,a4, dmg: hp0-e.hp, ehp: e.hp, st: e.state})`},
 {wait: 200, shot: '/tmp/preview/p2/f_combo.png'},
]
