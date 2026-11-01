// Aşama 8 ölçümü: çizim çağrısı/üçgen/geometri/doku sayıları ve ana iş parçacığı benzetim maliyeti (GPU'suz ortamda FPS
// anlamlı değildir; CPU tarafı ölçülür). Sahneler: menü, başlangıç limanı, orman adası (kadim tapınak), fırtına, boss.
// Ayrıca ada içeriği kaldırılınca GPU kaynak sızıntısı (geometri/doku sayacı) kontrol edilir.
[
 {expect: {js: `!!window.DK && !!window.__ready`, truthy: true, label: 'Sayfa hazır'}},
 {js: `window._M = (tag) => { DK.post.render(); const r=DK.engine.renderer, i=r.info; const m={ tag, calls:i.render.calls, tris:i.render.triangles, geos:i.memory.geometries, texs:i.memory.textures, progs:(i.programs||[]).length, heapMB: performance.memory ? +(performance.memory.usedJSHeapSize/1048576).toFixed(0) : null }; const t0=performance.now(); for (let k=0;k<60;k++) DK.game.update(1/60); m.simMsPerFrame=+((performance.now()-t0)/60).toFixed(2); (window._PERF||(window._PERF=[])).push(m); return m; }; window._M('menu')`},
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 4000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
 {js: `(()=>{ DK.sim(2); return window._M('liman'); })()`},
 {expect: {js: `(()=>{ const m=window._PERF.find(x=>x.tag==='liman'); return m.calls < 900 && m.simMsPerFrame < 40; })()`, truthy: true, label: 'Liman: çizim çağrısı < 900 ve benzetim < 40 ms/kare (yazılımsal ortam üst sınırı)'}},
 // orman adası: Kadim Tapınak (cangil)
 {expect: {js: `(async()=>{ const I=DK.archipelago.EXTRA_ISLANDS.find(i=>i.id==='kadim_tapinak'); if (!I) return 'ada yok'; const s=DK.G.ship, p=DK.G.player; const t0=performance.now(); await DK.terrain.prepare(I.x, I.z, {radius: 500}); window._prepMs=Math.round(performance.now()-t0); let x=I.x, z=I.z; for (let r=0;r<I.r;r+=10){ if (DK.terrain.heightAt(I.x+r, I.z) > 2) { x=I.x+r; z=I.z; } } p.mode='ground'; p.ship=null; p.pos.set(x, DK.terrain.heightAt(x,z)+0.2, z); p.vel.set(0,0,0); s.x=I.x; s.z=I.z+I.r+60; s.updateTransform(0); const b0=performance.now(); for (let i=0;i<300 && !DK.islands.built.has('kadim_tapinak'); i++) { DK.sim(0.2); } window._buildMs=Math.round(performance.now()-b0); window._isl={built: DK.islands.built.has('kadim_tapinak'), prepMs: window._prepMs, buildLoopMs: window._buildMs}; return DK.islands.built.has('kadim_tapinak'); })()`, truthy: true, label: 'Orman adası (Kadim Tapınak) içeriği kuruldu'}},
 {js: `(()=>{ DK.sim(1); const m=window._M('orman_adasi'); return {...m, ...window._isl}; })()`},
 // fırtına
 {js: `(()=>{ DK.sky.setWeather('firtina', true); DK.sim(2); return window._M('firtina'); })()`},
 {js: `(()=>{ DK.sky.setWeather('acik', true); return 'ok'; })()`},
 // boss: kraken (deniz)
 {js: `(()=>{ try { const b=DK.bosses.spawn('kraken'); DK.sim(2); const m=window._M('boss_kraken'); m.bossAlive = !!(b && b.alive); return m; } catch (e) { return {err: String(e).slice(0,200)}; } })()`},
 {js: `(()=>{ try { DK.bosses._clear(); DK.sim(0.5); } catch (e) { return {err:String(e).slice(0,120)}; } return 'ok'; })()`},
 // sızıntı: ada içeriği kaldırılınca geometri/doku sayaçları geri inmeli
 {expect: {js: `(()=>{ const r=DK.engine.renderer.info.memory; const before={g:r.geometries, t:r.textures}; DK.islands._drop('kadim_tapinak'); DK.sim(0.5); DK.post.render(); const after={g:r.geometries, t:r.textures}; window._leak={before, after, dropG: before.g-after.g, dropT: before.t-after.t}; return after.g < before.g; })()`, truthy: true, label: 'B-09 Ada içeriği kaldırılınca geometri sayacı düşüyor (dispose çalışıyor)'}},
 {js: `window._leak`},
 {js: `window._PERF`},
 {expect: {js: `DK.G.state==='playing'`, truthy: true, label: 'Oyun döngüsü ölçümlerden sonra hatasız'}},
]
