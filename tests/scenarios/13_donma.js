// Donma (takılma) denetimi: ada içeriği karelere bölünerek kurulur (tek karede 40–140 ms yerine kare başına ~3 ms iş).
// P01 gerçek güncelleme yolu: gemi 12 m/sn ile Tuz Pazarı'na yaklaşır; ada birden çok karede kurulur, karedeki ada işi ≤ 20 ms.
// P02 eşdeğerlik: aynı arazi durumunda karelere bölünmüş kurulum ile eşzamanlı kurulum aynı adayı üretir (örnek matrisleri,
//     çarpıştırıcılar, NPC konumları, etkileşimler). P03–P05 iptal yolları: uzaklaşma, _drop, yeni oturum (start) yarım kalan işi
//     temizler; P06 aynı ada için bekleyen iş varken eşzamanlı _build işi tamamlar (çift kurulum yok). P07 balık sürüleri hareketli.
// P08 tapınak bulmaca durumu yeniden kurulum / kayıt yükleme / eski kayıt biçiminde korunur (bağımsız inceleme bulgusu).
[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 4000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
 {js: `(()=>{ DK.engine.fpsLimit = 0.01;
   const hs=(s)=>{ let h=2166136261; for (let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return (h>>>0).toString(16); };
   window._fp=(id)=>{ const B=DK.islands.built.get(id); if(!B) return null; const T=DK.THREE, m=new T.Matrix4(); const ims=[]; B.group.traverse(o=>{ if(o.isInstancedMesh){ let s=0; for(let i=0;i<o.count;i++){ o.getMatrixAt(i,m); const e=m.elements; s+=e[12]*1.3+e[13]*0.7+e[14]*1.1+e[0]+e[5]*2+e[10]*3+e[1]*5; } ims.push(o.count+':'+s.toFixed(2)); } }); const tag='isl:'+id; const cols=DK.physics.all.filter(c=>c.tag===tag); let cs=0; for(const c of cols) cs+=c.x*1.1+c.z*0.9+(c.r||0)*3+(c.hw||0)*5+(c.hd||0)*7+c.y0*0.3+c.y1*0.2; const np=DK.npcs.list.filter(n=>B.npcs.includes(n.spot.id)).map(n=>n.spot.id+'@'+n.root.position.x.toFixed(2)+','+n.root.position.y.toFixed(2)+','+n.root.position.z.toFixed(2)).sort(); return {ims:hs(ims.join('|')), n:ims.length, cols:cols.length, cs:cs.toFixed(2), npcs:np.join(';'), inter:B.inter.map(i=>i.id).join(','), lamps:B.lamps.length, obst:B.obstacles.length}; };
   window._step=(isl,J,n)=>{ for (let k=0;k<n;k++){ if (isl.job!==J) throw new Error('iş beklenenden erken bitti (adım '+k+')'); isl._runJob(J, 0); } };
   window._stepUntil=(isl,J,pred,max=20000)=>{ let k=0; while(!pred(J)){ if (isl.job!==J) throw new Error('iş beklenenden erken bitti (adım '+k+')'); isl._runJob(J, 0); if (++k>max) throw new Error('koşul '+max+' adımda gelmedi'); } return k; };
   window._left=(id)=>({ cols:DK.physics.all.filter(c=>c.tag==='isl:'+id).length, npcs:DK.npcs.list.filter(n=>String(n.spot.id).startsWith(id+'_')).length, built:DK.islands.built.has(id), job:DK.islands.job?.I.id||null, sahnede:!!DK.engine.scene.getObjectByName('island:'+id) });
   return 'ok'; })()`},
 // P01: gerçek güncelleme yolu
 {expect: {js: `(async()=>{ const p=DK.G.player, s=DK.G.ship; p.boardShip(s, s.model.stations.helm.clone()); DK.shipControl.takeHelm(p, s); if (s.anchorState!=='up') s.toggleAnchor(); s.sailTarget=0;
   const T=DK.archipelago.EXTRA_ISLANDS.find(i=>i.id==='tuz_pazari'); 
   // gemi adanın kıyısından 820 m uzağa (kurulum eşiği 750 m) konur; arazi hazırlanır
   { const L=Math.hypot(s.x-T.x, s.z-T.z)||1, ux=(s.x-T.x)/L, uz=(s.z-T.z)/L; s.x=T.x+ux*(T.r+820); s.z=T.z+uz*(T.r+820); await DK.terrain.prepare(s.x, s.z, {radius: 400}); DK.sim(0.5, 1/60); }
   if (DK.islands.built.has('tuz_pazari')) DK.islands._drop('tuz_pazari');
   const iu=DK.islands.update; const per=[]; DK.islands.update=function(dt){ const t=performance.now(); try { return iu.call(this,dt); } finally { per.push(performance.now()-t); } };
   let kare=-1; const dt=1/60, v=12;
   try { for (let i=0;i<60*40 && !DK.islands.built.has('tuz_pazari');i++){ const dx=T.x-s.x, dz=T.z-s.z, d=Math.hypot(dx,dz); if (d-T.r>420){ s.x+=dx/d*v*dt; s.z+=dz/d*v*dt; } s.yaw=Math.atan2(dx,dz); s.yawRate=0; DK.game.update(dt); DK.hud.update(dt); DK.input.endFrame(); kare=i; if (i%3===2) await new Promise(r=>setTimeout(r,0)); } } finally { DK.islands.update=iu; }
   const B=DK.islands.built.get('tuz_pazari'); const sorted=[...per].sort((a,b)=>a-b);
   window._P01={kurulduMu:!!B, kare, kareSayisi:B?.frames, enUzunAdaKaresiMs:+Math.max(...per).toFixed(1), isMs:B?+B.ms.toFixed(1):null, p99:+sorted[Math.floor(sorted.length*0.99)].toFixed(2), npc:B?.npcs.length};
   return !!B && B.frames > 1 && Math.max(...per) <= 35; })()`, truthy: true, label: 'P01 Gemiyle yaklaşınca ada birden çok karede kurulur; karedeki ada işi ≤ 35 ms (önce tek karede 55–58 ms; ölçülen tipik 6–11 ms, pay: bu ortamdaki GC/işlemci beklemesi)'}},
 {js: `window._P01`},
 // P02: eşdeğerlik (aynı arazi durumu; karelere bölünmüş iş elle 3 ms bütçeyle ilerletilir)
 {expect: {js: `(async()=>{ const isl=DK.islands; const out=[]; for (const id of ['tuz_pazari','gizli_pazar','kadim_tapinak','demirkapi','ates_dagi']){ const I=DK.archipelago.EXTRA_ISLANDS.find(i=>i.id===id); await DK.terrain.prepare(I.x, I.z, {radius: Math.min(900, I.r*1.4+80)}); if (isl.built.has(id)) isl._drop(id);
   isl._build(I); const a=window._fp(id); isl._drop(id);
   const J=isl._newJob(I); let k=0; while(!isl._runJob(J,3) && k<100000) k++; const b=window._fp(id); isl._drop(id);
   out.push({id, ayni: JSON.stringify(a)===JSON.stringify(b), kare:J.frames, enUzunMs:+J.maxFrame.toFixed(1), npc:a.npcs.split(';').filter(Boolean).length}); }
   window._P02=out; return out.every(o=>o.ayni && o.kare>=1); })()`, truthy: true, label: 'P02 Karelere bölünmüş kurulum eşzamanlı kurulumla birebir aynı adayı üretir (5 ada: liman, pazar, tapınak, hapishane, volkan)'}},
 {js: `window._P02`},
 // P03: uzaklaşınca yarım kalan iş iptal edilir ve tüm kaynaklar bırakılır
 {expect: {js: `(async()=>{ const isl=DK.islands, p=DK.G.player, s=DK.G.ship; const I=DK.archipelago.EXTRA_ISLANDS.find(i=>i.id==='tuz_pazari'); if (isl.built.has(I.id)) isl._drop(I.id);
   const J=isl._newJob(I); isl.job=J; const adim=window._stepUntil(isl, J, (j)=>j.phase==='batch'); window._step(isl, J, 5); const yarim={...window._left(I.id), adim, evre:J.phase};
   const far={x:I.x+I.r+1400, z:I.z}; s.x=far.x; s.z=far.z; s.updateTransform?.(0); p.pos.set(far.x, 2, far.z); isl.checkT=0; DK.sim(0.2, 1/30);
   const sonra=window._left(I.id); window._P03={yarim, sonra}; return yarim.job===I.id && yarim.npcs===5 && yarim.cols>0 && !yarim.built && sonra.job===null && sonra.cols===0 && sonra.npcs===0 && !sonra.built && !sonra.sahnede; })()`, truthy: true, label: 'P03 Ada kurulurken uzaklaşılırsa yarım iş iptal edilir; çarpıştırıcı/NPC/sahne nesnesi kalmaz'}},
 {js: `window._P03`},
 // P04: _drop ve yeni oturum (start) bekleyen işi temizler
 {expect: {js: `(()=>{ const isl=DK.islands; const I=DK.archipelago.EXTRA_ISLANDS.find(i=>i.id==='gizli_pazar'); const out={};
   let J=isl._newJob(I); isl.job=J; window._stepUntil(isl, J, (j)=>j.phase==='batch'); window._step(isl, J, 2); out.once=window._left(I.id); isl._drop(I.id); out.drop=window._left(I.id);
   J=isl._newJob(I); isl.job=J; window._step(isl, J, 6); out.once2=window._left(I.id); isl.start({islands: isl.save()}); out.start=window._left(I.id);
   window._P04=out; const temiz=(x)=>x.job===null && x.cols===0 && x.npcs===0 && !x.built && !x.sahnede; return out.once.job===I.id && !out.once.built && out.once.cols>0 && out.once.npcs===2 && out.once2.job===I.id && out.once2.cols>0 && temiz(out.drop) && temiz(out.start); })()`, truthy: true, label: 'P04 _drop ve yeni oturum başlangıcı yarım kalan ada işini kaynaklarıyla temizler'}},
 {js: `window._P04`},
 // P05/P06: aynı ada için iş beklerken eşzamanlı kurulum işi tamamlar, ada bir kez kurulur
 {expect: {js: `(()=>{ const isl=DK.islands; const I=DK.archipelago.EXTRA_ISLANDS.find(i=>i.id==='tuz_pazari'); if (isl.built.has(I.id)) isl._drop(I.id);
   const J=isl._newJob(I); isl.job=J; window._step(isl, J, 30); const bekleyen=isl.job===J && !isl.built.has(I.id); isl._build(I); const a=window._left(I.id); const ids=DK.npcs.list.filter(n=>String(n.spot.id).startsWith(I.id+'_')).map(n=>n.spot.id);
   window._P06={...a, bekleyen, npcIds:ids.length, tekil:new Set(ids).size, grup:DK.engine.scene.children.filter(o=>o.name==='island:'+I.id).length}; isl._drop(I.id);
   return bekleyen && a.built && a.job===null && ids.length===5 && new Set(ids).size===5 && window._P06.grup===1; })()`, truthy: true, label: 'P06 Bekleyen iş varken eşzamanlı kurulum işi tamamlar (tek grup, 5 liman NPC’si, çift kurulum yok)'}},
 {js: `window._P06`},
 // P07: balık sürüleri (çöpsüz güncelleme) hareket eder, sayı/konum geçerli
 {expect: {js: `(()=>{ const f=DK.fish; const p=DK.G.player; const I=DK.archipelago.EXTRA_ISLANDS.find(i=>i.id==='tuz_pazari'); p.pos.set(I.x+I.r+200, 1, I.z); DK.sim(3, 1/30); const s=f.schools.find(s=>s.members.some(m=>m.alive)); if (!s) { window._P07={suru:f.schools.length, hata:'canlı üyeli sürü yok'}; return false; } const m=s.members.find(m=>m.alive); const a=m.p.clone(); DK.sim(1, 1/30); const moved=m.p.distanceTo(a); const nan=f.schools.some(s=>s.members.some(m=>!isFinite(m.p.x+m.p.y+m.p.z+m.v.x+m.v.y+m.v.z))); let n=0; for (const k in f.species) n+=f.species[k].im.count; window._P07={suru:f.schools.length, ornek:n, hareket:+moved.toFixed(2), nan}; return f.schools.length>0 && n>0 && moved>0.05 && !nan; })()`, truthy: true, label: 'P07 Balık sürüleri hareket eder; konum/hız geçerli, örnek sayısı > 0'}},
 {js: `window._P07`},
 // P08: tapınak bulmacası (inceleme bulgusu): yeniden kurulumda ve kayıt yüklemede durum korunur, levye hata vermez, eski kayıt biçimi onarılır
 {expect: {js: `(async()=>{ const isl=DK.islands; const I=DK.archipelago.EXTRA_ISLANDS.find(i=>i.id==='kadim_tapinak'); const f=I.features.find(f=>f.type==='temple'); const fid=f.id; await DK.terrain.prepare(I.x, I.z, {radius: 500}); if (isl.built.has(I.id)) isl._drop(I.id); delete isl.templeState[fid];
   const lever=(i)=>isl.built.get(I.id).inter.find(x=>x.id==='lever:'+fid+':'+i);
   const pull=(i)=>{ try { lever(i).action(); return 'ok'; } catch(e) { return 'HATA: '+e.message; } };
   const shape=()=>Object.keys(isl.templeState[fid]||{}).sort().join(',');
   const out={};
   isl._build(I); const errs=[]; for (const perm of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]) { for (const i of perm) { const r=pull(i); if (r!=='ok') errs.push(r); if (isl.templeState[fid].done) break; } if (isl.templeState[fid].done) break; }
   out.cozuldu={done:isl.templeState[fid].done, hatalar:errs.length, sekil:shape()};
   isl._drop(I.id); isl._build(I); out.yenidenKur={sekil:shape(), done:isl.templeState[fid].done, levye:pull(0), kapiAcik:isl.temples[fid].gate.open===1, bossDurumu:isl.temples[fid].state.done===true};
   const d=JSON.parse(JSON.stringify(isl.save())); isl._drop(I.id); isl.start({islands:d}); isl._build(I); out.kayitYukle={kayittaki:Object.keys(d.temples[fid]).sort().join(','), sekil:shape(), done:isl.templeState[fid].done, levye:pull(0), kapiAcik:isl.temples[fid].gate.open===1};
   isl._drop(I.id); isl.start({islands:{opened:[], freed:[], temples:{[fid]:{state:{state:{seq:[2], done:false}, gate:{open:0}, cx:1, cz:2, y0:3}, gate:{}, cx:1, cz:2, y0:3}}}}); out.eskiBicim={sekil:shape(), seq:isl.templeState[fid].seq.join(','), done:isl.templeState[fid].done}; isl._build(I); out.eskiBicim.levye=pull(0); isl._drop(I.id);
   window._P08=out;
   const ok=(x)=>x.levye==='ok' && x.sekil==='done,seq';
   return out.cozuldu.done===true && out.cozuldu.hatalar===0 && ok(out.yenidenKur) && out.yenidenKur.done===true && out.yenidenKur.kapiAcik && out.yenidenKur.bossDurumu && ok(out.kayitYukle) && out.kayitYukle.kayittaki==='done,seq' && out.kayitYukle.done===true && out.kayitYukle.kapiAcik && ok(out.eskiBicim) && out.eskiBicim.seq==='2' && out.eskiBicim.done===false; })()`, truthy: true, label: 'P08 Tapınak bulmacası: çözüm yeniden kurulumda ve kayıt yüklemede korunur (kapı açık, boss koşulu), levye hata vermez, eski kayıt biçimi onarılır'}},
 {js: `window._P08`},
 {expect: {js: `DK.G.state==='playing'`, truthy: true, label: 'Oyun döngüsü testlerden sonra hatasız'}},
]
