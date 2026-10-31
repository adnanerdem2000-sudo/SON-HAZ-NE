[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); window.atSea = async () => { const s=DK.G.ship; const p=DK.G.player; s.x=-200; s.z=700; s.yaw=0; s.hp=s.maxHp; s.water=0; s.holes=[]; s._syncHoles(); s.anchored=false; s.anchorState='up'; s.anchorT=0; await DK.terrain.prepare(s.x, s.z, {radius:300}); s.updateTransform(0); p.hp=100; p.boardShip(s, s.model.stations.helm.clone().setX(0)); p.mode='deck'; DK.sim(0.5); return 1; }; DK.G.godMode=true; 'ok'`},
 {wait: 1500, js: `(async()=>{ await atSea(); const b = DK.bosses.spawn('lanetli_amiral'); DK.sim(10); return {hp: Math.round(b.hp), d: Math.round(Math.hypot(b.gship.x-DK.G.ship.x, b.gship.z-DK.G.ship.z)), shots: DK.enemies.shots.length, shipHp: Math.round(DK.G.ship.hp)}; })()`},
 {js: `const b=DK.bosses.active; b.applyDamage(b.maxHp*0.55, {kind:'cannon'}); DK.sim(3); ({boarded: b.boarded, admiral: !!b.admiral, onDeck: DK.enemies.list.filter(e=>e.ship).map(e=>e.type+':'+e.state+':'+e.local.x.toFixed(1)+','+e.local.z.toFixed(1))})`},
 {js: `DK.sim(4); ({onDeck: DK.enemies.list.filter(e=>e.ship).map(e=>e.type+':'+e.state+':'+e.pos.distanceTo(DK.G.player.pos).toFixed(1)), php: Math.round(DK.G.player.hp)})`},
 {view: ['/tmp/preview/p2/boss_admiral.jpg', [-185, 9, 685], [-200, 2, 700]]},
 {js: `const b=DK.bosses.active; b.admiral.applyDamage(99999, {}); DK.sim(1.5); ({alive: b.alive, def: DK.bosses.defeated, ghosts: DK.enemies.list.filter(e=>e.ship && e.alive).length})`},
]
