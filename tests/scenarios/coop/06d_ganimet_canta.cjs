// Co-op (2 oyuncu): "yerden aldıklarımız çantamıza" ve av ganimeti.
// 1) Konuğun envanterden "Yere bırak" düğmesi: kese ev sahibinde doğar (önce yalnız konuğun ekranında doğuyor, geri alınamıyordu),
//    konuk aynı keseyi geri alır. 2) Konuğun açtığı sandığın içeriği doğrudan konuğun çantasına gider (ev sahibinde kese doğmaz).
// 3) Kısmen sığan kese ev sahibinde yerinde kalır, konuktaki kopyanın içeriği güncellenir. 4) Güverteye düşen kese konukta da
// gemiye bağlıdır. 5) Konuğun öldürdüğü hayvan ev sahibinde öldüreni (konuğu) taşır (XP payı).
module.exports = async ({ pages, host, guests, ev: ev0, tick: tick0, check, log }) => {
  const g = guests[0];
  const t0 = Date.now();
  const stamp = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';
  const ev = (p, js, label) => { let to; return Promise.race([ev0(p, js, label).finally(() => clearTimeout(to)), new Promise((r) => { to = setTimeout(() => { console.log('EV-TIMEOUT', stamp(), label || js.slice(0, 60)); r(undefined); }, 45000); })]); };
  const tick = async (sec) => { await Promise.race([tick0(sec), new Promise((r) => setTimeout(() => { console.log('TICK-TIMEOUT', stamp()); r(); }, 120000))]); };
  const room = await ev(host, `DK.net.host({name:'Ganimet Odası', public:false, max:4, pw:'', difficulty:'normal', slot:2}).then(r=>({code:r.code}))`, 'host');
  let joined = null;
  for (let k = 0; k < 4 && !(joined && joined.room); k++) { if (k) await host.waitForTimeout(1500); joined = await ev(g, `DK.net.join('${room.code}','').then(r=>({room:r.room.name})).catch(e=>({err:String(e)}))`, 'join'); }
  check('Konuk odaya bağlandı', !!(joined && joined.room), joined);
  await host.waitForTimeout(800);
  await ev(host, `DK.handlers.startOnlineHost(DK.net.room).then(()=>'host-started')`, 'hs');
  await host.waitForTimeout(800);
  await ev(g, `DK.G.state === 'playing' ? 'already' : DK.handlers.startOnlineGuest().then(()=>'guest-started')`, 'gs');
  for (const pg of pages) await ev(pg, `DK.engine.fpsLimit = 0.01; DK.G.godMode = true; 'lim'`);
  await tick(2);
  const gid = await ev(g, `DK.G.myId`);
  check('2 oyuncu oyunda ve bağlı', (await ev(host, `DK.G.state`)) === 'playing' && (await ev(g, `DK.G.state`)) === 'playing' && (await ev(host, `DK.G.remotes.size`)) === 1);
  const place = (x, z) => `(()=>{ const p=DK.G.player; if (p.mode==='swim') p.exitWater(); p.mode='ground'; p.ship=null; p.carrying=null; p.pos.set(${x}, DK.physics.groundAt(${x},${z}), ${z}); p.vel.set(0,0,0); p.onGround=true; return [+p.pos.x.toFixed(1), +p.pos.z.toFixed(1)]; })()`;
  await ev(host, place(-34, 200));
  await ev(g, place(-30, 200));
  await tick(1.5);

  // 1) konuk envanterden "Yere bırak" (gerçek panel düğmesi) → ev sahibinde kese → konuk geri alır
  log('1 yere bırak @ ' + stamp());
  const drop = await ev(g, `(async()=>{ const p=DK.G.player; const {panels}=await import('./js/ui/panels.js'); p.inv.add('ekmek', 2); const st=p.inv.stacks.find(s=>s.id==='ekmek'); window.__nE=p.inv.count('ekmek'); panels._itemMenu(st, null); const btn=[...document.querySelectorAll('button')].find(b=>b.textContent==='Yere bırak'); if (btn) btn.click(); DK.ui.closeAll && DK.ui.closeAll(); return {btn:!!btn, n:window.__nE, left:p.inv.count('ekmek')}; })()`, 'g-drop');
  await tick(2.5);
  const hostPk = await ev(host, `(()=>{ const pk=DK.treasure.pickups.find(q=>!q.remove && q.from==='Bırakılan' && q.items.some(i=>i[0]==='ekmek')); return pk ? {id:pk.id, keep:!!pk.keep, body:!!pk.body, n:pk.items.find(i=>i[0]==='ekmek')[1]} : null; })()`, 'h-drop');
  const guestSees = hostPk ? await ev(g, `DK.treasure.pickups.some(q=>q.id==='${hostPk.id}' && !q.remove)`) : false;
  check('C01 Konuğun "Yere bırak"ı ev sahibinde kese olarak doğar (fizikli, uzun ömürlü) ve konukta aynı kimlikle görünür', !!drop?.btn && drop.left === 0 && !!hostPk && hostPk.n === drop.n && hostPk.keep && hostPk.body && guestSees, { drop, hostPk, guestSees });
  if (hostPk) {
    await ev(g, `(()=>{ const p=DK.G.player; const pk=DK.treasure.pickups.find(q=>q.id==='${hostPk.id}'); p.pos.set(pk.pos.x+0.5, DK.physics.groundAt(pk.pos.x+0.5, pk.pos.z), pk.pos.z); DK.treasure.collect(p, pk); return 'req'; })()`);
    await tick(2);
    const back = await ev(g, `DK.G.player.inv.count('ekmek')`);
    const goneH = await ev(host, `!DK.treasure.pickups.some(q=>q.id==='${hostPk.id}' && !q.remove)`);
    check('C02 Konuk bıraktığı keseyi geri alır: eşya konuğun çantasına döner, kese ev sahibinde kalkar', back === drop.n && goneH, { back, goneH });
  }

  // 2) konuğun açtığı sandık: içerik doğrudan konuğun çantasına, ev sahibinde kese doğmaz
  log('2 sandık @ ' + stamp());
  const gpos = await ev(g, `DK.G.player.pos.toArray()`);
  const chest = await ev(host, `(()=>{ const c=DK.treasure.spawnChest('small', new DK.THREE.Vector3(${gpos[0]}+1.2, ${gpos[1]}, ${gpos[2]})); window.__pkN=DK.treasure.pickups.filter(q=>!q.remove).length; return {id:c.id, coins:c.contents.filter(x=>x[0]==='altin_para').reduce((a,x)=>a+x[1],0)}; })()`, 'h-chest');
  await tick(1.5);
  const g0 = await ev(g, `(()=>{ window.__gold0=DK.G.player.inv.gold; const c=DK.treasure.chestById('${chest.id}'); if (!c) return 'yok'; DK.treasure.open(DK.G.player, c); return 'req'; })()`, 'g-open');
  await tick(2);
  const gGot = await ev(g, `DK.G.player.inv.gold - window.__gold0`);
  const hSacks = await ev(host, `DK.treasure.pickups.filter(q=>!q.remove).length - window.__pkN`);
  const chestGone = await ev(g, `!DK.treasure.chestById('${chest.id}')`);
  check('C03 Konuğun açtığı sandığın altını doğrudan konuğun çantasına gider; ev sahibinde kese doğmaz; sandık iki tarafta da kalkar', g0 === 'req' && gGot === chest.coins && hSacks === 0 && chestGone, { g0, gGot, coins: chest.coins, hSacks, chestGone });

  // 3) ev sahibinde kısmen sığan kese yerinde kalır; konuk kopyası güncellenir
  log('3 kısmi @ ' + stamp());
  const part = await ev(host, `(()=>{ const p=DK.G.player, TH=DK.THREE; window.__keep=JSON.parse(JSON.stringify(p.inv.toJSON())); const X=p.inv.free()-3; if (X>0) p.inv.stacks.push({id:'balik:ballast', n:1, data:{key:'ballast', name:'Ağırlık', weight:X}}); const pk=DK.treasure.spawnLoot(p.pos.clone().add(new TH.Vector3(0.8,0.3,0)), [['hayvan_postu',1,3]], 'Test', true, {still:true}); window.__ppk=pk; return pk.id; })()`, 'h-part');
  await tick(1.5);
  await ev(host, `(()=>{ DK.treasure.collect(DK.G.player, window.__ppk); return 'ok'; })()`);
  await tick(1.5);
  const hp = await ev(host, `(()=>{ const pk=window.__ppk; const r={alive:DK.treasure.pickups.includes(pk) && !pk.remove, items:pk.items}; DK.G.player.inv.load(window.__keep); return r; })()`, 'h-part2');
  const gp = await ev(g, `(()=>{ const pk=DK.treasure.pickups.find(q=>q.id==='${part}'); return pk ? {alive:!pk.remove, items:pk.items} : null; })()`, 'g-part');
  const nH = hp?.items?.find((i) => i[0] === 'hayvan_postu')?.[1], nG = gp?.items?.find((i) => i[0] === 'hayvan_postu')?.[1];
  check('C04 Ev sahibinde kısmen sığan kese yerinde kalır (1 post alındı, 2 kaldı); konuktaki kopya da 2 post gösterir', hp?.alive && nH === 2 && gp?.alive && nG === 2, { hp, gp });
  await ev(host, `(()=>{ window.__ppk.remove=true; return 'ok'; })()`);

  // 4) güverteye düşen kese konukta da gemiye bağlı
  log('4 güverte @ ' + stamp());
  const deck = await ev(host, `(()=>{ const s=DK.G.ship, TH=DK.THREE; const W=s.localToWorld(new TH.Vector3(0.2, s.deckAt(0.2,0.8)+0.6, 0.8)); const pk=DK.treasure.spawnLoot(W, [['mermi',1,6]], 'Bordacı', true); return {id:pk.id, ship:s.id, att:!!pk.ship, pos:pk.pos.toArray().map(v=>+v.toFixed(2))}; })()`, 'h-deck');
  await tick(2);
  const gDeck = await ev(g, `(()=>{ const pk=DK.treasure.pickups.find(q=>q.id==='${deck.id}'); if (!pk) return null; const s=DK.G.ships.find(x=>x.id==='${deck.ship}'); return {ship:pk.ship?.id||null, parent:pk.mesh.parent===s?.root, dy:+(pk.pos.y-DK.ocean.heightAt(pk.pos.x,pk.pos.z)).toFixed(2), d:+Math.hypot(pk.pos.x-${deck.pos[0]}, pk.pos.z-${deck.pos[2]}).toFixed(2)}; })()`, 'g-deck');
  check('C05 Güverteye düşen kese konukta da gemiye bağlıdır (suya düşmez, ev sahibiyle aynı yerde)', deck.att && gDeck && gDeck.ship === deck.ship && gDeck.parent && gDeck.dy > 0.8 && gDeck.d < 1.5, { deck, gDeck });
  await ev(host, `(()=>{ const pk=DK.treasure.pickups.find(q=>q.id==='${deck.id}'); if (pk) pk.remove=true; return 'ok'; })()`);

  // 5) konuğun öldürdüğü hayvan: ev sahibindeki olay öldüren olarak konuğu taşır
  log('5 av @ ' + stamp());
  const an = await ev(host, `(async()=>{ const z=DK.animals.zones.find(z=>z.kind==='boar') || DK.animals.zones[0]; await DK.terrain.prepare(z.x, z.z, {radius: 160}); const p=DK.G.player; p.pos.set(z.x+10, DK.physics.groundAt(z.x+10, z.z), z.z); window.__by='-'; DK.G.on('animalKilled', (e)=>{ window.__by=e.by; }); DK.sim(2,1/30); const a=DK.animals.list.find(x=>x.alive && Math.hypot(x.pos.x-z.x, x.pos.z-z.z)<80); return a ? {id:a.id, x:a.pos.x, z:a.pos.z} : {zx:z.x, zz:z.z}; })()`, 'h-animal');
  if (an && an.id) {
    await ev(g, `(async()=>{ await DK.terrain.prepare(${an.x}, ${an.z}, {radius: 120}); const p=DK.G.player; p.pos.set(${an.x}+4, DK.physics.groundAt(${an.x}+4, ${an.z}), ${an.z}); return 'ok'; })()`, 'g-move');
    await tick(1.5);
    await ev(g, `(()=>{ const a=DK.animals.byId ? DK.animals.byId('${an.id}') : DK.animals.list.find(x=>x.id==='${an.id}'); if (!a) return 'yok'; a.hurt(9999, {pos: DK.G.player.pos.clone(), by: DK.G.myId}); return 'hit'; })()`, 'g-hit');
    await tick(2);
    const by = await ev(host, `window.__by`);
    check('C06 Konuğun öldürdüğü hayvan ev sahibinde öldüren olarak konuğu taşır (XP konuğa)', by === gid, { by, gid });
  } else check('C06 Konuğun öldürdüğü hayvan ev sahibinde öldüren olarak konuğu taşır (XP konuğa)', false, an);
  const st = await Promise.all(pages.map((p) => ev(p, `DK.G.state`)));
  check('Senaryo sonunda iki taraf da oyunda', st.every((s) => s === 'playing'), st);
  log('06d tamam @ ' + stamp());
};
