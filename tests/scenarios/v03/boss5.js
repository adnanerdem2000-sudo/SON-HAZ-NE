[
 {js: `window._notes=[]; DK.G.on('notify', e=>window._notes.push(e.text)); DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 6000, js: `(()=>{ const p=DK.G.player; const site = { id: 'volkanik_dev', x: p.pos.x + 28, z: p.pos.z - 10, land: true }; const b = DK.bosses.spawn('volkanik_dev', site); DK.sim(3); return b ? {hp: b.hp, max: b.maxHp, phase: b.phase, alive: b.alive, pos: b.pos.toArray().map(v=>+v.toFixed(1))} : 'none'; })()`},
 {js: `(()=>{ const b = DK.bosses.active; const ph=[]; for (const f of [0.55, 0.25]) { b.applyDamage ? b.applyDamage(b.hp - b.maxHp*f, {kind:'melee', weak: true}) : (b.hp = b.maxHp*f); DK.sim(2); ph.push(b.phase); } return {phases: ph, hp: Math.round(b.hp), notes: _notes.slice(-3)}; })()`},
 {snapjs: ['/tmp/preview/p3/b_volc.jpg', `(()=>{ const b = DK.bosses.active; const p=DK.G.player; return DK.snapFrom([p.pos.x - 6, p.pos.y + 5, p.pos.z + 14], [b.pos.x, b.pos.y + 5, b.pos.z]); })()`]},
 {js: `(()=>{ const b = DK.bosses.active; b.applyDamage ? b.applyDamage(b.hp + 10, {kind:'melee'}) : (b.hp = 0); DK.sim(4); return {alive: b.alive, active: !!DK.bosses.active, defeated: DK.bosses.defeated, notes: _notes.slice(-3), xp: DK.progress.xp, lvl: DK.progress.level}; })()`},
]
