// B2-D2 tanısı (co-op, ölçüm; oyun koduna dokunmaz): oda sahibinin hızlı yolculuk perdesi (örtü) sürerken oda sahibinin döngüsü ve
// konuğa giden anlık görüntüler ('snap'). Düzeltmeden önce örtü motorun kare sınırını 0,25 FPS'e indiriyordu: oda sahibinin bütün
// döngüsü (net.update dahil) perde boyunca durur. Düzeltmeden sonra yalnız çizim atlanır: döngü her rAF karesinde sürer.
// Ölçüm ortamdan bağımsız olsun diye (ilk sürüm: iki sayfa aynı yazılımsal GPU'yu paylaşınca oda sahibinin rAF hızı ~1,7 Hz'e düşüyordu):
//  - konuğun çizimi durdurulur (fpsLimit 0,01): anlık görüntüler PeerJS geri çağrısıyla sayılır, konuğun döngüsünden bağımsızdır;
//  - oda sahibinde döngü fpsLimit 10 ile sınırlanır; perde uzatılır: oda sahibinin varış hazırlığı (yarıçap 450) 4 sn geciktirilir
//    (yalnız bu sayfada; bekleme yolculuğun kendi perdesi ve kilidi altında geçer);
//  - oda sahibinde motordan bağımsız bir rAF sayacı tutulur: "tarayıcı rAF vermiyor" ile "motor tiklemiyor" ayrılır.
// Pencere: perdenin ilk 1,5 sn'si (perde inişi ve önceki karelerin GPU birikimi) dışarıda bırakılır. Sayfalar arası zaman Date.now.
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
  await ev(host, `DK.engine.fpsLimit = 10; DK.G.noAutoPause = true; 'lim'`);
  await ev(g, `DK.engine.fpsLimit = 0.01; DK.G.noAutoPause = true; 'lim'`);
  await host.waitForTimeout(4000);
  const hOk = await ev(host, `DK.G.state === 'playing' && DK.G.online === true && DK.G.isHost === true && !!DK.G.player`);
  const gOk = await ev(g, `DK.G.state === 'playing' && DK.G.online === true && DK.G.isHost === false && !!DK.G.player`);
  check('OK00 İki oyuncu çevrimiçi oyunda (oda sahibi + konuk)', !!(hOk && gOk), { hOk, gOk });
  if (!(hOk && gOk)) return;
  const kur = await ev(g, `(()=>{ const S = window.__snaplar = []; const c = DK.net && DK.net.hostConn; if (!c || typeof c.on !== 'function') return 'iç ad yok: DK.net.hostConn'; c.on('data', (m) => { if (m && m.t === 'snap') S.push(Date.now()); }); return 'kuruldu'; })()`, 'g-kur');
  // oda sahibi: motor tiki (kilitliyken ve her zaman), rAF sayacı, hazırlık gecikmesi
  await ev(host, `(()=>{ const T = window.__O = { tik: [], raf: [], t0: 0, t1: 0, varis: 0 };
    DK.engine.updaters.add(() => { T.tik.push(Date.now()); });
    const f = () => { T.raf.push(Date.now()); requestAnimationFrame(f); }; requestAnimationFrame(f);
    const o = DK.terrain.prepare; DK.terrain.prepare = function (x, z, op) { if (op && op.radius === 450 && !T.gecikti) { T.gecikti = true; const self = this, args = arguments; return new Promise((r) => setTimeout(r, 4000)).then(() => o.apply(self, args)); } return o.apply(this, arguments); };
    DK.G.on('arrivedPort', () => { if (!T.varis) T.varis = Date.now(); });
    return 'kuruldu'; })()`, 'h-kur');
  await host.waitForTimeout(3000);
  await ev(host, `(()=>{ const T = window.__O; const iv = setInterval(() => { if (T.t0 && !T.t1 && !DK.input.isBlocked()) { T.t1 = Date.now(); clearInterval(iv); } }, 5);
    DK.G.player.inv.gold = 2000; T.fps0 = DK.engine.fpsLimit; T.t0 = Date.now(); DK.G.emit('fastTravel', { to: 'tuz_pazari_port_0', from: 'kirlangic_limani', cost: 0 }); T.kilit = DK.input.isBlocked(); T.fpsOrtu = DK.engine.fpsLimit; T.cizimOrtu = !!DK.engine.skipRender; return { kilit: T.kilit, fps0: T.fps0, fpsOrtu: T.fpsOrtu }; })()`, 'h-yola');
  const H = await ev(host, `(async()=>{ const T = window.__O; const t0 = Date.now(); while (Date.now() - t0 < 120000 && !T.t1) await new Promise((r) => setTimeout(r, 100)); await new Promise((r) => setTimeout(r, 1500));
    const a = T.t0 + 1500, b = T.t1 - 100, say = (L, x, y) => L.filter((t) => t > x && t < y).length, sn = (b - a) / 1000;
    return { kilit: T.kilit, blokMs: T.t1 ? T.t1 - T.t0 : null, t0: T.t0, t1: T.t1, a, b, pencereSn: +sn.toFixed(2), varis: !!T.varis, fps0: T.fps0, fpsOrtu: T.fpsOrtu, fpsSon: DK.engine.fpsLimit, cizimOrtu: T.cizimOrtu,
      tikOnceHz: +(say(T.tik, T.t0 - 3000, T.t0) / 3).toFixed(1), rafOnceHz: +(say(T.raf, T.t0 - 3000, T.t0) / 3).toFixed(1),
      tikPerdeHz: sn > 0 ? +(say(T.tik, a, b) / sn).toFixed(1) : null, rafPerdeHz: sn > 0 ? +(say(T.raf, a, b) / sn).toFixed(1) : null }; })()`, 'h-son');
  log && log('oda sahibi: ' + JSON.stringify(H));
  if (!H || !H.t1) { check('OK01 Önkoşul: oda sahibinin hızlı yolculuğu tamamlandı ve perde ≥ 4 sn sürdü', false, H); return; }
  const S = await ev(g, `(()=>{ const S = window.__snaplar || [], a = ${H.a}, b = ${H.b}; const ic = S.filter((t) => t > a && t < b).length, sn = (b - a) / 1000;
    return { kur: ${JSON.stringify(kur)}, icinde: ic, pencereSn: +sn.toFixed(2), hz: sn > 0 ? +(ic / sn).toFixed(1) : null, onceHz: +(S.filter((t) => t > ${H.t0} - 3000 && t <= ${H.t0}).length / 3).toFixed(1) }; })()`, 'g-say');
  log && log('konuk: ' + JSON.stringify(S));
  check('OK01 Önkoşul: oda sahibinin hızlı yolculuğu tamamlandı, perde (girdi kilidi) ≥ 4 sn sürdü; oda sahibinde tarayıcı perde sırasında rAF karesi veriyor (≥ 5/sn)', !!H.kilit && H.varis && H.blokMs >= 4000 && H.rafPerdeHz >= 5, { H });
  check('OK02 Oda sahibinin perde süresince motor döngüsü sürer (≥ 5 tik/sn) ve örtü motorun kare sınırına dokunmaz (yalnız çizim atlanır)', H.tikPerdeHz >= 5 && H.fpsOrtu === H.fps0 && H.fpsSon === H.fps0, { tikPerdeHz: H.tikPerdeHz, rafPerdeHz: H.rafPerdeHz, fps0: H.fps0, fpsOrtu: H.fpsOrtu, cizimOrtu: H.cizimOrtu });
  check('OK03 Oda sahibinin hızlı yolculuk perdesi sürerken konuk anlık görüntü almayı sürdürür (≥ 5/sn; B2-D2)', !!S && S.hz >= 5, S);
};
module.exports.meta = { testler: ['B2-D2 tanı: oda sahibinin örtüsü sırasında döngü ve konuğa anlık görüntüler'], dosyalar: ['js/game/game.js', 'js/core/engine.js', 'js/net/net.js'], olcum: true };
