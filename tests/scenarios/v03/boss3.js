[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); window.goto = async (x, z) => { await DK.terrain.prepare(x, z, {radius: 400}); const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(x, DK.terrain.heightAt(x,z)+1, z); p.vel.set(0,0,0); DK.sky.hour = 11; DK.sim(0.3); DK.islands.checkT=0; DK.sim(1.5); return 1; }; window.F=(id,k=0)=>DK.archipelago.EXTRA_ISLANDS.find(i=>i.id===id).features[k]; DK.G.godMode=true; 'ok'`},
 {wait: 1500, js: `(async()=>{ const t=F('kadim_tapinak',0); await goto(t.x+2, t.z+40); const ts=DK.islands.temples[t.id]; ts.state.done=true; ts.gate.opening=true; DK.sim(5); await goto(t.x+3, t.z+12); DK.sim(1.5); const b=DK.bosses.active; return {boss: b && b.id, gate: ts.gate.open.toFixed(2), hp: b && Math.round(b.hp)}; })()`},
 {js: `const b=DK.bosses.active; DK.sim(6); ({state:b.state, php: Math.round(DK.G.player.hp), shots: DK.enemies.shots.length})`},
 {js: `const b=DK.bosses.active; const p=DK.G.player; DK.tpCamera.yaw=Math.atan2(b.pos.x-p.pos.x, b.pos.z-p.pos.z)+Math.PI; DK.tpCamera.pitch=0.2; DK.tpCamera.targetDist=14; DK.sim(0.3); 'cam'`},
 {wait: 1500, snap: '/tmp/preview/p2/boss_guardian.jpg'},
 {js: `const b=DK.bosses.active; b.applyDamage(b.maxHp*0.5, {}); DK.sim(0.5); const before=b.hp; b.applyDamage(100, {}); ({phase:b.phase, pillars: b.pillars.length, shieldDmg: Math.round(before-b.hp)})`},
 {js: `const b=DK.bosses.active; for (const pl of b.pillars) pl.hurt(1000); const before=b.hp; b.applyDamage(100, {pos: b.pos.clone().add(new DK.THREE.Vector3(-Math.sin(b.yaw)*5, 0, -Math.cos(b.yaw)*5))}); const back=Math.round(before-b.hp); b.applyDamage(99999,{}); DK.sim(2); ({back, alive: b.alive, def: DK.bosses.defeated})`},
 {js: `(async()=>{ DK.sim(11); const I=DK.archipelago.EXTRA_ISLANDS.find(i=>i.id==='ates_dagi'); await goto(I.x+I.r*0.2, I.z+20); DK.sim(2); const b=DK.bosses.active; return {boss: b && b.id, lavaY: b && b.lavaY.toFixed(1)}; })()`},
 {js: `const b=DK.bosses.active; DK.sim(5); b.state='barrage'; b.st=0; b.thrown=0; DK.sim(2.5); ({state:b.state, rise:b.rise, shots: DK.enemies.shots.length, pools: DK.enemies.firePools.length, php: Math.round(DK.G.player.hp)})`},
 {js: `const b=DK.bosses.active; const p=DK.G.player; DK.tpCamera.yaw=Math.atan2(b.pos.x-p.pos.x, b.pos.z-p.pos.z)+Math.PI; DK.tpCamera.pitch=0.15; DK.tpCamera.targetDist=18; DK.sim(0.6); ({pools: DK.enemies.firePools.length})`},
 {wait: 1500, snap: '/tmp/preview/p2/boss_volcano.jpg'},
]
