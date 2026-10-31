[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); window.goto = async (x, z, yaw, dist, pitch, hour) => { await DK.terrain.prepare(x, z, {radius: 500}); const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(x, DK.terrain.heightAt(x,z)+1, z); p.vel.set(0,0,0); DK.sky.hour = hour ?? 11; DK.sim(0.3); DK.islands.checkT=0; DK.sim(1.5); DK.tpCamera.yaw=yaw; DK.tpCamera.pitch=pitch ?? 0.3; DK.tpCamera.targetDist=dist ?? 12; DK.sim(0.5); return 1; }; window.F=(id,k=0)=>DK.archipelago.EXTRA_ISLANDS.find(i=>i.id===id).features[k]; 'ok'`},
 {wait: 1500, js: `(async()=>{ const t=F('kadim_tapinak',0); await goto(t.x+2, t.z+58, Math.PI, 24, 0.35, 10); return 1; })()`},
 {wait: 2500, snap: '/tmp/preview/p2/b_temple.jpg'},
]
