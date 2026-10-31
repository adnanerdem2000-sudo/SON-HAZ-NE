[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 3000, js: `
  const T=DK.terrain; const WS=2400; const step=4; let land=0, shallow=0;
  const per={}; 
  for (let z=-WS/2; z<WS/2; z+=step) for (let x=-WS/2; x<WS/2; x+=step) { const h=T.heightAt(x,z); if (h>0) { land++; } else if (h>-6) shallow++; }
  const isl = {}; 
  for (const I of window.DK.terrain ? [] : []) {}
  const i = DK.engine.renderer.info;
  ({ landKm2: +(land*step*step/1e6).toFixed(3), shallowKm2: +(shallow*step*step/1e6).toFixed(3), worldKm2: (WS*WS/1e6), calls: i.render.calls, geo: i.memory.geometries, tex: i.memory.textures, progs: i.programs.length, heapMB: Math.round(performance.memory.usedJSHeapSize/1e6), fps: DK.engine.fps, scene: (()=>{let n=0; DK.engine.scene.traverse(()=>n++); return n;})() })
 `},
 {js: `const t0=performance.now(); for(let i=0;i<20000;i++) DK.terrain.heightAt(Math.random()*2400-1200, Math.random()*2400-1200); ({heightAt_us: +((performance.now()-t0)/20).toFixed(2), enemies: DK.enemies.list.length, animals: DK.animals.list.length, fishSchools: DK.fish.schools ? DK.fish.schools.length : 'n/a', bodies: DK.bodies.list.length})`},
]
