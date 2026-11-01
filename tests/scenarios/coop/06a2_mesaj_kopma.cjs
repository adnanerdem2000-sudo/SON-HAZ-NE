// Aşama 6a (3 oyuncu): ad temizliği/XSS, aynı adlı konuk, ev sahibi eylem efekti, oran/altın bütçesi, hasar sahteciliği,
// aşırı büyük mesaj, kopma temizliğinin diğer konuğa yayılması.
module.exports = async ({ pages, host, guests, ev: ev0, tick: tick0, check, log }) => {
  const [g1, g2] = guests;
  const t0 = Date.now();
  const stamp = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';
  // her değerlendirme en çok 45 sn: asılı kalan sayfa senaryoyu kilitlemesin
  const ev = (p, js, label) => { let to; return Promise.race([ev0(p, js, label).finally(() => clearTimeout(to)), new Promise((r) => { to = setTimeout(() => { console.log('EV-TIMEOUT', stamp(), label || js.slice(0, 60)); r(undefined); }, 45000); })]); };
  const tick = async (sec) => { console.log('tick', sec, '@', stamp()); await Promise.race([tick0(sec), new Promise((r) => setTimeout(() => { console.log('TICK-TIMEOUT', stamp()); r(); }, 120000))]); };
  const room = await ev(host, `DK.net.host({name:'Güvenlik Odası 2', public:false, max:4, pw:'', difficulty:'normal', slot:2}).then(r=>({code:r.code}))`, 'host');
  for (const g of guests) await ev(g, `DK.net.join('${room.code}','').then(r=>({room:r.room.name})).catch(e=>({err:String(e)}))`, 'join');
  await host.waitForTimeout(800);
  await ev(host, `DK.handlers.startOnlineHost(DK.net.room).then(()=>'host-started')`, 'hs');
  await host.waitForTimeout(800);
  for (const g of guests) await ev(g, `DK.G.state === 'playing' ? 'already' : DK.handlers.startOnlineGuest().then(()=>'guest-started')`, 'gs');
  for (const pg of pages) await ev(pg, `DK.engine.fpsLimit = 0.01; 'lim'`);
  await tick(1);
  const states = await Promise.all(pages.map((p) => ev(p, `DK.G.state`)));
  check('3 oyuncu da oyunda', states.every((s) => s === 'playing'), states);
  // aşırı büyük mesaj (200 KB sohbet) düşürülür, normal sohbet işlenir
  log('büyük mesaj @ ' + stamp());
  await ev(host, `window.__chats=0; DK.G.on('chat', ()=>{ window.__chats++; }); 'ok'`);
  await ev(g1, `DK.net.toHost({ t:'chat', text: 'A'.repeat(200000) }); DK.net.toHost({ t:'chat', text: 'normal mesaj' }); 'sent'`);
  await tick(1.5);
  const chats = await ev(host, `window.__chats`, 'chats');
  check('H07/H22 200 KB sohbet düşürülür, normal sohbet işlenir', chats === 1, chats);
  // kopma temizliği: g1 dümeni alır, sonra bağlantısı kopar → ev sahibi ve g2'de kilit kalkar
  log('kopma temizliği @ ' + stamp());
  const shipId = await ev(host, `DK.G.ship.id`);
  await ev(g1, `(()=>{ const p=DK.G.player, s=DK.G.ships.find(x=>x.id==='${shipId}'); p.boardShip(s, s.model.stations.helm.clone()); DK.shipControl.takeHelm(p, s); return DK.interact.locks.get('${shipId}:helm'); })()`, 'g1-helm');
  await tick(1.5);
  const lockBefore = await ev(g2, `DK.interact.locks.get('${shipId}:helm') || null`, 'g2-lock-before');
  const lockHostBefore = await ev(host, `DK.interact.locks.get('${shipId}:helm') || null`, 'host-lock-before');
  await g1.context().close();
  // kopma algısı gerçek zamanlıdır (WebRTC 'close'): benzetim adımlarından bağımsız, en çok 30 sn beklenir
  let waited = 0;
  while (waited < 30000 && (await ev(host, `DK.G.remotes.size`)) !== 1) { await host.waitForTimeout(1000); waited += 1000; await tick(0.2); }
  log('kopma algılandı @ ' + stamp() + ' (bekleme ' + waited + ' ms)');
  await tick(1);
  const lockHost = await ev(host, `DK.interact.locks.get('${shipId}:helm') || null`);
  const lockG2 = await ev(g2, `DK.interact.locks.get('${shipId}:helm') || null`);
  const remotesHost = await ev(host, `DK.G.remotes.size`);
  check('H13 Kopan konuğun dümen kilidi ev sahibinde ve diğer konukta kalkar', lockBefore && lockHostBefore && !lockHost && !lockG2 && remotesHost === 1, { lockBefore, lockHostBefore, lockHost, lockG2, remotesHost });
  log('6a-2 tamam @ ' + stamp());
};
