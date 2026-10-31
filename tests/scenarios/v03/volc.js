[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); window.goto = async (x, z, yaw, dist, pitch, hour) => { await DK.terrain.prepare(x, z, {radius: 500}); const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(x, DK.terrain.heightAt(x,z)+1, z); p.vel.set(0,0,0); DK.sky.hour = hour ?? 11; DK.sim(0.3); DK.islands.checkT=0; DK.sim(1.5); DK.tpCamera.yaw=yaw; DK.tpCamera.pitch=pitch ?? 0.3; DK.tpCamera.targetDist=dist ?? 12; DK.sim(2); return DK.islands.stats(); }; 'ok'`},
 {wait: 1500, js: `goto(7700+250, -900+250, -2.4, 26, 0.3, 12).then(r=>{ const b=DK.islands.built.get('ates_dagi'); b.group.traverse(o=>{ if (o.material && o.material.isShaderMaterial) o.visible=false; }); return {b:r.built, inst:r.instances, lights: DK.islands.pool.map(l=>l.intensity.toFixed(1))}; })`},
 {wait: 3000, shot: '/tmp/preview/p2/b_volcano_nolava.png'},
 {js: `const b=DK.islands.built.get('ates_dagi'); b.group.traverse(o=>{ if (o.material && o.material.isShaderMaterial) o.visible=true; }); 'lava on'`},
 {wait: 3000, shot: '/tmp/preview/p2/b_volcano.png'},
]
