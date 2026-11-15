// Faz 1 Adım B — hızlı yolculuk ve uzak ada ışınlanması (62 test listesi 9 "Hızlı yolculuk", 4 "Arazi mesh", 5 "Harita
// derinliği"; KI-035/A-03, KI-162/A-14, KI-234; brief madde 5, 10, 19). Normal ve ?terrain=noworker kipinde AYRI koşulur:
//   node tests/harness/run.cjs tests/scenarios/02_hizli_yolculuk.js --url "http://localhost:8081/index.html?terrain=noworker" …
// Dört bölüm; her bölüm sayfayı yeniden yükleyip yeni oyunla başlar (yazılımsal WebGL'de her uzak liman varışı yüzlerce MB bellek
// ve uzun bir ilk kare getiriyor; bölümler arası yenileme tarayıcının bellek sınırına takılmayı önler):
//   1) Uzak ada ışınlanması: oyunun kendi hızlı yolculuk yolu (G.emit('fastTravel'); rota kaptanı seçeneğinin yaydığı olay ve ücret
//      formülü quests.js) ile Kırlangıç → Kuzeyfener (5,3 km). Varışın İLK KARESİNDE ve sonrasında: gemi/oyuncu hedefte, gemi
//      durgun, derinlik penceresi hedefte, ≥ 6 karo ağı, zemin sorgusu = çizilen ağ, oyuncu zeminde, kamerada görünürlük + piksel.
//   2) A-03: bekleme sırasında ikinci emit yok sayılır, ücret bir kez düşer.
//   3) A-14: açık denizde (4000, -4000; her adaya ≥ 2 km, Kırlangıç'a 5,8 km) ölüm → ölüm ekranındaki "Kırlangıç Limanı'nda uyan"
//      düğmesi → uyanışın ilk karesinde ≥ 6 karo ağı ve derinlik penceresi.
//   4) A-03: bekleme sırasında menüye dönülürse devam kodu hiçbir şeyi değiştirmez, kayıttaki altın değişmez.
// "İlk kare": requestAnimationFrame izleyicisi, oyuncunun hedefte göründüğü ve ekranın örtülü olmadığı (#sleep-fade.on ya da
// #loading.active yok) ilk karede durumu kaydeder; uygulamadan bağımsızdır.
// B0 düzeltmesi (inceleme B0-I02, I04, I05, I16, I17):
//  - Bölüm 2 (HY10/HY11): sonuç artık geminin son konumundan çıkarılmıyor. Varışlar sayılır (oyunun 'arrivedPort' olayı ve gemi
//    konumunda tek karede ≥ 300 m sıçrama, rAF örnekleyicisi); başlatılan bütün prepare'ler bitip son olaydan sonra 5 sn sakin
//    geçince "tam bir varış, o da ilk hedefe; altın = başlangıç − ilk ücret" birlikte istenir.
//  - Bölüm 4 (HY16–HY19): sabit 20 sn yoklama yerine başlatılan prepare'in bitmesi + 3 sn beklenir (işçisiz kipte prepare 33–45 sn).
//  - HYS-01'in noworker kırmızısı KI-234 değildir (KI-234 crash/crash1 kabulü); işçisiz hızlı yolculuk gecikmesi ayrı bilinen sorun
//    adayıdır. HYS-02 (yeni): hızlı yolculuktaki prepare 'ok' döner (A-11; 'timeout' ile sessiz eksik varış yok).
//  - Bölüm 3: ölümden önce önkoşul (HY12b): Kırlangıç çevresinde karo ağı yok ve derinlik penceresi uzakta (yoksa HY13/HY14 kördür).
//  - HYU-05 (yeni): biniş noktası iskele platformunun üstünde mi (HYU-02 kırmızısının nedeni arazi değil, ports.js biniş noktası).
//  - Bölüm 5 (yeni, HY20/HY21): hazırlık zaman aşımına uğrarsa oyuncu bildirim alır (brief madde 5).
// B0 düzeltici (3. deneme): HYS-01'in noworker sonucu v0.4'te kararsız: aynı senaryo ve kodla 30 331 / 33 366 / 44 718 ms (KIRMIZI) ve
//    366 ms (YESIL, 15 Kasım son koşusu). 366 ms'lik koşuda yolculuktan hemen önceki ölçüm adımı ('m_once') 4,7 sn sürmüştü (önceki
//    koşularda 5 ms): yolculuk, başlangıç bölgesinin yerel kuyruğu boşaldıktan SONRA başlamış olabilir. Yolculuk başlarken kuyruk durumu
//    (bekleyen iş, kuyruk uzunluğu) artık tanı olarak yazılır (window.__ftOnce; kontrol değişmedi): sonuç bu önkoşulla birlikte okunmalı.
//  - Kip korunur (FB0'da bulunan ek kusur): koşucunun goto 'index.html' adımı sorgu dizgesini düşürüyordu; noworker koşusunda bölüm 2–4
//    aslında NORMAL kipte koşuyordu (B0 günlüğü: "GOTO …/index.html?test=1"). Başlatma betiği ilk sayfadaki ?terrain değerini oturum
//    deposuna yazar ve sonraki gezinmelerde sayfa betiklerinden önce adrese geri koyar (history.replaceState); her bölümün başında
//    HYK-n kipin korunduğunu denetler.
[
 {meta: {baslatma: `(() => { try { const q = new URLSearchParams(location.search); const k = q.get('terrain'); if (k !== null) sessionStorage.setItem('__fb0_arazi_kipi', k); else { const s = sessionStorage.getItem('__fb0_arazi_kipi'); if (s) { q.set('terrain', s); history.replaceState(history.state, '', location.pathname + '?' + q.toString() + location.hash); window.__kipKorundu = s; } } } catch (e) { /* oturum deposu yok: kip korunamaz, HYK/LYK kontrolleri yakalar */ } })();`, testler: ['9 Hızlı yolculuk', '4 Arazi mesh oluşturulması', '5 Harita derinliği hazırlanması', 'Uzak ada ışınlanması (Faz 1 zorunlu)', 'KI-035', 'KI-162', 'KI-234', 'A-03', 'A-14'],
   dosyalar: ['js/main.js', 'js/world/terrain.js', 'js/game/quests.js', 'js/world/ports.js', 'js/world/islands.js', 'js/ui/menu.js', 'js/game/game.js']}},
 // ---- yardımcılar (sayfada; her yeniden yüklemeden sonra koşu değişkeninden yeniden kurulur)
 {degisken: {ad: 'yardimci', deger: `(()=>{ const T = DK.terrain;
   const Y = window.__Y = {};
   Y.bekle = (ms) => new Promise((r) => setTimeout(r, ms));
   Y.agYakin = (x, z, r) => [...T.tiles.values()].filter((t) => t.mesh && t.mesh.parent === T.group && Math.hypot(t.x0 + 80 - x, t.z0 + 80 - z) < r).length;
   Y.derinlikUzak = (x, z) => { const w = T.depthWin; return w ? Math.round(Math.hypot(w.x0 + w.size / 2 - x, w.z0 + w.size / 2 - z)) : 1e9; };
   Y.ortu = () => !!(document.querySelector('#sleep-fade.on') || document.querySelector('#loading.active'));
   Y.yeniOyun = async () => { DK.G.noAutoPause = true; await DK.handlers.startGame({ kind: 'solo', slot: 0, data: null }); for (let i = 0; i < 100 && !(DK.G.state === 'playing' && DK.G.player); i++) await Y.bekle(100); const p = DK.G.player; p.inv.gold = 2000; return DK.G.state === 'playing' && !!p; };
   Y.ucret = (a, b) => Math.round(25 + Math.hypot(b.x - a.x, b.z - a.z) / 40);
   Y.prepareIzle = () => { const L = window.__prepler = []; const o = T.prepare; if (o.__izli) return; const f = async function (x, z, op) { const k = { x: Math.round(x), z: Math.round(z), r: op && op.radius, t0: performance.now() }; L.push(k); try { const r = await o.apply(this, arguments); k.donus = r === undefined ? 'undefined' : r; return r; } finally { k.ms = Math.round(performance.now() - k.t0); } }; f.__izli = true; T.prepare = f; };
   Y.prepareBitti = () => (window.__prepler || []).every((k) => typeof k.ms === 'number');
   Y.varisIzle = () => { if (window.__varislar) return; const V = window.__varislar = [], S = window.__sicramalar = []; DK.G.on('arrivedPort', (e) => V.push({ port: e && e.port, t: performance.now() }));
     let onceki = null; const f = () => { const s = DK.G.ship; if (s) { if (onceki && Math.hypot(s.x - onceki.x, s.z - onceki.z) >= 300) S.push({ x: Math.round(s.x), z: Math.round(s.z), t: performance.now() }); onceki = { x: s.x, z: s.z }; } requestAnimationFrame(f); }; requestAnimationFrame(f); };
   Y.bildirimIzle = () => { if (window.__bildirimler) return; const B = window.__bildirimler = []; DK.G.on('notify', (n) => B.push({ text: String(n && n.text), kind: n && n.kind, t: performance.now() })); };
   Y.ucgenFark = (x, z) => {
     const i = Math.floor((x + 10000) / 160), j = Math.floor((z + 10000) / 160), t = T.tiles.get(i * 1024 + j);
     if (!t || !t.mesh) return { karo: false };
     if (!t.heights) return { karo: true, hires: false, seg: t.seg };
     const g = t.mesh.geometry, P = g.attributes.position.array, I = g.index.array, seg = t.seg, st = 160 / seg;
     const dene = (q) => { const ia = I[q], ib = I[q + 1], ic = I[q + 2];
       const ax = P[ia * 3], az = P[ia * 3 + 2], bx = P[ib * 3], bz = P[ib * 3 + 2], cx = P[ic * 3], cz = P[ic * 3 + 2];
       const d1 = (x - bx) * (az - bz) - (ax - bx) * (z - bz), d2 = (x - cx) * (bz - cz) - (bx - cx) * (z - cz), d3 = (x - ax) * (cz - az) - (cx - ax) * (z - az);
       if ((d1 < -1e-9 || d2 < -1e-9 || d3 < -1e-9) && (d1 > 1e-9 || d2 > 1e-9 || d3 > 1e-9)) return null;
       const det = (bx - ax) * (cz - az) - (cx - ax) * (bz - az); if (Math.abs(det) < 1e-12) return null;
       const u = ((x - ax) * (cz - az) - (cx - ax) * (z - az)) / det, v = ((bx - ax) * (z - az) - (x - ax) * (bz - az)) / det;
       return P[ia * 3 + 1] + u * (P[ib * 3 + 1] - P[ia * 3 + 1]) + v * (P[ic * 3 + 1] - P[ia * 3 + 1]); };
     const a = Math.min(seg - 1, Math.floor((x - t.x0) / st)), b = Math.min(seg - 1, Math.floor((z - t.z0) / st));
     let y = dene((b * seg + a) * 6); if (y === null) y = dene((b * seg + a) * 6 + 3);
     for (let q = 0; y === null && q < I.length; q += 3) y = dene(q);
     if (y === null) return { karo: true, hires: true, ucgen: false };
     return { karo: true, hires: true, ucgen: true, fark: Math.abs(T.heightAt(x, z) - y) };
   };
   Y.zeminTutarliligi = (x, z, r, n) => { let enBuyuk = 0, nokta = 0, ucgensiz = 0; for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, d = Math.random() * r; const f = Y.ucgenFark(x + Math.cos(a) * d, z + Math.sin(a) * d); if (!f.hires) continue; if (!f.ucgen) { ucgensiz++; continue; } nokta++; enBuyuk = Math.max(enBuyuk, f.fark); } return { nokta, ucgensiz, enBuyuk: +enBuyuk.toFixed(5) }; };
   Y.ilkKare = (ad, kosul) => { window[ad] = null; const t0 = performance.now(); const f = () => { const p = DK.G.player; if (p && !p.dead && kosul(p) && !Y.ortu()) { const alt = Y.ucgenFark(p.pos.x, p.pos.z); const V = window[ad] = { ms: Math.round(performance.now() - t0), ag300: Y.agYakin(p.pos.x, p.pos.z, 300), karoAltinda: alt, derinlikUzak: Y.derinlikUzak(p.pos.x, p.pos.z), x: Math.round(p.pos.x), z: Math.round(p.pos.z), y: +p.pos.y.toFixed(2), zemin: +DK.physics.floorAt(p.pos.x, p.pos.z, p.pos.y + 0.6).toFixed(2), sonra: [] }; const ax = p.pos.x, az = p.pos.z; for (const ms of [200, 500, 1000, 2000]) setTimeout(() => { const q = DK.G.player; if (q) V.sonra.push({ ms, y: +q.pos.y.toFixed(2), mod: q.mode, zemin: +DK.physics.floorAt(q.pos.x, q.pos.z, q.pos.y + 0.6).toFixed(2), varisNoktasiZemin: +DK.physics.floorAt(ax, az, 10).toFixed(2) }); }, ms); return; } if (performance.now() - t0 < 120000) requestAnimationFrame(f); }; requestAnimationFrame(f); };
   Y.gorunurluk = async (from, to) => {
     const THREE = DK.THREE, cam = DK.engine.camera;
     const a = DK.snapFrom(from, to, 0.92); cam.updateMatrixWorld(true);
     const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
     const sahnede = T.group.visible && T.group.parent === DK.engine.scene;
     const kare = T.group.children.filter((m) => m.visible && fr.intersectsObject(m)).length;
     T.group.visible = false; let b; try { b = DK.snapFrom(from, to, 0.92); } finally { T.group.visible = true; }
     const oku = async (u) => { const im = new Image(); im.src = u; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
     const A = await oku(a), B = await oku(b); let fark = 0;
     for (let i = 0; i < A.length; i += 4) if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 60) fark++;
     return { sahnede, kareIcindeAg: kare, pikselOrani: +(fark / (A.length / 4)).toFixed(4) };
   };
   return Object.keys(Y); })()`}},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {degisken: {ad: 'kip', js: `new URLSearchParams(location.search).get('terrain') || ''`}},
 // ---- HY00 kip denetimi
 {expect: {js: `(()=>{ const k = new URLSearchParams(location.search).get('terrain') || ''; const T = DK.terrain; const isci = k === 'noworker' ? (T.workers.length === 0 && T.fallback === true) : k === '' ? (T.workers.length >= 1 && T.fallback === false) : true; window.__kipDurum = { k, mode: T.mode, workers: T.workers.length, fallback: T.fallback }; return T.mode === k && isci; })()`, truthy: true, label: 'HY00 Etkin arazi kipi URL ile aynı (normal: işçi ≥ 1, yedek kapalı; noworker: işçi 0, yedek açık)'}},
 {js: `window.__kipDurum`},
 // ==== 1) uzak ada ışınlanması: Kırlangıç → Kuzeyfener
 {expect: {js: `(async()=>{ const ok = await window.__Y.yeniOyun(); const p = DK.G.player, H = DK.ports.byId('kirlangic_limani'); return ok && Math.hypot(p.pos.x - H.x, p.pos.z - H.z) < 200; })()`, truthy: true, label: "HY01 Yeni oyun başladı, oyuncu Kırlangıç Limanı'nda"}},
 {js: `(()=>{ const H = DK.ports.byId('kirlangic_limani'), K = DK.ports.byId('kuzeyfener_port_0'); const I = DK.archipelago.EXTRA_ISLANDS.find((i) => i.id === K.island); window.__hedef = { id: K.id, mx: K.mooring.x, mz: K.mooring.z, bx: K.boarding.x, bz: K.boarding.z, ix: I.x, iz: I.z, uzaklik: Math.round(Math.hypot(K.x - H.x, K.z - H.z)) }; window.__ucret = window.__Y.ucret(H, K); window.__altin0 = DK.G.player.inv.gold; return { hedef: window.__hedef, ucret: window.__ucret }; })()`},
 {expect: {js: `window.__hedef.uzaklik`, gte: 5000, label: "HY02 Hedef liman (Kuzeyfener) Kırlangıç Limanı'na ≥ 5 km uzakta"}},
 {metrics: 'm_once'},
 {js: `(()=>{ const H = window.__hedef, Y = window.__Y; Y.prepareIzle(); Y.ilkKare('__varis', (p) => Math.hypot(p.pos.x - H.bx, p.pos.z - H.bz) < 40); window.__t0 = performance.now(); const st = DK.terrain.stats(); window.__ftOnce = { jobs: st.jobs, queue: st.queue, meshes: st.meshes, sayfaMs: Math.round(window.__t0) }; DK.G.emit('fastTravel', { to: H.id, from: 'kirlangic_limani', cost: window.__ucret }); return 'yola çıkıldı'; })()`},
 {expect: {js: `(async()=>{ const H = window.__hedef; for (let i = 0; i < 900; i++) { const s = DK.G.ship; if (s && Math.hypot(s.x - H.mx, s.z - H.mz) < 5 && window.__varis) break; await window.__Y.bekle(100); } window.__varisMs = Math.round(performance.now() - window.__t0); const s = DK.G.ship; return +Math.hypot(s.x - H.mx, s.z - H.mz).toFixed(2); })()`, lte: 5, label: 'HY03 Gemi hedef limanın demir yerinde (≤ 5 m)'}},
 {metrics: 'm_varis'},
 {js: `({ varisIlkKareMs: window.__varisMs, prepare: window.__prepler, varis: window.__varis, yolculukOncesiKuyruk: window.__ftOnce })`},
 {expect: {js: `(()=>{ const L = (window.__prepler || []).filter((k) => Math.hypot(k.x - window.__hedef.mx, k.z - window.__hedef.mz) < 50 && typeof k.ms === 'number'); return L.length ? Math.max(...L.map((k) => k.ms)) : -1; })()`, gte: 0, lte: 3000, label: "HYS-01 Hızlı yolculuktaki bölge hazırlığı (terrain.prepare, 5,3 km) ≤ 3 sn (normal kipte gerileme koruması; noworker kipindeki v0.4 kırmızısı KI-234 DEĞİL: işçisiz hızlı yolculuk 33–45 sn, 45 sn sınırına yakın — ayrı bilinen sorun adayı)"}},
 {expect: {js: `(()=>{ const L = (window.__prepler || []).filter((k) => Math.hypot(k.x - window.__hedef.mx, k.z - window.__hedef.mz) < 50 && typeof k.ms === 'number'); return L.length ? L.map((k) => k.donus).join(',') : 'prepare kaydı yok'; })()`, eq: 'ok', label: "HYS-02 Hızlı yolculuktaki bölge hazırlığı 'ok' ile döner (A-11: sonuç çağırana iletilir; 'timeout' ile sessiz eksik varış yok)"}},
 {expect: {js: `(()=>{ const H = window.__hedef, p = DK.G.player; return +Math.hypot(p.pos.x - H.bx, p.pos.z - H.bz).toFixed(2); })()`, lte: 3, label: 'HY04 Oyuncu hedef iskelede (biniş noktasına yatayda ≤ 3 m)'}},
 {expect: {js: `(()=>{ DK.sim(1); const s = DK.G.ship; return +Math.max(Math.hypot(s.vx || 0, s.vz || 0), Math.abs(s.speed || 0)).toFixed(3); })()`, lte: 1, label: 'HY05 Gemi hızı < 1 m/s (demirli)'}},
 {expect: {js: `window.__Y.derinlikUzak(window.__hedef.mx, window.__hedef.mz)`, lte: 60, label: 'HY06 Derinlik penceresi hedefte (pencere merkezi demir yerine ≤ 60 m)'}},
 {expect: {js: `window.__Y.agYakin(window.__hedef.mx, window.__hedef.mz, 450)`, gte: 6, label: 'HY07 Hedefte ≥ 6 karo ağı (450 m içinde, sahne grubunda)'}},
 {expect: {js: `DK.G.player.inv.gold === window.__altin0 - window.__ucret`, truthy: true, label: 'HY08 Yol parası bir kez düşüldü'}},
 {expect: {js: `(()=>{ const v = window.__varis, H = window.__hedef; if (!v) return false; const alt = v.karoAltinda || {}; return H.uzaklik >= 5000 && v.ag300 >= 6 && alt.karo === true && alt.hires === true && alt.ucgen === true && alt.fark < 0.01 && v.derinlikUzak <= 600; })()`, truthy: true, label: 'HYU-01 Uzak ada ışınlanması (≥ 5 km, hızlı yolculuk yolu): varışın ilk karesinde oyuncunun altında yükseklik ızgaralı karo ağı, çevrede ≥ 6 ağ, derinlik penceresi oyuncuyu kapsıyor, heightAt = çizilen ağ'}},
 {expect: {js: `(()=>{ const v = window.__varis; if (!v) return false; const son = v.sonra[v.sonra.length - 1]; window.__ayak = { ilkKare: { y: v.y, zemin: v.zemin }, sonra: v.sonra }; return Math.abs(v.y - v.zemin) < 1.5 && !!son && son.mod !== 'swim' && Math.abs(son.y - son.zemin) < 0.6; })()`, truthy: true, label: 'HYU-02 Varışta oyuncu zeminde: ilk karede zemin sorgusunun (physics.floorAt) 1,5 m içinde, 2 sn sonra yüzmüyor ve zeminde (suya düşmüyor) (v0.4 kırmızısının nedeni arazi değil: biniş noktası iskele platformunun dışında, bkz. HYU-05; hedef ports.js biniş noktası / islands.js iskele)'}},
 {js: `window.__ayak`},
 {expect: {js: `(()=>{ const H = window.__hedef; const ag = window.__Y.zeminTutarliligi(H.bx, H.bz, 220, 400); window.__zemin = ag; return ag.nokta >= 40 && ag.ucgensiz === 0 && ag.enBuyuk < 0.01; })()`, truthy: true, label: 'HYU-03 Varış bölgesinde (220 m) zemin sorgusu = çizilen ağ: heightAt ile ağ üçgeni farkı < 1 cm'}},
 {js: `window.__zemin`},
 {expect: {js: `(async()=>{ const H = window.__hedef; const dx = H.mx - H.ix, dz = H.mz - H.iz, L = Math.hypot(dx, dz) || 1; const from = [H.mx + dx / L * 70, 32, H.mz + dz / L * 70], to = [H.ix, 10, H.iz]; const g = await window.__Y.gorunurluk(from, to); window.__gor = { from, to, ...g }; return g.sahnede && g.kareIcindeAg >= 6 && g.pikselOrani >= 0.05; })()`, truthy: true, label: "HYU-04 Arazi görünür: adaya bakan kamerada ≥ 6 karo ağı sahnede, görünür ve frustum içinde; arazi gizlenince piksellerin ≥ %5'i değişiyor"}},
 {js: `window.__gor`},
 {expect: {js: `(async()=>{ const H = window.__hedef, P = DK.ports.byId(H.id), b = P.boarding; const ux = P.pierEnd.x - P.pierStart.x, uz = P.pierEnd.z - P.pierStart.z, L = Math.hypot(ux, uz) || 1, nx = ux / L, nz = uz / L;
   const t = (b.x - P.pierStart.x) * nx + (b.z - P.pierStart.z) * nz, ax = P.pierStart.x + nx * t, az = P.pierStart.z + nz * t, yan = Math.abs((b.x - P.pierStart.x) * -nz + (b.z - P.pierStart.z) * nx);
   let eksen = -1e9; for (let i = 0; i < 60; i++) { eksen = DK.physics.floorAt(ax, az, 10); if (eksen > 0) break; await window.__Y.bekle(250); }
   const binis = DK.physics.floorAt(b.x, b.z, 10); window.__iskele = { yanUzaklik: +yan.toFixed(2), eksenZemin: +eksen.toFixed(2), binisZemin: +binis.toFixed(2), binisY: b.y };
   return eksen > 0 && Math.abs(binis - eksen) < 0.3; })()`, truthy: true, label: 'HYU-05 Biniş noktası iskele platformunun üstünde: iskele kurulduktan sonra biniş noktasında zemin sorgusu (physics.floorAt) iskele ekseniyle aynı yükseklikte (HYU-02 kırmızısının nedeni; hedef ports.js biniş noktası / islands.js iskele genişliği)'}},
 {js: `window.__iskele`},
 // ==== 2) A-03: bekleme sırasında ikinci emit yok sayılır, ücret bir kez düşer (Kırlangıç → Tuz Pazarı, 0,3 sn sonra → Kuzeyfener)
 {goto: 'index.html'},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `DK.terrain.mode === window.__KOSUCU.kip && (new URLSearchParams(location.search).get('terrain') || '') === window.__KOSUCU.kip ? true : 'kip ' + JSON.stringify(DK.terrain.mode) + ', beklenen ' + JSON.stringify(window.__KOSUCU.kip)`, eq: true, label: 'HYK-2 (bölüm 2) Arazi kipi gezinmeden sonra korundu (ilk sayfanın ?terrain değeri)'}},
 {expect: {js: `window.__Y.yeniOyun()`, truthy: true, label: 'HY09 (bölüm 2) Yeni oyun başladı'}},
 {js: `(()=>{ const H = DK.ports.byId('kirlangic_limani'), A = DK.ports.byId('tuz_pazari_port_0'), B = DK.ports.byId('kuzeyfener_port_0'); const Y = window.__Y; Y.prepareIzle(); Y.varisIzle(); window.__iki = { a: { id: A.id, mx: A.mooring.x, mz: A.mooring.z, c: Y.ucret(H, A) }, b: { id: B.id, mx: B.mooring.x, mz: B.mooring.z, c: Y.ucret(H, B) }, altin: DK.G.player.inv.gold }; DK.G.emit('fastTravel', { to: A.id, from: H.id, cost: window.__iki.a.c }); setTimeout(() => DK.G.emit('fastTravel', { to: B.id, from: H.id, cost: window.__iki.b.c }), 300); return window.__iki; })()`},
 // yerleşme: en az bir varış (olay ya da gemi sıçraması), bekleyen prepare yok ve son olaydan (varış, sıçrama, prepare başlangıcı/
 // bitişi) bu yana 25 yoklama turu (~5 sn) sakin geçti; üst sınır 150 sn. Sakin süre duvar saatiyle değil tur sayısıyla ölçülür:
 // yazılımsal GPU'da 10–20 sn'lik tek bir ana iş parçacığı duraklaması, sıraya alınmış bir ikinci yolculuğun zamanlayıcısından önce
 // yoklamayı bitirmesin (FB0 tanı koşusu: duraklama sonrası yoklamanın zamanlayıcısı oyununkinden önce çalışıyordu).
 {js: `(async()=>{ const I = window.__iki, Y = window.__Y, s = () => DK.G.ship; const yer = (S) => (!S ? null : Math.hypot(S.x - I.a.mx, S.z - I.a.mz) < 5 ? 'a' : Math.hypot(S.x - I.b.mx, S.z - I.b.mz) < 5 ? 'b' : null);
   const t0 = performance.now(); let yerlesti = false, sakin = 0, imza = '';
   while (performance.now() - t0 < 150000) { const P = window.__prepler || [], V = window.__varislar || [], S = window.__sicramalar || [];
     const yeni = [V.length, S.length, P.length, P.filter((k) => typeof k.ms === 'number').length].join(','); if (yeni !== imza) { imza = yeni; sakin = 0; } else sakin++;
     if ((V.length + S.length) >= 1 && Y.prepareBitti() && sakin >= 25) { yerlesti = true; break; } await Y.bekle(200); }
   I.yerlesti = yerlesti; I.son = yer(s()); I.ms = Math.round(performance.now() - t0); I.altinSon = DK.G.player.inv.gold;
   I.varislar = (window.__varislar || []).map((v) => v.port); I.sicramalar = (window.__sicramalar || []).map((v) => yer(v) || [v.x, v.z].join(','));
   I.prepare = (window.__prepler || []).map((k) => ({ x: k.x, z: k.z, ms: k.ms, donus: k.donus })); return I; })()`},
 {metrics: 'm_iki_emit'},
 {expect: {js: `(()=>{ const I = window.__iki; return I.yerlesti === true && I.sicramalar.length === 1 && I.sicramalar[0] === 'a' && I.varislar.length <= 1 && I.varislar.every((p) => p === I.a.id) && I.son === 'a'; })()`, truthy: true, label: 'HY10 Bekleme sırasında gelen ikinci hızlı yolculuk yok sayılır: bütün hazırlıklar bitip 5 sn sakin geçtiğinde tam bir varış olmuş (gemi sıçraması 1, arrivedPort ≤ 1), o varış ilk hedefe (Tuz Pazarı) ve gemi orada (A-03)'}},
 {expect: {js: `window.__iki.altinSon === window.__iki.altin - window.__iki.a.c`, truthy: true, label: 'HY11 Bekleme sırasında ikinci emit: yol parası bir kez düşer (A-03)'}},
 // ==== 3) A-14: açık denizde uzak ölüm → "Kırlangıç Limanı'nda uyan" → ilk karede ≥ 6 karo ağı ve derinlik penceresi
 {goto: 'index.html'},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `DK.terrain.mode === window.__KOSUCU.kip && (new URLSearchParams(location.search).get('terrain') || '') === window.__KOSUCU.kip ? true : 'kip ' + JSON.stringify(DK.terrain.mode) + ', beklenen ' + JSON.stringify(window.__KOSUCU.kip)`, eq: true, label: 'HYK-3 (bölüm 3) Arazi kipi gezinmeden sonra korundu (ilk sayfanın ?terrain değeri)'}},
 {expect: {js: `window.__Y.yeniOyun()`, truthy: true, label: 'HY12 (bölüm 3) Yeni oyun başladı'}},
 {js: `(()=>{ const p = DK.G.player, s = DK.G.ship; s.x = 4000; s.z = -4000; s.vx = 0; s.vz = 0; s.speed = 0; s.anchored = true; s.anchorPt = null; s.updateTransform(0); p.boardShip(s, s.model.stations.helm.clone()); return { gemi: [s.x, s.z], mod: p.mode }; })()`},
 // önkoşul (B0-I05): ölümden önce Kırlangıç çevresindeki karolar düşmüş ve derinlik penceresi uzakta olmalı; yoksa HY13/HY14 kördür
 // (v0.4'te başlangıç prepare odağı 12 sn sürer; hızlı ortamda uyanış o süre içinde kalırsa eski karolar yerinde bulunur)
 {expect: {js: `(async()=>{ const H = DK.ports.byId('kirlangic_limani'), Y = window.__Y; const t0 = performance.now(); let ag = -1, d = -1;
   while (performance.now() - t0 < 60000) { ag = Y.agYakin(H.x, H.z, 300); d = Y.derinlikUzak(H.x, H.z); if (ag === 0 && d > 600) break; await Y.bekle(250); }
   window.__onkosul = { ms: Math.round(performance.now() - t0), kirlangicCevresiAg: ag, derinlikKirlangicaUzak: d }; return ag === 0 && d > 600; })()`, truthy: true, label: "HY12b Önkoşul: ölümden önce Kırlangıç Limanı'nın 300 m içinde karo ağı yok ve derinlik penceresi 600 m'den uzak (60 sn içinde; sağlanmazsa HY13/HY14 kanıt değildir)"}},
 {js: `window.__onkosul`},
 {js: `(()=>{ const p = DK.G.player, H = DK.ports.byId('kirlangic_limani'); window.__olum = { x: Math.round(p.pos.x), z: Math.round(p.pos.z), kirlangicaUzaklik: Math.round(Math.hypot(p.pos.x - H.x, p.pos.z - H.z)), kirlangicCevresiAg: window.__Y.agYakin(H.x, H.z, 300), derinlikKirlangicaUzak: window.__Y.derinlikUzak(H.x, H.z) }; const ox = p.pos.x, oz = p.pos.z; window.__Y.ilkKare('__dogus', (q) => Math.hypot(q.pos.x - ox, q.pos.z - oz) > 1000); p.die('Test: uzak ölüm'); return window.__olum; })()`},
 {tikla: {metin: "Kırlangıç Limanı'nda uyan", zaman: 15000}},
 {expect: {js: `(async()=>{ for (let i = 0; i < 600 && !window.__dogus; i++) await window.__Y.bekle(100); return window.__dogus ? window.__dogus.ag300 : -1; })()`, gte: 6, label: "HY13 Uzak ölümden (Kırlangıç'a 5,8 km) sonra limanda uyanışın ilk karesinde oyuncu çevresinde ≥ 6 karo ağı (A-14)"}},
 {expect: {js: `window.__dogus ? window.__dogus.derinlikUzak : 1e9`, lte: 100, label: 'HY14 Uyanışın ilk karesinde derinlik penceresi uyanma noktasında (merkez ≤ 100 m, A-14)'}},
 {js: `({ olum: window.__olum, dogus: window.__dogus })`},
 // ==== 4) A-03: bekleme sırasında menüye dönüş
 {goto: 'index.html'},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `DK.terrain.mode === window.__KOSUCU.kip && (new URLSearchParams(location.search).get('terrain') || '') === window.__KOSUCU.kip ? true : 'kip ' + JSON.stringify(DK.terrain.mode) + ', beklenen ' + JSON.stringify(window.__KOSUCU.kip)`, eq: true, label: 'HYK-4 (bölüm 4) Arazi kipi gezinmeden sonra korundu (ilk sayfanın ?terrain değeri)'}},
 {expect: {js: `window.__Y.yeniOyun()`, truthy: true, label: 'HY15 (bölüm 4) Yeni oyun başladı'}},
 {js: `(()=>{ const p = DK.G.player, T = DK.ports.byId('tuz_pazari_port_0'), H = DK.ports.byId('kirlangic_limani'); const c = window.__Y.ucret(H, T); window.__Y.prepareIzle(); window.__Y.varisIzle(); window.__Y.bildirimIzle(); window.__menu = { hedef: { mx: T.mooring.x, mz: T.mooring.z }, altinOnce: p.inv.gold, ucret: c, gun: DK.time.day }; setTimeout(() => { window.__menuAni = performance.now(); }, 300); DK.G.emit('fastTravel', { to: T.id, from: H.id, cost: c }); setTimeout(() => DK.handlers.toMenu(), 300); return window.__menu; })()`},
 // başlatılan prepare bitene ve sonra 15 yoklama turu (~3 sn) geçene kadar izlenir (üst sınır 120 sn; işçisiz kipte prepare 33–45 sn
 // sürebilir). prepare hiç başlamazsa 75 tur (~15 sn) sonra durur. Süreler tur sayısıyladır (bölüm 2'deki not).
 {js: `(async()=>{ const M = window.__menu, Y = window.__Y, s = () => DK.G.ship; let tasindi = false, tur = 0, bitisTur = null; const t0 = performance.now();
   while (performance.now() - t0 < 120000) { tur++; if (s() && Math.hypot(s().x - M.hedef.mx, s().z - M.hedef.mz) < 50) tasindi = true;
     const P = window.__prepler || []; if (!P.length && tur > 75) break; if (P.length && Y.prepareBitti()) { if (bitisTur === null) bitisTur = tur; if (tur - bitisTur >= 15) break; } await Y.bekle(200); }
   M.tasindi = tasindi; M.prepare = (window.__prepler || []).map((k) => ({ ms: k.ms, donus: k.donus })); M.izlemeMs = Math.round(performance.now() - t0); M.tur = tur;
   const ani = window.__menuAni || 0; M.varisSonra = (window.__varislar || []).filter((v) => v.t > ani).length; M.bildirimSonra = (window.__bildirimler || []).filter((b) => b.t > ani).map((b) => b.text);
   M.durum = DK.G.state; M.menu = !!document.getElementById('menu')?.classList.contains('active'); M.hud = !document.getElementById('hud')?.classList.contains('hidden'); const k = DK.save.read('solo', 0); M.kayitAltin = k && k.player && k.player.inv ? k.player.inv.gold : null; M.gunSon = DK.time.day; return M; })()`},
 {expect: {js: `window.__menu.durum === 'menu' && window.__menu.menu === true && window.__menu.hud === false`, truthy: true, label: 'HY16 Bekleme sırasında menüye dönüş: ana menü açık, HUD kapalı, durum menu'}},
 {expect: {js: `window.__menu.tasindi`, eq: false, label: 'HY17 Bekleme sırasında menüye dönüş: devam kodu menü gemisini hedef limana taşımaz (A-03)'}},
 {expect: {js: `window.__menu.kayitAltin === window.__menu.altinOnce`, truthy: true, label: 'HY18 Bekleme sırasında menüye dönüş: kayıttaki altın yolculuk öncesiyle aynı (ücret iade / varışta düşülür, A-03)'}},
 {expect: {js: `(()=>{ const M = window.__menu; return M.varisSonra === 0 && !M.bildirimSonra.some((t) => /vardın/i.test(t)); })()`, truthy: true, label: 'HY19 Bekleme sırasında menüye dönüş: hazırlık bittikten (ya da hiç başlamadıysa ~15 sn) sonra devam kodu varış olayı (arrivedPort) ve "limanına vardın" bildirimi üretmez (oturum belirteci, A-03)'}},
 {js: `({ prepare: window.__menu.prepare, izlemeMs: window.__menu.izlemeMs, varisSonra: window.__menu.varisSonra, bildirimSonra: window.__menu.bildirimSonra })`},
 // ==== 5) brief madde 5: hazırlık zaman aşımına uğrarsa oyuncu bilgilendirilir. Bir sonraki prepare çağrısına {timeout: 30} eklenir
 // (yalnız o çağrı; oyunun kendi seçeneği) ve Kırlangıç → Tuz Pazarı hızlı yolculuğu yapılır.
 {goto: 'index.html'},
 {js: `eval(window.__KOSUCU.yardimci)`},
 {expect: {js: `DK.terrain.mode === window.__KOSUCU.kip && (new URLSearchParams(location.search).get('terrain') || '') === window.__KOSUCU.kip ? true : 'kip ' + JSON.stringify(DK.terrain.mode) + ', beklenen ' + JSON.stringify(window.__KOSUCU.kip)`, eq: true, label: 'HYK-5 (bölüm 5) Arazi kipi gezinmeden sonra korundu (ilk sayfanın ?terrain değeri)'}},
 {expect: {js: `window.__Y.yeniOyun()`, truthy: true, label: 'HY20 (bölüm 5) Yeni oyun başladı'}},
 {js: `(()=>{ const T = DK.terrain, Y = window.__Y, H = DK.ports.byId('kirlangic_limani'), A = DK.ports.byId('tuz_pazari_port_0'); Y.bildirimIzle(); Y.varisIzle();
   const o = T.prepare; T.prepare = function (x, z, op) { T.prepare = o; window.__zorlanan = { x: Math.round(x), z: Math.round(z) }; return o.call(this, x, z, Object.assign({}, op, { timeout: 30 })); };
   window.__zaman = { hedef: { mx: A.mooring.x, mz: A.mooring.z }, t0: performance.now() }; DK.G.emit('fastTravel', { to: A.id, from: H.id, cost: Y.ucret(H, A) }); return window.__zaman; })()`},
 {js: `(async()=>{ const Z = window.__zaman, Y = window.__Y, s = () => DK.G.ship; let vardi = null; const t0 = performance.now();
   let tur = 0, varisTur = null; while (performance.now() - t0 < 90000) { tur++; const S = s(); if (vardi === null && S && Math.hypot(S.x - Z.hedef.mx, S.z - Z.hedef.mz) < 50) { vardi = performance.now(); varisTur = tur; } if (varisTur !== null && tur - varisTur >= 20) break; if (vardi === null && window.__zorlanan === undefined && tur > 75) break; await Y.bekle(200); }
   Z.zorlanan = window.__zorlanan || null; Z.vardi = vardi !== null; Z.bildirimler = (window.__bildirimler || []).filter((b) => b.t >= Z.t0).map((b) => ({ text: b.text, kind: b.kind })); return Z; })()`},
 {expect: {js: `(()=>{ const Z = window.__zaman; return !!Z.zorlanan && Z.bildirimler.some((b) => !/vardın/i.test(b.text) && (b.kind === 'warn' || b.kind === 'bad' || /zaman aşımı|hazırla|yüklen|eksik|gecik|tamamlan/i.test(b.text))); })()`, truthy: true, label: "HY21 Hızlı yolculuktaki bölge hazırlığı zaman aşımına uğrarsa ('timeout') oyuncu bir uyarı bildirimi alır (brief madde 5, A-03/A-11)"}},
]
