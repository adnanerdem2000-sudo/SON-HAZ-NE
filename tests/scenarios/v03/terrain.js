[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1200, js: `DK.sky.hour=11; const p=DK.G.player; p.pos.set(118, 3, 185); p.vel.set(0,0,0); p.yaw=0; DK.sim(2); ({mode:p.mode, y:p.pos.y.toFixed(2), tide: DK.ocean.tide.toFixed(2)})`},
 {wait: 500, shot: '/tmp/preview/p2/beach.png'},
 {js: `const p=DK.G.player; p.pos.set(470, 2, 300); DK.sim(2); ({mode:p.mode})`},
 {wait: 500, shot: '/tmp/preview/p2/reef.png'},
]
