[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `(async()=>{ const s=DK.G.ship; const p=DK.G.player; s.x=-200; s.z=700; s.yaw=0; s.anchored=true; s.anchorState='down'; s.anchorT=1; s.anchorPt=null; s.sail=s.sailTarget=1; await DK.terrain.prepare(s.x, s.z, {radius:300}); s.updateTransform(0); p.boardShip(s, s.model.stations.helm.clone()); DK.sim(1); const T=DK.THREE; s.damage(40, new T.Vector3(0, s.T.deckY+3, s.T.masts[0].z)); s.damage(40, new T.Vector3(0, s.T.deckY+3, s.T.masts[0].z)); s.damage(25, new T.Vector3(1, s.T.deckY+3, 0)); s.ignite(0.5, 1); s.ignite(-0.6, -2); DK.sim(3); return [s.x, s.z]; })()`},
 {view: ['/tmp/preview/p2/ship_dmg.jpg', [-188, 8, 712], [-200, 2.5, 700]]},
]
