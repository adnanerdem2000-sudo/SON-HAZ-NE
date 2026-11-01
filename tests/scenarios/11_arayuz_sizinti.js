// Aşama 8 arayüz sızıntıları: H24 karakter oluşturucu closeAll ile kapanınca rAF döngüsü durur ve window 'mouseup' dinleyicisi
// birikmez; H23 üstte başka panel varken ikinci dünya haritası açılmaz (dinleyici referansları ezilmez).
[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 4000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
 // dinleyici sayacı ve rAF geri çağrı izleyicisi
 {js: `(()=>{ window._mu=0; const ae=window.addEventListener.bind(window), re=window.removeEventListener.bind(window); window.addEventListener=(t,f,o)=>{ if (t==='mouseup') window._mu++; return ae(t,f,o); }; window.removeEventListener=(t,f,o)=>{ if (t==='mouseup') window._mu--; return re(t,f,o); }; const raf=window.requestAnimationFrame.bind(window); window._rafFns=new Map(); window.requestAnimationFrame=(fn)=>{ const src=fn.toString(); const k=(fn.name||'?')+':'+(/prevBox|cam\.aspect/.test(src)?'creator':'other'); window._rafFns.set(k,(window._rafFns.get(k)||0)+1); return raf(fn); }; return 'ok'; })()`},
 // H24: oluşturucuyu 3 kez aç, her seferinde closeAll ile kapat
 {js: `(()=>{ const out=[]; for (let i=0;i<3;i++){ const mu0=window._mu; if (DK.creator) DK.creator.open({appearance: DK.G.player.appearance, title:'Test', onDone(){}, onCancel(){}}); else DK.G.emit('openTailor'); const opened = DK.ui.topIs('creator'); const mu1=window._mu; DK.ui.closeAll(); out.push({opened, addedWhileOpen: mu1-mu0, netAfterClose: window._mu-mu0}); } window._h24=out; return out; })()`},
 {expect: {js: `window._h24.every(o=>o.opened && o.netAfterClose===0)`, truthy: true, label: 'H24 Oluşturucu closeAll ile kapanınca window mouseup dinleyicisi kalmaz (3 açılış)'}},
 // rAF: kapanıştan sonra 600 ms içinde oluşturucu döngüsü (loop) çağrılmamalı
 {expect: {js: `[...window._rafFns.keys()].some(n=>/:creator$/.test(n))`, truthy: true, label: 'H24 (kontrol) Oluşturucu açıkken rAF döngüsü çalışıyordu'}},
 {js: `window._rafFns.clear(); 'ok'`},
 {wait: 700},
 {expect: {js: `(()=>{ const names=[...window._rafFns.entries()]; window._rafNames=names; return !names.some(([n])=>/:creator$/.test(n)); })()`, truthy: true, label: 'H24 Kapanıştan sonra oluşturucu rAF döngüsü durur (600 ms içinde çağrı yok)'}},
 {js: `window._rafNames`},
 // H23: harita → üstüne panel → tekrar harita isteği → yığında tek harita
 {js: `(()=>{ DK.ui.closeAll(); DK.G.emit('openMap'); const d=document.createElement('div'); d.textContent='üst panel'; DK.ui.open(DK.ui.panel('Test Paneli', d), {kind:'test'}); DK.G.emit('openMap'); const maps=DK.ui.stack.filter(p=>p.kind==='map').length; const top=DK.ui.stack[DK.ui.stack.length-1]?.kind; window._h23={maps, top, depth:DK.ui.stack.length}; DK.ui.closeAll(); return window._h23; })()`},
 {expect: {js: `window._h23.maps===1`, truthy: true, label: 'H23 Üstte panel varken ikinci harita açılmaz (yığında 1 harita)'}},
 {expect: {js: `DK.G.state==='playing' && DK.ui.stack.length===0`, truthy: true, label: 'Arayüz testlerinden sonra oyun açık, yığın boş'}},
]
