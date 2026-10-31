[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `DK.sky.hour=11; const p=DK.G.player; p.inv.add('kilic',1); p.pos.set(-40, 10, -200); p.vel.set(0,0,0); DK.sim(2); p.equip('sword'); DK.sim(0.5); const out=DK.enemies.list.map(e=>{ const dx=p.pos.x-e.pos.x, dz=p.pos.z-e.pos.z; const ang=Math.abs(((Math.atan2(dx,dz)-e.yaw+Math.PI*3)%(Math.PI*2))-Math.PI)*180/Math.PI; const blk=DK.physics.lineBlocked(e.pos.x,e.pos.y+1.6,e.pos.z,p.pos.x,p.pos.y+1.4,p.pos.z); return {t:e.type, d:Math.hypot(dx,dz).toFixed(1), ang:ang.toFixed(0), blk, ey:e.pos.y.toFixed(1), py:p.pos.y.toFixed(1), aw: e.awareness}; }); out`},
]
