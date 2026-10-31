[
 {wait: 3000, shot: '/tmp/preview/p3/u_menu.png'},
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 6000, shot: '/tmp/preview/p3/u_hud.png'},
 {js: `DK.G.emit('openInventory'); 'ok'`},
 {wait: 800, shot: '/tmp/preview/p3/u_inv.png'},
 {js: `DK.ui.closeAll(); DK.G.emit('openMap'); 'ok'`},
 {wait: 1500, shot: '/tmp/preview/p3/u_map.png'},
 {js: `DK.ui.closeAll(); DK.G.emit('openJournal'); 'ok'`},
 {wait: 800, shot: '/tmp/preview/p3/u_journal.png'},
]
