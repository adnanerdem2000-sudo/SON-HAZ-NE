[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `(async()=>{ const s=DK.G.ship; const p=DK.G.player; s.x=-300; s.z=700; s.yaw=0; s.anchored=false; s.anchorState='up'; s.anchorT=0; s.anchorPt=null; s.sail=s.sailTarget=0.3; await DK.terrain.prepare(s.x, s.z, {radius:300}); s.updateTransform(0); p.boardShip(s, s.model.stations.helm.clone()); p.mode='deck'; DK.G.godMode=true; DK.sim(0.5); DK.events.spawnEnemyShip(); const e=DK.events.enemyShip; e.x=s.x+15; e.z=s.z+5; DK.sim(12); return {grappled: DK.events.grappled, crew: DK.events.crew.map(c=>c.type+':'+(c.ship===s?'ours':'theirs')+':'+c.state), dist: Math.hypot(e.x-s.x, e.z-s.z).toFixed(1)}; })()`},
 {js: `DK.sim(4); ({crew: DK.events.crew.map(c=>c.type+':'+(c.ship===DK.G.ship?'ours':'theirs')+':'+c.state+':'+c.pos.distanceTo(DK.G.player.pos).toFixed(1))})`},
 {js: `const s=DK.G.ship; DK.tpCamera.pitch=0.4; DK.tpCamera.targetDist=16; DK.sim(0.3); [s.x, s.z]`},
 {wait: 800, snap: '/tmp/preview/p2/boarding.jpg'},
 {js: `for (const c of DK.events.crew) c.applyDamage(9999, {}); DK.sim(1); ({captured: DK.events.captured, gold: DK.G.player.inv.gold})`},
]
