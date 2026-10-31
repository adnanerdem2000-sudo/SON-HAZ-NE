[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); window.goto = async (x, z, yaw, dist, pitch, hour) => { await DK.terrain.prepare(x, z, {radius: 500}); const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(x, DK.terrain.heightAt(x,z)+1, z); p.vel.set(0,0,0); DK.sky.hour = hour ?? 11; DK.sim(0.3); DK.islands.checkT=0; DK.sim(1.5); DK.tpCamera.yaw=yaw; DK.tpCamera.pitch=pitch ?? 0.3; DK.tpCamera.targetDist=dist ?? 12; DK.sim(6); return DK.islands.stats(); }; 'ok'`},
 {wait: 1500, js: `const f=DK.ports.byId('kuzeyfener_port_0'); goto(f.x+10, f.z+5, 2.2, 22, 0.32, 11).then(r=>({b:r.built, inst:r.instances, ms: r.buildMs}))`},
 {wait: 2500, shot: '/tmp/preview/p2/b_north.png'},
 {js: `goto(7700+300, -900+330, -2.4, 40, 0.42, 12).then(r=>({b:r.built, inst:r.instances, ms: r.buildMs, terr: DK.terrain.stats()}))`},
 {wait: 3000, shot: '/tmp/preview/p2/b_volcano.png'},
]
