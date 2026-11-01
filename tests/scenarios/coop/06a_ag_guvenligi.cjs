// Aşama 6a (3 oyuncu): ad temizliği/XSS, aynı adlı konuk, ev sahibi eylem efekti, oran/altın bütçesi, hasar sahteciliği,
// aşırı büyük mesaj, kopma temizliğinin diğer konuğa yayılması.
module.exports = async ({ pages, host, guests, ev: ev0, tick: tick0, check, log }) => {
  const [g1, g2] = guests;
  const t0 = Date.now();
  const stamp = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';
  // her değerlendirme en çok 45 sn: asılı kalan sayfa senaryoyu kilitlemesin
  const ev = (p, js, label) => { let to; return Promise.race([ev0(p, js, label).finally(() => clearTimeout(to)), new Promise((r) => { to = setTimeout(() => { console.log('EV-TIMEOUT', stamp(), label || js.slice(0, 60)); r(undefined); }, 45000); })]); };
  const tick = async (sec) => { console.log('tick', sec, '@', stamp()); await Promise.race([tick0(sec), new Promise((r) => setTimeout(() => { console.log('TICK-TIMEOUT', stamp()); r(); }, 120000))]); };
  const hostName = await ev(host, `DK.G.profile.appearance.name`);
  await ev(g1, `DK.G.profile.appearance.name = '<img src=x onerror=alert(1)>Kötü'; 'ok'`);
  await ev(g2, `DK.G.profile.appearance.name = ${JSON.stringify(hostName)}; 'ok'`); // ev sahibiyle aynı ad
  const room = await ev(host, `DK.net.host({name:'Güvenlik Odası', public:false, max:4, pw:'', difficulty:'normal', slot:2}).then(r=>({code:r.code}))`, 'host');
  for (const g of guests) await ev(g, `DK.net.join('${room.code}','').then(r=>({room:r.room.name})).catch(e=>({err:String(e)}))`, 'join');
  await host.waitForTimeout(800);
  const rosterHost = await ev(host, `DK.net.roster.map(r=>({id:r.id===DK.G.myId?'HOST':'guest', name:r.name}))`, 'roster');
  check('H02 Konuk adı HTML\'den arındırılır (roster)', rosterHost && rosterHost.every(r => !/[<>]/.test(r.name) && r.name.length > 0 && r.name.length <= 20) && rosterHost.some(r => r.name === 'Kötü'), rosterHost);
  check('H04 Ev sahibiyle aynı adlı konuk ev sahibini listeden düşürmez', rosterHost && rosterHost.length === 3 && rosterHost.some(r => r.id === 'HOST'), rosterHost);
  await ev(host, `DK.handlers.startOnlineHost(DK.net.room).then(()=>'host-started')`, 'hs');
  await host.waitForTimeout(800);
  for (const g of guests) await ev(g, `DK.G.state === 'playing' ? 'already' : DK.handlers.startOnlineGuest().then(()=>'guest-started')`, 'gs');
  for (const pg of pages) await ev(pg, `DK.engine.fpsLimit = 0.01; 'lim'`); // çizim döngüsü fiilen durur (100 sn'de bir kare); benzetim tick (DK.sim) ile ilerler
  await tick(2);
  const states = await Promise.all(pages.map((p) => ev(p, `DK.G.state`)));
  check('3 oyuncu da oyunda', states.every((s) => s === 'playing'), states);
  // HUD takım listesi: XSS yok
  await ev(host, `DK.ui && DK.ui.hud ? 'x' : 'y'`);
  const team = await ev(host, `(()=>{ const tl=document.getElementById('team-list'); return { html: tl ? tl.innerHTML.slice(0,300) : null, hasImg: !!(tl && tl.querySelector('img')), text: tl ? tl.textContent : null }; })()`, 'team');
  check('H02 HUD takım listesinde script/img etiketi yok', team && !team.hasImg && !/<img|onerror/.test(team.html || '') && /Kötü/.test(team.text || ''), team);
  // ev sahibi eylem efekti konukta
  await ev(g1, `window.__acts=0; const o=DK.net._remoteAct.bind(DK.net); DK.net._remoteAct=(pid,m)=>{ window.__acts++; o(pid,m); }; 'ok'`);
  await ev(host, `DK.G.emit('netAction', { a: 'shoot', dir: [0,0,1] }); 'ok'`);
  await tick(1);
  const acts = await ev(g1, `window.__acts`, 'acts');
  check('H11 Ev sahibinin atış efekti konukta işlenir', acts >= 1, acts);
  // altın bütçesi: 300 × 100 altın → en çok 20000 (dakikalık bütçe)
  log('altın bütçesi @ ' + stamp());
  const gold0 = await ev(host, `DK.G.player.inv.gold`);
  await ev(g1, `for (let i=0;i<300;i++) DK.net.toHost({ t:'gold', amount: 100 }); 'sent'`);
  await tick(2);
  const gold1 = await ev(host, `DK.G.player.inv.gold`);
  check('H07 Altın paylaşım bütçesi: 30000 istenen, ≤20000 işlenir', gold1 - gold0 <= 20000 && gold1 - gold0 > 0, { delta: gold1 - gold0 });
  // hasar sahteciliği: 300 m uzaktaki düşmana 99999 hasar
  log('hasar sahteciliği @ ' + stamp());
  const eid = await ev(host, `(()=>{ const p=DK.G.player; const e=DK.enemies.spawn('haydut', p.pos.x+300, p.pos.z, {role:'sentry'}); e.pos.set(p.pos.x+300, DK.terrain.heightAt(p.pos.x+300,p.pos.z), p.pos.z); window.__e=e; return e.id; })()`, 'enemy');
  await tick(1);
  await ev(g1, `DK.net.toHost({ t:'hurtEnemy', id: '${eid}', dmg: 99999, kind: 'melee' }); 'sent'`);
  await tick(1);
  const hpFar = await ev(host, `({hp: window.__e.hp, max: window.__e.maxHp, alive: window.__e.alive})`, 'hp-far');
  check('H07 Uzaktan sahte hasar ev sahibinde işlenmez', hpFar && hpFar.hp === hpFar.max && hpFar.alive, hpFar);
  // yakından aşırı hasar: üst sınıra kırpılır
  const gpos = await ev(host, `(()=>{ const e=window.__e; return [e.pos.x+1.5, e.pos.y, e.pos.z]; })()`);
  await ev(g1, `(()=>{ const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(${gpos[0]}, ${gpos[1]}+0.1, ${gpos[2]}); p.vel.set(0,0,0); return 'moved'; })()`);
  await tick(1.5);
  await ev(g1, `DK.net.toHost({ t:'hurtEnemy', id: '${eid}', dmg: 99999, kind: 'melee' }); 'sent'`);
  await tick(1);
  const hpNear = await ev(host, `({hp: window.__e.hp, max: window.__e.maxHp, rd: (()=>{ const r=[...DK.G.remotes.values()][0]; return r? Math.round(Math.hypot(r.pos.x-window.__e.pos.x, r.pos.z-window.__e.pos.z)) : null; })()})`, 'hp-near');
  check('H07 Yakından sahte 99999 hasar üst sınıra (≤160×1.25) kırpılır', hpNear && hpNear.max - hpNear.hp > 0 && hpNear.max - hpNear.hp <= 200, hpNear);
  // aşırı büyük mesaj (200 KB sohbet) düşürülür
  log('büyük mesaj @ ' + stamp());
  await ev(host, `window.__chats=0; DK.G.on('chat', ()=>{ window.__chats++; }); 'ok'`);
  await ev(g1, `DK.net.toHost({ t:'chat', text: 'A'.repeat(200000) }); DK.net.toHost({ t:'chat', text: 'normal mesaj' }); 'sent'`);
  await tick(2);
  const chats = await ev(host, `window.__chats`, 'chats');
  check('H07/H22 200 KB sohbet düşürülür, normal sohbet işlenir', chats === 1, chats);
  // kopma temizliği: g1 dümeni alır, sonra bağlantısı kopar → ev sahibi ve g2'de kilit kalkar
  log('kopma temizliği @ ' + stamp());
  const shipId = await ev(host, `DK.G.ship.id`);
  await ev(g1, `(()=>{ const p=DK.G.player, s=DK.G.ships.find(x=>x.id==='${shipId}'); p.boardShip(s, s.model.stations.helm.clone()); DK.shipControl.takeHelm(p, s); return DK.interact.locks.get('${shipId}:helm'); })()`, 'g1-helm');
  await tick(1.5);
  const lockBefore = await ev(g2, `DK.interact.locks.get('${shipId}:helm') || null`, 'g2-lock-before');
  await g1.context().close();
  await tick(4);
  const lockHost = await ev(host, `DK.interact.locks.get('${shipId}:helm') || null`);
  const lockG2 = await ev(g2, `DK.interact.locks.get('${shipId}:helm') || null`);
  const remotesHost = await ev(host, `DK.G.remotes.size`);
  check('H13 Kopan konuğun dümen kilidi ev sahibinde ve diğer konukta kalkar', lockBefore && !lockHost && !lockG2 && remotesHost === 1, { lockBefore, lockHost, lockG2, remotesHost });
  log('6a tamam');
};
