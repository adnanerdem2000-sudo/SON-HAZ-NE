[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `(async()=>{ const s=DK.G.ship; const p=DK.G.player; s.x=-200; s.z=700; s.yaw=0; s.anchored=false; s.anchorState='up'; s.anchorT=0; s.sail=s.sailTarget=1; await DK.terrain.prepare(s.x, s.z, {radius:300}); s.updateTransform(0); p.boardShip(s, s.model.stations.helm.clone()); DK.sim(3); const v0=s.speed; const T=DK.THREE; s.damage(30, new T.Vector3(0, s.T.deckY+3, s.T.masts[0].z)); s.damage(30, new T.Vector3(0, s.T.deckY+3, s.T.masts[0].z)); s.damage(20, new T.Vector3(0.5, 0.5, -s.T.L*0.45)); s.ignite(0.5, 1); DK.sim(4); return {v0: v0.toFixed(2), v1: s.speed.toFixed(2), parts: s.parts, mast: s.mastHp, fires: s.fires.length, sf: s.sailFactor().toFixed(2), hp: Math.round(s.hp)}; })()`},
 {view: ['/tmp/preview/p2/ship_dmg.jpg', [-190, 9, 712], [-200, 3, 700]]},
 {js: `const s=DK.G.ship; const p=DK.G.player; p.mode='deck'; p.local.set(0.5, 0, 0.2); DK.sim(0.2); const prs=[]; DK.G.on('prompt', e=>prs.push(e&&e.label)); DK.sim(0.3); ({prompts: [...new Set(prs)].slice(0,6), fires: s.fires.map(f=>f.s.toFixed(2))})`},
]
