// Tanı (B1): normal kipte işçilerin kurulma → hazır → ilk yanıt süreleri ve terrain.init / __ready zamanları
[
 {meta: {olcum: true, testler: ['tanı'], dosyalar: [],
   baslatma: `(() => { const W = window.Worker; if (typeof W !== 'function') return; const I = window.__isciZaman = [];
     function Sarili(url, opts) { const w = new W(url, opts); const k = { no: I.length, kur: performance.now(), hazir: null, ilkYanit: null, ilkIs: null }; I.push(k);
       const post = w.postMessage.bind(w); w.postMessage = function (m, tr) { if (k.ilkIs === null && m && m.t) k.ilkIs = performance.now(); return post(m, tr); };
       w.addEventListener('message', (e) => { const d = e.data; if (d && d.t === 'ready') { if (k.hazir === null) k.hazir = performance.now(); } else if (k.ilkYanit === null) k.ilkYanit = performance.now(); });
       return w; }
     Sarili.prototype = W.prototype; window.Worker = Sarili;
     const d = Object.getOwnPropertyDescriptor(window, '__ready'); window.__readyAni = null;
     if (d && d.configurable && typeof d.set === 'function') Object.defineProperty(window, '__ready', { configurable: true, enumerable: true, get: d.get, set(v) { if (v && window.__readyAni === null) window.__readyAni = performance.now(); d.set.call(window, v); } });
   })();`}},
 {js: `({ hc: navigator.hardwareConcurrency, ready: Math.round(window.__readyAni), isci: (window.__isciZaman || []).map((k) => ({ no: k.no, kur: Math.round(k.kur), hazir: k.hazir && Math.round(k.hazir - k.kur), ilkIs: k.ilkIs && Math.round(k.ilkIs - k.kur), ilkYanit: k.ilkYanit && Math.round(k.ilkYanit - k.kur) })) })`},
 {goto: 'index.html'},
 {js: `({ hc: navigator.hardwareConcurrency, ready: Math.round(window.__readyAni), isci: (window.__isciZaman || []).map((k) => ({ no: k.no, kur: Math.round(k.kur), hazir: k.hazir && Math.round(k.hazir - k.kur), ilkIs: k.ilkIs && Math.round(k.ilkIs - k.kur), ilkYanit: k.ilkYanit && Math.round(k.ilkYanit - k.kur) })) })`},
 {goto: 'index.html?terrain=noworker'},
 {js: `({ kip: DK.terrain.mode, ready: Math.round(window.__readyAni) })`},
]
