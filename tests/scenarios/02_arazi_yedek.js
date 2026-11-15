// Arazi işçisi yedeği: aynı senaryo ?terrain=noworker / badurl / crash kipleriyle ve normal kipte çalıştırılır.
// Kabul: oyun yükleme ekranını geçer, karolar üretilir, oyuncu zemine basar, derinlik penceresi ve harita ızgarası gelir.
// Faz 1 Adım B (brief madde 18a, 20; KI-149, KI-234): eski kontrollerin ÖNÜNE kip denetimi (AYK-01, AYK-02) ve uzak bölge
// hazırlık süresini ölçümden kontrole çeviren AYS-01 eklendi (eski kontroller değişmedi). Kipler: '' (normal), noworker, badurl,
// crash ve Faz 1'in yeni kipleri ctorthrow, noready, hang, crash1 — her kip AYRI koşulur. Uzak prepare sırasında yerel dilimler
// ve dilimler arası boşluklar ölçülür (AYS-01'in tanı satırı; v0.4 iç adı _localSlice, yoksa yalnız süre yazılır).
// B0 düzeltmesi (inceleme B0-I01, B0-I06):
//  - AYS-01 artık çizimle yarışan duvar saatine bakmaz. v0.4'te aynı kodla crash kipinde Tuz Pazarı prepare'i 365 / 1381 / 28 822 /
//    36 481 ms sürdü; yavaş koşularda yerel dilim toplamı 333–655 ms, dilimler arasında 18–26 sn'lik tek bir ana iş parçacığı
//    duraklaması (yazılımsal GPU'da çizim/derleme) vardı: ölçülen gecikme kuyruğa değil ortama ait, crash kipine özgü değil (açılıştan
//    sonra v0.4'te crash, badurl ve noworker kuyruk açısından aynı: işçi 0, yedek açık; işçi yeniden başlatılmıyor). Yeni AYS-01,
//    oyunun kendi FPS sınırı ayarıyla (engine.fpsLimit) çizim durdurulmuşken AYRI uzak ada bölgelerinin (Kuzeyfener, Kül Limanı, Kumsaati; 5,3–5,5 km) hazırlığını
//    ölçer: kuyruğun kendi süresi (dilimler + varsa yeniden deneme/geri çekilme/yeniden başlatma beklemeleri). Çizimin durduğu ölçülür
//    (post.render çağrısı 0); durmazsa ölçüm yine yapılır (daha sıkı taraf). Üç ayrı uzak bölge sırayla ölçülür ve ortanca kullanılır
//    (FB0 son koşusunda tek bölge ölçümü makine yükü altında noworker'da 4,7 sn verdi, önceki koşularda 0,75–0,8 sn; inceleyicinin
//    "en az 3 ölçüm, medyan" önerisi). Tuz Pazarı ölçümü (çizim açık) tanı satırı olarak kalır;
//    uzun görev gözlemcisi (PerformanceObserver 'longtask') duraklamanın bileşimini yazar.
//  - AYS-02 (yeni): hiçbir arazi işi işçilere MAX_TRIES'tan (v0.4: 3) fazla gönderilmez (yeniden başlatılan işçilere iş sektirme yok).
//  - AYK-02'nin crash ve hang beklentisi gözlenebilir sonuçla yazıldı: "iş alıp hiç yanıt vermeyen her işçi sonlandırılmış, hata kaydı
//    var, işçi kurulumu ≤ 9 (3 yuva × (1 + en çok 2 yeniden başlatma), brief madde 3)". Eski "işçi 0 + yedek açık" beklentisi, boşta
//    yeniden başlatılmış canlı işçi bırakan doğru bir A-15 uygulamasında 45 sn içinde sağlanamazdı (uygulamaya bağımlılık).
//  Başlatma betiği (meta.baslatma): window.Worker'ı saran ince bir katman (iletileri değiştirmez; işçi başına gönderilen iş, yanıt,
//  hata ve terminate sayılır; iş kimliği başına gönderim sayısı tutulur) ve uzun görev gözlemcisi.
[
 {meta: {testler: ['1 Normal Worker açılışı', '2 Worker bulunamadığında', '3 Worker çöktüğünde', '4 Arazi mesh oluşturulması', '5 Harita derinliği hazırlanması', 'KI-149', 'KI-234', 'A-05', 'A-15', 'A-17'],
   dosyalar: ['js/world/terrain.js', 'js/world/terrainWorker.js', 'js/game/game.js'],
   baslatma: `(() => {
     const U = window.__uzunGorev = [];
     const al = (l) => { for (const e of l.getEntries()) if (U.length < 50000) U.push([e.startTime, e.duration, e.entryType]); };
     try { if (!(PerformanceObserver.supportedEntryTypes || []).includes('longtask')) throw new Error('longtask desteklenmiyor'); new PerformanceObserver(al).observe({ type: 'longtask', buffered: true }); window.__uzunGorevVar = true; } catch (e) { window.__uzunGorevVar = false; window.__uzunGorevHata = String(e && e.message || e); }
     const W = window.Worker; if (typeof W !== 'function') return;
     const I = window.__isciler = []; const G = window.__isGonderim = new Map();
     function Sarili(url, opts) {
       const w = new W(url, opts); const k = { no: I.length, ad: opts && opts.name, t0: Math.round(performance.now()), is: 0, yanit: 0, hata: 0, sonlandi: false };
       I.push(k);
       const post = w.postMessage.bind(w);
       w.postMessage = function (m, tr) { try { if (m && m.t && m.id != null) { k.is++; G.set(m.id, (G.get(m.id) || 0) + 1); } } catch (e) { /* yoksay */ } return post(m, tr); };
       const son = w.terminate.bind(w); w.terminate = function () { k.sonlandi = true; return son(); };
       // yanıt/hata sayımı ek dinleyiciyle değil, oyunun kendi onmessage/onerror işleyicisi sarılarak yapılır (iletiye ikinci dinleyici
       // eklenmez). Not (FB0): 02_arazi_yasam'daki sayfa çökmeleri önce ek dinleyiciye bağlanmıştı; sonra cgroup OOM öldürmesi olduğu
       // görüldü (dmesg), dinleyiciyle ilgisi yok.
       for (const [ad, say] of [['onmessage', (e) => { if (e && e.data && e.data.t && e.data.t !== 'ready') k.yanit++; }], ['onerror', () => { k.hata++; }]]) {
         const d = Object.getOwnPropertyDescriptor(W.prototype, ad); if (!d || !d.set) continue;
         Object.defineProperty(w, ad, { configurable: true, get() { return d.get.call(w); }, set(fn) { d.set.call(w, typeof fn === 'function' ? function (e) { try { say(e); } catch (x) { /* yoksay */ } return fn.call(this, e); } : fn); } });
       }
       return w; }
     Sarili.prototype = W.prototype; window.Worker = Sarili; })();`}},
 {expect: {js: `(()=>{ const k = new URLSearchParams(location.search).get('terrain') || ''; window.__kip = k; return DK.terrain.mode === k; })()`, truthy: true, label: 'AYK-01 Etkin arazi kipi URL ile aynı (?terrain → DK.terrain.mode)'}},
 {expect: {js: `(async()=>{ const k = window.__kip, T = DK.terrain; const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
   const kipte = { '': () => T.workers.length >= 1 && T.fallback === false && T.failures.length === 0,
     noworker: () => T.workers.length === 0 && T.fallback === true,
     ctorthrow: () => T.workers.length === 0 && T.fallback === true && T.failures.length >= 1,
     badurl: () => T.workers.length === 0 && T.fallback === true && T.failures.length > 0,
     crash: () => T.failures.length >= 1 && sessizler() === 0 && kurulan() >= 1 && kurulan() <= 9,
     crash1: () => T.failures.length >= 1 && T.fallback === false && T.workers.length >= 1,
     hang: () => T.failures.length >= 1 && sessizler() === 0 && kurulan() >= 1 && kurulan() <= 9,
     noready: () => T.failures.length >= 1 && T.fallback === true }[k];
   // işçi izleyici (başlatma betiği): iş alıp hiç yanıt vermemiş ve hâlâ sonlandırılmamış işçi sayısı; kurulan işçi sayısı
   function sessizler() { return (window.__isciler || []).filter((w) => w.is > 0 && w.yanit === 0 && !w.sonlandi).length; }
   function kurulan() { return (window.__isciler || []).length; }
   let ok = false; const t0 = performance.now();
   if (kipte) while (!(ok = kipte()) && performance.now() - t0 < 45000) await bekle(200);
   window.__kipDurum = { k, mode: T.mode, workers: T.workers.length, fallback: T.fallback, failures: T.failures.slice(0, 4), beklemeMs: Math.round(performance.now() - t0), isciler: (window.__isciler || []).map((w) => [w.no, w.is, w.yanit, w.hata, w.sonlandi ? 'son' : 'canli']) };
   return ok; })()`, truthy: true, label: 'AYK-02 Kipin beklenen işçi/yedek durumu (normal: işçi ≥ 1, yedek kapalı, hata yok; noworker: işçi 0 + yedek; ctorthrow/badurl: işçi 0 + yedek + hata kaydı; crash/hang: hata kaydı, iş alıp yanıt vermeyen her işçi sonlandırılmış, kurulan işçi ≤ 9; crash1: yedek kapalı + çökme kaydı; noready: zaman aşımı kaydı + yedek)'}},
 {js: `window.__kipDurum`},
 {expect: {js: `!!window.DK && !!window.__ready`, truthy: true, label: 'Sayfa hazır (yükleme ekranı aşıldı)'}},
 {js: `({ mode: DK.terrain.mode, workers: DK.terrain.workers.length, fallback: DK.terrain.fallback, failures: DK.terrain.failures.slice(0,4), stats: DK.terrain.stats() })`},
 {expect: {js: `DK.terrain.stats().meshes`, gte: 20, label: 'Menü sahnesinde karo ağları üretildi'}},
 {expect: {js: `!!DK.terrain.depthWin`, truthy: true, label: 'Okyanus derinlik penceresi hazır'}},
 {js: `DK.G.noAutoPause=true; window._t0=performance.now(); DK.handlers.startGame({kind:'solo', slot:2, data:null}).then(()=>{ window._startMs = Math.round(performance.now()-window._t0); }); 'ok'`},
 {wait: 4000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
 {js: `({ startMs: window._startMs, pendingJobs: DK.terrain.stats().jobs, queue: DK.terrain.stats().queue })`},
 {expect: {js: `(()=>{ DK.sim(3); const p=DK.G.player; const g=DK.terrain.heightAt(p.pos.x,p.pos.z); return Math.abs(p.pos.y - g) < 0.6 && g > -1; })()`, truthy: true, label: 'Oyuncu zemine basıyor'}},
 {expect: {js: `(()=>{ const t=[...DK.terrain.tiles.values()].filter(t=>t.heights && t.mesh); return t.length; })()`, gte: 4, label: 'Yüksek çözünürlüklü karolar (yükseklik ızgarası + ağ)'}},
 // AYS-01 ölçümü (B0-I01): çizim durdurulmuşken (engine.fpsLimit ≈ 0: döngü kare çizmez) üç ayrı uzak ADA bölgesinin hazırlığı (r300) sırayla
 // (Kuzeyfener limanı, Kül Limanı adası, Kumsaati adası: başlangıca 5,3–5,5 km, birbirine ≥ 7 km; açık deniz bölgeleri karo maliyeti düşük olduğu için seçilmedi);
 // her ölçümden önce kuyruğun boşalması beklenir (≤ 10 sn); karar ortanca süreyle verilir (makine yükünden gelen tek yavaş ölçüme dayanıklı)
 {js: `(async()=>{ const T = DK.terrain, E = DK.engine, P = DK.post; const BOLGE = [[282, -5006], [5300, 400], [-5300, 700]];
   const A = window.__aysOlcum = { r: 300, fpsLimitVar: typeof E.fpsLimit === 'number', olcumler: [] }; const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
   let cizim = 0; const r0 = P && P.render; if (P && typeof r0 === 'function') P.render = function () { cizim++; return r0.apply(this, arguments); };
   const fps0 = E.fpsLimit; E.fpsLimit = 1e-6; await bekle(400);
   try { for (const [X, Z] of BOLGE) { const b0 = performance.now(); while (T.stats().jobs > 0 && performance.now() - b0 < 10000) await bekle(50);
       const c0 = cizim, j0 = T.stats().jobs, t0 = performance.now(); const donus = await T.prepare(X, Z, { radius: 300 }); const ms = Math.round(performance.now() - t0);
       A.olcumler.push({ bolge: [X, Z], ms, oncekiIs: j0, cizim: cizim - c0, donus: donus === undefined ? 'undefined' : donus, ag: [...T.tiles.values()].filter((t) => t.mesh && Math.hypot(t.x0 + 80 - X, t.z0 + 80 - Z) < 400).length }); } }
   finally { E.fpsLimit = fps0; if (P && r0) P.render = r0; }
   const sira = A.olcumler.map((o) => o.ms).sort((a, b) => a - b); A.ms = sira[Math.floor(sira.length / 2)]; A.cizimSirasinda = A.olcumler.reduce((n, o) => n + o.cizim, 0);
   A.cizimDurdu = A.cizimSirasinda === 0; A.ag = Math.min(...A.olcumler.map((o) => o.ag)); return A; })()`},
 {expect: {js: `(()=>{ const A = window.__aysOlcum, k = window.__kip; if (!A || typeof A.ms !== 'number' || A.olcumler.length !== 3) return false; A.sinir = k === '' ? 2000 : 3000; return A.ms <= A.sinir && A.ag >= 6; })()`, truthy: true, label: 'AYS-01 Uzak bölge hazırlığı r300, çizim durdurulmuşken (kuyruğun kendi süresi; üç ayrı uzak ada bölgesi — Kuzeyfener, Kül Limanı, Kumsaati — ortanca süre) kip sınırı içinde ve her bölgede ≥ 6 karo ağı: normal ≤ 2 sn, işçisiz/çöken kiplerde (crash, crash1 dahil) ≤ 3 sn (KI-234, A-15: yeniden başlatılan işçilere iş sektirme/bekleme yok)'}},
 {js: `window.__aysOlcum`},
 {js: `(()=>{ const T = DK.terrain; const tur = (j) => j && j.msg ? j.msg.t + ':' + (j.msg.seg || j.msg.res || '') : null; const D = window.__tani = { dilim: [], bosluk: [], kareler: 0, enUzunKare: 0, once: { jobs: T.stats().jobs, kuyruk: (T._queue || []).length, kuyrukTur: [...new Set((T._queue || []).map(tur))], seritler: (T._lanes || []).map(tur), isci: (T.workers || []).map((r) => [...r.jobs.values()].map(tur)) } };
   D.aralik = []; const o = T._localSlice; if (typeof o === 'function' && !o.__tani) { let son = null; const f = function () { const s = performance.now(); if (son !== null) D.bosluk.push(s - son); try { return o.apply(this, arguments); } finally { const e = performance.now(); D.dilim.push(e - s); if (D.aralik.length < 20000) D.aralik.push([s, e]); son = e; } }; f.__tani = true; T._localSlice = f; }
   let onceki = performance.now(); const kare = () => { const n = performance.now(); D.kareler++; D.enUzunKare = Math.max(D.enUzunKare, n - onceki); onceki = n; if (!D.bitti) requestAnimationFrame(kare); }; requestAnimationFrame(kare);
   return D.once; })()`},
 {expect: {js: `(async()=>{ const t0=performance.now(); window._prepT0 = t0; await DK.terrain.prepare(1900, 950, {radius: 300}); const t1 = performance.now(); window._prepT1 = t1; const ms=t1-t0; window._prepMs=Math.round(ms); return true; })()`, truthy: true, label: 'Uzak bölge prepare() sonuçlanıyor (askıda kalmıyor)'}},
 {js: `(()=>{ const D = window.__tani; D.bitti = true; const top = (a) => Math.round(a.reduce((x, y) => x + y, 0)); const mx = (a) => (a.length ? +Math.max(...a).toFixed(1) : 0); return { prepMs: window._prepMs, dilimSayisi: D.dilim.length, dilimToplamMs: top(D.dilim), enUzunDilim: mx(D.dilim), boslukToplamMs: top(D.bosluk), enUzunBosluk: mx(D.bosluk), kareSayisi: D.kareler, enUzunKareMs: Math.round(D.enUzunKare), once: D.once }; })()`},
 // Tanı (kontrol değil): Tuz Pazarı prepare'inin [t0, t1] aralığına düşen 'longtask' kayıtlarının yerel arazi dilimleri DIŞINDA kalan
 // kısmı (çizim, derleme, GC …) ve kalan "net" süre. Not: Chromium'da çizim adımları longtask'a tam yansımayabilir; bu yüzden kontrol
 // (AYS-01) çizim durdurularak ayrı ölçülür.
 {js: `(()=>{ const t0 = window._prepT0, t1 = window._prepT1, D = window.__tani || { aralik: [] };
   const ort = (a, b) => Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0])); const W = [t0, t1];
   const uzun = (window.__uzunGorev || []).filter((e) => e[2] === 'longtask').map((e) => [e[0], e[0] + e[1]]).filter((a) => ort(a, W) > 0);
   let disariMs = 0, dilimIciMs = 0, enUzun = 0;
   for (const a of uzun) { const k = [Math.max(a[0], t0), Math.min(a[1], t1)]; const ic = (D.aralik || []).reduce((n, d) => n + ort(d, k), 0); dilimIciMs += ic; const dis = (k[1] - k[0]) - ic; disariMs += dis; enUzun = Math.max(enUzun, dis); }
   const ham = t1 - t0; const net = window.__uzunGorevVar ? ham - disariMs : ham;
   window.__ays = { hamMs: Math.round(ham), netMs: Math.round(net), aracDisiUzunGorevMs: Math.round(disariMs), uzunGorev: uzun.length, enUzunAracDisiMs: Math.round(enUzun), uzunGorevIciDilimMs: Math.round(dilimIciMs), dilimToplamMs: Math.round((D.aralik || []).reduce((n, d) => n + ort(d, W), 0)), uzunGorevOrnek: uzun.slice(0, 6).map((a) => [Math.round(a[0] - t0), Math.round(a[1] - a[0])]), gozlemci: window.__uzunGorevVar ? 'longtask' : 'yok: ' + window.__uzunGorevHata };
   return window.__ays; })()`},
 {expect: {js: `!!DK.terrain.depthWin && Math.hypot(DK.terrain.depthWin.x0+1200-1900, DK.terrain.depthWin.z0+1200-950) < 100`, truthy: true, label: 'Derinlik penceresi yeni bölgeye taşındı'}},
 {js: `({ prepMs: window._prepMs, prepUnder45s: window._prepMs < 45000, stats: DK.terrain.stats() })`},
 {js: `({ kip: window.__kip, tani: 'Tuz Pazarı prepare (çizim açık): ham süre ve uzun görev bileşimi', ...window.__ays })`},
 {expect: {js: `(()=>{ const G = window.__isGonderim; if (!(G instanceof Map)) return 'izleyici yok'; let en = 0, id = null; for (const [k, n] of G) if (n > en) { en = n; id = k; } window.__gonderim = { is: G.size, toplam: [...G.values()].reduce((a, b) => a + b, 0), enCok: en, enCokIs: id, isciler: (window.__isciler || []).map((w) => [w.no, w.is, w.yanit, w.hata, w.sonlandi ? 'son' : 'canli']) }; return en; })()`, lte: 3, label: 'AYS-02 Hiçbir arazi işi işçilere MAX_TRIES (3) kezden fazla gönderilmez (yeniden başlatılan işçilere iş sektirme yok; A-05, A-15, KI-234)'}},
 {js: `window.__gonderim`},
 {expect: {js: `(()=>{ const t=[...DK.terrain.tiles.values()].filter(t=>t.mesh && Math.hypot(t.x0+80-1900, t.z0+80-950) < 400); return t.length; })()`, gte: 6, label: 'Tuz Pazarı çevresinde karo ağları var'}},
 {expect: {js: `(async()=>{ const m = await DK.terrain.requestGrid(-10000, -10000, 20000, 256, -500); return m && m.heights && m.heights.length === 65536 && m.biomes.length === 65536; })()`, truthy: true, label: 'Harita ızgarası isteği sonuçlanıyor'}},
 {expect: {js: `(()=>{ const p=DK.G.player; p.mode='ground'; p.ship=null; p.pos.set(1930, DK.terrain.heightAt(1930,980)+0.2, 980); p.vel.set(0,0,0); DK.sim(2); DK.input.down.add('KeyW'); DK.sim(2); DK.input.down.clear(); const g=DK.terrain.heightAt(p.pos.x,p.pos.z); return Math.abs(p.pos.y-g) < 0.6; })()`, truthy: true, label: 'Uzak adada yürüme (zemin sorgusu tutarlı)'}},
 {js: `window._j0 = DK.terrain.stats().jobs; 'ok'`},
 {wait: 8000, expect: {js: `(()=>{ const j=DK.terrain.stats().jobs; return j < window._j0 || j === 0; })()`, truthy: true, label: 'Kuyruk ilerliyor (askıda iş yok)'}},
 {js: `({ jobsBefore: window._j0, jobsAfter8s: DK.terrain.stats().jobs, fallback: DK.terrain.fallback })`},
]
