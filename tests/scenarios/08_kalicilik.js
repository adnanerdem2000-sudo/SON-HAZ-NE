// Aşama 6f/8 doğrulaması: kayıt/yükleme döngüsünde ada ödülleri, tutsaklar, tapınak mekanizması, kırık sandık/patlamış fıçı,
// taşınan sandık, batık gemi, kamp bekleme, gemi parçaları/direk/top hasarı; bozuk kayıt dosyası; benzersiz kimlikler.
[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 4000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
 {js: `(()=>{ const T=DK.THREE; const p=DK.G.player; const s=DK.G.ship;
   // ada durumu
   DK.islands.opened = DK.islands.opened || new Set(); DK.islands.opened.add('test_chest_1'); DK.islands.opened.add('altartest');
   DK.islands.freed = DK.islands.freed || new Set(); DK.islands.freed.add('tapinak_x_1');
   DK.islands.templeState = DK.islands.templeState || {}; DK.islands.templeState['tap_1'] = { seq: [0,1,2], done: true };
   // tehlikeler: bir sandık kırılır, bir fıçı patlar
   const cr = DK.hazards.list('crate').find(h=>h.state==='idle'); const kg = DK.hazards.list('keg').find(h=>h.state==='idle');
   window._crId = cr && cr.id; window._kgId = kg && kg.id;
   if (cr) DK.hazards.breakCrate(cr, false, false); if (kg) DK.hazards._explode(kg);
   // oyuncu konumu (önce): taşınan sandık konumu taşıyıcıyı izler
   p.mode='ground'; p.ship=null; p.pos.set(-60, DK.terrain.heightAt(-60,120)+0.1, 120); p.vel.set(0,0,0);
   // taşınan sandık
   const c = DK.treasure.spawnChest('small', p.pos.clone()); DK.treasure._grant(c, DK.G.myId); window._carried = c.id;
   DK.sim(0.5, 1/30);
   // gemi: hasar + batık, parçalar
   s.parts.pruva = 50; s.mastHp[0] = 0; s.cannonHp[0] = 30; s.hp = 60; s.sunk = true; s.sinking = 15; s.root.visible = false;
   // kamp bekleme
   DK.enemies.groupState['kamp'] = { spawned:false, cooldown: 222, nightDone:false, killed:0 };
   const data = DK.game.serialize();
   window._saved = data;
   return { crId: window._crId, kgId: window._kgId, carried: window._carried, chests: data.treasure.chests.length, islandsSaved: !!data.islands, hazardsGone: data.hazards.gone.length, shipSunk: data.ship.sunk, campCd: data.enemies.groups.kamp.cooldown };
 })()`},
 {expect: {js: `(()=>{ const d=window._saved; const r={ opened: !!(d.islands && d.islands.opened.includes('test_chest_1')), freed: !!(d.islands && d.islands.freed.includes('tapinak_x_1')), temple: !!(d.islands && d.islands.temples && d.islands.temples.tap_1 && d.islands.temples.tap_1.done===true), gone: d.hazards.gone.length>=1, carried: d.treasure.chests.some(c=>c.id===window._carried), sunk: d.ship.sunk===true, camp: d.enemies.groups.kamp.cooldown>=221 }; window._clauses=r; return Object.values(r).every(Boolean); })()`, truthy: true, label: 'Kayıt verisi ada/tehlike/taşınan sandık/batık gemi/kamp durumunu içeriyor'}},
 {js: `window._clauses`},
 {js: `DK.save.write('solo', 2, window._saved); DK.handlers.startGame({kind:'solo', slot:2, data: DK.save.read('solo', 2)}); 'reloading'`},
 {wait: 5000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Kayıt yüklendi, oyun başladı'}},
 {expect: {js: `(()=>{ const I=DK.islands; return I.opened.has('test_chest_1') && I.opened.has('altartest') && I.freed.has('tapinak_x_1') && I.templeState.tap_1 && I.templeState.tap_1.done === true; })()`, truthy: true, label: 'B02/B-08 Ada ödülleri, tutsaklar ve tapınak mekanizması yüklemede geri geliyor'}},
 {expect: {js: `(()=>{ const crates=DK.hazards.list('crate').map(h=>h.id), kegs=DK.hazards.list('keg').map(h=>h.id); window._hz={crateStillThere: crates.includes(window._crId), kegStillThere: kegs.includes(window._kgId), gone: [...DK.hazards.gone]}; return !crates.includes(window._crId) && !kegs.includes(window._kgId); })()`, truthy: true, label: 'Kırılmış sandık ve patlamış fıçı yüklemede yeniden kurulmuyor'}},
 {js: `window._hz`},
 {expect: {js: `(()=>{ const c=DK.treasure.chestById(window._carried); const p=DK.G.player; window._ch = c ? {state:c.state, d:+Math.hypot(c.pos.x-p.pos.x, c.pos.z-p.pos.z).toFixed(1)} : null; return !!c && c.state !== 'carried' && window._ch.d < 6; })()`, truthy: true, label: 'B04 Taşınan sandık kayıtta; yüklemede oyuncunun yanında yerde'}},
 {js: `window._ch`},
 {expect: {js: `(()=>{ const s=DK.G.ship; window._sh={sunk:s.sunk, visible:s.root.visible, pruva:s.parts.pruva, mast0:s.mastHp[0], cannon0:s.cannonHp[0], hp:s.hp, playerMode: DK.G.player.mode}; return s.sunk===true && s.root.visible===false && s.parts.pruva===50 && s.mastHp[0]===0 && s.cannonHp[0]===30 && DK.G.player.mode!=='deck'; })()`, truthy: true, label: 'E-13/A1 Batık gemi batık yüklenir, parça/direk/top hasarı korunur, oyuncu güverteye bindirilmez'}},
 {js: `window._sh`},
 {expect: {js: `(()=>{ const cd=DK.enemies.groupState.kamp && DK.enemies.groupState.kamp.cooldown; return cd > 200 && cd <= 222; })()`, truthy: true, label: 'A5/F-07 Kamp bekleme süresi yüklemede korunur (yükleme sonrası geçen süre düşülür)'}},
 {expect: {js: `(()=>{ const ids=DK.treasure.chests.map(c=>c.id); const pk=DK.treasure.pickups.map(p=>p.id); return new Set(ids).size===ids.length && new Set(pk).size===pk.length && ids.every(i=>typeof i==='string' && i.length>3); })()`, truthy: true, label: 'Sandık ve kese kimlikleri benzersiz'}},
 // bozuk kayıt dosyası
 {expect: {js: `(()=>{ const k=DK.save.key('solo', 1); localStorage.setItem(k, '{"slot":1,"broken":'); const r=DK.save.read('solo', 1); const list=DK.save.list('solo'); localStorage.removeItem(k); return r===null && Array.isArray(list); })()`, truthy: true, label: 'Bozuk kayıt dosyası güvenle reddedilir (null), liste çökmez'}},
 {expect: {js: `(()=>{ const k=DK.save.key('solo', 1); const good=JSON.stringify({ ...window._saved, slot:1 }); localStorage.setItem(k+'.bak', good); localStorage.setItem(k, 'garbage'); const r=DK.save.read('solo', 1); localStorage.removeItem(k); localStorage.removeItem(k+'.bak'); return !!r && r.version===1; })()`, truthy: true, label: 'Bozuk ana kayıt varken .bak yedeği okunur'}},
 {expect: {js: `(()=>{ const s=DK.G.ship; s.sunk=false; s.sinking=0; s.root.visible=true; DK.sim(2,1/30); return DK.G.state==='playing'; })()`, truthy: true, label: 'Oyun döngüsü yükleme sonrası hatasız sürüyor'}},
]
