[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:1, data:null}); 'ok'`},
 {wait: 3000, js: `const t0=performance.now(); DK.sim(1); const up=(performance.now()-t0)/30; ({fps: DK.engine.fps, upd_ms: up.toFixed(1), calls: DK.engine.renderer.info.render.calls, tris: DK.engine.renderer.info.render.triangles})`},
 {js: `const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(478, 10, 349); p.vel.set(0,0,0); DK.sim(1.5); 'tp'`},
 {wait: 4000, js: `const t0=performance.now(); DK.sim(1); const up=(performance.now()-t0)/30; ({fps: DK.engine.fps, upd_ms: up.toFixed(1), calls: DK.engine.renderer.info.render.calls, tris: DK.engine.renderer.info.render.triangles, bodies: DK.bodies.list.length, parts: DK.effects.parts ? DK.effects.parts.length : -1})`},
 {js: `DK.settings.v.effects='low'; DK.settings.apply(); 'low'`},
 {wait: 4000, js: `({fps: DK.engine.fps, calls: DK.engine.renderer.info.render.calls})`},
 {js: `DK.settings.v.effects='high'; DK.settings.apply(); DK.settings.v.shadows='off'; DK.settings.apply(); 'noshadow'`},
 {wait: 4000, js: `({fps: DK.engine.fps, calls: DK.engine.renderer.info.render.calls})`},
]
