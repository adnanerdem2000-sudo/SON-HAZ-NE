[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `const p=DK.G.player; p.pos.set(40, 14, 150); DK.sim(0.3); const b = DK.bosses.spawn('tas_muhafiz', {id:'tas_muhafiz', x: 40, z: 130}); DK.G.godMode=true; window.B=b; b.update=function(dt){ this.anim.update(dt); this.place(); }; DK.sim(0.5); 'ok'`},
 {view: ['/tmp/preview/p2/boss_g_front.jpg', [40, 16, 112], [40, 15, 126]]},
 {view: ['/tmp/preview/p2/boss_g_back.jpg', [46, 17, 140], [40, 15, 126]]},
 {js: `DK.bosses._clear(); const p=DK.G.player; const b = DK.bosses.spawn('volkanik_dev', {id:'volkanik_dev', x: 40, z: 130, island:'kirlangic'}); b.rise=1; b.pos.set(40, 10, 126); window.V=b; b.update=function(dt){ this.anim.update(dt); this.place(); }; DK.sim(0.5); 'v'`},
 {view: ['/tmp/preview/p2/boss_v_front.jpg', [40, 18, 104], [40, 16, 126]]},
]
