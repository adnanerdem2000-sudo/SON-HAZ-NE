// Kamera dönerken ekran kararması (kullanıcı bildirimi: "kamera açısı dönünce ekrana karartı geliyor sonra düzeliyor fakat bu
// ciddi bir sorun"). Parlaklık: tam kare ortalama luma (Rec.709, 0–255), "karanlık kare" = konumun medyanının %60'ının altı.
// K01 Kenney doğa/yapı modelleri tam metal yüklenmez (metalness 1 → ortam haritası olmadan gölge yüzü simsiyah).
// K02 yakın-kamera silinme kancaları: örnekli bitki örtüsü, gemi yelkeni/küpeştesi/direği, NPC/hayvan ('char'), oyuncu ('self').
// K03 silinme gölgelendiricisi gerçekten işler: kameranın 0,3 m önündeki siyah düzlem çizilmez, 4 m'deki çizilir, 1,1 m'de kısmen.
// K04 güvertede 4 noktada 2 eğim × 24 açıda baş→kamera doğrusu gemi gövdesini kesmez, kamera gövdenin içine girmez.
// K05 güvertede alttan bakışta (−0,25) 3 noktada parlaklık: karanlık kare yok.
// K06 iskelede gemi yanında 2 eğim × 24 açıda kamera gövdeye girmez/gövdenin arkasında kalmaz.
// K07 mağara tünelinde ve odasında 3 eğim × 24 açıda kamera tünel kesitinin dışına (kayanın içine) çıkmaz.
// K08 ormanda (2 eğim × 32 açı) ve palmiyelerin arasında (2 × 16) parlaklık: karanlık kare yok.
// K09 su altı geçişi histerezisli: kamera yüzeyin 6 cm altına inince su altı sisi açılmaz, 12 cm'yi geçince açılır, yüzeyin
//     2 cm altına çıkınca kapanmaz, üstüne çıkınca kapanır.
// K10 tek bir NaN/Inf piksel parlamanın (bloom) en küçük ara görüntüsünde tüm ekrana yayılıp kareyi tümden karartmaz.
// K11 sıfır uzunluklu normal NaN üretmez (siyah karenin kaynağı: düz gölgeli orman ağacında türevden hesaplanan normal).
// K12 kamerayla oyuncunun başı arasındaki bitki örtüsü görüş çizgisi çevresinde (0,95 m) seyrelir (kalın gövde oyuncuyu gizlemesin).
[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 4000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
 {js: `(async()=>{ DK.engine.fpsLimit=0.01; DK.sky.hour=11; DK.sky.locked=true; try { DK.sky.setWeather('acik', true); } catch(e){} DK.events.eventT=1e9; DK.G.godMode=true;
   const ST=DK.fish.sharkTarget; if (ST) { ST.alive=false; ST.respawn=1e9; }
   const V=DK.THREE.Vector3; window._V=V; const p=DK.G.player; window._spawn=[p.pos.x,p.pos.z];
   window._g=(x,z,y)=>{ const p=DK.G.player; if (p.mode==='swim') p.exitWater(); if (p.mode==='boat') DK.shipControl.exitBoat(p); p.mode='ground'; p.ship=null; p.carrying=null; p.action=null; p.busy=null; p.pos.set(x, y ?? DK.physics.groundAt(x,z), z); p.vel.set(0,0,0); p.onGround=true; };
   const gl=DK.engine.renderer.getContext(); let buf=null;
   // Parlaklık: sahne 160×90'lık yarım kayan noktalı hedefe çizilip okunur (basit ton eşleme + gama). Bu ortamda ekran arabelleğinden
   // her readPixels ~55 MB geçici bellek bırakıyor; çok karede tarayıcı bellek sınırına takılıyordu. Son işlemli ekran yalnız K10'da okunur.
   const THREE=DK.THREE; const rt=new THREE.WebGLRenderTarget(160,90,{type:THREE.HalfFloatType}); const px=new Uint16Array(160*90*4);
   const hf=(h)=>{ const e=(h>>10)&0x1f, f=h&0x3ff; if (e===0) return f/1024*6.103515625e-5; if (e===31) return f?NaN:Infinity; return Math.pow(2,e-15)*(1+f/1024); };
   window._lum=()=>{ const R=DK.engine.renderer; R.setRenderTarget(rt); R.clear(); R.render(DK.engine.scene, DK.engine.camera); R.readRenderTargetPixels(rt,0,0,160,90,px); R.setRenderTarget(null); let s=0, n=0; for (let i=0;i<px.length;i+=4){ let l=0.2126*hf(px[i])+0.7152*hf(px[i+1])+0.0722*hf(px[i+2]); l=Math.pow(l/(1+l),1/2.2)*255; s+=l; n++; } return +(s/n).toFixed(1); };
   window._lumPost=()=>{ DK.post.render(); const W=gl.drawingBufferWidth, H=gl.drawingBufferHeight; if (!buf || buf.length!==W*H*4) buf=new Uint8Array(W*H*4); gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,buf); let s=0, n=0; for (let y=0;y<H;y+=2) for (let x=0;x<W;x+=2){ const i=(y*W+x)*4; s+=0.2126*buf[i]+0.7152*buf[i+1]+0.0722*buf[i+2]; n++; } return +(s/n).toFixed(1); };
   // ekranın ortasındaki karenin siyah piksel oranı (K03)
   window._black=(fr=1/3)=>{ DK.post.render(); const W=gl.drawingBufferWidth, H=gl.drawingBufferHeight, w=Math.floor(W*fr), h=Math.floor(H*fr); const b=new Uint8Array(w*h*4); gl.readPixels(Math.floor((W-w)/2),Math.floor((H-h)/2),w,h,gl.RGBA,gl.UNSIGNED_BYTE,b); let k=0; for (let i=0;i<b.length;i+=4) if (b[i]+b[i+1]+b[i+2] < 24) k++; return +(k/(w*h)).toFixed(3); };
   const SM=await import('./js/ship/shipModel.js');
   // gövde katısı — testin kendi tanımı (oyun kodundan bağımsız): gövde dış hattının içi, küpeşte üstüne (güverte + 0,75 m) kadar;
   // güverte üstünde küpeşte iç yüzünün (yarı genişlik − 0,12 m) içi açık alan
   window._hull=(T,x,y,z)=>{ const L=T.L, t=(z+L/2)/L; if (t<=0||t>=1) return false; const hw=SM.hullHalfWidth(T,z); if (hw<0.05) return false; const dy=SM.deckHeight(T,z), top=dy+0.75; if (y>top) return false; const keel=T.keel*(0.35+0.65*Math.sin(Math.PI*Math.min(1,t*1.1+0.05))); if (y<keel) return false; const c=Math.min(1,Math.max(0,(1-(y-keel)/(top-keel))/0.98)); const w=hw*Math.pow(Math.sqrt(1-c*c),0.55); const ax=Math.abs(x); if (ax>w) return false; return y<=dy || ax>hw-0.12; };
   // ihlal: kamera gövdenin içinde ya da baş→kamera doğrusu gövdeyi kesiyor (baş gövdenin içindeyse sayılmaz)
   window._hullViol=(s)=>{ const cam=DK.engine.camera.position, h=DK.G.player.headPos(new V()); const inv=s.root.matrixWorld.clone().invert(); const a=h.clone().applyMatrix4(inv), b=cam.clone().applyMatrix4(inv); if (window._hull(s.T,a.x,a.y,a.z)) return 0; const n=Math.ceil(a.distanceTo(b)/0.08); for (let k=1;k<=n;k++){ const q=a.clone().lerp(b,k/n); if (window._hull(s.T,q.x,q.y,q.z)) return 1; } return 0; };
   // oyuncunun kamerayı döndürmesi: her karede 15° (24 adım/tur), eğim sabit
   window._turn=(pitches, steps, fn)=>{ const T=DK.tpCamera; T.targetDist=4.6; const out=[]; for (const pitch of pitches) { const y0=T.yaw; T.pitch=pitch; DK.sim(0.4,1/30); for (let k=0;k<steps;k++){ T.yaw=y0+k*2*Math.PI/steps; T.pitch=pitch; DK.sim(1/30,1/30); out.push(fn(pitch,k)); } } return out; };
   // aynısı, çizim yapan ölçümler için: her 4 karede bir kısa bekleme (tarayıcının geçici belleği toplamasına fırsat)
   window._turnA=async(pitches, steps, fn)=>{ const T=DK.tpCamera; T.targetDist=4.6; const out=[]; for (const pitch of pitches) { const y0=T.yaw; T.pitch=pitch; DK.sim(0.4,1/30); for (let k=0;k<steps;k++){ T.yaw=y0+k*2*Math.PI/steps; T.pitch=pitch; DK.sim(1/30,1/30); out.push(fn(pitch,k)); if (k%4===3) await new Promise(r=>setTimeout(r,40)); } } return out; };
   window._dark=(ls)=>{ const s=[...ls].sort((a,b)=>a-b); const med=s[Math.floor(s.length/2)]; return {median:med, min:s[0], nDark:ls.filter(l=>l<0.6*med).length}; };
   return 'ok'; })()`},
 // K01 Kenney modelleri mat
 {expect: {js: `(()=>{ const names=['tree_palm','tree_oak','tree_fat','tree_pine','bush','bush_large','rock_large','rock_tall','rock_small','stump','log','column','obelisk','tent','fence','cactus','campfire','crystal_rock']; const bad=[]; for (const n of names) DK.assets.models[n]?.scene.traverse(o=>{ if (o.isMesh) for (const m of [].concat(o.material)) if (m.metalness > 0.1) bad.push(n+':'+m.name+'='+m.metalness); }); window._K01={n:names.length, bad}; return bad.length===0; })()`, truthy: true, label: 'K01 Kenney ağaç/çalı/kaya/yapı modellerinde tam metal malzeme yok (18 model; önce hepsi metalness 1)'}},
 {js: `window._K01`},
 // K02 kancalar
 {expect: {js: `(async()=>{ const NF=await import('./js/core/nearfade.js'); const cat=(root)=>{ const s=new Set(); root.traverse(o=>{ if (o.isMesh) for (const m of [].concat(o.material)) { const c=NF.nearFadeCategory(m); if (c) s.add(c); } }); return [...s]; };
   const veg=new Set(); let vegN=0; DK.engine.scene.traverse(o=>{ if (o.isInstancedMesh) { const c=NF.nearFadeCategory(o.material); if (c==='veg') { vegN++; veg.add(o.material.uuid); } } });
   const ship=cat(DK.G.ship.root), self=cat(DK.G.player.char.root);
   const npc=(DK.npcs.list||[]).find(n=>n.anim?.root || n.char?.root); const npcCat=npc ? cat((npc.anim||npc.char).root) : [];
   const an=(DK.animals.list||[]).find(a=>a.root); const anCat=an ? cat(an.root) : [];
   window._K02={vegMeshes:vegN, ship, self, npc:npcCat, animal:anCat};
   return vegN>=4 && ship.includes('sail') && ship.includes('rail') && self.includes('self') && (!npc || npcCat.includes('char')) && (!an || anCat.includes('char')); })()`, truthy: true, label: 'K02 Yakın-kamera silinmesi: bitki örtüsü (≥ 4 örnekli çizim), yelken+küpeşte/direk, oyuncu (self), NPC ve hayvan (char)'}},
 {js: `window._K02`},
 // K03 gölgelendirici: düzlem kameranın önünde 0,3 / 1,1 / 4 m
 {expect: {js: `(async()=>{ const NF=await import('./js/core/nearfade.js'); const THREE=DK.THREE; const cam=DK.engine.camera; const p=DK.G.player;
   _g(window._spawn[0], window._spawn[1]); DK.sim(0.3,1/30); const T=DK.tpCamera; T.pitch=0.1; DK.sim(0.3,1/30);
   // son işleme (FXAA) tek tük titreşim piksellerini komşularıyla karıştırır: ölçüm doğrudan çizimle. Görüş çizgisi silindiri
   // (K12) bu ölçümde kapalı: yalnız yakın-kamera aralığı sınanır
   const pe=DK.post.enabled; DK.post.enabled=false; const fw=NF.NF_FOCUS.value.w; NF.NF_FOCUS.value.w=0; const base=_black();
   const m=new THREE.Mesh(new THREE.PlaneGeometry(40,40), NF.nearFade(new THREE.MeshBasicMaterial({color:0x000000, side:THREE.DoubleSide}), 'veg')); DK.engine.scene.add(m);
   const fwd=new THREE.Vector3(); const at=(d)=>{ cam.getWorldDirection(fwd); m.position.copy(cam.position).addScaledVector(fwd,d); m.quaternion.copy(cam.quaternion); m.updateMatrixWorld(true); return _black(); };
   const r={base, near:at(0.3), mid:at(1.1), far:at(4)}; DK.engine.scene.remove(m); m.geometry.dispose(); m.material.dispose(); DK.post.enabled=pe; NF.NF_FOCUS.value.w=fw;
   window._K03=r; return Math.abs(r.near-r.base) < 0.02 && r.far > 0.97 && r.mid > r.base+0.15 && r.mid < 0.85; })()`, truthy: true, label: 'K03 Silinme gölgelendiricisi: 0,3 m uzaktaki siyah düzlem çizilmez (görüntü düzlemsizle aynı), 4 m uzaktaki çizilir (> %97 siyah), 1,1 m uzaktaki kısmen'}},
 {js: `window._K03`},
 // K04 güverte: görüş hattı gövdeyi kesmez
 {expect: {js: `(()=>{ const s=DK.G.ship, p=DK.G.player; const out=[];
   const spots=[['ambar', s.model.stations.hold.clone()], ['baş', new _V(0,0,s.T.L*0.33)], ['kıç direk', new _V(1.0,0,-2.5)], ['yelken açık', new _V(-1.0,0,-2.5), true]];
   for (const [name, lp, sail] of spots) { if (sail) { s.sail=s.sailTarget=1; } p.boardShip(s, lp); DK.sim(sail?1.5:0.3,1/30); const v=_turn([0.25,-0.25], 24, ()=>_hullViol(s)); out.push({name, n:v.length, viol:v.reduce((a,b)=>a+b,0)}); if (sail) { s.sail=s.sailTarget=0; DK.sim(0.5,1/30); } }
   window._K04=out; return out.every(o=>o.viol===0); })()`, truthy: true, label: 'K04 Güvertede 4 noktada 2 eğim × 24 açıda baş→kamera doğrusu gemi gövdesini kesmez, kamera gövdeye girmez'}},
 {js: `window._K04`},
 // K05 güverte parlaklığı (alttan bakış)
 {expect: {js: `(async()=>{ const s=DK.G.ship, p=DK.G.player; const out=[];
   for (const [name, lp] of [['ambar', s.model.stations.hold.clone()], ['kıç direk', new _V(1.0,0,-2.5)], ['baş', new _V(0,0,s.T.L*0.33)]]) { p.boardShip(s, lp); DK.sim(0.3,1/30); const ls=await _turnA([-0.25], 16, ()=>_lum()); out.push({name, ..._dark(ls)}); }
   window._K05=out; return out.every(o=>o.nDark===0); })()`, truthy: true, label: 'K05 Güvertede alttan bakışta (−0,25) 3 noktada 16 açıda karanlık kare yok (önce kıç direkte en düşük 17, medyan 98)'}},
 {js: `window._K05`},
 // K06 iskelede gemi yanında
 {expect: {js: `(()=>{ const s=DK.G.ship; const P=DK.port; const bp=P.boardingPoint; _g(bp.x, bp.z, P.pierTop); DK.sim(0.3,1/30); const v=_turn([0.25,-0.25], 24, ()=>_hullViol(s)); window._K06={n:v.length, viol:v.reduce((a,b)=>a+b,0)}; return window._K06.viol===0; })()`, truthy: true, label: 'K06 İskelede gemi yanında 2 eğim × 24 açıda kamera gövdeye girmez, gövde görüşü kesmez'}},
 {js: `window._K06`},
 // K07 mağara
 {expect: {js: `(async()=>{ const C=(await import('./js/world/worldData.js')).CAVE; const THREE=DK.THREE; await DK.terrain.prepare(190, -45, {radius: 120});
   const curve=new THREE.CatmullRomCurve3(C.path.map(([x,z])=>new THREE.Vector3(x,C.floor,z))); const S=[]; for (let i=0;i<=200;i++){ const t=i/200, q=curve.getPointAt(t), m=Math.max(0,1-t*6); S.push({x:q.x, z:q.z, w:C.width*(1+m*0.5), h:C.height*(1+m*0.35)}); }
   // kesit testi (testin kendi tanımı): tünel yarım elipsi, gürültü payı 0,3 m; oda kubbesi; ağzın önü serbest
   const inside=(x,y,z)=>{ const ch=C.chamber, R=(ch.r+1)*0.88-0.1; const dc=Math.hypot(x-ch.x,z-ch.z); if (dc<R) { const a=dc/R, b=(y-(C.floor-0.4))/((ch.r+1)*0.62*0.88-0.1); if (a*a+b*b<=1) return true; } let best=1e9, bi=0, bu=0; for (let i=0;i<S.length-1;i++){ const A=S[i], B=S[i+1], ex=B.x-A.x, ez=B.z-A.z, L2=ex*ex+ez*ez; const u=Math.max(0,Math.min(1,((x-A.x)*ex+(z-A.z)*ez)/L2)); const d2=(A.x+ex*u-x)**2+(A.z+ez*u-z)**2; if (d2<best){best=d2; bi=i; bu=u;} } if (bi===0 && bu===0) return true; const A=S[bi], B=S[bi+1]; const w=A.w+(B.w-A.w)*bu-0.3, h=A.h+(B.h-A.h)*bu-0.3; const yy=y-(C.floor-0.4); if (yy<=0) return true; return (Math.sqrt(best)/w)**2+(yy/h)**2<=1; };
   const q=curve.getPointAt(0.55), tg=curve.getTangentAt(0.55), sl=Math.hypot(tg.x,tg.z); const wall=[q.x-tg.z/sl*2.5, q.z+tg.x/sl*2.5];
   const out=[]; for (const [name,x,z] of [['tünel',189.8,-34.1],['tünel 2',172,-46],['duvar dibi (2,5 m yanda)',wall[0],wall[1]],['oda',164.2,-77.8]]) { _g(x,z,C.floor); DK.sim(0.6,1/30); const ds=[]; const v=_turn([0.25,0.6,1.0], 24, ()=>{ const c=DK.engine.camera.position; ds.push(c.distanceTo(DK.G.player.headPos(new _V()))); return inside(c.x,c.y,c.z)?0:1; }); ds.sort((a,b)=>a-b); out.push({name, inCave:+DK.G.player.inCave.toFixed(2), n:v.length, out:v.reduce((a,b)=>a+b,0), camMed:+ds[Math.floor(ds.length/2)].toFixed(2)}); }
   window._K07=out; return out.every(o=>o.out===0 && o.camMed >= 0.9); })()`, truthy: true, label: 'K07 Mağara tünelinde (2 nokta + duvar dibi) ve odasında 3 eğim × 24 açıda kamera tünel kesitinin dışına çıkmaz, başa yapışmaz (medyan ≥ 0,9 m; duvara doğru açılarda duvar çarpıştırıcısı kamerayı zaten yaklaştırır)'}},
 {js: `window._K07`},
 // K08 orman ve palmiye parlaklığı
 {expect: {js: `(async()=>{ const {props}=await import('./js/world/props.js'); const best=(arr, r, filt)=>{ let b=null, bn=-1; const pts=arr.filter(filt||(()=>true)); for (const a of pts.slice(0,600)) { let n=0; for (const q of arr) if (Math.hypot(q.x-a.x,q.z-a.z)<r) n++; if (n>bn) { bn=n; b=a; } } return b; };
   const out=[]; const tr=best(props.trees||[], 8), pa=best(props.palms||[], 10, (q)=>q.y<3);
   for (const [name, q, dx, dz, n] of [['orman', tr, 1.2, 1.2, 32], ['palmiyeler', pa, 1.5, 0, 16]]) { if (!q) continue; await DK.terrain.prepare(q.x, q.z, {radius: 80}); _g(q.x+dx, q.z+dz); DK.sim(0.3,1/30); const ls=await _turnA([0.25,-0.25], n, ()=>_lum()); out.push({name, ..._dark(ls)}); }
   window._K08=out; return out.length===2 && out.every(o=>o.nDark===0); })()`, truthy: true, label: 'K08 Ormanda (2 eğim × 32 açı) ve palmiyelerin arasında (2 × 16) karanlık kare yok'}},
 {js: `window._K08`},
 // K09 su altı histerezisi
 {expect: {js: `(()=>{ const cam=DK.engine.camera, p=DK.G.player; _g(window._spawn[0], window._spawn[1]); DK.sim(0.2,1/30); const x=300, z=300; const wh=()=>DK.ocean.heightAt(x,z); const step=(dy)=>{ cam.position.set(x, wh()+dy, z); DK.game._env(1/60, p.pos); return DK.sky.underwater; };
   const r=[step(0.5), step(-0.06), step(-0.2), step(-0.02), step(0.05)]; window._K09=r; return r.join()===[false,false,true,true,false].join(); })()`, truthy: true, label: 'K09 Su altı geçişi histerezisli (−6 cm: açılmaz, −20 cm: açılır, −2 cm: kapanmaz, +5 cm: kapanır)'}},
 {js: `window._K09`},
 // K10 parlama yayılması: kameranın 1 m önündeki 5 cm'lik bir yüzey NaN / Inf yazınca kare kararmaz
 {expect: {js: `(()=>{ const THREE=DK.THREE, cam=DK.engine.camera; _g(window._spawn[0], window._spawn[1]); DK.sim(0.3,1/30); const base=_lumPost(); const out={base, post:DK.post.enabled};
   for (const [k,code] of [['nan','vec4(uZero/uZero)'],['inf','vec4(1.0/uZero)']]) { const m=new THREE.Mesh(new THREE.PlaneGeometry(0.05,0.05), new THREE.ShaderMaterial({ uniforms:{uZero:{value:0}}, vertexShader:'void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }', fragmentShader:'uniform float uZero; void main(){ gl_FragColor = '+code+'; }' }));
     const f=new THREE.Vector3(); cam.getWorldDirection(f); m.position.copy(cam.position).addScaledVector(f,1.0); m.quaternion.copy(cam.quaternion); DK.engine.scene.add(m); m.updateMatrixWorld(true); out[k]=_lumPost(); DK.engine.scene.remove(m); m.geometry.dispose(); m.material.dispose(); }
   window._K10=out; return out.post && out.nan > out.base*0.8 && out.inf > out.base*0.8; })()`, truthy: true, label: 'K10 Tek bir NaN/Inf yazan yüzey parlamayla tüm ekrana yayılıp kareyi karartmaz (parlaklık temel değerin ≥ %80\'i)'}},
 {js: `window._K10`},
 // K11 sıfır normalli yüzey NaN üretmez (normal_fragment_begin koruması; düz gölgeli orman ağacında ölçülen siyah karenin kaynağı)
 {expect: {js: `(()=>{ const THREE=DK.THREE, R=DK.engine.renderer, S=DK.engine.scene, cam=DK.engine.camera; const out={};
   for (const flat of [false, true]) { const g=new THREE.PlaneGeometry(0.6,0.6); g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3), 3));
     const m=new THREE.Mesh(g, new THREE.MeshStandardMaterial({color:0x808080, flatShading:flat})); const f=new THREE.Vector3(); cam.getWorldDirection(f); m.position.copy(cam.position).addScaledVector(f,1.5); m.quaternion.copy(cam.quaternion); S.add(m); m.updateMatrixWorld(true);
     const W=96, H=54; const rt=new THREE.WebGLRenderTarget(W,H,{type:THREE.HalfFloatType}); R.setRenderTarget(rt); R.clear(); R.render(S,cam); const px=new Uint16Array(W*H*4); R.readRenderTargetPixels(rt,0,0,W,H,px); R.setRenderTarget(null);
     let bad=0; for (let i=0;i<px.length;i++) if (((px[i]>>10)&0x1f)===31) bad++;
     S.remove(m); g.dispose(); m.material.dispose(); rt.dispose(); out[flat?'flat':'smooth']=bad; }
   window._K11=out; return out.smooth===0 && out.flat===0; })()`, truthy: true, label: 'K11 Sıfır normalli yüzey (yumuşak ve düz gölgeli) yarım kayan noktalı hedefte NaN/Inf piksel üretmez'}},
 {js: `window._K11`},
 // K12 görüş çizgisi silindiri: kameradan 2,6 m uzakta (yakın-kamera aralığının ötesinde) çizgiyi kesen siyah bitki düzlemi seyrelir
 {expect: {js: `(async()=>{ const NF=await import('./js/core/nearfade.js'); const THREE=DK.THREE, cam=DK.engine.camera; _g(window._spawn[0], window._spawn[1]); const T=DK.tpCamera; T.targetDist=4.6; T.pitch=0.15; DK.sim(0.6,1/30);
   // ölçüm ekranın ortadaki 1/8'i (2,6 m'de ±0,23 m: silindirin tümden silinen iç kısmı) ve 1/3'ü (dış halka kısmen seyrelir)
   const pe=DK.post.enabled; DK.post.enabled=false; const base=_black(1/8); const m=new THREE.Mesh(new THREE.PlaneGeometry(40,40), NF.nearFade(new THREE.MeshBasicMaterial({color:0x000000, side:THREE.DoubleSide}), 'veg')); DK.engine.scene.add(m);
   const f=new THREE.Vector3(); cam.getWorldDirection(f); m.position.copy(cam.position).addScaledVector(f,2.6); m.quaternion.copy(cam.quaternion); m.updateMatrixWorld(true);
   const on=_black(1/8), on3=_black(1/3); const w=NF.NF_FOCUS.value.w; NF.NF_FOCUS.value.w=0; const off=_black(1/8); NF.NF_FOCUS.value.w=w;
   DK.engine.scene.remove(m); m.geometry.dispose(); m.material.dispose(); DK.post.enabled=pe; window._K12={base, on, on3, off, w}; return w>0 && on < base+0.05 && on3 < 0.7 && off > 0.97; })()`, truthy: true, label: 'K12 Kamerayla oyuncu arasındaki bitki örtüsü görüş çizgisi çevresinde seyrelir (2,6 m uzaktaki siyah düzlem: ekran ortası silindir açıkken görünür, kapalıyken > %97 siyah)'}},
 {js: `window._K12`},
]
