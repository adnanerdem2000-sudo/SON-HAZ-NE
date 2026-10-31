[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 2500, js: `DK.sim(0.5); ({ports: DK.ports.list.map(p=>p.id+'@'+Math.round(p.x)+','+Math.round(p.z))})`},
 {js: `window.go = async (id) => { const pt=DK.ports.byId(id); await DK.terrain.prepare(pt.spawn.x, pt.spawn.z, {radius:500}); const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(pt.spawn.x, DK.terrain.heightAt(pt.spawn.x, pt.spawn.z)+1, pt.spawn.z); p.vel.set(0,0,0); return pt; }; go('tuz_pazari_port_0').then(()=>'went')`},
 {wait: 1500, js: `DK.sim(2); DK.sky.hour=10; const p=DK.G.player; ({pos:p.pos.toArray().map(v=>v.toFixed(1)), isl: DK.islands.stats(), terr: DK.terrain.stats(), npcs: DK.npcs.list.filter(n=>n.spot.dynamic).map(n=>n.spot.name+':'+n.spot.role)})`},
 {wait: 2500, js: `const p=DK.G.player; const pt=DK.ports.byId('tuz_pazari_port_0'); DK.tpCamera.yaw=Math.atan2(pt.x-p.pos.x, pt.z-p.pos.z)+Math.PI; DK.tpCamera.pitch=0.35; DK.tpCamera.targetDist=14; DK.sim(0.5); 'cam'`},
 {wait: 1500, shot: '/tmp/preview/p2/w_port.png'},
 {js: `const pt=DK.ports.byId('tuz_pazari_port_0'); const p=DK.G.player; DK.tpCamera.yaw=Math.atan2(pt.pierEnd.x-p.pos.x, pt.pierEnd.z-p.pos.z)+Math.PI; DK.tpCamera.pitch=0.2; DK.sim(0.5); 'cam2'`},
 {wait: 1200, shot: '/tmp/preview/p2/w_pier.png'},
]
