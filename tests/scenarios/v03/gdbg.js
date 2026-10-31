[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `const T=DK.THREE; const b = DK.bosses.spawn('tas_muhafiz', {id:'tas_muhafiz', x: DK.G.player.pos.x+15, z: DK.G.player.pos.z}); DK.sim(0.2); b.root.updateMatrixWorld(true); const bb=new T.Box3().setFromObject(b.root, true); const bc=new T.Box3().setFromObject(b.crystal); const s=bb.getSize(new T.Vector3()); const cs=bc.getSize(new T.Vector3()); const r={size: s.toArray().map(v=>v.toFixed(1)), min: bb.min.y.toFixed(1), crystal: cs.toArray().map(v=>v.toFixed(2)), modelScale: b.anim.model.scale.x.toFixed(4), pos: b.pos.toArray().map(v=>v.toFixed(1))}; DK.bosses._clear(); r`},
]
