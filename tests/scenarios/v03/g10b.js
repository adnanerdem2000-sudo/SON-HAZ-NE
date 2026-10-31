[
 {js: `DK.G.noAutoPause=true; DK.ui.closeAll(); document.querySelectorAll('.mbtn')[6].click(); 'creator'`},
 {wait: 2500, shot: '/tmp/preview/p2/u_creator.png', js: `DK.ui.closeAll(); document.querySelectorAll('.mbtn')[8].click(); 'settings'`},
 {wait: 800, shot: '/tmp/preview/p2/u_settings.png', js: `DK.ui.closeAll(); document.querySelectorAll('.mbtn')[4].click(); 'host'`},
 {wait: 800, shot: '/tmp/preview/p2/u_host.png', js: `DK.ui.closeAll(); DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'game'`},
 {wait: 1500, js: `const p=DK.G.player; p.inv.add('yakut',3); p.inv.add('elmas',1); p.inv.add('antik_vazo',1); DK.treasure.giveMap('marti_2', true); DK.G.emit('openInventory'); 'inv'`},
 {wait: 800, shot: '/tmp/preview/p2/u_inv.png', js: `DK.ui.closeAll(); DK.G.emit('openShop', {role:'general'}); 'shop'`},
 {wait: 800, shot: '/tmp/preview/p2/u_shop.png', js: `DK.ui.closeAll(); DK.quests.discovered.marti=true; DK.G.emit('openMap'); 'map'`},
 {wait: 2500, shot: '/tmp/preview/p2/u_map.png', js: `DK.ui.closeAll(); DK.G.emit('openJournal'); 'journal'`},
 {wait: 800, shot: '/tmp/preview/p2/u_journal.png', js: `DK.ui.closeAll(); DK.G.emit('openTreasureMap'); 'tmap'`},
 {wait: 1500, shot: '/tmp/preview/p2/u_tmap.png', js: `DK.ui.closeAll(); DK.G.emit('openShipyard'); 'yard'`},
 {wait: 800, shot: '/tmp/preview/p2/u_yard.png', js: `DK.ui.closeAll(); 'done'`},
]
