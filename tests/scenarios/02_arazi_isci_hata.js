// Faz 1 Adım B — tarayıcıda işçi hata yolları (62 test listesi 2 "Worker bulunamadığında", 3 "Worker çöktüğünde"; KI-034/A-02
// (terrain düzeyi), KI-153/A-05, KI-163/A-15, KI-165/A-17; brief madde 3, 17: "işçinin hazır sinyali gelmemesi, iş zaman aşımı ve
// MAX_TRIES dalları depoda hiç sınanmıyor; işçinin 'error' iletisi yolu sınanmıyor"). Yalnız İŞÇİLİ kipte anlamlıdır (normal kip,
// ya da Faz 1'in crash1 kipi); işçisiz kiplerde HI00 kalır. Hazır sinyali gelmemesi ve iş zaman aşımı, ?terrain=noready|hang
// kipleriyle 02_arazi_yasam / 02_arazi_yedek'te sınanır (v0.4'te bu kipler yok).
//
// Başlatma betiği (meta.baslatma): window.Worker'ı saran ince bir katman (02_arazi_yasam ile aynı) + iki enjeksiyon:
//   window.__isciKanca(ileti) → {gecikme: ms} | 'cok' (işçiye gerçek bir 'error' olayı gönderilir: çalışma sırasında çökme) |
//   'hata' (işçi {t:'error', id, msg} iletisi döndürmüş gibi 'message' olayı) | null (dokunma).
//   Adreste ?kurucu2=1 varsa ikinci Worker kurucusu SecurityError fırlatır (kısmi kurulum hatası, A-15).
// Olaylar dispatchEvent ile gönderilir (onerror/onmessage özellikleri ve addEventListener dinleyicileri ikisi de çalışır).
[
 {meta: {testler: ['2 Worker bulunamadığında', '3 Worker çöktüğünde', 'KI-034', 'KI-153', 'KI-163', 'KI-165', 'A-02', 'A-05', 'A-15', 'A-17'],
   dosyalar: ['js/world/terrain.js', 'js/world/terrainWorker.js', 'js/ui/mapArt.js'],
   izinliHatalar: [{desen: 'Arazi işçisi: .*test: enjekte üretim hatası', gerekce: "HI01/HI03 kasıtlı enjekte edilen işçi 'error' iletisi; v0.4 terrain._onMsg bunu console.error ile günlüğe yazar (beklenen tepki)", tur: 'konsol'}],
   baslatma: `(() => { const W = window.Worker; if (typeof W !== 'function') return;
     const kayit = window.__isciIleti = []; let kurulan = 0; const kurucu2 = /[?&]kurucu2=1/.test(location.search);
     function Sarili(url, opts) {
       kurulan++; if (kurucu2 && kurulan === 2) throw new DOMException('Test: ikinci işçi kurulamadı', 'SecurityError');
       const w = new W(url, opts); const post = w.postMessage.bind(w);
       w.postMessage = function (m, tr) { try { if (m && m.t && kayit.length < 50000) kayit.push({ t: m.t, key: m.key, seg: m.seg, res: m.res, id: m.id }); } catch (e) { /* yoksay */ }
         const k = typeof window.__isciKanca === 'function' ? window.__isciKanca(m) : null;
         if (k === 'cok') { setTimeout(() => { try { w.dispatchEvent(new ErrorEvent('error', { message: 'test: enjekte işçi çökmesi', cancelable: true })); } catch (e) { /* yoksay */ } }, 5); return; }
         if (k === 'hata') { setTimeout(() => { try { w.dispatchEvent(new MessageEvent('message', { data: { t: 'error', id: m.id, msg: 'test: enjekte üretim hatası' } })); } catch (e) { /* yoksay */ } }, 5); return; }
         if (k && k.gecikme > 0) { setTimeout(() => { try { post(m, tr); } catch (e) { /* kapalı */ } }, k.gecikme); return; }
         return post(m, tr); };
       return w; }
     Sarili.prototype = W.prototype; window.Worker = Sarili; })();`}},
 {expect: {js: `(()=>{ const T = DK.terrain; window.__basDurum = { mode: T.mode, workers: T.workers.length, fallback: T.fallback, failures: T.failures.length }; return T.workers.length >= 1 && T.fallback === false; })()`, truthy: true, label: 'HI00 Senaryo işçili kipte: en az bir arazi işçisi çalışıyor, yedek kip kapalı'}},
 {js: `window.__basDurum`},
 // ---- HI01: işçinin {t:'error'} iletisi (harita ızgarası üretim hatası)
 {expect: {js: `(async()=>{ const T = DK.terrain; const n0 = T.workers.length; window.__isciKanca = (m) => (m.t === 'grid' && m.res === 48 ? 'hata' : null); const t0 = performance.now();
   const r = await Promise.race([T.requestGrid(-2000, -2000, 4000, 48, -500).then((m) => (m && m.heights ? 'tamam' : 'eksik'), (e) => 'RED: ' + e.message), new Promise((s) => setTimeout(() => s('ASILI'), 10000))]);
   window.__isciKanca = null; window.__hata1 = { sonuc: r, ms: Math.round(performance.now() - t0), workersOnce: n0, workersSonra: T.workers.length, fallback: T.fallback };
   return r !== 'ASILI' && window.__hata1.ms <= 3000 && T.workers.length === n0 && T.fallback === false; })()`, truthy: true, label: "HI01 İşçinin 'error' iletisi: ızgara sözü ≤ 3 sn içinde sonuçlanır, işçi ölmez, yedek kip açılmaz"}},
 {js: `window.__hata1`},
 // ---- HI02: kalıcı karo hatası: geri çekilme ve failures sınırı (A-05)
 {js: `DK.G.noAutoPause = true; window.__bas = DK.handlers.startGame({ kind: 'solo', slot: 2, data: null }); 'başlatıldı'`},
 {expect: {js: `(async()=>{ await window.__bas; for (let i = 0; i < 100 && !(DK.G.state === 'playing' && DK.G.player); i++) await new Promise((r) => setTimeout(r, 100)); await new Promise((r) => setTimeout(r, 2000)); return DK.G.state === 'playing' && !!DK.G.player; })()`, truthy: true, label: 'HI02 Oyun başladı'}},
 {expect: {js: `(async()=>{ const T = DK.terrain, p = DK.G.player; if (typeof T._drop !== 'function') return 'iç ad yok: _drop';
   const t = [...T.tiles.values()].filter((x) => x.mesh && x.seg === 80).sort((a, b) => Math.hypot(a.x0 + 80 - p.pos.x, a.z0 + 80 - p.pos.z) - Math.hypot(b.x0 + 80 - p.pos.x, b.z0 + 80 - p.pos.z))[0];
   if (!t) return 'seg 80 karo yok'; const K = t.k; const f0 = T.failures.length;
   window.__isciKanca = (m) => (m.t === 'tile' && m.key === K ? 'hata' : null);
   const say = () => (window.__isciIleti || []).filter((m) => m.t === 'tile' && m.key === K).length; const n0 = say();
   T._drop(t);   // karo düşer; oyun döngüsü karoyu yeniden ister ve her istek hata alır
   const iv = setInterval(() => T.update(DK.engine.camera.position.x, DK.engine.camera.position.z, true), 100);   // 10 güncelleme/sn
   await new Promise((r) => setTimeout(r, 12000)); clearInterval(iv); window.__isciKanca = null;
   window.__kalici = { key: K, istek12sn: say() - n0, failuresArtis: T.failures.length - f0, failures: T.failures.length };
   return window.__kalici.istek12sn; })()`, lte: 5, label: 'HI03 Kalıcı hatalı karo (A-05): 12 sn içinde (10 güncelleme/sn) aynı karo en çok 5 kez istenir (üstel geri çekilme)'}},
 {js: `window.__kalici`},
 {expect: {js: `DK.terrain.failures.length`, lte: 50, label: 'HI04 Kalıcı hatalı karodan sonra failures.length ≤ 50 (A-05)'}},
 // ---- HI05: MAX_TRIES → yerel devir (ızgara işini alan her işçi çöker; A-05). İşçileri öldürür: sona yakın.
 {expect: {js: `(async()=>{ const T = DK.terrain; window.__isciKanca = (m) => (m.t === 'grid' && m.res === 64 ? 'cok' : null); const t0 = performance.now();
   const r = await Promise.race([T.requestGrid(-3000, -3000, 6000, 64, -500).then((m) => (m && m.heights && m.heights.length === 4096 ? 'tamam' : 'eksik'), (e) => 'RED: ' + e.message), new Promise((s) => setTimeout(() => s('ASILI'), 60000))]);
   window.__isciKanca = null; window.__maxTries = { sonuc: r, ms: Math.round(performance.now() - t0), workers: T.workers.length, fallback: T.fallback, gridGonderim: (window.__isciIleti || []).filter((m) => m.t === 'grid' && m.res === 64).length, failures: T.failures.slice(-4) };
   return r; })()`, eq: 'tamam', label: 'HI05 MAX_TRIES (A-05): ızgara işini alan her işçi çökse de iş yerel yedekte üretilir (söz reddedilmez)'}},
 {js: `window.__maxTries`},
 {expect: {js: `(async()=>{ const t0 = performance.now(); while (DK.terrain.stats().jobs > 0 && performance.now() - t0 < 30000) await new Promise((r) => setTimeout(r, 200)); return DK.terrain.stats().jobs; })()`, eq: 0, label: 'HI06 İşçiler çöktükten sonra kalan bütün arazi işleri 30 sn içinde sonuçlanır'}},
 // ---- HI07: kısmi kurucu hatası (ikinci Worker kurucusu fırlatır; A-15) — yeni sayfa
 {goto: 'index.html?kurucu2=1'},
 {js: `(()=>{ const T = DK.terrain; return { workers: T.workers.length, fallback: T.fallback, failures: T.failures.slice(0, 3), meshes: T.stats().meshes }; })()`},
 {expect: {js: `(()=>{ const T = DK.terrain; return T.workers.length >= 1 && T.fallback === false; })()`, truthy: true, label: 'HI07 Kısmi kurucu hatası (A-15): kurulabilen işçi çalışır ve yedek kip işareti KAPALI kalır (fallback=false)'}},
 {expect: {js: `DK.terrain.stats().meshes`, gte: 20, label: 'HI08 Kısmi kurucu hatasında açılış tamamlanır (≥ 20 karo ağı)'}},
]
