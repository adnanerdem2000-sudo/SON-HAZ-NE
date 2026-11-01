// Aşama 9 (4 oyuncu): oda kurulumu, herkes oyunda, uzak oyuncu sayıları (3/3/3/3), sohbet herkese ulaşır, ev sahibi anlık görüntüsü
// tüm konuklarda uygulanır, bir konuk sekmeyi kapatınca kalp atışıyla düşer ve diğerlerinde temizlenir, bir konuk ayrılıp aynı adla geri gelir.
module.exports = async ({ pages, host, guests, ev: ev0, tick: tick0, check, log }) => {
  const [g1, g2, g3] = guests;
  const t0 = Date.now();
  const stamp = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';
  const ev = (p, js, label) => { let to; return Promise.race([ev0(p, js, label).finally(() => clearTimeout(to)), new Promise((r) => { to = setTimeout(() => { console.log('EV-TIMEOUT', stamp(), label || js.slice(0, 60)); r(undefined); }, 60000); })]); };
  const tick = async (sec) => { console.log('tick', sec, '@', stamp()); await Promise.race([tick0(sec), new Promise((r) => setTimeout(() => { console.log('TICK-TIMEOUT', stamp()); r(); }, 180000))]); };
  const room = await ev(host, `DK.net.host({name:'Dört Kişilik Oda', public:false, max:4, pw:'', difficulty:'normal', slot:2}).then(r=>({code:r.code}))`, 'host');
  for (const g of guests) await ev(g, `DK.net.join('${room.code}','').then(r=>({room:r.room.name})).catch(e=>({err:String(e)}))`, 'join');
  await host.waitForTimeout(800);
  const roster = await ev(host, `DK.net.roster.map(r=>r.name)`, 'roster');
  check('D4-01 Lobide 4 kayıt', Array.isArray(roster) && roster.length === 4, roster);
  await ev(host, `DK.handlers.startOnlineHost(DK.net.room).then(()=>'host-started')`, 'hs');
  await host.waitForTimeout(800);
  for (const g of guests) await ev(g, `DK.G.state === 'playing' ? 'already' : DK.handlers.startOnlineGuest().then(()=>'guest-started')`, 'gs');
  for (const pg of pages) await ev(pg, `DK.engine.fpsLimit = 0.01; 'lim'`);
  await tick(2);
  const states = await Promise.all(pages.map((p) => ev(p, `DK.G.state`)));
  check('D4-02 4 oyuncu da oyunda', states.every((s) => s === 'playing'), states);
  const remotes = await Promise.all(pages.map((p) => ev(p, `DK.G.remotes.size`)));
  check('D4-03 Her oyuncu 3 uzak oyuncu görür', remotes.every((n) => n === 3), remotes);
  // sohbet: g1 → herkes
  for (const pg of pages) await ev(pg, `window._chat=0; DK.G.on('chat', ()=>window._chat++); 'ok'`);
  await ev(g1, `DK.net.chat('selam dört kişi'); 'sent'`);
  await tick(1.5);
  const chats = await Promise.all(pages.map((p) => ev(p, `window._chat`)));
  check('D4-04 Sohbet diğer 3 oyuncuya ulaşır', chats.filter((c) => c >= 1).length >= 3, chats);
  // konum eşitlemesi: g2 hareket eder, ev sahibi ve g3 uzak kopyada hareketi görür
  const before = await ev(g3, `(()=>{ const r=[...DK.G.remotes.values()].find(r=>r.name===DK.net.roster[2]?.name) || [...DK.G.remotes.values()][0]; return r ? [r.pos.x, r.pos.z] : null; })()`);
  await ev(g2, `(()=>{ const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.x += 6; p.pos.z += 4; return [p.pos.x, p.pos.z]; })()`);
  await tick(2);
  const after = await ev(g3, `(()=>{ const r=[...DK.G.remotes.values()].find(r=>r.name===DK.net.roster[2]?.name) || [...DK.G.remotes.values()][0]; return r ? [r.pos.x, r.pos.z] : null; })()`);
  check('D4-05 Konuğun hareketi diğer konukta görünür', before && after && (Math.abs(after[0] - before[0]) + Math.abs(after[1] - before[1])) > 3, { before, after });
  // ayrılıp geri gelme (g3): aynı adla yeniden katılır, roster'da çift kayıt olmaz
  const name3 = await ev(g3, `DK.G.playerName`);
  // arayüzdeki 'menüye dön' yolu: kayıt, oyunu durdurma, ağdan ayrılma
  const leftState = await ev(g3, `DK.handlers.toMenu(); DK.G.state`, 'g3-menu');
  await tick(1);
  await host.waitForTimeout(1500);
  await tick(0.5);
  const rosterAfterLeave = await ev(host, `DK.net.roster.map(r=>r.name)`);
  await ev(g3, `DK.net.join('${room.code}','').then(r=>({room:r.room.name})).catch(e=>({err:String(e)}))`, 'rejoin');
  await host.waitForTimeout(800);
  await ev(g3, `DK.G.state === 'playing' ? 'already' : DK.handlers.startOnlineGuest().then(()=>'guest-restarted')`, 'gs2');
  await ev(g3, `DK.engine.fpsLimit = 0.01; 'lim'`);
  await tick(2);
  const rosterAfterRejoin = await ev(host, `DK.net.roster.map(r=>r.name)`);
  const dup = rosterAfterRejoin && rosterAfterRejoin.filter((n) => n === name3).length;
  const g3state = await ev(g3, `DK.G.state`);
  const g3remotes = await ev(g3, `DK.G.remotes.size`);
  check('D4-06 Menüye dönen konuk aynı adla geri gelir; roster 4 kayıt, çift ad yok, 3 uzak oyuncu görür', leftState === 'menu' && g3state === 'playing' && rosterAfterRejoin && rosterAfterRejoin.length === 4 && dup === 1 && g3remotes === 3, { name3, leftState, rosterAfterLeave, rosterAfterRejoin, g3state, g3remotes });
  // sekme kapanışı (g1): kalp atışıyla en çok 20 sn'de düşer, diğer oyuncularda uzak sayısı 2 olur
  await g1.context().close();
  let waited = 0;
  while (waited < 25000 && (await ev(host, `DK.G.remotes.size`)) !== 2) { await host.waitForTimeout(1000); waited += 1000; await tick(0.2); }
  await tick(1);
  const rem = await Promise.all([host, g2, g3].map((p) => ev(p, `DK.G.remotes.size`)));
  check('D4-07 Sekmesi kapanan konuk herkeste kalkar (≤ 25 sn)', rem.every((n) => n === 2), { rem, waitedMs: waited });
  log('4 oyuncu tamam @ ' + stamp());
};
