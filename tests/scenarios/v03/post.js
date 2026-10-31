[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1200, js: `DK.sky.hour=10; const p=DK.G.player; const s=DK.G.ship; p.pos.set(s.x-6, 4, s.z-16); p.yaw=0; DK.sim(2); 'x'`},
 {wait: 500, shot: '/tmp/preview/p2/post_day.png'},
 {js: `const {settings}=window; 'x'`},
 {js: `DK.sky.hour=18.9; DK.sim(1.5); 'sunset'`},
 {wait: 500, shot: '/tmp/preview/p2/post_sunset.png'},
 {js: `DK.sky.hour=23; DK.sim(1.5); 'night'`},
 {wait: 500, shot: '/tmp/preview/p2/post_night.png'},
]
