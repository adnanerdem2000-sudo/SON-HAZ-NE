[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); window.goto = async (x, z, yaw, dist, pitch, hour) => { await DK.terrain.prepare(x, z, {radius: 500}); const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(x, DK.terrain.heightAt(x,z)+1, z); p.vel.set(0,0,0); DK.sky.hour = hour ?? 11; DK.sim(0.3); DK.islands.checkT=0; DK.sim(1.5); DK.tpCamera.yaw=yaw; DK.tpCamera.pitch=pitch ?? 0.3; DK.tpCamera.targetDist=dist ?? 12; DK.sim(6); return DK.islands.stats().built; }; 'ok'`},
 {wait: 1500, js: `const f=DK.ports.byId('kuzeyfener_port_0'); goto(f.x+10, f.z+5, 2.2, 22, 0.32, 11).then(r=>r)`},
 {wait: 2500, shot: '/tmp/preview/p2/b_north.png'},
 {js: `const I=DK.islands; const fz=(id)=>{for(const i of window.DKISL||[]){}}; const isl = DK.terrain.islandAt(7700,-900,2); goto(7700+300, -900+330, -2.4, 40, 0.42, 12).then(r=>r)`},
 {wait: 2500, shot: '/tmp/preview/p2/b_volcano.png'},
 {js: `goto(-6700+120, 2500+60, 0.8, 30, 0.38, 10).then(r=>r)`},
 {wait: 2500, shot: '/tmp/preview/p2/b_desert.png'},
 {js: `goto(-6800+90, -6400+40, 2.0, 24, 0.35, 15).then(r=>r)`},
 {wait: 2500, shot: '/tmp/preview/p2/b_ghost.png'},
 {js: `goto(1900, 7400+70, Math.PI, 40, 0.3, 10).then(r=>r)`},
 {wait: 2500, shot: '/tmp/preview/p2/b_temple.png'},
]
