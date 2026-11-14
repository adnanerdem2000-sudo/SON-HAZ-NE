[
{meta: {olcum: true, aciklama: 'Kamera parlaklık taraması (ölçüm betiği): asıl ölçüt analiz.cjs; tek onay (Oyun başladı) yalnız açılışı doğrular (Faz 9 tasarımı §1.8, K-13)'}},
{js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
{wait: 4000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
{js: `(()=>{ DK.engine.fpsLimit = 0.01; DK.sky.hour = 11; DK.sky.locked = true; try { DK.sky.setWeather('acik', true); } catch(e){} DK.events.eventT=1e9; DK.G.godMode = true; const ST=DK.fish.sharkTarget; ST.alive=false; ST.respawn=1e9; DK.ui.closeAll && DK.ui.closeAll();
   const p=DK.G.player; window._spawn=[p.pos.x,p.pos.z]; window._V=DK.THREE.Vector3;
   window._g=(x,z,y)=>{ const p=DK.G.player; if (p.mode==='swim') p.exitWater(); if (p.mode==='boat') DK.shipControl.exitBoat(p); p.mode='ground'; p.ship=null; p.carrying=null; p.action=null; p.busy=null; p.pos.set(x, y ?? DK.physics.groundAt(x,z), z); p.vel.set(0,0,0); p.onGround=true; };
   const gl=DK.engine.renderer.getContext(); let buf=null;
   window._lum=()=>{ DK.post.render(); const W=gl.drawingBufferWidth, H=gl.drawingBufferHeight; if (!buf || buf.length!==W*H*4) buf=new Uint8Array(W*H*4); gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,buf); let s=0, d=0, n=0; for (let y=0;y<H;y+=2) for (let x=0;x<W;x+=2){ const i=(y*W+x)*4; const l=0.2126*buf[i]+0.7152*buf[i+1]+0.0722*buf[i+2]; s+=l; if (l<28) d++; n++; } return {l:+(s/n).toFixed(1), d:+(d/n).toFixed(2)}; };
   window._diag=()=>{ const p=DK.G.player, cam=DK.engine.camera.position, T=DK.tpCamera; const h=p.headPos(new _V()); return [+cam.distanceTo(h).toFixed(2), Number.isFinite(T._col)?+T._col.toFixed(2):-1, +(cam.y-DK.terrain.heightAt(cam.x,cam.z)).toFixed(2), +(cam.y-DK.ocean.heightAt(cam.x,cam.z)).toFixed(2), DK.sky.underwater?1:0, p.char._camHidden?1:0]; };
   window._sweep=async(name, pitches=[0.25,-0.25], steps=48)=>{ const T=DK.tpCamera; const res={name, f:[], shots:[]}; T.targetDist=4.6; T.dist=4.6;
     for (let pi=0; pi<pitches.length; pi++) { const pitch=pitches[pi]; T.pitch=pitch; const y0=T.yaw; DK.sim(0.4,1/60);
       for (let k=0;k<steps;k++){ T.yaw=y0+k*2*Math.PI/steps; T.pitch=pitch; DK.sim(1/60,1/60); const m=_lum(); res.f.push([pi,k,m.l,m.d,..._diag()]);
         if (res.shots.length<2 || m.l<Math.max(...res.shots.map(s=>s.l))) { const url=DK.engine.renderer.domElement.toDataURL('image/jpeg',0.6); res.shots.push({l:m.l, pi, k, pitch, url}); res.shots.sort((a,b)=>a.l-b.l); res.shots=res.shots.slice(0,2); }
         if (k%16===15) await new Promise(r=>setTimeout(r,0)); } }
     const ls=res.f.map(f=>f[2]).sort((a,b)=>a-b); res.median=ls[Math.floor(ls.length/2)]; res.min=ls[0]; res.nDark=res.f.filter(f=>f[2]<0.6*res.median || f[3]>0.5).length; return res; };
   window._prep=async(x,z,r=160)=>{ await DK.terrain.prepare(x, z, {radius: r}); };
   return 'ok'; })()`},
{js: `(async()=>{ const out=[]; const A=DK.archipelago; for (const id of ['zumrut_koy','kurt_adasi']) { const I=A.EXTRA_ISLANDS.find(i=>i.id===id); if (!I) continue; await DK.terrain.prepare(I.x, I.z, {radius: Math.min(900, I.r*1.3)}); if (!DK.islands.built.has(I.id)) DK.islands._build(I); const B=DK.islands.built.get(I.id);
      const trees=[]; for (const b of (B.batch?.map?.values?.() || [])) if (/tree/i.test(b.id)) for (const t of b.list) trees.push([t.x,t.z]);
      let best=null, bn=-1; for (const t of trees.slice(0,300)) { let n=0; for (const q of trees) if (Math.hypot(q[0]-t[0],q[1]-t[1])<10) n++; if (n>bn) { bn=n; best=t; } }
      if (best) { _g(best[0]+1.0, best[1]+1.0); DK.sim(0.6,1/60); out.push(await _sweep(id+'_trees')); }
      const port=I.features.find(f=>f.type==='port'); if (port) { let bx=port.x, bz=port.z, k=0; while (DK.terrain.heightAt(bx,bz)<0.8 && k<40) { bx+=(I.x-bx)*0.1; bz+=(I.z-bz)*0.1; k++; } _g(bx,bz); DK.sim(0.6,1/60); out.push(await _sweep(id+'_port')); }
      DK.islands._drop(I.id); }
    window._res=out; return JSON.stringify(out); })()`},
{js: `window._res.map(r=>({name:r.name, median:r.median, min:r.min, nDark:r.nDark}))`},
]
