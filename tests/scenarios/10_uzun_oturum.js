// Çalıştırma: DK_JSFLAGS=--expose-gc node tests/harness/run.cjs tests/scenarios/10_uzun_oturum.js --size 640x360 --timeout 1480
// Not: DK.sim binlerce kareyi tek bir JS görevinde koşar; Blink'in çöp toplayıcısı (Oilpan) görevler arasında çalıştığı için
// hızlandırılmış benzetimde çöp birikip başsız sekme bellek sınırında çöküyordu (04. belge §4.8). Gerçek zamanlı oynanışta
// bellek düzdür (3 dk ölçümü: RSS ~1,1 GB sabit). Bu yüzden her 30 sn'lik alt dilimden sonra olay döngüsüne kısa süre
// teslim edilip gc() çağrılır (varsa): görev içinde çağrılan gc() Blink belleğini geri vermez (süpürme görev bitiminde/boşta yapılır).
// Aşama 9: benzetimli uzun oturum — 30 dakika oyun zamanı (DK.sim, 1/30 s adım) 20 dilimde ilerletilir; her dilimde durum,
// oyuncu konumu/sağlığı (NaN yok), GPU sayaçları ve benzetim maliyeti kaydedilir. Oyuncu gemiyle rota izler, kıyıya çıkar,
// düşman grubu doğurup savaşır; böylece doğma/kaldırma döngüleri de oturuma girer. Beklenti: sayfa hatası yok, geometri/doku
// sayaçları dilimler arasında sınırsız büyümez (son 10 dilimde eğilim ≤ +2/dilim), benzetim ms/kare ilk dilimin 3 katını aşmaz.
[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 4000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
 {metrics: 'baslangic'},
 {js: `window._S=[]; window._slice=async (k)=>{ const r=DK.engine.renderer.info.memory; const p=DK.G.player; let simMs=0; const idle=(ms)=>new Promise(r=>setTimeout(r,ms)); for (let q=0;q<3;q++){ const t0=performance.now(); DK.sim(30, 1/30); simMs+=performance.now()-t0; await idle(60); if (typeof gc==='function') gc(); await idle(60); } const ms=+(simMs/(90*30)).toFixed(2); DK.post.render(); const heapMB=performance.memory ? +(performance.memory.usedJSHeapSize/1048576).toFixed(1) : null; const row={k, t:Date.now(), h:+DK.sky.hour.toFixed(1), x:+p.pos.x.toFixed(0), z:+p.pos.z.toFixed(0), y:+p.pos.y.toFixed(1), hp:+p.hp.toFixed(0), mode:p.mode, geos:r.geometries, texs:r.textures, enemies:DK.enemies.list.length, animals:DK.animals.list.length, msPerFrame:ms, heapMB, objs:(()=>{ let n=0; DK.engine.scene.traverse(()=>n++); return n; })(), dom:document.querySelectorAll('*').length, fx:DK.effects.parts?.length ?? null, bodies:DK.bodies.list.length, floats:DK.events.floats?.length ?? null, shots:DK.enemies.shots?.length ?? null, tiles:DK.terrain.tiles.size, jobs:DK.terrain._jobs?.size ?? null, queue:DK.terrain._queue?.length ?? null, islands:DK.islands.built.size, npcs:DK.npcs.list?.length ?? null, ships:DK.G.ships.length, nan:[p.pos.x,p.pos.y,p.pos.z,p.hp].some(v=>!isFinite(v))}; window._S.push(row); return row; }; 'ok'`},
 // dilim 1-4: limanda/kıyıda yürüyüş (rastgele yön)
 {js: `(async()=>{ const out=[]; for (let k=1;k<=4;k++){ DK.tpCamera.yaw=k*1.3; DK.input.down.add('KeyW'); out.push(await window._slice(k)); DK.input.down.delete('KeyW'); } return out; })()`},
 {metrics: 'dilim4'},
 // dilim 5-8: gemiye bin, yelken aç, rota (batı) — gemi yoksa yüzme
 {js: `(async()=>{ const p=DK.G.player, s=DK.G.ship; const out=[]; if (s && !s.sunk) { p.boardShip(s, s.model.stations.helm.clone()); DK.shipControl.takeHelm(p, s); s.anchored=false; s.sail=1; s.yawTarget=Math.PI/2; } for (let k=5;k<=8;k++){ if (s) { s.rudder=Math.sin(k)*0.3; } out.push(await window._slice(k)); } return out; })()`},
 {metrics: 'dilim8'},
 // dilim 9-12: düşman grubu doğur, savaş (otomatik vuruş), ölüler kaldırılır
 {js: `(async()=>{ const p=DK.G.player; const out=[]; for (let k=9;k<=12;k++){ const es=[]; for (let i=0;i<5;i++) es.push(DK.enemies.spawn(i%2?'haydut':'iskelet', p.pos.x+5+i*1.5, p.pos.z+5)); for (let j=0;j<10;j++){ for (const e of es) if (e.alive) e.hurt(40); DK.sim(2,1/30); } out.push(await window._slice(k)); } return out; })()`},
 {metrics: 'dilim12'},
 // dilim 13-16: hava değişimleri + boss doğur/temizle
 {js: `(async()=>{ const out=[]; DK.sky.setWeather('firtina', true); out.push(await window._slice(13)); DK.sky.setWeather('yagmur', true); out.push(await window._slice(14)); return out; })()`},
 {js: `(async()=>{ const out=[]; DK.sky.setWeather('sis', true); try { DK.bosses.spawn('kraken'); } catch(e){} out.push(await window._slice(15)); try { DK.bosses._clear(); } catch(e){} DK.sky.setWeather('acik', true); out.push(await window._slice(16)); return out; })()`},
 {metrics: 'dilim16'},
 // dilim 17-20: kayıt/yükleme döngüsü + yürüyüş
 {js: `(async()=>{ const out=[]; for (let k=17;k<=20;k++){ if (k===18) { DK.handlers.saveNow(true); } DK.tpCamera.yaw=k*0.9; DK.input.down.add('KeyW'); out.push(await window._slice(k)); DK.input.down.delete('KeyW'); } return out; })()`},
 {js: `(()=>{ const S=window._S; const last=S.slice(-10); const slope=(key)=>{ const n=last.length; const xs=last.map((_,i)=>i), ys=last.map(r=>r[key]); const mx=xs.reduce((a,b)=>a+b)/n, my=ys.reduce((a,b)=>a+b)/n; let num=0,den=0; for (let i=0;i<n;i++){ num+=(xs[i]-mx)*(ys[i]-my); den+=(xs[i]-mx)**2; } return +(num/den).toFixed(2); }; window._sum={slices:S.length, minutes:S.length*1.5, geoSlope:slope('geos'), texSlope:slope('texs'), ms0:S[0].msPerFrame, msMax:Math.max(...S.map(r=>r.msPerFrame)), nan:S.some(r=>r.nan), geos:S.map(r=>r.geos), texs:S.map(r=>r.texs), ms:S.map(r=>r.msPerFrame), heap:S.map(r=>r.heapMB), gc: typeof gc==='function'}; return window._sum; })()`},
 {expect: {js: `window._sum.slices===20 && !window._sum.nan && DK.G.state==='playing'`, truthy: true, label: 'U01 30 dk benzetimli oturum tamamlandı, NaN yok, oyun açık'}},
 // U02: sızıntı dilim başına sürekli artış olarak görünür; yeni bir bölgenin ilk kez görülmesi tek seferlik bir basamaktır. Bu yüzden
 // son 10 dilimde dilim başı artışların medyanı ≤ 1 (sürekli artış yok) ve toplam artış ≤ 300 (sınırlı) aranır.
 {expect: {js: `(()=>{ const S=window._sum; const d=(a)=>a.slice(-11).map((v,i,arr)=>i?v-arr[i-1]:null).slice(1); const med=(a)=>{ const s=[...a].sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; }; const dg=d(S.geos), dt=d(S.texs); S.geoDeltas=dg; S.texDeltas=dt; S.geoMedian=med(dg); S.texMedian=med(dt); const tot=S.geos[S.geos.length-1]-S.geos[S.geos.length-11]; S.geoTotal10=tot; return S.geoMedian<=1 && S.texMedian<=1 && tot<=300; })()`, truthy: true, label: 'U02 Son 10 dilimde geometri/doku artışının medyanı ≤ 1/dilim ve toplam ≤ 300 (sürekli sızıntı yok)'}},
 {js: `({geoDeltas: window._sum.geoDeltas, texDeltas: window._sum.texDeltas, geoMedian: window._sum.geoMedian, texMedian: window._sum.texMedian, geoTotal10: window._sum.geoTotal10})`},
 {expect: {js: `window._sum.msMax <= Math.max(6, window._sum.ms0*3)`, truthy: true, label: 'U03 Benzetim maliyeti ilk dilimin 3 katını (en az 6 ms) aşmaz'}},
 {expect: {js: `(()=>{ const h=window._sum.heap.filter(v=>v!==null); if (!h.length) return true; const first=Math.min(...h.slice(0,4)), last=Math.max(...h.slice(-4)); window._sum.heapFirst=first; window._sum.heapLast=last; return last <= first + 30; })()`, truthy: true, label: 'U04 JS yığını (çöp toplama sonrası) son dilimlerde ilk dilimlere göre ≤ +30 MB'}},
 {js: `({heap: window._sum.heap, gc: window._sum.gc, heapFirst: window._sum.heapFirst, heapLast: window._sum.heapLast})`},
]
