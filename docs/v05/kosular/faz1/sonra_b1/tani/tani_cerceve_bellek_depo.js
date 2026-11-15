// B1 tanı (A-16'nın kendi yarısı; A-18 B2'de): sandbox'lı iframe'de (köken 'null') localStorage erişimi SecurityError verdiği için
// oyun A-18 düzeltmesi olmadan açılmıyor (B0 bulgusu). Bu tanı betiği YALNIZ alt çerçevede ve YALNIZ localStorage erişilemezken
// bellek içi bir depo tanımlar; böylece açılış arazi işçisi kurulumuna kadar ilerler ve TC03/TC04 A-16'yı (data: adresli işçi)
// ölçebilir. Oyun koduna ve senaryoya dokunmaz; sonuç A-18'den bağımsız A-16 kanıtıdır, sonra kapısı ölçümü değildir.
(() => {
  if (window.top === window) return;
  try { void window.localStorage.length; return; } catch (e) { /* erişilemiyor: bellek içi depo */ }
  const m = new Map();
  const depo = {
    getItem: (k) => (m.has(String(k)) ? m.get(String(k)) : null), setItem: (k, v) => { m.set(String(k), String(v)); },
    removeItem: (k) => { m.delete(String(k)); }, clear: () => m.clear(), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; },
  };
  try { Object.defineProperty(window, 'localStorage', { configurable: true, get: () => depo }); window.__tani_bellekDepo = true; } catch (e) { window.__tani_bellekDepo = 'kurulamadı: ' + e; }
})();
