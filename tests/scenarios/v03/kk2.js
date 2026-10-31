[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `DK.sky.hour=10; const p=DK.G.player; DK.tpCamera.yaw=Math.PI*0.85; DK.tpCamera.pitch=0.2; DK.tpCamera.targetDist=4.6; p.yaw=0.3; DK.sim(1); ({base: p.char.baseId})`},
 {wait: 400, shot: '/tmp/preview/p2/kk_player2.png'},
 {js: `const n=DK.npcs.list.find(n=>n.spot.id==='tuccar'); const p=DK.G.player; p.pos.set(n.pos.x, n.pos.y, n.pos.z+3.2); p.yaw=Math.PI; DK.tpCamera.yaw=0; DK.tpCamera.pitch=0.12; DK.sim(1); 'npc'`},
 {wait: 400, shot: '/tmp/preview/p2/kk_npc.png'},
 {js: `const p=DK.G.player; p.equip('sword'); DK.press('Mouse0', 0.05); DK.sim(0.25); ({cur: p.char.currentName})`},
 {wait: 200, shot: '/tmp/preview/p2/kk_slash.png'},
]
