[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `DK.sky.hour=10; const p=DK.G.player; DK.tpCamera.yaw=Math.PI; DK.tpCamera.pitch=0.15; DK.tpCamera.targetDist=3.2; p.yaw=0; DK.sim(1); ({base: p.char.baseId, scale: p.char.modelScale.toFixed(3), clips: Object.keys(DK.kk ? DK.kk.clips : {}).length, cur: p.char.currentName})`},
 {wait: 400, shot: '/tmp/preview/p2/kk_player.png'},
 {js: `const p=DK.G.player; DK.input.down.add('KeyW'); DK.sim(1.2); ({cur: p.char.currentName}); `},
 {wait: 300, shot: '/tmp/preview/p2/kk_walk.png', js: `DK.input.down.delete('KeyW'); DK.sim(0.5); 'x'`},
]
