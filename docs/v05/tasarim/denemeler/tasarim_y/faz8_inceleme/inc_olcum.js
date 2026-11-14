// Faz 8 karşıt inceleme ölçümü (salt-okur; oyun kodu değişmez). 8080 = değişmeyen v0.4.
// (1) P2.1 iddiası: karakterlerde görüş konisi ayıklaması açılınca liman çağrısı ne kadar düşer (09 görünümü + 4 yön)?
// (2) T6 iddiası: sise bağlı arazi kırpması (1,15·d99) görüntüyü değiştirir mi (ada silueti)? Fırtına ve açık hava.
// (3) Uzak liman NPC'leri: oyuncu 3 km uzaktayken karakter çağrıları (önce/sonra).
[
 {expect: {js: `!!window.DK && !!window.__ready`, truthy: true, label: 'Sayfa hazır'}},
 {js: `DK.G.noAutoPause=true; DK.engine.fpsLimit=1; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 5000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
 {js: `(()=>{ DK.events.eventT=1e9; DK.G.godMode=true; DK.sim(2);
   window._M2 = () => { const r=DK.engine.renderer, i=r.info; i.autoReset=false; i.reset(); DK.post.render(); const a={c:i.render.calls,t:i.render.triangles};
     const au=r.shadowMap.autoUpdate; r.shadowMap.autoUpdate=false; r.shadowMap.needsUpdate=false; i.reset(); DK.post.render(); const b={c:i.render.calls,t:i.render.triangles};
     r.shadowMap.autoUpdate=au; i.autoReset=true; return {calls:a.c, tris:a.t, shadowCalls:a.c-b.c, shadowTris:a.t-b.t}; };
   window._roots = () => [...DK.npcs.list.filter(n=>n.root).map(n=>n.root), ...DK.details.boats.map(b=>b.fisher.root), DK.G.player.char.root];
   window._cull = (on) => { for (const R of _roots()) R.traverse((o)=>{ if (!o.isMesh) return;
       if (on) { if (o.userData._fc0===undefined) o.userData._fc0=o.frustumCulled; o.frustumCulled=true; if (o.isSkinnedMesh) { o.computeBoundingSphere(); o.boundingSphere.radius*=1.5; } }
       else if (o.userData._fc0!==undefined) { o.frustumCulled=o.userData._fc0; } }); };
   window._charCalls = () => { const a=_M2(); const rs=_roots(); const vis=rs.map(r=>r.visible); rs.forEach(r=>r.visible=false); const b=_M2(); rs.forEach((r,i)=>r.visible=vis[i]);
     return {top:a.calls, golge:a.shadowCalls, karakterAna:(a.calls-a.shadowCalls)-(b.calls-b.shadowCalls), karakterGolge:a.shadowCalls-b.shadowCalls}; };
   window._grab = () => { DK.post.render(); const cv=DK.engine.renderer.domElement; const c=document.createElement('canvas'); c.width=cv.width; c.height=cv.height; const g=c.getContext('2d'); g.drawImage(cv,0,0); return g.getImageData(0,0,c.width,c.height).data; };
   window._diff = (A,B) => { let s=0, n8=0, n3=0, mx=0; const N=A.length/4; for (let i=0;i<A.length;i+=4){ const d=Math.max(Math.abs(A[i]-B[i]),Math.abs(A[i+1]-B[i+1]),Math.abs(A[i+2]-B[i+2])); s+=(Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]))/3; if(d>8)n8++; if(d>3)n3++; if(d>mx)mx=d; } return {ortMutlak:+(s/N).toFixed(3), pikselYuzde8:+(100*n8/N).toFixed(3), pikselYuzde3:+(100*n3/N).toFixed(3), enCok:mx}; };
   return {npc: DK.npcs.list.filter(n=>n.root).length, balikci: DK.details.boats.length}; })()`},
 // (1) 09 görünümü ve 4 yön: ayıklama kapalı (v0.4) / açık (P2.1 önerisi)
 {js: `(()=>{ const out={}; out.v09_once=_charCalls(); _cull(true); out.v09_sonra=_charCalls(); _cull(false);
   const p=DK.G.player.pos, cam=DK.engine.camera; const c0=cam.position.clone(), q0=cam.quaternion.clone(); out.yon=[];
   for (const a of [0, Math.PI/2, Math.PI, -Math.PI/2]) { cam.position.set(p.x - Math.sin(a)*6, p.y+3, p.z - Math.cos(a)*6); cam.lookAt(p.x + Math.sin(a)*10, p.y+1.5, p.z + Math.cos(a)*10); cam.updateMatrixWorld(true);
     const o=_charCalls(); _cull(true); const s=_charCalls(); _cull(false); out.yon.push({yaw:+a.toFixed(2), once:o, sonra:s}); }
   cam.position.copy(c0); cam.quaternion.copy(q0); cam.updateMatrixWorld(true); return out; })()`},
 // (2a) fırtına: Kırlangıç'ın 850 m batısından adaya bakış; 1,15·d99 ötesindeki arazi karoları gizlenince fark
 {js: `(()=>{ DK.sky.hour=11; DK.sky.locked=true; DK.sky.setWeather('firtina', true); DK.sim(2);
   const cam=DK.engine.camera; const c0=cam.position.clone(), q0=cam.quaternion.clone();
   const ro=DK.engine.scene.fog.density; const d99=Math.sqrt(Math.log(100))/ro;
   cam.position.set(-850, 4, 0); cam.lookAt(0, 25, 0); cam.updateMatrixWorld(true);
   const A=_grab(); const A2=_grab(); const gurultu=_diff(A,A2);
   const hidden=[]; for (const t of DK.terrain.tiles.values()) { if (!t.mesh || !t.mesh.visible) continue; const d=Math.max(0, Math.hypot(t.x0+80-cam.position.x, t.z0+80-cam.position.z)-80); if (d > 1.15*d99) { t.mesh.visible=false; hidden.push(t); } }
   const B=_grab(); const fark=_diff(A,B); hidden.forEach(t=>t.mesh.visible=true);
   cam.position.copy(c0); cam.quaternion.copy(q0); cam.updateMatrixWorld(true);
   return {hava:'firtina', yogunluk:+ro.toFixed(5), d99:Math.round(d99), gizlenenKaro:hidden.length, gurultu, fark}; })()`},
 // (2b) açık hava: 2 450 m batıdan adaya bakış
 {js: `(()=>{ DK.sky.setWeather('acik', true); DK.sim(2);
   const cam=DK.engine.camera; const c0=cam.position.clone(), q0=cam.quaternion.clone();
   const ro=DK.engine.scene.fog.density; const d99=Math.sqrt(Math.log(100))/ro;
   cam.position.set(-2450, 4, 0); cam.lookAt(0, 20, 0); cam.updateMatrixWorld(true);
   const A=_grab(); const hidden=[]; for (const t of DK.terrain.tiles.values()) { if (!t.mesh || !t.mesh.visible) continue; const d=Math.max(0, Math.hypot(t.x0+80-cam.position.x, t.z0+80-cam.position.z)-80); if (d > 1.15*d99) { t.mesh.visible=false; hidden.push(t); } }
   const B=_grab(); const fark=_diff(A,B); hidden.forEach(t=>t.mesh.visible=true);
   cam.position.copy(c0); cam.quaternion.copy(q0); cam.updateMatrixWorld(true);
   return {hava:'acik', yogunluk:+ro.toFixed(5), d99:Math.round(d99), gizlenenKaro:hidden.length, fark}; })()`},
 // (3) oyuncu 3 km uzakta (açık deniz): liman karakterlerinin çağrısı, ayıklama kapalı/açık
 {js: `(()=>{ const p=DK.G.player; p.mode='swim'; p.ship=null; p.pos.set(-900, 0, 3000); p.vel.set(0,0,0); DK.sim(0.5);
   const o=_charCalls(); _cull(true); const s=_charCalls(); _cull(false);
   const cam=DK.engine.camera; const c0=cam.position.clone(), q0=cam.quaternion.clone();
   cam.position.set(p.pos.x, 4, p.pos.z); cam.lookAt(10, 10, 222); cam.updateMatrixWorld(true);
   const o2=_charCalls(); _cull(true); const s2=_charCalls(); _cull(false);
   cam.position.copy(c0); cam.quaternion.copy(q0); cam.updateMatrixWorld(true);
   return {limanaUzaklik: Math.round(Math.hypot(p.pos.x-10, p.pos.z-222)), varsayilanKamera:{once:o, sonra:s}, limanaBakan:{once:o2, sonra:s2}}; })()`},
 {expect: {js: `DK.G.state==='playing'`, truthy: true, label: 'Oyun açık'}},
]
