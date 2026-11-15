// B2 tanı başlatma betiği 2 (--baslatma; senaryoya ve oyuna dokunmaz): yarıçap 450'li hazırlık süresince dilim/çizim/güncelleme,
// uzun görevler (PerformanceObserver longtask), 50 ms'lik zamanlayıcının gerçek aralıkları, rAF aralıkları ve sayfa görünürlüğü.
(() => {
  const uzunlar = [];
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) uzunlar.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); } catch (e) { /* yok */ }
  const bekle = () => {
    const DK = window.DK;
    if (!DK || !DK.terrain || !DK.post || !DK.engine) { setTimeout(bekle, 200); return; }
    const T = DK.terrain, P = DK.post, E = DK.engine;
    let Z = null;
    const kay = (tur, ms) => { if (Z) Z.ol.push([Math.round(performance.now() - Z.t0), tur, Math.round(ms)]); };
    const ls = T._localSlice; T._localSlice = function () { const t0 = performance.now(); try { return ls.apply(this, arguments); } finally { kay('d', performance.now() - t0); } };
    const pr = P.render; P.render = function () { const t0 = performance.now(); try { return pr.apply(this, arguments); } finally { kay('c', performance.now() - t0); } };
    const pp = T.prepare; T.prepare = async function (x, z, op) {
      const izle = op && op.radius === 450;
      let iv = null, raf = 0;
      if (izle) { const st = T.stats(); Z = { t0: performance.now(), ol: [], butce: T.localBudget, fps: E.fpsLimit, is: st.jobs, gorunur: document.visibilityState, odak: document.hasFocus() };
        let son = performance.now(); iv = setInterval(() => { const n = performance.now(); if (n - son > 150) kay('zamanlayici-gecikme', n - son); son = n; }, 50);
        let rs = performance.now(); const f = (t) => { if (!Z) return; if (t - rs > 150) kay('raf-aralik', t - rs); rs = t; raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); }
      const u0 = uzunlar.length;
      try { return await pp.apply(this, arguments); } finally {
        if (iv) clearInterval(iv); if (raf) cancelAnimationFrame(raf);
        if (izle && Z) { const t0abs = Z.t0; const say = (k) => Z.ol.filter((x) => x[1] === k); const top = (k) => say(k).reduce((a, x) => a + x[2], 0);
          console.warn('B2TANI2 ' + JSON.stringify({ ms: Math.round(performance.now() - Z.t0), butce: Z.butce, fps: Z.fps, isOnce: Z.is, gorunur: Z.gorunur, odak: Z.odak, gorunurSon: document.visibilityState, dilim: [say('d').length, top('d')], cizim: [say('c').length, top('c')],
            uzunGorev: uzunlar.slice(u0).map((u) => [Math.round(u[0] - t0abs), u[1]]).slice(0, 20), olaylar: Z.ol.filter((x) => x[1] !== 'd' && x[1] !== 'c' || x[2] > 100).slice(0, 30) }));
          Z = null; }
      }
    };
  };
  if (/[?&]test=1/.test(location.search)) bekle();
})();
