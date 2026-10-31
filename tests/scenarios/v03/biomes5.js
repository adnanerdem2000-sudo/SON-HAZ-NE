[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); window.goto = async (x, z, yaw, dist, pitch, hour) => { await DK.terrain.prepare(x, z, {radius: 500}); const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(x, DK.terrain.heightAt(x,z)+1, z); p.vel.set(0,0,0); DK.sky.hour = hour ?? 11; DK.sim(0.3); DK.islands.checkT=0; DK.sim(1.5); DK.tpCamera.yaw=yaw; DK.tpCamera.pitch=pitch ?? 0.3; DK.tpCamera.targetDist=dist ?? 12; DK.sim(2); return DK.islands.stats(); }; window.F=(id,k=0)=>DK.archipelago.EXTRA_ISLANDS.find(i=>i.id===id).features[k]; 'ok'`},
 {wait: 1500, js: `(async()=>{ const pr=F('demirkapi'); await goto(pr.x+5, pr.z+40, Math.PI*0.9, 34, 0.42, 10); return [pr.x,pr.z]; })()`},
 {wait: 3000, shot: '/tmp/preview/p2/b_prison.png'},
 {js: `(async()=>{ const t=F('kadim_tapinak',0); await goto(t.x+2, t.z+58, 0, 30, 0.32, 10); return [t.x,t.z, DK.terrain.heightAt(t.x,t.z)]; })()`},
 {wait: 3000, shot: '/tmp/preview/p2/b_temple.png'},
]
