// B2-D2 tanısı (co-op, ölçüm; oyun koduna dokunmaz): oda sahibinin hızlı yolculuk perdesi (örtü) sürerken konuğa giden anlık
// görüntüler ('snap'). Düzeltmeden önce örtü motorun kare sınırını 0,25 FPS'e indiriyordu: oda sahibinin bütün döngüsü (net.update
// dahil) perde boyunca durur, konuk bu pencerede ~0 anlık görüntü alır. Düzeltmeden sonra yalnız çizim atlanır: net.update her
// karede çalışır. Döngü iki sayfada da fpsLimit 10 ile sınırlanır (iki sayfanın yazılımsal çizim yükü düşük kalsın; örtü bu sınıra
// önce 0,25 ile dokunuyordu, sonra dokunmaz). Sayfalar arası zaman Date.now ile karşılaştırılır.
//   node tests/harness/coop.cjs <bu dosya> --players 2 --size 640x360 --timeout 400 \
//        --url "http://localhost:8085/index.html?peerhost=127.0.0.1&peerport=9000"
module.exports = async ({ pages, host, guests, ev, tick, check, log }) => {
  const g = guests[0];
  const oda = await ev(host, `DK.net.host({name:'Örtü Odası', public:false, max:4, pw:'', difficulty:'normal', slot:2}).then(r=>({code:r.code}))`, 'host');
  await ev(g, `DK.net.join('${oda && oda.code}','').then(r=>({room:r.room.name})).catch(e=>({err:String(e)}))`, 'join');
  await host.waitForTimeout(800);
  await ev(host, `DK.handlers.startOnlineHost(DK.net.room).then(()=>'host-started')`, 'hs');
  await host.waitForTimeout(800);
  await ev(g, `DK.G.state === 'playing' ? 'already' : DK.handlers.startOnlineGuest().then(()=>'guest-started')`, 'gs');
  for (const pg of pages) await ev(pg, `DK.engine.fpsLimit = 10; DK.G.noAutoPause = true; 'lim'`);
  await host.waitForTimeout(4000);
  const hOk = await ev(host, `DK.G.state === 'playing' && DK.G.online === true && DK.G.isHost === true && !!DK.G.player`);
  const gOk = await ev(g, `DK.G.state === 'playing' && DK.G.online === true && DK.G.isHost === false && !!DK.G.player`);
  check('OK00 İki oyuncu çevrimiçi oyunda (oda sahibi + konuk)', !!(hOk && gOk), { hOk, gOk });
  if (!(hOk && gOk)) return;
  // konuk: oda sahibinden gelen anlık görüntüler (oyunun dinleyicisine dokunmayan ek 'data' dinleyicisi; iç ad DK.net.hostConn)
  const kur = await ev(g, `(()=>{ const S = window.__snaplar = []; const c = DK.net && DK.net.hostConn; if (!c || typeof c.on !== 'function') return 'iç ad yok: DK.net.hostConn'; c.on('data', (m) => { if (m && m.t === 'snap') S.push(Date.now()); }); return 'kuruldu'; })()`, 'g-kur');
  await host.waitForTimeout(3000);
  // oda sahibi: hızlı yolculuk (ücret 0); kilit (perde) başlangıcı yayım anı (eşzamanlı), bitişi 5 ms'lik yoklama; kilit süresince döngü tiki
  const yola = await ev(host, `(()=>{ const T = window.__O = { tik: 0, t0: 0, t1: 0, varis: 0 }; DK.engine.updaters.add(() => { if (DK.input.isBlocked()) T.tik++; });
    DK.G.on('arrivedPort', () => { if (!T.varis) T.varis = Date.now(); });
    const iv = setInterval(() => { if (T.t0 && !T.t1 && !DK.input.isBlocked()) { T.t1 = Date.now(); clearInterval(iv); } }, 5);
    DK.G.player.inv.gold = 2000; T.fps0 = DK.engine.fpsLimit; T.t0 = Date.now(); DK.G.emit('fastTravel', { to: 'tuz_pazari_port_0', from: 'kirlangic_limani', cost: 0 }); T.kilit = DK.input.isBlocked(); T.fpsOrtu = DK.engine.fpsLimit; return { kilit: T.kilit, fps0: T.fps0, fpsOrtu: T.fpsOrtu }; })()`, 'h-yola');
  const H = await ev(host, `(async()=>{ const T = window.__O; const t0 = Date.now(); while (Date.now() - t0 < 120000 && !T.t1) await new Promise((r) => setTimeout(r, 100)); await new Promise((r) => setTimeout(r, 1500)); return { kilit: T.kilit, blokMs: T.t1 ? T.t1 - T.t0 : null, tik: T.tik, t0: T.t0, t1: T.t1, varis: !!T.varis, fps0: T.fps0, fpsOrtu: T.fpsOrtu, fpsSon: DK.engine.fpsLimit }; })()`, 'h-son');
  log && log('oda sahibi: ' + JSON.stringify(H));
  if (!H || !H.t1) { check('OK01 Önkoşul: oda sahibinin hızlı yolculuğu tamamlandı ve perde (girdi kilidi) ≥ 1 sn sürdü', false, H); return; }
  const S = await ev(g, `(()=>{ const S = window.__snaplar || [], a = ${H.t0}, b = ${H.t1}; const ic = S.filter((t) => t > a + 200 && t < b - 50).length, pencere = b - a - 250;
    return { kur: ${JSON.stringify(kur)}, icinde: ic, pencereMs: pencere, hz: pencere > 0 ? +(ic / (pencere / 1000)).toFixed(1) : null, once3sn: S.filter((t) => t > a - 3000 && t <= a).length, sonra1sn: S.filter((t) => t >= b && t < b + 1000).length }; })()`, 'g-say');
  log && log('konuk: ' + JSON.stringify(S));
  check('OK01 Önkoşul: oda sahibinin hızlı yolculuğu tamamlandı, perde (girdi kilidi) ≥ 1 sn sürdü; konuk yolculuktan önceki 3 sn\'de ≥ 10 anlık görüntü aldı', !!H.kilit && H.varis && H.blokMs >= 1000 && !!S && S.once3sn >= 10, { H, S });
  check('OK02 Oda sahibinin hızlı yolculuk perdesi sürerken konuk anlık görüntü almayı sürdürür (≥ 5/sn; B2-D2: örtü yalnız çizimi atlar)', !!S && S.hz >= 5, S);
  check('OK03 Oda sahibinin perde süresince döngüsü sürer (güncelleyici tiki ≥ 5) ve örtü motorun kare sınırına dokunmaz', H.tik >= 5 && H.fpsOrtu === H.fps0 && H.fpsSon === H.fps0, { tik: H.tik, fps0: H.fps0, fpsOrtu: H.fpsOrtu, fpsSon: H.fpsSon });
};
module.exports.meta = { testler: ['B2-D2 tanı: oda sahibinin örtüsü sırasında konuğa anlık görüntüler'], dosyalar: ['js/game/game.js', 'js/core/engine.js', 'js/net/net.js'], olcum: true };
