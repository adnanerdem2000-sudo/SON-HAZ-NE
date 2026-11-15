// B2 tanı (madde 7 çağıran tarafı, konuk ışınlanması): konukta terrain.prepare tanı için sarılır (asıl hazırlıktan sonra 'timeout').
// Oda sahibi hızlı yolculuk yapınca konuk taşınmalı ve 'warn' türünde, "vardınız" içermeyen bir bildirim de almalı.
module.exports = async ({ pages, host, guests, ev, tick, check, log }) => {
  const g = guests[0];
  const oda = await ev(host, `DK.net.host({name:'Tanı Odası', public:false, max:4, pw:'', difficulty:'normal', slot:2}).then(r=>({code:r.code}))`, 'host');
  await ev(g, `DK.net.join('${oda && oda.code}','').then(r=>({room:r.room.name})).catch(e=>({err:String(e)}))`, 'join');
  await host.waitForTimeout(800);
  await ev(host, `DK.handlers.startOnlineHost(DK.net.room).then(()=>'host-started')`, 'hs');
  await host.waitForTimeout(800);
  await ev(g, `DK.G.state === 'playing' ? 'already' : DK.handlers.startOnlineGuest().then(()=>'guest-started')`, 'gs');
  for (const pg of pages) await ev(pg, `DK.engine.fpsLimit = 0.01; DK.G.noAutoPause = true; 'lim'`);
  await tick(2);
  const kur = await ev(g, `(()=>{ const T = DK.terrain; const o = T.prepare; T.prepare = async function () { await o.apply(this, arguments); return 'timeout'; };
    const B = window.__B = []; DK.G.on('notify', (n) => B.push({ text: String(n && n.text), kind: n && n.kind, t: performance.now() })); return DK.G.state; })()`, 'g-kur');
  check('TK00 İki oyuncu oyunda, konukta prepare sarıldı', kur === 'playing', { kur });
  const A = await ev(host, `(()=>{ const p = DK.G.player; p.inv.gold = 2000; const A = DK.ports.byId('tuz_pazari_port_0'), H = DK.ports.byId('kirlangic_limani'); DK.G.emit('fastTravel', { to: A.id, from: H.id, cost: 10 }); return { bx: A.boarding.x, bz: A.boarding.z }; })()`, 'h-ft');
  const son = await ev(g, `(async()=>{ const t0 = performance.now(); let p = DK.G.player; while (performance.now() - t0 < 120000) { if (Math.hypot(p.pos.x - ${A.bx}, p.pos.z - ${A.bz}) < 30 && window.__B.some((b) => /vardınız/.test(b.text))) break; await new Promise((r) => setTimeout(r, 200)); }
    await new Promise((r) => setTimeout(r, 500)); return { uzaklik: Math.round(Math.hypot(p.pos.x - ${A.bx}, p.pos.z - ${A.bz})), bildirim: window.__B.map((b) => [b.kind, b.text]) }; })()`, 'g-son');
  check("TK01 Konuk ışınlanmasında prepare 'timeout' → konuk taşınır ve 'warn' türünde hazırlık uyarısı alır (vardınız içermez)", !!son && son.uzaklik <= 30 && son.bildirim.some(([k, t]) => k === 'warn' && !/vardınız/.test(t) && /hazırlanamadı/.test(t)), son);
};
module.exports.meta = { testler: ['B2 tanı: konuk ışınlanması timeout bildirimi'], dosyalar: ['js/net/net.js'], olcum: true };
