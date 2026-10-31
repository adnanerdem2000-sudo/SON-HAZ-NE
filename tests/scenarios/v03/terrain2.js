[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1200, js: `DK.sky.hour=11; const p=DK.G.player; p.pos.set(118, 3, 186); p.vel.set(0,0,0); DK.tpCamera.yaw=0; DK.tpCamera.pitch=0.9; DK.tpCamera.targetDist=11; DK.sim(2); ({tide: DK.ocean.tide.toFixed(2), h: [DK.terrain.heightAt(118,190).toFixed(2), DK.terrain.heightAt(121,201).toFixed(2), DK.terrain.heightAt(125,210).toFixed(2), DK.terrain.heightAt(110,195).toFixed(2)]})`},
 {wait: 400, shot: '/tmp/preview/p2/beach_top.png'},
 {js: `DK.settings.v.effects='low'; DK.settings.apply(); 'lo'`},
 {wait: 400, shot: '/tmp/preview/p2/beach_top_lo.png'},
]
