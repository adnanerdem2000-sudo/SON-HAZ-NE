[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); window.goto = async (x, z, hour) => { await DK.terrain.prepare(x, z, {radius: 400}); const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(x, DK.terrain.heightAt(x,z)+1, z); p.vel.set(0,0,0); DK.sky.hour = hour ?? 11; DK.sim(0.3); DK.islands.checkT=0; DK.sim(1.5); return 'ok'; }; window.look = (a, ang, dist, h) => { const fx=a.pos.x+Math.sin(a.yaw+ang)*dist, fz=a.pos.z+Math.cos(a.yaw+ang)*dist; return DK.snapFrom([fx, Math.max(a.pos.y, DK.terrain.heightAt(fx,fz))+h, fz], [a.pos.x, a.pos.y+h*0.35, a.pos.z]); }; 'ok'`},
 {wait: 2500, js: `(async()=>{ const zs = DK.animals.zones.filter(z=>z.island==='kurt_adasi'); await goto(zs[0].x+20, zs[0].z+20, 11); DK.sim(2); return 'ok'; })()`},
 {snapjs: ['/tmp/preview/p3/e_wolf.jpg', `(()=>{ const a = DK.animals.list.find(x=>x.kind==='wolf'); a.state='wander'; a.speed=0; return look(a, 1.3, 4, 1.4); })()`]},
 {snapjs: ['/tmp/preview/p3/e_deer.jpg', `(()=>{ const a = DK.animals.list.find(x=>x.kind==='deer'); return look(a, 1.3, 5, 1.6); })()`]},
 {snapjs: ['/tmp/preview/p3/e_stag.jpg', `(()=>{ const a = DK.animals.list.find(x=>x.kind==='stag'); return look(a, 1.0, 6, 2); })()`]},
 {snapjs: ['/tmp/preview/p3/e_fox.jpg', `(()=>{ const a = DK.animals.list.find(x=>x.kind==='fox'); return look(a, 1.3, 2.5, 0.9); })()`]},
 {js: `(async()=>{ const z = DK.animals.zones.find(z=>z.kind==='polar'); await goto(z.x+15, z.z+15, 11); DK.sim(2); const a = DK.animals.list.find(x=>x.kind==='polar'); return a ? [a.pos.x, a.pos.y, a.pos.z, a.state] : 'none'; })()`},
 {snapjs: ['/tmp/preview/p3/e_polar.jpg', `(()=>{ const a = DK.animals.list.find(x=>x.kind==='polar'); return look(a, 1.2, 6, 2.2); })()`]},
 {js: `(async()=>{ const z = DK.animals.zones.find(z=>z.kind==='yeti'); await goto(z.x+15, z.z+15, 11); DK.sim(2); const a = DK.animals.list.find(x=>x.kind==='yeti'); return a ? [a.pos.x, a.pos.y, a.pos.z, a.state] : 'none'; })()`},
 {snapjs: ['/tmp/preview/p3/e_yeti.jpg', `(()=>{ const a = DK.animals.list.find(x=>x.kind==='yeti'); return look(a, 0.4, 7, 2.5); })()`]},
 {js: `(async()=>{ const z = DK.animals.zones.find(z=>z.kind==='giantcrab'); await goto(z.x+8, z.z+8, 11); DK.sim(2); const a = DK.animals.list.find(x=>x.kind==='giantcrab'); return a ? [a.pos.x, a.pos.y, a.pos.z, a.state] : 'none'; })()`},
 {snapjs: ['/tmp/preview/p3/e_gcrab.jpg', `(()=>{ const a = DK.animals.list.find(x=>x.kind==='giantcrab'); return look(a, 0.2, 5, 2); })()`]},
]
