[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 7000, js: `(()=>{ DK.sim(1); return { tiles: DK.terrain.tiles ? DK.terrain.tiles.size : null, workers: DK.terrain.workers.length }; })()`},
 {wait: 1500, shot: '/tmp/preview/p3/s_game2.png'},
]
