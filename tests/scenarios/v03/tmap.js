[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1200, js: `DK.treasure.giveMap('marti_1'); DK.sim(0.2); DK.G.emit('openTreasureMap'); DK.ui.stack.map(s=>s.kind)`},
 {wait: 600, shot: '/tmp/preview/p2/tmap.png'},
 {js: `DK.ui.closeAll(); DK.G.emit('openMap'); 'map'`},
 {wait: 800, shot: '/tmp/preview/p2/worldmap2.png'},
 {js: `DK.ui.closeAll(); DK.G.emit('openInventory'); 'inv'`},
 {wait: 600, shot: '/tmp/preview/p2/inventory.png'},
]
