// Aşama 6b/6c (2 oyuncu): konuk ganimeti ev sahibinde doğar ve alınır; ambardan sandık alma; yüzen nesne görünür/alınır;
// uzak oyuncu gemi/zemin bilgisi; gemi delik/gülle/batık/direk senkronu; lav havuzu uzak oyuncuyu yakar; konuk sesi; boss geri tepmesi.
module.exports = async ({ pages, host, guests, ev: ev0, tick: tick0, check, log }) => {
  const g = guests[0];
  const t0 = Date.now();
  const stamp = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';
  const ev = (p, js, label) => { let to; return Promise.race([ev0(p, js, label).finally(() => clearTimeout(to)), new Promise((r) => { to = setTimeout(() => { console.log('EV-TIMEOUT', stamp(), label || js.slice(0, 60)); r(undefined); }, 45000); })]); };
  const tick = async (sec) => { await Promise.race([tick0(sec), new Promise((r) => setTimeout(() => { console.log('TICK-TIMEOUT', stamp()); r(); }, 120000))]); };
  const room = await ev(host, `DK.net.host({name:'Senkron Odası', public:false, max:4, pw:'', difficulty:'normal', slot:2}).then(r=>({code:r.code}))`, 'host');
  await ev(g, `DK.net.join('${room.code}','').then(r=>({room:r.room.name})).catch(e=>({err:String(e)}))`, 'join');
  await host.waitForTimeout(800);
  await ev(host, `DK.handlers.startOnlineHost(DK.net.room).then(()=>'host-started')`, 'hs');
  await host.waitForTimeout(800);
  await ev(g, `DK.G.state === 'playing' ? 'already' : DK.handlers.startOnlineGuest().then(()=>'guest-started')`, 'gs');
  for (const pg of pages) await ev(pg, `DK.engine.fpsLimit = 0.01; 'lim'`); // çizim döngüsü fiilen durur (100 sn'de bir kare); benzetim tick (DK.sim) ile ilerler
  await tick(2);
  const gid = await ev(g, `DK.G.myId`);
  check('2 oyuncu oyunda', (await ev(host, `DK.G.state`)) === 'playing' && (await ev(g, `DK.G.state`)) === 'playing');
  // benzetim maliyeti ölçümü (co-op yavaşlık teşhisi): DK.sim(0.2) süresi ve ev sahibinde sistem başına süre
  const PROF = `(()=>{ const t0=performance.now(); DK.sim(0.2); const sim=performance.now()-t0; const per={}; for (const s of DK.game.systems){ if(!s.update) continue; const a=performance.now(); for (let i=0;i<6;i++) s.update(1/60); per[s.name||'?']=+((performance.now()-a)/6).toFixed(2); } const b=performance.now(); for (let i=0;i<6;i++) DK.net.update(1/30); per.net=+((performance.now()-b)/6).toFixed(2); const c=performance.now(); for (let i=0;i<6;i++) DK.G.player.update(1/60); per.player=+((performance.now()-c)/6).toFixed(2); if (DK.hud) { const d=performance.now(); for (let i=0;i<6;i++) DK.hud.update(1/30); per.hud=+((performance.now()-d)/6).toFixed(2); } const top=Object.entries(per).sort((x,y)=>y[1]-x[1]).slice(0,8); return { sim02ms:+sim.toFixed(0), topPerFrameMs: top }; })()`;
  log('profil host: ' + JSON.stringify(await ev(host, PROF)));
  log('profil guest: ' + JSON.stringify(await ev(g, PROF)));
  // konuk ev sahibinin yanına gelir (limanda)
  const hp0 = await ev(host, `[DK.G.player.pos.x, DK.G.player.pos.z]`);
  await ev(g, `(()=>{ const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(${hp0[0]}+2, DK.terrain.heightAt(${hp0[0]}+2, ${hp0[1]}+2)+0.1, ${hp0[1]}+2); p.vel.set(0,0,0); return 'ok'; })()`);
  await tick(1.5);

  // 1) konuk sandık kırar → kese ev sahibinde doğar, konukta görünür, konuk alır
  log('1 sandık ganimeti @ ' + stamp());
  const crate = await ev(host, `(()=>{ const c=DK.hazards.list('crate').find(h=>h.state==='idle'); return c ? {id:c.id, x:c.x, z:c.z} : null; })()`, 'crate');
  check('Kırılabilir sandık var', !!crate, crate);
  if (crate) {
    await ev(g, `(()=>{ const p=DK.G.player; p.pos.set(${crate.x}+1.2, DK.terrain.heightAt(${crate.x}+1.2, ${crate.z})+0.1, ${crate.z}); p.vel.set(0,0,0); return 'ok'; })()`);
    await ev(host, `(()=>{ const p=DK.G.player; p.pos.set(${crate.x}+3, DK.terrain.heightAt(${crate.x}+3, ${crate.z})+0.1, ${crate.z}); return 'ok'; })()`);
    await tick(1.5);
    const pk0 = await ev(host, `DK.treasure.pickups.filter(p=>!p.remove).length`);
    await ev(g, `(()=>{ const h=DK.hazards.list('crate').find(h=>h.id==='${crate.id}'); if (!h) return 'yok'; h.target.hurt(99, {kind:'melee', pos: DK.G.player.pos.clone()}); return h.state; })()`, 'g-break');
    await tick(2);
    const pkHost = await ev(host, `DK.treasure.pickups.filter(p=>!p.remove).map(p=>p.id)`, 'host-pickups');
    const pkGuest = await ev(g, `DK.treasure.pickups.filter(p=>!p.remove).map(p=>p.id)`, 'guest-pickups');
    const newIds = (pkHost || []).filter((id) => true);
    check('B03/H01 Konuğun kırdığı sandığın kesesi ev sahibinde doğar ve konukta aynı kimlikle görünür', pkHost && pkHost.length > pk0 && pkGuest && pkHost.some((id) => pkGuest.includes(id)), { pk0, pkHost, pkGuest });
    const target = (pkHost || []).find((id) => (pkGuest || []).includes(id));
    if (target) {
      await ev(g, `window.__gained=0; DK.G.on('itemsGained', ()=>{ window.__gained++; }); const pk=DK.treasure.pickups.find(p=>p.id==='${target}'); DK.G.player.pos.copy(pk.pos); DK.G.emit('netPickupReq', { id: pk.id }); 'req'`);
      await tick(2);
      const gained = await ev(g, `window.__gained`);
      const goneHost = await ev(host, `!DK.treasure.pickups.some(p=>p.id==='${target}' && !p.remove)`);
      check('H01 Konuk keseyi alır: eşya konuğa geçer, kese ev sahibinde kalkar', gained >= 1 && goneHost, { gained, goneHost });
    }
  }

  // 2) ambardan sandık alma (konuk)
  log('2 ambar @ ' + stamp());
  const shipInfo = await ev(host, `(()=>{ const s=DK.G.ship; const c=DK.treasure.spawnChest('small', new DK.THREE.Vector3(s.x, s.y+2, s.z)); DK.treasure.stowInHold(s, c); return { id:s.id, x:s.x, z:s.z, held: s.hold.chests.length, cid: c.id }; })()`, 'hold');
  await ev(g, `(()=>{ const s=DK.G.ships.find(x=>x.id==='${shipInfo.id}'); const p=DK.G.player; p.boardShip(s, s.model.stations.hold.clone()); return s.hold.chests.length; })()`, 'g-onship');
  await tick(1.5);
  await ev(g, `(()=>{ const s=DK.G.ships.find(x=>x.id==='${shipInfo.id}'); DK.treasure.takeFromHold(s, 0); return 'req'; })()`);
  await tick(2);
  const carryG = await ev(g, `({carrying: DK.G.player.carrying?.id || null, chests: DK.treasure.chests.map(c=>[c.id,c.state,c.carriers])})`, 'g-carry');
  const holdH = await ev(host, `({hold: DK.G.ship.hold.chests.length, chest: DK.treasure.chests.filter(c=>c.id==='${shipInfo.cid}').map(c=>[c.state,c.carriers])})`, 'h-hold');
  check('H10/H03 Konuk ambardan sandığı alır: ev sahibi ambarı boşalır, sandık konuğun taşımasında', carryG && carryG.carrying === shipInfo.cid && holdH && holdH.hold === 0 && holdH.chest.length === 1 && holdH.chest[0][1].includes(gid), { carryG, holdH });
  await ev(g, `(()=>{ const p=DK.G.player; const c=DK.treasure.chestById(p.carrying?.id); if (c) { const s=DK.G.ships[0]; DK.treasure.stowInHold(s, c); } return 'stow'; })()`);
  await tick(1.5);
  const afterStow = await ev(host, `({hold: DK.G.ship.hold.chests.length, ghosts: DK.treasure.chests.filter(c=>c.id==='${shipInfo.cid}').length})`, 'h-after-stow');
  check('H03 Konuk sandığı ambara koyunca ev sahibinde hayalet sandık kalmaz', afterStow && afterStow.hold === 1 && afterStow.ghosts === 0, afterStow);

  // 3) yüzen nesne: ev sahibi doğurur, konuk görür ve alır (şişe → eşya konukta)
  log('3 yüzen nesne @ ' + stamp());
  const gp = await ev(g, `(()=>{ const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(${hp0[0]}, DK.terrain.heightAt(${hp0[0]}, ${hp0[1]})+0.1, ${hp0[1]}); return [p.pos.x, p.pos.z]; })()`);
  const fid = await ev(host, `(()=>{ const f=DK.events.spawnFloating('bottle', new DK.THREE.Vector3(${gp[0]}+1.5, 0, ${gp[1]})); return f.id; })()`, 'float');
  await tick(2);
  const seen = await ev(g, `(()=>{ const f=DK.events.floating.find(x=>x.id==='${fid}'); return f ? {net:f.net, pos:[+f.pos.x.toFixed(1), +f.pos.z.toFixed(1)], label:f.label} : null; })()`, 'g-float');
  check('B08/H08 Yüzen şişe konukta görünür (ağ kopyası)', !!seen && seen.net === true, seen);
  await ev(g, `(()=>{ const f=DK.events.floating.find(x=>x.id==='${fid}'); if (!f) return 'yok'; DK.G.player.pos.set(f.pos.x, DK.G.player.pos.y, f.pos.z); DK.events.collectFloating(f, DK.G.myId); return 'req'; })()`);
  await tick(2);
  const bottle = await ev(g, `({has: DK.G.player.inv.has('sise_mesaj'), still: DK.events.floating.some(x=>x.id==='${fid}' && !x.gone)})`, 'g-bottle');
  const bottleHost = await ev(host, `DK.events.floating.some(x=>x.id==='${fid}' && !x.gone)`);
  check('H08 Konuk şişeyi alır: eşya konuğa geçer, nesne iki tarafta da kalkar', bottle && bottle.has && !bottle.still && !bottleHost, { bottle, bottleHost });

  // 4) uzak oyuncu gemi/zemin bilgisi (F-02/F-12)
  log('4 uzak oyuncu bilgisi @ ' + stamp());
  await ev(g, `(()=>{ const s=DK.G.ships.find(x=>x.id==='${shipInfo.id}'); DK.G.player.boardShip(s, s.model.stations.helm.clone()); return 'board'; })()`);
  await tick(1.5);
  const rShip = await ev(host, `(()=>{ const r=DK.G.remotes.get('${gid}'); return r ? { ship: r.ship ? r.ship.id : null, mode: r.mode, onGround: r.onGround } : null; })()`, 'h-remote');
  check('F-02 Ev sahibinde uzak oyuncunun gemi referansı var (güverte düşmanları ulaşılabilir sayar)', rShip && rShip.ship === shipInfo.id && rShip.mode === 'deck', rShip);
  await ev(g, `(()=>{ const p=DK.G.player; p.localVy=14; p.localY=0.02; p.onGround=false; return 'jump'; })()`);
  let air = null;
  for (let i = 0; i < 6 && air !== false; i++) { await tick(0.2); air = await ev(host, `(()=>{ const r=DK.G.remotes.get('${gid}'); return r ? r.onGround : null; })()`, 'h-air'); }
  check('F-12 Zıplayan konuk ev sahibinde havada görünür (tepinmeden zıplayarak kaçma)', air === false, air);

  // 5) gemi senkronu: delik, gülle, direk onarımı, batık
  log('5 gemi senkronu @ ' + stamp());
  await ev(host, `(()=>{ const s=DK.G.ship; s.addHole(new DK.THREE.Vector3(1, 0, 2), 1); s.cannonballs=42; s.planks=7; s.mastHp[0]=0; s._applyDamageVisuals(); return {holes:s.holes.length, fallen: !!(s._fallen && s._fallen[0])}; })()`, 'h-ship');
  await tick(1.5);
  const gs1 = await ev(g, `(()=>{ const s=DK.G.ships.find(x=>x.id==='${shipInfo.id}'); return { holes: s.holes.length, balls: s.cannonballs, planks: s.planks, fallen: !!(s._fallen && s._fallen[0]) }; })()`, 'g-ship1');
  check('E-02/E-06/E-07 Konuk deliği, gülle/tahta sayısını ve devrik direği görür', gs1 && gs1.holes === 1 && gs1.balls === 42 && gs1.planks === 7 && gs1.fallen, gs1);
  await ev(host, `(()=>{ const s=DK.G.ship; s.mastHp[0]=35; s.rebuild({}); s.repairHole(s.holes[0].id); return {holes:s.holes.length, fallen: !!(s._fallen && s._fallen[0])}; })()`, 'h-repair');
  await tick(1.5);
  const gs2 = await ev(g, `(()=>{ const s=DK.G.ships.find(x=>x.id==='${shipInfo.id}'); return { holes: s.holes.length, fallen: !!(s._fallen && s._fallen[0]) }; })()`, 'g-ship2');
  check('E-07/E-02 Direk onarımı ve delik onarımı konukta geri alınır', gs2 && gs2.holes === 0 && !gs2.fallen, gs2);
  await ev(host, `(()=>{ const s=DK.G.ship; s.sunk=true; s.root.visible=false; return 'sunk'; })()`);
  await tick(1.2);
  const gsunk = await ev(g, `(()=>{ const s=DK.G.ships.find(x=>x.id==='${shipInfo.id}'); return { sunk: s.sunk, visible: s.root.visible }; })()`, 'g-sunk');
  check('H12 Batık bayrağı konukta: gemi görünmez', gsunk && gsunk.sunk === true && gsunk.visible === false, gsunk);
  await ev(host, `(()=>{ const s=DK.G.ship; s.sunk=false; s.sinking=0; s.root.visible=true; return 'raised'; })()`);
  await tick(1.2);

  // 6) lav havuzu uzak oyuncuyu yakar (F-15)
  log('6 lav @ ' + stamp());
  const gpos = await ev(g, `(()=>{ const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(${hp0[0]}+6, DK.terrain.heightAt(${hp0[0]}+6, ${hp0[1]})+0.1, ${hp0[1]}); p.vel.set(0,0,0); p.hp=100; p.invuln=0; return [p.pos.x, p.pos.y, p.pos.z]; })()`);
  await tick(1);
  await ev(host, `(()=>{ DK.enemies.firePools.push({ x: ${gpos[0]}, y: ${gpos[1]}, z: ${gpos[2]}, r: 3, t: 6 }); return 'pool'; })()`);
  await tick(2);
  const ghp = await ev(g, `DK.G.player.hp`, 'g-hp');
  check('F-15 Lav havuzu uzak oyuncuyu da yakar', ghp < 100, ghp);
  // 7) konuk sesi ev sahibi AI'sına ulaşır (F-13)
  log('7 ses @ ' + stamp());
  const eid = await ev(host, `(()=>{ const e=DK.enemies.spawn('haydut', ${gpos[0]}, ${gpos[2]}+14, {role:'sentry'}); e.pos.set(${gpos[0]}, DK.terrain.heightAt(${gpos[0]}, ${gpos[2]}+14), ${gpos[2]}+14); e.yaw=Math.atan2(0, 1); e.awareness=0; e.target=null; if (DK.sky.weather){DK.sky.weather.fog=0;DK.sky.weather.rain=0;} window.__e=e; return e.id; })()`, 'enemy');
  await tick(0.6);
  await ev(g, `DK.combat.noise(DK.G.player.pos, 45, 'gunshot'); 'noise'`);
  await tick(1.5);
  const heard = await ev(host, `({awareness:+window.__e.awareness.toFixed(2), state: window.__e.state, lastKnown: !!window.__e.lastKnown})`, 'h-heard');
  check('F-13 Konuğun silah sesi ev sahibi düşmanını uyarır', heard && (heard.state !== 'patrol' || heard.awareness > 0.2 || heard.lastKnown), heard);
  // 8) boss geri tepmesi konukta (F-11)
  log('8 kb @ ' + stamp());
  await ev(host, `DK.G.emit('netHurtPlayer', { id: '${gid}', dmg: 1, from: [${gpos[0]}-2, ${gpos[1]}, ${gpos[2]}], cause: 'test', unblockable: true, melee: true, kb: 6 }); 'sent'`);
  await tick(0.3);
  const kb = await ev(g, `(()=>{ const k=DK.G.player.knock; return k ? +Math.hypot(k.x,k.z).toFixed(2) : 0; })()`, 'g-kb');
  check('F-11 Boss süpürmesinin geri tepmesi konukta uygulanır (0.3 sn sonra sönümlenmiş kalıntı > 0)', kb > 0.05, kb); // başlangıç 6 m/s, 9/s sönüm → 0.3 s sonra ≈0.4
  // 9) mermi görselleri konukta (F-06): nişancı konuğa ok atar
  log('9 mermiler @ ' + stamp());
  await ev(host, `(()=>{ window.__e.dispose(); window.__e.removed=true; DK.enemies.list=DK.enemies.list.filter(x=>x!==window.__e); const e=DK.enemies.spawn('haydut_nisanci', ${gpos[0]}+8, ${gpos[2]}, {role:'sentry'}); e.pos.set(${gpos[0]}+8, DK.terrain.heightAt(${gpos[0]}+8, ${gpos[2]}), ${gpos[2]}); e.awareness=1; const r=DK.G.remotes.get('${gid}'); e.target=e._targetInfo(r, '${gid}'); e._setState('chase'); window.__a=e; return e.id; })()`, 'archer');
  let vis = 0, natural = true, shotsHost = 0;
  for (let i = 0; i < 10 && !vis; i++) { await tick(1); vis = await ev(g, `(DK.enemies._visShots || []).length`); }
  if (!vis) {
    // nişancı bu sürede ateş etmediyse (görüş/mesafe kararı rastlantısal) mermi ev sahibinde doğrudan oluşturulur: kontrolün amacı
    // mermi görselinin konuğa aktarılmasıdır, yapay zekânın ateş kararı değil (o 05_dusman_ai.js'te sınanır)
    natural = false;
    shotsHost = await ev(host, `(()=>{ const T=DK.THREE, e=window.__a, r=DK.G.remotes.get('${gid}'); const from=new T.Vector3(e.pos.x, e.pos.y+1.4, e.pos.z); const to=new T.Vector3(r.pos.x, r.pos.y+1.2, r.pos.z); const dir=to.sub(from).normalize(); DK.enemies.shoot({ from, dir, speed: 6, kind: 'bolt', dmg: 0, owner: e }); return DK.enemies.shots.length; })()`, 'forced-shot');
    for (let i = 0; i < 5 && !vis; i++) { await tick(0.4); vis = await ev(g, `(DK.enemies._visShots || []).length`); }
  }
  if (!shotsHost) shotsHost = await ev(host, `DK.enemies.shots.length`);
  check('F-06 Düşman mermileri konukta görsel olarak izlenir', vis > 0, { vis, shotsHost, natural });
  await ev(host, `(()=>{ const e=window.__a; e.dispose(); e.removed=true; DK.enemies.list=DK.enemies.list.filter(x=>x!==e); return 'ok'; })()`);
  const errs = await Promise.all(pages.map((p) => ev(p, `DK.G.state`)));
  check('Senaryo sonunda iki taraf da oyunda', errs.every((s) => s === 'playing'), errs);
  log('6b tamam @ ' + stamp());
};
