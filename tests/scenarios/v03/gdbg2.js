[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `const T=DK.THREE; const p=DK.G.player; const b = DK.bosses.spawn('tas_muhafiz', {id:'tas_muhafiz', x: p.pos.x+12, z: p.pos.z-6}); DK.G.godMode=true; DK.sim(0.3); b.root.updateMatrixWorld(true); const bb=new T.Box3().setFromObject(b.root, true); const bc=new T.Box3().setFromObject(b.crystal); window.B=b; ({size: bb.getSize(new T.Vector3()).toArray().map(v=>v.toFixed(1)), min: bb.min.y.toFixed(2), py: b.pos.y.toFixed(2), crystal: bc.getSize(new T.Vector3()).toArray().map(v=>v.toFixed(2))})`},
 {js: `const p=DK.G.player; DK.tpCamera.yaw=Math.atan2(B.pos.x-p.pos.x, B.pos.z-p.pos.z)+Math.PI; DK.tpCamera.pitch=0.12; DK.tpCamera.targetDist=10; B.state='idle'; B.atkT=99; DK.sim(0.5); 'cam'`},
 {wait: 1200, snap: '/tmp/preview/p2/boss_guardian.jpg'},
]
