[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); window.goto = async (x, z, yaw, dist, pitch, hour) => { await DK.terrain.prepare(x, z, {radius: 500}); const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(x, DK.terrain.heightAt(x,z)+1, z); p.vel.set(0,0,0); DK.sky.hour = hour ?? 11; DK.sim(0.3); DK.islands.checkT=0; DK.sim(1.5); DK.tpCamera.yaw=yaw; DK.tpCamera.pitch=pitch ?? 0.3; DK.tpCamera.targetDist=dist ?? 12; DK.sim(1); return DK.islands.stats(); }; window.F=(id,k=0)=>DK.archipelago.EXTRA_ISLANDS.find(i=>i.id===id).features[k]; window.info=()=>{ const r=DK.engine.renderer.info; return {heap: Math.round(performance.memory.usedJSHeapSize/1e6), geo: r.memory.geometries, tex: r.memory.textures, prog: r.programs?.length, calls: r.render.calls, tris: r.render.triangles}; }; info()`},
 {wait: 2000, js: `info()`},
 {js: `(async()=>{ const t=F('kadim_tapinak',0); const r = await goto(t.x+2, t.z+58, 0, 30, 0.32, 10); return {r: {b:r.built, inst:r.instances, prof:r.prof}, i: info()}; })()`},
 {wait: 3000, js: `info()`},
]
