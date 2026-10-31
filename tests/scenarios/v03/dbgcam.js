[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `DK.sky.hour=10; const p=DK.G.player; DK.tpCamera.yaw=Math.PI*0.85; DK.tpCamera.pitch=0.2; DK.tpCamera.targetDist=4.6; p.yaw=0.3; DK.sim(1); const c=DK.engine.camera.position; ({cam:c.toArray().map(v=>v.toFixed(2)), under: DK.sky.underwater, th: DK.terrain.heightAt(c.x,c.z).toFixed(2), wh: DK.ocean.heightAt(c.x,c.z).toFixed(2), p: p.pos.toArray().map(v=>v.toFixed(2)), mode: p.mode, tile: DK.terrain.stats(), inCave: p.inCave, skyInCave: DK.sky.inCave})`},
 {wait: 400, shot: '/tmp/preview/p2/dbgcam.png'},
]
