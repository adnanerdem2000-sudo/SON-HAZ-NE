// Tanı (B1): iki yarıya bağlı kontrollerin (HYS-02, HY21; ek not §6) B1 yarısı — terrain.prepare'in dönüş değeri oyunun kendi
// çağrı yollarında. Kontrol içermez (ölçüm senaryosu); sonuçlar raporun steps alanındadır. Test kodu değil, B1 kayıtlarının parçası.
//  1) Doğrudan çağrı (menü sahnesi, arazi hazır): uzak bölge r300 {timeout: 30} → 'timeout' (~30 ms); aynı bölge varsayılan süreyle
//     → 'ok'; başka bir uzak bölge → 'ok'. Hiçbir çağrı reddetmez (hata alanı null).
//  2) Oyunun hızlı yolculuk yolu (main.js G.on('fastTravel'), v0.4 çağıranı; B2 bunu değiştiriyor): terrain.prepare 02_hizli_yolculuk
//     HYS-02'deki gibi sarılıp dönüş değeri kaydedilir → 'ok'. Ardından HY21'in yöntemi: bir sonraki prepare çağrısına {timeout: 30}
//     eklenir → 'timeout'. Oyuncu bildirimi B2'nin yarısıdır (v0.4 çağıranı dönüş değerini kullanmaz); burada yalnız varıştan sonraki
//     bildirimler kaydedilir.
[
 {meta: {olcum: true, testler: ['tanı: prepare dönüş değeri (HYS-02/HY21 B1 yarısı)'], dosyalar: ['js/world/terrain.js']}},
 {js: `(async()=>{ const T = DK.terrain; const R = window.__R = { mode: T.mode, ready: T.ready };
   const ol = async (ad, x, z, op) => { const t0 = performance.now(); let d, h = null; try { d = await T.prepare(x, z, op); } catch (e) { h = String(e && e.message || e); } R[ad] = { donus: d === undefined ? 'undefined' : d, ms: Math.round(performance.now() - t0), hata: h }; };
   await ol('kumsaati_zamanAsimi30', -5300, 700, { radius: 300, timeout: 30 });
   await ol('kumsaati_varsayilan', -5300, 700, { radius: 300 });
   await ol('kulLimani_varsayilan', 5300, 400, { radius: 300 });
   R.workers = T.workers.length; R.fallback = T.fallback; return R; })()`},
 {js: `(async()=>{ DK.G.noAutoPause = true; await DK.handlers.startGame({ kind: 'solo', slot: 2, data: null });
   for (let i = 0; i < 150 && !(DK.G.state === 'playing' && DK.G.player); i++) await new Promise((r) => setTimeout(r, 100));
   if (DK.G.player) DK.G.player.inv.gold = 2000; return { durum: DK.G.state, oyuncu: !!DK.G.player }; })()`},
 {js: `(async()=>{ const T = DK.terrain, G = DK.G, H = DK.ports.byId('kirlangic_limani'), A = DK.ports.byId('tuz_pazari_port_0');
   const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
   const B = window.__bild = []; const on = G.notify.bind(G); G.notify = function (text, kind) { try { B.push({ t: performance.now(), text: String(text), kind }); } catch (e) { /* yoksay */ } return on.apply(this, arguments); };
   const yolculuk = async (from, to, zorla) => {
     const K = { kayit: [], zorlanan: zorla };
     const o = T.prepare;
     T.prepare = function (x, z, op) { T.prepare = o; const t0 = performance.now(); const p = o.call(this, x, z, zorla ? Object.assign({}, op, { timeout: 30 }) : op);
       Promise.resolve(p).then((d) => K.kayit.push({ x: Math.round(x), z: Math.round(z), op: op || null, donus: d === undefined ? 'undefined' : d, ms: Math.round(performance.now() - t0) }), (e) => K.kayit.push({ red: String(e) })); return p; };
     const t0 = performance.now(); G.emit('fastTravel', { to: to.id, from: from.id, cost: 10 });
     while (performance.now() - t0 < 60000 && !(K.kayit.length && Math.hypot(G.ship.x - to.mooring.x, G.ship.z - to.mooring.z) < 50)) await bekle(200);
     await bekle(1500);
     T.prepare = o; K.vardi = Math.hypot(G.ship.x - to.mooring.x, G.ship.z - to.mooring.z) < 50; K.bildirimler = B.filter((b) => b.t >= t0).map((b) => ({ text: b.text, kind: b.kind }));
     return K; };
   const S = window.__S = {};
   S.normal = await yolculuk(H, A, false);
   await bekle(1000);
   S.zorlanmis = await yolculuk(A, H, true);
   return S; })()`},
]
