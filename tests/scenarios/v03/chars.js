[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1200, js: `DK.sky.hour=16.5; const p=DK.G.player; p.setAppearance({...p.appearance, hat:'tricorn', hatColor:'#2a1a10', coat:'uzun', coatColor:'#7a1a1a'}); p.equip('sword'); DK.tpCamera.yaw=0; DK.tpCamera.pitch=0.1; DK.tpCamera.targetDist=2.4; p.yaw=Math.PI; DK.sim(1.5); p.char.held ? 'held' : 'none'`},
 {wait: 400, shot: '/tmp/preview/p2/char_front.png'},
 {js: `const p=DK.G.player; p.equip('pistol'); DK.tpCamera.yaw=-1.2; DK.sim(0.8); 'pistol'`},
 {wait: 400, shot: '/tmp/preview/p2/char_pistol.png'},
 {js: `const p=DK.G.player; p.setAppearance({...p.appearance, hat:'kaptan', hatColor:'#1f3a5a'}); DK.sky.hour=22; DK.tpCamera.yaw=0.4; DK.sim(1); 'night'`},
 {wait: 400, shot: '/tmp/preview/p2/char_night.png'},
 {js: `const p=DK.G.player; p.inv.add('durbun',1); DK.sky.hour=11; const s=DK.G.ship; p.boardShip(s, s.model.stations.helm.clone()); DK.tpCamera.yaw=Math.PI*0.9; DK.tpCamera.pitch=0.0; DK.sim(0.5); DK.game.toggleSpyglass(true); DK.sim(0.6); ({spy: DK.G.spyglass, t: document.querySelector('#spyglass .sg-target').textContent})`},
 {wait: 400, shot: '/tmp/preview/p2/spyglass.png'},
]
