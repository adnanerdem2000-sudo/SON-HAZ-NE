[
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
{js: `(async()=>{ const out=[]; for (const [n,x,z] of [['gozcu_hill',-10,-20],['camp',-40,-226]]) { await _prep(x,z); let gx=x, gz=z; for (let r=0;r<20 && DK.terrain.heightAt(gx,gz)<0.6;r++){ gx+=(window._spawn[0]-x)*0.03; gz+=(window._spawn[1]-z)*0.03; } _g(gx, gz); DK.sim(0.5,1/60); out.push(await _sweep(n)); }
    const C=(await import('./js/world/worldData.js')).CAVE; await _prep(205,-35,120); _g(209,-31, C.floor); DK.sim(0.6,1/60); out.push(await _sweep('cave_mouth')); _g(189.8,-34.1, C.floor); DK.sim(0.6,1/60); out.push(await _sweep('cave_tunnel', [0.25, 0.45])); _g(164.2,-77.8, C.floor); DK.sim(0.6,1/60); out.push(await _sweep('cave_chamber', [0.45, 0.7]));
    window._res=out; return JSON.stringify(out); })()`},
{js: `window._res.map(r=>({name:r.name, median:r.median, min:r.min, nDark:r.nDark}))`},
]
