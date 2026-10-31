[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); ({soft: DK.post.isSoftware(), mode: DK.post.mode})`},
 {wait: 1500, js: `const i=DK.engine.renderer.info; ({geo:i.memory.geometries, tex:i.memory.textures, prog: i.programs.length, heap: Math.round(performance.memory.usedJSHeapSize/1e6)})`},
 {js: `const p=DK.G.player; const s=DK.G.ship; p.boardShip(s, s.model.stations.helm.clone()); DK.sim(0.3); p.mode='helm'; s.anchorState='up'; s.anchorT=0; s.anchored=false; s.sailTarget=1; s.backing=true; DK.sim(5); s.backing=false; DK.sim(10); const i=DK.engine.renderer.info; ({geo:i.memory.geometries, tex:i.memory.textures, prog: i.programs.length, heap: Math.round(performance.memory.usedJSHeapSize/1e6)})`},
 {wait: 3000, js: `const i=DK.engine.renderer.info; ({fps: DK.engine.fps, geo:i.memory.geometries, tex:i.memory.textures, prog: i.programs.length, heap: Math.round(performance.memory.usedJSHeapSize/1e6)})`},
 {js: `DK.sim(20); const i=DK.engine.renderer.info; ({geo:i.memory.geometries, tex:i.memory.textures, prog: i.programs.length, heap: Math.round(performance.memory.usedJSHeapSize/1e6), wakes: DK.details.wakes.size})`},
 {wait: 3000, js: `const i=DK.engine.renderer.info; ({fps: DK.engine.fps, geo:i.memory.geometries, tex:i.memory.textures, heap: Math.round(performance.memory.usedJSHeapSize/1e6)})`},
]
