[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); window.atSea = async () => { const s=DK.G.ship; const p=DK.G.player; s.x=-200; s.z=700; s.yaw=0; s.hp=s.maxHp; s.water=0; s.holes=[]; s._syncHoles(); s.sunk=false; s.sinking=0; s.root.visible=true; s.anchored=false; s.anchorState='up'; s.anchorT=0; await DK.terrain.prepare(s.x, s.z, {radius:300}); s.updateTransform(0); p.hp=100; p.boardShip(s, s.model.stations.helm.clone()); DK.sim(0.5); return 1; }; 'ok'`},
 {wait: 2000, js: `(async()=>{ await atSea(); const b = DK.bosses.spawn('kraken'); DK.sim(5); const t=b.tentacles.find(t=>t.state!=='gone'); t.state='stuck'; t.st=0; for(let i=0;i<10;i++) t.target.hurt(60,{}); DK.sim(0.5); return {hp: Math.round(b.hp), exposed: b.exposed.toFixed(1), shipHp: Math.round(DK.G.ship.hp)}; })()`},
 {js: `DK.sim(1); DK.tpCamera.pitch=0.32; DK.tpCamera.targetDist=30; DK.tpCamera.yaw=1.2; DK.sim(0.2); 'cam'`},
 {wait: 1500, snap: '/tmp/preview/p2/boss_kraken.jpg'},
 {js: `(async()=>{ DK.bosses._clear(); await atSea(); const b = DK.bosses.spawn('derinlik_yilani'); DK.sim(4); b.mode='spit'; b.mt=0; b.spits=0; DK.sim(2.2); DK.tpCamera.pitch=0.25; DK.tpCamera.targetDist=34; DK.sim(0.2); return {mode:b.mode, shots: DK.enemies.shots.length, y: b.pos.y.toFixed(1)}; })()`},
 {wait: 1000, snap: '/tmp/preview/p2/boss_serpent.jpg'},
 {js: `const b=DK.bosses.active; DK.sim(3); b.mode='lineup'; b.mt=0; DK.sim(4); ({mode:b.mode, hp: Math.round(b.hp), shipHp: Math.round(DK.G.ship.hp), php: Math.round(DK.G.player.hp), poison: DK.G.player.poison.toFixed(1)})`},
]
