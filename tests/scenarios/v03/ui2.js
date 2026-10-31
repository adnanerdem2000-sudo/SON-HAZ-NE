[
 {wait: 3500, shot: '/tmp/preview/p3/u_menu2.png'},
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 5000, js: `(()=>{ const pr = DK.progress; pr.gain(90, 'Test'); pr.gain(40, 'Haydut'); return {lvl: pr.level, xp: pr.xp, pts: pr.points, maxHp: DK.G.player.maxHp}; })()`},
 {wait: 700, shot: '/tmp/preview/p3/u_levelup.png'},
 {js: `(()=>{ const pr = DK.progress; pr.learn('demir_bilek'); pr.gain(2000, 'Test'); return {lvl: pr.level, pts: pr.points, maxHp: DK.G.player.maxHp, mods: DK.G.mods}; })()`},
 {wait: 300, js: `(()=>{ DK.G.emit('openSkills'); return 'ok'; })()`},
 {wait: 900, shot: '/tmp/preview/p3/u_skills.png'},
 {js: `(()=>{ DK.ui.closeAll(); const p=DK.G.player; p.pos.set(400, 3, 400); DK.sim(0.6); return DK.archipelago.regionAt(p.pos.x,p.pos.z); })()`},
]
