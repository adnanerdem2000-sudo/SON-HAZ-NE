[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 6000, js: `(()=>{ DK.engine.renderer.setAnimationLoop && 0; DK.G.emit('openMap'); return 'ok'; })()`},
 {wait: 2500, shot: '/tmp/preview/p3/u_map.png'},
]
