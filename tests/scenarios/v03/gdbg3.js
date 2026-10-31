[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `const p=DK.G.player; const b = DK.bosses.spawn('tas_muhafiz', {id:'tas_muhafiz', x: p.pos.x+5, z: p.pos.z-25}); DK.G.godMode=true; window.B=b; b.update=function(dt){ this.anim.update(dt); this.place(); }; p.pos.set(b.pos.x, p.pos.y, b.pos.z+16); p.yaw=Math.PI; DK.tpCamera.yaw=0; DK.tpCamera.pitch=0.12; DK.tpCamera.targetDist=8; DK.sim(0.5); 'set'`},
 {wait: 1200, snap: '/tmp/preview/p2/boss_g_a.jpg'},
 {js: `DK.tpCamera.yaw=Math.PI; DK.sim(0.5); 'flip'`},
 {wait: 1200, snap: '/tmp/preview/p2/boss_g_b.jpg'},
]
