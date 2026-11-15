// B1 tanı başlatma betiği (02_arazi_yasam ile --baslatma): terrain._localSlice'ı ince bir ölçücüyle sarar (davranış aynı). Her
// dilimden önce/sonra performance.memory.usedJSHeapSize okunur (koşucu --enable-precise-memory-info ile açar); dilim içinde yığın
// 256 KB'tan fazla küçüldüyse dilim sırasında çöp toplama olmuştur. Bütçeyi 3 ms'den çok aşan her dilim console.warn ile yazılır
// (rapordaki uyarilar alanı; uyarı koşuyu düşürmez). Senaryonun kendi LY13 sarmalayıcısı bu ölçücünün üstüne kurulur.
(() => {
  const kur = () => {
    const T = window.DK && window.DK.terrain;
    if (!T || typeof T._localSlice !== 'function' || T.__taniGc) return false;
    T.__taniGc = true;
    const o = T._localSlice;
    const mem = () => (performance.memory ? performance.memory.usedJSHeapSize : 0);
    let sira = 0, gcDilim = 0, asan = 0, gcAsan = 0;
    T._localSlice = function () {
      const b = typeof this.dilimButcesi === 'function' ? this.dilimButcesi() : (this._queue.length > 30 ? Math.max(this.localBudget, 20) : this.localBudget);
      const h0 = mem(); const s = performance.now();
      try { return o.apply(this, arguments); }
      finally {
        const d = performance.now() - s; const h1 = mem(); sira++;
        const dusus = h0 - h1; const gc = dusus > 256 * 1024;
        if (gc) gcDilim++;
        if (d > b + 3) { asan++; if (gc) gcAsan++; console.warn(`TANI-DILIM sira=${sira} sure=${d.toFixed(1)} butce=${b} yiginDususKB=${Math.round(dusus / 1024)} gc=${gc} toplamAsan=${asan} gcAsan=${gcAsan} gcDilim=${gcDilim}`); }
      }
    };
    return true;
  };
  const iv = setInterval(() => { try { if (kur()) clearInterval(iv); } catch (e) { /* yoksay */ } }, 200);
})();
