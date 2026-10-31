[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 6000, js: `(()=>{ const n = DK.npcs.list.find(n=>n.role==='gambler' || n.spot?.role==='gambler' || n.id==='zarci'); window._g = n; return n ? [n.id, n.name, n.role, Object.keys(n).slice(0,12)] : DK.npcs.list.map(n=>n.id).slice(0,20); })()`},
 {js: `(()=>{ const n=_g; DK.G.emit('openDice', { id: n.id, name: n.name || n.spot?.name }); return document.querySelectorAll('.dice').length; })()`},
 {js: `(()=>{ document.querySelector('.dice .btn.gold').click(); return DK.G.player.inv.gold; })()`},
 {wait: 1500, js: `(()=>({ msg: document.querySelector('.dice-msg').textContent, gold: DK.G.player.inv.gold, info: document.querySelector('.dice .muted').textContent }))()`},
 {wait: 200, shot: '/tmp/preview/p3/u_dice.png'},
]
