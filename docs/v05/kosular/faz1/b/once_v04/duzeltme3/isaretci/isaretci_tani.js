// B0 düzeltici (2. deneme) — işaretçi kilidi TANI betiği (koşucuya --baslatma ile verilir; senaryoya ve koşucuya dokunulmaz).
// Ortam bulgusu (ana oturum, 14 Kasım, scratchpad/k17/olcum): oyun oturum başında işaretçiyi kilitler (js/game/game.js:149
// input.lockPointer()); başsız Chromium kilit açıkken saniyede on binlerce sentetik fare hareketi üretir. Bu betik:
//   --degisken isaretci=birak : kilit her alındığında hemen document.exitPointerLock() çağrılır; oyunun kilit kaybında
//                                duraklatması DK.G.noAutoPause ile kapatılır (senaryolar zaten açar) → "kilit bırakılmış" koşu
//   --degisken isaretci=say   : yalnız sayar (davranış aynı) → "kilitli" koşunun sayaçları
// Her iki kipte sayfaya ulaşan mousemove olayları, kilit alma/bırakma sayıları 10 sn'de bir '[test] isaretci …' satırıyla yazılır.
(() => {
  const K = (window.__KOSUCU && window.__KOSUCU.isaretci) || 'say';
  const S = window.__isaretciTani = { kip: K, kilit: 0, birakma: 0, mm: 0, mmKilitli: 0, kilitliMs: 0, son: null, ornek: [] };
  let kilitAni = null, mm0 = 0, t0 = performance.now();
  document.addEventListener('mousemove', () => { S.mm++; if (document.pointerLockElement) S.mmKilitli++; }, { capture: true, passive: true });
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement) {
      S.kilit++; kilitAni = performance.now();
      if (K === 'birak') {
        try { if (window.DK && window.DK.G) window.DK.G.noAutoPause = true; } catch (e) { /* yoksay */ }
        try { document.exitPointerLock(); S.birakma++; } catch (e) { S.hata = String(e && e.message || e); }
      }
    } else if (kilitAni !== null) { S.kilitliMs += performance.now() - kilitAni; kilitAni = null; }
  }, true);
  setInterval(() => {
    const n = performance.now(); const kilitli = !!document.pointerLockElement;
    const hiz = Math.round((S.mm - mm0) / ((n - t0) / 1000)); mm0 = S.mm; t0 = n;
    if (S.ornek.length < 200) S.ornek.push([Math.round(n / 1000), hiz, kilitli ? 1 : 0]);
    console.log('[test] isaretci ' + JSON.stringify({ kip: K, t: Math.round(n / 1000), kilitli, kilit: S.kilit, birakma: S.birakma, mm: S.mm, mmKilitli: S.mmKilitli, mmSn: hiz, kilitliSn: Math.round((S.kilitliMs + (kilitAni !== null ? n - kilitAni : 0)) / 1000) }));
  }, 10000);
})();
