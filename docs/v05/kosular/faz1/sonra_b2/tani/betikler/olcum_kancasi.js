// B2 tanı başlatma betiği (--baslatma; senaryoya ve oyuna dokunmaz): DK kurulunca hızlı yolculuk hazırlığı (yarıçap 450) süresince
// dilim, çizim, güncelleyici ve rAF aralıklarını kaydeder; hazırlık bitince özeti console.warn ile yazar (rapor 'uyarilar').
(() => {
  const bekle = () => {
    const DK = window.DK;
    if (!DK || !DK.terrain || !DK.post || !DK.engine) { setTimeout(bekle, 200); return; }
    const T = DK.terrain, P = DK.post, E = DK.engine;
    let Z = null;
    const kay = (tur, ms) => { if (Z) { Z.ol.push([Math.round(performance.now() - Z.t0), tur, Math.round(ms)]); } };
    const ls = T._localSlice; T._localSlice = function () { const t0 = performance.now(); try { return ls.apply(this, arguments); } finally { kay('d', performance.now() - t0); } };
    const pr = P.render; P.render = function () { const t0 = performance.now(); try { return pr.apply(this, arguments); } finally { kay('c', performance.now() - t0); } };
    const us = [...E.updaters]; E.updaters.clear(); for (const u of us) E.updaters.add(function (dt) { const t0 = performance.now(); try { return u(dt); } finally { kay('g', performance.now() - t0); } });
    const pp = T.prepare; T.prepare = async function (x, z, op) {
      const izle = op && op.radius === 450;
      if (izle) { const st = T.stats(); Z = { t0: performance.now(), ol: [], butce: T.localBudget, is: st.jobs, kuyruk: st.queue }; }
      try { return await pp.apply(this, arguments); } finally {
        if (izle && Z) { const say = (k) => Z.ol.filter((x) => x[1] === k); const top = (k) => say(k).reduce((a, x) => a + x[2], 0);
          console.warn('B2TANI ' + JSON.stringify({ ms: Math.round(performance.now() - Z.t0), butce: Z.butce, isOnce: Z.is, kuyrukOnce: Z.kuyruk, dilim: [say('d').length, top('d')], cizim: [say('c').length, top('c'), Math.max(0, ...say('c').map((x) => x[2]))], guncelle: [say('g').length, top('g'), Math.max(0, ...say('g').map((x) => x[2]))], uzun: Z.ol.filter((x) => x[2] > 150).slice(0, 12) }));
          Z = null; }
      }
    };
  };
  if (/[?&]test=1/.test(location.search)) bekle();
})();
