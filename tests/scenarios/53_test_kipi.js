// 53_test_kipi — test kipi (Faz 9 tasarımı §5, §9.1; K-07, K-08, K9-3, K9-4, K9-20). Y3 kabulü: TK01–TK06 ve TK08 (TK07 Y5'te eklenir).
// Koşu: çalışma dizini --url'nin sunduğu ağacın KÖKÜ olmalı (sahte kökenler rotaKok dizin '.' ile çalışma dizininden sunulur):
//   cd <sınanan ağaç> && node <w2>/tests/harness/run.cjs <w2>/tests/scenarios/53_test_kipi.js --url http://localhost:<kapı>/index.html --size 640x360
// Başka bir ağaca karşı "önce" kaydı alınırken de cd o ağaca yapılır; yoksa TK05e (ön koşul) açık nedenle KALIR (A2-UY-03).
// Koşucu ilk adrese test=1'i kendiliğinden ekler: TK01, TK06 ve ekleri test kipindeki ilk açılışta koşar. Sonra test kipsiz ve
// test kipli goto'lar gelir. TK08 göreli adresle aynı sunucuda, TK05 https://oyun.ornek sahte kökeninde (rotaKok) koşar.
// Her goto'dan sonraki 'js' adımı yalnız tanı içindir (onay değildir): Y3 öncesi kodda neden kalındığını (DK test kipsiz de var,
// ?terrain=crash uygulanıyor, __dkDurum yok) rapora yazar.
// Ekler (tasarım tablosunun dışında, aynı iddiaların koşuyla kanıtı): TK01b __dkDurum yalnız ilkel değer döndürür ve dondurulmuştur;
// TK01c test kipinde kancalar modülü istenir, TK02b test kipsiz açılışta istenmez; TK01d DK.__sayac sim/press/tap'i sayar ve dönüş
// değerleri aynıdır; TK06b DK.mod bilinmeyen adda açık hata atar.
// A2 düzeltmesi (A2-G-01): K-08'in kapandığı yalnız __dkDurum().sinyal tanısıyla değil, saldırı yolunun kendisiyle sınanır. TK03, TK08
// ve TK05 adreslerine ?join=ABCDEF eklenir: main.js davet bağlantısını görünce katılma ekranını açar ve oda taraması kullanıcı
// etkileşimi olmadan sinyal sunucusuna bağlanmayı dener (menu.joinScreen → scan → net.listPublic → new window.Peer(peerOpts())).
// Varsayılan PeerJS sunucusu (0.peerjs.com) ve saldırgan adresleri (kotu.ornek, 10.9.9.9:9000) ağ dışına çıkılmadan rotaKok ile var
// olmayan bir dizine bağlanır (her istek 404). TKxxa tarama bitti, TKxxb/TK05c saldırgan adresine hiç istek gitmedi, TK03c/TK08c/TK05d
// istek varsayılan sunucuya gitti (tarama gerçekten çalıştı; istek başka bir yere gitseydi bu sayaç 0 kalırdı).
// A2-UY-03: TK05e, sahte kökenin (çalışma dizini) --url ile aynı dosyaları sunduğunu SHA-256 özetleriyle doğrular.
// A2-UY-02: TK09 en sonda koşar (rotaKok yönlendirmeleri bağlam boyunca kalır): sahte yerel kökende (http://localhost:47913, çalışma
// dizini; TK05e ile aynı dizin) js/test/kancalar.js 404 döner; açılış hatası görünür yükleme ekranında kalmalı, menü açılmamalı.
[
 {meta: {testler: [], sorunlar: ['KI-143 (K-07)', 'KI-144 (K-08)'], kararlar: ['K9-3', 'K9-4', 'K9-20'],
   dosyalar: ['js/core/testmode.js', 'js/core/surum.js', 'js/test/kancalar.js', 'js/main.js', 'js/net/net.js', 'js/world/terrain.js', 'js/ui/menu.js'],
   aciklama: '62 kullanıcı testinden birine değil, Y3 kabulüne (test kipi, K-07/K-08) aittir; A2 inceleme düzeltmeleri: A2-G-01 (uçtan uca K-08/K9-20), A2-UY-02 (TK09), A2-UY-03 (TK05e)',
   izinliHatalar: [
     {desen: '0\\.peerjs\\.com/peerjs/id', tur: 'hepsi', gerekce: 'TK03/TK08/TK05: varsayılan PeerJS sunucusu rotaKok ile var olmayan bir dizine bağlandı; davet bağlantısının oda taraması /peerjs/id isteğinde 404 alır (CORS başlığı da yoktur). Bu istek, sinyal isteğinin saldırgana değil varsayılan sunucuya gittiğinin kanıtıdır (TK03c, TK08c, TK05d).'},
     {desen: '^http://localhost:47913/js/test/kancalar\\.js$', tur: 'ag', gerekce: 'TK09: test kancaları modülü sahte yerel kökende kasıtlı olarak 404 döndürülür (yüklenemeyen kanca modülünün açılış hatası görünür mü?).'},
     {desen: 'Failed to fetch dynamically imported module: http://localhost:47913/js/test/kancalar\\.js', tur: 'konsol', gerekce: 'TK09: boot() kancalar.js yüklenemeyince reddedilir ve main.js catch\'i hatayı console.error ile yazar (beklenen açılış hatası).'},
   ]}},

 // ---- test kipinde ilk açılış (koşucu test=1 ekledi)
 {js: `({ adres: location.href, dk: typeof window.DK, durum: typeof window.__dkDurum === 'function' ? window.__dkDurum() : 'yok', isaret: window.__DK_TEST_KIPI || null })`},
 {expect: {js: `(()=>{
   const ESKI = ['G', 'assets', 'archipelago', 'physics', 'islands', 'bosses', 'ports', 'game', 'input', 'engine', 'post', 'settings', 'tpCamera', 'interact', 'npcs', 'Ship', 'kk', 'Character', 'handlers', 'net', 'ui', 'creator', 'hud', 'quests', 'treasure', 'enemies', 'animals', 'megafauna', 'hazards', 'progress', 'fish', 'fishing', 'seagear', 'shipControl', 'THREE', 'save', 'port', 'combat', 'effects', 'events', 'worldEvents', 'sky', 'time', 'bodies', 'weatherfx', 'details', 'terrain', 'ocean', 'crowd'];
   const YARDIMCI = ['snap', 'snapFrom', 'sim', 'tap', 'press'];
   const EK = ['audio', 'mod', '__sayac'];
   const D = window.DK;
   const d = typeof window.__dkDurum === 'function' ? window.__dkDurum() : null;
   if (!D || typeof D !== 'object') return { dk: typeof D, test: d ? d.test : '__dkDurum yok' };
   const eksik = ESKI.filter((k) => !(k in D) || D[k] === undefined || D[k] === null);
   const bilinen = new Set([...ESKI, ...YARDIMCI, ...EK]);
   return { dk: typeof D, alan: ESKI.length - eksik.length, eksik,
     yardimci: YARDIMCI.filter((k) => typeof D[k] === 'function').length,
     ek: { audio: typeof D.audio, mod: typeof D.mod, __sayac: typeof D.__sayac },
     fazla: Object.keys(D).filter((k) => !bilinen.has(k)),
     test: d ? d.test : '__dkDurum yok', isaret: window.__DK_TEST_KIPI || null };
 })()`, eq: {dk: 'object', alan: 49, eksik: [], yardimci: 5, ek: {audio: 'object', mod: 'function', __sayac: 'object'}, fazla: [], test: true, isaret: 'dk-test-kancalari-v1'},
   label: 'TK01 Test kipinde DK var: 49 alan + 5 yardımcı + mod/audio/__sayac (fazlası yok); __dkDurum().test === true'}},
 {expect: {js: `(()=>{
   if (typeof window.__dkDurum !== 'function') return { hata: '__dkDurum yok' };
   const d = window.__dkDurum();
   const ilkel = Object.entries(d).filter(([, v]) => !(v === null || ['string', 'number', 'boolean'].includes(typeof v))).map(([k]) => k);
   return { alanlar: Object.keys(d).sort(), ilkelOlmayan: ilkel, donuk: Object.isFrozen(d), yeniNesne: window.__dkDurum() !== d,
     surum: d.surum, derleme: typeof d.derleme, hazir: d.hazir, kati: d.kati };
 })()`, eq: {alanlar: ['araziKip', 'derleme', 'eksikVarlik', 'hazir', 'isci', 'isciHata', 'kati', 'kk', 'sinyal', 'surum', 'tekDosya', 'test', 'yedek'], ilkelOlmayan: [], donuk: true, yeniNesne: true, surum: '0.5.0', derleme: 'string', hazir: true, kati: true},
   label: 'TK01b __dkDurum() salt-okur tanı: 13 alan, yalnız ilkel değerler, dondurulmuş yeni nesne; sürüm 0.5.0, katı kip'}},
 {agSay: {desen: '/js/test/kancalar\\.js(\\?|$)', enAz: 1, sonGezinmeden: true, label: 'TK01c Test kipinde kancalar modülü (js/test/kancalar.js) yüklendi'}},
 {expect: {js: `(async()=>{
   const ADLAR = ['economy/shop', 'economy/items', 'treasure/treasure', 'world/props', 'world/ports', 'ui/menu', 'ui/panels', 'wildlife/seagear', 'ship/shipModel', 'core/nearfade', 'world/worldData', 'game/quests', 'core/assets', 'core/audio'];
   if (!window.DK || typeof window.DK.mod !== 'function') return { hata: 'DK.mod yok', dk: typeof window.DK };
   const ayniMerchants = DK.mod('economy/shop').MERCHANTS === (await import('./js/economy/shop.js')).MERCHANTS;
   const farkli = [];
   for (const ad of ADLAR) { let m = null; try { m = DK.mod(ad); } catch (e) { farkli.push(ad + ': ' + e.message); continue; } if (m !== await import('./js/' + ad + '.js')) farkli.push(ad); }
   return { ayniMerchants, kayitli: ADLAR.length, farkli };
 })()`, eq: {ayniMerchants: true, kayitli: 14, farkli: []},
   label: 'TK06 DK.mod aynı modül örneğini verir: economy/shop MERCHANTS === import() ile gelen; 14 kayıtlı adın hepsi aynı ad alanı nesnesi'}},
 {expect: {js: `(()=>{
   if (!window.DK || typeof window.DK.mod !== 'function') return { hata: 'DK.mod yok' };
   try { DK.mod('yok/boyle'); return { hataAtti: false }; } catch (e) { return { hataAtti: true, adGeciyor: String(e.message).includes('yok/boyle') }; }
 })()`, eq: {hataAtti: true, adGeciyor: true}, label: 'TK06b DK.mod bilinmeyen adda açık hata atar (ad iletide)'}},
 {expect: {js: `(()=>{
   if (!window.DK || !DK.__sayac) return { hata: 'DK.__sayac yok', dk: typeof window.DK };
   const c = DK.__sayac, o = { sim: c.sim, adim: c.adim, press: c.press, tap: c.tap };
   const n = DK.sim(0.1);
   const simFark = c.sim - o.sim, adimFark = c.adim - o.adim;
   const p = DK.press('F24', 0.1);
   const t = DK.tap('F24');
   return { simDonus: n, simFark, adimFark, pressDonus: p === undefined ? 'undefined' : p, pressSonrasiSim: c.sim - o.sim, pressSonrasiAdim: c.adim - o.adim, press: c.press - o.press,
     tapDonus: t === undefined ? 'undefined' : t, tap: c.tap - o.tap, anahtarlar: Object.keys(c).sort() };
 })()`, eq: {simDonus: 3, simFark: 1, adimFark: 3, pressDonus: 'undefined', pressSonrasiSim: 3, pressSonrasiAdim: 7, press: 1, tapDonus: 'undefined', tap: 1, anahtarlar: ['adim', 'press', 'sim', 'tap']},
   label: 'TK01d DK.__sayac sim/press/tap çağrılarını sayar (press içindeki iki sim dahil); dönüş değerleri tabanla aynı'}},

 // ---- TK02: test parametresiz açılış (ters kanıt)
 {goto: {url: 'index.html', testParam: false}},
 {js: `({ adres: location.href, dk: typeof window.DK, durum: typeof window.__dkDurum === 'function' ? window.__dkDurum() : 'yok', kip: window.DK ? window.DK.terrain.mode : null })`},
 {expect: {js: `(()=>{
   const d = typeof window.__dkDurum === 'function' ? window.__dkDurum() : null;
   return { dk: typeof window.DK, hazir: window.__ready === true, test: d ? d.test : '__dkDurum yok', menu: !!document.getElementById('menu')?.classList.contains('active'), isaret: typeof window.__DK_TEST_KIPI };
 })()`, eq: {dk: 'undefined', hazir: true, test: false, menu: true, isaret: 'undefined'},
   label: 'TK02 Test parametresiz açılış: DK yok, __ready, __dkDurum().test === false, menü görünür'}},
 {agSay: {desen: '/js/test/', enCok: 0, sonGezinmeden: true, label: 'TK02b Test kipsiz açılışta js/test/ altından hiçbir dosya istenmedi'}},

 // ---- sahte sinyal sunucuları (A2-G-01): ağ dışına çıkılmaz. '.yok-53-sahte-sinyal' dizini yoktur: her istek 404 alır.
 // 10.9.9.9 için 9000 kapısı kullanılır (TK03/TK08 adresleri de): 1 numaralı kapı Chromium'un yasak kapılarındandır, oraya giden
 // istek tarayıcıda engellenir ve ağ sayımında görünmeyebilirdi.
 {rotaKok: {kok: 'https://0.peerjs.com', dizin: '.yok-53-sahte-sinyal'}},
 {rotaKok: {kok: 'https://kotu.ornek', dizin: '.yok-53-sahte-sinyal'}},
 {rotaKok: {kok: 'http://10.9.9.9:9000', dizin: '.yok-53-sahte-sinyal'}},

 // ---- TK03: test kipi yokken ?terrain ve ?peerhost yok sayılır (K-08); davet bağlantısının oda taraması varsayılan sunucuya gider
 {goto: {url: 'index.html?join=ABCDEF&terrain=crash&peerhost=10.9.9.9&peerport=9000', testParam: false}},
 {js: `({ adres: location.href, dk: typeof window.DK, durum: typeof window.__dkDurum === 'function' ? window.__dkDurum() : 'yok', kip: window.DK ? window.DK.terrain.mode : null, isci: window.DK ? window.DK.terrain.workers.length : null, yedek: window.DK ? window.DK.terrain.fallback : null })`},
 {expect: {js: `(()=>{
   const d = typeof window.__dkDurum === 'function' ? window.__dkDurum() : null;
   if (!d) return { hata: '__dkDurum yok', dk: typeof window.DK, kip: window.DK ? window.DK.terrain.mode : null };
   return { test: d.test, araziKip: d.araziKip, isciVar: d.isci >= 1, sinyal: d.sinyal, dk: typeof window.DK };
 })()`, eq: {test: false, araziKip: '', isciVar: true, sinyal: 'varsayilan', dk: 'undefined'},
   label: 'TK03 Test kipi yok: ?terrain=crash ve ?peerhost=10.9.9.9 yok sayılır (araziKip boş, işçi ≥ 1, sinyal varsayılan)'}},
 {expect: {js: `(async()=>{
   const t0 = performance.now();
   const liste = () => [...document.querySelectorAll('.panel .col .muted, .col .muted')].map((e) => e.textContent).join(' | ');
   while (performance.now() - t0 < 40000 && !/Sinyal sunucusuna bağlanılamadı|açık oda yok/.test(liste())) await new Promise((r) => setTimeout(r, 250));
   return { katilmaEkrani: !!document.querySelector('input[placeholder^="Oda kodu"]'), taramaBitti: /Sinyal sunucusuna bağlanılamadı|açık oda yok/.test(liste()) };
 })()`, eq: {katilmaEkrani: true, taramaBitti: true}, label: 'TK03a Davet bağlantısı (?join) katılma ekranını açtı; oda taraması kendiliğinden sinyal sunucusuna bağlanmayı deneyip bitti'}},
 {agSay: {desen: '^[a-z]+://10\\.9\\.9\\.9[:/]', enCok: 0, sonGezinmeden: true, label: 'TK03b Test kipi yokken ?peerhost=10.9.9.9 adresine hiçbir istek gitmedi (K-08 uçtan uca)'}},
 {agSay: {desen: '^https://0\\.peerjs\\.com/peerjs/id', enAz: 1, sonGezinmeden: true, label: 'TK03c Oda taramasının sinyal isteği varsayılan PeerJS sunucusuna gitti'}},

 // ---- TK04: test kipinde ?terrain ve geri döngü ?peerhost uygulanır
 {goto: 'index.html?test=1&terrain=noworker&peerhost=127.0.0.1&peerport=9000'},
 {js: `({ adres: location.href, dk: typeof window.DK, durum: typeof window.__dkDurum === 'function' ? window.__dkDurum() : 'yok', kip: window.DK ? window.DK.terrain.mode : null, yedek: window.DK ? window.DK.terrain.fallback : null })`},
 {expect: {js: `(()=>{
   const d = typeof window.__dkDurum === 'function' ? window.__dkDurum() : null;
   if (!d) return { hata: '__dkDurum yok', dk: typeof window.DK, kip: window.DK ? window.DK.terrain.mode : null };
   return { test: d.test, araziKip: d.araziKip, yedek: d.yedek, sinyal: d.sinyal, dk: typeof window.DK };
 })()`, eq: {test: true, araziKip: 'noworker', yedek: true, sinyal: '127.0.0.1:9000', dk: 'object'},
   label: 'TK04 Test kipinde ?terrain=noworker ve ?peerhost=127.0.0.1 uygulanır (yedek açık, sinyal 127.0.0.1:9000)'}},

 // ---- TK08: test kipinde bile peerhost yalnız geri döngü adresi olabilir (K9-20); README'deki yerel sunucuyu çalıştıran oyuncuya
 // gönderilen davet bağlantısının oda taraması 10.9.9.9'a değil varsayılan sunucuya gider
 {goto: 'index.html?test=1&join=ABCDEF&peerhost=10.9.9.9&peerport=9000'},
 {degisken: {ad: 'tk08ilk', js: `typeof window.__dkDurum === 'function' ? { sinyal: window.__dkDurum().sinyal, test: window.__dkDurum().test } : { sinyal: '__dkDurum yok', test: null }`}},
 {expect: {js: `(async()=>{
   const t0 = performance.now();
   const liste = () => [...document.querySelectorAll('.panel .col .muted, .col .muted')].map((e) => e.textContent).join(' | ');
   while (performance.now() - t0 < 40000 && !/Sinyal sunucusuna bağlanılamadı|açık oda yok/.test(liste())) await new Promise((r) => setTimeout(r, 250));
   return { katilmaEkrani: !!document.querySelector('input[placeholder^="Oda kodu"]'), taramaBitti: /Sinyal sunucusuna bağlanılamadı|açık oda yok/.test(liste()) };
 })()`, eq: {katilmaEkrani: true, taramaBitti: true}, label: 'TK08a Test kipinde davet bağlantısı katılma ekranını açtı; oda taraması kendiliğinden sinyal sunucusuna bağlanmayı deneyip bitti'}},
 {agSay: {desen: '^[a-z]+://10\\.9\\.9\\.9[:/]', enCok: 0, sonGezinmeden: true, label: 'TK08b Test kipinde de geri döngü dışı peerhost (10.9.9.9) hiç istek almadı (K9-20 uçtan uca)'}},
 {agSay: {desen: '^https://0\\.peerjs\\.com/peerjs/id', enAz: 1, sonGezinmeden: true, label: 'TK08c Oda taramasının sinyal isteği varsayılan PeerJS sunucusuna gitti'}},
 {goto: 'index.html?test=1&peerhost=127.0.0.1&peerport=9000'},
 {expect: {js: `(()=>{
   const ilk = (window.__KOSUCU || {}).tk08ilk || { sinyal: 'kayıt yok', test: null };
   const d = typeof window.__dkDurum === 'function' ? window.__dkDurum() : null;
   return { ilk: ilk.sinyal, ilkTest: ilk.test, ikinci: d ? d.sinyal : '__dkDurum yok', ikinciTest: d ? d.test : null };
 })()`, eq: {ilk: 'varsayilan', ilkTest: true, ikinci: '127.0.0.1:9000', ikinciTest: true},
   label: 'TK08 Test kipinde peerhost=10.9.9.9 yok sayılır (varsayılan), peerhost=127.0.0.1 kabul edilir (127.0.0.1:9000)'}},

 // ---- TK05 ön koşulu (A2-UY-03): --url'nin sunduğu dosyaların SHA-256 özetleri (sayfanın yüklediği aynı kökenli .js/.html/.css
 // kaynakları + sabit liste; js/test/ hariç: TK05b o dizine istek sayar) koşu değişkenine alınır; TK05e sahte kökende karşılaştırır.
 {degisken: {ad: 'agacOzeti', js: `(async()=>{
   const taban = location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
   const yollar = new Set(['index.html', 'js/main.js', 'js/net/net.js', 'js/world/terrain.js', 'js/world/terrainWorker.js', 'js/ui/menu.js']);
   for (const e of performance.getEntriesByType('resource')) {
     if (!e.name.startsWith(taban)) continue;
     const y = e.name.slice(taban.length).replace(/[?#].*$/, '');
     if (/\\.(m?js|html|css)$/.test(y) && !y.startsWith('js/test/')) yollar.add(y);
   }
   const ozet = {};
   for (const y of [...yollar].sort()) {
     try {
       const r = await fetch(taban + y, { cache: 'no-store' });
       if (!r.ok) { ozet[y] = 'HTTP ' + r.status; continue; }
       const h = new Uint8Array(await crypto.subtle.digest('SHA-256', await r.arrayBuffer()));
       ozet[y] = [...h].slice(0, 12).map((x) => x.toString(16).padStart(2, '0')).join('');
     } catch (e) { ozet[y] = 'hata: ' + e.message; }
   }
   return ozet;
 })()`}},

 // ---- TK05: yerel olmayan güvenli köken (github.io benzeri) — bağlantı saldırısı ?test=1 ile de açılamaz; davet bağlantısının oda
 // taraması saldırganın sinyal sunucusuna (kotu.ornek) gitmez
 {rotaKok: {kok: 'https://oyun.ornek', dizin: '.'}},
 {goto: {url: 'https://oyun.ornek/index.html?join=ABCDEF&test=1&peerhost=kotu.ornek&peerport=443&peersecure=1&terrain=crash', testParam: false}},
 {js: `({ adres: location.href, guvenli: window.isSecureContext, dk: typeof window.DK, durum: typeof window.__dkDurum === 'function' ? window.__dkDurum() : 'yok', kip: window.DK ? window.DK.terrain.mode : null, isci: window.DK ? window.DK.terrain.workers.length : null, yedek: window.DK ? window.DK.terrain.fallback : null })`},
 {expect: {js: `(()=>{
   const d = typeof window.__dkDurum === 'function' ? window.__dkDurum() : null;
   if (!d) return { hata: '__dkDurum yok', koken: location.origin, dk: typeof window.DK, kip: window.DK ? window.DK.terrain.mode : null };
   return { koken: location.origin, guvenli: window.isSecureContext, dk: typeof window.DK, test: d.test, araziKip: d.araziKip, isciVar: d.isci >= 1, sinyal: d.sinyal, isaret: typeof window.__DK_TEST_KIPI };
 })()`, eq: {koken: 'https://oyun.ornek', guvenli: true, dk: 'undefined', test: false, araziKip: '', isciVar: true, sinyal: 'varsayilan', isaret: 'undefined'},
   label: 'TK05 Yerel olmayan https kökeninde ?test=1&peerhost=kotu.ornek&terrain=crash: DK yok, test kipi kapalı, araziKip boş, sinyal varsayılan'}},
 {expect: {js: `(async()=>{
   const t0 = performance.now();
   const liste = () => [...document.querySelectorAll('.panel .col .muted, .col .muted')].map((e) => e.textContent).join(' | ');
   while (performance.now() - t0 < 40000 && !/Sinyal sunucusuna bağlanılamadı|açık oda yok/.test(liste())) await new Promise((r) => setTimeout(r, 250));
   return { katilmaEkrani: !!document.querySelector('input[placeholder^="Oda kodu"]'), taramaBitti: /Sinyal sunucusuna bağlanılamadı|açık oda yok/.test(liste()) };
 })()`, eq: {katilmaEkrani: true, taramaBitti: true}, label: 'TK05a Davet bağlantısı (?join) katılma ekranını açtı; oda taraması kendiliğinden sinyal sunucusuna bağlanmayı deneyip bitti'}},
 {agSay: {desen: '^https://oyun\\.ornek/js/test/', enCok: 0, sonGezinmeden: true, label: 'TK05b Yerel olmayan kökende js/test/ altından hiçbir dosya istenmedi'}},
 {agSay: {desen: '^[a-z]+://kotu\\.ornek[:/]', enCok: 0, sonGezinmeden: true, label: 'TK05c Saldırganın sinyal sunucusuna (kotu.ornek) hiçbir istek gitmedi (K-08 bağlantı saldırısı uçtan uca)'}},
 {agSay: {desen: '^https://0\\.peerjs\\.com/peerjs/id', enAz: 1, sonGezinmeden: true, label: 'TK05d Oda taramasının sinyal isteği varsayılan PeerJS sunucusuna gitti'}},
 {expect: {js: `(async()=>{
   const beklenen = (window.__KOSUCU || {}).agacOzeti;
   if (!beklenen || typeof beklenen !== 'object') return { hata: 'agacOzeti koşu değişkeni yok' };
   const taban = location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
   const farkli = [];
   for (const [y, h] of Object.entries(beklenen)) {
     let g;
     try {
       const r = await fetch(taban + y, { cache: 'no-store' });
       if (!r.ok) g = 'HTTP ' + r.status;
       else { const d = new Uint8Array(await crypto.subtle.digest('SHA-256', await r.arrayBuffer())); g = [...d].slice(0, 12).map((x) => x.toString(16).padStart(2, '0')).join(''); }
     } catch (e) { g = 'hata: ' + e.message; }
     if (g !== h) farkli.push(y + ' (--url ' + h + ', sahte köken ' + g + ')');
   }
   const ozetli = Object.values(beklenen).filter((h) => !/^(HTTP|hata)/.test(h)).length;
   return { yeterli: ozetli >= 20, farkli: farkli.slice(0, 12) };
 })()`, eq: {yeterli: true, farkli: []}, label: 'TK05e Ön koşul: sahte kökenler (rotaKok dizini = çalışma dizini) --url ile aynı ağacı sunuyor: sayfanın yüklediği en az 20 .js/.html/.css dosyasının SHA-256 özeti eşit (eşit değilse TK05 ve TK09 başka bir ağacı sınamış olur)'}},

 // ---- TK09 (A2-UY-02): test kipinde kancalar.js yüklenemezse açılış hatası GÖRÜNÜR yükleme ekranında kalır. Sahte yerel köken
 // (hostname localhost: test kipi açık) çalışma dizininden sunulur; sonraki (daha öncelikli) yönlendirme js/test/ altını 404'e bağlar.
 {rotaKok: {kok: 'http://localhost:47913', dizin: '.'}},
 {rotaKok: {kok: 'http://localhost:47913/js/test', dizin: '.yok-53-sahte-sinyal'}},
 {goto: {url: 'http://localhost:47913/index.html?test=1', testParam: false, hazir: false}},
 {expect: {js: `(async()=>{
   const t0 = performance.now();
   const menuAcik = () => !!document.getElementById('menu')?.classList.contains('active');
   const hataYazili = () => /başlatılamadı/.test(document.getElementById('load-text')?.textContent || '');
   while (performance.now() - t0 < 150000 && !menuAcik() && !hataYazili()) await new Promise((r) => setTimeout(r, 250));
   await new Promise((r) => setTimeout(r, 1500));
   const lt = document.getElementById('load-text');
   const yazi = lt ? lt.textContent : '';
   return { yukleme: !!document.getElementById('loading')?.classList.contains('active'), hataGorunur: !!(lt && lt.offsetParent) && /Oyun başlatılamadı/.test(yazi),
     kancaAdi: /kancalar\\.js/.test(yazi), menu: menuAcik(), hazir: window.__ready === true, dk: typeof window.DK,
     test: typeof window.__dkDurum === 'function' ? window.__dkDurum().test : '__dkDurum yok' };
 })()`, eq: {yukleme: true, hataGorunur: true, kancaAdi: true, menu: false, hazir: false, dk: 'undefined', test: true},
   label: 'TK09 Test kipinde kancalar.js yüklenemezse (404) açılış hatası görünür yükleme ekranında kalır: menü açılmaz, __ready yazılmaz, DK yok'}},
 {agSay: {desen: '^http://localhost:47913/js/test/kancalar\\.js$', enAz: 1, sonGezinmeden: true, label: 'TK09b Test kipindeki sahte yerel kökende kancalar.js gerçekten istendi (ve 404 aldı)'}},
]
