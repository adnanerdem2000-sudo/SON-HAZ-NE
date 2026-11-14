// FAZ 8 taban: ilk görüşte gölgelendirici derlemesi (J-03, J-08, J-17). Her içerik türü aynı JS görevi içinde kurulup
// hemen çizilir (arka plandaki rAF döngüsü araya girip derlemeyi önceden yapmasın): yeni program sayısı + ilk/ikinci kare süresi.
(() => { const TOOLS = fs.readFileSync('/tmp/tasarim_y/faz8/tools.js', 'utf8'); return [
 {expect: {js: `!!window.DK && !!window.__ready`, truthy: true, label: 'Sayfa hazır'}},
 {js: TOOLS},
 {js: `(()=>{ const info=DK.engine.renderer.info; window._ilk=(fn)=>{ const p0=(info.programs||[]).length; fn(); const t0=performance.now(); DK.post.render(); const a=performance.now()-t0; const p1=(info.programs||[]).length; const t1=performance.now(); DK.post.render(); const b=performance.now()-t1; return { yeniProgram:p1-p0, ilkKareMs:+a.toFixed(0), ikinciKareMs:+b.toFixed(0), toplamProgram:p1 }; }; return { menu: window._progs(), post: DK.post.mode }; })()`},
 // oyunun ilk karesi (yükleme sonrası compileAsync yanlış varyantı derlediyse burada yeni programlar çıkar)
 {js: `(()=>{ DK.G.noAutoPause=true; window._R={}; return 'ok'; })()`},
 {js: `DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 4000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
 {js: `(()=>{ DK.events.eventT=1e9; DK.G.godMode=true; DK.sky.hour=11; DK.sky.locked=true; DK.sim(1); window._R.liman=window._ilk(()=>{}); window._R.limanVaryant=window._progs(); return window._R; })()`},
 // adalar: kur + hemen çiz (aynı görev)
 {js: `(async()=>{ const out={}; for (const id of ['kadim_tapinak','tuz_pazari','ates_dagi','demirkapi','kurt_adasi']) { const I=DK.archipelago.EXTRA_ISLANDS.find(i=>i.id===id); if (!I) { out[id]='yok'; continue; } await DK.terrain.prepare(I.x, I.z, {radius: 400}); out[id]=window._ilk(()=>{ if (DK.islands.built.has(id)) DK.islands._drop(id); const p=DK.G.player; p.mode='ground'; p.ship=null; let x=I.x+I.r*0.5, z=I.z; p.pos.set(x, DK.physics.groundAt(x,z)+0.2, z); p.vel.set(0,0,0); DK.islands._build(I); DK.sim(1/30); DK.engine.camera.position.set(I.x+I.r*0.8, 40, I.z); DK.engine.camera.lookAt(I.x, 5, I.z); DK.engine.camera.updateMatrixWorld(true); }); } window._R.adalar=out; return out; })()`},
 // düşman türleri, boss, hayvan, efekt (yanına doğur + hemen çiz)
 {js: `(()=>{ const p=DK.G.player; const out={}; const cam=DK.engine.camera; const look=(x,z)=>{ cam.position.set(x+8, p.pos.y+4, z+8); cam.lookAt(x, p.pos.y+1, z); cam.updateMatrixWorld(true); };
   out.dusman_haydut=window._ilk(()=>{ const e=DK.enemies.spawn('haydut', p.pos.x+5, p.pos.z+5, {seed:7}); look(p.pos.x+5, p.pos.z+5); });
   out.dusman_iskelet=window._ilk(()=>{ DK.enemies.spawn('iskelet', p.pos.x+6, p.pos.z+4, {seed:8}); look(p.pos.x+6, p.pos.z+4); });
   out.boss_tas=window._ilk(()=>{ DK.bosses.checkT=1e9; DK.bosses.spawn('tas_muhafiz', {id:'tas_muhafiz', x:p.pos.x+20, z:p.pos.z}); look(p.pos.x+20, p.pos.z); });
   DK.bosses._clear();
   out.boss_volkan=window._ilk(()=>{ DK.bosses.spawn('volkanik_dev', {id:'volkanik_dev', x:p.pos.x+25, z:p.pos.z}); look(p.pos.x+25, p.pos.z); });
   DK.bosses._clear();
   out.efekt_lav=window._ilk(()=>{ const T=DK.THREE; DK.enemies.lob({kind:'lava', from:p.pos.clone().add(new T.Vector3(3,20,3)), to:p.pos.clone().add(new T.Vector3(3,0,3)), time:1.5, dmg:0, aoe:2}); DK.effects.smoke(p.pos.x+3, p.pos.y+1, p.pos.z+3, 20, 1.5, 0.5); });
   const z=DK.animals.zones.find(z=>z.kind==='croc'); out.hayvan_timsah=window._ilk(()=>{ z.cooldown=0; DK.animals._spawnZone(z); look(z.x, z.z); });
   window._R.icerik=out; return out; })()`},
 // meşale (J-08) ve gece
 {js: `(()=>{ const p=DK.G.player; if (!p.inv.has('fener')) p.inv.add('fener',1); const out={}; out.gece=window._ilk(()=>{ DK.sky.hour=22; DK.sim(0.2); }); out.mesaleAc=window._ilk(()=>{ p.toggleTorch(); DK.sim(0.05); }); out.mesaleKapat=window._ilk(()=>{ p.toggleTorch(); DK.sim(0.05); }); out.mesaleTekrar=window._ilk(()=>{ p.toggleTorch(); DK.sim(0.05); }); p.toggleTorch(); DK.sky.hour=11; window._R.mesale=out; out.isik=window._lights(); return out; })()`},
 // efekt kalitesi değişimi (son işleme aç/kapa → bütün sahne yeniden derlenir mi)
 {js: `(()=>{ const out={}; out.efektDusuk=window._ilk(()=>{ DK.settings.v.effects='low'; DK.settings.apply(); }); out.efektOrta=window._ilk(()=>{ DK.settings.v.effects='high'; DK.settings.apply(); }); window._R.efekt=out; return out; })()`},
 {js: `window._R`},
 {expect: {js: `DK.G.state==='playing'`, truthy: true, label: 'Oyun açık'}},
]; })()
