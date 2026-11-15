// Faz 1 Adım B (B0 düzeltici 2. deneme; inceleme B0-I17; brief madde 5 "konuk 'teleport' işleyicisine de aynı denetimler", A-03) —
// oda sahibinin hızlı yolculuğu konukta. v0.4 net.js 'teleport' işleyicisi terrain.prepare'i bekler, sonra baştan yakalanmış oyuncuyu
// taşır ve "yeni limana vardınız" bildirir; bekleme sırasında gelen ikinci iletiyi ve oturumdan çıkışı denetlemez.
//   Bölüm 1: oda sahibi Kırlangıç → Tuz Pazarı hızlı yolculuğu yapar (oyunun kendi yolu: G.emit('fastTravel'); varışta 'teleport'
//            yayını). Konuk o bölgeyi hazırlarken (bekleme penceresi aşağıdaki kapıyla açık tutulur) oda sahibi ikinci bir 'teleport'
//            iletisi yayınlar (DK.net.broadcast; test verisi, gerçek ağ iletisi, Kuzeyfener). Beklenen (travelBusy): ikinci ileti yok
//            sayılır — konukta ikinci hazırlık başlamaz; kapı açılınca konuk bir kez ve ilk hedefe taşınır, tek varış bildirimi.
//   Bölüm 2: oda sahibi Tuz Pazarı → üçüncü bir liman; konuk bekleme sırasında menüye döner (DK.handlers.toMenu). Beklenen (oturum
//            belirteci): kapı açılınca konuk oyuncusu taşınmaz, "vardınız" bildirimi çıkmaz, konuk menüde kalır.
// Bekleme penceresi uygulamadan ve makine hızından bağımsız uzatılır: konukta terrain.prepare sarılır; asıl hazırlık bittikten sonra
// test kapıyı açana kadar söz sonuçlanmaz (02_yukleme_bekleme yöntemi). İletinin konuğa ulaştığı, konuğun oda bağlantısına eklenen
// ikinci bir 'data' dinleyicisiyle görülür (oyunun dinleyicisi değişmez; iç ad DK.net.hostConn — yoksa önkoşul KALIR).
// Çizim iki sayfada da durdurulur (06b gibi engine.fpsLimit = 0,01); hızlı yolculuk ve hazırlık gerçek zamanlıdır.
//   node tests/peer-server.cjs &
//   node tests/harness/coop.cjs tests/scenarios/coop/02_hizli_yolculuk_konuk.cjs --players 2 --size 640x360 --timeout 600 \
//        --url "http://localhost:8080/index.html?peerhost=127.0.0.1&peerport=9000"
module.exports = async ({ pages, host, guests, ev, tick, check, log }) => {
  const g = guests[0];
  const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
  // ---- oda kurulur, iki oyuncu oyuna girer
  const oda = await ev(host, `DK.net.host({name:'Teleport Odası', public:false, max:4, pw:'', difficulty:'normal', slot:2}).then(r=>({code:r.code}))`, 'host');
  await ev(g, `DK.net.join('${oda && oda.code}','').then(r=>({room:r.room.name})).catch(e=>({err:String(e)}))`, 'join');
  await host.waitForTimeout(800);
  await ev(host, `DK.handlers.startOnlineHost(DK.net.room).then(()=>'host-started')`, 'hs');
  await host.waitForTimeout(800);
  await ev(g, `DK.G.state === 'playing' ? 'already' : DK.handlers.startOnlineGuest().then(()=>'guest-started')`, 'gs');
  for (const pg of pages) await ev(pg, `DK.engine.fpsLimit = 0.01; DK.G.noAutoPause = true; 'lim'`);
  await tick(2);
  const hOk = await ev(host, `DK.G.state === 'playing' && DK.G.online === true && DK.G.isHost === true && !!DK.G.player`);
  const gOk = await ev(g, `DK.G.state === 'playing' && DK.G.online === true && DK.G.isHost === false && !!DK.G.player`);
  check('HK00 İki oyuncu çevrimiçi oyunda (oda sahibi + konuk)', !!(hOk && gOk), { hOk, gOk });
  if (!(hOk && gOk)) return;
  const P = await ev(host, `(()=>{ const id = (x) => DK.ports.byId(x); const A = id('tuz_pazari_port_0'), B = id('kuzeyfener_port_0');
    const C = DK.ports.list.find((p) => p.id !== A.id && p.id !== B.id && p.boarding && p.mooring && Math.hypot(p.x - A.x, p.z - A.z) > 2000 && Math.hypot(p.x - B.x, p.z - B.z) > 2000);
    const f = (p) => p && ({ id: p.id, x: Math.round(p.x), z: Math.round(p.z), bx: p.boarding.x, bz: p.boarding.z });
    return { A: f(A), B: f(B), C: f(C) }; })()`, 'limanlar');
  // ---- konuk: hazırlık kapısı, bildirim kaydı, gelen 'teleport' iletileri (ek dinleyici)
  const kur = await ev(g, `(()=>{ const T = DK.terrain; const C = window.__prepCagri = []; window.__kapi = null;
    window.__kapiKapat = () => { let ac; window.__kapi = new Promise((r) => { ac = r; }); window.__kapiAc = () => { window.__kapi = null; ac(); }; };
    const o = T.prepare; T.prepare = async function (x, z, op) { const kapi = window.__kapi; const k = { x: Math.round(x), z: Math.round(z), r: op && op.radius, t0: performance.now(), asil: null, t1: null }; C.push(k); const r = await o.apply(this, arguments); k.asil = performance.now(); if (kapi) await kapi; k.t1 = performance.now(); return r; };
    const B = window.__bildirimler = []; DK.G.on('notify', (n) => B.push({ text: String(n && n.text), t: performance.now() }));
    const L = window.__teleportlar = []; const c = DK.net && DK.net.hostConn; if (!c || typeof c.on !== 'function') return 'iç ad yok: DK.net.hostConn';
    c.on('data', (m) => { if (m && m.t === 'teleport') L.push({ x: Math.round(m.x), z: Math.round(m.z), t: performance.now() }); });
    return 'kuruldu'; })()`, 'g-kur');
  const yakin = (k, p) => Math.hypot(k.x - p.bx, k.z - p.bz) < 60;
  // ==== Bölüm 1: bekleme sırasında ikinci 'teleport' iletisi
  await ev(g, `(()=>{ window.__kapiKapat(); const p = DK.G.player; window.__p1 = p; return [Math.round(p.pos.x), Math.round(p.pos.z)]; })()`, 'g-oncesi1');
  await ev(host, `(()=>{ const p = DK.G.player; p.inv.gold = 2000; const A = DK.ports.byId('${P.A.id}'), H = DK.ports.byId('kirlangic_limani'); DK.G.emit('fastTravel', { to: A.id, from: H.id, cost: Math.round(25 + Math.hypot(A.x - H.x, A.z - H.z) / 40) }); return 'yola çıkıldı'; })()`, 'h-ft1');
  const ilk = await ev(g, `(async()=>{ const t0 = performance.now(); while (performance.now() - t0 < 120000) { const k = (window.__prepCagri || []).find((c) => Math.hypot(c.x - ${P.A.bx}, c.z - ${P.A.bz}) < 60); if (k) return { ms: Math.round(performance.now() - t0), teleport: (window.__teleportlar || []).length }; await new Promise((r) => setTimeout(r, 200)); } return null; })()`, 'g-ilk');
  check("HK01 Önkoşul: oda sahibinin hızlı yolculuğu konuğa ulaştı ('teleport' iletisi) ve konukta varış bölgesinin hazırlığı başladı (bekleme penceresi açık)", kur === 'kuruldu' && !!ilk && ilk.teleport >= 1, { kur, ilk });
  if (!(kur === 'kuruldu' && ilk)) return;
  await ev(host, `(()=>{ const B = DK.ports.byId('${P.B.id}'); DK.net.broadcast({ t: 'teleport', x: B.boarding.x, y: B.boarding.y + 0.3, z: B.boarding.z, ship: [B.mooring.x, B.mooring.z, B.mooring.yaw], hour: DK.sky.hour, day: DK.time.day }); return 'ikinci teleport yayınlandı'; })()`, 'h-ikinci');
  const ikinci = await ev(g, `(async()=>{ const t0 = performance.now(); while (performance.now() - t0 < 15000 && (window.__teleportlar || []).length < 2) await new Promise((r) => setTimeout(r, 100)); await new Promise((r) => setTimeout(r, 3000));
    const C = window.__prepCagri || []; return { teleport: (window.__teleportlar || []).map((m) => [m.x, m.z]), cagri: C.map((c) => [c.x, c.z, c.r, c.t1 === null ? 'bekliyor' : 'bitti']), ilkBekliyor: C.some((c) => Math.hypot(c.x - ${P.A.bx}, c.z - ${P.A.bz}) < 60 && c.t1 === null), ikinciHazirlik: C.filter((c) => Math.hypot(c.x - ${P.B.bx}, c.z - ${P.B.bz}) < 60).length }; })()`, 'g-ikinci');
  check("HK02 Önkoşul: ikinci 'teleport' iletisi konuğa, ilk hazırlık hâlâ beklerken ulaştı", !!ikinci && ikinci.teleport.length >= 2 && ikinci.ilkBekliyor === true, ikinci);
  check("HK03 Bekleme sırasında gelen ikinci 'teleport' iletisi yok sayılır: konukta ikinci bölgenin hazırlığı başlamaz (brief madde 5: konuk işleyicisinde travelBusy)", !!ikinci && ikinci.ikinciHazirlik === 0, ikinci && { ikinciHazirlik: ikinci.ikinciHazirlik, cagri: ikinci.cagri });
  const son1 = await ev(g, `(async()=>{ const ani = performance.now(); window.__kapiAc(); const t0 = performance.now(); while (performance.now() - t0 < 60000 && (window.__prepCagri || []).some((c) => c.t1 === null)) await new Promise((r) => setTimeout(r, 100)); await new Promise((r) => setTimeout(r, 2000));
    const p = DK.G.player, q = window.__p1; return { ayniOyuncu: p === q, konum: q ? [Math.round(q.pos.x), Math.round(q.pos.z)] : null, aUzaklik: q ? Math.round(Math.hypot(q.pos.x - ${P.A.bx}, q.pos.z - ${P.A.bz})) : null, bUzaklik: q ? Math.round(Math.hypot(q.pos.x - ${P.B.bx}, q.pos.z - ${P.B.bz})) : null,
      varisBildirimi: (window.__bildirimler || []).filter((b) => b.t >= ani && /vardınız/i.test(b.text)).map((b) => b.text), durum: DK.G.state }; })()`, 'g-son1');
  check('HK04 Kapı açılınca konuk bir kez ve ilk hedefe taşınır: konuk Tuz Pazarı biniş noktasında (≤ 30 m), tek "vardınız" bildirimi (ikinci ileti konuğu Kuzeyfener\'e taşımaz)', !!son1 && son1.aUzaklik !== null && son1.aUzaklik <= 30 && son1.varisBildirimi.length === 1, son1);
  await tick(1);
  // ==== Bölüm 2: konuk bekleme sırasında menüye döner
  const oncesi2 = await ev(g, `(()=>{ window.__kapiKapat(); const p = DK.G.player; window.__p2 = p; window.__p2Konum = p ? [p.pos.x, p.pos.z] : null; window.__n2 = (window.__prepCagri || []).length; return { konum: p ? [Math.round(p.pos.x), Math.round(p.pos.z)] : null, durum: DK.G.state }; })()`, 'g-oncesi2');
  await ev(host, `(()=>{ const p = DK.G.player; p.inv.gold = Math.max(p.inv.gold, 2000); const C = DK.ports.byId('${P.C && P.C.id}'), A = DK.ports.byId('${P.A.id}'); if (!C) return 'üçüncü liman yok'; DK.G.emit('fastTravel', { to: C.id, from: A.id, cost: Math.round(25 + Math.hypot(C.x - A.x, C.z - A.z) / 40) }); return 'yola çıkıldı: ' + C.id; })()`, 'h-ft2');
  const ilk2 = P.C ? await ev(g, `(async()=>{ const t0 = performance.now(); while (performance.now() - t0 < 120000) { const k = (window.__prepCagri || []).slice(window.__n2).find((c) => Math.hypot(c.x - ${P.C.bx}, c.z - ${P.C.bz}) < 60); if (k) return { ms: Math.round(performance.now() - t0) }; await new Promise((r) => setTimeout(r, 200)); } return null; })()`, 'g-ilk2') : null;
  check('HK05 Önkoşul: ikinci hızlı yolculuk konuğa ulaştı, konukta hazırlık başladı (bekleme penceresi açık)', !!ilk2 && !!oncesi2 && oncesi2.durum === 'playing', { C: P.C, ilk2, oncesi2 });
  if (!ilk2) return;
  const son2 = await ev(g, `(async()=>{ const ani = performance.now(); DK.handlers.toMenu(); await new Promise((r) => setTimeout(r, 1000)); window.__kapiAc(); const t0 = performance.now(); while (performance.now() - t0 < 60000 && (window.__prepCagri || []).some((c) => c.t1 === null)) await new Promise((r) => setTimeout(r, 100)); await new Promise((r) => setTimeout(r, 3000));
    const q = window.__p2, k0 = window.__p2Konum; return { durum: DK.G.state, menu: !!document.getElementById('menu')?.classList.contains('active'), hud: !document.getElementById('hud')?.classList.contains('hidden'),
      oyuncuKaydi: q ? Math.round(Math.hypot(q.pos.x - k0[0], q.pos.z - k0[1])) : null, cUzaklik: q ? Math.round(Math.hypot(q.pos.x - ${P.C ? P.C.bx : 0}, q.pos.z - ${P.C ? P.C.bz : 0})) : null,
      bildirimSonra: (window.__bildirimler || []).filter((b) => b.t >= ani).map((b) => b.text) }; })()`, 'g-son2');
  check("HK06 Bekleme sırasında menüye dönen konuk: hazırlık bitince durum 'menu', ana menü açık, HUD kapalı (brief madde 5: oturum belirteci)", !!son2 && son2.durum === 'menu' && son2.menu === true && son2.hud === false, son2);
  check('HK07 Bekleme sırasında menüye dönen konuk: devam kodu oyuncuyu varış limanına taşımaz ve "vardınız" bildirimi üretmez', !!son2 && son2.oyuncuKaydi !== null && son2.oyuncuKaydi < 5 && !son2.bildirimSonra.some((t) => /vardınız/i.test(t)), son2);
};
module.exports.meta = {
  testler: ['9 Hızlı yolculuk', 'co-op', 'A-03', 'KI-035', "brief madde 5 (konuk 'teleport' işleyicisi)"],
  dosyalar: ['js/net/net.js', 'js/main.js', 'js/world/terrain.js'],
};
