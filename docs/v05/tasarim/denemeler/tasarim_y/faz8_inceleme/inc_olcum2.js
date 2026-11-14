// Faz 8 karşıt inceleme ölçümü 2 (salt-okur). (a) karakter örgü dökümü (birleştirilebilirlik), (b) yengeç gölgesi ayıklaması,
// (c) fırtınada sis kırpma payı (1,15 / 1,5 / 2 / 3 × d99) ile görüntü farkı, (d) 2,9 km'de karakter listesi ve kurulan adalar.
[
 {expect: {js: `!!window.DK && !!window.__ready`, truthy: true, label: 'Sayfa hazır'}},
 {js: `DK.G.noAutoPause=true; DK.engine.fpsLimit=1; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 5000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
 {js: `(()=>{ DK.events.eventT=1e9; DK.G.godMode=true; DK.sim(2);
   window._M2 = () => { const r=DK.engine.renderer, i=r.info; i.autoReset=false; i.reset(); DK.post.render(); const a={c:i.render.calls,t:i.render.triangles};
     const au=r.shadowMap.autoUpdate; r.shadowMap.autoUpdate=false; r.shadowMap.needsUpdate=false; i.reset(); DK.post.render(); const b={c:i.render.calls,t:i.render.triangles};
     r.shadowMap.autoUpdate=au; i.autoReset=true; return {calls:a.c, tris:a.t, shadowCalls:a.c-b.c, shadowTris:a.t-b.t}; };
   window._grab = () => { DK.post.render(); const cv=DK.engine.renderer.domElement; const c=document.createElement('canvas'); c.width=cv.width; c.height=cv.height; const g=c.getContext('2d'); g.drawImage(cv,0,0); return g.getImageData(0,0,c.width,c.height).data; };
   window._diff = (A,B) => { let s=0, n8=0, n3=0, mx=0; const N=A.length/4; for (let i=0;i<A.length;i+=4){ const d=Math.max(Math.abs(A[i]-B[i]),Math.abs(A[i+1]-B[i+1]),Math.abs(A[i+2]-B[i+2])); s+=(Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]))/3; if(d>8)n8++; if(d>3)n3++; if(d>mx)mx=d; } return {ort:+(s/N).toFixed(3), p8:n8, p3:n3, enCok:mx}; };
   let pl=0; DK.engine.scene.traverse(o=>{ if (o.isPointLight && o.visible) pl++; });
   return {noktaIsik: pl, saat: DK.sky.hour}; })()`},
 // (a) karakter örgü dökümü: NPC başına örgü, iskeletli örgü, gölge atan, malzeme/doku çeşidi
 {js: `(()=>{ const rows=[]; for (const n of DK.npcs.list.filter(n=>n.root)) { let m=0, sk=0, cs=0, vis=0; const mats=new Set(), maps=new Set(), skel=new Set(); const sks=[];
     n.root.traverse(o=>{ if (!o.isMesh) return; m++; if (o.visible) vis++; if (o.castShadow) cs++; mats.add(o.material.uuid); if (o.material.map) maps.add(o.material.map.uuid);
       if (o.isSkinnedMesh) { sk++; skel.add(o.skeleton.uuid); sks.push(o.name + (o.visible?'':'(gizli)')); } });
     rows.push({ad:n.spot.name, orgu:m, gorunur:vis, iskeletli:sk, golgeAtan:cs, malzeme:mats.size, doku:maps.size, iskeletSayisi:skel.size, iskeletliAdlar:sks}); }
   return rows; })()`},
 // (b) yengeç ve diğer Animated hayvanların gölgesi: frustumCulled=true yapılınca gölge çağrısı
 {js: `(()=>{ const crabs=DK.animals.list.filter(a=>a.kind==='crab'); const roots=crabs.map(a=>a.root||a.anim?.root||a.mesh).filter(Boolean);
   const p=DK.G.player.pos; const dist=crabs.map(a=>Math.round(Math.hypot(a.pos.x-p.x,a.pos.z-p.z)));
   const a=_M2(); for (const R of roots) R.traverse(o=>{ if (o.isMesh) { o.userData._fc0=o.frustumCulled; o.frustumCulled=true; if (o.isSkinnedMesh) { o.computeBoundingSphere(); o.boundingSphere.radius*=1.5; } } });
   const b=_M2(); for (const R of roots) R.traverse(o=>{ if (o.isMesh && o.userData._fc0!==undefined) o.frustumCulled=o.userData._fc0; });
   return {yengec:crabs.length, kokBulunan:roots.length, uzaklikM:dist, once:a, sonra:b}; })()`},
 // (c) fırtınada sis kırpma payı
 {js: `(()=>{ DK.sky.hour=11; DK.sky.locked=true; DK.sky.setWeather('firtina', true); DK.sim(2);
   const cam=DK.engine.camera; const c0=cam.position.clone(), q0=cam.quaternion.clone();
   const ro=DK.engine.scene.fog.density; const d99=Math.sqrt(Math.log(100))/ro; const out={d99:Math.round(d99), paylar:[]};
   for (const [cx,cz,tx,ty,tz] of [[-850,0,0,25,0],[-700,-300,0,20,0]]) {
     cam.position.set(cx, 4, cz); cam.lookAt(tx, ty, tz); cam.updateMatrixWorld(true); const A=_grab();
     for (const k of [1.15, 1.5, 2, 3]) { const hidden=[]; for (const t of DK.terrain.tiles.values()) { if (!t.mesh || !t.mesh.visible) continue; const d=Math.max(0, Math.hypot(t.x0+80-cam.position.x, t.z0+80-cam.position.z)-80); if (d > k*d99) { t.mesh.visible=false; hidden.push(t); } }
       const B=_grab(); hidden.forEach(t=>t.mesh.visible=true); out.paylar.push({kamera:[cx,cz], pay:k, gizlenen:hidden.length, fark:_diff(A,B)}); } }
   cam.position.copy(c0); cam.quaternion.copy(q0); cam.updateMatrixWorld(true); DK.sky.setWeather('acik', true); DK.sim(1); return out; })()`},
 // (d) 2,9 km açıkta: karakter kökleri, kurulu adalar, kök başına ana çağrı
 {js: `(()=>{ const p=DK.G.player; p.mode='swim'; p.ship=null; p.pos.set(-900, 0, 3000); p.vel.set(0,0,0); DK.sim(0.5);
   const roots=[...DK.npcs.list.filter(n=>n.root).map(n=>['npc:'+n.spot.name, n.root]), ...DK.details.boats.map((b,i)=>['balikci'+i, b.fisher.root]), ['oyuncu', p.char.root]];
   const base=_M2(); const per=[]; for (const [ad,R] of roots) { const v=R.visible; R.visible=false; const m=_M2(); R.visible=v; per.push([ad, (base.calls-base.shadowCalls)-(m.calls-m.shadowCalls), base.shadowCalls-m.shadowCalls]); }
   return {npcSayisi: DK.npcs.list.filter(n=>n.root).length, kuruluAdalar:[...DK.islands.built.keys()], per}; })()`},
 {expect: {js: `DK.G.state==='playing'`, truthy: true, label: 'Oyun açık'}},
]
