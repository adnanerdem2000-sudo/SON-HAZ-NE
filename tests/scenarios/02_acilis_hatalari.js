// Faz 1 Adım B (B0 test düzeltmesi; inceleme B0-I03, B0-I10, B0-I11) — açılış hata ve gecikme yolları (62 test listesi 1 "Normal
// Worker açılışı", 2 "Worker bulunamadığında", 3 "Worker çöktüğünde", 5 "Harita derinliği/ızgarası"; KI-034/A-02, A-04, A-05, A-11;
// brief madde 1, 2, 3, 7). Her durum ayrı bir sayfa yüklemesidir (goto, hazir: false); açılış window.__ready'ye ya da sınıra kadar
// yoklanır. Başlatma betiği yalnız adresteki parametreyle etkinleşir; parametresiz açılış (koşucunun ilk açılışı ve normal başvuru)
// değişmez.
//   ?izgara=hata  açılıştakiler dahil her 'grid' işine işçi {t:'error'} döndürmüş gibi yanıt verilir (A-02; v0.4'te açılış düşüyordu:
//                 "Oyun başlatılamadı: … WebGL destekli güncel bir tarayıcı gerekiyor", inceleme tanı koşusu)
//   ?izgara=cok   her 'grid' işini alan işçi çöker (gerçek 'error' olayı) → MAX_TRIES (A-05 + A-02)
//   ?isci=hang    işçi hazır olur ama hiçbir işe yanıt vermez (A-11; v0.4'te iş zaman aşımı 20 sn)
//   ?isci=noready işçi hazır sinyali göndermez ve yanıt vermez (A-11; v0.4'te READY_TIMEOUT 8 sn)
//   ?webgl=yok    canvas.getContext('webgl*') null döner (A-04: ileti türü doğru: WebGL)
//   ?importmap=yok HTMLScriptElement.supports('importmap') false döner (A-04: tek dosya sürümüne yönlendiren ileti)
//   ?modul=yok    import map'teki 'three' girdisi var olmayan dosyaya çevrilir (sayfa ayrıştırılırken; A-04: modül yüklenemedi iletisi)
//   ?askida=1     .glb model istekleri hiç sonuçlanmaz; açılış takılır (A-04: 30–60 sn içinde __ready gelmezse uyarı)
// #load-text'in aldığı her metin zamanıyla kaydedilir (window.__yuklemeMetinleri); "normal metinler" kümesi normal başvuru açılışından
// alınır, hata/gecikme iletisi bu kümenin dışındaki metinlerde aranır (uygulamanın sözcük seçimine olabildiğince az bağlı).
// Haritanın dünya ızgarası: mapArt modülü (aynı adres = aynı modül örneği) dinamik içe aktarılır; renderMapBase() geçici 64×64
// parşömenden büyük bir tuval döndürüyorsa ızgara üretilmiştir.
[
 {meta: {testler: ['1 Normal Worker açılışı', '2 Worker bulunamadığında', '3 Worker çöktüğünde', '5 Harita derinliği hazırlanması', 'KI-034', 'A-02', 'A-04', 'A-05', 'A-11', 'brief madde 1, 2, 3, 7'],
   dosyalar: ['index.html', 'js/main.js', 'js/ui/mapArt.js', 'js/world/terrain.js', 'js/core/assets.js'],
   izinliHatalar: [
     {desen: 'Arazi işçisi: .*test: enjekte ızgara hatası', gerekce: "?izgara=hata: kasıtlı enjekte edilen işçi 'error' iletisi; terrain._onMsg bunu console.error ile yazar (beklenen tepki, açılış hatası DEĞİL)", tur: 'konsol'},
     {desen: 'Error creating WebGL context|WebGL context', gerekce: '?webgl=yok: getContext kasıtlı olarak null döner; three.js ve açılış hatası konsola yazılır (beklenen)', tur: 'konsol'},
     {desen: 'three\\.module\\.yok\\.js', gerekce: "?modul=yok: import map'teki 'three' girdisi kasıtlı olarak var olmayan dosyaya çevrilir; 404 ve modül yükleme hatası beklenir", tur: 'hepsi'},
   ],
   baslatma: `(() => {
     const q = location.search; const kip = (ad) => { const m = new RegExp('[?&]' + ad + '=([a-z0-9_]+)', 'i').exec(q); return m ? m[1] : null; };
     // __ready'nin yazıldığı an (belge zamanı): koşucunun erişimcisi (varsa) korunarak sarılır; yoklama gecikmesinden bağımsız
     const d = Object.getOwnPropertyDescriptor(window, '__ready'); const isaretle = (v) => { if (v && window.__readyAni === undefined) window.__readyAni = Math.round(performance.now()); };
     if (d && d.configurable && typeof d.set === 'function') Object.defineProperty(window, '__ready', { configurable: true, enumerable: true, get: d.get, set(v) { isaretle(v); d.set.call(window, v); } });
     else if (!d) { let h; Object.defineProperty(window, '__ready', { configurable: true, enumerable: true, get() { return h; }, set(v) { isaretle(v); h = v; } }); }
     const L = window.__yuklemeMetinleri = [];
     const izle = () => { const t = document.getElementById('load-text'); if (!t) return false; const kaydet = () => { const x = (t.textContent || '').trim(); if (x && (!L.length || L[L.length - 1][1] !== x) && L.length < 500) L.push([Math.round(performance.now()), x]); }; kaydet(); new MutationObserver(kaydet).observe(t, { childList: true, characterData: true, subtree: true }); return true; };
     if (!izle()) document.addEventListener('DOMContentLoaded', izle);
     const izgara = kip('izgara'), isci = kip('isci'); const W = window.Worker;
     if (typeof W === 'function' && (izgara || isci)) {
       function Sarili(url, opts) { const w = new W(url, opts); const post = w.postMessage.bind(w);
         if (isci === 'noready') w.addEventListener('message', (e) => { if (e.data && e.data.t === 'ready') e.stopImmediatePropagation(); });
         w.postMessage = function (m, tr) {
           if (isci === 'hang' || isci === 'noready') return;
           if (m && m.t === 'grid' && izgara === 'hata') { setTimeout(() => { try { w.dispatchEvent(new MessageEvent('message', { data: { t: 'error', id: m.id, msg: 'test: enjekte ızgara hatası' } })); } catch (e) { /* yoksay */ } }, 5); return; }
           if (m && m.t === 'grid' && izgara === 'cok') { setTimeout(() => { try { w.dispatchEvent(new ErrorEvent('error', { message: 'test: enjekte işçi çökmesi (ızgara)', cancelable: true })); } catch (e) { /* yoksay */ } }, 5); return; }
           return post(m, tr); };
         return w; }
       Sarili.prototype = W.prototype; window.Worker = Sarili;
     }
     if (kip('webgl') === 'yok') { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t) { if (/webgl/i.test(String(t))) return null; return g.apply(this, arguments); }; }
     if (kip('importmap') === 'yok' && typeof HTMLScriptElement !== 'undefined') { const s0 = HTMLScriptElement.supports; HTMLScriptElement.supports = function (t) { return t === 'importmap' ? false : (s0 ? s0.call(HTMLScriptElement, t) : false); }; }
     if (kip('modul') === 'yok') { const mo = new MutationObserver((kayitlar) => { for (const r of kayitlar) for (const n of r.addedNodes) if (n.tagName === 'SCRIPT' && n.type === 'importmap' && !n.__degisti) { try { const j = JSON.parse(n.textContent); if (j.imports && j.imports.three) { j.imports.three = j.imports.three.replace(/\\.js$/, '.yok.js'); n.textContent = JSON.stringify(j); n.__degisti = true; window.__importmapDegisti = true; } } catch (e) { window.__importmapHata = String(e); } } }); mo.observe(document, { childList: true, subtree: true }); }
     if (kip('askida') === '1') { const f0 = window.fetch; window.fetch = function (u) { if (/\\.glb(\\?|$)/i.test(String(u && u.url || u))) return new Promise(() => {}); return f0.apply(this, arguments); }; }
   })();`}},
 // ---- sayfa yardımcıları (her yüklemede yeniden kurulur)
 {degisken: {ad: 'yardimci', deger: `(()=>{ const A = window.__A = {};
   A.bekle = (ms) => new Promise((r) => setTimeout(r, ms));
   A.metin = () => ((document.getElementById('load-text') || {}).textContent || '').trim();
   A.metinler = () => (window.__yuklemeMetinleri || []).map((x) => x[1]);
   A.normal = () => { try { return JSON.parse(window.__KOSUCU.normalMetinler || '[]'); } catch (e) { return []; } };
   A.yeniMetinler = () => { const N = new Set(A.normal()); return (window.__yuklemeMetinleri || []).filter((x) => !N.has(x[1])); };
   // açılış: __ready gelene, "başlatılamadı" metni 3 sn kalana ya da sınır (belge zamanı, ms) dolana kadar; __ready'nin görüldüğü an
   A.acilis = async (sinir) => { let bas = null, ready = null; while (performance.now() < sinir) { if (window.__ready) { ready = window.__readyAni !== undefined ? window.__readyAni : Math.round(performance.now()); break; } if (/başlatılamadı/i.test(A.metin())) { if (bas === null) bas = performance.now(); if (performance.now() - bas > 3000) break; } await A.bekle(100); }
     return { ready: !!window.__ready, readyMs: ready, menu: !!document.getElementById('menu')?.classList.contains('active'), yukleme: !!document.getElementById('loading')?.classList.contains('active'), sonMetin: A.metin(), metinler: (window.__yuklemeMetinleri || []).slice(-8) }; };
   A.harita = async (ms) => { const t0 = performance.now(); let c = null; const mod = await import(new URL('js/ui/mapArt.js', location.href).href); while (performance.now() - t0 < ms) { try { c = mod.renderMapBase(); } catch (e) { c = null; } if (c && c.width > 64) break; await A.bekle(250); } return { genislik: c ? c.width : null, yukseklik: c ? c.height : null }; };
   return Object.keys(A); })()`}},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `!!window.__ready && !!document.getElementById('menu')?.classList.contains('active')`, truthy: true, label: 'AH00 Normal açılış (parametresiz): window.__ready ve ana menü'}},
 // ---- normal başvuru (sıcak önbellek): açılış süresi ve yükleme metinleri
 {goto: {url: 'index.html', hazir: false}},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `(async()=>{ const r = await window.__A.acilis(90000); window.__normal = r; return r.ready && r.readyMs; })()`, gte: 1, label: 'AH01 Normal başvuru açılışı (sıcak önbellek) tamamlanır; süre ölçülür'}},
 {degisken: {ad: 'normalAcilisMs', js: `window.__normal.readyMs`}},
 {degisken: {ad: 'normalMetinler', js: `JSON.stringify(window.__A.metinler())`}},
 {js: `({ normal: window.__normal, metinler: window.__A.metinler() })`},
 // ==== A-02: açılıştaki dünya ızgarası işi işçiden 'error' alır
 {goto: {url: 'index.html?izgara=hata', hazir: false}},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `(async()=>{ const r = window.__izgaraHata = await window.__A.acilis(60000); return r.ready; })()`, truthy: true, label: "IZ01 Açılıştaki dünya ızgarası işi işçiden 'error' alsa da açılış tamamlanır (window.__ready; A-02)"}},
 {js: `window.__izgaraHata`},
 {expect: {js: `!!document.getElementById('menu')?.classList.contains('active') && !document.getElementById('loading')?.classList.contains('active')`, truthy: true, label: 'IZ02 Izgara hatasında ana menü açılır, yükleme ekranı kapanır'}},
 {expect: {js: `window.__A.metinler().filter((x) => /başlatılamadı|WebGL/i.test(x)).join(' | ') || 'yok'`, eq: 'yok', label: "IZ03 Izgara hatasında yükleme ekranında 'Oyun başlatılamadı' ya da yanıltıcı WebGL iddiası hiç görünmez"}},
 {expect: {js: `(async()=>{ const r = window.__haritaHata = await window.__A.harita(60000); return r.genislik; })()`, gte: 128, label: 'IZ04 Izgara hatasından sonra dünya haritası ızgarası 60 sn içinde (yerel yedekte) üretilir: renderMapBase geçici parşömenden büyük (A-02)'}},
 {js: `window.__haritaHata`},
 // ==== A-05 + A-02: ızgara işini alan her işçi çöker (MAX_TRIES)
 {goto: {url: 'index.html?izgara=cok', hazir: false}},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `(async()=>{ const r = window.__izgaraCok = await window.__A.acilis(60000); return r.ready; })()`, truthy: true, label: 'IZ05 Açılıştaki ızgara işini alan her işçi çökse de (MAX_TRIES) açılış tamamlanır (A-05, A-02)'}},
 {js: `({ acilis: window.__izgaraCok, workers: window.DK ? DK.terrain.workers.length : null, fallback: window.DK ? DK.terrain.fallback : null, failures: window.DK ? DK.terrain.failures.slice(0, 4) : null })`},
 {expect: {js: `!!document.getElementById('menu')?.classList.contains('active') && !document.getElementById('loading')?.classList.contains('active') && !window.__A.metinler().some((x) => /başlatılamadı|WebGL/i.test(x))`, truthy: true, label: "IZ06 İşçi çökmesinde ana menü açılır, yükleme ekranı kapanır, 'başlatılamadı'/WebGL iletisi görünmez"}},
 {expect: {js: `(async()=>{ const r = window.__haritaCok = await window.__A.harita(60000); return r.genislik; })()`, gte: 128, label: 'IZ07 İşçi çökmesinden sonra dünya haritası ızgarası 60 sn içinde yerel yedekte üretilir (A-05: iş yerel şeride devredilir)'}},
 // ==== A-11: işçi hazır olur ama hiç yanıt vermez
 {goto: {url: 'index.html?isci=hang', hazir: false}},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `(async()=>{ const r = window.__hang = await window.__A.acilis(120000); const n = window.__KOSUCU.normalAcilisMs; r.normalMs = n; return r.ready && r.readyMs !== null && r.readyMs <= n + 5000; })()`, truthy: true, label: 'AH02 Yanıt vermeyen (askıdaki) işçide açılış ≤ normal + 5 sn (A-11: ilk iş için kısa gözetim, yerel şerit paralel)'}},
 {js: `window.__hang`},
 {expect: {js: `window.__A.yeniMetinler().filter((x) => /işçi|yedek|zaman aşımı|yanıt|gecik|yavaş|arka plan/i.test(x[1])).map((x) => x[1]).join(' | ') || false`, truthy: true, label: 'AH03 Askıdaki işçide yükleme ekranı gecikmenin nedenini gösterir (normal açılışta görünmeyen, işçi/yedek/zaman aşımı anlatan bir metin; A-11)'}},
 // ==== A-11: işçi hazır sinyali göndermez (ve yanıt vermez)
 {goto: {url: 'index.html?isci=noready', hazir: false}},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `(async()=>{ const r = window.__noready = await window.__A.acilis(120000); const n = window.__KOSUCU.normalAcilisMs; r.normalMs = n; return r.ready && r.readyMs !== null && r.readyMs <= n + 5000; })()`, truthy: true, label: 'AH04 Hazır sinyali gelmeyen işçide açılış ≤ normal + 5 sn (A-11)'}},
 {js: `window.__noready`},
 {expect: {js: `window.__A.yeniMetinler().filter((x) => /işçi|yedek|zaman aşımı|yanıt|gecik|yavaş|arka plan/i.test(x[1])).map((x) => x[1]).join(' | ') || false`, truthy: true, label: 'AH05 Hazır sinyali gelmeyen işçide yükleme ekranı gecikmenin nedenini gösterir (A-11)'}},
 // ==== Faz 1'in yerleşik kipleri (?terrain=hang|noready, brief madde 14; v0.4'te yok → UYGULANAMAZ): aynı açılış süresi ölçütü ve kipin
 // etkisi (zaman aşımı/hata kaydı); kip etkisizse kontrol KALIR
 {goto: {url: 'index.html?terrain=hang', hazir: false}},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `(async()=>{ const r = window.__kipHang = await window.__A.acilis(120000); const n = window.__KOSUCU.normalAcilisMs; const T = window.DK && DK.terrain; Object.assign(r, { normalMs: n, mode: T ? T.mode : null, failures: T ? T.failures.slice(0, 3) : null }); return r.ready && !!T && T.mode === 'hang' && T.failures.length >= 1 && r.readyMs <= n + 5000; })()`, truthy: true, label: "AH10 ?terrain=hang kipinde açılış ≤ normal + 5 sn ve kipin zaman aşımı kaydı var (A-11, A-17)"}},
 {js: `window.__kipHang`},
 {goto: {url: 'index.html?terrain=noready', hazir: false}},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `(async()=>{ const r = window.__kipNoready = await window.__A.acilis(120000); const n = window.__KOSUCU.normalAcilisMs; const T = window.DK && DK.terrain; Object.assign(r, { normalMs: n, mode: T ? T.mode : null, failures: T ? T.failures.slice(0, 3) : null }); return r.ready && !!T && T.mode === 'noready' && T.failures.length >= 1 && r.readyMs <= n + 5000; })()`, truthy: true, label: "AH11 ?terrain=noready kipinde açılış ≤ normal + 5 sn ve kipin hazır-sinyali-yok kaydı var (A-11, A-17)"}},
 {js: `window.__kipNoready`},
 // ==== A-04: WebGL yok → ileti WebGL'i söyler (sınıflandırma doğru; gerileme koruması)
 {goto: {url: 'index.html?webgl=yok', hazir: false}},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `(async()=>{ const r = window.__webgl = await window.__A.acilis(30000); return !r.ready && window.__A.yeniMetinler().some((x) => /WebGL/i.test(x[1])); })()`, truthy: true, label: "AH06 WebGL yokken açılış durur ve ileti WebGL'i söyler (A-04: hata türüne göre ileti)"}},
 {js: `({ acilis: window.__webgl, yeni: window.__A.yeniMetinler() })`},
 // ==== A-04: import map desteği yok → tek dosya sürümüne yönlendiren ileti
 {goto: {url: 'index.html?importmap=yok', hazir: false}},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `(async()=>{ const t0 = performance.now(); let y = []; while (performance.now() - t0 < 15000) { y = window.__A.yeniMetinler().filter((x) => /tek (dosya|HTML)|import ?map|desteklemiyor|güncel/i.test(x[1])); if (y.length) break; await window.__A.bekle(250); } window.__importmap = { yeni: window.__A.yeniMetinler(), ready: !!window.__ready }; return y.map((x) => x[1]).join(' | ') || false; })()`, truthy: true, label: "AH07 Tarayıcı import map desteklemiyorsa (HTMLScriptElement.supports('importmap') false) yükleme ekranında tek dosya sürümüne yönlendiren ileti görünür (A-04)"}},
 {js: `window.__importmap`},
 // ==== A-04: modül yüklenemedi → 5 sn içinde anlaşılır ileti
 {goto: {url: 'index.html?modul=yok', hazir: false}},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `(async()=>{ const t0 = performance.now(); let y = []; while (performance.now() - t0 < 8000) { y = window.__A.yeniMetinler().filter((x) => /modül|yüklenemedi|dosya|eksik|bağlantı|ağ|sunucu/i.test(x[1])); if (y.length) break; await window.__A.bekle(250); } window.__modul = { importmapDegisti: !!window.__importmapDegisti, importmapHata: window.__importmapHata || null, ready: !!window.__ready, yeni: window.__A.yeniMetinler(), sonMetin: window.__A.metin() }; return !!window.__importmapDegisti && y.length > 0 && y[0][0] <= 10000; })()`, truthy: true, label: 'AH08 Bir modül yüklenemezse (three 404) yükleme ekranında ~5 sn içinde modül/dosya yüklenemedi iletisi görünür (A-04)'}},
 {js: `window.__modul`},
 // ==== A-04: açılış takılırsa (model istekleri sonuçlanmıyor) 30–60 sn içinde uyarı
 {goto: {url: 'index.html?askida=1', hazir: false}},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `(async()=>{ while (performance.now() < 70000) { if (window.__ready) break; if (window.__A.yeniMetinler().some((x) => x[0] >= 20000)) break; await window.__A.bekle(500); } const y = window.__A.yeniMetinler().filter((x) => x[0] >= 20000 && x[0] <= 65000); window.__askida = { ready: !!window.__ready, sonMetin: window.__A.metin(), yeni: window.__A.yeniMetinler(), simdi: Math.round(performance.now()) }; return y.map((x) => x[0] + ' ms: ' + x[1]).join(' | ') || false; })()`, truthy: true, label: 'AH09 Açılış takılırsa (__ready 30–60 sn içinde gelmezse) yükleme ekranında uyarı görünür (normal açılışta görünmeyen yeni metin, 20–65 sn arasında; A-04)'}},
 {js: `window.__askida`},
]
