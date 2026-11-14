// Faz 7 tasarım İNCELEMESİ — salt-okur tarayıcı ölçümü (kod değiştirmez; yalnız test içinde örnek nesnelere sarmalayıcı takar).
// MA: H-20'nin gerçekçi kılıç zinciriyle ölçümü (chainAt'e uyan girdi; M5b 0,42 sn'de bir _attack çağırıyordu) + K7-5 öykünmesi
//     + K7-5 ve bitirici sersemliğine azalan getiri öykünmesi.
// MB: Derinlik Yılanı tükürüğü (venom lob) oyuncuya can hasarı veriyor mu (SeaSerpent'te _hitPlayer var mı).
// MC: A3/A5 ölçütleri: bugünkü algı formülüyle fark etme süreleri (ayakta/eğilmiş, gündüz/gece, meşale).
// MD: Öfkeli Morvan'da telgraf süreleri (TELE_MIN 0,40 / 0,60 ile karşılaştırma).
[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 4000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
 {js: `(()=>{ const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(-60, DK.terrain.heightAt(-60,120)+0.05, 120); p.vel.set(0,0,0); p.hp=100; p.dead=false; p.downed=false; DK.sky.hour=12; for (const W of [DK.sky.weather, DK.sky.target]) if (W) { W.fog=0; W.rain=0; } for (const e of [...DK.enemies.list]) { e.dispose(); e.removed=true; } DK.enemies.list=[]; DK.sim(0.5,1/60); window._step=(n)=>{ for(let i=0;i<n;i++){ DK.game.update(1/60); DK.input.endFrame(); } }; return {ok:true}; })()`},
 // MA: üç değişke × 3 tohum (Math.random sabitlenmez; değişkeler arası karşılaştırma için 3 tekrar)
 {js: `(()=>{ try { const out={}; const p=DK.G.player; const x0=-60, z0=120;
   const runOne=(variant)=>{ DK.G.godMode=true; p.pos.set(x0, DK.terrain.heightAt(x0,z0)+0.05, z0); p.vel.set(0,0,0); p.action=null; p.combo.step=0; p.combo.grace=0; p.inv.add('kilic',1); if (p.equipped!=='sword') p.equip('sword'); p.stamina=100;
     const e=DK.enemies.spawn('haydut', x0, z0+1.8, {homeR:60}); e.pos.set(x0, DK.terrain.heightAt(x0,z0+1.8), z0+1.8); e.yaw=Math.PI; e.awareness=1; e.target=e._targetInfo(p, DK.G.myId); e._setState('chase'); e.maxHp=e.hp=99999;
     let res=0, starts=0, hitEnter=0, stunEnter=0, prev=e.state, swings=0, now=0, flinchUntil=-1, lastStunEnd=-99;
     const om=e._resolveMelee.bind(e), os=e._startMelee.bind(e); e._resolveMelee=(...a)=>{ res++; return om(...a); }; e._startMelee=(...a)=>{ starts++; return os(...a); };
     if (variant!=='bugun') { const oad=e.applyDamage.bind(e); e.applyDamage=(dmg, info={})=>{ let inf=info;
         if (variant==='k75_dr' && inf.finisher && now-lastStunEnd<2.0) inf={...inf, finisher:false};
         const heavy=inf.heavy||inf.counter||inf.finisher; const armored=e.state==='attack' && e.atkHit && e.stateT>=0.7*e.atkHit[0];
         if (!heavy && (now<flinchUntil || armored)) { e.hp-=dmg; e.char.playUpper('HitRecieve',0.04,{once:true,restart:true,speed:1.3}); return; }
         const before=e.state; oad(dmg, inf); if (e.state==='hit' && before!=='hit') flinchUntil=now+1.2; }; }
     for (let s=0;s<600;s++){ DK.tpCamera.yaw=Math.atan2(e.pos.x-p.pos.x, e.pos.z-p.pos.z);
       const a=p.action; if (!a || (a.type==='atk' && a.t>=a.chainAt)) { swings++; DK.combat._attack(p,'light'); }
       window._step(1); now+=1/60;
       if (e.state==='hit' && prev!=='hit') hitEnter++; if (e.state==='stunned' && prev!=='stunned') stunEnter++; if (prev==='stunned' && e.state!=='stunned') lastStunEnd=now; prev=e.state; }
     const r={swings, starts, resolved:res, hitEnter, stunEnter, stamina:Math.round(p.stamina)};
     e.dispose(); e.removed=true; DK.enemies.list=DK.enemies.list.filter(x=>x!==e); DK.G.godMode=false; return r; };
   for (const v of ['bugun','k75','k75_dr']) out[v]=[runOne(v), runOne(v), runOne(v)];
   window._ma=out; return out; } catch(err) { return {err:String(err)}; } })()`},
 // MB: yılan tükürüğü
 {js: `(()=>{ try { const p=DK.G.player; const x0=-60, z0=120; DK.G.godMode=false; p.pos.set(x0, DK.terrain.heightAt(x0,z0)+0.05, z0); p.vel.set(0,0,0); p.hp=100; p.poison=0; p.invuln=0; p.action=null; p.blocking=false;
   const s=DK.bosses.spawn('derinlik_yilani', {id:'derinlik_yilani', x:x0+60, z:z0}); const has=typeof s._hitPlayer;
   const T=DK.THREE; DK.enemies.lob({kind:'venom', from:new T.Vector3(p.pos.x+6, p.pos.y+6, p.pos.z), to:p.pos.clone(), time:0.6, dmg:12, shipDmg:3, aoe:2.4, owner:s});
   let impactAt=null, hpAtImpact=null; const hp0=p.hp; for (let i=0;i<120;i++){ window._step(1); if (impactAt===null && p.poison>0) { impactAt=+(i/60).toFixed(2); hpAtImpact=+p.hp.toFixed(2); } }
   const r={serpentHitPlayer:has, hp0, hpAtImpact, hpAfter2s:+p.hp.toFixed(2), poison:+p.poison.toFixed(2), impactAt};
   DK.bosses._clear(); p.poison=0; p.hp=100; window._mb=r; return r; } catch(err) { return {err:String(err)}; } })()`},
 // MC: fark etme süreleri (haydut nöbetçi, görüş 24 m, FOV 125; oyuncu hareketsiz, koni merkezinde)
 {js: `(()=>{ try { const p=DK.G.player; const x0=-60, z0=120; const out={};
   const meas=(label, frac, opts)=>{ p.pos.set(x0, DK.terrain.heightAt(x0,z0)+0.05, z0); p.vel.set(0,0,0); p.crouch=!!opts.crouch; p.torch=!!opts.torch; p.action=null; DK.sky.hour=opts.hour; for (const W of [DK.sky.weather, DK.sky.target]) if (W) { W.fog=0; W.rain=0; }
     const d=24*frac; const e=DK.enemies.spawn('haydut', x0, z0+d, {role:'sentry', homeR:5}); e.pos.set(x0, DK.terrain.heightAt(x0,z0+d), z0+d); e.awareness=0; e.target=null; e._setState('patrol'); e.hear=()=>{};
     let t=null; for (let i=0;i<600;i++){ e.yaw=Math.atan2(p.pos.x-e.pos.x, p.pos.z-e.pos.z); p.vel.set(0,0,0); window._step(1); if (t===null && (e.awareness>=1 || e.target)) { t=+(i/60).toFixed(2); break; } }
     out[label]={d:+d.toFixed(1), night:DK.sky.isNight(), t, aw:+e.awareness.toFixed(2)}; e.dispose(); e.removed=true; DK.enemies.list=DK.enemies.list.filter(x=>x!==e); };
   meas('gunduz_ayakta_0.5', 0.5, {hour:12}); meas('gunduz_egilmis_0.5', 0.5, {hour:12, crouch:true}); meas('gunduz_egilmis_0.6', 0.6, {hour:12, crouch:true});
   meas('gece_mesalesiz_0.45', 0.45, {hour:23}); meas('gece_mesaleli_1.1', 1.1, {hour:23, torch:true}); meas('gunduz_ayakta_0.7', 0.7, {hour:12});
   p.crouch=false; p.torch=false; DK.sky.hour=12; window._mc=out; return out; } catch(err) { return {err:String(err)}; } })()`},
 // MD: öfkeli Morvan telgrafı
 {js: `(()=>{ try { const p=DK.G.player; const x0=-60, z0=120; DK.G.godMode=true; const e=DK.enemies.spawn('iskelet_kaptan', x0, z0+2, {homeR:60}); e.enraged=true; const tgt=e._targetInfo(p, DK.G.myId); const seen={};
   for (let i=0;i<80;i++){ e._startMelee(tgt, 2.0); const k=e.move.anim+(e.move.unblockable?'*':''); seen[k]=+e.atkHit[0].toFixed(3); e._setState('chase'); }
   e.dispose(); e.removed=true; DK.enemies.list=DK.enemies.list.filter(x=>x!==e); DK.G.godMode=false; window._md=seen; return seen; } catch(err) { return {err:String(err)}; } })()`},
 {expect: {js: `({ma: window._ma, mb: window._mb, mc: window._mc, md: window._md})`, truthy: true, label: 'İnceleme ölçüm özeti'}},
]
