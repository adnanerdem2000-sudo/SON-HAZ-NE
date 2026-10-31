[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1200, js: `DK.sim(1); for (let i=0;i<64*64;i++) DK.quests.fog[i] = (i%64 > 20 && i%64 < 50 && Math.floor(i/64) > 10 && Math.floor(i/64) < 50) ? 1 : 0; for (const k of ['kirlangic','marti','kemik','papagan','ikiz1','ikiz2','liman','gozcu','yanki','lagun','kamp','marti_ucpalmiye','harabe','resif','batik']) DK.quests.discovered[k]=true; DK.sim(0.3); 'x'`},
 {wait: 300, shot: '/tmp/preview/p2/minimap.png'},
 {js: `DK.G.emit('openMap'); 'map'`},
 {wait: 800, shot: '/tmp/preview/p2/worldmap.png'},
 {js: `for (let i=0;i<64*64;i++) DK.quests.fog[i]=1; DK.ui.closeAll(); DK.G.emit('openMap'); 'map2'`},
 {wait: 800, shot: '/tmp/preview/p2/worldmap_full.png'},
]
