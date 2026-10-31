[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 2500, js: `window.go = async (id) => { const pt=DK.ports.byId(id); await DK.terrain.prepare(pt.spawn.x, pt.spawn.z, {radius:500}); const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(pt.spawn.x, DK.terrain.heightAt(pt.spawn.x, pt.spawn.z)+1, pt.spawn.z); p.vel.set(0,0,0); return pt; }; go('tuz_pazari_port_0').then(()=>'went')`},
 {wait: 1500, js: `DK.sim(1); ({isl: DK.islands.stats()})`},
]
