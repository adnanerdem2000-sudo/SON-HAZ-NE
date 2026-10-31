[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `const p=DK.G.player; p.pos.set(40, 3, 150); DK.sim(0.3); const b = DK.bosses.spawn('tas_muhafiz', {id:'tas_muhafiz', x: 40, z: 130}); DK.G.godMode=true; window.B=b; b.update=function(dt){ this.anim.update(dt); this.place(); }; DK.sim(0.5); [b.pos.x, b.pos.y, b.pos.z]`},
]
